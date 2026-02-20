/* RHODES v2 module: rhodes.part2.auth-state.js */
/* Source: contiguous slice of rhodes.monolith.js */

        // ============================================
        // MAIN APPLICATION
        // ============================================
        let ws = null;
        let wsEpoch = 0; // monotonically increases; ignore stale socket events
        let activeReqId = null; // last user_message msg_id we sent (for filtering late events)
        let autoGuestAttempted = false;
        let connectionInProgress = false;
        // WebSocket server selection
        // - Primary on rhodesagi.com: `wss://rhodesagi.com/ws` (Nginx → 127.0.0.1:8876)
        // - Fallback: `wss://rhodesagi.com/ws` (also Nginx → 127.0.0.1:8876)
        // Incognito windows have no stored override; if one endpoint is down, auto-fallback keeps the UI usable.
        const wsProtocol = 'wss:';
        const isGitHubPages = window.location.hostname.includes('github.io');
        const isRhodesDomain = window.location.hostname.includes('rhodesagi.com');
        const RHODES_PROD_CANDIDATES = [
            'wss://rhodesagi.com/ws',
            'wss://rhodesagi.com/ws'
        ];
        window.__RHODES_WS_CANDIDATES = RHODES_PROD_CANDIDATES.slice();
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const defaultServer = (isGitHubPages || isRhodesDomain || isLocalhost)
            ? RHODES_PROD_CANDIDATES[0]
            : `${wsProtocol}//${window.location.hostname}:8766`;
        console.log('WebSocket URL calculation:', {
            defaultServer,
            currentHostname: window.location.hostname,
            isGitHubPages, isRhodesDomain
        });
        const storedServer = rhodesStorage.getItem('rhodes_server') || '';
        let SERVER = storedServer || defaultServer;
        // Safety: on production domain, ignore stale custom server overrides unless explicitly allowed.
        // This prevents users getting "stuck" on a dead/untrusted endpoint, but still allows known-good fallbacks.
        try {
            const qs = new URLSearchParams(window.location.search || '');
            const allowCustomServer = qs.get('allowCustomServer') === '1';
            if (isRhodesDomain && storedServer && !allowCustomServer) {
                const s = (storedServer || '').trim().replace(/\/+$/, '').toLowerCase();
                const allowed = new Set(RHODES_PROD_CANDIDATES.map(x => x.toLowerCase()));
                const looksWrong = !allowed.has(s) && !s.includes('rhodesagi.com');
                if (looksWrong) {
                    console.warn('Resetting stored rhodes_server override:', storedServer);
                    rhodesStorage.removeItem('rhodes_server');
                    SERVER = defaultServer;
                }
            }
        } catch {}
        console.log('SERVER URL:', SERVER);
        console.log('WebSocket supported:', 'WebSocket' in window);
        // Check for desktop-injected token first
        // Read token from URL param (desktop app passes it this way)
        const _urlParams = new URLSearchParams(window.location.search);
        const _desktopToken = _urlParams.get("desktop_token") || "";
        if (_desktopToken) {
            rhodesStorage.setItem("rhodes_user_token", _desktopToken);
            rhodesStorage.setItem("rhodes_token", _desktopToken);
            // Clean URL so token is not visible
            if (window.history && window.history.replaceState) {
                const cleanUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, "", cleanUrl);
            }
        }
        let TOKEN = rhodesStorage.getItem('rhodes_token') || window.__RHODES_DESKTOP_TOKEN__ || '';
        let USER_TOKEN = rhodesStorage.getItem('rhodes_user_token') || window.__RHODES_DESKTOP_TOKEN__ || '';

        // If desktop token exists but not in storage, save it
        if (window.__RHODES_DESKTOP_TOKEN__ && !rhodesStorage.getItem('rhodes_user_token')) {
            rhodesStorage.setItem('rhodes_user_token', window.__RHODES_DESKTOP_TOKEN__);
            rhodesStorage.setItem('rhodes_token', window.__RHODES_DESKTOP_TOKEN__);
            USER_TOKEN = window.__RHODES_DESKTOP_TOKEN__;
            TOKEN = window.__RHODES_DESKTOP_TOKEN__;
            console.log('[Rhodes Desktop] Token injected from desktop client');
        }
        // Clear stale guest tokens - only keep if we have a valid user token
        if (TOKEN && !USER_TOKEN) {
            console.log('Clearing stale guest token');
            TOKEN = '';
            rhodesStorage.removeItem('rhodes_token');
        }
        let CURRENT_USERNAME = rhodesStorage.getItem('rhodes_username') || null;  // Current authenticated username
        // Cleanup: remove any accidental "login " prefix from stored username
        if (CURRENT_USERNAME && CURRENT_USERNAME.toLowerCase().startsWith('login ')) {
            CURRENT_USERNAME = CURRENT_USERNAME.substring(6).trim();
            rhodesStorage.setItem('rhodes_username', CURRENT_USERNAME);
            console.log('[AUTH] Cleaned up username, removed LOGIN prefix');
        }
        if (window.rhodesSessionState && typeof window.rhodesSessionState.migrateLegacySessionPointer === 'function') {
            const startupIdentity = (USER_TOKEN && CURRENT_USERNAME) ? ('user:' + CURRENT_USERNAME) : 'guest';
            window.rhodesSessionState.migrateLegacySessionPointer(startupIdentity);
            window.rhodesSessionState.setLastIdentity(startupIdentity);
        }
        let IS_GUEST = !(USER_TOKEN && CURRENT_USERNAME);  // Not guest if we have stored credentials

        // Check if this IP+browser has ever been used by a logged-in user
        // If yes: show LOGIN. If no: show SIGN UP (default).
        if (IS_GUEST) {
            const hadPriorClientId = !!rhodesStorage.getItem('rhodes_client_id');
            const forceGuestLoginUi = function() {
                window.__rhodesIsReturningUser = true;
                const headerBtn = document.getElementById('header-login-btn');
                const mobileBtn = document.getElementById('mobile-login-link');
                const registerTab = document.querySelector('[data-tab="register"]');
                const loginTab = document.querySelector('[data-tab="login"]');
                if (headerBtn) {
                    headerBtn.textContent = 'LOGIN';
                    headerBtn.onclick = function(e) { e.preventDefault(); if (typeof showAuthTab === 'function') showAuthTab('login'); else { document.getElementById('auth-modal').style.display='flex'; if (loginTab) loginTab.click(); } };
                }
                if (mobileBtn) {
                    mobileBtn.textContent = 'LOGIN';
                    mobileBtn.onclick = function() { if (typeof showAuth === 'function') showAuth('login'); if (typeof closeMobileMenu === 'function') closeMobileMenu(); };
                }
                if (loginTab && registerTab) {
                    registerTab.style.borderColor = 'var(--dim)';
                    registerTab.style.color = 'var(--dim)';
                    registerTab.classList.remove('active');
                    loginTab.style.borderColor = 'var(--green)';
                    loginTab.style.color = 'var(--green)';
                    loginTab.classList.add('active');
                    var regContent = document.getElementById('tab-register');
                    var loginContent = document.getElementById('tab-login');
                    if (regContent) regContent.style.display = 'none';
                    if (loginContent) loginContent.style.display = 'block';
                }
            };
            const reportReturningGlitch = function(message, severity) {
                try {
                    fetch('/api/log-error', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            category: 'auth_returning_detection_unresolved',
                            message: message,
                            source: 'rhodes.auth-state',
                            severity: severity || 'warning'
                        })
                    }).catch(() => {});
                } catch {}
            };
            forceGuestLoginUi();
            fetch('/api/auth/is_returning')
                .then(r => r.json())
                .then(data => {
                    const isReturning = data && data.returning === true;
                    if (!isReturning && hadPriorClientId) {
                        reportReturningGlitch('Returning-user detection returned false for likely returning browser; guest menu forced to LOGIN fallback.', 'warning');
                    }
                    forceGuestLoginUi();
                })
                .catch((err) => {
                    const detail = err && err.message ? err.message : 'unknown';
                    if (hadPriorClientId) {
                        reportReturningGlitch('Returning-user detection request failed for likely returning browser; guest menu forced to LOGIN fallback. ' + detail, 'error');
                    }
                    forceGuestLoginUi();
                });
        }
        let GUEST_MESSAGES_REMAINING = 3;
        // Guest conversations are not persisted; warn on exit once they start chatting.
        let GUEST_HAS_ACTIVITY = false;
let CONNECTION_MSG_SHOWN = false;  // Track if connection message was shown this session
        let CLIENT_ID = rhodesStorage.getItem('rhodes_client_id') || 'web_' + Math.random().toString(36).substr(2,6);
        let RHODES_ID = null;  // Human-readable session ID (e.g., rh-7x3k9-m2p4q)
        let CURRENT_ROOM_ID = null;   // Group chat room id (room_xxx) when active
        const seenRoomMsgIds = new Set(); // Deduplicate room messages across echoes/reconnects

        function markGuestActivity() {
            try {
                if (IS_GUEST) GUEST_HAS_ACTIVITY = true;
            } catch {}
        }

        function removeGuestOnboardingMessages() {
            try {
                const msgs = document.querySelectorAll('.msg[data-kind="guest-onboarding"]');
                msgs.forEach(el => el.remove());
            } catch {}
        }

        function showGuestOnboardingMessage() {
            try {
                if (!IS_GUEST) return;
                // Only show once per tab/session.
                if (window.__guestOnboardingShown) return;
                window.__guestOnboardingShown = true;
                const n = Number(GUEST_MESSAGES_REMAINING || 0);
                const msg = `Welcome, visitor! I am Rhodes, your all-service personal AI agent. I can make you a website, argue politics with you, and advise you in any realm of human knowledge. ` +
                    `You have ${n} free guest message${n === 1 ? '' : 's'} remaining. ` +
                    `<a href=\"#\" onclick=\"showAuthTab('register');return false;\" style=\"color:var(--green);text-decoration:underline;\">Create an account</a> ` +
                    `or <a href=\"#\" onclick=\"showAuthTab('login');return false;\" style=\"color:var(--cyan);text-decoration:underline;\">login</a> for unlimited access.`;
                const el = addMsg('ai', msg, true);
                if (el) el.dataset.kind = 'guest-onboarding';
            } catch {}
        }

        // Removed: beforeunload blocking - let users close without friction

        // Lightweight client-side dedupe (guards against double sockets / retries / broadcast repeats).
        const _recentKeys = new Map(); // key -> lastSeenMs
        function _seenRecently(key, windowMs = 2500) {
            const now = Date.now();
            const last = _recentKeys.get(key) || 0;
            if (now - last < windowMs) return true;
            _recentKeys.set(key, now);
            // Bound memory
            if (_recentKeys.size > 500) {
                for (const [k, t] of _recentKeys) {
                    if (now - t > 60_000) _recentKeys.delete(k);
                    if (_recentKeys.size <= 300) break;
                }
            }
            return false;
        }

        // Response countdown shown while "loading" (until first response chunk / final message).
        const RESPONSE_COUNTDOWN_SECONDS = 30;
        let responseTimerInterval = null;
        let responseTimerStartedAt = 0;
        function _fmtMMSS(sec) {
            const s = Math.max(0, Math.floor(sec));
            const m = Math.floor(s / 60);
            const r = s % 60;
            return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
        }

        // UUID fallback for HTTP (crypto.randomUUID requires HTTPS)
        const generateUUID = () => {
            if (crypto.randomUUID) return crypto.randomUUID();
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0;
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
        };
        rhodesStorage.setItem('rhodes_client_id', CLIENT_ID);

        // TAB_ID: Session identifier for Rhodes instance
        // Default: localStorage (persists across browser closes = same Rhodes)
        // With ?new param or "New Rhodes" button: sessionStorage (temporary new instance)
        const IS_V2_PATH = (window.location.pathname === '/v2' || window.location.pathname.startsWith('/v2/'));
        const PATH_PREFIX = IS_V2_PATH ? '/v2' : '';

        const urlParams = new URLSearchParams(window.location.search);
        let wantsNewRhodes = urlParams.get('new') === '1';
        const wantsLogin = urlParams.get('login') === '1';
        const returnTo = urlParams.get('returnTo');
        
        // Show login modal if requested
        if (wantsLogin) {
            setTimeout(() => {
                const authModal = document.getElementById('auth-modal');
                if (authModal) authModal.style.display = 'flex';
            }, 500);
        }
        let didInitialAuth = false;
        const roomParam = urlParams.get('room'); // Join a group room after auth (logged-in only)
        const resumeSessionId = urlParams.get('resume');  // Resume a previous session
        const viewSessionId = urlParams.get('view');      // View-only mode for shared session
        const sharedQA = urlParams.get('qa');  // Shared Q&A pair (base64 encoded)
        // Check URL path for /qa/{id} or /c/{id} patterns (support /v2 prefix too)
        const pathMatch = window.location.pathname.match(/^\/(?:v2\/)?qa\/([a-f0-9]{12})$/);
        const convPathMatch = window.location.pathname.match(/^\/(?:v2\/)?c\/([a-f0-9]{12})$/);
        const shareQaId = pathMatch ? pathMatch[1] : urlParams.get("share_qa");  // Server-stored Q&A share
        const shareConvId = convPathMatch ? convPathMatch[1] : urlParams.get("share_conv");  // Server-stored conversation share

        // Handle shared Q&A view
        if (sharedQA) {
            try {
                const decoded = JSON.parse(atob(decodeURIComponent(sharedQA)));
                document.addEventListener('DOMContentLoaded', () => {
        // Auto-manage body.modal-open class to prevent layout shift
        const modalObserver = new MutationObserver(() => {
            const authModal = document.getElementById('auth-modal');
            const limitModal = document.getElementById('limit-modal');
            const webcamModal = document.getElementById('webcam-modal');
            const anyModalOpen = 
                (authModal && authModal.style.display === 'flex') ||
                (limitModal && limitModal.style.display === 'flex') ||
                (webcamModal && webcamModal.style.display !== 'none' && webcamModal.style.display !== '');
            
            if (anyModalOpen) {
                document.body.classList.add('modal-open');
            } else {
                document.body.classList.remove('modal-open');
            }
        });
        
        // Observe changes to modal elements
        setTimeout(() => {
            ['auth-modal', 'limit-modal', 'webcam-modal'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    modalObserver.observe(el, { attributes: true, attributeFilter: ['style'] });
                }
            });
        }, 100);

                    const chat = document.getElementById('chat');
                    chat.innerHTML = '';  // Clear default message
                    // Show shared Q&A
                    const qDiv = document.createElement('div');
                    qDiv.className = 'msg user';
                    qDiv.innerHTML = decoded.q.replace(/\n/g, '<br>');
                    chat.appendChild(qDiv);
                    const aDiv = document.createElement('div');
                    aDiv.className = 'msg ai';
                    aDiv.innerHTML = decoded.a.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre>$2</pre>').replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\*\*(https?:\/\/[^\s*]+)\*\*/g, '$1')
                .replace(/'(https?:\/\/[^\s']+)'/g, '$1')
                .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
                .replace(/(?<![*])\*([^*]+?)\*(?![*])/g, '<em>$1</em>').replace(/\n/g, '<br>');
                    chat.appendChild(aDiv);
                    // Update status
                    document.getElementById('status').innerHTML = '<span class="online">●</span> SHARED Q&A';
                    // Hide input
                    document.querySelector('.input-area').style.display = 'none';
                    // Add "Start new chat" button
                    const newChatBtn = document.createElement('div');
                    newChatBtn.style.cssText = 'text-align:center;padding:20px;';
                    newChatBtn.innerHTML = '<a href="' + (PATH_PREFIX || '') + '/" style="color:var(--green);text-decoration:underline;">Start your own conversation →</a>';
                    chat.appendChild(newChatBtn);
                });
            } catch(e) {
                console.error('Invalid shared QA:', e);
            }
        }


        // Handle server-stored shared Q&A
        if (shareQaId) {
            document.addEventListener('DOMContentLoaded', async () => {
                try {
                    const resp = await fetch('/api/qa/' + shareQaId);
                    if (!resp.ok) throw new Error('Share not found');
                    const data = await resp.json();

                    const chat = document.getElementById('chat');
                    chat.innerHTML = '';

                    // Show share type badge
                    if (data.share_type || data.share_metadata) {
                        const badge = document.createElement('div');
                        badge.style.cssText = 'position:fixed;top:60px;right:20px;background:rgba(0,255,255,0.15);border:1px solid var(--cyan);border-radius:6px;padding:8px 14px;font-size:11px;z-index:100;max-width:300px;';
                        let badgeText = data.share_type || '';
                        const meta = data.share_metadata || {};
                        if (meta.share_note) {
                            badgeText += (badgeText ? ' • ' : '') + meta.share_note;
                        }
                        badge.innerHTML = '<span style="color:var(--cyan);font-weight:bold;">SHARED:</span> ' + badgeText;
                        document.body.appendChild(badge);
                    }

                    // Handle both single Q&A (question/answer) and multi-message (messages array)
                    if (data.messages && data.messages.length > 0) {
                        // Multi-message conversation
                        for (const msg of data.messages) {
                            const div = document.createElement('div');
                            div.className = 'msg ' + (msg.role === 'user' ? 'user' : 'ai');
                            let msgContent = (msg.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                            if (msg.role !== 'user') {
                                msgContent = msgContent.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre>$2</pre>').replace(/`([^\`]+)`/g, '<code>$1</code>');
                            }
                            div.innerHTML = msgContent.replace(/\n/g, '<br>');
                            chat.appendChild(div);
                        }
                    } else if (data.question && data.answer) {
                        // Single Q&A (legacy format)
                        const qDiv = document.createElement('div');
                        qDiv.className = 'msg user';
                        qDiv.innerHTML = (data.question || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
                        chat.appendChild(qDiv);

                        const aDiv = document.createElement('div');
                        aDiv.className = 'msg ai';
                        aDiv.innerHTML = (data.answer || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/```(\w*)\n([\s\S]*?)```/g, '<pre>$2</pre>').replace(/`([^\`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
                        chat.appendChild(aDiv);
                    }

                    // Update status with share type info
                    const meta = data.share_metadata || {};
                    let statusText = 'SHARED';
                    if (meta.shared_messages && meta.total_messages) {
                        statusText += ' (' + meta.shared_messages + '/' + meta.total_messages + ' msgs)';
                    }
                    if (meta.has_redactions) {
                        statusText += ' [REDACTED]';
                    }
                    document.getElementById('status').innerHTML = '<span class="online">●</span> ' + statusText;

                    const inputArea = document.querySelector('.input-area') || document.getElementById('input-area');
                    if (inputArea) inputArea.style.display = 'none';

                    const newChatBtn = document.createElement('div');
                    newChatBtn.style.cssText = 'text-align:center;padding:20px;';
                    newChatBtn.innerHTML = '<a href="' + PATH_PREFIX + '/?new=1" style="color:var(--cyan);text-decoration:none;border:1px solid var(--cyan);padding:10px 20px;border-radius:8px;">Start your own conversation →</a>';
                    chat.appendChild(newChatBtn);
                } catch(e) {
                    console.error('Failed to load shared Q&A:', e);
                    document.getElementById('chat').innerHTML = '<div style="text-align:center;padding:40px;color:var(--dim);">Share not found or expired</div>';
                }
            });
        }

        // Handle server-stored shared conversation
        if (shareConvId) {
            document.addEventListener('DOMContentLoaded', async () => {
                try {
                    const resp = await fetch('/api/c/' + shareConvId);
                    if (!resp.ok) throw new Error('Conversation not found');
                    const data = await resp.json();
                    
                    const chat = document.getElementById('chat');
                    chat.innerHTML = '';
                    
                    // Show all messages
                    for (const msg of (data.messages || [])) {
                        const div = document.createElement('div');
                        div.className = 'msg ' + (msg.role === 'user' ? 'user' : 'ai');
                        let content = (msg.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        if (msg.role !== 'user') {
                            content = content.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre>$2</pre>').replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\*\*(https?:\/\/[^\s*]+)\*\*/g, '$1')
                .replace(/'(https?:\/\/[^\s']+)'/g, '$1')
                .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
                .replace(/(?<![*])\*([^*]+?)\*(?![*])/g, '<em>$1</em>');
                        }
                        div.innerHTML = content.replace(/\n/g, '<br>');
                        chat.appendChild(div);
                    }
                    
                    document.getElementById('status').innerHTML = '<span class="online">●</span> SHARED CONVERSATION';
                    const inputArea = document.querySelector('.input-area') || document.getElementById('input-area');
                    if (inputArea) inputArea.style.display = 'none';
                    
                    const newChatBtn = document.createElement('div');
                    newChatBtn.style.cssText = 'text-align:center;padding:20px;';
                    newChatBtn.innerHTML = '<a href="' + PATH_PREFIX + '/?new=1" style="color:var(--cyan);text-decoration:none;border:1px solid var(--cyan);padding:10px 20px;border-radius:8px;">Start your own conversation →</a>';
                    chat.appendChild(newChatBtn);
                } catch(e) {
                    console.error('Failed to load shared conversation:', e);
                    document.getElementById('chat').innerHTML = '<div style="text-align:center;padding:40px;color:var(--dim);">Conversation not found or expired</div>';
                }
            });
        }
        let TAB_ID;
        const chatEl = document.getElementById('chat'); const chatHasContent = chatEl && chatEl.children.length > 0; if (wantsNewRhodes && !chatHasContent) {
            // New Rhodes requested - ALWAYS generate fresh ID (sessionStorage is copied to new windows)
            TAB_ID = 'new_' + Math.random().toString(36).substr(2,8) + '_' + Date.now();
            rhodesSessionStorage.setItem('rhodes_new_tab_id', TAB_ID);
        } else {
            // Default - use localStorage (persists = same Rhodes always)
            TAB_ID = rhodesStorage.getItem('rhodes_tab_id');
            if (!TAB_ID) {
                TAB_ID = 'main_' + Math.random().toString(36).substr(2,8);
                rhodesStorage.setItem('rhodes_tab_id', TAB_ID);
            }
        }

        // Helper to open URL in new tab (bypasses popup blockers using anchor click)
        function openInNewTab(url) {
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

        // Helper to open new Rhodes instance in new tab
        window.openNewRhodes = () => {
            openInNewTab(window.location.origin + window.location.pathname + '?new=1');
        };

        // Start a new session in a NEW tab (preserves current session)
        window.startNewSession = () => {
            const newUrl = window.location.origin + window.location.pathname + '?new=1';
            // If in split mode, exit split and start fresh in same tab
            if (window.splitModeActive) {
                if (typeof window.exitSplitMode === 'function') window.exitSplitMode();
                window.location.href = newUrl;
                return;
            }
            // Check for pywebview API (desktop app) - must verify function exists
            if (window.pywebview && window.pywebview.api && typeof window.pywebview.api.create_window === 'function') {
                window.pywebview.api.create_window(newUrl, 'Rhodes - New Session').then(result => {
                    if (result.success) {
                        showToast('Opening new session...');
                    } else {
                        showToast('Failed to open new window');
                    }
                });
            } else {
                // Browser mode - use anchor click to bypass popup blockers
                openInNewTab(newUrl);
                showToast('Opening new session...');
            }
        };

        // Copy session ID to clipboard
        window.copySessionId = () => {
            if (RHODES_ID) {
                navigator.clipboard.writeText(RHODES_ID).then(() => {
                    showToast('Session ID copied: ' + RHODES_ID);
                }).catch(() => {
                    prompt('Copy session ID:', RHODES_ID);
                });
            }
        };

        function roomLink(roomId) {
            try {
                const u = new URL(window.location.href);
                u.searchParams.set('room', roomId);
                // Keep cache-busting param if present; otherwise reuse current URL state.
                return u.toString();
            } catch {
                return window.location.pathname + '?room=' + encodeURIComponent(roomId);
            }
        }

        function addRoomLine(kind, username, content) {
            const name = username ? `<span style="color:var(--cyan);font-weight:700;">${escapeHtml(username)}</span>: ` : '';
            // Keep room lines simple + safe: escape HTML to prevent cross-user injection.
            const safe = escapeHtml(String(content || ''))
                .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre>$2</pre>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\*\*(https?:\/\/[^\s*]+)\*\*/g, '$1')
                .replace(/'(https?:\/\/[^\s']+)'/g, '$1')
                .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
                .replace(/(?<![*])\*([^*]+?)\*(?![*])/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');
            addMsg(kind === 'ai' ? 'ai' : 'user', name + safe, true);
        }

        async function openRoomsMenu() {
            if (IS_GUEST || !CURRENT_USERNAME) {
                showToast('Rooms require login');
                const authModal = document.getElementById('auth-modal');
                if (authModal) authModal.style.display = 'flex';
                try { showAuthTab('login'); } catch {}
                return;
            }
            if (!ws || ws.readyState !== WebSocket.OPEN || !wsReadyForMessages) {
                showToast('Disconnected — reconnecting…');
                connect();
                return;
            }

            if (CURRENT_ROOM_ID) {
                const action = (prompt(`Room: ${CURRENT_ROOM_ID}\n\nType:\n- leave\n- link\n- spiral on\n- spiral off\n\n(leave blank to cancel)`) || '').trim().toLowerCase();
                if (!action) return;
                if (action === 'leave') {
                    ws.send(JSON.stringify({
                        msg_type: 'room_leave_request',
                        msg_id: generateUUID(),
                        timestamp: new Date().toISOString(),
                        payload: { room_id: CURRENT_ROOM_ID }
                    }));
                    return;
                }
                if (action === 'link') {
                    const url = roomLink(CURRENT_ROOM_ID);
                    try {
                        await navigator.clipboard.writeText(url);
                        showToast('Room link copied');
                    } catch {
                        prompt('Copy room link:', url);
                    }
                    return;
                }
                if (action === 'spiral on' || action === 'spiral off') {
                    const enabled = action === 'spiral on';
                    ws.send(JSON.stringify({
                        msg_type: 'room_spiral_request',
                        msg_id: generateUUID(),
                        timestamp: new Date().toISOString(),
                        payload: { room_id: CURRENT_ROOM_ID, enabled }
                    }));
                    return;
                }
                return;
            }

            const roomId = (prompt('Enter room ID to join (room_xxx), or leave blank to create a new room:') || '').trim();
            if (roomId) {
                ws.send(JSON.stringify({
                    msg_type: 'room_join_request',
                    msg_id: generateUUID(),
                    timestamp: new Date().toISOString(),
                    payload: { room_id: roomId }
                }));
            } else {
                ws.send(JSON.stringify({
                    msg_type: 'room_create_request',
                    msg_id: generateUUID(),
                    timestamp: new Date().toISOString(),
                    payload: { name: null }
                }));
            }
        }
        window.openRoomsMenu = openRoomsMenu;

        // Session dropdown/search/share handlers are installed from rhodes-sessions.js.

        // Simple toast notification
        function showToast(message) {
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--green);color:#000;padding:10px 20px;border-radius:4px;z-index:10000;font-size:14px;';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        }

        if (typeof window.installRhodesSessionUi === 'function') {
            window.installRhodesSessionUi({
                rhodesStorage,
                generateUUID,
                showToast,
                connect,
                getWs: () => ws,
                isWsReady: () => wsReadyForMessages,
                isGuest: () => IS_GUEST,
                getCurrentUsername: () => CURRENT_USERNAME,
                getRhodesId: () => RHODES_ID,
                setRhodesId: (id) => { RHODES_ID = id; },
                setWantsNewRhodes: (value) => { wantsNewRhodes = value; }
            });
        } else {
            console.error('[SESSIONS] installRhodesSessionUi is missing');
            const unavailable = () => showToast('Session UI unavailable - reload required');
            window.toggleSessionDropdown = window.toggleSessionDropdown || unavailable;
            window.toggleSessionSearch = window.toggleSessionSearch || unavailable;
            window.filterSessions = window.filterSessions || (() => {});
            window.debouncedSearch = window.debouncedSearch || (() => {});
            window.loadSession = window.loadSession || unavailable;
            window.renderSessions = window.renderSessions || (() => {});
            window.getShareLink = window.getShareLink || unavailable;
        }

        if (typeof window.installRhodesWsHelpers === 'function') {
            window.installRhodesWsHelpers({
                rhodesStorage,
                setStatus,
                showToast,
                connect,
                getWs: () => ws,
                getUserToken: () => USER_TOKEN,
                setUserToken: (value) => { USER_TOKEN = value; },
                setWsReadyForMessages: (value) => { wsReadyForMessages = value; },
                setConnectionInProgress: (value) => { connectionInProgress = value; },
                getWsConnectAttempts: () => window._wsConnectAttempts || 0,
                setWsConnectAttempts: (value) => { window._wsConnectAttempts = value; }
            });
        } else {
            console.error('[WS] installRhodesWsHelpers is missing');
        }

        // Admin-only: show injection debug popup in top-right corner
        function showInjectionDebug(data) {
            if (!window.RHODES_CONFIG || !window.RHODES_CONFIG.isAdmin) return;

            // Remove any existing injection popup
            const existing = document.getElementById('injection-debug-popup');
            if (existing) existing.remove();

            const popup = document.createElement('div');
            popup.id = 'injection-debug-popup';
            popup.style.cssText = 'position:fixed;top:12px;right:12px;background:#0d1117;border:1px solid #00ffd5;border-radius:6px;padding:12px 16px;z-index:10001;font-family:"Share Tech Mono",monospace;font-size:12px;color:#c9d1d9;max-width:360px;box-shadow:0 0 20px rgba(0,255,213,0.15);';

            let html = '<div style="color:#00ffd5;font-weight:bold;margin-bottom:6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;">INJECTION DEBUG</div>';

            if (data.gate) {
                const color = data.post_gate < data.pre_gate ? '#ff6b6b' : '#00ff41';
                html += '<div style="color:#8b949e;margin-bottom:4px;">Gate: <span style="color:#00ffd5;">' + data.gate + '</span> (' + (data.gate_ms || '?') + 'ms) &mdash; ' + '<span style="color:' + color + ';">' + data.post_gate + '/' + data.pre_gate + ' passed</span></div>';
            }

            html += '<div style="color:#8b949e;margin-bottom:6px;">' + data.total_candidates + ' candidates above threshold</div>';

            if (data.injected && data.injected.length > 0) {
                data.injected.forEach(function(item) {
                    const title = item.title || item.id;
                    const short = title.length > 45 ? title.substring(0, 42) + '...' : title;
                    html += '<div style="margin:4px 0;padding:4px 6px;background:#161b22;border-left:2px solid #00ffd5;border-radius:2px;">';
                    html += '<div style="color:#e6edf3;" title="' + title.replace(/"/g, '&quot;') + '">' + short + '</div>';
                    html += '<div style="color:#8b949e;font-size:10px;">' + item.domain + ' &bull; sim=' + item.sim + ' &bull; boost=' + item.boosted + '</div>';
                    html += '</div>';
                });
            } else {
                html += '<div style="color:#ff6b6b;">No articles injected</div>';
            }

            popup.innerHTML = html;

            // Click to dismiss
            popup.addEventListener('click', function() { popup.remove(); });

            // Auto-dismiss after 8 seconds
            setTimeout(function() { if (popup.parentNode) popup.remove(); }, 8000);

            document.body.appendChild(popup);
        }

        // Toggle debug panel and show info
        function toggleDebugPanel() {
            const panel = document.getElementById('debug-panel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
            showDebugInfo();
        }
        
        // Debug info display
        function showDebugInfo() {
            console.log('=== DEBUG INFO ===');
            console.log('WebSocket:', ws);
            console.log('WebSocket readyState:', ws ? ws.readyState : 'no ws');
            console.log('SERVER:', SERVER);
            console.log('TOKEN length:', TOKEN ? (TOKEN || "").length : 0);
            console.log('USER_TOKEN length:', USER_TOKEN ? (USER_TOKEN || "").length : 0);
            console.log('IS_GUEST:', IS_GUEST);
            console.log('GUEST_MESSAGES_REMAINING:', GUEST_MESSAGES_REMAINING);
            console.log('CURRENT_USERNAME:', CURRENT_USERNAME);
            console.log('sharedQA:', sharedQA);
            console.log('wantsNewRhodes:', wantsNewRhodes);
            console.log('autoGuestAttempted:', autoGuestAttempted);
            console.log('================');
            
            // Test connection
            testWebSocketConnection();
        }
        
        // Test WebSocket connection independently
        function testWebSocketConnection() {
            console.log('=== CONNECTION TEST ===');
            console.log('Testing connection to:', SERVER);
            
            const testWs = new WebSocket(SERVER);
            testWs.onopen = () => {
                console.log('✅ TEST SUCCESS: WebSocket opened');
                testWs.close();
            };
            testWs.onerror = (error) => {
                console.log('❌ TEST FAILED: WebSocket error:', error);
            };
            testWs.onclose = (event) => {
                console.log('TEST WebSocket closed:', event.code, event.reason);
            };
            
            // Timeout after 3 seconds
            setTimeout(() => {
                if (testWs.readyState === WebSocket.CONNECTING) {
                    console.log('⚠️ TEST TIMEOUT: WebSocket stuck in CONNECTING state');
                    testWs.close();
                }
            }, 3000);
        }


        if (typeof window.installRhodesShareUi === 'function') {
            window.installRhodesShareUi({ showToast });
        } else {
            console.error('[SHARE] installRhodesShareUi is missing');
            const shareUnavailable = () => showToast('Share UI unavailable - reload required');
            window.showShareOptions = window.showShareOptions || shareUnavailable;
            window.shareFullConversation = window.shareFullConversation || shareUnavailable;
            window.shareConversationUntil = window.shareConversationUntil || shareUnavailable;
            window.shareQA = window.shareQA || shareUnavailable;
        }

        const chat = document.getElementById('chat');
        const input = document.getElementById('input');
        if (input) input.addEventListener('input', function(){var v=input.value;if(!v)return;var u=v[0].toUpperCase();if(v[0]===u)return;var a=input.selectionStart,b=input.selectionEnd;input.value=u+v.slice(1);if(a!==null&&b!==null)input.setSelectionRange(a,b);});
        // ⚠️ DO NOT REMOVE: Critical send button reference for JavaScript event binding
        const sendBtn = document.getElementById('send');
        const status = document.getElementById('status');
        const authModal = document.getElementById('auth-modal');
        const limitModal = document.getElementById('limit-modal');
        const serverInput = document.getElementById('server-input');
        const tokenInput = document.getElementById('token-input');
        const connectBtn = document.getElementById('connect-btn');
        const downloadsPanel = document.getElementById('downloads-panel');

                function updateIntroCentering() {
                    const intro = chat ? chat.querySelector('[data-intro="1"]') : null;
                    if (!chat) return;
                    if (!intro) {
                        chat.classList.remove('intro-center');
                        return;
                    }
                    if (chat.children.length === 1) chat.classList.add('intro-center');
                    else chat.classList.remove('intro-center');
                }
                updateIntroCentering();

	        // Auth tab switching
	        document.querySelectorAll('.auth-tab').forEach(tab => {
	            tab.onclick = () => {
                document.querySelectorAll('.auth-tab').forEach(t => {
                    t.style.borderColor = 'var(--dim)';
                    t.style.color = 'var(--dim)';
                    t.classList.remove('active');
                });
                tab.style.borderColor = 'var(--green)';
                tab.style.color = 'var(--green)';
                tab.classList.add('active');

                document.querySelectorAll('.auth-tab-content').forEach(c => c.style.display = 'none');
                document.getElementById('tab-' + tab.dataset.tab).style.display = 'block';
	            };
	        });

	        // Auth: pressing Enter submits the active action
	        const bindEnterToClick = (inputId, buttonId) => {
	            const inputEl = document.getElementById(inputId);
	            const buttonEl = document.getElementById(buttonId);
	            if (!inputEl || !buttonEl) return;
	            inputEl.addEventListener('keydown', (e) => {
	                if (e.key === 'Enter') {
	                    e.preventDefault();
	                    buttonEl.click();
	                }
	            });
	        };
	        ['login-username', 'login-password'].forEach((id) => bindEnterToClick(id, 'login-btn'));
	        ['reg-username', 'reg-email', 'reg-password'].forEach((id) => bindEnterToClick(id, 'register-btn'));
	        ['reset-email'].forEach((id) => bindEnterToClick(id, 'reset-request-btn'));
	        ['reset-token', 'reset-new-password', 'reset-new-password2'].forEach((id) => bindEnterToClick(id, 'reset-complete-btn'));

        // Guest connect
        const guestConnectBtn = document.getElementById('guest-connect-btn');
        if (guestConnectBtn) {
            guestConnectBtn.onclick = () => {
                console.log('Guest connect clicked');
                TOKEN = '';
                USER_TOKEN = '';
                rhodesStorage.removeItem('rhodes_server');
                SERVER = defaultServer;
                console.log('Reset SERVER to:', SERVER);
                connect();
            };
            console.log('Guest connect button handler attached');
        } else {
            console.error('Guest connect button not found');
        }

        // Registration
        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) {
            registerBtn.onclick = async () => {
                const username = document.getElementById('reg-username').value.trim();
                const email = document.getElementById('reg-email').value.trim();
                const password = document.getElementById('reg-password').value;
                const errorEl = document.getElementById('reg-error');

                if (!username || !password) {
                    errorEl.textContent = 'Username and password required';
                    errorEl.style.display = 'block';
                    return;
                }

                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        msg_type: 'register_request',
                        msg_id: generateUUID(),
                        timestamp: new Date().toISOString(),
                        payload: { username, email, password }
                    }));
                } else {
                    errorEl.textContent = 'Not connected to server';
                    errorEl.style.display = 'block';
                }
            };
            console.log('Register button handler attached');
        } else {
            console.error('Register button not found');
        }

        // Login
        // Login
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.onclick = async () => {
                window.__lastAuthAttempt = 'password';
                const username = document.getElementById('login-username').value.trim();
                const password = document.getElementById('login-password').value;
                const errorEl = document.getElementById('login-error');

                if (!username || !password) {
                    errorEl.textContent = 'Username and password required';
                    errorEl.style.display = 'block';
                    return;
                }

                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        msg_type: 'login_request',
                        msg_id: generateUUID(),
                        timestamp: new Date().toISOString(),
                        payload: { username, password }
                    }));
                } else {
                    errorEl.textContent = 'Not connected to server';
                    errorEl.style.display = 'block';
                }
            };
            console.log('Login button handler attached');
        } else {
            console.error('Login button not found');
        }

        // Password reset (request)
        const resetRequestBtn = document.getElementById('reset-request-btn');
        if (resetRequestBtn) {
            resetRequestBtn.onclick = async () => {
                const email = (document.getElementById('reset-email')?.value || '').trim();
                const errorEl = document.getElementById('reset-error');
                const infoEl = document.getElementById('reset-info');
                if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
                if (infoEl) { infoEl.style.display = 'none'; infoEl.textContent = ''; }

                if (!email || !email.includes('@')) {
                    if (errorEl) {
                        errorEl.textContent = 'Email required';
                        errorEl.style.display = 'block';
                    }
                    return;
                }

                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        msg_type: 'password_reset_request',
                        msg_id: generateUUID(),
                        timestamp: new Date().toISOString(),
                        payload: { email }
                    }));
                    if (infoEl) {
                        infoEl.textContent = 'Request sent. If that email exists, a reset link will be sent.';
                        infoEl.style.display = 'block';
                    }
                } else {
                    if (errorEl) {
                        errorEl.textContent = 'Not connected to server';
                        errorEl.style.display = 'block';
                    }
                }
            };
        }

        // Password reset (complete)
        const resetCompleteBtn = document.getElementById('reset-complete-btn');
        if (resetCompleteBtn) {
            resetCompleteBtn.onclick = async () => {
                const token = (document.getElementById('reset-token')?.value || '').trim();
                const newPassword = (document.getElementById('reset-new-password')?.value || '');
                const newPassword2 = (document.getElementById('reset-new-password2')?.value || '');
                const errorEl = document.getElementById('reset-error');
                const infoEl = document.getElementById('reset-info');
                if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
                if (infoEl) { infoEl.style.display = 'none'; infoEl.textContent = ''; }

                if (!token) {
                    if (errorEl) { errorEl.textContent = 'Token required'; errorEl.style.display = 'block'; }
                    return;
                }
                if (!newPassword || newPassword.length < 8) {
                    if (errorEl) { errorEl.textContent = 'Password must be at least 8 characters'; errorEl.style.display = 'block'; }
                    return;
                }
                if (newPassword !== newPassword2) {
                    if (errorEl) { errorEl.textContent = 'Passwords do not match'; errorEl.style.display = 'block'; }
                    return;
                }

                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        msg_type: 'password_reset_complete',
                        msg_id: generateUUID(),
                        timestamp: new Date().toISOString(),
                        payload: { token, password: newPassword }
                    }));
                    if (infoEl) {
                        infoEl.textContent = 'Submitting new password...';
                        infoEl.style.display = 'block';
                    }
                } else {
                    if (errorEl) {
                        errorEl.textContent = 'Not connected to server';
                        errorEl.style.display = 'block';
                    }
                }
            };
        }

        // Limit modal buttons
        const limitRegisterBtn = document.getElementById('limit-register-btn');
        if (limitRegisterBtn) limitRegisterBtn.onclick = () => {
            limitModal.style.display = 'none';
            authModal.style.display = 'flex';
            document.querySelector('[data-tab="register"]').click();
        };
        const limitLoginBtn = document.getElementById('limit-login-btn');
        if (limitLoginBtn) limitLoginBtn.onclick = () => {
            limitModal.style.display = 'none';
            authModal.style.display = 'flex';
            document.querySelector('[data-tab="login"]').click();
        };

        // Downloads link - now goes to /download/ page directly
        // (old popup panel code removed)
        const closeDownloads = document.getElementById('close-downloads');
        if (closeDownloads) {
            closeDownloads.onclick = () => {
                downloadsPanel.classList.remove('show');
            };
        }

        // Courses panel
        const coursesPanel = document.getElementById('courses-panel');

        // Nav item switching - moves the underscore indicator
        function setActiveNav(navId) {
            document.querySelectorAll('.nav .nav-item').forEach(item => item.classList.remove('active'));
            const target = document.getElementById(navId);
            if (target) target.classList.add('active');
        }

        // Terminal link - switch back to terminal view
        const chatLink = document.getElementById('chat-link');
        if (chatLink) chatLink.onclick = (e) => {
            e.preventDefault();
            coursesPanel.classList.remove('show');
            setActiveNav('chat-link');
        };

        // "All Courses..." opens the full panel
        const allCoursesLink = document.getElementById('all-courses-link');
        if (allCoursesLink) allCoursesLink.onclick = (e) => {
            e.preventDefault();
            coursesPanel.classList.add('show');
            setActiveNav('courses-link');
        };
        // Main link also opens panel
        const coursesLink = document.getElementById('courses-link');
        if (coursesLink) coursesLink.onclick = (e) => {
            e.preventDefault();
            coursesPanel.classList.add('show');
            setActiveNav('courses-link');
        };
        const closeCoursesBtn = document.getElementById('close-courses');
        if (closeCoursesBtn) closeCoursesBtn.onclick = () => {
            coursesPanel.classList.remove('show');
            setActiveNav('chat-link');
        };

        // Theme toggle (light/dark mode)
        const themeToggle = document.getElementById('theme-toggle');
        if (rhodesStorage.getItem('rhodes-theme') === 'light') {
            document.body.classList.add('light-mode');
            themeToggle.textContent = '🌙';
        }
        themeToggle.onclick = (e) => {
            e.preventDefault();
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            themeToggle.textContent = isLight ? '🌙' : '☀️';
            rhodesStorage.setItem('rhodes-theme', isLight ? 'light' : 'dark');
        };


        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        // Format duration in human-readable form (seconds or minutes)
        function formatDuration(ms) {
            const seconds = ms / 1000;
            if (seconds < 60) {
                return seconds.toFixed(1) + "s";
            } else {
                const minutes = seconds / 60;
                return minutes.toFixed(1) + "m";
            }
        }
        // Tool call tracking maps
        window._toolTimers = window._toolTimers || new Map();
        window._toolItems = window._toolItems || new Map();

        // Collapse (finalize) the current tool call log so the next AI message
        // or tool call group appears BELOW it in chronological order.
        function collapseToolCalls() {
            if (window.toolLogEl) {
                window.toolLogEl.classList.add('tool-log-collapsed');
                window.toolLogEl = null;
                // Preserve running items so tool dot transitions work across collapses
                const preserved = new Map();
                for (const [k, v] of window._toolItems) {
                    if (v.lastStatus && v.lastStatus !== 'complete') {
                        preserved.set(k, v);
                    }
                }
                window._toolItems = preserved;
            }
        }

        function setStatus(online, text) {
            status.textContent = (online ? '●' : '○') + ' ' + text;
            status.style.color = online ? '#00ff41' : '#ff4141';
        }

        function updateGuestStatus() {
            if (IS_GUEST && GUEST_MESSAGES_REMAINING > 0) {
                status.textContent = `● GUEST (${GUEST_MESSAGES_REMAINING} msgs left)`;
                status.style.color = '#00ff41';
            }
        }

        // Auth/account handlers are installed from rhodes-auth.js.
        function showAuthTab(tabName) {
            if (typeof window.showAuthTab === 'function' && window.showAuthTab !== showAuthTab) {
                return window.showAuthTab(tabName);
            }
        }

        function updateHeaderAuth() {
            if (typeof window.updateHeaderAuth === 'function' && window.updateHeaderAuth !== updateHeaderAuth) {
                return window.updateHeaderAuth();
            }
        }

        async function checkAdminStatus() {
            if (typeof window.checkAdminStatus === 'function' && window.checkAdminStatus !== checkAdminStatus) {
                return window.checkAdminStatus();
            }
        }

        function logout() {
            if (typeof window.logout === 'function' && window.logout !== logout) {
                return window.logout();
            }
            showToast('Auth UI unavailable - reload required');
        }

        if (typeof window.installRhodesAuthUi === 'function') {
            window.installRhodesAuthUi({
                rhodesStorage,
                connect,
                addMsg,
                getWs: () => ws,
                getUserToken: () => USER_TOKEN,
                setUserToken: (value) => { USER_TOKEN = value; },
                setToken: (value) => { TOKEN = value; },
                isGuest: () => IS_GUEST,
                setIsGuest: (value) => { IS_GUEST = value; },
                getCurrentUsername: () => CURRENT_USERNAME,
                setCurrentUsername: (value) => { CURRENT_USERNAME = value; }
            });
        } else {
            console.error('[AUTH] installRhodesAuthUi is missing');
            window.showAuthTab = window.showAuthTab || function(tabName) {
                authModal.style.display = 'flex';
                const tabEl = document.querySelector('[data-tab="' + tabName + '"]');
                if (tabEl) tabEl.click();
            };
            window.updateHeaderAuth = window.updateHeaderAuth || function() {};
            window.checkAdminStatus = window.checkAdminStatus || (async function() {});
            window.logout = window.logout || function() {
                showToast('Auth UI unavailable - reload required');
            };
        }

        let lastUserMessage = '';  // Track for Q&A sharing

        // Outbound queue: if WS is not ready, queue messages and flush after auth.
        let wsReadyForMessages = false;
        const outboundQueue = [];
        function queueOutboundMessage(messageObj) {
            outboundQueue.push(messageObj);
        }
        function flushOutboundQueue() {
            if (!ws || ws.readyState !== WebSocket.OPEN || !wsReadyForMessages) return;
            // Collapse any tool display before flushing queued messages
            if (outboundQueue.length > 0 && typeof collapseToolCalls === 'function') {
                collapseToolCalls();
            }
            while (outboundQueue.length > 0) {
                const m = outboundQueue.shift();
                try {
                    ws.send(JSON.stringify(m));
                } catch (e) {
                    outboundQueue.unshift(m);
                    break;
                }
            }
        }

        // Shared formatter for user/AI message bodies in the main chat pane.
        function stripActionBlocks(text) {
            return String(text || '')
                .replace(/\[RHODES_ACTION:\s*\w+\][\s\S]*?\[\/RHODES_ACTION\]/gi, '')
                .replace(/\[CLIENT_COMMAND:\s*\w+\][\s\S]*?\[\/CLIENT_COMMAND\]/gi, '');
        }

        function extractYouTubeId(url) {
            const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            return m ? m[1] : null;
        }

        function renderMediaEmbeds(text) {
            // YouTube URLs -> embedded player
            text = text.replace(/(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?[^\s]*v=|embed\/|v\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_?&=.%+-]+)/gi, (match, url) => {
                const videoId = extractYouTubeId(url);
                if (!videoId) return match;
                return `<div class="rhodes-media-embed"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
            });
            // Direct video URLs -> HTML5 video player
            text = text.replace(/(https?:\/\/[^\s<>"]+\.(?:mp4|webm|ogg|mov)(?:\?[^\s<>"]*)?)/gi, (match, url) => {
                return `<div class="rhodes-media-embed"><video controls preload="metadata" src="${url}"></video></div>`;
            });
            // Direct audio URLs -> HTML5 audio player
            text = text.replace(/(https?:\/\/[^\s<>"]+\.(?:mp3|wav|flac|m4a|aac|ogg)(?:\?[^\s<>"]*)?)/gi, (match, url) => {
                if (match.includes('</video>')) return match;
                return `<div class="rhodes-media-embed rhodes-audio-embed"><audio controls preload="metadata" src="${url}"></audio></div>`;
            });
            // [MEDIA:url] tag for Rhodes to share media explicitly
            text = text.replace(/\[MEDIA:([^\]]+)\]/gi, (match, url) => {
                const lower = url.toLowerCase();
                const ytId = extractYouTubeId(url);
                if (ytId) {
                    return `<div class="rhodes-media-embed"><iframe src="https://www.youtube-nocookie.com/embed/${ytId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
                }
                if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(lower)) {
                    return `<div class="rhodes-media-embed"><video controls preload="metadata" src="${url}"></video></div>`;
                }
                if (/\.(mp3|wav|flac|m4a|aac)(\?.*)?$/i.test(lower)) {
                    return `<div class="rhodes-media-embed rhodes-audio-embed"><audio controls preload="metadata" src="${url}"></audio></div>`;
                }
                return match;
            });
            return text;
        }

        function trimTrailingUrlPunctuation(url) {
            return (url || '').replace(/[),.;!?]+$/g, '');
        }

        function isEmbeddableUserSiteUrl(url) {
            var clean = trimTrailingUrlPunctuation(url);
            if (!clean) return false;
            try {
                var parsed = new URL(clean, window.location.origin);
                var pathname = (parsed.pathname || '').toLowerCase();
                if (!pathname.startsWith('/user-sites/')) return false;
                if (pathname.endsWith('/')) return false;
                var leaf = pathname.substring(pathname.lastIndexOf('/') + 1);
                if (!leaf) return false;
                return /\.(html?|xhtml|svg)$/.test(leaf);
            } catch (e) {
                return false;
            }
        }

        function renderVncAndSiteEmbeds(html) {
            // VNC session URLs -> embedded iframe viewer (not just a clickable link)
            html = html.replace(/(?<!="|'|>)(https?:\/\/[^\s<>"'`]*?cli-vnc\/\d+\/vnc(?:_lite)?\.html[^\s<>"'`]*)/gi, function(match, url) {
                var safeUrl = url.replace(/'/g, "\\'");
                return '<div class="rhodes-vnc-embed" style="margin:12px 0;border:1px solid var(--green);border-radius:6px;overflow:hidden;background:var(--panel);">' +
                    '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:rgba(0,255,65,0.08);border-bottom:1px solid var(--green);">' +
                        '<span style="color:var(--green);font-family:Orbitron,monospace;font-size:12px;">VNC SESSION</span>' +
                        '<span style="display:flex;gap:8px;">' +
                            '<button onclick="window.open(\'' + safeUrl + '\',\'rhodes_vnc\',\'width=1024,height=768,menubar=no,toolbar=no\')" style="background:var(--panel);border:1px solid var(--cyan);color:var(--cyan);padding:3px 10px;cursor:pointer;font-family:Orbitron,monospace;font-size:10px;border-radius:3px;">Pop Out</button>' +
                            '<button onclick="this.closest(\'.rhodes-vnc-embed\').style.display=\'none\'" style="background:var(--panel);border:1px solid var(--dim);color:var(--dim);padding:3px 10px;cursor:pointer;font-family:Orbitron,monospace;font-size:10px;border-radius:3px;">Close</button>' +
                        '</span>' +
                    '</div>' +
                    '<iframe src="' + url + '" style="width:100%;height:650px;border:none;background:#000;" allow="clipboard-read;clipboard-write" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'" onload="var d=this;setTimeout(function(){try{d.contentDocument}catch(e){d.style.display=\'none\';d.nextElementSibling.style.display=\'block\';}},3000)"></iframe>' +
                    '<div style="display:none;padding:16px;text-align:center;color:var(--dim);font-size:12px;">VNC session may have expired. <a href="' + url + '" target="_blank" style="color:var(--cyan);">Open in new tab</a></div>' +
                '</div>';
            });
            // Catch-all: any rhodesagi.com VNC URL -> embedded iframe
            html = html.replace(/(?<!="|'|>)(https?:\/\/rhodesagi\.com\/sites\/[^\s<>"'`]*vnc[^\s<>"'`]*)/gi, function(match, url) {
                return '<div class="rhodes-vnc-embed" style="margin:12px 0;border:1px solid var(--green);border-radius:6px;overflow:hidden;background:var(--panel);">' +
                    '<div style="padding:6px 12px;display:flex;justify-content:space-between;align-items:center;background:rgba(0,255,65,0.08);">' +
                    '<span style="color:var(--green);font-size:11px;font-family:Orbitron,monospace;">VNC Session</span>' +
                    '<span><button onclick="window.open(\'' + url.replace(/'/g, "\\'") + '\',\'rhodes_vnc\',\'width=1024,height=768\')" style="background:none;border:1px solid var(--green);color:var(--green);padding:2px 8px;cursor:pointer;font-size:10px;margin-right:6px;border-radius:3px;">Pop Out</button>' +
                    '<button onclick="this.closest(\'.rhodes-vnc-embed\').remove()" style="background:none;border:1px solid var(--red,#f55);color:var(--red,#f55);padding:2px 8px;cursor:pointer;font-size:10px;border-radius:3px;">Close</button></span></div>' +
                    '<iframe src="' + url + '" style="width:100%;height:650px;border:none;background:#000;" allow="clipboard-read; clipboard-write" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe></div>';
            });
            // User-site/sandbox URLs -> embedded iframe preview
            html = html.replace(/(?<!="|'|>)(https?:\/\/rhodesagi\.com\/user-sites\/[^\s<>"'`\)\]]+)/gi, function(match, rawUrl) {
                var url = trimTrailingUrlPunctuation(rawUrl);
                if (!url) return match;
                var shortName = url.replace(/https?:\/\/rhodesagi\.com\/user-sites\//, '');
                var cardHeader =
                    '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:rgba(0,191,255,0.08);border-bottom:1px solid var(--cyan);">' +
                        '<a href="' + url + '" target="_blank" rel="noopener" style="color:var(--cyan);font-family:Orbitron,monospace;font-size:11px;text-decoration:underline;max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + shortName + '</a>' +
                        '<span style="display:flex;gap:8px;">' +
                            '<button onclick="window.open(\'' + url.replace(/'/g, "\\'") + '\',\'_blank\')" style="background:var(--panel);border:1px solid var(--cyan);color:var(--cyan);padding:3px 10px;cursor:pointer;font-family:Orbitron,monospace;font-size:10px;border-radius:3px;">Open Tab</button>' +
                            '<button onclick="this.closest(\'.rhodes-site-embed\').style.display=\'none\'" style="background:var(--panel);border:1px solid var(--dim);color:var(--dim);padding:3px 10px;cursor:pointer;font-family:Orbitron,monospace;font-size:10px;border-radius:3px;">Close</button>' +
                        '</span>' +
                    '</div>';
                if (!isEmbeddableUserSiteUrl(url)) {
                    return '<div class="rhodes-site-embed" style="margin:12px 0;border:1px solid var(--cyan);border-radius:6px;overflow:hidden;background:var(--panel);">' +
                        cardHeader +
                        '<div style="padding:10px 12px;color:var(--dim);font-size:11px;">Preview disabled for non-web files. Open in a new tab to download or inspect.</div>' +
                    '</div>';
                }
                return '<div class="rhodes-site-embed" style="margin:12px 0;border:1px solid var(--cyan);border-radius:6px;overflow:hidden;background:var(--panel);">' +
                    cardHeader +
                    '<iframe src="' + url + '" style="width:100%;height:400px;border:none;background:#fff;" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>' +
                '</div>';
            });
            return html;
        }

        function linkifyUrls(html) {
            // 1. Markdown links: [text](url)
            html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+?)(?:\*\*|')?\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;">$1</a>');
            // 2. Bare URLs with protocol (not already in href="...")
            html = html.replace(/(?<!="|\'|>)(https?:\/\/[^\s<>"'`\)\]]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;">$1</a>');
            // 3. rhodesagi.com URLs without protocol (with path)
            html = html.replace(/(^|[\s>])(rhodesagi\.com\/[^\s<>"'`\)\]]*)/g, '$1<a href="https://$2" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;">$2</a>');
            // 4. Bare rhodesagi.com (no path)
            html = html.replace(/(^|[\s>])(rhodesagi\.com)(?=[\s<,.]|$)/g, '$1<a href="https://$2" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;">$2</a>');
            return html;
        }

        function renderMessageHtml(cleanText) {
            let html = renderMediaEmbeds(cleanText
                .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre>$2</pre>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\*\*(https?:\/\/[^\s*]+)\*\*/g, '$1')
                .replace(/'(https?:\/\/[^\s']+)'/g, '$1')
                .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
                .replace(/(?<![*])\*([^*]+?)\*(?![*])/g, '<em>$1</em>')
                // [DOWNLOAD:filename.exe] -> download button
                .replace(/\[DOWNLOAD:([^\]]+)\]/g, (match, filename) => {
                    const ext = filename.split('.').pop().toLowerCase();
                    const names = {
                        'exe': 'Windows', 'pyw': 'Windows', 'msi': 'Windows',
                        'sh': 'Linux', 'AppImage': 'Linux', 'deb': 'Linux',
                        'command': 'macOS', 'app': 'macOS', 'dmg': 'macOS',
                        'zip': 'Archive', 'crx': 'Chrome Extension'
                    };
                    const label = names[ext] || ext.toUpperCase();
                    return `<a href="${filename}" download class="dl-btn" style="display:inline-flex;align-items:center;gap:8px;background:var(--panel);border:1px solid var(--green);color:var(--green);padding:8px 14px;text-decoration:none;margin:4px 0;font-family:'Orbitron',monospace;font-size:14px;"><span style="color:var(--cyan);">[↓]</span> ${label} - ${filename}</a>`;
                })
                // [DOWNLOAD_SITE:filename.html]```html...```[/DOWNLOAD_SITE] -> preview + download buttons
                .replace(/\[DOWNLOAD_SITE:([^\]]+)\]\s*```(?:html)?\s*([\s\S]*?)```\s*\[\/DOWNLOAD_SITE\]/gi, (match, filename, content) => {
                    const escapedContent = content.trim();
                    const id = 'dl_' + Math.random().toString(36).substr(2, 9);
                    // Store content in a hidden element for preview/download
                    return `<div style="margin:8px 0;">
                        <button onclick="openPreview('${id}')" class="dl-btn preview-btn" style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;cursor:pointer;font-family:'Orbitron',monospace;font-size:14px;">
                            <span>👁</span> Preview - ${filename}
                        </button>
                        <button onclick="downloadSiteContent('${id}')" class="dl-btn" style="display:inline-flex;align-items:center;gap:8px;background:var(--panel);border:1px solid var(--magenta);color:var(--magenta);padding:10px 16px;cursor:pointer;font-family:'Orbitron',monospace;font-size:14px;">
                            <span style="color:var(--cyan);">[↓]</span> Download
                        </button>
                        <textarea id="${id}" style="display:none;" data-filename="${filename}">${escapedContent.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>
                    </div>`;
                })
                .replace(/\n/g, '<br>'));
            html = renderVncAndSiteEmbeds(html);
            return linkifyUrls(html);

        }


        function addMsg(role, text, skipShare = false, responseTimeLabel = '') {
            if (chat) chat.classList.remove('intro-center');
            const div = document.createElement('div');
            const hasUsedVoice = rhodesStorage.getItem('hasUsedVoice');
            div.className = 'msg ' + role + (hasUsedVoice ? ' with-avatar' : '');
            if (role === 'ai' && responseTimeLabel) div.classList.add('has-response-time');

            // Track user messages for Q&A pairing
            if (role === 'user') {
                lastUserMessage = text;
            }
            const cleanText = stripActionBlocks(text);
            const htmlContent = renderMessageHtml(cleanText);

            // Add share button for AI messages (Q&A pairs)
            let shareBtn = '';
            if (role === 'ai' && lastUserMessage && !skipShare) {
                const qaId = 'qa_' + Math.random().toString(36).substr(2, 9);
                div.dataset.qaId = qaId;
                div.dataset.question = lastUserMessage;
                div.dataset.answer = cleanText;
                shareBtn = `<button class="qa-share-btn" onclick="showShareOptions('${qaId}')" title="Share this Q&A">SHARE</button>`;
            }

            // Add avatar if voice has been used
            if (hasUsedVoice) {
                // Mini Rhodes portrait - condensed scary braille face
                const rhodesIcon = `⣿⣿⣿⣿⣿
⣿⬤⣿⬤⣿
⣿⣿▄⣿⣿
⣿═══⣿
⣿⣿⣿⣿⣿`;
                const avatar = role === 'ai' ? rhodesIcon : '●';
                const avatarClass = role === 'ai' ? 'msg-avatar rhodes' : 'msg-avatar';
                div.innerHTML = `<div class="${avatarClass}">${avatar}</div><div class="msg-content">${htmlContent}</div>${shareBtn}`;
            } else {
                div.innerHTML = htmlContent + shareBtn;
            }

            if (role === 'ai' && responseTimeLabel) {
                const timeEl = document.createElement('span');
                timeEl.className = 'msg-response-time';
                timeEl.textContent = ' (' + responseTimeLabel + ')';
                div.appendChild(timeEl);
            }

            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
            updateIntroCentering();
            return div;
        }

        // Admin-only: append DeepSeek reasoning/thinking as a collapsible block (server-gated).
        function attachDebugReasoning(msgDiv, reasoningText) {
            console.log("[DEBUG] attachDebugReasoning called, msgDiv:", !!msgDiv, "reasoningText len:", reasoningText ? reasoningText.length : 0);
            try {
                if (!msgDiv || !reasoningText) { console.log("[DEBUG] attachDebugReasoning early return - msgDiv:", !!msgDiv, "reasoningText:", !!reasoningText); return; }
                const details = document.createElement('details');
                details.className = 'debug-reasoning';
                details.style.marginTop = '10px';
                details.style.borderTop = '1px solid rgba(0,255,213,0.25)';
                details.style.paddingTop = '8px';

                const summary = document.createElement('summary');
                summary.textContent = 'Reasoning (admin)';
                summary.style.cursor = 'pointer';
                summary.style.color = 'var(--cyan)';
                summary.style.fontFamily = "'Orbitron', monospace";
                summary.style.fontSize = '12px';

                const pre = document.createElement('pre');
                pre.textContent = String(reasoningText);
                pre.style.whiteSpace = 'pre-wrap';
                pre.style.margin = '8px 0 0 0';
                pre.style.padding = '10px';
                pre.style.background = 'rgba(0,0,0,0.35)';
                pre.style.border = '1px solid rgba(255,0,255,0.25)';
                pre.style.borderRadius = '6px';
                pre.style.color = 'var(--text)';
                pre.style.fontSize = '12px';
                pre.style.lineHeight = '1.4';

                details.appendChild(summary);
                details.appendChild(pre);
                (msgDiv.querySelector(".msg-content") || msgDiv).appendChild(details);
            } catch (e) {}
        }

        // Add screenshot to chat (from Delta's browser actions)
        function addScreenshotToChat(filename) {
            if (chat) chat.classList.remove('intro-center');
            const div = document.createElement('div');
            div.className = 'msg screenshot-msg';
            div.innerHTML = `
                <div class="screenshot-container">
                    <div class="screenshot-header">
                        <span class="screenshot-icon">📸</span>
                        <span class="screenshot-label">Delta Vision</span>
                        <button class="screenshot-nav" onclick="this.parentElement.parentElement.classList.toggle('expanded')">⤢</button>
                    </div>
                    <img src="/screenshots/${filename}" alt="Screenshot" class="screenshot-img" onclick="window.open('/screenshots/${filename}', '_blank')">
                </div>
            `;
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
            updateIntroCentering();
        }

        // Streaming message functions
        function addMsgStreaming(role, text) {
            if (chat) chat.classList.remove('intro-center');
            const div = document.createElement('div');
            div.className = 'msg ' + role + ' streaming';
            div.innerHTML = '<span class="streaming-cursor">▌</span>';
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
            updateIntroCentering();
            return div;
        }

        function updateStreamingMsg(el, text) {
            if (!el) return;
            // Strip action blocks (server-side commands that shouldn't be shown)
            let cleanText = text
                .replace(/\[RHODES_ACTION:\s*\w+\][\s\S]*?\[\/RHODES_ACTION\]/gi, '')
                .replace(/\[CLIENT_COMMAND:\s*\w+\][\s\S]*?\[\/CLIENT_COMMAND\]/gi, '')
                // Also hide partial/incomplete action blocks being streamed
                .replace(/\[RHODES_ACTION:[^\]]*$/i, '')
                .replace(/\[CLIENT_COMMAND:[^\]]*$/i, '');
            // Simple text update with cursor
            const formatted = linkifyUrls(renderMediaEmbeds(cleanText
                .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre>$2</pre>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\*\*(https?:\/\/[^\s*]+)\*\*/g, '$1')
                .replace(/'(https?:\/\/[^\s']+)'/g, '$1')
                .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
                .replace(/(?<![*])\*([^*]+?)\*(?![*])/g, '<em>$1</em>')
                .replace(/\n/g, '<br>')));
            el.innerHTML = formatted + '<span class="streaming-cursor">▌</span>';
            chat.scrollTop = chat.scrollHeight;
        }
