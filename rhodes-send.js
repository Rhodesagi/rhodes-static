// Extracted from rhodes.js: send pipeline helpers

window.installRhodesSendHelpers = function installRhodesSendHelpers(deps) {
    if (!deps || window.__rhodesSendHelpersInstalled) return;
    window.__rhodesSendHelpersInstalled = true;

    const generateUUID = deps.generateUUID;
    const getInput = deps.getInput;
    const getWs = deps.getWs;
    const isWsReadyForMessages = deps.isWsReadyForMessages;
    const queueOutboundMessage = deps.queueOutboundMessage;
    const showToast = deps.showToast;
    const connect = deps.connect;
    const showLoading = deps.showLoading;
    const clearToolCalls = deps.clearToolCalls;
    const addMsg = deps.addMsg;
    const addMessage = deps.addMessage;
    const addRoomLine = deps.addRoomLine || window.addRoomLine;
    const maskPasswords = deps.maskPasswords;
    const markGuestActivity = deps.markGuestActivity;
    const getPendingImages = deps.getPendingImages;
    const setPendingImages = deps.setPendingImages;
    const updateImagePreview = deps.updateImagePreview;
    const getCurrentRoomId = deps.getCurrentRoomId;
    const getCurrentUsername = deps.getCurrentUsername;
    const getSeenRoomMsgIds = deps.getSeenRoomMsgIds;
    const setActiveReqId = deps.setActiveReqId;
    const options = deps.options || {};

    function isSocketReady() {
        const ws = getWs();
        return !!(ws && ws.readyState === WebSocket.OPEN && isWsReadyForMessages());
    }

    function getPendingImagesSafe() {
        const pendingImages = getPendingImages();
        return Array.isArray(pendingImages) ? pendingImages : [];
    }

    function parseModelSwitchPrefix(rawText) {
        const s = String(rawText || '').trim().toLowerCase();
        console.log('[parseModelSwitchPrefix] checking:', s);

        if (options.enableRVersionSwitch) {
            if (options.enableRVersionNumericSuffix) {
                const rMatch = s.match(/^\/(?:r|ds|p)(\d+\.\d+)g?([abcdef])(\d{0,2})(\.c[abcdef][012]?)?(\s+.*)?$/);
                if (rMatch) {
                    const version = rMatch[1];
                    const variant = rMatch[2];
                    const suffix = rMatch[3] || '';
                    const rest = (rMatch[4] || '').trim();
                    const model = (s.startsWith('/ds') ? 'ds' : s.startsWith('/p') ? 'p' : 'r') + version + variant + suffix + (rMatch[4] || '');
                    const flag = model;
                    console.log('[parseModelSwitchPrefix] matched rX.Y format:', { flag, model, rest });
                    return { flag, model, rest };
                }
            } else {
                const rMatch = s.match(/^\/(?:r|ds|p)(\d+\.\d+)g?([abcdef])(\.c[abcdef][012]?)?(\s+.*)?$/);
                if (rMatch) {
                    const version = rMatch[1];
                    const variant = rMatch[2];
                    const rest = (rMatch[3] || '').trim();
                    const model = (s.startsWith('/ds') ? 'ds' : s.startsWith('/p') ? 'p' : 'r') + version + variant + (rMatch[3] || '');
                    const flag = model;
                    console.log('[parseModelSwitchPrefix] matched rX.Y format:', { flag, model, rest });
                    return { flag, model, rest };
                }
            }
        }

        let flag = null;
        if (s === '--alpha' || s.startsWith('--alpha ')) flag = 'alpha';
        else if (s === '--beta' || s.startsWith('--beta ')) flag = 'beta';
        else if (s === '--ada' || s.startsWith('--ada ')) flag = 'ada';
        else if (s === '--delta' || s.startsWith('--delta ')) flag = 'delta';
        else if (s === '/alpha' || s.startsWith('/alpha ')) flag = 'alpha';
        else if (s === '/beta' || s.startsWith('/beta ')) flag = 'beta';
        else if (s === '/ada' || s.startsWith('/ada ')) flag = 'ada';
        else if (s === '/delta' || s.startsWith('/delta ')) flag = 'delta';
    else if (s === '--epsilon' || s.startsWith('--epsilon ')) flag = 'epsilon';
    else if (s === '--kimi' || s.startsWith('--kimi ')) flag = 'kimi';
    else if (s === '/epsilon' || s.startsWith('/epsilon ')) flag = 'epsilon';
    else if (s === '/kimi' || s.startsWith('/kimi ')) flag = 'kimi';
    else if (s === '--grok' || s.startsWith('--grok ')) flag = 'grok';
    else if (s === '--zeta' || s.startsWith('--zeta ')) flag = 'zeta';
    else if (s === '/grok' || s.startsWith('/grok ')) flag = 'grok';
    else if (s === '/zeta' || s.startsWith('/zeta ')) flag = 'zeta';

        if (!flag) {
            const generic = s.match(/^\/([a-z][a-z0-9._-]{0,63})(?:\s+(.*))?$/);
            if (generic) {
                const genericFlag = generic[1].toLowerCase();
                const genericRest = (generic[2] || '').trim();
                console.log('[parseModelSwitchPrefix] generic slash match:', { flag: genericFlag, model: genericFlag, rest: genericRest });
                return { flag: genericFlag, model: genericFlag, rest: genericRest };
            }
            console.log('[parseModelSwitchPrefix] no flag match');
            return null;
        }

        const map = {
            alpha: 'rhodes-alpha-format-3',
            beta: 'rhodes-beta-format-3',
            delta: 'deepseek',
            ada: 'rhodes-ada-format-3',
        epsilon: 'kimi',
        kimi: 'kimi',
        grok: 'grok',
        zeta: 'grok'
        };
        const model = map[flag];
        const rest = s.replace(/^(--|\/)\w+\s*/, '').trim();
        console.log('[parseModelSwitchPrefix] matched:', { flag, model, rest });
        return { flag, model, rest };
    }

    function isFormatModeCommand(lowerCmd) {
        const isRhodesFormat = lowerCmd.startsWith('/rhodes-') && lowerCmd.includes('-format-');
        const isRhodesiaFormat = options.enableRhodesiaFormatAlias && lowerCmd.startsWith('/rhodesia-') && lowerCmd.includes('-format-');
        if (isRhodesFormat || isRhodesiaFormat) return true;

        if (options.enableLegacyLetterFormats) {
            if (lowerCmd === '/a2.2' || lowerCmd === '/b2.2' || lowerCmd === '/c2.2' || lowerCmd === '/d2.2') {
                return true;
            }
        }

        return false;
    }
    function clearInputAndResize(inputEl) {
        if (!inputEl) return;
        inputEl.value = '';
        try {
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        } catch (e) {
            // Fallback for older webviews
            var evt = document.createEvent('Event');
            evt.initEvent('input', true, true);
            inputEl.dispatchEvent(evt);
        }
    }

    function send() {

        const input = getInput();
        if (!input) {
            console.error('[SEND] Missing #input element');
            return;
        }

        console.log('send function called');
        let text = input.value.trim();
        let pendingImages = getPendingImagesSafe();
        console.log('[send] text value:', text);
        if (!text && pendingImages.length === 0) return;

        const lowerCmd = text.toLowerCase();
        if (lowerCmd === '/stop' || lowerCmd === '/interrupt') {
            clearInputAndResize(input);
            if (isSocketReady()) {
                const ws = getWs();
                ws.send(JSON.stringify({
                    msg_type: 'interrupt',
                    msg_id: generateUUID(),
                    timestamp: new Date().toISOString(),
                    payload: { reason: lowerCmd.slice(1) }
                }));
                showToast('Interrupt sent');
                setActiveReqId(generateUUID());
                return;
            }
            showToast('Not connected');
            return;
        }

        if (lowerCmd === '/model' || lowerCmd === '/models') {
            clearInputAndResize(input);
            addMsg('ai', '**Available models:**\n' +
                '`/alpha` or `/r1.0a` \u2014 Claude Opus\n' +
                '`/beta` or `/r1.0b` \u2014 Claude Sonnet\n' +
                '`/ada` or `/r1.0c` \u2014 Claude Haiku\n' +
                '`/delta` or `/r1.12d` \u2014 DeepSeek R1\n' +
                '`/epsilon` or `/r1.12e` \u2014 Kimi K2.5\n' +
                '`/grok` or `/r1.12f` \u2014 Grok 4.1 Fast\n' +
                '`/r1.13d` \u2014 Claude 3 Opus (resurrected)\n' +
                '`/r1.14d` \u2014 GPT-4o (resurrected)\n' +
                '`/r1.15d` \u2014 GPT-4o+ (few-shot)');
            return;
        }

        if (text.startsWith('/') && window._slashCommands) {
            const parts = text.split(' ');
            const cmd = parts[0].toLowerCase();
            const args = parts.slice(1).join(' ');
            if (window._slashCommands[cmd]) {
                clearInputAndResize(input);
                const result = window._slashCommands[cmd](args);
                if (result) showToast(result);
                return;
            }
        }

        const desktopCmds = ['clear-cache', 'clearcache', 'refresh-assets'];
        if (lowerCmd.startsWith('/') && desktopCmds.includes(lowerCmd.slice(1))) {
            clearInputAndResize(input);
            if (window.pywebview && window.pywebview.api && typeof window.pywebview.api.execute_command === 'function') {
                const cmdName = lowerCmd.slice(1);
                window.pywebview.api.execute_command(cmdName, '').then(result => {
                    if (result.success) {
                        showToast(result.message || 'Command executed');
                        if (result.cleared && result.cleared.length > 0) {
                            if (typeof addMessage === 'function') {
                                addMessage('system', 'Cache cleared: ' + result.cleared.join(', ') + '. Restart app to reload.');
                            } else {
                                addMsg('ai', 'Cache cleared: ' + result.cleared.join(', ') + '. Restart app to reload.');
                            }
                        }
                    } else {
                        showToast('Error: ' + (result.error || 'Unknown error'));
                    }
                }).catch(err => {
                    showToast('Command failed: ' + err);
                });
            } else {
                showToast('Desktop command - only works in RHODES_CODE app');
            }
            return;
        }

        if (isFormatModeCommand(lowerCmd)) {
            const token = (text.split(/\s+/, 1)[0] || '').replace(/^\//, '').toLowerCase();
            const modelSetObj = {
                msg_type: 'model_set_request',
                msg_id: generateUUID(),
                timestamp: new Date().toISOString(),
                payload: { model: token }
            };
            if (!isSocketReady()) {
                queueOutboundMessage(modelSetObj);
                showToast('Reconnecting to switch model...');
                connect();
            } else {
                const ws = getWs();
                ws.send(JSON.stringify(modelSetObj));
                showToast('Switching model...');
            }
            clearInputAndResize(input);
            return;
        }

        const currentRoomId = getCurrentRoomId();
        if (currentRoomId) {
            if (pendingImages.length > 0) {
                showToast('Rooms: attachments not supported yet');
                setPendingImages([]);
                updateImagePreview();
                return;
            }

            const msgId = generateUUID();
            const lower = text.toLowerCase();
            const isPersonal =
                lower.startsWith('/rhodes ') ||
                lower.startsWith('/myrhodes ') ||
                lower.startsWith('/myai ');

            let payloadText = text;
            if (lower.startsWith('/rhodes ')) payloadText = text.slice(7).trim();
            else if (lower.startsWith('/myrhodes ')) payloadText = text.slice(9).trim();
            else if (lower.startsWith('/myai ')) payloadText = text.slice(6).trim();
            if (!payloadText) return;

            if (typeof addRoomLine === 'function') {
                addRoomLine('user', getCurrentUsername() || 'You', payloadText);
            }
            const seenRoomMsgIds = getSeenRoomMsgIds();
            if (!isPersonal && seenRoomMsgIds) seenRoomMsgIds.add(msgId);
            clearInputAndResize(input);

            const messageObj = {
                msg_type: isPersonal ? 'room_personal_ai_request' : 'room_message_request',
                msg_id: msgId,
                timestamp: new Date().toISOString(),
                payload: {
                    room_id: currentRoomId,
                    content: payloadText
                }
            };

            if (!isSocketReady()) {
                queueOutboundMessage(messageObj);
                showToast('Disconnected — queued message and reconnecting...');
                connect();
                showLoading();
                if (typeof clearToolCalls === 'function') clearToolCalls();
                return;
            }

            const ws = getWs();
            ws.send(JSON.stringify(messageObj));
            showLoading();
            return;
        }

        // User context commands — send as user_message, not model_set_request
        const _ctxCmds = ["/military", "/fbi", "/dia", "/cia", "/nsa", "/system", "/civilian"];
        const _ctxWord = text.split(' ')[0].toLowerCase();
        if (_ctxCmds.includes(_ctxWord)) {
            const ws = getWs();
            if (ws && ws.readyState === WebSocket.OPEN) {
                clearInputAndResize(input);
                ws.send(JSON.stringify({
                    msg_type: 'user_message',
                    msg_id: generateUUID(),
                    timestamp: new Date().toISOString(),
                    payload: { content: text }
                }));
                showToast('Context: ' + _ctxWord.slice(1).toUpperCase());
            } else {
                showToast('Not connected');
            }
            return;
        }

        console.log('[BEFORE parseModelSwitchPrefix] text:', text);
        const modelCmd = parseModelSwitchPrefix(text);
        console.log('[AFTER parseModelSwitchPrefix] modelCmd:', modelCmd);
        if (modelCmd) {
            console.log('[MODEL SWITCH] Entering model switch path, will NOT send user_message');
            const modelSetObj = {
                msg_type: 'model_set_request',
                msg_id: generateUUID(),
                timestamp: new Date().toISOString(),
                payload: { model: modelCmd.model }
            };

            if (!isSocketReady()) {
                queueOutboundMessage(modelSetObj);
                showToast(`Entering ${modelCmd.flag.toUpperCase()} mode (reconnecting)...`);
                connect();
            } else {
                const ws = getWs();
                ws.send(JSON.stringify(modelSetObj));
                showToast(`Entering ${modelCmd.flag.toUpperCase()} mode...`);
            }

            clearInputAndResize(input);
            return;
        }

        // Safety: never forward raw slash commands as chat content.
        if (text.startsWith('/')) {
            clearInputAndResize(input);
            showToast('Slash command not recognized locally. Not sent to model.');
            return;
        }

        pendingImages = getPendingImagesSafe();
        const mediaNames = pendingImages.filter(f => f.type === 'video' || f.type === 'audio').map(f => f.name);
        const otherCount = pendingImages.length - mediaNames.length;
        let fileIndicator = '';
        if (pendingImages.length > 0) {
            const parts = [];
            if (otherCount > 0) parts.push(`${otherCount} file${otherCount > 1 ? 's' : ''}`);
            if (mediaNames.length > 0) parts.push(mediaNames.join(', '));
            fileIndicator = ' [' + parts.join(' + ') + ' attached]';
        }
        // Show inline players for uploaded media in user message
        let mediaHtml = '';
        for (const img of pendingImages) {
            if (img.type === 'video' && img.url) {
                mediaHtml += `\n[MEDIA:${img.url}]`;
            } else if (img.type === 'audio' && img.url) {
                mediaHtml += `\n[MEDIA:${img.url}]`;
            }
        }
        addMsg('user', maskPasswords(text) + fileIndicator + mediaHtml);
        markGuestActivity();
        if (typeof clearToolCalls === 'function') clearToolCalls();
        clearInputAndResize(input);

        // Prepend voice failure context if set
        if (window._voiceFailedContext) {
            text = window._voiceFailedContext + '\n\n' + text;
            delete window._voiceFailedContext;
        }

        const messageObj = {
            msg_type: 'user_message',
            msg_id: generateUUID(),
            timestamp: new Date().toISOString(),
            payload: {
                content: text,
                attachments: pendingImages.map(img => {
                    if (img.type === 'video' || img.type === 'audio') {
                        return {
                            type: img.type,
                            media_type: img.media_type,
                            url: img.url,
                            name: img.name
                        };
                    }
                    return {
                        type: 'image',
                        media_type: img.media_type,
                        data: img.data
                    };
                }),
                audio_output: !!(globalThis.VoiceChat && globalThis.VoiceChat.voiceEnabled),
                stream: true
            }
        };
        setActiveReqId(messageObj.msg_id);

        setPendingImages([]);
        updateImagePreview();

        if (!isSocketReady()) {
            queueOutboundMessage(messageObj);
            showToast('Disconnected — queued message and reconnecting...');
            connect();
            showLoading();
            if (typeof clearToolCalls === 'function') clearToolCalls();
            return;
        }

        const ws = getWs();
        ws.send(JSON.stringify(messageObj));
        showLoading();
    }

    window.rhodesSendHelpers = {
        parseModelSwitchPrefix,
        send
    };
};
