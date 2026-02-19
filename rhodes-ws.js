// Extracted from rhodes.js: websocket helper routines

window.installRhodesWsHelpers = function installRhodesWsHelpers(deps) {
    if (!deps || window.__rhodesWsHelpersInstalled) return;
    window.__rhodesWsHelpersInstalled = true;

    const rhodesStorage = deps.rhodesStorage;
    const setStatus = deps.setStatus;
    const showToast = deps.showToast;
    const connect = deps.connect;
    const getWs = deps.getWs;
    const getUserToken = deps.getUserToken;
    const setUserToken = deps.setUserToken;
    const setWsReadyForMessages = deps.setWsReadyForMessages;
    const setConnectionInProgress = deps.setConnectionInProgress;
    const getWsConnectAttempts = deps.getWsConnectAttempts;
    const setWsConnectAttempts = deps.setWsConnectAttempts;

    function rejectPendingSessionList(message) {
        if (!window._pendingSessionListPromise) return;
        const reject = window._pendingSessionListReject;
        window._pendingSessionListPromise = null;
        window._pendingSessionListResolve = null;
        window._pendingSessionListReject = null;
        try {
            reject && reject(new Error(message || 'Session list failed'));
        } catch {}
    }

    function resolvePendingSessionList(sessions) {
        if (!window._pendingSessionListPromise) return false;
        const resolve = window._pendingSessionListResolve;
        window._pendingSessionListPromise = null;
        window._pendingSessionListResolve = null;
        window._pendingSessionListReject = null;
        try {
            resolve && resolve(sessions);
        } catch {}
        return true;
    }

    function handleDesktopBridgeMessage(msg) {
        if (!msg || !msg.type) return false;

        if (msg.type === 'local_ready') {
            console.log('[DESKTOP] Local execution ready:', msg.capabilities);
            window.RHODES_LOCAL_READY = true;
            window.RHODES_LOCAL_CAPABILITIES = msg.capabilities;
            return true;
        }

        if (msg.type === 'auto_login_token') {
            console.log('[DESKTOP] Auto-login token received');
            if (msg.token && !getUserToken()) {
                setUserToken(msg.token);
                rhodesStorage.setItem('rhodes_user_token', msg.token);
                const ws = getWs();
                if (ws) ws.close();
                setTimeout(connect, 100);
            }
            return true;
        }

        return false;
    }

    function handleSessionListResponse(msg, renderDeps) {
        if (!msg || msg.msg_type !== 'session_list_response') return false;
        const payload = msg.payload || {};
        if (payload.success && Array.isArray(payload.sessions)) {
            const sessions = payload.sessions;
            if (resolvePendingSessionList(sessions)) return true;

            if (window.__showSessionListInChat && renderDeps && typeof renderDeps.addMsg === 'function') {
                window.__showSessionListInChat = false;
                const escapeHtml = renderDeps.escapeHtml || (x => String(x));
                let listHtml = '<strong>Your Sessions:</strong><br>';
                for (const s of sessions.slice(0, 10)) {
                    const date = s.updated_at ? new Date(s.updated_at).toLocaleDateString() : (s.created_at ? new Date(s.created_at).toLocaleDateString() : '');
                    const title = (s.title || '').trim() || s.session_id || 'Session';
                    listHtml += '<span style="color:var(--cyan)">' + escapeHtml(s.session_id) + '</span> (' + escapeHtml(date) + ') - ' + escapeHtml(title) + '<br>';
                }
                renderDeps.addMsg('ai', listHtml);
            }
            return true;
        }

        rejectPendingSessionList(payload.error || payload.message || 'Session list failed');
        return true;
    }

    function handleSocketDisconnect(statusText, wasReady) {
        setWsReadyForMessages(false);
        setConnectionInProgress(false);
        setStatus(false, statusText);

        if ((window._pendingGeneration || window.streamingMsgEl) && wasReady) {
            console.log('[WS] Disconnected during generation, will request continuation on reconnect');
            window._needsContinuation = true;
            if (window.streamingMsgEl) {
                window.streamingMsgEl.classList.remove('streaming');
                window.streamingMsgEl = null;
                window.streamingContent = '';
            }
            window._pendingGeneration = null;
        }

        const debugBtn = document.getElementById('debug-btn');
        if (debugBtn) debugBtn.style.display = 'inline';

        const attempt = (getWsConnectAttempts() || 0) + 1;
        setWsConnectAttempts(attempt);
        if (!wasReady && attempt > 10) {
            console.log('[WS] Still retrying after ' + attempt + ' attempts (auth never succeeded)');
            showToast('Still reconnecting...');
        }
        const delay = Math.min(1500 * Math.pow(1.7, attempt - 1), 30000);
        console.log('[WS] Reconnecting in ' + delay + 'ms (attempt ' + attempt + ')');
        setTimeout(connect, delay);
    }

    window.rhodesWsHelpers = {
        handleDesktopBridgeMessage,
        handleSessionListResponse,
        handleSocketDisconnect
    };
};
