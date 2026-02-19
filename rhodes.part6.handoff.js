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
// Tries popup first (cleaner), falls back to in-chat iframe modal.
// Auto-closes on HANDOFF_COMPLETE.

(function() {
    'use strict';

    // State
    let _handoffPopup = null;      // window.open() reference
    let _handoffOverlay = null;    // fallback overlay element
    let _handoffModal = null;      // fallback modal element
    let _handoffCliName = null;    // which CLI is active
    let _handoffPollTimer = null;  // status polling interval

    // ── Open the handoff viewer ──────────────────────────────────────────────

    window.openHandoffViewer = function(novncUrl, cliName, reason) {
        // Close any existing handoff viewer before opening new one
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
        // Remove old status banner
        var oldBanner = document.getElementById('handoff-status-banner');
        if (oldBanner) oldBanner.remove();

        _handoffCliName = cliName;
        const title = (cliName || 'CLI').toUpperCase() + ' — Solve CAPTCHA';

        // Try popup first
        try {
            _handoffPopup = window.open(novncUrl.replace('vnc.html','vnc_lite.html'), 'rhodes_handoff',
                'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes');
            if (_handoffPopup && !_handoffPopup.closed) {
                _handoffPopup.document.title = title;
                // Show toast
                if (typeof showToast === 'function') showToast('CAPTCHA handoff opened in popup');
                // Add in-chat status indicator
                _addHandoffStatusBanner(cliName, reason, true);
                return;
            }
        } catch(e) {
            // popup blocked or cross-origin
        }

        // Fallback: in-chat iframe modal
        _handoffPopup = null;
        _createIframeModal(novncUrl, cliName, reason);
    };

    // ── Close the handoff viewer ─────────────────────────────────────────────

    window.closeHandoffViewer = function() {
        // Close popup if open
        if (_handoffPopup && !_handoffPopup.closed) {
            try { _handoffPopup.close(); } catch(e) {}
        }
        _handoffPopup = null;

        // Remove iframe modal
        if (_handoffOverlay) {
            _handoffOverlay.remove();
            _handoffOverlay = null;
        }
        if (_handoffModal) {
            _handoffModal.remove();
            _handoffModal = null;
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

        if (typeof showToast === 'function') showToast('CAPTCHA handoff completed');
    };

    // ── Check if handoff is active ───────────────────────────────────────────

    window.isHandoffActive = function() {
        if (_handoffPopup && !_handoffPopup.closed) return true;
        if (_handoffOverlay) return true;
        return false;
    };

    // ── Iframe modal (fallback) ──────────────────────────────────────────────

    function _createIframeModal(novncUrl, cliName, reason) {
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
            'width:min(1100px, 95vw)',
            'height:min(780px, 90vh)',
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
            '    HUMAN HANDOFF — ' + _escHtml((cliName || 'CLI').toUpperCase()),
            '  </div>',
            '  <div style="font-size:11px;color:var(--dim,#8b949e);margin-top:2px;">',
            '    ' + _escHtml(reason || 'Solve the CAPTCHA, then this will auto-close'),
            '  </div>',
            '</div>'
        ].join('');

        // Right: buttons
        const btnGroup = document.createElement('div');
        btnGroup.style.cssText = 'display:flex;gap:8px;';

        // Pop-out button (open in new window)
        const popoutBtn = document.createElement('button');
        popoutBtn.textContent = 'Pop Out';
        popoutBtn.title = 'Open in separate window';
        popoutBtn.style.cssText = _btnStyle('#1a3a4a', 'var(--cyan, #00ffd5)');
        popoutBtn.onclick = function() {
            const w = window.open(novncUrl.replace('vnc.html','vnc_lite.html'), 'rhodes_handoff',
                'width=1024,height=768,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes');
            if (w && !w.closed) {
                _handoffPopup = w;
                // Remove iframe modal, keep status banner
                if (_handoffOverlay) { _handoffOverlay.remove(); _handoffOverlay = null; }
                if (_handoffModal) { _handoffModal.remove(); _handoffModal = null; }
                _addHandoffStatusBanner(cliName, reason, true);
            }
        };
        btnGroup.appendChild(popoutBtn);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Done';
        closeBtn.title = 'Close handoff viewer';
        closeBtn.style.cssText = _btnStyle('#1a3a2a', 'var(--green, #3fb950)');
        closeBtn.onclick = function() { window.closeHandoffViewer(); };
        btnGroup.appendChild(closeBtn);

        header.appendChild(titleEl);
        header.appendChild(btnGroup);
        _handoffModal.appendChild(header);

        // Iframe
        const iframe = document.createElement('iframe');
        iframe.id = 'handoff-vnc-iframe';
        iframe.src = novncUrl.replace('vnc.html','vnc_lite.html');
        iframe.style.cssText = [
            'flex:1', 'width:100%', 'border:none',
            'background:#000'
        ].join(';');
        iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
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
        statusBar.innerHTML = '<span class="handoff-pulse" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f0883e;animation:handoff-pulse 1.5s ease-in-out infinite;"></span> Waiting for you to complete the task...';
        _handoffModal.appendChild(statusBar);

        _handoffOverlay.appendChild(_handoffModal);
        document.body.appendChild(_handoffOverlay);

        // Escape key to close
        const escHandler = function(e) {
            if (e.key === 'Escape' && _handoffOverlay) {
                window.closeHandoffViewer();
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
        if (!toolResult) return false;

        // toolResult might be a string (JSON) or object
        let data = toolResult;
        if (typeof data === 'string') {
            // Check for handoff markers in raw text
            if (data.indexOf('HANDOFF_COMPLETE') !== -1) {
                // Don't auto-close — user may still be interacting with VNC
                if (typeof showToast === 'function') showToast('Task completed — close VNC when ready');
                return true;
            }
            if (data.indexOf('HANDOFF_TIMEOUT') !== -1) {
                if (typeof showToast === 'function') showToast('Tool timed out — VNC session still active');
                return true;
            }
            // Try JSON parse
            try { data = JSON.parse(data); } catch(e) { return false; }
        }

        // Object with handoff fields
        if (data && typeof data === 'object') {
            if (data.handoff_completed || data.handoff_timeout) {
                if (typeof showToast === 'function') showToast('Task completed — close VNC when ready');
                return true;
            }
            if (data.handoff === true && data.novnc_url) {
                window.openHandoffViewer(
                    data.novnc_url,
                    data.cli_name || data.tool_name || 'cli',
                    data.reason || 'Solve the CAPTCHA to continue'
                );
                return true;
            }
        }

        return false;
    };

})();

