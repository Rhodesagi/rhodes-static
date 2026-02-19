/* RHODES v2 module: rhodes.part4.ws-runtime.js */
/* Source: contiguous slice of rhodes.monolith.js */

        // =============================================
        // BFCACHE / TAB VISIBILITY RECONNECTION
        // Fixes: browser back button showing disconnected state
        // =============================================
        window.addEventListener('pageshow', function(event) {
            if (event.persisted) {
                // Page was restored from bfcache (browser back/forward)
                console.log('[WS] Page restored from bfcache, checking connection');
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    window._wsConnectAttempts = 0;
                    connectionInProgress = false;
                    connect();
                }
                // Also restore auth UI state
                updateHeaderAuth();
            }
        });
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                // Tab became visible again (alt-tab, switch tabs, etc.)
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    console.log('[WS] Tab became visible with dead connection, reconnecting');
                    window._wsConnectAttempts = 0;
                    connectionInProgress = false;
                    connect();
                }
            }
        });
        // Media/attachment handlers are installed from rhodes-media.js.
        if (typeof window.installRhodesMediaHelpers === 'function') {
            window.installRhodesMediaHelpers({
                showToast,
                getWs: () => ws,
                initialPendingImages: []
            });
        } else {
            console.error('[MEDIA] installRhodesMediaHelpers is missing');
            window.downloadSiteContent = window.downloadSiteContent || (() => showToast('Media unavailable - reload required'));
            window.openPreview = window.openPreview || (() => showToast('Media unavailable - reload required'));
            window.closePreview = window.closePreview || (() => {});
            window.downloadPreview = window.downloadPreview || (() => showToast('Media unavailable - reload required'));
            window.openPreviewNewTab = window.openPreviewNewTab || (() => showToast('Media unavailable - reload required'));
            window.deployPreview = window.deployPreview || (() => showToast('Media unavailable - reload required'));
        }

        // ── Valence Tracker ──
        if (typeof window.installRhodesValence === 'function') {
            window.installRhodesValence({
                getWs: () => ws,
                getRhodesId: () => RHODES_ID,
                generateUUID,
                isWsReady: () => wsReadyForMessages
            });
        }

        function mediaGetPendingImages() {
            if (window.rhodesMediaHelpers && typeof window.rhodesMediaHelpers.getPendingImages === 'function') {
                return window.rhodesMediaHelpers.getPendingImages();
            }
            return [];
        }

        function mediaSetPendingImages(images) {
            if (window.rhodesMediaHelpers && typeof window.rhodesMediaHelpers.setPendingImages === 'function') {
                window.rhodesMediaHelpers.setPendingImages(images);
            }
        }

        function updateImagePreview() {
            if (window.rhodesMediaHelpers && typeof window.rhodesMediaHelpers.updateImagePreview === 'function') {
                window.rhodesMediaHelpers.updateImagePreview();
            }
        }

        function addFile(file) {
            if (window.rhodesMediaHelpers && typeof window.rhodesMediaHelpers.addFile === 'function') {
                window.rhodesMediaHelpers.addFile(file);
                return;
            }
            showToast('Media unavailable - reload required');
        }

        window.removeImage = function(index) {
            if (window.rhodesMediaHelpers && typeof window.rhodesMediaHelpers.removeImage === 'function') {
                window.rhodesMediaHelpers.removeImage(index);
            }
        };

        // Mask passwords in displayed text (pswd: word -> pswd: **********)

        function maskPasswords(text) {
            return text.replace(/\bpswd[:\s]+(\S+)/gi, (match, password) => {
                return 'pswd: ' + '*'.repeat(password.length);
            });
        }

        // ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
        // ⚠️ CRITICAL FUNCTION: DO NOT MODIFY OR REMOVE THIS send() FUNCTION ⚠️
        // ⚠️ This function handles message sending for both mobile and desktop ⚠️
        // ⚠️ Breaking this will break the entire chat interface ⚠️
        // ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
        if (typeof window.installRhodesSendHelpers === 'function') {
            window.installRhodesSendHelpers({
                generateUUID,
                getInput: () => input,
                getWs: () => ws,
                isWsReadyForMessages: () => wsReadyForMessages,
                queueOutboundMessage,
                showToast,
                connect,
                showLoading,
                clearToolCalls,
                addMsg,
                addMessage: (typeof addMessage === 'function') ? addMessage : null,
                addRoomLine,
                maskPasswords,
                markGuestActivity,
                getPendingImages: mediaGetPendingImages,
                setPendingImages: mediaSetPendingImages,
                updateImagePreview,
                getCurrentRoomId: () => CURRENT_ROOM_ID,
                getCurrentUsername: () => CURRENT_USERNAME,
                getSeenRoomMsgIds: () => seenRoomMsgIds,
                setActiveReqId: (id) => { activeReqId = id; window._submitReqId = id; },
                options: { enableRVersionSwitch: true, enableRVersionNumericSuffix: true, enableRhodesiaFormatAlias: true, enableLegacyLetterFormats: true }
            });
        } else {
            console.error('[SEND] installRhodesSendHelpers is missing');
        }

        function parseModelSwitchPrefix(rawText) {
            if (window.rhodesSendHelpers && typeof window.rhodesSendHelpers.parseModelSwitchPrefix === 'function') {
                return window.rhodesSendHelpers.parseModelSwitchPrefix(rawText);
            }
            return null;
        }

        function send() {
            if (window.rhodesSendHelpers && typeof window.rhodesSendHelpers.send === 'function') {
                return window.rhodesSendHelpers.send();
            }
            showToast('Send unavailable - reload required');
        }

        // ============================================
        // ⚠️⚠️⚠️ CRITICAL WARNING: DO NOT MODIFY SEND BUTTON ⚠️⚠️⚠️
        // The send() function must be exposed globally for onclick handlers
        // Changing this will break mobile/desktop message sending
        // ============================================
        window.send = send;  // Expose globally for HTML onclick


        // Split mode: Send message to a specific instance pane
        window.sendToInstance = function(instanceNum, message) { console.log("[SPLIT-DEBUG] sendToInstance called:", instanceNum, message);
            if (!message || !message.trim()) return;
            message = message.trim();

            // Get the pane connection
            const paneConnections = window.paneConnections || {};
            const paneWs = paneConnections[instanceNum];

            // Handle model switch slash commands (don't show in chat, just switch)
            const lowerMsg = message.toLowerCase();
            const modelSwitchPattern = /^\/(?:rhodes-|rhodesia-)?(?:alpha|beta|ada|delta|epsilon|opus|sonnet|haiku|deepseek|kimi|grok|zeta)(?:-format-?\d+(?:\.\d+)?)?$|^\/(?:r|ds)\d+\.\d+g?[abcdef](?:[012p]|21)?(?:\.c[abcdef][012]?)?$|^\/[abcdef]\d+(?:\.\d+)?$/;
            console.log("[SPLIT-DEBUG] pattern test:", lowerMsg, modelSwitchPattern.test(lowerMsg)); if (modelSwitchPattern.test(lowerMsg)) {
                if (!paneWs || paneWs.readyState !== WebSocket.OPEN) {
                    showToast('Pane ' + instanceNum + ' not connected');
                    return;
                }
                paneWs.send(JSON.stringify({ msg_type: 'user_message', payload: { content: message } }));
                const input = document.getElementById('instance-' + instanceNum + '-input');
                if (input) input.value = '';
                const cmdName = lowerMsg.substring(1).replace('rhodes-', '').toUpperCase();
                showToast('Pane ' + instanceNum + ': ' + cmdName);
                return;
            }

            if (paneWs && paneWs.readyState === WebSocket.OPEN) {
                console.log('sendToInstance: sending to pane', instanceNum, message);
                paneWs.send(JSON.stringify({
                    msg_type: "chat",
                    msg_id: generateUUID(),
                    timestamp: new Date().toISOString(),
                    payload: { content: message }
                }));

                // Clear the input
                const input = document.getElementById('instance-' + instanceNum + '-input');
                if (input) input.value = '';

                // Add message to pane display
                const pane = document.getElementById('pane-' + instanceNum);
                if (pane) {
                    const messagesArea = pane.querySelector('.pane-messages');
                    if (messagesArea) {
                        const msgDiv = document.createElement('div');
                        msgDiv.className = 'message user-message';
                        msgDiv.style.cssText = 'background:rgba(0,255,65,0.1);padding:8px;margin:5px 0;border-radius:3px;text-align:right;';
                        msgDiv.textContent = message;
                        messagesArea.appendChild(msgDiv);
                        messagesArea.scrollTop = messagesArea.scrollHeight;
                    }
                }
            } else {
                console.log('sendToInstance: pane', instanceNum, 'not connected');
                showToast('Pane ' + instanceNum + ' not connected');
            }
        };

        let loadingEl = null;
        const loadingTexts = ['Processing', 'Analyzing', 'Thinking', 'Generating', 'Computing'];
        let loadingInterval = null;

        function showLoading() {
            // Track that we are waiting for a response (for restart continuation)
            window._pendingGeneration = { timestamp: Date.now(), reqId: activeReqId };
            window._submitTimestamp = Date.now();
            window._submitReqId = activeReqId;
            hideLoading(); // Clear any existing
            clearToolCalls();
            loadingEl = document.createElement('div');
            loadingEl.className = 'loading-msg';
            loadingEl.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <div class="loading-dots">
                        <span></span><span></span><span></span>
                    </div>
                    <span class="loading-text" id="loading-text">Processing...</span>
                    <span class="loading-timer" id="loading-timer" style="margin-left:10px;color:var(--dim);font-size:12px;">(${_fmtMMSS(RESPONSE_COUNTDOWN_SECONDS)})</span>
                </div>
            `;
            chat.appendChild(loadingEl);
            chat.scrollTop = chat.scrollHeight;

            // Cycle through loading texts
            let textIdx = 0;
            responseTimerStartedAt = Date.now();
            let remaining = RESPONSE_COUNTDOWN_SECONDS;
            loadingInterval = setInterval(() => {
                textIdx = (textIdx + 1) % loadingTexts.length;
                const textEl = document.getElementById('loading-text');
                if (textEl) textEl.textContent = loadingTexts[textIdx] + '...';
            }, 2000);

            if (responseTimerInterval) clearInterval(responseTimerInterval);
            responseTimerInterval = setInterval(() => {
                const elapsed = (Date.now() - responseTimerStartedAt) / 1000;
                const timerEl = document.getElementById('loading-timer');
                if (!timerEl) return;
                if (remaining > 0) {
                    remaining = Math.max(0, RESPONSE_COUNTDOWN_SECONDS - Math.floor(elapsed));
                    timerEl.textContent = '(' + _fmtMMSS(remaining) + ')';
                } else {
                    timerEl.textContent = '(+' + _fmtMMSS(elapsed) + ')';
                }
            }, 250);
        }

        function hideLoading() {
            // Clear pending generation tracking (response received)
            window._pendingGeneration = null;
            if (loadingEl) {
                loadingEl.remove();
                loadingEl = null;
            }
            if (loadingInterval) {
                clearInterval(loadingInterval);
                loadingInterval = null;
            }
            if (responseTimerInterval) {
                clearInterval(responseTimerInterval);
                responseTimerInterval = null;
            }
        }

        if (connectBtn) connectBtn.onclick = () => {
            SERVER = serverInput.value.trim();
            TOKEN = tokenInput.value.trim();
            if (SERVER && TOKEN) connect();
        };

        if (tokenInput && connectBtn) tokenInput.onkeypress = (e) => { if (e.key === 'Enter') connectBtn.click(); };
        console.log('Assigning sendBtn.onclick', sendBtn);
        if (sendBtn) {
            sendBtn.onclick = send;
            console.log('sendBtn.onclick assigned successfully');
        } else {
            console.error('ERROR: sendBtn is null! Cannot assign onclick handler');
            // Fallback: ensure send is available globally for HTML onclick
            window.send = window.send || send;
        }
        input.addEventListener('keydown', (e) => {
            if (e.isComposing) return;
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopImmediatePropagation();  // Prevent document handler from also firing
                send();
            }
        });

        // Fallback: some browsers/extensions swallow input handlers; also listen at document level.
        document.addEventListener('keydown', (e) => {
            if (e.isComposing) return;
            if (e.key === 'Enter' && !e.shiftKey && document.activeElement === input) {
                e.preventDefault();
                send();
            }
        });

        // ============================================
        // CLIPBOARD SUPPORT (for pywebview/embedded browsers)
        // ============================================
        // Explicit clipboard handlers for environments where native clipboard shortcuts don't work
        document.addEventListener('keydown', async (e) => {
            const activeEl = document.activeElement;
            const isTextInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
            if (!isTextInput) return;

            // Ctrl+V or Ctrl+Shift+V - Paste (pywebview only — native paste works in browsers)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
                if (!window.pywebview) return; // Let browser handle natively — fixes double-paste in split mode
                e.preventDefault(); // Must be BEFORE await or browser pastes natively first
                try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                        // Insert at cursor position
                        const start = activeEl.selectionStart;
                        const end = activeEl.selectionEnd;
                        const before = activeEl.value.substring(0, start);
                        const after = activeEl.value.substring(end);
                        activeEl.value = before + text + after;
                        activeEl.selectionStart = activeEl.selectionEnd = start + text.length;
                        // Trigger input event for any listeners
                        activeEl.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                } catch (err) {
                    console.log('Clipboard read failed:', err.message);
                }
            }

            // Ctrl+C or Ctrl+Shift+C - Copy (pywebview only)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
                if (!window.pywebview) return;
                const selected = activeEl.value.substring(activeEl.selectionStart, activeEl.selectionEnd);
                if (selected) {
                    e.preventDefault();
                    try {
                        await navigator.clipboard.writeText(selected);
                    } catch (err) {
                        console.log('Clipboard write failed:', err.message);
                    }
                }
            }

            // Ctrl+X - Cut (pywebview only)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X')) {
                if (!window.pywebview) return;
                const start = activeEl.selectionStart;
                const end = activeEl.selectionEnd;
                const selected = activeEl.value.substring(start, end);
                if (selected) {
                    e.preventDefault();
                    try {
                        await navigator.clipboard.writeText(selected);
                        const before = activeEl.value.substring(0, start);
                        const after = activeEl.value.substring(end);
                        activeEl.value = before + after;
                        activeEl.selectionStart = activeEl.selectionEnd = start;
                        activeEl.dispatchEvent(new Event('input', { bubbles: true }));
                    } catch (err) {
                        console.log('Clipboard cut failed:', err.message);
                    }
                }
            }

            // Ctrl+A - Select All
            if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
                e.preventDefault();
                activeEl.select();
            }
        });

        // ============================================
        // INITIALIZATION
        // ============================================
        function initSystemUI() {
            // Display detected system info
            const systemInfoEl = document.getElementById('system-info');
            if (systemInfoEl) {
                const mobileIcon = SYSTEM_INFO.isMobile ? ' [MOBILE]' : '';
                systemInfoEl.innerHTML = `DETECTED: <span class="detected">${SYSTEM_INFO.summary}${mobileIcon}</span>`;
            }

            // Highlight recommended download
            const dlGrid = document.getElementById('dl-grid');
            if (dlGrid) {
                const items = dlGrid.querySelectorAll('.dl-item');
                items.forEach(item => {
                    const osKey = item.getAttribute('data-os');
                    if (osKey === SYSTEM_INFO.downloadKey) {
                        item.classList.add('recommended');
                        // Move to top
                        dlGrid.insertBefore(item, dlGrid.firstChild);
                    }
                });
            }

            // Log to console for debugging
            console.log('RHODES System Detection:', SYSTEM_INFO);

            // Mobile-specific optimizations
            if (SYSTEM_INFO.isMobile) {
                console.log('[RHODES] Applying mobile optimizations');

                // Handle virtual keyboard - scroll input into view
                const input = document.getElementById('input');
                if (input) {
                    input.addEventListener('focus', () => {
                        setTimeout(() => {
                            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                    });

                    // Also scroll on window resize (keyboard show/hide)
                    let resizeTimer;
                    window.addEventListener('resize', () => {
                        clearTimeout(resizeTimer);
                        resizeTimer = setTimeout(() => {
                            if (document.activeElement === input) {
                                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, 250);
                    });
                }

                // Add touch feedback class to body for CSS targeting
                document.body.classList.add('is-touch-device');

                // Prevent long-press context menu on buttons
                document.querySelectorAll('button, .nav-item, .session-item').forEach(el => {
                    el.addEventListener('contextmenu', (e) => {
                        if (e.target.tagName === 'BUTTON' || e.target.classList.contains('nav-item') || e.target.classList.contains('session-item')) {
                            e.preventDefault();
                        }
                    });
                });

                // Improve touch scrolling in chat
                const chat = document.getElementById('chat');
                if (chat) {
                    chat.style.webkitOverflowScrolling = 'touch';
                }
            }

            // Initialize header auth state on page load
            updateHeaderAuth();
        }

        // Run on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initSystemUI);
        } else {
            initSystemUI();
        }

        // ============================================
        // LOCAL FILE OPERATIONS (via browser extension)
        // ============================================
        let localOpsAvailable = false;

        // Check for RhodesLocal extension
        window.addEventListener('rhodes-local-ready', () => {
            localOpsAvailable = true;
            console.log('[RHODES] Local operations extension detected');
        });

        // Also check on load (extension may already be initialized)
        setTimeout(() => {
            if (window.RhodesLocal && window.RhodesLocal.available) {
                localOpsAvailable = true;
                console.log('[RHODES] Local operations extension available');
            }
        }, 1000);

        // Handle local file operation requests from server
        async function handleLocalFileRequest(msg) {
            const { request_id, operation, params } = msg.payload;

            // Check if extension is available
            if (!localOpsAvailable || !window.RhodesLocal) {
                sendLocalFileResponse(request_id, null, 'Local operations extension not installed. Install from: www.rhodesagi.com/downloads#extension');
                return;
            }

            try {
                let result;
                switch (operation) {
                    case 'file_read':
                        result = await window.RhodesLocal.readFile(params.path, params.encoding);
                        break;
                    case 'file_write':
                        result = await window.RhodesLocal.writeFile(params.path, params.content, params.append);
                        break;
                    case 'dir_list':
                        result = await window.RhodesLocal.listDir(params.path);
                        break;
                    case 'file_delete':
                        result = await window.RhodesLocal.deleteFile(params.path);
                        break;
                    case 'mkdir':
                        result = await window.RhodesLocal.mkdir(params.path, params.recursive);
                        break;
                    case 'shell_exec':
                        result = await window.RhodesLocal.exec(params.command, params.cwd, params.timeout);
                        break;
                    case 'system_info':
                        result = await window.RhodesLocal.systemInfo();
                        break;
                    default:
                        throw new Error(`Unknown operation: ${operation}`);
                }
                sendLocalFileResponse(request_id, result, null);
            } catch (error) {
                sendLocalFileResponse(request_id, null, error.message);
            }
        }

        // Send local file operation response back to server
        function sendLocalFileResponse(requestId, result, error) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    msg_type: 'local_file_response',
                    msg_id: generateUUID(),
                    timestamp: new Date().toISOString(),
                    payload: {
                        request_id: requestId,
                        result: result,
                        error: error
                    }
                }));
            }
        }
        console.log('Initializing RHODES - calling connect()');
        setStatus(false, 'CONNECTING...');
        try {
            connect();
        } catch (error) {
            console.error('CRITICAL ERROR in connect():', error);
            setStatus(false, 'CONNECTION FAILED');
            // Fallback: Show auth modal so user can manually connect
            setTimeout(() => {
                const authModal = document.getElementById('auth-modal');
                if (authModal) authModal.style.display = 'flex';
            }, 1000);
        }

        // ============================================
        // VOICE CHAT - Dual Mode (Push-to-Talk + Hands-Free)
        // ============================================
        if (typeof window.installRhodesVoiceHelpers === 'function') {
            window.installRhodesVoiceHelpers({
                getWs: () => ws,
                getAddMsg: () => addMsg,
                setAddMsg: (fn) => { addMsg = fn; },
                maskPasswords,
                markGuestActivity,
                generateUUID,
                setActiveReqId: (id) => { activeReqId = id; window._submitReqId = id; },
                showLoading,
                showToast
            });
        } else {
            console.error('[VOICE] installRhodesVoiceHelpers is missing');
            if (!window.VoiceChat) {
                window.VoiceChat = {
                    recognition: null,
                    isRecording: false,
                    voiceEnabled: false,
                    ttsPlaying: false,
                    init: function() {},
                    unlockAudio: function() {},
                    stopRecording: function() {},
                    speak: function() {}
                };
            }
        }
        const VoiceChat = window.VoiceChat;

        // Promote a split pane to main session
        window.promoteToMain = function(paneNum) {
            const paneWs = window.paneConnections ? window.paneConnections[paneNum] : null;
            const paneContent = document.getElementById('pane-' + paneNum + '-content');
            const paneSessionId = window.paneSessionIds ? window.paneSessionIds[paneNum] : null;
            
            if (!paneWs || paneWs.readyState !== WebSocket.OPEN) {
                showToast('Pane ' + paneNum + ' not connected');
                return;
            }
            
            // Get main chat area
            const mainChat = document.getElementById('chat') || document.querySelector('.chat-container');
            
            if (mainChat && paneContent) {
                // Copy content to main chat
                mainChat.innerHTML = paneContent.innerHTML;
                
                // Transfer the WebSocket connection
                if (window.ws) {
                    window.ws.close();
                }
                window.ws = paneWs;
                window.paneConnections[paneNum] = null;
                
                // Update session ID
                if (paneSessionId) {
                    window.sessionId = paneSessionId;
                    sessionStorage.setItem('rhodes_session_id', paneSessionId);
                }
                
                // Exit split mode
                window.exitSplitMode();
                
                showToast('Pane ' + paneNum + ' promoted to main');
                console.log('Promoted pane', paneNum, 'to main session');
            }
        };

        // Toggle split mode dropdown
        window.toggleSplitModeDropdown = function() {
            const options = document.getElementById('split-mode-options');
            if (options) {
                options.style.display = options.style.display === 'none' ? 'block' : 'none';
            }
        };
        
        // Enter split mode from dropdown and close dropdown
        window.enterSplitFromDropdown = function(paneCount) {
            // Close the split mode options dropdown
            const options = document.getElementById('split-mode-options');
            if (options) options.style.display = 'none';
            
            // Enter split mode
            if (window.enterSplitMode) {
                window.enterSplitMode(paneCount);
            }
        };

// Auto-inject user token into download commands when logged in
function updateDownloadCommands() {
    const token = window.rhodesStorage?.getItem("rhodes_user_token") || localStorage.getItem("rhodes_user_token") || "";
    if (!token || token.length < 10) return;
    
    // Mac command
    const macCmd = document.getElementById("mac-curl-cmd");
    if (macCmd) {
        macCmd.textContent = `curl -sL "https://rhodesagi.com/api/desktop/download/python?token=${token}" -o rhodes.py && python3 rhodes.py --ui`;
    }
    
    // Linux command  
    const linuxCmd = document.getElementById("linux-curl-cmd");
    if (linuxCmd) {
        linuxCmd.textContent = `curl -sL "https://rhodesagi.com/api/desktop/download/python?token=${token}" -o rhodes.py && python3 rhodes.py`;
    }
    
    // Windows command
    const winCmd = document.getElementById("win-curl-cmd");
    if (winCmd) {
        winCmd.textContent = `curl -sL "https://rhodesagi.com/api/desktop/download/python?token=${token}" -o %USERPROFILE%\\rhodes.py`;
    }
    
    // Show confirmation
    const loginMsg = document.getElementById("login-for-token");
    if (loginMsg) {
        loginMsg.style.display = "block";
        loginMsg.style.color = "var(--green)";
        loginMsg.textContent = "[✓] Commands include your token - no login needed after download";
    }
}

// Run on page load and periodically check
if (document.readyState === "complete") {
    updateDownloadCommands();
} else {
    window.addEventListener("load", updateDownloadCommands);
}
setInterval(updateDownloadCommands, 2000);

// Step completed sound notification
window.stepCompletedSound = new Audio("/sounds/step_completed.mp3");
window.playStepCompleted = function() {
    try {
        window.stepCompletedSound.currentTime = 0;
        window.stepCompletedSound.play().catch(e => console.log("Sound blocked:", e));
    } catch(e) { console.log("Sound error:", e); }
};

// Customizable TTS message - uses Web Speech API (free, instant)
window.speakMessage = function(message, rate = 1.0) {
    if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = rate;
        utterance.pitch = 1.0;
        // Try to use a good English voice
        const voices = speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) || voices.find(v => v.lang.startsWith("en"));
        if (englishVoice) utterance.voice = englishVoice;
        speechSynthesis.speak(utterance);
    } else {
        console.log("TTS not supported:", message);
    }
};

// Preload voices
if ("speechSynthesis" in window) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}

// Build ready sound
window.buildReadySound = new Audio("/sounds/build_ready.mp3");
window.playBuildReady = function() {
    try {
        window.buildReadySound.currentTime = 0;
        window.buildReadySound.play().catch(e => console.log("Sound blocked:", e));
    } catch(e) { console.log("Sound error:", e); }
};

// Sound notification toggle
window.soundEnabled = localStorage.getItem("rhodesSound")  !== "false";
window.toggleSound = function(enable) {
    if (enable === undefined) enable = !window.soundEnabled;
    window.soundEnabled = enable;
    localStorage.setItem("rhodesSound", enable ? "true" : "false");
    return enable ? "Sound notifications enabled" : "Sound notifications disabled";
};

// Wrap sound functions to check toggle
const _origPlayStep = window.playStepCompleted;
const _origPlayBuild = window.playBuildReady;
window.playStepCompleted = function() { if (window.soundEnabled) _origPlayStep(); };
window.playBuildReady = function() { if (window.soundEnabled) _origPlayBuild(); };

// Register slash command
if (!window._slashCommands) window._slashCommands = {};
window._slashCommands["/sound"] = function(args) {
    if (args === "on" || args === "true" || args === "1") return toggleSound(true);
    if (args === "off" || args === "false" || args === "0") return toggleSound(false);
    return toggleSound(); // Toggle if no args
};
window._slashCommands["/sounds"] = window._slashCommands["/sound"];
window._slashCommands["/credentials"] = function(args) {
    if (window.RhodesCredentials && typeof window.RhodesCredentials.manage === "function") {
        window.RhodesCredentials.manage();
    } else {
        if (typeof showToast === "function") showToast("Credentials manager not loaded");
    }
    return null;
};
window._slashCommands["/creds"] = window._slashCommands["/credentials"];

// Project switcher (projects are user-level context, never system prompt).
