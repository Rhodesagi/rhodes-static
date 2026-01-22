// Rhodes storage wrapper - handles pywebview/webkit where localStorage throws
// This wrapper is used instead of direct localStorage access
window.rhodesStorage = (function() {
    var memoryStorage = {};
    var useMemory = false;

    // Test if localStorage actually works
    try {
        if (typeof localStorage !== 'undefined' && localStorage !== null) {
            localStorage.setItem('__rhodes_test__', '1');
            localStorage.removeItem('__rhodes_test__');
        } else {
            useMemory = true;
        }
    } catch (e) {
        useMemory = true;
    }

    if (useMemory) {
        console.log('[Rhodes] Using in-memory storage (localStorage unavailable)');
    }

    return {
        getItem: function(key) {
            if (useMemory) {
                return memoryStorage.hasOwnProperty(key) ? memoryStorage[key] : null;
            }
            try {
                return localStorage.getItem(key);
            } catch (e) {
                return memoryStorage.hasOwnProperty(key) ? memoryStorage[key] : null;
            }
        },
        setItem: function(key, value) {
            if (useMemory) {
                memoryStorage[key] = String(value);
                return;
            }
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                memoryStorage[key] = String(value);
            }
        },
        removeItem: function(key) {
            if (useMemory) {
                delete memoryStorage[key];
                return;
            }
            try {
                localStorage.removeItem(key);
            } catch (e) {
                delete memoryStorage[key];
            }
        },
        clear: function() {
            if (useMemory) {
                memoryStorage = {};
                return;
            }
            try {
                localStorage.clear();
            } catch (e) {
                memoryStorage = {};
            }
        }
    };
})();

// Session storage wrapper too
window.rhodesSessionStorage = (function() {
    var memoryStorage = {};
    var useMemory = false;

    try {
        if (typeof sessionStorage !== 'undefined' && sessionStorage !== null) {
            sessionStorage.setItem('__rhodes_test__', '1');
            sessionStorage.removeItem('__rhodes_test__');
        } else {
            useMemory = true;
        }
    } catch (e) {
        useMemory = true;
    }

    return {
        getItem: function(key) {
            if (useMemory) {
                return memoryStorage.hasOwnProperty(key) ? memoryStorage[key] : null;
            }
            try {
                return sessionStorage.getItem(key);
            } catch (e) {
                return memoryStorage.hasOwnProperty(key) ? memoryStorage[key] : null;
            }
        },
        setItem: function(key, value) {
            if (useMemory) {
                memoryStorage[key] = String(value);
                return;
            }
            try {
                sessionStorage.setItem(key, value);
            } catch (e) {
                memoryStorage[key] = String(value);
            }
        },
        removeItem: function(key) {
            if (useMemory) {
                delete memoryStorage[key];
                return;
            }
            try {
                sessionStorage.removeItem(key);
            } catch (e) {
                delete memoryStorage[key];
            }
        }
    };
})();

// \!\!\! WARNING: THIS FILE IS NOT SERVED - EDIT /var/www/html/rhodes.js INSTEAD \!\!\!
// rhodes.js v2026.01.20.0305 - Fixed duplicate messages
// Global error handling
        window.addEventListener("error", function(e) {
            // Skip empty errors (CORS-blocked or unhelpful)
            const hasError = e.error && Object.keys(e.error).length > 0;
            const hasMessage = e.message && e.message.trim().length > 0;
            if (!hasError && !hasMessage) return;
            if (e.message && e.message.includes("ResizeObserver")) return;
            console.error("RHODES Global Error:", e.error, e.message, "at", e.filename, ":", e.lineno, ":", e.colno);
            // Show visible error banner
            try {
                const errorBanner = document.createElement('div');
                errorBanner.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#ff0000;color:#fff;padding:10px;z-index:99999;font-family:monospace;font-size:12px;text-align:center;';
                errorBanner.textContent = 'An error occurred. Please refresh the page.';
                document.body.appendChild(errorBanner);
                setTimeout(() => errorBanner.remove(), 10000);
            } catch (bannerErr) {
                console.error('Failed to create error banner:', bannerErr);
            }
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', function(e) {
            console.error('RHODES Unhandled Promise Rejection:', e.reason);
            try {
                const errorBanner = document.createElement('div');
                errorBanner.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#ff5500;color:#fff;padding:10px;z-index:99999;font-family:monospace;font-size:12px;text-align:center;';
                errorBanner.textContent = 'An error occurred. Please refresh the page.';
                document.body.appendChild(errorBanner);
                setTimeout(() => errorBanner.remove(), 10000);
            } catch (bannerErr) {
                console.error('Failed to create rejection banner:', bannerErr);
            }
        });
        console.log('RHODES script starting');
        
        // ============================================
        // BROWSER & OS DETECTION
        // ============================================
        const SystemDetect = {
            ua: navigator.userAgent,
            platform: navigator.platform,

            getBrowser: function() {
                const ua = this.ua;
                // Order matters - check more specific first
                if (ua.includes('Edg/')) return { name: 'Edge', engine: 'Chromium' };
                if (ua.includes('OPR/') || ua.includes('Opera')) return { name: 'Opera', engine: 'Chromium' };
                if (ua.includes('Brave')) return { name: 'Brave', engine: 'Chromium' };
                if (ua.includes('Vivaldi')) return { name: 'Vivaldi', engine: 'Chromium' };
                if (ua.includes('Chrome/') && !ua.includes('Chromium')) return { name: 'Chrome', engine: 'Chromium' };
                if (ua.includes('Chromium')) return { name: 'Chromium', engine: 'Chromium' };
                if (ua.includes('Firefox/')) return { name: 'Firefox', engine: 'Gecko' };
                if (ua.includes('Safari/') && !ua.includes('Chrome')) return { name: 'Safari', engine: 'WebKit' };
                if (ua.includes('MSIE') || ua.includes('Trident/')) return { name: 'IE', engine: 'Trident' };
                return { name: 'Unknown', engine: 'Unknown' };
            },

            getOS: function() {
                const ua = this.ua;
                const platform = this.platform;

                // Mobile detection first
                if (/iPhone|iPad|iPod/.test(ua)) return { name: 'iOS', type: 'mobile', downloadKey: 'any' };
                if (/Android/.test(ua)) return { name: 'Android', type: 'mobile', downloadKey: 'any' };

                // Desktop detection
                if (/Win/.test(platform)) {
                    let version = 'Unknown';
                    if (ua.includes('Windows NT 10.0')) version = '10/11';
                    else if (ua.includes('Windows NT 6.3')) version = '8.1';
                    else if (ua.includes('Windows NT 6.2')) version = '8';
                    else if (ua.includes('Windows NT 6.1')) version = '7';
                    return { name: 'Windows', version: version, type: 'desktop', downloadKey: 'windows' };
                }
                if (/Mac/.test(platform)) {
                    if (/iPhone|iPad/.test(ua)) return { name: 'iOS', type: 'mobile', downloadKey: 'any' };
                    return { name: 'macOS', type: 'desktop', downloadKey: 'macos' };
                }
                if (/Linux/.test(platform)) {
                    if (/Android/.test(ua)) return { name: 'Android', type: 'mobile', downloadKey: 'any' };
                    // Detect distro hints
                    let distro = 'Unknown';
                    if (ua.includes('Ubuntu')) distro = 'Ubuntu';
                    else if (ua.includes('Fedora')) distro = 'Fedora';
                    else if (ua.includes('Debian')) distro = 'Debian';
                    return { name: 'Linux', distro: distro, type: 'desktop', downloadKey: 'linux' };
                }
                if (/CrOS/.test(ua)) return { name: 'ChromeOS', type: 'desktop', downloadKey: 'any' };
                if (/FreeBSD/.test(platform)) return { name: 'FreeBSD', type: 'desktop', downloadKey: 'linux' };

                return { name: 'Unknown', type: 'unknown', downloadKey: 'any' };
            },

            getFullInfo: function() {
                const browser = this.getBrowser();
                const os = this.getOS();
                return {
                    browser: browser,
                    os: os,
                    summary: `${browser.name} on ${os.name}${os.version ? ' ' + os.version : ''}`,
                    isMobile: os.type === 'mobile',
                    downloadKey: os.downloadKey
                };
            }
        };

        // Detect immediately
        const SYSTEM_INFO = SystemDetect.getFullInfo();

        // ============================================
        // MAIN APPLICATION
        // ============================================
        let ws = null;
        let wsEpoch = 0; // monotonically increases; ignore stale socket events
        let activeReqId = null; // last user_message msg_id we sent (for filtering late events)
        let autoGuestAttempted = false;
        let connectionInProgress = false;
        // WebSocket server selection
        // - Primary on rhodesagi.com: `wss://rhodesagi.com/ws` (Nginx → 127.0.0.1:8766)
        // - Fallback: `wss://api.rhodesagi.com` (also Nginx → 127.0.0.1:8766)
        // Incognito windows have no stored override; if one endpoint is down, auto-fallback keeps the UI usable.
        const wsProtocol = 'wss:';
        const isGitHubPages = window.location.hostname.includes('github.io');
        const isRhodesDomain = window.location.hostname.includes('rhodesagi.com');
        const RHODES_PROD_CANDIDATES = [
            'wss://rhodesagi.com/ws',
            'wss://api.rhodesagi.com'
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
        let IS_GUEST = true;
        let GUEST_MESSAGES_REMAINING = 3;
        // Guest conversations are not persisted; warn on exit once they start chatting.
        let GUEST_HAS_ACTIVITY = false;
        let CLIENT_ID = rhodesStorage.getItem('rhodes_client_id') || 'web_' + Math.random().toString(36).substr(2,6);
        let RHODES_ID = null;  // Human-readable session ID (e.g., rh-7x3k9-m2p4q)
        let CURRENT_USERNAME = null;  // Current authenticated username
        let CURRENT_ROOM_ID = null;   // Group chat room id (room_xxx) when active
        const seenRoomMsgIds = new Set(); // Deduplicate room messages across echoes/reconnects

        // Tool call display: keep a persistent per-turn log so tool calls don't vanish when streaming finalizes.
        window.toolLogEl = null;
        window._toolItems = new Map(); // toolKey -> {el, lastStatus}
        function clearToolCalls() {
            try {
                if (window.toolLogEl) window.toolLogEl.remove();
            } catch {}
            window.toolLogEl = null;
            try { window._toolItems.clear(); } catch {}
        }

        function collapseToolCalls() {
            // Collapse current tool log into a compact clickable summary
            if (!window.toolLogEl || !window._toolItems || window._toolItems.size === 0) return;

            const toolNames = [];
            window._toolItems.forEach((item, key) => {
                const name = key.split('|')[0];
                if (!toolNames.includes(name)) toolNames.push(name);
            });

            if (toolNames.length === 0) return;

            // Create collapsed summary
            let summary;
            if (toolNames.length === 1) {
                summary = toolNames[0];
            } else if (toolNames.length <= 3) {
                summary = toolNames.join(', ');
            } else {
                summary = toolNames.slice(0, 2).join(', ') + ' +' + (toolNames.length - 2) + ' more';
            }

            // Store the full content for expansion
            const fullContent = window.toolLogEl.innerHTML;
            const toolCount = window._toolItems.size;

            // Replace with collapsed view - use string concat to avoid template issues
            const collapsedHtml = '<div class="tool-collapsed" onclick="this.parentElement.classList.toggle(' + "'" + 'expanded' + "'" + ')"><span class="tool-collapsed-icon">⚡</span><span class="tool-collapsed-summary">' + escapeHtml(summary) + '</span><span class="tool-collapsed-count">(' + toolCount + ' call' + (toolCount > 1 ? 's' : '') + ')</span><span class="tool-collapsed-expand">▶</span></div><div class="tool-expanded-content">' + fullContent + '</div>';
            window.toolLogEl.innerHTML = collapsedHtml;
            window.toolLogEl.classList.add('tool-log-collapsible');

            // Reset for next batch
            window.toolLogEl = null;
            window._toolItems = new Map();
        }

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
                const msg = `Rhodes System Initialized. You have ${n} free guest message${n === 1 ? '' : 's'}. ` +
                    `<a href=\"#\" onclick=\"showAuthTab('register');return false;\" style=\"color:var(--green);text-decoration:underline;\">Create an account</a> ` +
                    `or <a href=\"#\" onclick=\"showAuthTab('login');return false;\" style=\"color:var(--cyan);text-decoration:underline;\">login</a> to continue for longer.`;
                const el = addMsg('ai', msg, true);
                if (el) el.dataset.kind = 'guest-onboarding';
            } catch {}
        }

        // Best-effort: triggers native leave-confirm for guests after they've begun chatting.
        // (Browsers ignore custom prompt text, but this still prevents accidental tab close.)
        window.addEventListener('beforeunload', (e) => {
            try {
                if (IS_GUEST && GUEST_HAS_ACTIVITY) {
                    try { showToast('Sign up or log in to save your session.'); } catch {}
                    e.preventDefault();
                    e.returnValue = '';
                    return '';
                }
            } catch {}
        });

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
        // Check URL path for /qa/{id} or /c/{id} patterns
        const pathMatch = window.location.pathname.match(/^\/qa\/([a-f0-9]{12})$/);
        const convPathMatch = window.location.pathname.match(/^\/c\/([a-f0-9]{12})$/);
        const shareQaId = pathMatch ? pathMatch[1] : urlParams.get("share_qa");  // Server-stored Q&A share
        const shareConvId = convPathMatch ? convPathMatch[1] : urlParams.get("share_conv");  // Server-stored conversation share

        // Handle shared Q&A view
        if (sharedQA) {
            try {
                const decoded = JSON.parse(atob(decodeURIComponent(sharedQA)));
                document.addEventListener('DOMContentLoaded', () => {
                    const chat = document.getElementById('chat');
                    chat.innerHTML = '';  // Clear default message
                    // Show shared Q&A
                    const qDiv = document.createElement('div');
                    qDiv.className = 'msg user';
                    qDiv.innerHTML = decoded.q.replace(/\n/g, '<br>');
                    chat.appendChild(qDiv);
                    const aDiv = document.createElement('div');
                    aDiv.className = 'msg ai';
                    aDiv.innerHTML = decoded.a.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre>$2</pre>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
                    chat.appendChild(aDiv);
                    // Update status
                    document.getElementById('status').innerHTML = '<span class="online">●</span> SHARED Q&A';
                    // Hide input
                    document.querySelector('.input-area').style.display = 'none';
                    // Add "Start new chat" button
                    const newChatBtn = document.createElement('div');
                    newChatBtn.style.cssText = 'text-align:center;padding:20px;';
                    newChatBtn.innerHTML = '<a href="/" style="color:var(--green);text-decoration:underline;">Start your own conversation →</a>';
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
                    newChatBtn.innerHTML = '<a href="/?new=1" style="color:var(--cyan);text-decoration:none;border:1px solid var(--cyan);padding:10px 20px;border-radius:8px;">Start your own conversation →</a>';
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
                            content = content.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre>$2</pre>').replace(/`([^`]+)`/g, '<code>$1</code>');
                        }
                        div.innerHTML = content.replace(/\n/g, '<br>');
                        chat.appendChild(div);
                    }
                    
                    document.getElementById('status').innerHTML = '<span class="online">●</span> SHARED CONVERSATION';
                    const inputArea = document.querySelector('.input-area') || document.getElementById('input-area');
                    if (inputArea) inputArea.style.display = 'none';
                    
                    const newChatBtn = document.createElement('div');
                    newChatBtn.style.cssText = 'text-align:center;padding:20px;';
                    newChatBtn.innerHTML = '<a href="/?new=1" style="color:var(--cyan);text-decoration:none;border:1px solid var(--cyan);padding:10px 20px;border-radius:8px;">Start your own conversation →</a>';
                    chat.appendChild(newChatBtn);
                } catch(e) {
                    console.error('Failed to load shared conversation:', e);
                    document.getElementById('chat').innerHTML = '<div style="text-align:center;padding:40px;color:var(--dim);">Conversation not found or expired</div>';
                }
            });
        }
        let TAB_ID;
        if (wantsNewRhodes) {
            // New Rhodes requested - use sessionStorage (dies when tab closes)
            TAB_ID = rhodesSessionStorage.getItem('rhodes_new_tab_id');
            if (!TAB_ID) {
                TAB_ID = 'new_' + Math.random().toString(36).substr(2,8);
                rhodesSessionStorage.setItem('rhodes_new_tab_id', TAB_ID);
            }
        } else {
            // Default - use localStorage (persists = same Rhodes always)
            TAB_ID = rhodesStorage.getItem('rhodes_tab_id');
            if (!TAB_ID) {
                TAB_ID = 'main_' + Math.random().toString(36).substr(2,8);
                rhodesStorage.setItem('rhodes_tab_id', TAB_ID);
            }
        }

        // Helper to open new Rhodes instance in new tab
        window.openNewRhodes = () => {
            window.open(window.location.pathname + '?new=1', '_blank');
        };

        // Start a new session in a NEW tab (preserves current session)
        window.startNewSession = () => {
            // Open new tab with new session parameter
            const newUrl = window.location.pathname + '?new=1';
            const newWin = window.open(newUrl, '_blank');
            if (!newWin) {
                showToast('Popup blocked! Please allow popups for this site.');
            } else {
                showToast('Opening new session in new tab...');
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

        // Session dropdown functions
        function escHtml(s) {
            return String(s ?? '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#39;');
        }

        async function requestSessionListViaWS() {
            if (!ws || ws.readyState !== WebSocket.OPEN || !wsReadyForMessages) {
                throw new Error('Disconnected');
            }
            if (IS_GUEST || !CURRENT_USERNAME) {
                throw new Error('Login required');
            }

            if (window._pendingSessionListPromise) {
                return window._pendingSessionListPromise;
            }

            window._pendingSessionListPromise = new Promise((resolve, reject) => {
                window._pendingSessionListResolve = resolve;
                window._pendingSessionListReject = reject;

                try {
                    ws.send(JSON.stringify({
                        msg_type: 'session_list_request',
                        msg_id: generateUUID(),
                        timestamp: new Date().toISOString(),
                        payload: {}
                    }));
                } catch (e) {
                    window._pendingSessionListPromise = null;
                    window._pendingSessionListResolve = null;
                    window._pendingSessionListReject = null;
                    reject(e);
                    return;
                }

                setTimeout(() => {
                    if (window._pendingSessionListPromise) {
                        const rej = window._pendingSessionListReject;
                        window._pendingSessionListPromise = null;
                        window._pendingSessionListResolve = null;
                        window._pendingSessionListReject = null;
                        try { rej && rej(new Error('Session list timed out')); } catch {}
                    }
                }, 6000);
            });

            return window._pendingSessionListPromise;
        }

        window.toggleSessionDropdown = async (event) => {
            if (event) event.stopPropagation();
            const dropdown = document.getElementById('sessions-list');
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
                return;
            }

            // Fetch sessions for current user
            if (!CURRENT_USERNAME) {
                document.getElementById('sessions-results').innerHTML = '<div class="sessions-empty">Login to see sessions</div>';
                dropdown.classList.add('show');
                return;
            }

            document.getElementById('sessions-results').innerHTML = '<div class="sessions-empty">Loading...</div>';
            // Clear search input when opening dropdown fresh
            const searchInput = document.getElementById('session-search-input');
            if (searchInput) searchInput.value = '';
            dropdown.classList.add('show');

            try {
                // Fetch via WebSocket (JWT-authenticated). The HTTP endpoints require a different token type.
                const sessions = await requestSessionListViaWS();
                window.sessionsData = Array.isArray(sessions) ? sessions : [];

                if (window.sessionsData.length > 0) {
                    renderSessions(window.sessionsData);
                } else {
                    document.getElementById('sessions-results').innerHTML = '<div class="sessions-empty">No previous sessions</div>';
                }
            } catch (e) {
                const msg = (e && e.message) ? e.message : 'Error loading sessions';
                document.getElementById('sessions-results').innerHTML = '<div class="sessions-empty">' + escHtml(msg) + '</div>';
            }
        };

        // Render sessions list
        window.renderSessions = (sessions) => {
            const resultsDiv = document.getElementById('sessions-results');
            if (!sessions || sessions.length === 0) {
                resultsDiv.innerHTML = '<div class="sessions-empty">No sessions found</div>';
                return;
            }

            resultsDiv.innerHTML = sessions.map(s => {
                const isActive = s.session_id === RHODES_ID;
                const ts = s.updated_at || s.created_at || '';
                const dt = ts ? new Date(ts) : null;
                const date = dt && !isNaN(dt.getTime()) ? dt.toLocaleDateString() : '';
                const time = dt && !isNaN(dt.getTime()) ? dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
                const title = (s.title || '').trim() || s.session_id || 'Session';
                const count = (s.message_count ?? s.rounds ?? 0);
                const model = (s.model || '').trim();
                return `
                    <div class="session-item${isActive ? ' active' : ''}" onclick="loadSession('${s.session_id}', event)">
                        <div class="session-preview">${escHtml(title)}</div>
                        <div class="session-meta">${escHtml((date && time) ? (date + ' ' + time) : (date || time))}${model ? (' • ' + escHtml(model)) : ''} • ${escHtml(String(count))} messages</div>
                    </div>
                `;
            }).join('');
        };

        // Filter sessions based on search input
        // Debounced search to avoid too many API calls
        window.debouncedSearch = (() => {
            let timeout;
            return () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => filterSessions(), 300);
            };
        })();

        let currentSearchQuery = '';
        
        window.filterSessions = async () => {
            if (!window.sessionsData) return;
            
            const searchInput = document.getElementById('session-search-input');
            const query = searchInput.value.toLowerCase().trim();
            currentSearchQuery = query;
            
            if (!query) {
                renderSessions(window.sessionsData);
                return;
            }

            // Show searching state
            const resultsDiv = document.getElementById('sessions-results');
            resultsDiv.innerHTML = '<div class="sessions-empty">Searching...</div>';

            // Client-side metadata search (session_id/title/model/timestamps).
            const hits = (window.sessionsData || []).filter((s) => {
                const sid = String(s.session_id || '').toLowerCase();
                const title = String(s.title || '').toLowerCase();
                const model = String(s.model || '').toLowerCase();
                const created = String(s.created_at || '').toLowerCase();
                const updated = String(s.updated_at || '').toLowerCase();
                return sid.includes(query) || title.includes(query) || model.includes(query) || created.includes(query) || updated.includes(query);
            });
            if (currentSearchQuery !== query) return;
            if (hits.length > 0) {
                renderSessions(hits);
            } else {
                resultsDiv.innerHTML = '<div class="sessions-empty">No sessions found for: \"' + escHtml(query) + '\"</div>';
            }
        };

        // Enhance existing results with content search
        window.enhanceWithContentSearch = async (query, existingResults) => {
            if (!window.sessionsData || !query) return;
            
            try {
                // Get sessions not already in results
                const existingIds = new Set(existingResults.map(s => s.session_id));
                const sessionsToSearch = window.sessionsData
                    .filter(s => !existingIds.has(s.session_id))
                    .slice(0, 5); // Limit for performance
                
                const contentMatches = [];
                
                for (const session of sessionsToSearch) {
                    try {
                        const resp = await fetch(`/api/session/${session.session_id}?username=${encodeURIComponent(CURRENT_USERNAME)}`);
                        if (!resp.ok) continue;
                        
                        const data = await resp.json();
                        if (!data.messages || !Array.isArray(data.messages)) continue;
                        
                        const hasMatch = data.messages.some(msg => {
                            const content = (msg.content || '').toLowerCase();
                            return content.includes(query);
                        });
                        
                        if (hasMatch) {
                            contentMatches.push(session);
                        }
                    } catch (e) {
                        console.warn('Error searching session content:', session.session_id, e);
                    }
                }
                
                // Combine results if we found content matches
                if (contentMatches.length > 0) {
                    const allResults = [...existingResults, ...contentMatches];
                    renderSessions(allResults);
                }
            } catch (e) {
                console.warn('Error in enhanceWithContentSearch:', e);
            }
        };

        // Search within session message content (when no metadata matches)
        window.searchSessionContent = async (query) => {
            if (!query || currentSearchQuery !== query) return;

            const resultsDiv = document.getElementById('sessions-results');

            try {
                // Use /api/search FTS endpoint for full-text search
                const token = rhodesStorage.getItem('rhodes_user_token');
                const headers = token ? {'Authorization': 'Bearer ' + token} : {};

                const resp = await fetch('/api/search?q=' + encodeURIComponent(query), {headers});
                if (!resp.ok) {
                    console.warn('Search API error:', resp.status);
                    resultsDiv.innerHTML = '<div class="sessions-empty">Search unavailable</div>';
                    return;
                }

                const data = await resp.json();
                if (currentSearchQuery !== query) return; // Query changed

                if (data.error) {
                    console.warn('Search error:', data.error);
                    resultsDiv.innerHTML = '<div class="sessions-empty">Search error</div>';
                    return;
                }

                if (data.results && data.results.length > 0) {
                    // Group results by session_id and render
                    const sessionIds = [...new Set(data.results.map(r => r.session_id))];
                    const matchingSessions = sessionIds.map(sid => {
                        const match = data.results.find(r => r.session_id === sid);
                        const fullSession = window.sessionsData?.find(s => s.session_id === sid);
                        return fullSession || {
                            session_id: sid,
                            title: match.snippet?.replace(/<[^>]+>/g, '').substring(0, 50) + '...',
                            created_at: match.created_at,
                            message_count: match.round_num || 1
                        };
                    });
                    renderSessions(matchingSessions);

                    // Show search result count
                    const countDiv = document.createElement('div');
                    countDiv.className = 'sessions-search-count';
                    countDiv.textContent = 'Found ' + data.results.length + ' matches in ' + sessionIds.length + ' sessions';
                    countDiv.style.cssText = 'font-size:11px;color:#888;padding:4px 12px;';
                    resultsDiv.insertBefore(countDiv, resultsDiv.firstChild);
                } else {
                    resultsDiv.innerHTML = '<div class="sessions-empty">No sessions found containing: "' + query + '"</div>';
                }
            } catch (e) {
                console.warn('Search error:', e);
                resultsDiv.innerHTML = '<div class="sessions-empty">Search failed</div>';
            }
        
        };

        // Toggle session search (same as dropdown but focuses search)
        window.toggleSessionSearch = (event) => {
            if (event) event.stopPropagation();
            const dropdown = document.getElementById('sessions-list');
            
            if (!dropdown.classList.contains('show')) {
                // Open dropdown first
                toggleSessionDropdown(event);
                setTimeout(() => {
                    const searchInput = document.getElementById('session-search-input');
                    if (searchInput) searchInput.focus();
                }, 100);
            } else {
                // Already open, just focus search
                const searchInput = document.getElementById('session-search-input');
                if (searchInput) searchInput.focus();
            }
        };

        window.loadSession = async (sessionId, event) => {
            if (event) event.stopPropagation();
            // Close dropdown
            document.getElementById('sessions-list').classList.remove('show');

            if (sessionId === RHODES_ID) return; // Already on this session

            try {
                if (!ws || ws.readyState !== WebSocket.OPEN || !wsReadyForMessages) {
                    showToast('Disconnected — reconnecting…');
                    wantsNewRhodes = false;
                    RHODES_ID = sessionId;
                    rhodesStorage.setItem('rhodes_session_id', sessionId);
                    if (ws) ws.close();
                    connect();
                    return;
                }

                window.__pendingSessionSwitch = sessionId;
                document.getElementById('sessions-results').innerHTML = '<div class="sessions-empty">Loading session…</div>';
                ws.send(JSON.stringify({
                    msg_type: 'session_resume_request',
                    msg_id: generateUUID(),
                    timestamp: new Date().toISOString(),
                    payload: { session_id: sessionId }
                }));
                showToast('Switching sessions…');
            } catch (e) {
                showToast('Error loading session');
            }
        };

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('sessions-list');
            const btn = document.getElementById('sessions-btn');
            const searchBtn = document.getElementById('search-sessions-btn');
            if (dropdown && !dropdown.contains(e.target) && e.target !== btn && e.target !== searchBtn) {
                dropdown.classList.remove('show');
            }
        });

        // Get share link for current session
        window.getShareLink = () => {
            if (RHODES_ID) {
                const shareUrl = window.location.origin + window.location.pathname + '?resume=' + RHODES_ID;
                navigator.clipboard.writeText(shareUrl).then(() => {
                    showToast('Share link copied!');
                }).catch(() => {
                    prompt('Share link:', shareUrl);
                });
            }
        };

        // Simple toast notification
        function showToast(message) {
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--green);color:#000;padding:10px 20px;border-radius:4px;z-index:10000;font-size:14px;';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
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


        // Share options popup - lets user choose single message or full conversation
        window.showShareOptions = function(qaId) {
            const msgEl = document.querySelector(`[data-qa-id="${qaId}"]`);
            if (!msgEl) return;

            let modal = document.getElementById("share-modal");
            if (!modal) {
                modal = document.createElement("div");
                modal.id = "share-modal";
                modal.innerHTML = `
                    <div class="share-modal-content" style="max-width:400px;">
                        <h3 style="margin-top:0;color:var(--cyan);">Share Options</h3>

                        <div style="margin:15px 0;padding:10px;background:rgba(0,255,255,0.1);border-radius:4px;">
                            <label style="font-size:12px;color:var(--dim);display:block;margin-bottom:4px;">Names/usernames/emails to redact (comma-separated):</label>
                            <input type="text" id="share-redact-custom" placeholder="e.g. John, john@email.com, johndoe123"
                                style="width:100%;padding:8px;background:var(--bg);border:1px solid var(--dim);border-radius:4px;color:var(--fg);">
                            <div style="font-size:10px;color:var(--dim);margin-top:4px;">Leave empty for no redaction</div>
                        </div>

                        <div style="margin:15px 0;">
                            <label style="font-size:12px;color:var(--dim);display:block;margin-bottom:4px;">Share scope:</label>
                            <select id="share-scope" style="width:100%;padding:8px;background:var(--bg);border:1px solid var(--dim);border-radius:4px;color:var(--fg);">
                                <option value="full">Full conversation</option>
                                <option value="until">Conversation until this message</option>
                                <option value="single">This message only</option>
                            </select>
                        </div>

                        <button id="share-execute" class="share-option-btn" style="background:var(--green);">Create Share Link</button>
                        <button id="share-cancel" class="share-option-btn" style="background:var(--dim);">Cancel</button>

                        <div id="share-preview" style="margin-top:10px;padding:8px;background:rgba(255,255,255,0.05);border-radius:4px;font-size:11px;display:none;">
                            <strong style="color:var(--cyan);">Share will include:</strong>
                            <div id="share-preview-text" style="margin-top:4px;color:var(--dim);"></div>
                        </div>
                    </div>
                `;
                modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;";
                const contentEl = modal.querySelector(".share-modal-content");
                contentEl.style.cssText = "background:var(--bg);padding:20px;border-radius:8px;border:1px solid var(--cyan);max-width:400px;width:90%;";
                const btns = modal.querySelectorAll(".share-option-btn");
                btns.forEach(btn => {
                    btn.style.cssText = "display:block;width:100%;padding:12px;margin:8px 0;background:var(--cyan);color:var(--bg);border:none;border-radius:4px;cursor:pointer;font-size:14px;font-weight:bold;";
                });
                document.body.appendChild(modal);

                // Update preview on option change
                const updatePreview = () => {
                    const scope = document.getElementById("share-scope").value;
                    const redactCustom = document.getElementById("share-redact-custom").value;
                    const preview = document.getElementById("share-preview");
                    const previewText = document.getElementById("share-preview-text");

                    let parts = [];
                    if (scope === "full") parts.push("Full conversation");
                    else if (scope === "until") parts.push("Conversation until selected message");
                    else parts.push("Single Q&A pair");

                    if (redactCustom.trim()) {
                        const count = redactCustom.split(",").filter(n => n.trim()).length;
                        parts.push(count + " item(s) to redact");
                    }

                    previewText.textContent = parts.join(" • ");
                    preview.style.display = "block";
                };

                document.getElementById("share-scope").onchange = updatePreview;
                document.getElementById("share-redact-custom").oninput = updatePreview;
            }

            // Reset form
            document.getElementById("share-redact-custom").value = "";
            document.getElementById("share-scope").value = "full";
            document.getElementById("share-preview").style.display = "none";

            modal.style.display = "flex";
            modal.dataset.qaId = qaId;

            document.getElementById("share-execute").onclick = () => {
                const scope = document.getElementById("share-scope").value;
                const redactCustom = document.getElementById("share-redact-custom").value;

                const options = {
                    redact_names: redactCustom ? redactCustom.split(",").map(n => n.trim()).filter(n => n) : []
                };

                modal.style.display = "none";

                if (scope === "single") {
                    window.shareQA(qaId, options);
                } else if (scope === "until") {
                    window.shareConversationUntil(qaId, options);
                } else {
                    window.shareFullConversation(options);
                }
            };

            document.getElementById("share-cancel").onclick = () => {
                modal.style.display = "none";
            };
            modal.onclick = (e) => {
                if (e.target === modal) modal.style.display = "none";
            };
        };

        // Share the full conversation with options
        window.shareFullConversation = async function(options = {}) {
            const chat = document.getElementById("chat");
            if (!chat) return;

            const messages = [];
            chat.querySelectorAll("[data-qa-id]").forEach(el => {
                const q = el.dataset.question;
                const a = el.dataset.answer;
                if (q && a) {
                    messages.push({role: "user", content: q});
                    messages.push({role: "assistant", content: a});
                }
            });

            if (messages.length === 0) {
                showToast("No messages to share");
                return;
            }

            try {
                const response = await fetch("/api/share-qa", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: messages,
                        redact_names: options.redact_names || [],
                        redact_all_usernames: options.redact_all_usernames || false
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const shareUrl = window.location.origin + "/qa/" + data.id;
                    await navigator.clipboard.writeText(shareUrl);
                    showToast("Share link copied! (" + (data.share_type || "Full") + ")");
                } else {
                    throw new Error("Server error");
                }
            } catch (e) {
                console.error("Share conversation error:", e);
                showToast("Failed to share conversation");
            }
        };

        // Share conversation until a specific message
        window.shareConversationUntil = async function(qaId, options = {}) {
            const chat = document.getElementById("chat");
            if (!chat) return;

            const messages = [];
            let found = false;

            chat.querySelectorAll("[data-qa-id]").forEach(el => {
                if (found) return;
                const q = el.dataset.question;
                const a = el.dataset.answer;
                if (q && a) {
                    messages.push({role: "user", content: q});
                    messages.push({role: "assistant", content: a});
                }
                if (el.dataset.qaId === qaId) found = true;
            });

            if (messages.length === 0) {
                showToast("No messages to share");
                return;
            }

            try {
                const response = await fetch("/api/share-qa", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: messages,
                        redact_names: options.redact_names || [],
                        redact_all_usernames: options.redact_all_usernames || false,
                        share_note: "Partial conversation (until selected point)"
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const shareUrl = window.location.origin + "/qa/" + data.id;
                    await navigator.clipboard.writeText(shareUrl);
                    showToast("Share link copied! (" + (data.share_type || "Partial") + ")");
                } else {
                    throw new Error("Server error");
                }
            } catch (e) {
                console.error("Share conversation error:", e);
                showToast("Failed to share conversation");
            }
        };

        // Share a Q&A pair - stores on server and copies link
        window.shareQA = async function(qaId, options = {}) {
            const msgEl = document.querySelector('[data-qa-id="' + qaId + '"]');
            if (!msgEl) return;

            const question = msgEl.dataset.question;
            const answer = msgEl.dataset.answer;

            try {
                // Send to server to store with redaction options
                const response = await fetch('/api/share-qa', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question: question,
                        answer: answer,
                        redact_names: options.redact_names || [],
                        redact_all_usernames: options.redact_all_usernames || false
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const shareUrl = window.location.origin + '/qa/' + data.id;
                    await navigator.clipboard.writeText(shareUrl);
                    showToast('Share link copied! (' + (data.share_type || "Single Q&A") + ')');
                } else {
                    // Fallback: encode in URL (no redaction in fallback)
                    const encoded = btoa(JSON.stringify({ q: question, a: answer }));
                    const shareUrl = window.location.origin + '?qa=' + encoded;
                    await navigator.clipboard.writeText(shareUrl);
                    showToast('Share link copied (local - no redaction)');
                }
            } catch (e) {
                // Fallback: encode in URL (no redaction in fallback)
                const encoded = btoa(JSON.stringify({ q: question, a: answer }));
                const shareUrl = window.location.origin + '?qa=' + encodeURIComponent(encoded);
                navigator.clipboard.writeText(shareUrl).then(() => {
                    showToast('Share link copied!');
                }).catch(() => {
                    prompt('Share link:', shareUrl);
                });
            }
        };

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

                if (!username || !email || !password) {
                    errorEl.textContent = 'All fields required';
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

        // Downloads panel (disabled)
        const downloadsLink = document.getElementById('downloads-link');
        if (downloadsLink) {
            downloadsLink.onclick = (e) => {
                e.preventDefault();
                downloadsPanel.classList.add('show');
            };
        }
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


        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
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

        // Show auth modal with specific tab
        function showAuthTab(tabName) {
            authModal.style.display = 'flex';
            document.querySelector(`[data-tab="${tabName}"]`).click();
        }
        window.showAuthTab = showAuthTab;  // Make globally accessible for onclick

        // ============================================
        // ACCOUNT DROPDOWN & AUTH STATE MANAGEMENT
        // ============================================

        function updateHeaderAuth() {
            const loginBtn = document.getElementById('header-login-btn');
            const accountDropdown = document.getElementById('account-dropdown');
            const accountUsername = document.getElementById('account-username');
            const adminLink = document.getElementById('admin-link');

            // Mobile menu elements
            const mobileLoginLink = document.getElementById('mobile-login-link');
            const mobileAccountMenu = document.getElementById('mobile-account-menu');
            const mobileAccountUsername = document.getElementById('mobile-account-username');
            const mobileAdminLink = document.getElementById('mobile-admin-link');

            if (IS_GUEST || !CURRENT_USERNAME) {
                // Show LOGIN, hide dropdown (desktop)
                if (loginBtn) loginBtn.style.display = '';
                if (accountDropdown) accountDropdown.style.display = 'none';
                // Show LOGIN, hide account menu (mobile)
                if (mobileLoginLink) mobileLoginLink.style.display = '';
                if (mobileAccountMenu) mobileAccountMenu.style.display = 'none';
            } else {
                // Hide LOGIN, show dropdown with username (desktop)
                if (loginBtn) loginBtn.style.display = 'none';
                if (accountDropdown) accountDropdown.style.display = '';
                if (accountUsername) accountUsername.textContent = CURRENT_USERNAME.toUpperCase();
                // Hide LOGIN, show account menu (mobile)
                if (mobileLoginLink) mobileLoginLink.style.display = 'none';
                if (mobileAccountMenu) mobileAccountMenu.style.display = '';
                if (mobileAccountUsername) mobileAccountUsername.textContent = CURRENT_USERNAME.toUpperCase();

                // Check admin status for both desktop and mobile
                checkAdminStatus();
            }
        }
        window.updateHeaderAuth = updateHeaderAuth;

        async function checkAdminStatus() {
            console.log("[ADMIN-CHECK] Running checkAdminStatus, USER_TOKEN:", USER_TOKEN ? USER_TOKEN.substring(0,10)+"..." : "NONE");
            const adminLink = document.getElementById('admin-link');
            const mobileAdminLink = document.getElementById('mobile-admin-link');

            try {
                const resp = await fetch('/api/user/is_admin', {
                    headers: { 'Authorization': 'Bearer ' + USER_TOKEN }
                });
                const data = await resp.json();
                console.log("[ADMIN-CHECK] Response:", data); const show = data.is_admin ? '' : 'none';
                console.log("[ADMIN-CHECK] Setting display:", show); if (adminLink) adminLink.style.display = show;
                if (mobileAdminLink) mobileAdminLink.style.display = show;
            } catch (e) {
                if (adminLink) adminLink.style.display = 'none';
                if (mobileAdminLink) mobileAdminLink.style.display = 'none';
            }
        }
        window.checkAdminStatus = checkAdminStatus;

        function logout() {
            rhodesStorage.removeItem('rhodes_user_token');
            rhodesStorage.removeItem('rhodes_token');
            USER_TOKEN = '';
            TOKEN = '';
            IS_GUEST = true;
            CURRENT_USERNAME = null;
            updateHeaderAuth();
            if (ws) ws.close();
            addMsg('ai', 'You have been logged out.');
            // Reconnect as guest after short delay
            setTimeout(connect, 500);
        }
        window.logout = logout;

        // Auto-open reset tab if the user visited /reset-password?token=...
        try {
            const path = (window.location.pathname || '').replace(/\/+$/, '');
            const params = new URLSearchParams(window.location.search || '');
            const token = params.get('token') || '';
            const isReset = path === '/reset-password' || params.get('reset') === '1';
            if (isReset || token) {
                showAuthTab('reset');
                const tokenEl = document.getElementById('reset-token');
                if (tokenEl && token) tokenEl.value = token;
                // Avoid leaving tokens in the address bar / referrers
                if (token) {
                    const safeUrl = '/?reset=1';
                    window.history.replaceState({}, document.title, safeUrl);
                }
            }
        } catch (e) {}

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


        function addMsg(role, text, skipShare = false) {
            if (chat) chat.classList.remove('intro-center');
            const div = document.createElement('div');
            const hasUsedVoice = rhodesStorage.getItem('hasUsedVoice');
            div.className = 'msg ' + role + (hasUsedVoice ? ' with-avatar' : '');

            // Track user messages for Q&A pairing
            if (role === 'user') {
                lastUserMessage = text;
            }
            // Strip action blocks (should be server-side, but safety)
            let cleanText = text
                .replace(/\[RHODES_ACTION:\s*\w+\][\s\S]*?\[\/RHODES_ACTION\]/gi, '')
                .replace(/\[CLIENT_COMMAND:\s*\w+\][\s\S]*?\[\/CLIENT_COMMAND\]/gi, '');
            let htmlContent = cleanText
                .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre>$2</pre>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
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
                .replace(/\n/g, '<br>');

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
            const formatted = cleanText
                .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre>$2</pre>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
            el.innerHTML = formatted + '<span class="streaming-cursor">▌</span>';
            chat.scrollTop = chat.scrollHeight;
        }

        // ============================================
        // MOBILE MENU FUNCTIONS
        // ============================================
        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu-dropdown');
            if (menu) {
                menu.classList.toggle('active');
                // Toggle hamburger icon
                const menuToggle = document.getElementById('menu-toggle');
                if (menu.classList.contains('active')) {
                    menuToggle.innerHTML = '✕';
                    menuToggle.title = 'Close menu';
                } else {
                    menuToggle.innerHTML = '☰';
                    menuToggle.title = '☰';
                }
            }
        }

        function closeMobileMenu() {
            const menu = document.getElementById('mobile-menu-dropdown');
            if (menu) {
                menu.classList.remove('active');
                const menuToggle = document.getElementById('menu-toggle');
                menuToggle.innerHTML = '☰';
                menuToggle.title = '☰';
            }
        }

        // If a user opens the mobile menu then rotates/resizes to desktop widths,
        // force it closed to avoid "duplicate navbar" appearance.
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) closeMobileMenu();
        });
        if (window.innerWidth > 768) closeMobileMenu();

        function toggleMobileSubmenu(submenuItem) {
            const submenu = submenuItem.parentElement;
            submenu.classList.toggle('active');
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            const menu = document.getElementById('mobile-menu-dropdown');
            const menuToggle = document.getElementById('menu-toggle');
            if (menu && menu.classList.contains('active') && 
                !menu.contains(event.target) && 
                !menuToggle.contains(event.target)) {
                closeMobileMenu();
            }
        });

        // Handle window resize - close mobile menu on large screens
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                closeMobileMenu();
            }
        });

        function showAuth(tab) {
            document.getElementById('auth-modal').style.display = 'flex';
            if (typeof showAuthTab === 'function') {
                showAuthTab(tab);
            }
        }

        function toggleTheme() {
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.click();
            }
        }

                function showAbout() {
            const aboutPanel = document.getElementById('about-panel');
            if (aboutPanel) {
                aboutPanel.style.display = 'block';
                aboutPanel.classList.add('show');
            }
        }

        function closeAbout() {
            const aboutPanel = document.getElementById('about-panel');
            if (aboutPanel) {
                aboutPanel.classList.remove('show');
                aboutPanel.style.display = 'none';
            }
        }

function showDownloads() {
            const downloadsPanel = document.getElementById('downloads-panel');
            if (downloadsPanel) {
                downloadsPanel.classList.add('show');
            }
        }

        function showCourses() {
            const coursesPanel = document.getElementById('courses-panel');
            if (coursesPanel) {
                coursesPanel.style.display = 'block';
            }
        }

        function finalizeStreamingMsg(el, finalText) {
            if (!el) return;
            el.classList.remove('streaming');
            // Preserve tool call elements
            const savedTools = Array.from(el.querySelectorAll('.tool-summary'));
            // Strip any remaining action blocks (should be cleaned server-side, but safety)
            let cleanText = finalText
                .replace(/\[RHODES_ACTION:\s*\w+\][\s\S]*?\[\/RHODES_ACTION\]/gi, '')
                .replace(/\[CLIENT_COMMAND:\s*\w+\][\s\S]*?\[\/CLIENT_COMMAND\]/gi, '');
            // Full formatting on final text
            el.innerHTML = cleanText
                .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre>$2</pre>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
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
                .replace(/\n/g, '<br>');
            // Restore tool calls
            savedTools.forEach(t => {
                el.appendChild(t);
                // Stop live timer and show final time
                if (t.dataset.startTime) {
                    const elapsed = Date.now() - parseInt(t.dataset.startTime);
                    const timeEl = t.querySelector('.tool-summary-live');
                    if (timeEl) {
                        timeEl.textContent = elapsed + 'ms (total)';
                        timeEl.classList.remove('tool-summary-live');
                    }
                    delete t.dataset.startTime;
                }
            });
            if (window.toolTimerInterval) {
                clearInterval(window.toolTimerInterval);
                window.toolTimerInterval = null;
            }
            chat.scrollTop = chat.scrollHeight;
        }

        // Firebase initialization
        const firebaseConfig = {
            apiKey: "AIzaSyCBBnsOhx2Yq5hYFXuFddoKiIkk_mTimQE",
            authDomain: "rhodes-french-b3e2e.firebaseapp.com",
            projectId: "rhodes-french-b3e2e",
            storageBucket: "rhodes-french-b3e2e.firebasestorage.app",
            messagingSenderId: "633559429572",
            appId: "1:633559429572:web:4673318365851b0553f491"
        };

        let firebaseApp = null;
        let firebaseAuth = null;

        function initFirebase() {
            if (!firebaseApp && typeof firebase !== 'undefined') {
                firebaseApp = firebase.initializeApp(firebaseConfig);
                firebaseAuth = firebase.auth();
                console.log('Firebase initialized');
            }
        }

        // Google Sign-In via Firebase
        async function signInWithGoogle() {
            window.__lastAuthAttempt = 'google';
            initFirebase();
            if (!firebaseAuth) {
                alert('Firebase not loaded. Please refresh and try again.');
                return;
            }

            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await firebaseAuth.signInWithPopup(provider);
                const idToken = await result.user.getIdToken();

                console.log('Google sign-in success:', result.user.email);

                // Send to server
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    window.pendingGoogleCredential = idToken;
                    connect();
                } else {
                    ws.send(JSON.stringify({
                        msg_type: 'google_login_request',
                        msg_id: generateUUID(),
                        timestamp: new Date().toISOString(),
                        payload: { google_token: idToken }
                    }));
                }
            } catch (e) {
                console.error('Google sign-in failed:', e);
                const errorEl = document.getElementById('login-error');
                errorEl.textContent = 'Google sign-in failed: ' + e.message;
                errorEl.style.display = 'block';
            }
        }

        // Initialize Firebase on load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initFirebase);
        } else {
            setTimeout(initFirebase, 100);
        }

        function connect() {
            // Skip connection if viewing shared Q&A
            if (sharedQA || shareQaId || shareConvId) return;

            // Bump epoch; all handlers below ignore stale sockets.
            const epoch = ++wsEpoch;
            
            // Prevent multiple simultaneous connection attempts (but allow retry if a previous attempt got stuck)
            if (connectionInProgress) {
                if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
                    connectionInProgress = false;
                } else {
                    console.log('Connection already in progress, skipping duplicate call');
                    return;
                }
            }
            connectionInProgress = true;
            wsReadyForMessages = false;
            
            // If we're on production domain and the server is not a known good candidate,
            // force it back to default (unless allowCustomServer=1).
            try {
                const qs = new URLSearchParams(window.location.search || '');
                const allowCustomServer = qs.get('allowCustomServer') === '1';
                if (isRhodesDomain && !allowCustomServer) {
                    const s = (SERVER || '').trim().replace(/\/+$/, '').toLowerCase();
                    const allowed = new Set(RHODES_PROD_CANDIDATES.map(x => x.toLowerCase()));
                    if (!allowed.has(s) && !s.includes('rhodesagi.com')) {
                        SERVER = RHODES_PROD_CANDIDATES[0];
                    }
                }
            } catch {}

             // Show auth modal if no credentials AND first time (let guest try)
            const hasUserToken = USER_TOKEN && (USER_TOKEN || "").length > 10;
            const hasToken = TOKEN && (TOKEN || "").length > 10;
            console.log('Token check - USER_TOKEN:', USER_TOKEN, 'length:', (USER_TOKEN || "").length, 'hasUserToken:', hasUserToken);
            console.log('Token check - TOKEN:', TOKEN ? 'present' : 'empty', 'length:', (TOKEN || "").length, 'hasToken:', hasToken);

            // Auto-connect as guest or with saved credentials
            authModal.style.display = 'none';
            setStatus(false, 'CONNECTING');

            try {
                // Hard-stop any previous socket (avoids duplicate listeners).
                if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
                    try {
                        ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
                        ws.close();
                    } catch {}
                }
                ws = new WebSocket(SERVER);
                console.log('WebSocket created successfully for:', SERVER);
                console.log('WebSocket readyState after creation:', ws.readyState);
                // Debug: log readyState after 2 seconds to see if it changes
                setTimeout(() => {
                    if (epoch !== wsEpoch) return;
                    console.log('WebSocket readyState after 2s:', ws.readyState, 'url:', SERVER);
                    if (ws.readyState === WebSocket.CONNECTING) {
                        console.log('WebSocket stuck in CONNECTING state - possible network issue');
                    }
                }, 2000);
            } catch (error) {
                console.error('WebSocket constructor failed:', error);
                setStatus(false, 'WS CONSTRUCTION FAILED');
                // Show auth modal immediately so user can see what's wrong
                setTimeout(() => {
                    authModal.style.display = 'flex';
                }, 500);
                return; // Don't continue with event handlers
            }

            // Connection timeout: if WebSocket doesn't open within 5 seconds, show auth modal
            const connectionTimeout = setTimeout(() => {
                if (epoch !== wsEpoch) return;
                connectionInProgress = false;
                console.log('WebSocket connection timeout - onopen not called within 5s');
                if (ws && ws.readyState !== WebSocket.OPEN) {
                    console.log('WebSocket state:', ws.readyState, 'forcing auth modal');
                    setStatus(false, 'CONNECTION TIMEOUT');
                    // Auto-fallback: if the primary endpoint is down, try the alternate.
                    try {
                        if (isRhodesDomain) {
                            const cur = (SERVER || '').trim().replace(/\/+$/, '');
                            const primary = RHODES_PROD_CANDIDATES[0];
                            const fallback = RHODES_PROD_CANDIDATES[1];
                            if (fallback && cur === primary) {
                                console.warn('[WS] Primary endpoint timed out; trying fallback:', fallback);
                                SERVER = fallback;
                                // Best-effort: update the visible server input if present.
                                try { if (serverInput) serverInput.value = SERVER; } catch {}
                                try { if (ws) ws.close(); } catch {}
                                setTimeout(connect, 100);
                            }
                        }
                    } catch {}
                    authModal.style.display = 'flex';
                    // Show debug button
                    const debugBtn = document.getElementById('debug-btn');
                    if (debugBtn) debugBtn.style.display = 'inline';
                    // Auto-select guest tab as fallback and connect automatically
                    setTimeout(() => {
                        const guestTab = document.querySelector('[data-tab="guest"]');
                        if (guestTab) guestTab.click();
                        // Wait for tab switch then click guest connect button
                        setTimeout(() => {
                            const guestConnectBtn = document.getElementById('guest-connect-btn');
                            if (guestConnectBtn) guestConnectBtn.click();
                        }, 200);
                    }, 100);
                }
            }, 5000);

            ws.onopen = () => {
                if (epoch !== wsEpoch) return;
                clearTimeout(connectionTimeout);
                connectionInProgress = false;
                // Hide debug button on successful connection
                const debugBtn = document.getElementById('debug-btn');
                if (debugBtn) debugBtn.style.display = 'none';
                console.log('WebSocket opened, sending auth request');
                // Get saved session ID for auto-resume.
                // IMPORTANT: when starting a brand-new session (?new=1), do not auto-resume the main saved session.
                const savedSessionId = wantsNewRhodes ? '' : (rhodesStorage.getItem('rhodes_session_id') || '');

                // When ?new=1, force empty resume to create fresh session
                const resumeSession = wantsNewRhodes ? "" :
                    hasUserToken
                        ? (RHODES_ID || savedSessionId)  // always resume current tab session if known
                        : '';

                ws.send(JSON.stringify({
                    msg_type: 'auth_request',
                    msg_id: generateUUID(),
                    timestamp: new Date().toISOString(),
                    payload: {
                        client_id: CLIENT_ID,
                        tab_id: TAB_ID,
                        token: hasToken ? TOKEN : '',
                        user_token: hasUserToken ? USER_TOKEN : '',
                        // Important: even in ?new=1 mode, reconnects must resume the same in-tab session,
                        // otherwise any transient disconnect (or /stop) looks like "new Rhodes with no memory".
                        resume_session: resumeSession,
                        client_version: '3.0.0',
                        platform: 'web',
                        hostname: location.hostname,
                        system: {
                            browser: SYSTEM_INFO.browser.name,
                            browser_engine: SYSTEM_INFO.browser.engine,
                            os: SYSTEM_INFO.os.name,
                            os_version: SYSTEM_INFO.os.version || null,
                            os_distro: SYSTEM_INFO.os.distro || null,
                            is_mobile: SYSTEM_INFO.isMobile,
                            user_agent: navigator.userAgent
                        }
                    }
                }));
            };

            ws.onmessage = (e) => {
                if (epoch !== wsEpoch) return;
                const msg = JSON.parse(e.data);
                console.log('WebSocket message received:', msg.msg_type, msg.payload?.success ? 'success' : 'fail');
                if (msg.msg_type === 'auth_response') {
                    if (msg.payload.success) {
                        // Check for pending Google Sign-In
                        if (window.pendingGoogleCredential) {
                            const credential = window.pendingGoogleCredential;
                            window.pendingGoogleCredential = null;
                            ws.send(JSON.stringify({
                                msg_type: 'google_login_request',
                                msg_id: generateUUID(),
                                timestamp: new Date().toISOString(),
                                payload: { google_token: credential }
                            }));
                            return; // Wait for google_login_response
                        }

                        IS_GUEST = msg.payload.is_guest || false;
                        RHODES_ID = msg.payload.rhodes_id || null;
                        const instanceLabel = wantsNewRhodes ? ' [NEW]' : '';

                        // Clear chat only once for ?new=1 (initial creation); do not clear on reconnect.
                        if (wantsNewRhodes && !didInitialAuth) {
                            chat.innerHTML = '';
                        }
                        didInitialAuth = true;

                        // Save rhodes_id for logged-in users (auto-resume on next visit)
                        // Don't save if this is a temporary new session
                        if (RHODES_ID && !IS_GUEST && !wantsNewRhodes) {
                            rhodesStorage.setItem('rhodes_session_id', RHODES_ID);
                        }

                        // Update session ID display
                        if (RHODES_ID) {
                            const sessionEl = document.getElementById('session-id');
                            if (sessionEl) {
                                sessionEl.textContent = RHODES_ID;
                                sessionEl.style.display = 'inline';
                            }
                        }

                        // Load conversation history if resumed session has messages
                        if (msg.payload.conversation && msg.payload.conversation.length > 0) {
                            for (const m of msg.payload.conversation) {
                                const content = m.role === 'user' ? maskPasswords(m.content) : m.content;
                                addMsg(m.role === 'user' ? 'user' : 'ai', content);
                            }
                        }

                        if (IS_GUEST) {
                            GUEST_MESSAGES_REMAINING = msg.payload.guest_messages_remaining || 3;
                            CURRENT_USERNAME = null;
                            setStatus(true, `GUEST (${GUEST_MESSAGES_REMAINING} msgs left)${instanceLabel}`);
                            try { authModal.style.display = 'none'; } catch {}
                            showGuestOnboardingMessage();
                        } else {
                            GUEST_HAS_ACTIVITY = false;
                            const username = msg.payload.user?.username || '';
                            CURRENT_USERNAME = username.toLowerCase();
                            setStatus(true, username ? `CONNECTED (${username})${instanceLabel}` : `CONNECTED${instanceLabel}`);
                            removeGuestOnboardingMessages();
                            addMsg('ai', wantsNewRhodes ? 'New Rhodes instance created. Ready for input.' : 'Secure connection established. Ready for input.');
                        }

                        // Update header auth UI (LOGIN vs Account dropdown)
                        updateHeaderAuth();

                        // Update agent status indicator
                        const agentStatus = document.getElementById('agent-status');
                        if (agentStatus) {
                            if (msg.payload.agent_connected) {
                                agentStatus.style.display = 'inline-block';
                                agentStatus.title = msg.payload.agent_info ?
                                    `Desktop agent: ${msg.payload.agent_info.platform || 'unknown'} on ${msg.payload.agent_info.hostname || 'unknown'}` :
                                    'Desktop agent connected';
                            } else {
                                agentStatus.style.display = 'none';
                            }
                        }

                        // Handle resume if requested
                        if (resumeSessionId && ws) {
                            ws.send(JSON.stringify({
                                msg_type: 'session_resume_request',
                                msg_id: generateUUID(),
                                timestamp: new Date().toISOString(),
                                payload: { session_id: resumeSessionId }
                            }));
                        }

                        wsReadyForMessages = true;
                        flushOutboundQueue();
                        rhodesStorage.setItem('rhodes_server', SERVER);

                        // Auto-join room from URL if provided (logged-in only)
                        if (roomParam && !IS_GUEST && ws && ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({
                                msg_type: 'room_join_request',
                                msg_id: generateUUID(),
                                timestamp: new Date().toISOString(),
                                payload: { room_id: roomParam }
                            }));
                        }
                    } else {
                        // Check for rate limit error
                        if (msg.payload.error === 'rate_limit') {
                            setStatus(false, 'SESSION LIMIT');
                            showToast('Session limit reached');
                            // Don't show auth modal - they're logged in, just rate limited
                            // Offer to load existing sessions
                            setTimeout(() => toggleSessionDropdown(), 500);
                        } else {
                            setStatus(false, 'AUTH FAILED');
                            authModal.style.display = 'flex';
                            // Auto-start as guest if auth fails with no valid tokens
                            setTimeout(() => {
                                if (!TOKEN && !USER_TOKEN && !autoGuestAttempted) {
                                    autoGuestAttempted = true;
                                    console.log('Auto-clicking guest button');
                                    const guestTab = document.querySelector('[data-tab="guest"]');
                                    if (guestTab) guestTab.click();
                                    const guestBtn = document.getElementById('guest-connect-btn');
                                    if (guestBtn) guestBtn.click();
                                }
                            }, 500);
                        }
                    }
                } else if (msg.msg_type === 'room_create_response') {
                    if (!msg.payload || !msg.payload.success || !msg.payload.room_id) {
                        showToast('Room create failed');
                        return;
                    }
                    CURRENT_ROOM_ID = msg.payload.room_id;
                    seenRoomMsgIds.clear();
                    chat.innerHTML = '';
                    const members = (msg.payload.members || []).map(m => m.username).filter(Boolean).join(', ');
                    addMsg('ai', `Joined room <code>${CURRENT_ROOM_ID}</code>${members ? ' — ' + escapeHtml(members) : ''}`, true);
                    setStatus(true, `ROOM (${CURRENT_ROOM_ID})`);
                    try {
                        const u = new URL(window.location.href);
                        u.searchParams.set('room', CURRENT_ROOM_ID);
                        window.history.replaceState({}, '', u.toString());
                    } catch {}
                } else if (msg.msg_type === 'room_join_response') {
                    if (!msg.payload || !msg.payload.success || !msg.payload.room_id) {
                        showToast('Room join failed');
                        return;
                    }
                    CURRENT_ROOM_ID = msg.payload.room_id;
                    seenRoomMsgIds.clear();
                    chat.innerHTML = '';
                    const members = (msg.payload.members || []).map(m => m.username).filter(Boolean).join(', ');
                    addMsg('ai', `Joined room <code>${CURRENT_ROOM_ID}</code>${members ? ' — ' + escapeHtml(members) : ''}`, true);

                    const history = msg.payload.messages || [];
                    for (const m of history) {
                        if (m && m.msg_id) seenRoomMsgIds.add(m.msg_id);
                        const role = (m && m.role) || '';
                        const uname = (m && m.username) || '';
                        const content = (m && m.content) || '';
                        if (role === 'assistant') addRoomLine('ai', uname || 'Rhodes', content);
                        else addRoomLine('user', uname, content);
                    }

                    setStatus(true, `ROOM (${CURRENT_ROOM_ID})`);
                    try {
                        const u = new URL(window.location.href);
                        u.searchParams.set('room', CURRENT_ROOM_ID);
                        window.history.replaceState({}, '', u.toString());
                    } catch {}
                } else if (msg.msg_type === 'room_leave_response') {
                    CURRENT_ROOM_ID = null;
                    seenRoomMsgIds.clear();
                    showToast('Left room');
                    try {
                        const u = new URL(window.location.href);
                        u.searchParams.delete('room');
                        window.history.replaceState({}, '', u.toString());
                    } catch {}
                    // Restore status line
                    if (IS_GUEST) updateGuestStatus();
                    else setStatus(true, CURRENT_USERNAME ? `CONNECTED (${CURRENT_USERNAME})` : 'CONNECTED');
                } else if (msg.msg_type === 'room_message') {
                    const p = msg.payload || {};
                    if (!p.room_id || p.room_id !== CURRENT_ROOM_ID) return;
                    const id = msg.msg_id || p.msg_id;
                    if (id && seenRoomMsgIds.has(id)) return;
                    if (id) seenRoomMsgIds.add(id);
                    addRoomLine('user', p.username || 'User', p.content || '');
                } else if (msg.msg_type === 'room_spiral_response') {
                    if (msg.payload && msg.payload.success) {
                        showToast(`Spiral ${msg.payload.enabled ? 'enabled' : 'disabled'}`);
                    } else {
                        showToast('Spiral update failed');
                    }
                } else if (msg.msg_type === 'room_round_state') {
                    const p = msg.payload || {};
                    if (!p.room_id || p.room_id !== CURRENT_ROOM_ID) return;
                    if (!p.enabled) {
                        setStatus(true, `ROOM (${CURRENT_ROOM_ID})`);
                        return;
                    }
                    const phase = (p.phase || '').toUpperCase();
                    const round = p.round || 0;
                    setStatus(true, `ROOM (${CURRENT_ROOM_ID}) • R${round} ${phase}`);
                } else if (msg.msg_type === 'user_message') {
                    // Multi-tab viewer sync: other tabs receive the sender's user messages.
                    if (msg.payload && msg.payload.sync) {
                        const originTab = msg.payload.origin_tab_id || '';
                        if (!originTab || originTab !== TAB_ID) {
                            const syncedText = (msg.payload.content || '').trim();
                            if (syncedText) addMsg('user', maskPasswords(syncedText), true);
                            markGuestActivity();
                        }
                    }
                } else if (msg.msg_type === 'ai_message_chunk') {
                    // Streaming chunk - append to current message
                    if (activeReqId && msg.payload && msg.payload.req_id && msg.payload.req_id !== activeReqId) return;
                    const chunk = msg.payload.content || '';
                    if (chunk) {
                        if (_seenRecently('chunk:' + chunk.slice(0, 64), 150)) return;
                        if (!window.streamingMsgEl) {
                            // First chunk - create message element
                            hideLoading();
                            window.streamingContent = '';
                            window.streamingMsgEl = addMsgStreaming('ai', '');
                        }
                        window.streamingContent += chunk;
                        updateStreamingMsg(window.streamingMsgEl, window.streamingContent);
                    }
                } else if (msg.msg_type === "ai_message") {
                    console.log("[DEBUG] ai_message received:", JSON.stringify(msg.payload).slice(0, 500));
                    console.log("[DEBUG] debug_reasoning present:", !!msg.payload.debug_reasoning, "len:", msg.payload.debug_reasoning ? msg.payload.debug_reasoning.length : 0);
                    hideLoading();
                    // Clear any streaming state
                    if (window.streamingMsgEl) {
                        window.streamingMsgEl.remove();  // Remove the tool-only element
                        window.streamingMsgEl = null;
                        window.streamingContent = '';
                    }
                    // Room-aware: AI_MESSAGE can also be room AI or personal AI.
                    if (msg.payload && msg.payload.room_id) {
                        if (msg.payload.room_id !== CURRENT_ROOM_ID) return;
                        if (msg.payload.content && msg.payload.content.trim()) {
                            const k = 'ai_room:' + (msg.payload.speaker || '') + ':' + msg.payload.content.slice(0, 200);
                            if (_seenRecently(k, 2000)) return;
                            addRoomLine('ai', msg.payload.speaker || 'Rhodes', msg.payload.content);
                        }
                        return;
                    }
                    if (activeReqId && msg.payload && msg.payload.req_id && msg.payload.req_id !== activeReqId) return;
                    // Check for credential request from model
                    if (msg.payload.content && msg.payload.content.includes('[CREDENTIAL_REQUEST:')) {
                        const match = msg.payload.content.match(/\[CREDENTIAL_REQUEST:(\{[^}]+\})\]/);
                        if (match) {
                            try {
                                const opts = JSON.parse(match[1]);
                                opts.callback_id = activeReqId;
                                if (window.RhodesCredentials) {
                                    window.RhodesCredentials.show(opts);
                                }
                                // Remove the request from displayed content
                                msg.payload.content = msg.payload.content.replace(/\[CREDENTIAL_REQUEST:\{[^}]+\}\]/, '').trim();
                                if (!msg.payload.content) return;
                            } catch(e) { console.error('Credential parse error:', e); }
                        }
                    }

                    // ALWAYS display content as a fresh message
                    if (msg.payload.content && msg.payload.content.trim()) {
                        const k = 'ai:' + msg.payload.content.slice(0, 240);
                        if (_seenRecently(k, 2000)) return;
                        // Collapse tool log so any subsequent tool calls appear after this message
                        if (typeof collapseToolCalls === 'function') collapseToolCalls();
                        const node = addMsg('ai', msg.payload.content);
                        if (msg.payload.debug_reasoning) {
                            attachDebugReasoning(node, msg.payload.debug_reasoning);
                        }
                    }

                    // Check for screenshot actions and display inline
                    if (msg.payload.actions && msg.payload.actions.length > 0) {
                        for (const action of msg.payload.actions) {
                            if (action.name === 'browser_screenshot' && action.success) {
                                // Extract filename from message like "Screenshot saved to /tmp/rhodes-screenshot-123.png"
                                const match = action.message.match(/rhodes-screenshot-\d+\.png/);
                                if (match) {
                                    const filename = match[0];
                                    addScreenshotToChat(filename);
                                }
                            }
                        }
                    }

                    // Update guest count after each message
                    if (IS_GUEST && GUEST_MESSAGES_REMAINING > 0) {
                        GUEST_MESSAGES_REMAINING--;
                        updateGuestStatus();
                    }
                } else if (msg.msg_type === 'guest_status') {
                    hideLoading();
                    if (msg.payload.limit_reached) {
                        // Speak the limit message if voice is enabled
                        if (typeof VoiceChat !== 'undefined' && VoiceChat.voiceEnabled) {
                            VoiceChat.speak("Sorry, your guest messages are up. But if you click the sign in with Google button, we can keep chatting.");
                        }
                        // Exit hands-free mode if active (after brief delay to let TTS start)
                        setTimeout(() => {
                            const takeover = document.getElementById('handsfree-takeover');
                            if (takeover) takeover.classList.remove('active');
                            if (typeof VoiceChat !== 'undefined') {
                                VoiceChat.stopRecording();
                            }
                            // Show limit modal
                            limitModal.style.display = 'flex';
                            setStatus(false, 'LIMIT REACHED');
                        }, 500);
                    }
                } else if (msg.msg_type === 'register_response') {
                    const errorEl = document.getElementById('reg-error');
                    if (msg.payload.success) {
                        USER_TOKEN = msg.payload.token;
                        rhodesStorage.setItem('rhodes_user_token', USER_TOKEN);
                        IS_GUEST = false;
                        GUEST_HAS_ACTIVITY = false;
                        window.__guestOnboardingShown = false;
                        removeGuestOnboardingMessages();
                        authModal.style.display = 'none';
                        setStatus(true, `CONNECTED (${msg.payload.username})`);
                        addMsg('ai', `Welcome ${msg.payload.username}! Your account is ready.`);
                    } else {
                        errorEl.textContent = msg.payload.message;
                        errorEl.style.display = 'block';
                    }
                } else if (msg.msg_type === 'login_response') {
                    const errorEl = document.getElementById('login-error');
                    if (msg.payload.success) {
                        USER_TOKEN = msg.payload.token;
                        rhodesStorage.setItem('rhodes_user_token', USER_TOKEN);
                        IS_GUEST = false;
                        GUEST_HAS_ACTIVITY = false;
                        window.__guestOnboardingShown = false;
                        removeGuestOnboardingMessages();
                        authModal.style.display = 'none';
                        // Redirect to returnTo if specified (e.g., from /download/ page)
                        if (returnTo) {
                            window.location.href = returnTo;
                            return;
                        }
                        // Reconnect to get proper user session (not guest session)
                        addMsg('ai', `Welcome back ${msg.payload.username}! Reconnecting...`);
                        setTimeout(() => {
                            if (ws) ws.close();
                            connect();
                        }, 500);
                    } else {
                        errorEl.textContent = msg.payload.message;
                        errorEl.style.display = 'block';
                    }
                } else if (msg.msg_type === 'password_reset_response') {
                    const errorEl = document.getElementById('reset-error');
                    const infoEl = document.getElementById('reset-info');
                    try { showAuthTab('reset'); } catch {}
                    if (msg.payload && msg.payload.success) {
                        if (infoEl) {
                            infoEl.textContent = msg.payload.message || 'If that email exists, a reset link has been sent.';
                            infoEl.style.display = 'block';
                        }
                    } else {
                        if (errorEl) {
                            errorEl.textContent = (msg.payload && msg.payload.message) ? msg.payload.message : 'Failed to process reset request';
                            errorEl.style.display = 'block';
                        }
                    }
                } else if (msg.msg_type === 'password_reset_complete_response') {
                    const errorEl = document.getElementById('reset-error');
                    const infoEl = document.getElementById('reset-info');
                    try { showAuthTab('reset'); } catch {}
                    if (msg.payload && msg.payload.success) {
                        if (infoEl) {
                            infoEl.textContent = msg.payload.message || 'Password updated successfully. You can login now.';
                            infoEl.style.display = 'block';
                        }
                        try { document.getElementById('reset-new-password').value = ''; } catch {}
                        try { document.getElementById('reset-new-password2').value = ''; } catch {}
                        showToast('Password updated');
                    } else {
                        if (errorEl) {
                            errorEl.textContent = (msg.payload && msg.payload.message) ? msg.payload.message : 'Failed to reset password';
                            errorEl.style.display = 'block';
                        }
                    }
                } else if (msg.msg_type === 'google_login_response') {
                    const errorEl = document.getElementById('login-error');
                    if (msg.payload.success) {
                        USER_TOKEN = msg.payload.token;
                        rhodesStorage.setItem('rhodes_user_token', USER_TOKEN);
                        IS_GUEST = false;
                        GUEST_HAS_ACTIVITY = false;
                        window.__guestOnboardingShown = false;
                        removeGuestOnboardingMessages();
                        authModal.style.display = 'none';
                        // Reconnect to get proper user session (not guest session)
                        addMsg('ai', `Welcome ${msg.payload.username}! Signed in with Google. Reconnecting...`);
                        setTimeout(() => {
                            if (ws) ws.close();
                            connect();
                        }, 500);
                    } else {
                        const attemptedGoogle = window.__lastAuthAttempt === 'google';
                        const fallback = attemptedGoogle ? 'Google sign-in failed' : 'Login failed';
                        errorEl.textContent = msg.payload.message || fallback;
                        errorEl.style.display = 'block';
                    }
                } else if (msg.msg_type === 'session_resume_response') {
                    if (msg.payload.success) {
                        // Load conversation history into chat (switch session)
                        const conversation = msg.payload.conversation || [];
                        try { chat.innerHTML = ''; } catch {}
                        for (const m of conversation) {
                            // Mask passwords in user messages when replaying history
                            const content = m.role === 'user' ? maskPasswords(m.content) : m.content;
                            addMsg(m.role === 'user' ? 'user' : 'ai', content);
                        }
                        const sid = msg.payload.session_id || msg.payload.rhodes_id || '';
                        if (sid) {
                            RHODES_ID = sid;
                            rhodesStorage.setItem('rhodes_session_id', RHODES_ID);
                            const sessionEl = document.getElementById('session-id');
                            if (sessionEl) {
                                sessionEl.textContent = RHODES_ID;
                                sessionEl.style.display = 'inline';
                            }
                        }
                        window.__pendingSessionSwitch = null;
                        addMsg('ai', `Session ${sid || '(unknown)'} resumed. ${msg.payload.message_count} messages loaded.`);
                    } else {
                        addMsg('ai', `Failed to resume session: ${msg.payload.error}`);
                    }
                } else if (msg.msg_type === 'session_new_response') {
                    if (msg.payload.success) {
                        // Clear chat and switch to new session
                        try { chat.innerHTML = ''; } catch {}
                        const sid = msg.payload.session_id || '';
                        if (sid) {
                            RHODES_ID = sid;
                            rhodesStorage.setItem('rhodes_session_id', RHODES_ID);
                            const sessionEl = document.getElementById('session-id');
                            if (sessionEl) {
                                sessionEl.textContent = RHODES_ID;
                                sessionEl.style.display = 'inline';
                            }
                        }
                        showToast('New session created');
                        addMsg('ai', 'Started a fresh session. How can I help you?');
                    } else {
                        showToast('Failed to create session: ' + (msg.payload.error || 'Unknown error'));
                    }
                } else if (msg.msg_type === 'session_list_response') {
                    // Resolve pending dropdown request (preferred), otherwise optionally show in chat.
                    if (msg.payload && msg.payload.success && Array.isArray(msg.payload.sessions)) {
                        const sessions = msg.payload.sessions;
                        if (window._pendingSessionListPromise) {
                            const resolve = window._pendingSessionListResolve;
                            window._pendingSessionListPromise = null;
                            window._pendingSessionListResolve = null;
                            window._pendingSessionListReject = null;
                            try { resolve && resolve(sessions); } catch {}
                            return;
                        }
                        if (window.__showSessionListInChat) {
                            window.__showSessionListInChat = false;
                            let listHtml = '<strong>Your Sessions:</strong><br>';
                            for (const s of sessions.slice(0, 10)) {
                                const date = s.updated_at ? new Date(s.updated_at).toLocaleDateString() : (s.created_at ? new Date(s.created_at).toLocaleDateString() : '');
                                const title = (s.title || '').trim() || s.session_id || 'Session';
                                listHtml += `<span style="color:var(--cyan)">${escHtml(s.session_id)}</span> (${escHtml(date)}) - ${escHtml(title)}<br>`;
                            }
                            addMsg('ai', listHtml);
                        }
                    } else {
                        if (window._pendingSessionListPromise) {
                            const reject = window._pendingSessionListReject;
                            window._pendingSessionListPromise = null;
                            window._pendingSessionListResolve = null;
                            window._pendingSessionListReject = null;
                            try { reject && reject(new Error((msg.payload && (msg.payload.error || msg.payload.message)) || 'Session list failed')); } catch {}
                        }
                    }
                } else if (msg.msg_type === 'model_set_response') {
                    if (msg.payload && msg.payload.success) {
                        const model = (msg.payload.model || '').toString().toLowerCase();
                        const pretty =
                            model === 'opus' ? 'ALPHA' :
                            model === 'sonnet' ? 'BETA' :
                            model === 'deepseek' ? 'DELTA' :
                            model === 'haiku' ? 'ADA' :
                            (model ? model.toUpperCase() : 'MODEL');
                        showToast(`Mode switched to ${pretty}`);
                    } else {
                        const err = (msg.payload && (msg.payload.error || msg.payload.message)) ? (msg.payload.error || msg.payload.message) : 'Model switch failed';
                        showToast('Mode switch failed');
                    }
                } else if (msg.msg_type === 'voice_language_hint') {
                    // Server sent language hint for voice recognition (tutor mode)
                    if (msg.payload && msg.payload.language) {
                        const lang = msg.payload.language;
                        const tutorLang = msg.payload.tutor_language || '';
                        console.log('Voice language hint received:', lang, 'tutor:', tutorLang);
                        
                        // Store tutor language for dual-mode recognition
                        window.rhodesActiveTutorLang = lang;
                        
                        // Update the language selector
                        const langSelect = document.getElementById('lang-select');
                        if (langSelect) {
                            langSelect.value = lang;
                        }
                        
                        // Update Web Speech API recognition language AND restart if active
                        if (VoiceChat && VoiceChat.recognition) {
                            const wasRunning = VoiceChat.isRecording;
                            if (wasRunning) {
                                try { VoiceChat.recognition.stop(); } catch(e) {}
                            }
                            VoiceChat.recognition.lang = lang;
                            console.log('Speech recognition language updated to:', lang);
                            // Restart after brief delay if was running
                            if (wasRunning) {
                                setTimeout(() => {
                                    try { VoiceChat.recognition.start(); } catch(e) {}
                                }, 200);
                            }
                        }
                        
                        // Show toast notification
                        const langNames = {
                            'de-DE': 'German',
                            'fr-FR': 'French',
                            'es-ES': 'Spanish',
                            'it-IT': 'Italian',
                            'ru-RU': 'Russian',
                            'en-US': 'English'
                        };
                        const langName = langNames[lang] || lang;
                        showToast('Voice switched to ' + langName + ' - speak ' + langName + ' phrases clearly');
                    }
                } else if (msg.msg_type === 'session_rotated') {
                    // Backend rotated the session id; keep all tabs in sync.
                    if (msg.payload && msg.payload.new_session_id) {
                        RHODES_ID = msg.payload.new_session_id;
                        rhodesStorage.setItem('rhodes_session_id', RHODES_ID);
                        const sessionEl = document.getElementById('session-id');
                        if (sessionEl) {
                            sessionEl.textContent = RHODES_ID;
                            sessionEl.style.display = 'inline';
                        }
                        const reason = (msg.payload.reason || '').toString().toLowerCase();
                        if (reason === 'model_switch' && msg.payload.model) {
                            const model = (msg.payload.model || '').toString().toLowerCase();
                            const pretty =
                                model === 'opus' ? 'ALPHA' :
                                model === 'sonnet' ? 'BETA' :
                                model === 'deepseek' ? 'DELTA' :
                                model === 'haiku' ? 'ADA' :
                                (model ? model.toUpperCase() : 'MODEL');
                            showToast(`Mode switched to ${pretty}`);
                        } else {
                            showToast('Session rotated');
                        }
                    }
                } else if (msg.msg_type === 'local_file_request') {
                    // Handle local file operations via browser extension
                    handleLocalFileRequest(msg);
                } else if (msg.msg_type === 'tool_call') {
                    const tool = msg.payload;
                    if (activeReqId && tool && tool.req_id && tool.req_id !== activeReqId) return;
                    const toolName = tool.name || 'unknown';
                    const toolArgs = tool.arguments || {};
                    const isPrivileged = !IS_GUEST && USER_TOKEN;
                    const round = tool.round || 0;

                    if (toolName.includes('think') && !isPrivileged) return;

                    const status = tool.status || 'complete';
                    const fingerprintSrc =
                        toolArgs.command || toolArgs.path || toolArgs.thought || (typeof tool.result === 'string' ? tool.result : '') || JSON.stringify(toolArgs || {}).slice(0, 200);
                    const fp = `tool:${toolName}:${round}:${status}:${String(fingerprintSrc).slice(0, 180)}`;
                    if (_seenRecently(fp, 2000)) return;
                    // Show all tool statuses (starting/running/complete) so it doesn't look "sporadic".
                    
                    // Message and respond tools should display as normal messages, not tool calls
                    if (toolName === 'message' || toolName === 'respond') {
                        // Only display on 'complete' status to avoid showing same message twice
                        if (status !== 'complete') return;
                        
                        let messageText = '';
                        
                        // Check result object first (what the tool returned)
                        if (tool.result) {
                            if (typeof tool.result === 'string') {
                                try {
                                    const parsed = JSON.parse(tool.result);
                                    if (parsed && typeof parsed === 'object') {
                                        // Check for special message/respond result markers
                                        if (parsed._rhodes_intermediate_message || parsed._rhodes_final_response) {
                                            messageText = parsed.message || parsed.response || '';
                                        } else {
                                            messageText = parsed.message || parsed.response || '';
                                        }
                                    }
                                } catch (e) {
                                    // Not JSON, use as raw string
                                    messageText = tool.result;
                                }
                            } else if (tool.result && typeof tool.result === 'object') {
                                // Check for special message/respond result markers
                                if (tool.result._rhodes_intermediate_message || tool.result._rhodes_final_response) {
                                    messageText = tool.result.message || tool.result.response || '';
                                } else {
                                    messageText = tool.result.message || tool.result.response || '';
                                }
                            }
                        }
                        
                        // Fall back to arguments (what was sent to the tool)
                        if (!messageText) {
                            messageText = toolArgs.message || toolArgs.response || '';
                        }
                        
                        if (messageText) {
                            const mk = 'toolmsg:' + messageText.slice(0, 240);
                            if (_seenRecently(mk, 2000)) return;
                            // Collapse tool log so future tool calls appear AFTER this message
                            if (typeof collapseToolCalls === 'function') collapseToolCalls();
                            addMsg('ai', messageText);
                        }
                        return;
                    }

                    let msgEl = window.toolLogEl;
                    if (!msgEl) {
                        msgEl = document.createElement('div');
                        msgEl.className = 'msg ai tool-log';
                        msgEl.innerHTML = '<div style="color:var(--dim);font-size:12px;margin-bottom:8px;">TOOLS</div>';
                        document.getElementById('chat').appendChild(msgEl);
                        window.toolLogEl = msgEl;
                    }

                    const toolDiv = document.createElement('div');
                    toolDiv.className = 'tool-call-inline';

                    let detailsContent = '';
                    let preview = '';
                    
                    if (toolName.includes('think') && toolArgs.thought) {
                        const t = toolArgs.thought;
                        const thoughtHtml = escapeHtml(t).split('\n').join('<br>');
                        detailsContent = '<div class="tool-call-thought">' + thoughtHtml + '</div>';
                        preview = t.substring(0, 80).split('\n').join(' ') + '...';
                    } else if (toolArgs.command) {
                        detailsContent = '<pre class="tool-call-args">' + escapeHtml(toolArgs.command) + '</pre>';
                        preview = toolArgs.command.substring(0, 60);
                    } else if (toolArgs.path) {
                        detailsContent = '<pre class="tool-call-args">' + escapeHtml(toolArgs.path) + '</pre>';
                        preview = toolArgs.path;
                    } else {
                        detailsContent = '<pre class="tool-call-args">' + escapeHtml(JSON.stringify(toolArgs, null, 2)) + '</pre>';
                        preview = Object.keys(toolArgs).slice(0,3).join(', ');
                    }

                    const headerHtml = '<div class="tool-call-header" onclick="this.parentElement.classList.toggle(String.fromCharCode(39)+String.fromCharCode(101)+String.fromCharCode(120)+String.fromCharCode(112)+String.fromCharCode(97)+String.fromCharCode(110)+String.fromCharCode(100)+String.fromCharCode(101)+String.fromCharCode(100)+String.fromCharCode(39))"><span class="tool-call-icon">⚡</span><span class="tool-call-name">' + escapeHtml(toolName) + '</span><span class="tool-call-round">R' + round + '</span></div>';
                    const statusBadge = '<span style="margin-left:8px;color:var(--dim);font-size:11px;">' + escapeHtml(String(status)) + '</span>';
                    toolDiv.innerHTML = headerHtml.replace('</div>', statusBadge + '</div>') + '<div class="tool-call-preview">' + escapeHtml(preview) + '</div><div class="tool-call-details">' + detailsContent + '</div>';

                    // Idempotent tool rendering: update existing entry instead of appending duplicates.
                    const toolKey = `${toolName}|${round}|${preview}`;
                    const existing = window._toolItems.get(toolKey);
                    if (existing && existing.el && existing.el.isConnected) {
                        // Update HTML in place to reflect latest status/details.
                        existing.el.innerHTML = toolDiv.innerHTML;
                        existing.lastStatus = status;
                    } else {
                        msgEl.appendChild(toolDiv);
                        window._toolItems.set(toolKey, { el: toolDiv, lastStatus: status });
                    }
                    document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
                } else if (msg.msg_type === 'interrupt_ack') {
                    hideLoading();
                    showToast('Interrupted');
                }

            };

            ws.onclose = (event) => {
                if (epoch !== wsEpoch) return;
                clearTimeout(connectionTimeout);
                const wasReady = wsReadyForMessages;
                wsReadyForMessages = false;
                connectionInProgress = false;
                setStatus(false, 'DISCONNECTED');
                const debugBtn = document.getElementById('debug-btn');
                if (debugBtn) debugBtn.style.display = 'inline';

                window._wsConnectAttempts = (window._wsConnectAttempts || 0) + 1;
                const attempt = window._wsConnectAttempts;
                if (!wasReady && attempt > 10) {
                    console.log('[WS] Still retrying after ' + attempt + ' attempts (auth never succeeded)');
                    showToast('Still reconnecting…');
                }
                const delay = Math.min(1500 * Math.pow(1.7, attempt - 1), 30000);
                console.log('[WS] Reconnecting in ' + delay + 'ms (attempt ' + attempt + ')');
                setTimeout(connect, delay);
            };
            ws.onerror = (error) => {
                if (epoch !== wsEpoch) return;
                clearTimeout(connectionTimeout);
                const wasReady = wsReadyForMessages;
                wsReadyForMessages = false;
                connectionInProgress = false;
                setStatus(false, 'ERROR');
                const debugBtn = document.getElementById('debug-btn');
                if (debugBtn) debugBtn.style.display = 'inline';

                window._wsConnectAttempts = (window._wsConnectAttempts || 0) + 1;
                const attempt = window._wsConnectAttempts;
                if (!wasReady && attempt > 10) {
                    console.log('[WS] Still retrying after ' + attempt + ' attempts (auth never succeeded)');
                    showToast('Still reconnecting…');
                }
                const delay = Math.min(1500 * Math.pow(1.7, attempt - 1), 30000);
                console.log('[WS] Reconnecting in ' + delay + 'ms (attempt ' + attempt + ')');
                setTimeout(connect, delay);
            };
        }

        // Image attachments
        let pendingImages = [];
        const imageBtn = document.getElementById('image-btn');
        const imageInput = document.getElementById('image-input');
        const imagePreview = document.getElementById('image-preview');

        function addImage(file) {
            if (!file.type.startsWith('image/')) return;
            if (pendingImages.length >= 5) {
                alert('Maximum 5 images');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result;
                pendingImages.push({
                    type: 'image',
                    media_type: file.type,
                    data: base64.split(',')[1],  // Remove data:image/xxx;base64, prefix
                    name: file.name
                });
                updateImagePreview();
            };
            reader.readAsDataURL(file);
        }

	        function updateImagePreview() {
	            // Attachment UI is optional; if elements are not present, do nothing.
	            if (!imagePreview) return;
	            if (pendingImages.length === 0) {
	                imagePreview.style.display = 'none';
	                if (imageBtn) {
	                    imageBtn.style.borderColor = 'var(--cyan)';
	                    imageBtn.style.color = 'var(--cyan)';
	                }
	                return;
	            }
	            imagePreview.style.display = 'flex';
	            imagePreview.style.gap = '8px';
	            imagePreview.style.flexWrap = 'wrap';
	            imagePreview.style.alignItems = 'center';
	            if (imageBtn) {
	                imageBtn.style.borderColor = 'var(--green)';
	                imageBtn.style.color = 'var(--green)';
	            }
	            imagePreview.innerHTML = pendingImages.map((img, i) => {
	                const isImage = img.type === 'image';
	                const icon = img.type === 'document' ? '📄' : (img.type === 'text' ? '📝' : '🖼️');
	                if (isImage) {
                    return `<div style="position:relative;display:inline-block;">
                        <img src="data:${img.media_type};base64,${img.data}" style="height:60px;border-radius:4px;border:1px solid var(--cyan);">
                        <button onclick="removeImage(${i})" style="position:absolute;top:-8px;right:-8px;background:var(--magenta);border:none;color:#fff;width:20px;height:20px;border-radius:50%;cursor:pointer;font-size:12px;">×</button>
                    </div>`;
                } else {
                    return `<div style="position:relative;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;background:#1a1a1a;border:1px solid var(--cyan);border-radius:4px;">
                        <span style="font-size:20px;">${icon}</span>
                        <span style="color:var(--text);font-size:12px;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${img.name}</span>
                        <button onclick="removeImage(${i})" style="background:var(--magenta);border:none;color:#fff;width:18px;height:18px;border-radius:50%;cursor:pointer;font-size:11px;line-height:1;">×</button>
                    </div>`;
                }
            }).join('') + `<span style="color:var(--cyan);font-size:12px;">${pendingImages.length}/5 files</span>`;
        }

        window.removeImage = function(index) {
            pendingImages.splice(index, 1);
            updateImagePreview();
        };

        // Download user-created website content
        window.downloadSiteContent = function(elementId) {
            const textarea = document.getElementById(elementId);
            if (!textarea) return;

            const content = textarea.value
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&');
            const filename = textarea.dataset.filename || 'website.html';

            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        // Preview panel state
        let currentPreviewId = null;
        let currentPreviewContent = null;
        let currentPreviewFilename = null;

        // Open preview in sandboxed side panel
        window.openPreview = function(elementId) {
            const textarea = document.getElementById(elementId);
            if (!textarea) return;

            currentPreviewId = elementId;
            currentPreviewFilename = textarea.dataset.filename || 'preview.html';
            currentPreviewContent = textarea.value
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&');

            // Update title
            document.getElementById('preview-title').textContent = `Preview: ${currentPreviewFilename}`;

            // Load content into sandboxed iframe
            const frame = document.getElementById('preview-frame');
            const blob = new Blob([currentPreviewContent], { type: 'text/html' });
            frame.src = URL.createObjectURL(blob);

            // Show panel
            document.getElementById('preview-panel').classList.add('open');
            document.getElementById('preview-overlay').classList.add('open');
        };

        // Close preview panel
        window.closePreview = function() {
            document.getElementById('preview-panel').classList.remove('open');
            document.getElementById('preview-overlay').classList.remove('open');
            // Clear iframe to stop any scripts
            document.getElementById('preview-frame').src = 'about:blank';
            currentPreviewId = null;
            currentPreviewContent = null;
        };

        // Download from preview
        window.downloadPreview = function() {
            if (!currentPreviewContent) return;
            const blob = new Blob([currentPreviewContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentPreviewFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        // Open preview in new tab
        window.openPreviewNewTab = function() {
            if (!currentPreviewContent) return;
            const blob = new Blob([currentPreviewContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        };

        // Deploy preview to sites
        window.deployPreview = function() {
            if (!currentPreviewContent) return;
            const siteName = prompt('Enter site name (will be accessible at rhodesagi.com/sites/NAME/):',
                currentPreviewFilename.replace('.html', '').replace(/[^a-z0-9-]/gi, '-'));
            if (!siteName) return;

            // Send deploy request via websocket
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    msg_type: 'deploy_site',
                    payload: {
                        site_name: siteName,
                        html: currentPreviewContent
                    }
                }));
                alert(`Deploying to rhodesagi.com/sites/${siteName}/...`);
                closePreview();
            } else {
                alert('Not connected to server');
            }
        };

        if (imageBtn && imageInput) imageBtn.onclick = () => imageInput.click();
        if (imageInput) imageInput.onchange = (e) => {
            Array.from(e.target.files).forEach(addFile);
            imageInput.value = '';
        };

        // Universal file handler (images, PDFs, text files, etc.)
        function addFile(file) {
            if (pendingImages.length >= 5) {
                showToast('Maximum 5 attachments');
                return;
            }

            const isImage = file.type.startsWith('image/');
            const isPdf = file.type === 'application/pdf';
            const isText = file.type.startsWith('text/') ||
                           /\.(txt|md|json|csv|xml|html|css|js|py|java|c|cpp|h|yml|yaml|log)$/i.test(file.name);

            if (!isImage && !isPdf && !isText) {
                showToast('Unsupported file type: ' + file.type);
                return;
            }

            // Size limit: 10MB for images/PDFs, 1MB for text
            const maxSize = isText ? 1024 * 1024 : 10 * 1024 * 1024;
            if (file.size > maxSize) {
                showToast(`File too large (max ${isText ? '1MB' : '10MB'})`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result;
                pendingImages.push({
                    type: isImage ? 'image' : (isPdf ? 'document' : 'text'),
                    media_type: file.type || 'text/plain',
                    data: base64.split(',')[1],
                    name: file.name
                });
                updateImagePreview();
                showToast('Added: ' + file.name);
            };
            reader.readAsDataURL(file);
        }

        // Webcam functionality
        const webcamBtn = document.getElementById('webcam-btn');
        const webcamModal = document.getElementById('webcam-modal');
        const webcamVideo = document.getElementById('webcam-video');
        const webcamCanvas = document.getElementById('webcam-canvas');
        const webcamCapture = document.getElementById('webcam-capture');
        const webcamCancel = document.getElementById('webcam-cancel');
        let webcamStream = null;

        if (webcamBtn && webcamModal && webcamVideo && webcamCanvas && webcamCapture) webcamBtn.onclick = async () => {
            try {
                // Disable capture until video is ready
                webcamCapture.disabled = true;
                webcamCapture.style.opacity = '0.5';

                webcamStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
                });
                webcamVideo.srcObject = webcamStream;
                webcamModal.style.display = 'flex';

                // Enable capture once video is playing
                webcamVideo.onloadedmetadata = () => {
                    webcamVideo.play();
                };
                webcamVideo.onplaying = () => {
                    webcamCapture.disabled = false;
                    webcamCapture.style.opacity = '1';
                };
            } catch (err) {
                console.error('Webcam error:', err);
                showToast('Could not access webcam');
            }
        };

        if (webcamCapture && webcamVideo && webcamCanvas) webcamCapture.onclick = () => {
            // Check video is ready
            if (webcamVideo.videoWidth === 0 || webcamVideo.videoHeight === 0) {
                showToast('Camera not ready yet, please wait...');
                return;
            }

            // Capture frame from video
            webcamCanvas.width = webcamVideo.videoWidth;
            webcamCanvas.height = webcamVideo.videoHeight;
            const ctx = webcamCanvas.getContext('2d');
            ctx.drawImage(webcamVideo, 0, 0);

            // Convert to blob and add as image
            webcamCanvas.toBlob((blob) => {
                if (!blob) {
                    showToast('Failed to capture image');
                    return;
                }
                const file = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
                addImage(file);

                // Auto-add prompt for portrait
                const input = document.getElementById('input');
                if (!input.value.trim()) {
                    input.value = 'Draw my portrait in ASCII art based on this photo';
                }

                closeWebcam();
                showToast('Photo captured! Click SEND to send');
            }, 'image/jpeg', 0.9);
        };

        if (webcamCancel) webcamCancel.onclick = closeWebcam;

        function closeWebcam() {
            if (webcamStream) {
                webcamStream.getTracks().forEach(track => track.stop());
                webcamStream = null;
            }
            webcamVideo.srcObject = null;
            webcamModal.style.display = 'none';
        }

        // Paste handler for files (but don't block text paste in input)
        document.addEventListener('paste', (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            // If focused on text input, check if clipboard has text - if so, let it paste normally
            const activeEl = document.activeElement;
            const isTextInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

            // Check if clipboard has text content
            const hasText = Array.from(items).some(item => item.kind === 'string' && item.type === 'text/plain');

            // If in text input and clipboard has text, let normal paste happen
            if (isTextInput && hasText) {
                return; // Don't interfere with text paste
            }

            // Handle file paste
            for (const item of items) {
                if (item.kind === 'file') {
                    e.preventDefault();
                    addFile(item.getAsFile());
                }
            }
        });

        // Drag and drop handler - wrapped for pywebview compatibility
        function setupDragDrop() {
            const chatEl = document.getElementById('chat');
            if (!chatEl || !document.body) {
                // DOM not ready, try again
                setTimeout(setupDragDrop, 50);
                return;
            }
            let dragCounter = 0;

            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                chatEl.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
                document.body.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            chatEl.addEventListener('dragenter', () => {
                dragCounter++;
                chatEl.classList.add('drag-over');
            });

            chatEl.addEventListener('dragleave', () => {
                dragCounter--;
                if (dragCounter === 0) {
                    chatEl.classList.remove('drag-over');
                }
            });

            chatEl.addEventListener('drop', (e) => {
                dragCounter = 0;
                chatEl.classList.remove('drag-over');
                const files = e.dataTransfer?.files;
                if (files && files.length > 0) {
                    Array.from(files).forEach(addFile);
                }
            });
        }
        // Start setup when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupDragDrop);
        } else {
            setupDragDrop();
        }

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
function parseModelSwitchPrefix(rawText) {
            const s = String(rawText || "").trim();
            // Accept flags ANYWHERE: "text --alpha more" or "--alpha text" or just "--beta"
            const m = s.match(/(?:--|\/)(alpha|beta|delta|ada|rhodes-delta-format)/i);
            if (!m) return null;
            const flag = String(m[1] || "").toLowerCase();
            // Remove the flag (and any trailing punctuation) from message, keep full text
            const rest = s.replace(/\s*(?:--|\/)(alpha|beta|delta|ada|rhodes-delta-format)[\s:,\-]*/i, " ").trim();
            const map = { alpha: "opus", beta: "sonnet", delta: "deepseek", ada: "haiku", "rhodes-delta-format": "rhodes-delta-format" };
            const model = map[flag] || null;
            if (!model) return null;
            return { flag, model, rest };
        }

        function send() {
            console.log('send function called');
            let text = input.value.trim();
            if (!text && pendingImages.length === 0) return;

            // Fast interrupt: type /stop (or /interrupt) to cancel the current generation.
            const lowerCmd = text.toLowerCase();
            if (lowerCmd === '/stop' || lowerCmd === '/interrupt') {
                input.value = '';
                if (ws && ws.readyState === WebSocket.OPEN && wsReadyForMessages) {
                    ws.send(JSON.stringify({
                        msg_type: 'interrupt',
                        msg_id: generateUUID(),
                        timestamp: new Date().toISOString(),
                        payload: { reason: lowerCmd.slice(1) }
                    }));
                    showToast('Interrupt sent');
                    // Invalidate any late chunks/toolcalls/finals from the interrupted turn.
                    // (We keep a non-null id so filters can drop old events that still arrive.)
                    activeReqId = generateUUID();
                    return;
                }
                showToast('Not connected');
                return;
            }

            // Format mode slash commands - send to server without displaying as user message
            if (lowerCmd.startsWith('/rhodes-') && lowerCmd.includes('-format-')) {
                input.value = '';
                if (ws && ws.readyState === WebSocket.OPEN && wsReadyForMessages) {
                    ws.send(JSON.stringify({
                        msg_type: 'user_message',
                        msg_id: generateUUID(),
                        timestamp: new Date().toISOString(),
                        payload: { content: text }
                    }));
                    return;
                }
                showToast('Not connected');
                return;
            }

            // Group chat room mode: route sends through room_* message types.
            if (CURRENT_ROOM_ID) {
                if (pendingImages.length > 0) {
                    showToast('Rooms: attachments not supported yet');
                    pendingImages = [];
                    updateImagePreview();
                    return;
                }

                const msgId = generateUUID();
                const lower = text.toLowerCase();
                // Back-compat + preferred command:
                // - /rhodes <prompt>   (preferred)
                // - /myrhodes <prompt>
                // - /myai <prompt>    (legacy)
                const isPersonal =
                    lower.startsWith('/rhodes ') ||
                    lower.startsWith('/myrhodes ') ||
                    lower.startsWith('/myai ');

                let payloadText = text;
                if (lower.startsWith('/rhodes ')) payloadText = text.slice(7).trim();
                else if (lower.startsWith('/myrhodes ')) payloadText = text.slice(9).trim();
                else if (lower.startsWith('/myai ')) payloadText = text.slice(6).trim();
                if (!payloadText) return;

                // Local echo (avoid double-render via server echo)
                addRoomLine('user', CURRENT_USERNAME || 'You', payloadText);
                if (!isPersonal) seenRoomMsgIds.add(msgId);
                input.value = '';

                const messageObj = {
                    msg_type: isPersonal ? 'room_personal_ai_request' : 'room_message_request',
                    msg_id: msgId,
                    timestamp: new Date().toISOString(),
                    payload: {
                        room_id: CURRENT_ROOM_ID,
                        content: payloadText
                    }
                };

                if (!ws || ws.readyState !== WebSocket.OPEN || !wsReadyForMessages) {
                    queueOutboundMessage(messageObj);
                    showToast('Disconnected — queued message and reconnecting…');
                    connect();
                    showLoading();
                    if (typeof clearToolCalls === 'function') clearToolCalls();
                    return;
                }

                ws.send(JSON.stringify(messageObj));
                showLoading();
                return;
            }

            // Model switch flags for all users:
            // - --alpha /alpha (Opus)
            // - --beta  /beta  (Sonnet)
            // - --delta /delta (DeepSeek)
            // - --ada   /ada   (Haiku)
            const modelCmd = parseModelSwitchPrefix(text);
            if (modelCmd) {
                const modelSetObj = {
                    msg_type: 'model_set_request',
                    msg_id: generateUUID(),
                    timestamp: new Date().toISOString(),
                    payload: { model: modelCmd.model }
                };

                // If disconnected, queue the switch and reconnect.
                if (!ws || ws.readyState !== WebSocket.OPEN || !wsReadyForMessages) {
                    queueOutboundMessage(modelSetObj);
                    showToast(`Entering ${modelCmd.flag.toUpperCase()} mode (reconnecting)...`);
                    connect();
                } else {
                    ws.send(JSON.stringify(modelSetObj));
                    showToast(`Entering ${modelCmd.flag.toUpperCase()} mode...`);
                }

                // If no message after the flag, just switch model (keep attachments intact).
                if (!modelCmd.rest) {
                    input.value = '';
                    return;
                }

                // Continue send with the remaining text under the new model.
                text = modelCmd.rest;
            }

            // Show user message with image indicators (mask passwords for display)
            const fileIndicator = pendingImages.length > 0 ? ` [${pendingImages.length} file${pendingImages.length > 1 ? 's' : ''} attached]` : '';
            addMsg('user', maskPasswords(text) + fileIndicator);
            markGuestActivity();
            clearToolCalls();
            input.value = '';

            const messageObj = {
                msg_type: 'user_message',
                msg_id: generateUUID(),
                timestamp: new Date().toISOString(),
                payload: {
                    content: text,
                    attachments: pendingImages.map(img => ({
                        type: 'image',
                        media_type: img.media_type,
                        data: img.data
                    })),
                    audio_output: !!(globalThis.VoiceChat && globalThis.VoiceChat.voiceEnabled),
                    stream: true  // Enable streaming responses
                }
            };
            activeReqId = messageObj.msg_id;

            // Clear images after send/queue
            pendingImages = [];
            updateImagePreview();

            if (!ws || ws.readyState !== WebSocket.OPEN || !wsReadyForMessages) {
                queueOutboundMessage(messageObj);
                showToast('Disconnected — queued message and reconnecting…');
                connect();
                showLoading();
                if (typeof clearToolCalls === 'function') clearToolCalls();
                return;
            }

            ws.send(JSON.stringify(messageObj));


            showLoading();
        }

        // ============================================
        // ⚠️⚠️⚠️ CRITICAL WARNING: DO NOT MODIFY SEND BUTTON ⚠️⚠️⚠️
        // The send() function must be exposed globally for onclick handlers
        // Changing this will break mobile/desktop message sending
        // ============================================
        window.send = send;  // Expose globally for HTML onclick

        let loadingEl = null;
        const loadingTexts = ['Processing', 'Analyzing', 'Thinking', 'Generating', 'Computing'];
        let loadingInterval = null;

        function showLoading() {
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
                switch(state) {
                    case 'listening':
                        status.textContent = 'LISTENING';
                        status.classList.add('listening');
                        break;
                    case 'processing':
                        status.textContent = 'PROCESSING';
                        status.classList.add('processing');
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
            unlockAudio: function() {
                if (this.audioUnlocked) return;
                this.audioUnlocked = true;
                console.log('Audio playback unlocked');
            },

            init: function() {
                // Check for Web Speech API support
                if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                    console.log('Speech recognition not supported');
                    // Hide voice bar if not supported
                    const voiceBar = document.getElementById('voice-bar');
                    if (voiceBar) {
                        console.log("Voice bar kept visible for desktop"); // voiceBar hidden;
                    }
                    return;
                }

                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = true;  // Keep recording until explicitly stopped
                this.recognition.interimResults = true;  // Show interim results
                this.recognition.lang = document.getElementById('lang-select').value;
                this.recognition.maxAlternatives = 1;

                // Update recognition language when selector changes
                document.getElementById('lang-select').onchange = () => {
                    this.recognition.lang = document.getElementById('lang-select').value;
                    console.log('Voice language changed to:', this.recognition.lang);
                };

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

                 ╦═╗  ╦ ╦  ╔═╗  ╔╦╗  ╔═╗  ╔═╗     ╔═╗  ╦
                 ╠╦╝  ╠═╣  ║ ║   ║║  ║╣   ╚═╗     ╠═╣  ║
                 ╩╚═  ╩ ╩  ╚═╝  ═╩╝  ╚═╝  ╚═╝     ╩ ╩  ╩`;

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
                                if (cleanedTranscript && cleanedTranscript.length >= 2 && !isFillerOnly && cleanedTranscript !== this.lastSubmittedText && ws && ws.readyState === WebSocket.OPEN) {
                                    this.lastSubmittedText = cleanedTranscript;
                                    document.getElementById('input').value = '';
                                    addMsg('user', maskPasswords(cleanedTranscript));
                                    markGuestActivity();
                                    ws.send(JSON.stringify({
                                        msg_type: 'user_message',
                                        msg_id: generateUUID(),
                                        timestamp: new Date().toISOString(),
                                        payload: {
                                            content: cleanedTranscript,
                                            attachments: [],
                                            voice_mode: true,
                                            handsfree: true
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
                                ws.send(JSON.stringify({
                                    msg_type: 'user_message',
                                    msg_id: generateUUID(),
                                    timestamp: new Date().toISOString(),
                                    payload: {
                                        content: fullTranscript,
                                        attachments: [],
                                        voice_mode: true,
                                        handsfree: true
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
                            if (finalText && finalText.length >= 2 && finalText !== this.lastSubmittedText && ws && ws.readyState === WebSocket.OPEN) {
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
                                    ws.send(JSON.stringify({
                                        msg_type: 'user_message',
                                        msg_id: generateUUID(),
                                        timestamp: new Date().toISOString(),
                                        payload: {
                                            content: finalText,
                                            attachments: [],
                                            voice_mode: true,
                                            handsfree: !this.pushToTalk
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

                // Bind record button (push-to-talk style)
                const recordBtn = document.getElementById('voice-record-btn');
                if (recordBtn) {
                    // Click to start/stop recording
                    recordBtn.onclick = () => this.toggleRecording();

                    // Mouse hold for push-to-talk
                    recordBtn.onmousedown = (e) => {
                        e.preventDefault();
                        this.startRecording();
                    };
                    recordBtn.onmouseup = (e) => {
                        if (this.isRecording) {
                            e.preventDefault();
                            this.stopRecording();
                            setTimeout(() => {
                                if (document.getElementById('input').value.trim()) {
                                    send();
                                }
                            }, 100);
                        }
                    };
                    recordBtn.onmouseleave = () => {
                        if (this.isRecording) this.stopRecording();
                    };

                    // Mobile touch events
                    recordBtn.ontouchstart = (e) => {
                        e.preventDefault();
                        this.startRecording();
                    };
                    recordBtn.ontouchend = (e) => {
                        if (this.isRecording) {
                            e.preventDefault();
                            this.stopRecording();
                            setTimeout(() => {
                                if (document.getElementById('input').value.trim()) {
                                    send();
                                }
                            }, 100);
                        }
                    };
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
                    showToast('HANDS-FREE MODE');
                    // Start recording unless TTS is currently playing
                    if (!this.ttsPlaying) {
                        this.startRecording();
                    }
                } else {
                    if (takeover) takeover.classList.remove('active');
                    showToast('PUSH-TO-TALK MODE');
                    this.stopRecording();
                }
            },

            updateModeIndicator: function() {
                const modeBtn = document.getElementById('voice-mode-btn');
                if (modeBtn) {
                    modeBtn.innerHTML = this.pushToTalk ? '🎤❌ HANDS-FREE' : '🎤✅ HANDS-FREE';
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
                console.log('startRecording called, recognition=', !!this.recognition);
                // Use Whisper for language learning (better multilingual support)
                if (window.rhodesActiveTutorLang) {
                    console.log('Using Whisper for tutor mode, lang:', window.rhodesActiveTutorLang);
                    this.startWhisperRecording();
                    return;
                }
                if (!this.recognition) {
                    console.error('No recognition object!');
                    return;
                }
                // Track voice usage for profile image feature
                if (!rhodesStorage.getItem('hasUsedVoice')) {
                    rhodesStorage.setItem('hasUsedVoice', 'true');
                }
                try {
                    this.recognition.start();
                    this.isRecording = true;
                    document.getElementById('voice-record-btn').classList.add('recording');
                    // Only show voice indicator in push-to-talk mode (hands-free uses takeover)
                    if (this.pushToTalk) {
                        document.getElementById('voice-indicator').classList.add('active');
                    }
                    console.log('Recording started successfully');
                } catch (e) {
                    console.error('Failed to start recording:', e);
                    if (e.name === 'InvalidStateError') {
                        // Already started - just continue
                        this.isRecording = true;
                    } else {
                        showToast('Failed to start voice: ' + e.message);
                    }
                }
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
                document.getElementById('voice-record-btn').classList.remove('recording');
                document.getElementById('voice-indicator').classList.remove('active');
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
                    
                    // Set up silence detection using Web Audio API
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const source = audioContext.createMediaStreamSource(this.whisperStream);
                    const analyser = audioContext.createAnalyser();
                    analyser.fftSize = 512;
                    source.connect(analyser);
                    
                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    let silenceStart = null;
                    let hasSpoken = false;
                    const SILENCE_THRESHOLD = 10;  // Lowered for sensitivity  // Higher threshold filters background noise  // Below this = silence
                    const SILENCE_DURATION = 1500;
                    const GRACE_PERIOD = 2500;  // 2.5s grace period  // 3.5s grace period  // 2.5s grace period before silence detection
                    const recordingStartTime = Date.now(); // 1.5 seconds of silence to stop
                    
                    const self = this;
                    
                    // Check for silence periodically
                    this.silenceCheckInterval = setInterval(() => {
                        analyser.getByteFrequencyData(dataArray);
                        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                        
                        if (average > SILENCE_THRESHOLD) {
                            // Sound detected
                            hasSpoken = true;
                            silenceStart = null;
                        } else if (hasSpoken && (Date.now() - recordingStartTime > GRACE_PERIOD)) {
                            // Silence after speech
                            if (!silenceStart) {
                                silenceStart = Date.now();
                            } else if (Date.now() - silenceStart > SILENCE_DURATION) {
                                // Silence for 1.5 seconds - stop recording
                                console.log("Silence detected, stopping Whisper recording");
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
                        
                        self.setStatus("processing");
                        self.showWaitingFace();
                        const audioBlob = new Blob(self.whisperChunks, { type: "audio/webm" });
                        await self.sendToWhisper(audioBlob);
                        // Clean up stream
                        if (self.whisperStream) {
                            self.whisperStream.getTracks().forEach(t => t.stop());
                        }
                    };
                    
                    this.whisperRecorder.start();
                    this.isRecording = true;
                    this.setStatus("listening");
                    document.getElementById("voice-record-btn").classList.add("recording");
                    document.getElementById("voice-indicator").classList.add("active");
                    console.log("Whisper recording started with silence detection");

                    // Safety timeout - stop after 30s max to prevent infinite freeze
                    this.whisperSafetyTimeout = setTimeout(() => {
                        console.log("Safety timeout - stopping Whisper recording");
                        this.stopWhisperRecording();
                    }, 6000);  // 6 second max
                } catch (e) {
                    console.error("Whisper recording error:", e);
                    showToast("Microphone access denied");
                }
            },
            
            stopWhisperRecording: function() {
                if (this.whisperRecorder && this.whisperRecorder.state === 'recording') {
                    this.whisperRecorder.stop();
                }
                this.isRecording = false;
                document.getElementById('voice-record-btn').classList.remove('recording');
                document.getElementById('voice-indicator').classList.remove('active');
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
                        
                        if (transcript) {
                            document.getElementById('input').value = transcript;
                            // Auto-submit if in hands-free mode
                            if (!this.pushToTalk && ws && ws.readyState === WebSocket.OPEN) {
                                addMsg('user', maskPasswords(transcript));
                                ws.send(JSON.stringify({
                                    msg_type: 'user_message',
                                    msg_id: generateUUID(),
                                    timestamp: new Date().toISOString(),
                                    payload: {
                                        content: transcript,
                                        attachments: [],
                                        voice_mode: true,
                                        handsfree: true
                                    }
                                }));
                                showLoading();
                                document.getElementById('input').value = '';
                            }
                        }
                    } else {
                        console.error('Whisper error:', data.error);
                    }
                } catch (e) {
                    console.error('Whisper fetch error:', e);
                }
            },



            // Show face with "listening..." as mouth and highlighted eye
            showListeningFace: function() {
                // Don't show face until it has debuted (first speaking)
                if (!this.faceDebuted) return;

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
                // Don't show face until it has debuted (first speaking)
                if (!this.faceDebuted) {
                    console.log('showWaitingFace: skipping, face not yet debuted');
                    return;
                }

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
                if (!this.voiceEnabled || !text) {
                    console.log('speak() aborted: voiceEnabled=', this.voiceEnabled);
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
                    const response = await fetch(this.ttsEndpoint + '/stream', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: cleanText, language: lang })
                    });

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
                            // Fallback: reset to listening if hands-free
                            if (!self.pushToTalk) {
                                self.setStatus('listening');
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
                        }, 6000);  // 6 second max

                        // Try to play with autoplay handling
                        try {
                            // STOP RECOGNITION before playing to prevent feedback loop
                            if (!self.pushToTalk && self.isRecording) {
                                console.log('Stopping recognition before TTS playback');
                                self.stopRecording();
                            }
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
                    if (!this.pushToTalk) this.setStatus("listening");
                    this.ttsPlaying = false;
                    this.stopSpeakingAnimation();
                }
            }
        };

        // Initialize voice chat
        VoiceChat.init();

        // Unlock audio on first user interaction (click or keypress)
        const unlockOnce = () => {
            VoiceChat.unlockAudio();
            document.removeEventListener('click', unlockOnce);
            document.removeEventListener('keydown', unlockOnce);
        };
        document.addEventListener('click', unlockOnce);
        document.addEventListener('keydown', unlockOnce);

        // Hook into message display to auto-speak AI responses
        const originalAddMsg = addMsg;
        addMsg = function(role, text) {
            originalAddMsg(role, text);
            if (role === 'ai' && VoiceChat.voiceEnabled) {
                VoiceChat.speak(text);
            }
        };
