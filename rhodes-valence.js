/**
 * Rhodes Valence Tracker v3 — Full Attention Classification + Gaze + Expression + Recording
 *
 * Runs face-api.js at max framerate with THREE models:
 *   - TinyFaceDetector (face bounding box)
 *   - FaceLandmark68 (68 facial landmarks → EAR, MAR, head pose, gaze)
 *   - FaceExpression (7 expression channels → valence)
 *
 * Attention states:
 *   ON_SCREEN  — face frontal, eyes open, looking at screen
 *   OFF_SCREEN — face detected but head turned away or eyes looking elsewhere
 *   DROWSY     — PERCLOS > 0.30 (eyes closing frequently)
 *   YAWNING    — MAR > 0.78 sustained
 *   AWAY       — no face detected for 1+ seconds
 *
 * Gaze estimation:
 *   Uses iris position within eye bounds + head pose to estimate
 *   which area of the screen the user is looking at (3x3 grid).
 *
 * Expression events:
 *   Fires valence_event when any expression channel spikes/drops > 0.15
 *   between frames. Tags each event with attention state + gaze area.
 *   Events where attention != ON_SCREEN are marked as "external_trigger".
 */

(function() {
    'use strict';

    // ── Config ──
    const SUMMARY_INTERVAL_MS = 3000;
    const EVENT_DELTA_THRESHOLD = 0.15;
    const EVENT_COOLDOWN_MS = 200;
    const MIN_CONFIDENCE = 0.5;
    const VALENCE_POSITIVE_THRESHOLD = 0.25;
    const VALENCE_NEGATIVE_THRESHOLD = -0.15;
    const MODEL_URI = '/models';
    const RECORDING_CHUNK_MS = 10000;
    const RECORDING_UPLOAD_URL = 'https://rhodesagi.com/valence/upload-recording';

    // Attention thresholds
    const EAR_BLINK_THRESHOLD = 0.21;     // Below this = eye closed
    const EAR_DROWSY_THRESHOLD = 0.24;    // Below this sustained = drowsy
    const MAR_YAWN_THRESHOLD = 0.78;      // Above this = yawning (raised from 0.55 — talking triggered false positives)
    const MAR_YAWN_FRAMES = 20;           // Sustained frames for yawn (raised from 8 — need clear sustained gape)
    const PERCLOS_WINDOW_FRAMES = 90;     // ~3 seconds at 30fps
    const PERCLOS_DROWSY_THRESHOLD = 0.30;// >30% eyes closed = drowsy
    const HEAD_YAW_THRESHOLD = 25;        // Degrees — beyond this = looking away
    const HEAD_PITCH_THRESHOLD = 20;      // Degrees — beyond this = looking away
    const AWAY_TIMEOUT_MS = 1000;         // No face for 1s = AWAY

    // ── State ──
    let _api = null;
    let _video = null;
    let _stream = null;
    let _modelsLoaded = false;
    let _active = false;
    let _lastRoundId = null;
    let _lastMessageId = null;
    let _modelVersion = null;
    let _previewEl = null;
    let _statusEl = null;
    let _fpsEl = null;
    let _attentionEl = null;
    let _enabled = true;
    let _currentlyPlayingText = '';

    // Detection state
    let _prevExpressions = null;
    let _lastEventTime = {};
    let _frameCount = 0;
    let _lastFpsUpdate = 0;
    let _detectionFps = 0;
    let _rafId = null;
    let _lastSummaryTime = 0;
    let _summaryBuffer = [];
    let _isDetecting = false;

    // Attention state
    let _currentAttention = 'AWAY';
    let _lastFaceTime = 0;
    let _earHistory = [];          // Rolling window for PERCLOS
    let _marYawnCount = 0;         // Consecutive frames with high MAR
    let _gazeArea = 'center';      // 3x3 grid: tl, tc, tr, ml, center, mr, bl, bc, br

    // Event log state
    let _logEl = null;
    let _logVisible = false;
    let _logEntries = [];
    const MAX_LOG_ENTRIES = 50;

    // Recording state
    let _mediaRecorder = null;
    let _recordedChunks = [];
    let _recordingStartMs = 0;
    let _sessionRecordingId = null;

    // ── Landmark Indices (68-point model) ──
    // Left eye: 36-41, Right eye: 42-47
    // Mouth outer: 48-59, Mouth inner: 60-67
    // Nose: 27-35, Jaw: 0-16
    const L_EYE = [36, 37, 38, 39, 40, 41];
    const R_EYE = [42, 43, 44, 45, 46, 47];
    const MOUTH_OUTER_TOP = [51, 52, 53];
    const MOUTH_OUTER_BOT = [57, 58, 59];
    const MOUTH_LEFT = 48;
    const MOUTH_RIGHT = 54;
    const NOSE_TIP = 30;
    const NOSE_BRIDGE = 27;
    const CHIN = 8;
    const LEFT_EYE_OUTER = 36;
    const RIGHT_EYE_OUTER = 45;

    // ── Geometry Helpers ──

    function dist(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function midpoint(a, b) {
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }

    // Eye Aspect Ratio
    function computeEAR(landmarks, eyeIndices) {
        const p = eyeIndices.map(i => landmarks[i]);
        // EAR = (||p1-p5|| + ||p2-p4||) / (2 * ||p0-p3||)
        const vertical1 = dist(p[1], p[5]);
        const vertical2 = dist(p[2], p[4]);
        const horizontal = dist(p[0], p[3]);
        if (horizontal < 0.001) return 0;
        return (vertical1 + vertical2) / (2 * horizontal);
    }

    // Mouth Aspect Ratio
    function computeMAR(landmarks) {
        const top = MOUTH_OUTER_TOP.map(i => landmarks[i]);
        const bot = MOUTH_OUTER_BOT.map(i => landmarks[i]);
        const left = landmarks[MOUTH_LEFT];
        const right = landmarks[MOUTH_RIGHT];

        const verticals = top.map((t, i) => dist(t, bot[i]));
        const avgVertical = verticals.reduce((a, b) => a + b, 0) / verticals.length;
        const horizontal = dist(left, right);
        if (horizontal < 0.001) return 0;
        return avgVertical / horizontal;
    }

    // Head pose estimation (yaw and pitch from nose position relative to face bounds)
    function estimateHeadPose(landmarks) {
        const noseTip = landmarks[NOSE_TIP];
        const leftEye = landmarks[LEFT_EYE_OUTER];
        const rightEye = landmarks[RIGHT_EYE_OUTER];
        const chin = landmarks[CHIN];
        const noseBridge = landmarks[NOSE_BRIDGE];

        // Yaw: nose tip horizontal position relative to eye midpoint
        const eyeCenter = midpoint(leftEye, rightEye);
        const faceWidth = dist(leftEye, rightEye);
        if (faceWidth < 0.001) return { yaw: 0, pitch: 0 };

        const yawOffset = (noseTip.x - eyeCenter.x) / faceWidth;
        const yaw = yawOffset * 90; // Approximate degrees

        // Pitch: nose tip vertical position relative to nose bridge and chin
        const faceHeight = dist(noseBridge, chin);
        if (faceHeight < 0.001) return { yaw, pitch: 0 };

        const expectedNoseY = noseBridge.y + (faceHeight * 0.4);
        const pitchOffset = (noseTip.y - expectedNoseY) / faceHeight;
        const pitch = pitchOffset * 90;

        return { yaw, pitch };
    }

    // Gaze direction estimation from iris position within eye bounds
    function estimateGaze(landmarks) {
        // Iris center approximation: midpoint of upper and lower eye landmarks
        const leftIris = midpoint(
            midpoint(landmarks[L_EYE[1]], landmarks[L_EYE[2]]),
            midpoint(landmarks[L_EYE[4]], landmarks[L_EYE[5]])
        );
        const rightIris = midpoint(
            midpoint(landmarks[R_EYE[1]], landmarks[R_EYE[2]]),
            midpoint(landmarks[R_EYE[4]], landmarks[R_EYE[5]])
        );

        // Horizontal gaze ratio: iris position relative to eye corners
        const leftEyeWidth = dist(landmarks[L_EYE[0]], landmarks[L_EYE[3]]);
        const rightEyeWidth = dist(landmarks[R_EYE[0]], landmarks[R_EYE[3]]);

        let hRatio = 0.5; // center
        if (leftEyeWidth > 0.001 && rightEyeWidth > 0.001) {
            const leftRatio = (leftIris.x - landmarks[L_EYE[0]].x) / leftEyeWidth;
            const rightRatio = (rightIris.x - landmarks[R_EYE[0]].x) / rightEyeWidth;
            hRatio = (leftRatio + rightRatio) / 2;
        }

        // Vertical gaze ratio: iris position relative to eye height
        const leftEyeHeight = dist(landmarks[L_EYE[1]], landmarks[L_EYE[5]]);
        const rightEyeHeight = dist(landmarks[R_EYE[1]], landmarks[R_EYE[5]]);

        let vRatio = 0.5;
        if (leftEyeHeight > 0.001 && rightEyeHeight > 0.001) {
            const leftVRatio = (leftIris.y - landmarks[L_EYE[1]].y) / leftEyeHeight;
            const rightVRatio = (rightIris.y - landmarks[R_EYE[1]].y) / rightEyeHeight;
            vRatio = (leftVRatio + rightVRatio) / 2;
        }

        // Map to 3x3 grid
        let col = hRatio < 0.35 ? 'l' : hRatio > 0.65 ? 'r' : 'c';
        let row = vRatio < 0.35 ? 't' : vRatio > 0.65 ? 'b' : 'm';

        const areaMap = {
            'tl': 'top-left', 'tc': 'top-center', 'tr': 'top-right',
            'ml': 'mid-left', 'mc': 'center', 'mr': 'mid-right',
            'bl': 'bottom-left', 'bc': 'bottom-center', 'br': 'bottom-right'
        };

        return {
            horizontal: hRatio,
            vertical: vRatio,
            area: areaMap[row + col] || 'center'
        };
    }

    // ── Attention Classification ──

    function classifyAttention(landmarks, hasFace) {
        const now = Date.now();

        if (!hasFace) {
            if (now - _lastFaceTime > AWAY_TIMEOUT_MS) {
                return 'AWAY';
            }
            return _currentAttention; // Grace period
        }

        _lastFaceTime = now;

        // Compute metrics
        const leftEAR = computeEAR(landmarks, L_EYE);
        const rightEAR = computeEAR(landmarks, R_EYE);
        const avgEAR = (leftEAR + rightEAR) / 2;
        const mar = computeMAR(landmarks);
        const { yaw, pitch } = estimateHeadPose(landmarks);

        // Update EAR history for PERCLOS
        _earHistory.push(avgEAR < EAR_BLINK_THRESHOLD ? 1 : 0);
        if (_earHistory.length > PERCLOS_WINDOW_FRAMES) {
            _earHistory.shift();
        }
        const perclos = _earHistory.length > 0
            ? _earHistory.reduce((a, b) => a + b, 0) / _earHistory.length
            : 0;

        // Yawning detection
        if (mar > MAR_YAWN_THRESHOLD) {
            _marYawnCount++;
        } else {
            _marYawnCount = 0;
        }

        // Gaze
        const gaze = estimateGaze(landmarks);
        _gazeArea = gaze.area;

        // Classification priority: DROWSY > YAWNING > OFF_SCREEN > ON_SCREEN
        if (perclos > PERCLOS_DROWSY_THRESHOLD) {
            return 'DROWSY';
        }

        if (_marYawnCount >= MAR_YAWN_FRAMES) {
            return 'YAWNING';
        }

        if (Math.abs(yaw) > HEAD_YAW_THRESHOLD || Math.abs(pitch) > HEAD_PITCH_THRESHOLD) {
            return 'OFF_SCREEN';
        }

        return 'ON_SCREEN';
    }

    // ── Valence Computation ──

    function computeValence(expressions) {
        const h = expressions.happy || 0;
        const su = expressions.surprised || 0;
        const sa = expressions.sad || 0;
        const an = expressions.angry || 0;
        const fe = expressions.fearful || 0;
        const di = expressions.disgusted || 0;
        const ne = expressions.neutral || 0;

        const score = (h * 1.0) + (su * 0.2) - (sa * 0.7) - (an * 0.9) - (fe * 0.4) - (di * 0.6);
        const confidence = 1.0 - (ne * 0.7);

        let valence = 'neutral';
        if (score > VALENCE_POSITIVE_THRESHOLD) valence = 'positive';
        else if (score < VALENCE_NEGATIVE_THRESHOLD) valence = 'negative';

        return { valence, score: Math.max(-1, Math.min(1, score)), confidence };
    }

    // ── Microexpression Event Detection ──

    function detectEvents(current) {
        if (!_prevExpressions) {
            _prevExpressions = { ...current };
            return [];
        }

        const events = [];
        const now = Date.now();
        const channels = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];

        for (const ch of channels) {
            const oldVal = _prevExpressions[ch] || 0;
            const newVal = current[ch] || 0;
            const delta = newVal - oldVal;

            if (Math.abs(delta) >= EVENT_DELTA_THRESHOLD) {
                const lastEvent = _lastEventTime[ch] || 0;
                if (now - lastEvent < EVENT_COOLDOWN_MS) continue;

                _lastEventTime[ch] = now;
                events.push({
                    event_type: delta > 0 ? 'spike' : 'drop',
                    expression: ch,
                    old_value: Math.round(oldVal * 1000) / 1000,
                    new_value: Math.round(newVal * 1000) / 1000,
                    delta: Math.round(delta * 1000) / 1000,
                    detected_at: now
                });
            }
        }

        _prevExpressions = { ...current };
        return events;
    }

    // ── Webcam ──

    async function startWebcam() {
        if (_stream) return true;
        try {
            _stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' },
                audio: false
            });
            _video = document.createElement('video');
            _video.srcObject = _stream;
            _video.setAttribute('playsinline', '');
            _video.muted = true;
            _video.width = 320;
            _video.height = 240;
            await _video.play();
            createPreview();
            return true;
        } catch (err) {
            console.warn('[VALENCE] Camera access denied:', err.message);
            return false;
        }
    }

    function stopWebcam() {
        if (_stream) {
            _stream.getTracks().forEach(t => t.stop());
            _stream = null;
        }
        if (_video) {
            _video.pause();
            _video.srcObject = null;
            _video = null;
        }
        if (_previewEl) {
            _previewEl.remove();
            _previewEl = null;
        }
    }

    // ── Preview UI ──

    function createPreview() {
        if (_previewEl) return;

        _previewEl = document.createElement('div');
        _previewEl.id = 'valence-preview';
        _previewEl.style.cssText = `
            position: fixed; bottom: 80px; right: 16px;
            width: 160px; height: 130px; border-radius: 12px;
            overflow: hidden; z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            border: 2px solid rgba(255,255,255,0.15);
            cursor: pointer; transition: opacity 0.3s;
        `;

        const videoClone = document.createElement('video');
        videoClone.srcObject = _stream;
        videoClone.setAttribute('playsinline', '');
        videoClone.muted = true;
        videoClone.style.cssText = 'width:100%;height:100%;object-fit:cover;transform:scaleX(-1);';
        videoClone.play();

        _statusEl = document.createElement('div');
        _statusEl.id = 'valence-status';
        _statusEl.style.cssText = `
            position:absolute;top:8px;right:8px;width:12px;height:12px;
            border-radius:50%;background:#888;border:2px solid rgba(255,255,255,0.5);
            transition:background 0.3s;
        `;

        _fpsEl = document.createElement('div');
        _fpsEl.style.cssText = 'position:absolute;top:4px;left:6px;font-size:9px;color:rgba(255,255,255,0.5);font-family:monospace;';
        _fpsEl.textContent = '0 fps';

        _attentionEl = document.createElement('div');
        _attentionEl.style.cssText = 'position:absolute;bottom:22px;left:6px;font-size:9px;color:rgba(255,255,255,0.7);font-family:monospace;text-shadow:0 1px 2px rgba(0,0,0,0.8);';
        _attentionEl.textContent = 'AWAY';

        const recDot = document.createElement('div');
        recDot.id = 'valence-rec-dot';
        recDot.style.cssText = 'position:absolute;bottom:6px;left:6px;width:8px;height:8px;border-radius:50%;background:#f44336;display:none;animation:valence-blink 1s infinite;';

        const style = document.createElement('style');
        style.textContent = '@keyframes valence-blink{0%,100%{opacity:1}50%{opacity:0.3}}';
        document.head.appendChild(style);

        const toggleBtn = document.createElement('div');
        toggleBtn.style.cssText = 'position:absolute;bottom:4px;right:4px;font-size:10px;color:rgba(255,255,255,0.6);padding:2px 6px;background:rgba(0,0,0,0.5);border-radius:4px;cursor:pointer;';
        toggleBtn.textContent = 'ON';
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            _enabled = !_enabled;
            toggleBtn.textContent = _enabled ? 'ON' : 'OFF';
            _previewEl.style.opacity = _enabled ? '1' : '0.4';
        });

        _previewEl.appendChild(videoClone);
        _previewEl.appendChild(_statusEl);
        _previewEl.appendChild(_fpsEl);
        _previewEl.appendChild(_attentionEl);
        _previewEl.appendChild(recDot);
        _previewEl.appendChild(toggleBtn);

        let minimized = false;
        _previewEl.addEventListener('click', () => {
            minimized = !minimized;
            if (minimized) {
                _previewEl.style.width = '48px'; _previewEl.style.height = '48px';
                videoClone.style.display = 'none'; toggleBtn.style.display = 'none';
                _fpsEl.style.display = 'none'; _attentionEl.style.display = 'none';
                _statusEl.style.width = '32px'; _statusEl.style.height = '32px';
                _statusEl.style.top = '6px'; _statusEl.style.right = '6px';
            } else {
                _previewEl.style.width = '160px'; _previewEl.style.height = '130px';
                videoClone.style.display = ''; toggleBtn.style.display = '';
                _fpsEl.style.display = ''; _attentionEl.style.display = '';
                _statusEl.style.width = '12px'; _statusEl.style.height = '12px';
                _statusEl.style.top = '8px'; _statusEl.style.right = '8px';
            }
        });

        const takeover = document.getElementById('handsfree-takeover');
        if (takeover) {
            _previewEl.style.zIndex = '10001';
            takeover.appendChild(_previewEl);
        } else {
            document.body.appendChild(_previewEl);
        }
    }

    function updateStatusDot(valence) {
        if (!_statusEl) return;
        const colors = { positive: '#4caf50', neutral: '#888', negative: '#f44336' };
        _statusEl.style.background = colors[valence] || '#888';
    }

    function updateAttentionDisplay(attention) {
        if (!_attentionEl) return;
        const colors = {
            'ON_SCREEN': '#4caf50', 'OFF_SCREEN': '#ff9800',
            'DROWSY': '#f44336', 'YAWNING': '#ff9800', 'AWAY': '#666'
        };
        _attentionEl.textContent = attention;
        _attentionEl.style.color = colors[attention] || '#888';
    }

    // ── Admin Event Log ──

    function createLogPanel() {
        if (_logEl) return;

        _logEl = document.createElement('div');
        _logEl.id = 'valence-event-log';
        _logEl.style.cssText = `
            position: fixed; bottom: 16px; left: 16px;
            width: 420px; max-height: 300px; overflow-y: auto;
            background: rgba(0, 0, 0, 0.85); color: #ccc;
            font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px;
            border-radius: 8px; padding: 8px 10px;
            z-index: 10002; border: 1px solid rgba(255,255,255,0.1);
            display: none;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'color:#fff;font-size:12px;font-weight:bold;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;';
        header.innerHTML = '<span>EXPRESSION EVENTS</span>';

        const closeBtn = document.createElement('span');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = 'cursor:pointer;opacity:0.5;font-size:14px;';
        closeBtn.onclick = () => { _logEl.style.display = 'none'; _logVisible = false; };
        header.appendChild(closeBtn);

        const logBody = document.createElement('div');
        logBody.id = 'valence-log-body';

        _logEl.appendChild(header);
        _logEl.appendChild(logBody);

        // Attach inside takeover if available, else body
        const takeover = document.getElementById('handsfree-takeover');
        if (takeover) {
            takeover.appendChild(_logEl);
        } else {
            document.body.appendChild(_logEl);
        }
    }

    function addLogEntry(event, allExpr) {
        if (!_logEl) createLogPanel();

        const now = new Date();
        const ts = now.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0');

        const colors = {
            happy: '#4caf50', sad: '#2196f3', angry: '#f44336',
            surprised: '#ff9800', fearful: '#9c27b0', disgusted: '#795548',
            neutral: '#888'
        };
        const color = colors[event.expression] || '#ccc';
        const arrow = event.event_type === 'spike' ? '▲' : '▼';
        const screenTag = event.on_screen
            ? '<span style="color:#4caf50">SCREEN</span>'
            : '<span style="color:#f44336">OFF</span>';

        const entry = {
            html: `<div style="margin:2px 0;line-height:1.4;border-bottom:1px solid rgba(255,255,255,0.05);padding:2px 0;">` +
                  `<span style="color:#666">${ts}</span> ` +
                  `<span style="color:${color};font-weight:bold">${arrow} ${event.expression}</span> ` +
                  `<span style="color:#999">${event.old_value}→${event.new_value}</span> ` +
                  `<span style="color:#666">Δ${event.delta > 0 ? '+' : ''}${event.delta}</span> ` +
                  `${screenTag} ` +
                  `<span style="color:#555">${event.attention}/${event.gaze_area}</span>` +
                  (event.audio_playing ? `<br><span style="color:#555;font-size:10px;margin-left:70px">♫ ${event.audio_playing.substring(0, 60)}${event.audio_playing.length > 60 ? '...' : ''}</span>` : '') +
                  `</div>`,
            timestamp: Date.now()
        };

        _logEntries.unshift(entry);
        if (_logEntries.length > MAX_LOG_ENTRIES) _logEntries.pop();

        const body = document.getElementById('valence-log-body');
        if (body) {
            body.innerHTML = _logEntries.map(e => e.html).join('');
        }
    }

    // ── Detection Loop ──

    async function loadModels() {
        if (_modelsLoaded) return true;
        try {
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URI);
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URI);
            await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URI);
            _modelsLoaded = true;
            console.log('[VALENCE] All 3 models loaded (detector + landmarks + expressions)');
            return true;
        } catch (err) {
            console.error('[VALENCE] Failed to load models:', err);
            return false;
        }
    }

    async function detectFrame() {
        if (!_active || !_enabled || !_video || !_modelsLoaded) {
            if (_active) _rafId = requestAnimationFrame(detectFrame);
            return;
        }

        if (_isDetecting) {
            _rafId = requestAnimationFrame(detectFrame);
            return;
        }

        _isDetecting = true;
        const frameStartMs = Date.now();

        try {
            const detection = await faceapi
                .detectSingleFace(_video, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 160,
                    scoreThreshold: MIN_CONFIDENCE
                }))
                .withFaceLandmarks()
                .withFaceExpressions();

            const hasFace = !!detection;

            if (hasFace) {
                const landmarks = detection.landmarks.positions;
                const expr = detection.expressions;
                const now = Date.now();

                // Attention classification
                _currentAttention = classifyAttention(landmarks, true);
                updateAttentionDisplay(_currentAttention);

                // Expression events (only significant if ON_SCREEN)
                const events = detectEvents(expr);
                for (const evt of events) {
                    evt.on_screen = (_currentAttention === 'ON_SCREEN');
                    evt.attention = _currentAttention;
                    evt.gaze_area = _gazeArea;
                    sendEvent(evt, expr);
                }

                // Buffer for summary
                _summaryBuffer.push({
                    expressions: expr,
                    attention: _currentAttention,
                    gaze_area: _gazeArea,
                    timestamp: now
                });

                // Periodic summary
                if (now - _lastSummaryTime >= SUMMARY_INTERVAL_MS) {
                    _lastSummaryTime = now;
                    sendSummary(expr);
                }

                const { valence } = computeValence(expr);
                updateStatusDot(valence);
            } else {
                _currentAttention = classifyAttention(null, false);
                updateAttentionDisplay(_currentAttention);
            }

            // FPS counter
            _frameCount++;
            if (frameStartMs - _lastFpsUpdate >= 1000) {
                _detectionFps = _frameCount;
                _frameCount = 0;
                _lastFpsUpdate = frameStartMs;
                if (_fpsEl) _fpsEl.textContent = _detectionFps + ' fps';
            }

        } catch (err) { /* transient */ }

        _isDetecting = false;
        if (_active) _rafId = requestAnimationFrame(detectFrame);
    }

    // ── Send Functions ──

    function sendEvent(event, allExpressions) {
        if (!_api) return;
        const ws = _api.getWs();
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        const sessionId = _api.getRhodesId();
        if (!sessionId) return;

        const msg = {
            msg_type: 'valence_event',
            msg_id: _api.generateUUID(),
            timestamp: new Date().toISOString(),
            payload: {
                session_id: sessionId,
                round_id: _lastRoundId,
                message_id: _lastMessageId,
                model_version: _modelVersion,
                event_type: event.event_type,
                expression: event.expression,
                old_value: event.old_value,
                new_value: event.new_value,
                delta: event.delta,
                detected_at: event.detected_at,
                audio_playing: _currentlyPlayingText || null,
                attention: event.attention,
                on_screen: event.on_screen,
                gaze_area: event.gaze_area,
                all_expressions: roundExpressions(allExpressions)
            }
        };

        try {
            ws.send(JSON.stringify(msg));
            const marker = event.on_screen ? '' : ' [EXTERNAL]';
            console.log(`[VALENCE-EVENT] ${event.event_type} ${event.expression}: ${event.old_value} → ${event.new_value} (Δ${event.delta}) ${event.attention}/${event.gaze_area}${marker}`);

            // Add to visual log
            addLogEntry({
                ...event,
                audio_playing: _currentlyPlayingText || null
            }, allExpressions);
        } catch (err) {}
    }

    function sendSummary(latestExpressions) {
        if (!_api) return;
        const ws = _api.getWs();
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        const sessionId = _api.getRhodesId();
        if (!sessionId) return;

        const { valence, score, confidence } = computeValence(latestExpressions);
        if (confidence < 0.2) return;

        // Compute attention breakdown for this window
        const attentionCounts = {};
        for (const s of _summaryBuffer) {
            attentionCounts[s.attention] = (attentionCounts[s.attention] || 0) + 1;
        }

        const reading = {
            msg_type: 'valence_reading',
            msg_id: _api.generateUUID(),
            timestamp: new Date().toISOString(),
            payload: {
                session_id: sessionId,
                round_id: _lastRoundId,
                message_id: _lastMessageId,
                model_version: _modelVersion,
                valence: valence,
                valence_score: Math.round(score * 1000) / 1000,
                confidence: Math.round(confidence * 1000) / 1000,
                detected_at: Date.now(),
                audio_playing: _currentlyPlayingText || null,
                detection_fps: _detectionFps,
                attention: _currentAttention,
                gaze_area: _gazeArea,
                attention_breakdown: attentionCounts,
                on_screen: _currentAttention === 'ON_SCREEN',
                expressions: roundExpressions(latestExpressions)
            }
        };

        try { ws.send(JSON.stringify(reading)); } catch (err) {}
        _summaryBuffer = [];
    }

    function roundExpressions(expr) {
        return {
            happy: Math.round((expr.happy || 0) * 1000) / 1000,
            sad: Math.round((expr.sad || 0) * 1000) / 1000,
            angry: Math.round((expr.angry || 0) * 1000) / 1000,
            surprised: Math.round((expr.surprised || 0) * 1000) / 1000,
            fearful: Math.round((expr.fearful || 0) * 1000) / 1000,
            disgusted: Math.round((expr.disgusted || 0) * 1000) / 1000,
            neutral: Math.round((expr.neutral || 0) * 1000) / 1000
        };
    }

    // ── Video Recording ──

    function startRecording() {
        if (!_stream || _mediaRecorder) return;
        try {
            const options = { mimeType: 'video/webm;codecs=vp8' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm';
            }
            _mediaRecorder = new MediaRecorder(_stream, options);
            _recordedChunks = [];
            _recordingStartMs = Date.now();
            _sessionRecordingId = _api ? _api.generateUUID() : Date.now().toString();

            _mediaRecorder.ondataavailable = function(event) {
                if (event.data.size > 0) _recordedChunks.push(event.data);
            };
            _mediaRecorder.onstop = function() { uploadRecording(); };
            _mediaRecorder.start(RECORDING_CHUNK_MS);

            const recDot = document.getElementById('valence-rec-dot');
            if (recDot) recDot.style.display = 'block';
            console.log('[VALENCE] Recording started');
        } catch (err) {
            console.warn('[VALENCE] Recording failed:', err.message);
        }
    }

    function stopRecording() {
        if (_mediaRecorder && _mediaRecorder.state !== 'inactive') {
            _mediaRecorder.stop();
        }
        const recDot = document.getElementById('valence-rec-dot');
        if (recDot) recDot.style.display = 'none';
    }

    async function uploadRecording() {
        if (_recordedChunks.length === 0) return;
        const blob = new Blob(_recordedChunks, { type: 'video/webm' });
        _recordedChunks = [];
        if (blob.size < 1000) return;

        const sessionId = _api ? _api.getRhodesId() : 'unknown';
        const formData = new FormData();
        formData.append('video', blob, `valence-${_sessionRecordingId}.webm`);
        formData.append('session_id', sessionId);
        formData.append('recording_id', _sessionRecordingId);
        formData.append('started_at_ms', _recordingStartMs.toString());
        formData.append('ended_at_ms', Date.now().toString());
        formData.append('model_version', _modelVersion || '');
        formData.append('duration_ms', (Date.now() - _recordingStartMs).toString());

        try {
            const resp = await fetch(RECORDING_UPLOAD_URL, { method: 'POST', body: formData });
            if (resp.ok) {
                console.log(`[VALENCE] Recording uploaded (${(blob.size / 1024).toFixed(0)} KB)`);
            }
        } catch (err) {
            console.warn('[VALENCE] Upload error:', err.message);
        }
    }

    // ── Start / Stop ──

    async function start() {
        if (_active) return;
        const modelsOk = await loadModels();
        if (!modelsOk) return;
        const camOk = await startWebcam();
        if (!camOk) return;

        _active = true;
        _prevExpressions = null;
        _summaryBuffer = [];
        _earHistory = [];
        _marYawnCount = 0;
        _lastSummaryTime = Date.now();
        _frameCount = 0;
        _lastFpsUpdate = Date.now();
        _lastFaceTime = Date.now();

        _rafId = requestAnimationFrame(detectFrame);
        startRecording();
        console.log('[VALENCE] Started v3 — attention + gaze + expression + recording');
    }

    function stop() {
        _active = false;
        if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
        if (_summaryBuffer.length > 0 && _prevExpressions) {
            sendSummary(_prevExpressions);
        }
        stopRecording();
        stopWebcam();
        _prevExpressions = null;
        _summaryBuffer = [];
        _earHistory = [];
        _isDetecting = false;
    }

    // ── Public API ──

    window.installRhodesValence = function(api) {
        _api = api;
        console.log('[VALENCE] Installed v3 (attention + gaze + expression + recording)');
        setTimeout(() => {
            if (typeof faceapi !== 'undefined') {
                loadModels().then(ok => {
                    if (ok) console.log('[VALENCE] All models pre-loaded');
                });
            }
        }, 5000);
    };

    window.updateValenceContext = function(roundId, messageId, modelVersion) {
        _lastRoundId = roundId || _lastRoundId;
        _lastMessageId = messageId || _lastMessageId;
        _modelVersion = modelVersion || _modelVersion;
    };

    window.updateValencePlayingText = function(text) {
        _currentlyPlayingText = text || '';
    };

    window.rhodesValence = {
        start: start,
        stop: stop,
        isActive: () => _active,
        toggle: () => _active ? stop() : start(),
        getFps: () => _detectionFps,
        getAttention: () => _currentAttention,
        getGazeArea: () => _gazeArea,
        showLog: function() {
            if (!_logEl) createLogPanel();
            _logEl.style.display = 'block';
            _logVisible = true;
        },
        hideLog: function() {
            if (_logEl) _logEl.style.display = 'none';
            _logVisible = false;
        },
        onHandsfreeStart: function() {
            console.log('[VALENCE] Hands-free activated');
            start();
            // Auto-show event log for admin
            if (window.RHODES_CONFIG && window.RHODES_CONFIG.isAdmin) { setTimeout(() => { this.showLog(); }, 2000); }
        },
        onHandsfreeStop: function() {
            console.log('[VALENCE] Hands-free deactivated');
            stop();
        }
    };

})();
