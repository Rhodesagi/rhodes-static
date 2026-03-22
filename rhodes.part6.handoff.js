/* RHODES v2 module: rhodes.part6.handoff.js */
/* Source: contiguous slice of rhodes.monolith.js */

// Safari/iOS/Mac click fix - comprehensive fix for href="#" links
document.addEventListener("DOMContentLoaded", function() {
    // Detect Safari (including Mac Safari)
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    // Fix Safari not firing click on href="#" links
    document.querySelectorAll('a[href="#"]').forEach(function(el) {
        // iOS/mobile touch fix
        el.addEventListener('touchend', function(e) {
            if (el.onclick) {
                e.preventDefault();
                el.onclick.call(el, e);
            }
        }, {passive: false});

        // Mac Safari click fix - re-wire onclick to proper event listener
        if (isSafari || isMac) {
            var originalOnclick = el.onclick;
            if (originalOnclick) {
                el.onclick = null; // Remove inline handler
                el.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    originalOnclick.call(el, e);
                });
            }
        }

        // Add role="button" for better accessibility and click handling
        if (!el.getAttribute('role')) {
            el.setAttribute('role', 'button');
        }
    });

    // Also fix buttons with onclick handlers
    document.querySelectorAll('button[onclick]').forEach(function(el) {
        if (isSafari || isMac) {
            var originalOnclick = el.onclick;
            if (originalOnclick) {
                el.onclick = null;
                el.addEventListener('click', function(e) {
                    originalOnclick.call(el, e);
                });
            }
        }
    });

    // Ensure cursor pointer on all clickable elements
    document.querySelectorAll('[onclick], a[href="#"], button').forEach(function(el) {
        el.style.cursor = 'pointer';
        // Force clickable on Safari
        el.style.webkitTapHighlightColor = 'rgba(0,255,65,0.3)';
    });
});

// ============================================


// ── Rhodes CAPTCHA Handoff Viewer ─────────────────────────────────────────────
// Auto-opens noVNC viewer when a social CLI tool triggers HANDOFF_REQUIRED.
// Tries direct Kasm viewer first, falls back to a launcher modal.
// Auto-closes on HANDOFF_COMPLETE.

(function() {
    'use strict';

    // State
    let _handoffPopup = null;      // window.open() reference
    let _handoffOverlay = null;    // fallback overlay element
    let _handoffModal = null;      // fallback modal element
    let _handoffCliName = null;    // which CLI is active
    let _handoffPollTimer = null;  // status polling interval
    let _handoffMini = null;       // minimized corner preview
    let _handoffCurrentUrl = null; // current viewer url
    let _handoffCurrentReason = null;
    let _handoffNestedEmbed = false;
    let _handoffMiniRepositionBound = false;

    try {
        _handoffNestedEmbed = window.self !== window.top;
    } catch (e) {
        _handoffNestedEmbed = true;
    }

    // ── Open the handoff viewer ──────────────────────────────────────────────

    function _viewerUrl(novncUrl) {
        try {
            const url = new URL(novncUrl, window.location.origin);
            if (url.pathname.endsWith('/vnc_lite.html')) {
                url.pathname = url.pathname.slice(0, -'vnc_lite.html'.length) + 'vnc.html';
            }
            if (!url.searchParams.get('autoconnect')) {
                url.searchParams.set('autoconnect', 'true');
            }
            if (!url.searchParams.get('resize')) {
                url.searchParams.set('resize', 'scale');
            }
            const parts = url.pathname.split('/').filter(Boolean);
            if ((parts[0] === 'kasm-session' || parts[0] === 'cli-vnc') && parts[1] && !url.searchParams.get('path')) {
                url.searchParams.set('path', parts[0] + '/' + parts[1] + '/websockify');
            }
            return url.toString();
        } catch (e) {
            return novncUrl;
        }
    }

    function _isAllowedHandoffFrameUrl(url) {
        try {
            const parsed = new URL(url, window.location.origin);
            const path = parsed.pathname || '';
            return (
                (path.startsWith('/kasm-session/') || path.startsWith('/cli-vnc/')) &&
                (path.endsWith('/vnc.html') || path.endsWith('/vnc_lite.html') || /\/kasm-session\/\d+\/?$/.test(path) || /\/cli-vnc\/\d+\/?$/.test(path))
            );
        } catch (e) {
            return false;
        }
    }

    function _invalidateHandoffFrame(reason) {
        console.warn('[HANDOFF] Invalid embedded target:', reason);
        window.closeHandoffViewer({ force: true });
        if (typeof showToast === 'function') {
            showToast(reason || 'Blocked invalid handoff target');
        }
    }

    function _hardenHandoffIframe(iframe) {
        iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-modals allow-downloads allow-pointer-lock');
        iframe.referrerPolicy = 'no-referrer';
        iframe.addEventListener('load', function() {
            let href = '';
            try {
                href = iframe.contentWindow && iframe.contentWindow.location ? iframe.contentWindow.location.href : iframe.src;
            } catch (e) {
                href = iframe.src || '';
            }
            if (!_isAllowedHandoffFrameUrl(href)) {
                _invalidateHandoffFrame('Blocked non-VNC page inside handoff viewer');
            }
        });
    }

    function _launchViewer(novncUrl, cliName, reason) {
        const viewerUrl = _viewerUrl(novncUrl);
        _createLaunchModal(viewerUrl, cliName, reason);
    }

    function _cleanupBeforeHandoff() {
        if (_handoffPopup && !_handoffPopup.closed) {
            try { _handoffPopup.close(); } catch(e) {}
        }
        _handoffPopup = null;
        if (_handoffOverlay) {
            _handoffOverlay.remove();
            _handoffOverlay = null;
        }
        if (_handoffModal) {
            try { _handoffModal.remove(); } catch(e) {}
            _handoffModal = null;
        }
        if (_handoffMini) {
            try { _handoffMini.remove(); } catch(e) {}
            _handoffMini = null;
        }
        var oldBanner = document.getElementById('handoff-status-banner');
        if (oldBanner) oldBanner.remove();
    }

    function _handoffMiniAnchorMetrics() {
        const inputArea = document.getElementById('input-area');
        const inputGroup = inputArea ? inputArea.querySelector('.input-group') : null;
        const sendBtn = document.getElementById('send');
        const anchorEl = inputGroup || inputArea || sendBtn;
        if (!anchorEl) return null;

        const rect = anchorEl.getBoundingClientRect();
        return {
            top: rect.top
        };
    }

    function _positionMiniHandoffViewer() {
        if (!_handoffMini) return;

        const metrics = _handoffMiniAnchorMetrics();
        const gap = 12;
        const fallbackBottom = 88;
        const desiredBottom = metrics
            ? Math.max(gap, Math.round(window.innerHeight - metrics.top + gap))
            : fallbackBottom;

        _handoffMini.style.right = 'max(0px, env(safe-area-inset-right, 0px))';
        _handoffMini.style.bottom = desiredBottom + 'px';
    }

    function _bindMiniHandoffPositioning() {
        if (_handoffMiniRepositionBound) return;
        const reposition = function() { _positionMiniHandoffViewer(); };
        window.addEventListener('resize', reposition);
        window.addEventListener('scroll', reposition, true);
        _handoffMiniRepositionBound = true;
    }

    function _updateMiniViewer(viewerUrl, cliName, reason) {
        if (!_handoffMini) return;
        const iframe = _handoffMini.querySelector('iframe');
        if (iframe && iframe.src !== viewerUrl) iframe.src = viewerUrl;
        const title = _handoffMini.querySelector('[data-mini-title]');
        if (title) title.textContent = (cliName || 'CLI').toUpperCase();
        const subtitle = _handoffMini.querySelector('[data-mini-reason]');
        if (subtitle) subtitle.textContent = reason || 'Browser handoff active';
    }

    function _restoreHandoffViewer() {
        if (!_handoffCurrentUrl || !_handoffCliName) return;
        if (_handoffMini) {
            _handoffMini.remove();
            _handoffMini = null;
        }
        _createLaunchModal(_handoffCurrentUrl, _handoffCliName, _handoffCurrentReason);
    }

    function _minimizeHandoffViewer() {
        if (!_handoffCurrentUrl || !_handoffCliName) return;
        if (_handoffOverlay) {
            _handoffOverlay.remove();
            _handoffOverlay = null;
        }
        if (_handoffModal) {
            _handoffModal.remove();
            _handoffModal = null;
        }
        if (_handoffMini) {
            _updateMiniViewer(_handoffCurrentUrl, _handoffCliName, _handoffCurrentReason);
            _addHandoffStatusBanner(_handoffCliName, _handoffCurrentReason, false);
            return;
        }

        const mini = document.createElement('div');
        mini.id = 'handoff-mini-viewer';
        mini.style.cssText = [
            'position:fixed', 'right:max(0px, env(safe-area-inset-right, 0px))', 'bottom:88px',
            'width:320px', 'height:220px',
            'background:rgba(10,14,20,0.96)',
            'border:1px solid var(--cyan,#00ffd5)',
            'border-radius:8px',
            'box-shadow:0 12px 36px rgba(0,0,0,0.45)',
            'overflow:hidden',
            'z-index:10031',
            'display:flex',
            'flex-direction:column'
        ].join(';');

        const header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:rgba(0,0,0,0.35);border-bottom:1px solid rgba(0,255,213,0.2);gap:10px;';
        header.innerHTML = [
            '<div style="min-width:0;">',
            '  <div data-mini-title style="color:var(--cyan,#00ffd5);font:700 11px Orbitron,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _escHtml((_handoffCliName || 'CLI').toUpperCase()) + '</div>',
            '  <div data-mini-reason style="color:var(--dim,#8b949e);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _escHtml(_handoffCurrentReason || 'Browser handoff active') + '</div>',
            '</div>'
        ].join('');

        const controls = document.createElement('div');
        controls.style.cssText = 'display:flex;gap:6px;flex-shrink:0;';

        const openBtn = document.createElement('button');
        openBtn.textContent = 'Open';
        openBtn.style.cssText = _btnStyle('#1a3a4a', 'var(--cyan, #00ffd5)') + ';padding:4px 10px;font-size:11px;';
        openBtn.onclick = function() { _restoreHandoffViewer(); };
        controls.appendChild(openBtn);

        const endBtn = document.createElement('button');
        endBtn.textContent = 'End';
        endBtn.style.cssText = _btnStyle('#3a1a1a', '#f85149') + ';padding:4px 10px;font-size:11px;';
        endBtn.onclick = function() { window.closeHandoffViewer({ force: true }); };
        controls.appendChild(endBtn);

        header.appendChild(controls);
        mini.appendChild(header);

        const iframe = document.createElement('iframe');
        iframe.src = _handoffCurrentUrl;
        iframe.style.cssText = 'flex:1;width:100%;border:none;background:#000;';
        _hardenHandoffIframe(iframe);
        mini.appendChild(iframe);

        document.body.appendChild(mini);
        _handoffMini = mini;
        _bindMiniHandoffPositioning();
        _positionMiniHandoffViewer();
        _addHandoffStatusBanner(_handoffCliName, _handoffCurrentReason, false);
    }

    window.openHandoffViewer = function(novncUrl, cliName, reason) {
        if (_handoffNestedEmbed) {
            console.warn('[HANDOFF] Suppressing nested handoff inside embedded context');
            return false;
        }
        const existingViewerUrl = _viewerUrl(novncUrl);
        // If already active for the same CLI, refresh the mini/modal content but do not re-open the full viewer.
        if ((_handoffModal || _handoffMini) && _handoffCliName === cliName) {
            _handoffCurrentUrl = existingViewerUrl;
            _handoffCurrentReason = reason;
            _updateMiniViewer(existingViewerUrl, cliName, reason);
            return;
        }
        _cleanupBeforeHandoff();
        _handoffCliName = cliName;
        _handoffCurrentUrl = existingViewerUrl;
        _handoffCurrentReason = reason;
        // Look up fresh VNC URL from API (stale URLs from conversation history are dead)
        _launchViewer(novncUrl, cliName, reason);
    };

    // ── Close the handoff viewer ─────────────────────────────────────────────

    window.closeHandoffViewer = function(options) {
        const opts = options || {};
        if (!opts.force && (_handoffOverlay || _handoffModal) && _handoffCurrentUrl) {
            _minimizeHandoffViewer();
            return;
        }
        // Close popup if open
        if (_handoffPopup && !_handoffPopup.closed) {
            try { _handoffPopup.close(); } catch(e) {}
        }
        _handoffPopup = null;

        // Remove launch modal
        if (_handoffOverlay) {
            _handoffOverlay.remove();
            _handoffOverlay = null;
        }
        if (_handoffModal) {
            _handoffModal.remove();
            _handoffModal = null;
        }
        if (_handoffMini) {
            _handoffMini.remove();
            _handoffMini = null;
        }

        // Remove status banner
        const banner = document.getElementById('handoff-status-banner');
        if (banner) banner.remove();

        // Clear poll timer
        if (_handoffPollTimer) {
            clearInterval(_handoffPollTimer);
            _handoffPollTimer = null;
        }

        _handoffCliName = null;
        _handoffCurrentUrl = null;
        _handoffCurrentReason = null;

        if (typeof showToast === 'function') {
            showToast(opts.completed ? 'CAPTCHA handoff completed' : 'Browser viewer closed');
        }
    };

    // ── Check if handoff is active ───────────────────────────────────────────

    window.isHandoffActive = function() {
        if (_handoffPopup && !_handoffPopup.closed) return true;
        if (_handoffOverlay) return true;
        if (_handoffMini) return true;
        return false;
    };

    // ── Launch modal (fallback when popup is blocked) ───────────────────────

    function _createLaunchModal(viewerUrl, cliName, reason) {
        // Overlay
        _handoffOverlay = document.createElement('div');
        _handoffOverlay.id = 'handoff-overlay';
        _handoffOverlay.style.cssText = [
            'position:fixed', 'inset:0', 'background:rgba(0,0,0,0.85)',
            'z-index:10030', 'display:flex', 'align-items:center',
            'justify-content:center', 'backdrop-filter:blur(4px)'
        ].join(';');

        // Modal container
        _handoffModal = document.createElement('div');
        _handoffModal.id = 'handoff-modal';
        _handoffModal.style.cssText = [
            'position:relative',
            'width:min(1520px, 98vw)',
            'height:min(920px, 94vh)',
            'background:var(--panel, #0d1117)',
            'border:2px solid var(--cyan, #00ffd5)',
            'border-radius:8px',
            'display:flex',
            'flex-direction:column',
            'overflow:hidden',
            'box-shadow:0 0 40px rgba(0,255,213,0.15)'
        ].join(';');

        // Header bar
        const header = document.createElement('div');
        header.style.cssText = [
            'display:flex', 'align-items:center', 'justify-content:space-between',
            'padding:10px 16px',
            'background:linear-gradient(135deg, #0a0e14, #131a24)',
            'border-bottom:1px solid var(--cyan, #00ffd5)',
            'flex-shrink:0'
        ].join(';');

        // Left: icon + title
        const titleEl = document.createElement('div');
        titleEl.style.cssText = 'display:flex;align-items:center;gap:10px;';
        titleEl.innerHTML = [
            '<span style="font-size:20px;">&#128274;</span>',
            '<div>',
            '  <div style="font-family:Orbitron,sans-serif;font-size:14px;color:var(--cyan,#00ffd5);font-weight:700;">',
            '    RHODES\' HUMAN HANDOFF — ' + _escHtml((cliName || 'CLI').toUpperCase()),
            '  </div>',
            '  <div style="font-size:11px;color:var(--dim,#8b949e);margin-top:2px;">',
            '    ' + _escHtml(reason || 'Solve the CAPTCHA, then this will auto-close'),
            '  </div>',
            '</div>'
        ].join('');

        // Right: buttons
        const btnGroup = document.createElement('div');
        btnGroup.style.cssText = 'display:flex;gap:8px;';

        // Finished button - notifies the model and closes
        const finishedBtn = document.createElement('button');
        finishedBtn.textContent = 'Finished';
        finishedBtn.title = 'Tell Rhodes you are done with the browser session';
        finishedBtn.style.cssText = _btnStyle('#1a3a2a', 'var(--green, #3fb950)');
        finishedBtn.onclick = function() {
            if (window.ws && window.ws.readyState === WebSocket.OPEN) {
                window.ws.send(JSON.stringify({
                    msg_type: 'handoff_user_done',
                    payload: { cli_name: cliName || 'browser' }
                }));
            }
            window.closeHandoffViewer({ force: true, completed: true });
        };
        btnGroup.appendChild(finishedBtn);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Done';
        closeBtn.title = 'Minimize viewer';
        closeBtn.style.cssText = _btnStyle('#3a1a1a', '#f85149');
        closeBtn.onclick = function() { _minimizeHandoffViewer(); };
        btnGroup.appendChild(closeBtn);

        header.appendChild(titleEl);
        header.appendChild(btnGroup);
        _handoffModal.appendChild(header);

        const iframe = document.createElement('iframe');
        iframe.id = 'handoff-vnc-iframe';
        iframe.src = viewerUrl;
        iframe.style.cssText = [
            'flex:1',
            'width:100%',
            'border:none',
            'background:#000'
        ].join(';');
        _hardenHandoffIframe(iframe);
        _handoffModal.appendChild(iframe);

        // Status bar at bottom
        const statusBar = document.createElement('div');
        statusBar.id = 'handoff-status-bar';
        statusBar.style.cssText = [
            'padding:6px 16px',
            'background:linear-gradient(135deg, #0a0e14, #131a24)',
            'border-top:1px solid rgba(0,255,213,0.3)',
            'font-size:11px',
            'color:var(--dim,#8b949e)',
            'display:flex',
            'align-items:center',
            'gap:8px',
            'flex-shrink:0'
        ].join(';');
        statusBar.innerHTML = '<span class="handoff-pulse" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f0883e;animation:handoff-pulse 1.5s ease-in-out infinite;"></span> Browser handoff active in the embedded viewer.';
        _handoffModal.appendChild(statusBar);

        _handoffOverlay.appendChild(_handoffModal);
        document.body.appendChild(_handoffOverlay);

        // Escape key to close
        const escHandler = function(e) {
            if (e.key === 'Escape' && _handoffOverlay) {
                _minimizeHandoffViewer();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Inject pulse animation if not present
        if (!document.getElementById('handoff-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'handoff-pulse-style';
            style.textContent = '@keyframes handoff-pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }';
            document.head.appendChild(style);
        }

    }

    // ── In-chat status banner (when using popup) ─────────────────────────────

    function _addHandoffStatusBanner(cliName, reason, isPopup) {
        // Remove existing
        const existing = document.getElementById('handoff-status-banner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.id = 'handoff-status-banner';
        banner.style.cssText = [
            'margin:8px 0',
            'padding:12px 16px',
            'background:linear-gradient(135deg, #1a1e2e, #0d1117)',
            'border:1px solid #f0883e',
            'border-radius:6px',
            'display:flex',
            'align-items:center',
            'gap:12px',
            'font-size:13px',
            'color:var(--text, #e6edf3)'
        ].join(';');

        banner.innerHTML = [
            '<span class="handoff-pulse" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#f0883e;animation:handoff-pulse 1.5s ease-in-out infinite;flex-shrink:0;"></span>',
            '<div style="flex:1;">',
            '  <div style="font-family:Orbitron,sans-serif;font-size:12px;color:#f0883e;font-weight:700;">',
            '    CAPTCHA HANDOFF ACTIVE — ' + _escHtml((cliName || 'CLI').toUpperCase()),
            '  </div>',
            '  <div style="font-size:11px;color:var(--dim,#8b949e);margin-top:3px;">',
            '    ' + _escHtml(reason || 'Complete the task in the popup window'),
            '  </div>',
            '</div>',
            '<button id="handoff-done-btn" style="' + _btnStyle('#1a3a2a', 'var(--green, #3fb950)') + '">Done</button>',
            isPopup ? '<button id="handoff-focus-btn" style="' + _btnStyle('#1a3a4a', 'var(--cyan, #00ffd5)') + '">Focus</button>' : ''
        ].join('');

        // Inject pulse animation if not present
        if (!document.getElementById('handoff-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'handoff-pulse-style';
            style.textContent = '@keyframes handoff-pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }';
            document.head.appendChild(style);
        }

        // Add to chat
        const chat = document.getElementById('chat');
        if (chat) chat.appendChild(banner);

        // Wire buttons
        setTimeout(function() {
            const doneBtn = document.getElementById('handoff-done-btn');
            if (doneBtn) doneBtn.onclick = function() { window.closeHandoffViewer(); };
            const focusBtn = document.getElementById('handoff-focus-btn');
            if (focusBtn) focusBtn.onclick = function() {
                if (_handoffPopup && !_handoffPopup.closed) _handoffPopup.focus();
            };
        }, 0);

        // Auto-scroll
        if (chat) chat.scrollTop = chat.scrollHeight;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    function _btnStyle(bg, color) {
        return [
            'padding:6px 14px',
            'border:1px solid ' + color,
            'background:' + bg,
            'color:' + color,
            'border-radius:4px',
            'cursor:pointer',
            'font-family:Share Tech Mono,monospace',
            'font-size:12px',
            'font-weight:600',
            'white-space:nowrap'
        ].join(';');
    }

    function _escHtml(s) {
        if (!s) return '';
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ── Tool result detection ────────────────────────────────────────────────
    // This hooks into the global scope. The tool_call handler in rhodes.js
    // will call window.checkHandoffResult(toolResult) after processing.

    window.checkHandoffResult = function(toolResult) {
        if (_handoffNestedEmbed) return false;
        if (!toolResult) return false;

        function _extractInlineVncUrl(value) {
            if (!value || typeof value !== 'string') return null;
            const match = value.match(/(?:https?:\/\/[^\s<>"'`()\]]+)?\/(?:kasm-session|cli-vnc)\/\d+\/vnc(?:_lite)?\.html[^\s<>"'`()\]]*/i);
            if (!match) return null;
            try {
                return new URL(match[0], window.location.origin).toString();
            } catch (e) {
                return match[0];
            }
        }

        function _openInlineVnc(url, data) {
            if (!url || typeof window.openHandoffViewer !== 'function') return false;
            window.openHandoffViewer(
                url,
                (data && (data.cli_name || data.tool_name || data.name)) || 'VNC',
                (data && (data.reason || data.status || data.message)) || 'Browser handoff active'
            );
            return true;
        }

        let data = toolResult;
        if (typeof data === 'string') {
            if (data.indexOf('HANDOFF_COMPLETE') !== -1) {
                if (typeof showToast === 'function') showToast('Task completed — close VNC when ready');
                return true;
            }
            if (data.indexOf('HANDOFF_TIMEOUT') !== -1) {
                if (typeof showToast === 'function') showToast('Tool timed out — VNC session still active');
                return true;
            }
            const inlineUrl = _extractInlineVncUrl(data);
            if (inlineUrl) {
                return _openInlineVnc(inlineUrl, null);
            }
            try { data = JSON.parse(data); } catch(e) { return false; }
        }

        if (data && typeof data === 'object') {
            if (data.handoff_completed || data.handoff_timeout) {
                if (typeof showToast === 'function') showToast('Task completed — close VNC when ready');
                return true;
            }
            const directUrl =
                data.novnc_url ||
                data.vnc_url ||
                _extractInlineVncUrl(data.content) ||
                _extractInlineVncUrl(data.message) ||
                _extractInlineVncUrl(data.output) ||
                _extractInlineVncUrl(data.stdout);
            if (directUrl) {
                return _openInlineVnc(directUrl, data);
            }
        }

        return false;
    };

})();
