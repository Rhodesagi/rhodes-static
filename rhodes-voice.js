// Extracted from rhodes.js: voice capture + TTS state machine

window.installRhodesVoiceHelpers = function installRhodesVoiceHelpers(deps) {
    if (!deps || window.__rhodesVoiceHelpersInstalled) return;
    window.__rhodesVoiceHelpersInstalled = true;

    const getWs = deps.getWs;
    let addMsg = typeof deps.getAddMsg === 'function' ? deps.getAddMsg() : deps.addMsg;
    const setAddMsg = deps.setAddMsg;
    const maskPasswords = deps.maskPasswords;
    const markGuestActivity = deps.markGuestActivity;
    const generateUUID = deps.generateUUID;
    const setActiveReqId = deps.setActiveReqId;
    const showLoading = deps.showLoading;
    const showToast = deps.showToast;

    if (typeof addMsg !== 'function') addMsg = function() {};

const VoiceChat = {
            recognition: null,
            isRecording: false,
            voiceEnabled: false,  // Default OFF - user must enable
            ttsPlaying: false,  // Track if TTS is currently playing
            ttsEndpoint: 'https://rhodesagi.com/tts',
            lastSubmittedText: '',  // Prevent double submission
            pushToTalk: true,  // true = push-to-talk (default), false = hands-free

            // Update takeover status indicator
            setStatus: function(state) {
                const status = document.getElementById('takeover-status');
                if (!status) return;
                status.classList.remove('hidden', 'listening', 'processing', 'speaking', 'waiting');
                // Clear any existing processing timer
                if (this._processingTimer) {
                    clearInterval(this._processingTimer);
                    this._processingTimer = null;
                }
                switch(state) {
                    case 'listening':
                        status.textContent = 'LISTENING';
                        status.classList.add('listening');
                        break;
                    case 'processing':
                        status.classList.add('processing');
                        this._processingStart = Date.now();
                        const updateTimer = () => {
                            const elapsed = ((Date.now() - this._processingStart) / 1000).toFixed(1);
                            status.textContent = 'PROCESSING ' + elapsed + 's';
                        };
                        updateTimer();
                        this._processingTimer = setInterval(updateTimer, 100);
                        break;
                    case 'speaking':
                        status.textContent = 'SPEAKING';
                        status.classList.add('speaking');
                        break;
                    case 'waiting':
                        status.textContent = 'WAITING...';
                        status.classList.add('waiting');
                        break;
                    case 'hidden':
                        status.classList.add('hidden');
                        break;
                }
            },
            audioUnlocked: false,  // Track if audio has been unlocked

            // Unlock audio playback on first user interaction (required by browsers)
            // Must play silent audio during user gesture to warm the element
            unlockAudio: function() {
                if (this.audioUnlocked) return;
                this.audioUnlocked = true;
                // Actually unlock the <audio> element by playing silence during user gesture
                const audio = document.getElementById('tts-audio');
                if (audio) {
                    // Create a tiny silent WAV (44 bytes header + 0 samples)
                    const silence = new Blob([new Uint8Array([
                        0x52,0x49,0x46,0x46,0x24,0x00,0x00,0x00,0x57,0x41,0x56,0x45,
                        0x66,0x6D,0x74,0x20,0x10,0x00,0x00,0x00,0x01,0x00,0x01,0x00,
                        0x44,0xAC,0x00,0x00,0x88,0x58,0x01,0x00,0x02,0x00,0x10,0x00,
                        0x64,0x61,0x74,0x61,0x00,0x00,0x00,0x00
                    ])], { type: 'audio/wav' });
                    const url = URL.createObjectURL(silence);
                    audio.src = url;
                    audio.play().then(() => {
                        console.log('Audio element unlocked via silent play');
                        URL.revokeObjectURL(url);
                    }).catch(e => {
                        console.warn('Audio unlock failed:', e);
                        URL.revokeObjectURL(url);
                    });
                }
                // Also create/resume AudioContext (for Web Audio API fallback)
                try {
                    if (!window._rhodesAudioCtx) {
                        window._rhodesAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    }
                    if (window._rhodesAudioCtx.state === 'suspended') {
                        window._rhodesAudioCtx.resume();
                    }
                } catch(e) {}
                console.log('Audio playback unlocked');
                try { if (window.StreamingTTS) window.StreamingTTS._tryPlay(); } catch(e) {}
            },

            init: function() {
                // Check for Web Speech API support
                if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                    console.log('Speech recognition not supported - using Whisper only');
                }

                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (SpeechRecognition) {
                    this.recognition = new SpeechRecognition();
                    this.recognition.continuous = true;
                    this.recognition.interimResults = true;
                    this.recognition.lang = document.getElementById('lang-select').value;
                    this.recognition.maxAlternatives = 1;
                    document.getElementById('lang-select').onchange = () => {
                        this.recognition.lang = document.getElementById('lang-select').value;
                    };
                }

                // Audio toggle button
                const audioToggleBtn = document.getElementById('audio-toggle-btn');
                if (audioToggleBtn) {
                    audioToggleBtn.onclick = () => {
                        this.voiceEnabled = !this.voiceEnabled;
                        audioToggleBtn.innerHTML = this.voiceEnabled ? '🔊 AUDIO' : '🔇 MUTED';
                        audioToggleBtn.classList.toggle('active', this.voiceEnabled);
                        console.log('Audio responses:', this.voiceEnabled ? 'enabled' : 'disabled');
                    };
                }

                this.submitTimeout = null;  // Debounce timer for hands-free mode
                this.speakingAnimationInterval = null;  // For mouth animation
                this.ttsSafetyTimeout = null;  // Safety timeout to stop animation if onended doesn't fire
                this.mouthStates = ['════════', '▓▓▓▓▓▓▓▓', '████████', '▓▓▓▓▓▓▓▓', '════════', ' *** ** ', '  ****  ', ' ** *** '];
                this.mouthIndex = 0;
                this.faceDebuted = false;  // Track if face has appeared for first time

                // ASCII face template (mouth will be replaced)
                this.faceTemplate = `                                    ⣀⣀⣀⣀⣀⣀⣀
                              ⣀⣴⣾⣿⣿⣿⣿⣿⣿⣿⣷⣦⣀
                          ⣀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣀
                       ⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄
                     ⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦
                   ⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧
                  ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
                 ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⡛⠉⠉⠉⠉⠉⠉⠉⠉⠉⡛⣻⣿⣿⣿⣿⣿⣿⣿⣿⣿
                ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏    ⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀    ⠹⣿⣿⣿⣿⣿⣿⣿⣿⣿
                ⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟   ⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄   ⢻⣿⣿⣿⣿⣿⣿⣿⣿
               ⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟   ⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧   ⢻⣿⣿⣿⣿⣿⣿⣿⣿
               ⣿⣿⣿⣿⣿⣿⣿⣿⣿⠁  ⢀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡀  ⠘⣿⣿⣿⣿⣿⣿⣿⣿
               ⣿⣿⣿⣿⣿⣿⣿⣿⡇   ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿   ⢸⣿⣿⣿⣿⣿⣿⣿
               ⣿⣿⣿⣿⣿⣿⣿⣿⡇  ⣰⣿⡟⠁ ⠈⠙⣿⣿⣿⣿⣿⣿⠋⠁ ⠈⢻⣿⡆  ⢸⣿⣿⣿⣿⣿⣿⣿
               ⣿⣿⣿⣿⣿⣿⣿⣿⡇  ⢸⣿⡇ ⬤  ⢸⣿⣿⣿⣿⡇  ⬤ ⢸⣿⡇  ⢸⣿⣿⣿⣿⣿⣿⣿
               ⣿⣿⣿⣿⣿⣿⣿⣿⡇  ⠘⣿⣷⣄ ⣀⣴⣿⣿⣿⣿⣿⣿⣦⣀ ⣠⣾⣿⠃  ⢸⣿⣿⣿⣿⣿⣿⣿
               ⣿⣿⣿⣿⣿⣿⣿⣿⣧   ⠙⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠋   ⣼⣿⣿⣿⣿⣿⣿⣿
               ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣄    ⠈⠉⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠉⠁    ⣠⣿⣿⣿⣿⣿⣿⣿⣿
                ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣆      ⢻⣿⣿⡿⡟⢻⣿⡟      ⣰⣿⣿⣿⣿⣿⣿⣿⣿
                ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣆       ⠉⠁  ⠈⠉       ⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿
                 ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣄     {{MOUTH}}     ⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿

                 ╦═╗  ╦ ╦  ╔═╗  ╔╦╗  ╔═╗  ╔═╗     ╔═╗  ╔═╗  ╦
                 ╠╦╝  ╠═╣  ║ ║   ║║  ║╣   ╚═╗     ╠═╣  ║ ╦  ║
                 ╩╚═  ╩ ╩  ╚═╝  ═╩╝  ╚═╝  ╚═╝     ╩ ╩  ╚═╝  ╩`;

                // Friendly human form alternative (for users who are scared)
                this.humanFaceTemplate = `
    ╭─────────────────╮
    │  ▄▄         ▄▄  │
    │ ░██░       ░██░ │
    │                 │
    │       ▀▀        │
    │   {{MOUTH}}     │
    ╰─────────────────╯

 ╦═╗ ╦ ╦ ╔═╗ ╔╦╗ ╔═╗ ╔═╗  ╔═╗ ╦
 ╠╦╝ ╠═╣ ║ ║  ║║ ║╣  ╚═╗  ╠═╣ ║
 ╩╚═ ╩ ╩ ╚═╝ ═╩╝ ╚═╝ ╚═╝  ╩ ╩ ╩`;

                // Speech correction for common misrecognitions
                this.correctSpeech = (text) => {
                    return text
                        .replace(/\broads?\b/gi, 'Rhodes')
                        .replace(/\brhoads?\b/gi, 'Rhodes')
                        .replace(/\brose\b/gi, 'Rhodes')
                        .replace(/\brobes\b/gi, 'Rhodes')
                        .replace(/\brogues\b/gi, 'Rhodes')
                        .replace(/\btudor\s*mayonnaise\b/gi, 'tutor me on it')
                        .replace(/\btutor\s*mayonnaise\b/gi, 'tutor me on it')
                        .replace(/\btutor\s*me\s*on\s*is\b/gi, 'tutor me on it')
                        .replace(/\broads\s*a\s*g\s*i\b/gi, 'Rhodes AGI')
                        .replace(/\broads\s*agi\b/gi, 'Rhodes AGI')
                        .replace(/\broads\s*AI\b/gi, 'Rhodes AGI');
                };

                // Filter known speech recognition hallucinations (Chrome often hallucinates these)
                this.filterHallucinations = (text) => {
                    // Known hallucination patterns
                    const hallucinationPatterns = [
                        /learn\s+english\s+(for\s+)?free\s+www\.engvid\.com/gi,
                        /www\.[a-z]+\.(com|org|net)/gi,
                        /http[s]?:\/\//gi,
                        /subscribe\s+(to|for)\s+(my|our|the)\s+channel/gi,
                        /click\s+(the\s+)?subscribe/gi,
                        /like\s+and\s+subscribe/gi,
                        /thank\s+you\s+for\s+watching/gi,
                        /please\s+subscribe/gi,
                        /transcribe.*exactly.*said/gi,
                        /^[\s\d\.]+$/,
                    ];
                    for (const pattern of hallucinationPatterns) {
                        if (pattern.test(text)) {
                            console.log('Filtered hallucination:', text);
                            return '';
                        }
                    }
                    return text;
                };
                if (this.recognition) {

                this.recognition.onresult = (event) => {
                    // Accumulate all results (continuous mode returns multiple)
                    let fullTranscript = '';
                    let lastConfidence = 0;
                    for (let i = 0; i < event.results.length; i++) {
                        fullTranscript += event.results[i][0].transcript;
                        lastConfidence = event.results[i][0].confidence;
                    }

                    // Apply speech corrections
                    fullTranscript = this.correctSpeech(fullTranscript);

                    // Filter hallucinations (Chrome Web Speech API issue)
                    fullTranscript = this.filterHallucinations(fullTranscript);
                    if (!fullTranscript) {
                        console.log("Speech recognition hallucination filtered out");
                        return;  // Skip processing if hallucination detected
                    }

                    if (this.pushToTalk) {
                        // Push-to-talk: show accumulated transcript in input field
                        document.getElementById('input').value = fullTranscript;
                    } else {
                        // Hands-free: show takeover when user starts speaking
                        const takeover = document.getElementById('handsfree-takeover');
                        if (takeover && !takeover.classList.contains('active')) {
                            // First speech - show takeover (no face yet, just black screen)
                            takeover.classList.add('active');
                            this.setStatus('listening');
                            // Hide face until Rhodes speaks
                            const faceEl = document.getElementById('takeover-face');
                            if (faceEl) faceEl.style.display = 'none';
                        }

                        // Show transcript in input field always
                        document.getElementById('input').value = fullTranscript;
                        // Only show on takeover screen during FIRST listening (before face debuts)
                        if (!this.faceDebuted) {
                            const transcriptEl = document.getElementById('takeover-transcript');
                            if (transcriptEl) transcriptEl.textContent = fullTranscript;
                        }

                        // Clear any pending submit timer
                        if (this.submitTimeout) clearTimeout(this.submitTimeout);

                        // Check for "WAIT" trigger word to extend timeout
                        const waitMatch = fullTranscript.match(/\bwait\.?\s*$/i);
                        if (waitMatch) {
                            // Remove "wait" from display and extend timeout to 20 seconds
                            const cleanedTranscript = fullTranscript.replace(/\bwait\.?\s*$/i, '').trim();
                            document.getElementById('input').value = cleanedTranscript;
                            this.setStatus('waiting');  // Show WAITING status
                            // Set extended 20s timeout
                            this.submitTimeout = setTimeout(() => {
                                const isFillerOnly = /^(uh+m*|um+|er+m*|ah+|hmm+|the|a|an|i|is|it)$/i.test(cleanedTranscript);
                                if (cleanedTranscript && cleanedTranscript.length >= 2 && !isFillerOnly && cleanedTranscript !== this.lastSubmittedText && getWs() && getWs().readyState === WebSocket.OPEN) {
                                    this.lastSubmittedText = cleanedTranscript;
                                    document.getElementById('input').value = '';
                                    addMsg('user', maskPasswords(cleanedTranscript));
                                    markGuestActivity();
                                    const _rid = generateUUID();
                                    try { if (typeof setActiveReqId === 'function') setActiveReqId(_rid); } catch(e) {}
                                    getWs().send(JSON.stringify({
                                        msg_type: 'user_message',
                                        msg_id: _rid,
                                        timestamp: new Date().toISOString(),
                                        payload: {
                                            content: cleanedTranscript,
                                            attachments: [],
                                            voice_mode: true,
                                            handsfree: true,
                                            audio_output: true,
                                            stream: true
                                        }
                                    }));
                                    showLoading();
                                    this.setStatus('processing');
                                    this.showWaitingFace();
                                    setTimeout(() => { this.lastSubmittedText = ''; }, 5000);
                                }
                            }, 20000);  // 20 second extended wait
                            return;
                        }

                        // Check for "OVER" trigger word to submit immediately
                        const overMatch = fullTranscript.match(/\bover\.?\s*$/i);
                        if (overMatch) {
                            // Remove "over" from transcript and submit immediately
                            fullTranscript = fullTranscript.replace(/\bover\.?\s*$/i, '').trim();
                            document.getElementById('input').value = fullTranscript;
                            const isFillerOnly = /^(uh+m*|um+|er+m*|ah+|hmm+|the|a|an|i|is|it)$/i.test(fullTranscript);
                            if (fullTranscript && fullTranscript.length >= 2 && !isFillerOnly && fullTranscript !== this.lastSubmittedText) {
                                this.lastSubmittedText = fullTranscript;
                                document.getElementById('input').value = '';
                                addMsg('user', maskPasswords(fullTranscript));
                                markGuestActivity();
                                const _rid2 = generateUUID();
                                try { if (typeof setActiveReqId === 'function') setActiveReqId(_rid2); } catch(e) {}
                                getWs().send(JSON.stringify({
                                    msg_type: 'user_message',
                                    msg_id: _rid2,
                                    timestamp: new Date().toISOString(),
                                    payload: {
                                        content: fullTranscript,
                                        attachments: [],
                                        voice_mode: true,
                                        handsfree: true,
                                        audio_output: true,
                                        stream: true
                                    }
                                }));
                                showLoading();
                                this.setStatus('processing');
                                this.showWaitingFace();
                                setTimeout(() => { this.lastSubmittedText = ''; }, 5000);
                            }
                            return;  // Don't set timeout, already submitted
                        }

                        // Detect verbal pauses (thinking sounds) - wait longer if present
                        const verbalPauses = /\b(uh+m*|um+|er+m*|ah+|hmm+|like|so|well|you know)\b/i;
                        const endsWithPause = verbalPauses.test(fullTranscript.slice(-20));
                        const delay = endsWithPause ? 2500 : 1200;  // Reduced: was 4000:2000  // 4s if thinking, 2s otherwise

                        // Set new timer - submit after pause
                        this.submitTimeout = setTimeout(async () => {
                            const finalText = fullTranscript.trim();
                            // Check filters BEFORE showing processing status
                            const isFillerOnly = /^(uh+m*|um+|er+m*|ah+|hmm+|the|a|an|i|is|it|so|and|but|like|well|you know)$/i.test(finalText);
                            const isMisheardSingle = window.rhodesActiveTutorLang && /^(you|do|to|go|no|so|we|he|she|me|be|the|a|i|oh|ah)$/i.test(finalText);
                            
                            if (isFillerOnly) {
                                console.log('Filler detected, extending listening:', finalText);
                                // Stay in listening mode, don't flash processing
                                return;
                            }
                            if (isMisheardSingle) {
                                const now = Date.now();
                                if (this._lastMisheardWord === finalText.toLowerCase() && (now - this._lastMisheardTime) < 3000) {
                                    console.log('Repeated misheard word, allowing:', finalText);
                                    this._lastMisheardWord = null;
                                } else {
                                    console.log('Possible misheard word, waiting for repeat:', finalText);
                                    this._lastMisheardWord = finalText.toLowerCase();
                                    this._lastMisheardTime = now;
                                    // Stay in listening mode
                                    return;
                                }
                            }
                            
                            // All checks passed - NOW show processing immediately
                            this.setStatus("processing");
                            this.showWaitingFace();

                            // Require meaningful text
                            if (finalText && finalText.length >= 2 && finalText !== this.lastSubmittedText && getWs() && getWs().readyState === WebSocket.OPEN) {
                                // Ask Haiku if thought seems complete (for longer text)
                                let shouldSubmit = true;
                                if (finalText.length > 10 && !this.pushToTalk) {
                                    try {
                                        const haikuCheck = await fetch('/api/thought-complete', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ text: finalText })
                                        });
                                        if (haikuCheck.ok) {
                                            const result = await haikuCheck.json();
                                            shouldSubmit = result.complete;
                                            if (!shouldSubmit) {
                                                console.log('Haiku says thought incomplete, extending listening'); this.setStatus('listening'); this.showListeningFace();
                                                return;
                                            }
                                        }
                                    } catch (e) {
                                        // API error, proceed with submission
                                        console.log('Haiku check failed, proceeding:', e);
                                    }
                                }

                                if (shouldSubmit) {
                                    this.lastSubmittedText = finalText;
                                    // In push-to-talk mode, stop recording after submit
                                    // In hands-free mode, keep listening (will auto-restart on next speech)
                                    if (this.pushToTalk) {
                                        this.stopRecording();
                                    }
                                    document.getElementById('input').value = '';
                                    addMsg('user', maskPasswords(finalText));
                                    markGuestActivity();
                                    const _rid3 = generateUUID();
                                    try { if (typeof setActiveReqId === 'function') setActiveReqId(_rid3); } catch(e) {}
                                    getWs().send(JSON.stringify({
                                        msg_type: 'user_message',
                                        msg_id: _rid3,
                                        timestamp: new Date().toISOString(),
                                        payload: {
                                            content: finalText,
                                            attachments: [],
                                            voice_mode: true,
                                            handsfree: !this.pushToTalk,
                                            audio_output: true,
                                            stream: true
                                        }
                                    }));
                                    showLoading();
                                    this.setStatus('processing');
                                    this.showWaitingFace();
                                    // Clear lastSubmittedText after a delay to allow same phrase later
                                    setTimeout(() => { this.lastSubmittedText = ''; }, 5000);
                                }
                            }
                        }, delay);  // 2s normal, 4s if verbal pause detected
                    }
                };

                this.recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    let msg = 'Voice error: ' + event.error;
                    switch (event.error) {
                        case 'not-allowed':
                            msg = 'Microphone access denied. Click the mic icon in your address bar to allow.';
                            break;
                        case 'no-speech':
                            msg = 'No speech detected. Try again.';
                            // Don't stop recording for no-speech, just continue listening
                            return;
                        case 'network':
                            msg = 'Network error. Speech recognition requires internet connection.';
                            break;
                        case 'audio-capture':
                            msg = 'Could not capture audio. Check your microphone settings.';
                            break;
                        case 'aborted':
                            // Silent abort, don't show toast
                            this.stopRecording();
                            return;
                    }
                    showToast(msg);
                    this.stopRecording();
                };

                this.recognition.onstart = () => {
                    console.log('Speech recognition started');
                };

                this.recognition.onend = () => {
                    console.log('Speech recognition ended, isRecording was:', this.isRecording, 'ttsPlaying:', this.ttsPlaying, 'pushToTalk:', this.pushToTalk);
                    // In hands-free mode, always restart unless TTS is playing
                    if (!this.pushToTalk && !this.ttsPlaying) {
                        console.log('Auto-restarting recognition for hands-free mode');
                        setTimeout(() => {
                            if (!this.pushToTalk && !this.ttsPlaying) {
                                this.startRecording();
                            }
                        }, 200);
                    } else if (this.pushToTalk) {
                        this.stopRecording();
                    }
                    // If TTS is playing, don't restart - audio.onended will restart when done
                };

                }  // end if (this.recognition)
                // Bind record button (push-to-talk style)
                const recordBtn = document.getElementById('voice-record-btn');
                if (recordBtn) {
                    // Simple click toggle - Whisper handles silence detection + auto-stop
                    recordBtn.onclick = () => this.toggleRecording();
                }

                // Mode toggle button
                const modeBtn = document.getElementById('voice-mode-btn');
                if (modeBtn) {
                    modeBtn.onclick = () => this.toggleMode();
                    this.updateModeIndicator();
                }

                console.log('Voice chat initialized (push-to-talk mode)');
            },

            exitHandsfree: function() {
                // Exit hands-free mode when user clicks the takeover screen
                const takeover = document.getElementById('handsfree-takeover');
                if (takeover) takeover.classList.remove('active');
                // Stay in hands-free mode but dismiss the splash
            },

            toggleMode: function() {
                this.pushToTalk = !this.pushToTalk;
                this.updateModeIndicator();
                console.log('Voice mode:', this.pushToTalk ? 'push-to-talk' : 'hands-free');

                const takeover = document.getElementById('handsfree-takeover');

                // When switching to hands-free, enable audio and start recording
                if (!this.pushToTalk) {
                    // Auto-enable voice responses in handsfree mode
                    this.voiceEnabled = true;
                    const audioToggleBtn = document.getElementById('audio-toggle-btn');
                    if (audioToggleBtn) {
                        audioToggleBtn.innerHTML = '🔊 AUDIO';
                        audioToggleBtn.classList.add('active');
                    }
                    showToast('VOICE MODE');
                    // Start valence tracking
                    if (window.rhodesValence) window.rhodesValence.onHandsfreeStart();
                    // Show the full-screen takeover immediately
                    if (takeover) takeover.classList.add("active");
                    // Start recording unless TTS is currently playing
                    if (!this.ttsPlaying) {
                        this.startRecording();
                    }
                } else {
                    if (takeover) takeover.classList.remove('active');
                    showToast('PUSH-TO-TALK MODE');
                    // Stop valence tracking
                    if (window.rhodesValence) window.rhodesValence.onHandsfreeStop();
                    // Abort recording without submitting
                    if (this.whisperRecorder && this.whisperRecorder.state === 'recording') {
                        this.stopWhisperRecording(true);
                    } else {
                        this.stopRecording();
                    }
                    this.voiceEnabled = false;
                    this.ttsPlaying = false;
                    // Stop any playing audio
                    const audio = document.getElementById('tts-audio');
                    if (audio) { audio.pause(); audio.src = ''; }
                    this.stopSpeakingAnimation();
                }
            },

            updateModeIndicator: function() {
                const modeBtn = document.getElementById('voice-mode-btn');
                if (modeBtn) {
                    modeBtn.innerHTML = '🎤 VOICE';
                    modeBtn.classList.toggle('active', !this.pushToTalk);
                }
            },

            toggleRecording: function() {
                if (this.isRecording) {
                    this.stopRecording();
                } else {
                    this.startRecording();
                }
            },

            startRecording: function() {
                console.log('startRecording called - using Whisper for all recording');
                // Always use Whisper - more reliable than Web Speech API across all browsers
                this.startWhisperRecording();
            },

            stopRecording: function() {
                // Stop Whisper recording if active
                if (this.whisperRecorder && this.whisperRecorder.state === 'recording') {
                    this.stopWhisperRecording();
                    return;
                }
                if (!this.recognition) return;
                try {
                    this.recognition.stop();
                } catch (e) {}
                this.isRecording = false;
                document.getElementById('voice-record-btn')?.classList.remove('recording');
                document.getElementById('voice-indicator')?.classList.remove('active');
            },
            // Whisper-based voice recording for better multilingual support
            whisperRecorder: null,
            whisperStream: null,
            whisperChunks: [],
            useWhisper: false,  // Set to true for language learning modes
            
            startWhisperRecording: async function() {
                try {
                    this.whisperStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    this.whisperRecorder = new MediaRecorder(this.whisperStream, { mimeType: "audio/webm" });
                    this.whisperChunks = [];
                    
                    // Set up silence detection using RMS of time-domain waveform
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const source = audioContext.createMediaStreamSource(this.whisperStream);
                    const analyser = audioContext.createAnalyser();
                    analyser.fftSize = 2048;
                    source.connect(analyser);
                    
                    const dataArray = new Float32Array(analyser.fftSize);
                    let silenceStart = null;
                    let hasSpoken = false;
                    let peakRMS = 0;
                    const SILENCE_DURATION = 1800;  // 1.8s of silence to auto-stop
                    const GRACE_PERIOD = 1500;      // 1.5s grace before silence detection
                    const recordingStartTime = Date.now();
                    
                    const self = this;
                    
                    // Check for silence periodically using RMS volume
                    this.silenceCheckInterval = setInterval(() => {
                        analyser.getFloatTimeDomainData(dataArray);
                        // Compute RMS (root mean square) for actual volume level
                        let sumSq = 0;
                        for (let i = 0; i < dataArray.length; i++) {
                            sumSq += dataArray[i] * dataArray[i];
                        }
                        const rms = Math.sqrt(sumSq / dataArray.length);
                        
                        // Track peak to auto-calibrate threshold
                        if (rms > peakRMS) peakRMS = rms;
                        // Dynamic threshold: 15% of peak, minimum 0.01
                        const threshold = Math.max(0.01, peakRMS * 0.15);
                        
                        if (rms > threshold) {
                            hasSpoken = true;
                            silenceStart = null;
                        } else if (hasSpoken && (Date.now() - recordingStartTime > GRACE_PERIOD)) {
                            if (!silenceStart) {
                                silenceStart = Date.now();
                            } else if (Date.now() - silenceStart > SILENCE_DURATION) {
                                console.log("Silence detected (RMS:" + rms.toFixed(4) + " < threshold:" + threshold.toFixed(4) + "), stopping");
                                self.stopWhisperRecording();
                            }
                        }
                    }, 100);
                    
                    this.whisperRecorder.ondataavailable = (e) => {
                        if (e.data.size > 0) this.whisperChunks.push(e.data);
                    };
                    
                    this.whisperRecorder.onstop = async () => {
                        // Clean up silence detection
                        if (self.whisperSafetyTimeout) { clearTimeout(self.whisperSafetyTimeout); self.whisperSafetyTimeout = null; }
                        if (self.silenceCheckInterval) {
                            clearInterval(self.silenceCheckInterval);
                            self.silenceCheckInterval = null;
                        }
                        audioContext.close();
                        
                        // If aborted (e.g. exiting hands-free), don't process
                        if (self._abortWhisper) {
                            self._abortWhisper = false;
                            console.log('Whisper recording aborted, not submitting');
                            if (self.whisperStream) {
                                self.whisperStream.getTracks().forEach(t => t.stop());
                            }
                            return;
                        }
                        
                        self.setStatus("processing");
                        self.showWaitingFace();
                        const audioBlob = new Blob(self.whisperChunks, { type: "audio/webm" });
                        await self.sendToWhisper(audioBlob);
                        // Clean up stream
                        if (self.whisperStream) {
                            self.whisperStream.getTracks().forEach(t => t.stop());
                        }
                        // Safety net: if handsfree and not recording/playing, restart loop
                        // (covers edge cases where sendToWhisper returns without restarting)
                        if (!self.pushToTalk && !self.ttsPlaying && !self.isRecording) {
                            setTimeout(() => {
                                if (!self.pushToTalk && !self.ttsPlaying && !self.isRecording) {
                                    console.log('Handsfree safety net: restarting recording');
                                    self.setStatus('listening');
                                    self.startRecording();
                                }
                            }, 3000);
                        }
                    };
                    
                    this.whisperRecorder.start();
                    this.isRecording = true;
                    this.setStatus("listening");
                    document.getElementById("voice-record-btn")?.classList.add("recording");
                    document.getElementById("voice-indicator")?.classList.add("active");
                    // Show takeover and listening face in hands-free mode
                    if (!this.pushToTalk) {
                        const takeoverEl = document.getElementById('handsfree-takeover');
                        if (takeoverEl) takeoverEl.classList.add('active');
                        this.showListeningFace();
                    }
                    console.log("Whisper recording started with silence detection");

                    // Safety timeout - stop after 20s max to prevent infinite recording
                    this.whisperSafetyTimeout = setTimeout(() => {
                        console.log("Safety timeout - stopping Whisper recording after 20s");
                        this.stopWhisperRecording();
                    }, 20000);  // 20 second max
                } catch (e) {
                    console.error("Whisper recording error:", e);
                    showToast("Microphone access denied");
                }
            },
            
            stopWhisperRecording: function(abort) {
                if (abort) this._abortWhisper = true;
                if (this.whisperRecorder && this.whisperRecorder.state === 'recording') {
                    this.whisperRecorder.stop();
                }
                this.isRecording = false;
                // Kill mic stream immediately on abort
                if (abort && this.whisperStream) {
                    this.whisperStream.getTracks().forEach(t => t.stop());
                }
                // Clear silence detection
                if (this.silenceCheckInterval) {
                    clearInterval(this.silenceCheckInterval);
                    this.silenceCheckInterval = null;
                }
                if (this.whisperSafetyTimeout) {
                    clearTimeout(this.whisperSafetyTimeout);
                    this.whisperSafetyTimeout = null;
                }
                document.getElementById('voice-record-btn')?.classList.remove('recording');
                document.getElementById('voice-indicator')?.classList.remove('active');
            },
            
            sendToWhisper: async function(audioBlob) {
                try {
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'recording.webm');
                    // Add language hint if in tutor mode
                    const tutorLang = window.rhodesActiveTutorLang;
                    if (tutorLang) {
                        // Map de-DE to de, fr-FR to fr, etc.
                        formData.append('language', tutorLang.split('-')[0]);
                    }
                    
                    const resp = await fetch('/api/transcribe', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await resp.json();
                    
                    if (data.success && data.transcript) {
                        let transcript = data.transcript.trim();
                        console.log('Whisper transcript:', transcript);
const noSpeechProb = data.no_speech_prob || 0;                        // If high probability of no speech (noise), restart listening                        if (noSpeechProb > 0.5) {                            console.log('Likely noise, not speech - restarting listening');                            this.setStatus('listening');                            this.startRecording();                            return;                        }
                        
                        // Apply corrections
                        transcript = this.correctSpeech(transcript);
                        transcript = this.filterHallucinations(transcript);

	                        if (!transcript) {
	                            // Filtered/empty transcript - restart handsfree loop
	                            console.log('Whisper transcript empty after filtering, restarting handsfree');
	                            if (!this.pushToTalk) {
	                                this.setStatus('listening');
	                                setTimeout(() => {
	                                    if (!this.ttsPlaying && !this.isRecording) this.startRecording();
	                                }, 1000);
	                            }
	                            return;
	                        }
	                        if (transcript) {
	                            document.getElementById('input').value = transcript;
	                            // Auto-submit after Whisper transcription (both push-to-talk and hands-free)
	                            if (!getWs() || getWs().readyState !== WebSocket.OPEN) {
	                                console.error('WebSocket not open, cannot send voice message');
	                                showToast('Connection lost - reconnecting...');
	                                if (!this.pushToTalk) {
	                                    this.setStatus('listening');
	                                    setTimeout(() => {
	                                        if (!this.ttsPlaying && !this.isRecording) this.startRecording();
	                                    }, 2000);
	                                }
	                                return;
	                            }
	                            if (getWs() && getWs().readyState === WebSocket.OPEN) {
	                                addMsg('user', maskPasswords(transcript));
	                                markGuestActivity();
	                                const _ridw = generateUUID();
	                                try { if (typeof setActiveReqId === 'function') setActiveReqId(_ridw); } catch(e) {}
	                                getWs().send(JSON.stringify({
	                                    msg_type: 'user_message',
	                                    msg_id: _ridw,
	                                    timestamp: new Date().toISOString(),
	                                    payload: {
	                                        content: transcript,
	                                        attachments: [],
	                                        voice_mode: true,
	                                        handsfree: !this.pushToTalk,
	                                        audio_output: true,
	                                        stream: true
	                                    }
	                                }));
	                                showLoading();
	                                this.setStatus('processing');
	                                this.showWaitingFace();
	                                document.getElementById('input').value = '';
	                            }
	                        }
                    } else {
                        console.error('Whisper error:', data.error);
                        // Restart handsfree loop on API error
                        if (!this.pushToTalk) {
                            this.setStatus('listening');
                            setTimeout(() => {
                                if (!this.ttsPlaying && !this.isRecording) this.startRecording();
                            }, 1500);
                        }
                    }
                } catch (e) {
                    console.error('Whisper fetch error:', e);
                    // Restart handsfree loop on fetch error
                    if (!this.pushToTalk) {
                        this.setStatus('listening');
                        setTimeout(() => {
                            if (!this.ttsPlaying && !this.isRecording) this.startRecording();
                        }, 1500);
                    }
                }
            },



            // Show face with "listening..." as mouth and highlighted eye
            showListeningFace: function() {
                // Show face in listening state (debut if needed)
                this.faceDebuted = true;

                const faceEl = document.getElementById('takeover-face');
                if (!faceEl) return;

                // Keep status hidden (face has debuted)
                const status = document.getElementById('takeover-status');
                if (status) status.classList.add('hidden');

                // Face with "listening..." as mouth and highlighted eye
                let face = this.faceTemplate.replace('{{MOUTH}}', '<span class="mouth-listening">listening...</span>');
                // Highlight the eye when listening
                face = face.replace('⬤', '<span class="eye-highlight">⬤</span>');
                faceEl.innerHTML = face;
            },

            // Show face with still mouth (waiting/processing state)
            showWaitingFace: function() {
                // Show face in waiting/processing state (debut if needed)
                this.faceDebuted = true;

                // Stop any existing animation
                if (this.speakingAnimationInterval) {
                    clearInterval(this.speakingAnimationInterval);
                    this.speakingAnimationInterval = null;
                }

                // Face with still mouth (no animation, no highlight)
                const stillMouth = '════════';
                let face = this.faceTemplate.replace('{{MOUTH}}', `<span class="mouth-waiting">${stillMouth}</span>`);

                // Hands-free mode uses takeover-face
                if (!this.pushToTalk) {
                    const faceEl = document.getElementById('takeover-face');
                    if (faceEl) {
                        faceEl.innerHTML = face;
                        faceEl.style.display = 'block';
                    }
                    // Show takeover if not already visible
                    const takeover = document.getElementById('handsfree-takeover');
                    if (takeover) takeover.classList.add('active');
                } else {
                    // Normal mode uses speaking-face
                    const faceEl = document.getElementById('speaking-face');
                    if (faceEl) {
                        faceEl.innerHTML = face;
                        faceEl.classList.add('active');
                    }
                }
            },

            startSpeakingAnimation: function() {
                // Clear any existing animation first (prevents stacking)
                if (this.speakingAnimationInterval) {
                    clearInterval(this.speakingAnimationInterval);
                    this.speakingAnimationInterval = null;
                }

                // Determine target element based on mode
                const inHandsfree = !this.pushToTalk;
                console.log('startSpeakingAnimation: inHandsfree=', inHandsfree, 'pushToTalk=', this.pushToTalk, 'debuted=', this.faceDebuted);
                const faceEl = inHandsfree
                    ? document.getElementById('takeover-face')
                    : document.getElementById('speaking-face');
                console.log('faceEl:', faceEl);
                if (!faceEl) {
                    console.error('Face element not found!');
                    return;
                }

                // Only show face on FIRST appearance, then just animate mouth
                if (!this.faceDebuted) {
                    this.faceDebuted = true;
                    console.log('Face making debut!');

                    if (inHandsfree) {
                        const takeover = document.getElementById('handsfree-takeover');
                        if (takeover) takeover.classList.add('active');
                        const status = document.getElementById('takeover-status');
                        if (status) status.classList.add('hidden');
                        faceEl.style.display = 'block';
                    } else {
                        // Only on first appearance, hide message and show face
                        this.hiddenMessage = document.querySelector('#chat .msg.ai:last-child');
                        if (this.hiddenMessage) {
                            this.hiddenMessage.style.opacity = '0';
                        }
                        faceEl.classList.add('active');
                    }
                }

                // Clear transcript when speaking (handsfree)
                if (inHandsfree) {
                    const transcript = document.getElementById('takeover-transcript');
                    if (transcript) transcript.textContent = '';
                }

                this.mouthIndex = 0;
                const self = this;
                const updateFace = () => {
                    const mouth = self.mouthStates[self.mouthIndex % self.mouthStates.length];
                    // When speaking: animate mouth, NO eye highlight
                    let face = self.faceTemplate.replace('{{MOUTH}}', `<span class="mouth" onclick="VoiceChat.revealText()">${mouth}</span>`);
                    faceEl.innerHTML = face;
                    self.mouthIndex++;
                };

                updateFace();
                this.speakingAnimationInterval = setInterval(updateFace, 150);
            },

            revealText: function() {
                // Show the hidden message
                if (this.hiddenMessage) {
                    this.hiddenMessage.style.opacity = '1';
                    this.hiddenMessage = null;
                }
                // Stop the speaking face but keep audio playing
                this.stopSpeakingAnimation();
            },

            stopSpeakingAnimation: function() {
                // Stop animation interval
                if (this.speakingAnimationInterval) {
                    clearInterval(this.speakingAnimationInterval);
                    this.speakingAnimationInterval = null;
                }

                // Stop normal mode face
                const speakingFace = document.getElementById('speaking-face');
                if (speakingFace) speakingFace.classList.remove('active');

                // In hands-free mode, switch back to listening face
                if (!this.pushToTalk) {
                    this.showListeningFace();
                    this.setStatus('listening');
                }

                // Reveal hidden message (normal mode)
                if (this.hiddenMessage) {
                    this.hiddenMessage.style.opacity = '1';
                    this.hiddenMessage = null;
                }
            },

            speak: async function(text) {
                console.log('speak() called, voiceEnabled=', this.voiceEnabled, 'text length=', text?.length);
                if (!this.voiceEnabled || !text || this._suppressSpeak) {
                    console.log('speak() aborted: voiceEnabled=', this.voiceEnabled, 'suppress=', this._suppressSpeak);
                    return;
                }
                // If already speaking, skip (don't interrupt current TTS)
                if (this.ttsPlaying) {
                    console.log('speak() skipped: already playing TTS');
                    return;
                }
                // Don't play audio on non-chat pages (auth modal, etc.)
                const authModal = document.getElementById('auth-modal');
                if (authModal && authModal.style.display !== 'none') {
                    console.log('speak() aborted: auth modal is visible');
                    return;
                }
                // Skip TTS until user has interacted (to avoid autoplay block)
                if (!this.audioUnlocked) {
                    console.log('speak() skipped: audio not yet unlocked (waiting for user interaction)');
                    return;
                }

                // Clean text for TTS (remove markdown, code blocks, etc.)
                let cleanText = text
                    .replace(/```[\s\S]*?```/g, '')  // Remove code blocks
                    .replace(/`[^`]+`/g, '')          // Remove inline code
                    .replace(/\[DOWNLOAD:[^\]]+\]/g, 'Download available')
                    .replace(/\[.*?\]/g, '')          // Remove other brackets
                    .replace(/#{1,6}\s*/g, '')        // Remove headers
                    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
                    .replace(/\*([^*]+)\*/g, '$1')    // Remove italic
                    .replace(/\n+/g, '. ')            // Replace newlines with periods
                    .trim();

                if (!cleanText || cleanText.length < 2) return;

                // Limit length for TTS
                if (cleanText.length > 500) {
                    cleanText = cleanText.substring(0, 500) + '...';
                }

                try {
                    // Use streaming endpoint for faster response
                    const lang = document.getElementById('lang-select').value;
                    // Abort TTS fetch after 15s to prevent infinite hangs
                    const _speakAc = new AbortController();
                    const _speakTimer = setTimeout(() => _speakAc.abort(), 15000);
                    const response = await fetch(this.ttsEndpoint + '/stream', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: cleanText, language: lang }),
                        signal: _speakAc.signal
                    });
                    clearTimeout(_speakTimer);

                    console.log('TTS response status:', response.status, response.ok);
                    if (response.ok) {
                        console.log('TTS response OK, loading audio...');
                        // Stream audio using MediaSource if supported, fallback to blob
                        const audio = document.getElementById('tts-audio');
                        const self = this;

                        // Track TTS state - DON'T show face until audio actually plays
                        self.ttsPlaying = true;
                        // Keep processing status while audio loads
                        self.setStatus('processing');

                        // Use blob-based playback for reliability across browsers
                        const audioBlob = await response.blob();
                        if (audioBlob.size === 0) {
                            console.error('TTS returned empty audio');
                            self.ttsPlaying = false;
                            self.stopSpeakingAnimation();
                            // TTS returned empty — exit handsfree gracefully
                            if (!self.pushToTalk) {
                                _voiceFailureExit('TTS returned empty audio');
                            }
                            return;
                        }

                        const audioUrl = URL.createObjectURL(audioBlob);
                        audio.src = audioUrl;

                        // Clear any existing safety timeout
                        if (self.ttsSafetyTimeout) {
                            clearTimeout(self.ttsSafetyTimeout);
                            self.ttsSafetyTimeout = null;
                        }

                        // Helper to clean up audio state
                        const cleanupAudio = (reason) => {
                            // Reset status to listening in hands-free mode
                            if (!self.pushToTalk) {
                                self.setStatus("listening");
                            }
                            console.log('Audio cleanup:', reason);
                            self.ttsPlaying = false;
                            self.stopSpeakingAnimation();
                            if (self.ttsSafetyTimeout) {
                                clearTimeout(self.ttsSafetyTimeout);
                                self.ttsSafetyTimeout = null;
                            }
                            URL.revokeObjectURL(audioUrl);
                        };

                        // Handle audio errors
                        audio.onerror = (e) => {
                            console.error('Audio playback error:', e);
                            cleanupAudio('error');
                        };

                        // Handle audio pause (e.g., browser intervention)
                        audio.onpause = () => {
                            // Only cleanup if audio didn't just end naturally
                            if (!audio.ended && self.ttsPlaying) {
                                console.log('Audio paused unexpectedly');
                                cleanupAudio('pause');
                            }
                        };

                        // Clean up blob URL when done
                        audio.onended = () => {
                            cleanupAudio('ended');
                            // Auto-start recording in hands-free mode after TTS finishes
                            // Add 800ms delay to avoid picking up TTS echo/reverb
                            if (!self.pushToTalk && !self.isRecording) {
                                setTimeout(() => {
                                    if (!self.ttsPlaying && !self.isRecording) {
                                        self.startRecording();
                                    }
                                }, 2000);  // 2 second delay after TTS
                            }
                        };

                        // Safety timeout - stop animation after 2 minutes max (in case onended doesn't fire)
                        self.ttsSafetyTimeout = setTimeout(() => {
                            if (self.ttsPlaying) {
                                console.warn('TTS safety timeout - forcing animation stop');
                                cleanupAudio('timeout');
                            }
                        }, 120000);  // 120 second max

                        // Try to play with autoplay handling
                        try {
                            // STOP RECOGNITION before playing to prevent feedback loop
                            // Force stop regardless of isRecording state
                            console.log('Force stopping recognition before TTS playback');
                            try { 
                                if (self.recognition) self.recognition.abort();
                            } catch(e) {}
                            self.isRecording = false;
                            self.stopRecording();
                            await audio.play();
                            // NOW show face and start animation - audio is literally playing
                            console.log('Audio playing, showing face and starting animation');
                            self.setStatus('speaking');
                            self.startSpeakingAnimation();
                        } catch (playError) {
                            console.warn('Autoplay blocked, user interaction needed:', playError);
                            cleanupAudio('autoplay-blocked');
                        }
                    }
                } catch (e) {
                    console.error("TTS error:", e);
                    this.ttsPlaying = false;
                    this.stopSpeakingAnimation();
                    // TTS failed — exit handsfree gracefully
                    if (!this.pushToTalk) {
                        _voiceFailureExit('speak() error: ' + (e.message || e));
                    }
                }
            }
        };


    // ═══════════════════════════════════════════════════════════════
    // Streaming TTS: sentence-by-sentence audio during AI response
    // Sequence-ordered playback with in-flight tracking
    // ═══════════════════════════════════════════════════════════════

    // Graceful exit when TTS/voice system fails
    function _voiceFailureExit(reason) {
        console.error('[VOICE-FAIL] TTS failure, exiting handsfree:', reason);
        // 1. Exit handsfree mode
        VoiceChat.pushToTalk = true;
        VoiceChat.ttsPlaying = false;
        VoiceChat.isRecording = false;
        VoiceChat.stopSpeakingAnimation();
        VoiceChat.updateModeIndicator();
        var takeover = document.getElementById('handsfree-takeover');
        if (takeover) takeover.classList.remove('active');
        // Stop any active recording
        if (VoiceChat.whisperRecorder && VoiceChat.whisperRecorder.state === 'recording') {
            VoiceChat._abortWhisper = true;
            try { VoiceChat.whisperRecorder.stop(); } catch(e) {}
        }
        try { if (VoiceChat.recognition) VoiceChat.recognition.abort(); } catch(e) {}
        // Stop valence tracking
        if (window.rhodesValence) window.rhodesValence.onHandsfreeStop();
        // 2. Show apology in chat + play pre-recorded ElevenLabs audio
        var apology = "Sorry, I seem to be having trouble with my voice. Switching to text.";
        if (typeof addMsg === 'function') addMsg('ai', apology);
        try {
            var errAudio = new Audio('/sounds/voice-error.mp3');
            errAudio.play().catch(function(e) {
                // Fallback to Web Speech API if pre-recorded file fails
                if (window.speakMessage) window.speakMessage(apology);
            });
        } catch(e) {
            if (window.speakMessage) window.speakMessage(apology);
        }
        showToast('Voice unavailable - switched to text');
        // 3. Log to error central
        try {
            fetch('/api/log-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: 'tts_failure',
                    message: 'Voice/TTS failed in handsfree mode: ' + reason,
                    source: 'voice_client',
                    severity: 'error'
                })
            }).catch(function() {});
        } catch(e) {}
        // 4. Tag next user message so model knows voice failed (no AI response triggered)
        window._voiceFailedContext = '[Voice/TTS failed: ' + reason + '. User was switched to text mode.]';
    }

    var StreamingTTS = {
        _buffer: '',
        _active: false,
        _sentencesSent: 0,
        _inFlightCount: 0,
        _isPlaying: false,
        _firstChunkTime: null,
        _firstPlayTime: null,
        _ttsReqCount: 0,
        // Ordered playback: _slots[seqNum] = {blob,text} or 'skip'
        _slots: {},
        _nextSlot: 0,
        _seqCounter: 0,

	        _cleanText: function(text) {
	            return text
	                .replace(/<break\b[^>]*\/?>/gi, ' ')
	                .replace(/<\/[^>]+>/g, ' ')
	                .replace(/<[^>]+>/g, ' ')
	                .replace(/```[\s\S]*?```/g, '')
	                .replace(/`[^`]+`/g, '')
	                .replace(/\[DOWNLOAD:[^\]]+\]/g, 'Download available')
	                .replace(/\[.*?\]/g, '')
	                .replace(/#{1,6}\s*/g, '')
	                .replace(/\*\*([^*]+)\*\*/g, '$1')
	                .replace(/\*([^*]+)\*/g, '$1')
	                .replace(/\n+/g, '. ')
	                .replace(/\s+/g, ' ')
	                .trim();
	        },

	        _extractSentences: function() {
	            var sentences = [];
	            var re = /([^.!?]*[.!?]+(?:["')\]\}\u201d\u2019]+)?)(?=\s|$|<)/g;
	            var match;
	            var lastIndex = 0;
	            var carry = '';
	            while ((match = re.exec(this._buffer)) !== null) {
	                var end = match.index + match[0].length;
	                var sentence = this._buffer.substring(lastIndex, end).trim();
	                lastIndex = end;
	                if (carry) {
	                    sentence = (carry + ' ' + sentence).trim();
	                    carry = '';
	                }
	                // Avoid ultra-short segments (they sound like stutters or "six"/numbers being read line-by-line).
	                // Keep it in the buffer to merge with the next sentence/segment.
	                if (sentence.length < 18) {
	                    carry = sentence;
	                    continue;
	                }
	                sentences.push(sentence);
	            }
	            if (lastIndex > 0) {
	                var remaining = this._buffer.substring(lastIndex).trim();
	                this._buffer = (carry ? (carry + ' ') : '') + remaining;
	                this._buffer = this._buffer.trim();
	            }
	            return sentences;
	        },

	        _sendToTTS: async function(text, seqNum) {
	            var cleanText = this._cleanText(text);
	            if (!cleanText || cleanText.length < 3) {
	                this._slots[seqNum] = 'skip';
	                this._tryPlay();
	                return;
	            }
                var maxChars = (this._ttsReqCount === 0 ? 120 : 180);
                this._ttsReqCount++;
	            var segment = cleanText.length > maxChars ? cleanText.substring(0, maxChars) : cleanText;
	            console.log('[S-TTS] Sending seq=' + seqNum + ': ' + segment.substring(0, 50) + '...');

            this._inFlightCount++;
            try {
	                var lang = (document.getElementById('lang-select') || {}).value || 'en';
                    var reqId = window._submitReqId || (window._pendingGeneration && window._pendingGeneration.reqId) || null;
                    // Abort TTS fetch after 12s to prevent infinite hangs
                    var _ac = new AbortController();
                    var _acTimer = setTimeout(function() { _ac.abort(); }, 12000);
	                var response = await fetch(VoiceChat.ttsEndpoint + '/stream', {
	                    method: 'POST',
	                    headers: { 'Content-Type': 'application/json' },
	                    body: JSON.stringify({ text: segment, language: lang, req_id: reqId, seq: seqNum, source: 'streaming' }),
	                    signal: _ac.signal
	                });
                    clearTimeout(_acTimer);
                if (response.ok) {
                    var blob = await response.blob();
                    if (blob.size > 0) {
                        this._slots[seqNum] = { blob: blob, text: segment };
                        console.log('[S-TTS] Got blob seq=' + seqNum + ' size=' + blob.size);
                    } else {
                        this._slots[seqNum] = 'skip';
                    }
                } else {
                    console.warn('[S-TTS] TTS returned ' + response.status + ' for seq=' + seqNum);
                    this._slots[seqNum] = 'skip';
                }
            } catch (err) {
                console.warn('[S-TTS] fetch error seq=' + seqNum + ':', err.message);
                this._slots[seqNum] = 'skip';
            } finally {
                this._inFlightCount = Math.max(0, this._inFlightCount - 1);
                this._tryPlay();
            }
        },

        _tryPlay: function() {
            if (this._isPlaying) return;
            // Don't drop segments just because autoplay isn't unlocked yet.
            // We'll queue audio and start playback as soon as unlockAudio() runs.
            if (!VoiceChat.audioUnlocked) return;

            // Skip past any 'skip' slots
            while (this._slots[this._nextSlot] === 'skip') {
                delete this._slots[this._nextSlot];
                this._nextSlot++;
            }

            var item = this._slots[this._nextSlot];
            if (!item || item === 'skip') return;  // Next slot not ready yet

            // Got the next item in sequence order — play it
            delete this._slots[this._nextSlot];
            this._nextSlot++;

            var audio = document.getElementById('tts-audio');
            if (!audio) return;

            this._isPlaying = true;

            // ── Wall-to-first-word latency timer (admin only) ──
            if (!this._firstPlayTime) {
                this._firstPlayTime = Date.now();
                var submitTs = window._submitTimestamp || (window._pendingGeneration && window._pendingGeneration.timestamp) || this._firstChunkTime;
                var ms = this._firstPlayTime - submitTs;
                console.log('[S-TTS] WALL-TO-VOICE: ' + ms + 'ms');
                if (window.RHODES_CONFIG && window.RHODES_CONFIG.isAdmin) {
                    var el = document.getElementById('stream-tts-latency');
                    if (!el) {
                        el = document.createElement('div');
                        el.id = 'stream-tts-latency';
                        el.style.cssText = 'position:fixed;top:8px;right:8px;background:rgba(0,0,0,0.85);color:#0f0;padding:6px 12px;border-radius:6px;font:13px monospace;z-index:99999;pointer-events:none;';
                        document.body.appendChild(el);
                    }
                    el.textContent = '\u23F1 ' + (ms / 1000).toFixed(1) + 's wall \u2192 voice';
                    el.style.opacity = '1';
                    clearTimeout(el._fadeTimer);
                    el._fadeTimer = setTimeout(function() {
                        el.style.transition = 'opacity 1s';
                        el.style.opacity = '0';
                        setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 1100);
                    }, 8000);
                }
            }

            // Update valence tracker with current playing text
            if (window.updateValencePlayingText) window.updateValencePlayingText(item.text || '');

            // Stop mic on first segment
            if (!VoiceChat.ttsPlaying) {
                VoiceChat.ttsPlaying = true;
                VoiceChat.setStatus('speaking');
                VoiceChat.startSpeakingAnimation();
                try { if (VoiceChat.recognition) VoiceChat.recognition.abort(); } catch(e) {}
                VoiceChat.isRecording = false;
                VoiceChat.stopRecording();
            }

            // CRITICAL: Clear ALL handlers before setting new src
            // This prevents stale onpause from speak() firing when src changes
            audio.onended = null;
            audio.onerror = null;
            audio.onpause = null;

            var url = URL.createObjectURL(item.blob);
            var self = this;

            var next = function() {
                self._isPlaying = false;
                URL.revokeObjectURL(url);
                // Check for more in-order slots
                if (self._slots[self._nextSlot] && self._slots[self._nextSlot] !== 'skip') {
                    self._tryPlay();
                } else {
                    // Skip past any skip slots that accumulated
                    while (self._slots[self._nextSlot] === 'skip') {
                        delete self._slots[self._nextSlot];
                        self._nextSlot++;
                    }
                    // Check again after skipping
                    if (self._slots[self._nextSlot]) {
                        self._tryPlay();
                    } else if (!self._active && self._inFlightCount <= 0) {
                        self._finish();
                    }
                    // else: waiting for in-flight requests or more chunks
                }
            };

            audio.onended = next;
            audio.onerror = function() { console.warn('[S-TTS] audio error'); next(); };
            audio.src = url;
            var p = audio.play();
            if (p && p.catch) p.catch(function(e) { console.warn('[S-TTS] play rejected:', e.message); next(); });
        },

        _finish: function() {
            // Double-check audio is really done
            var a = document.getElementById('tts-audio');
            if (a && !a.paused && !a.ended) {
                var self = this;
                a.onended = function() { a.onended = null; self._finish(); };
                return;
            }
            console.log('[S-TTS] Finished playback, firstPlayTime=' + this._firstPlayTime);
            if (window.updateValencePlayingText) window.updateValencePlayingText('');
            // If no audio ever played and we had sentences, TTS completely failed
            if (!this._firstPlayTime && this._sentencesSent > 0 && !VoiceChat.pushToTalk) {
                _voiceFailureExit('all ' + this._sentencesSent + ' TTS segments failed');
                return;
            }
            VoiceChat.ttsPlaying = false;
            VoiceChat.stopSpeakingAnimation();
            if (!VoiceChat.pushToTalk) {
                VoiceChat.setStatus('listening');
                setTimeout(function() {
                    if (!VoiceChat.ttsPlaying && !VoiceChat.isRecording) {
                        VoiceChat.startRecording();
                    }
                }, 2500);
            }
        },

	        feedChunk: function(chunk) {
	            if (!VoiceChat.voiceEnabled) return;
	            if (!this._active) {
                this._active = true;
                this._buffer = '';
                this._slots = {};
                this._nextSlot = 0;
                this._seqCounter = 0;
                this._sentencesSent = 0;
                this._inFlightCount = 0;
                this._isPlaying = false;
                this._firstChunkTime = Date.now();
                this._firstPlayTime = null;
                this._ttsReqCount = 0;
                console.log('[S-TTS] Session started');
		            }
		            this._buffer += chunk;
		            // Strip SSML tags early so they don't explode sentence detection or get spoken as literals.
		            this._buffer = this._buffer.replace(/<break\b[^>]*\/?>/gi, ' ');
		            var sentences = this._extractSentences();
		            for (var i = 0; i < sentences.length; i++) {
		                var seq = this._seqCounter++;
		                this._sentencesSent++;
	                this._sendToTTS(sentences[i], seq);
	            }
	            // If there's no punctuation for a long stretch, force a partial segment so audio can begin.
	            // Send the *first* partial earlier to reduce wall-to-voice.
	            var maxLen = (this._sentencesSent === 0 ? 100 : 180);
                var minCut = (this._sentencesSent === 0 ? 35 : 60);
	            if (this._buffer.length > maxLen) {
	                var cutAt = this._buffer.lastIndexOf(' ', maxLen);
	                if (cutAt > minCut) {
	                    // Avoid splitting inside markup like "<break ...>"
	                    var lt = this._buffer.lastIndexOf('<', cutAt);
	                    var gt = this._buffer.lastIndexOf('>', cutAt);
	                    if (lt === -1 || gt > lt) {
	                        var partial = this._buffer.substring(0, cutAt + 1).trim();
	                        if (partial.length >= 10) {
	                            this._buffer = this._buffer.substring(cutAt + 1).trim();
	                            var seq2 = this._seqCounter++;
	                            this._sentencesSent++;
	                            this._sendToTTS(partial, seq2);
	                        }
	                    }
	                }
	            }
	        },

        flush: function() {
            if (!this._active) return;
            console.log('[S-TTS] Flushing, buffer=' + this._buffer.length + ' inFlight=' + this._inFlightCount + ' playing=' + this._isPlaying);
            this._active = false;
            // Send remaining buffer if substantial
            if (this._buffer.trim().length >= 5) {
                var seq = this._seqCounter++;
                this._sentencesSent++;
                this._sendToTTS(this._buffer, seq);
            }
            this._buffer = '';
            // If nothing was ever sent, signal fallback to speak()
            if (this._sentencesSent === 0 && !this._isPlaying) return false;
            // If everything is already done, finish now
            if (!this._isPlaying && this._inFlightCount <= 0 && !this._slots[this._nextSlot]) {
                this._finish();
            }
            // Otherwise, _tryPlay will call _finish when last segment ends
            return true;
        },

        cancel: function() {
            this._active = false;
            this._buffer = '';
            this._slots = {};
            this._nextSlot = 0;
            this._seqCounter = 0;
            this._sentencesSent = 0;
            this._inFlightCount = 0;
            var a = document.getElementById('tts-audio');
            if (a) { try { a.pause(); a.src = ''; } catch(e) {} }
            this._isPlaying = false;
        },

        didHandle: function() { return this._sentencesSent > 0; }
    };
    window.StreamingTTS = StreamingTTS;


    window.VoiceChat = VoiceChat;
    window.rhodesVoiceHelpers = { VoiceChat };

    VoiceChat.init();

    const unlockOnce = () => {
        VoiceChat.unlockAudio();
        document.removeEventListener('click', unlockOnce);
        document.removeEventListener('keydown', unlockOnce);
    };
    document.addEventListener('click', unlockOnce);
    document.addEventListener('keydown', unlockOnce);

    if (typeof setAddMsg === 'function') {
        const originalAddMsg = addMsg;
        const wrappedAddMsg = function(...args) {
            originalAddMsg.apply(this, args);
            if (args[0] === 'ai' && window.VoiceChat && window.VoiceChat.voiceEnabled) {
                try {
                    // If StreamingTTS is active for this turn, always flush at end-of-message.
                    // If nothing was streamed, flush() returns false and we fall back to speak().
                    if (window.StreamingTTS && (window.StreamingTTS.didHandle() || window.StreamingTTS._active)) {
                        var flushed = window.StreamingTTS.flush();
                        if (flushed === false) window.VoiceChat.speak(args[1]);
                    } else window.VoiceChat.speak(args[1]);
                } catch (error) {
                    console.error('Voice speak hook failed:', error);
                }
            }
        };
        setAddMsg(wrappedAddMsg);
        addMsg = wrappedAddMsg;
    }
};
