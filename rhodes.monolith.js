// =============================================================================
// RHODES CONFIGURATION MODULE
// =============================================================================
// All filtering, hidden tools, and display settings consolidated here.
// Reference: window.RHODES_CONFIG throughout codebase.
// 
// TODO: CODEBASE REWRITE PLAN
// 1. Consolidate all tool filtering to use RHODES_CONFIG.hiddenTools
// 2. Move split mode inter-instance messaging to server-side
// 3. Unify message tag handling (verification, system messages)
// 4. Extract all hardcoded model names to RHODES_CONFIG.models
// 5. Centralize WebSocket message handlers
// 6. Create proper state management for split mode
// =============================================================================

window.RHODES_CONFIG = {
    // Tools hidden from UI display (internal/sensitive operations)
    hiddenTools: [
        'session_search', 'session_fulltext', 'claude_search',
        'think', 'think_get', 'think_search', 'think_original', 'think_lang',
        'message', 'respond',
        'bayes_calculate', 'bayes_check', 'bayes_status',
        'recall_lang', 'lang_stats',
        'people_search', 'people_search_phone', 'people_search_ip',
        'parse_email_name', 'enrich_user', 'get_search_urls',
        'report_to_alliance', 'mark_insight'
    ],
    
    // Model name mappings
    models: {
        opus: ['r1.1a', 'r1.2a', 'opus', 'alpha', 'rhodes-alpha-format'],
        sonnet: ['r1.1b', 'r1.2b', 'sonnet', 'beta', 'rhodes-beta-format'],
        haiku: ['r1.1c', 'r1.2c', 'haiku', 'ada', 'rhodes-ada-format'],
        deepseek: ['r1.1d', 'r1.2d', 'deepseek', 'delta', 'rhodes-delta-format'],
        grok: ['r1.12f', 'grok', 'zeta'],
    kimi: ['r1.0e', 'r1.1e', 'r1.2e', 'r1.8e', 'r1.9e', 'r1.10e', 'r1.11e', 'r1.12e', 'kimi', 'epsilon'],
    gpt4o: ['r1.14d', 'r1.15d', 'gpt4o', 'gpt-4o'],
    claude3opus: ['r1.13d']
    },
    
    // Admin status (set by auth response)
    isAdmin: false,
    
    // Check if tool should be hidden (admin sees all)
    isHiddenTool: function(toolName) {
        if (this.isAdmin) return false;  // Admin sees everything
        return this.hiddenTools.includes(toolName);
    }
};

// Rhodes storage wrapper - handles pywebview/webkit where localStorage throws

// Completion notification sound
window.playCompletionSound = (function() {
    let audioCtx = null;
    return function() {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.frequency.value = 880; // A5 note
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.3);
        } catch(e) { console.log('Sound error:', e); }
    };
})();

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

// iOS Rhodes native bridge
window.rhodesIOS = (function() {
    const isRhodesIOS = !!window.webkit?.messageHandlers?.rhodes;

    return {
        isIOS: isRhodesIOS,

        // Pick a file from iOS Files app
        pickFile: function(types) {
            if (isRhodesIOS) {
                window.webkit.messageHandlers.rhodes.postMessage({
                    action: "pickFile",
                    types: types || ["public.item"]
                });
            }
        },

        // Read file content by path
        readFile: function(path) {
            if (isRhodesIOS) {
                window.webkit.messageHandlers.rhodes.postMessage({
                    action: "readFile",
                    path: path
                });
            }
        },

        // Write file to app sandbox
        writeFile: function(name, content) {
            if (isRhodesIOS) {
                window.webkit.messageHandlers.rhodes.postMessage({
                    action: "writeFile",
                    name: name,
                    content: content
                });
            }
        },

        // Take photo with camera
        takePhoto: function() {
            if (isRhodesIOS) {
                window.webkit.messageHandlers.rhodes.postMessage({
                    action: "takePhoto"
                });
            }
        }
    };
})();

// iOS event listeners (callbacks from native)
if (window.rhodesIOS.isIOS) {
    window.addEventListener('filePicked', (e) => {
        console.log('[Rhodes iOS] File picked:', e.detail.name);
        // Dispatch custom event for app to handle
        window.dispatchEvent(new CustomEvent('rhodes:file', { detail: e.detail }));
    });

    window.addEventListener('fileRead', (e) => {
        console.log('[Rhodes iOS] File read');
        window.dispatchEvent(new CustomEvent('rhodes:fileContent', { detail: e.detail }));
    });

    window.addEventListener('fileWritten', (e) => {
        console.log('[Rhodes iOS] File written:', e.detail.path);
        window.dispatchEvent(new CustomEvent('rhodes:fileSaved', { detail: e.detail }));
    });

    window.addEventListener('photoTaken', (e) => {
        console.log('[Rhodes iOS] Photo taken');
        window.dispatchEvent(new CustomEvent('rhodes:photo', { detail: e.detail }));
    });
}

// !!! WARNING: THIS FILE IS NOT SERVED - EDIT /var/www/html/rhodes.js INSTEAD !!!
// rhodes.js v2026.01.20.0305 - Fixed duplicate messages
// Global error handling - banners disabled (especially for Mac compatibility)
        window.addEventListener("error", function(e) {
            // Skip empty errors (CORS-blocked or unhelpful)
            const hasError = e.error && Object.keys(e.error).length > 0;
            const hasMessage = e.message && e.message.trim().length > 0;
            if (!hasError && !hasMessage) return;
            if (e.message && e.message.includes("ResizeObserver")) return;
            // Log to console only, no visual banner (disabled for Mac)
            console.error("RHODES Global Error:", e.error, e.message, "at", e.filename, ":", e.lineno, ":", e.colno);
        });

        // Unhandled promise rejections - log only, no visual banner
        window.addEventListener('unhandledrejection', function(e) {
            console.error('RHODES Unhandled Promise Rejection:', e.reason);
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
                    // Modern Apple Silicon browsers often expose Intel-compatible UA strings.
                    // Default to Apple Silicon build to avoid mislabeling M-series Macs as Intel.
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
        // DOWNLOAD OFFER CARD RENDERER
        // ============================================
        const RHODES_DOWNLOADS = {
            rhodes_code: {
                name: 'Rhodes Code',
                icon: '\u2B21',
                links: {
                    macos: { label: 'Download for macOS', url: 'https://rhodesagi.com/api/desktop/download/mac-app?arch=arm64', note: 'Apple Silicon (.dmg)' },
                    macos_intel: { label: 'Download for macOS (Intel)', url: 'https://rhodesagi.com/api/desktop/download/mac-app?arch=x64', note: 'Intel (.zip)' },
                    windows: { label: 'Download for Windows', url: 'https://rhodesagi.com/download/rhodes-code-2.0.0-setup-x64.exe', note: 'Windows 10+ (.exe)' },
                    linux: { label: 'Download for Linux', url: 'https://rhodesagi.com/download/rhodes-code-2.0.0.AppImage', note: 'AppImage (.AppImage)' },
                    any: { label: 'Download Rhodes Code', url: 'https://rhodesagi.com/account', note: 'Visit account page for downloads' }
                }
            }
        };

        window._renderDownloadCard = function(args, toolResult) {
            var product = (args && args.product) || 'rhodes_code';
            var reason = (args && args.reason) || '';
            var projectZipUrl = (args && args.project_zip_url) || '';
            var projectZipLabel = (args && args.project_zip_label) || 'Download Swift project (.zip)';
            var iosFlowExplicit = !!(args && args.ios_mac_flow);
            var reasonLower = String(reason || '').toLowerCase();
            var isIosMacFlow = iosFlowExplicit || /ios|xcode|simulator|testflight|app store/.test(reasonLower);

            // Parse from tool result if needed
            if (toolResult && typeof toolResult === 'object' && toolResult.display_text) {
                var m = toolResult.display_text.match(/\[DOWNLOAD_OFFER:(\{[^}]+\})\]/);
                if (m) {
                    try {
                        var parsed = JSON.parse(m[1]);
                        product = parsed.product || product;
                        reason = parsed.reason || reason;
                        projectZipUrl = parsed.project_zip_url || projectZipUrl;
                        projectZipLabel = parsed.project_zip_label || projectZipLabel;
                        iosFlowExplicit = iosFlowExplicit || !!parsed.ios_mac_flow;
                    } catch(e) {}
                }
            }

            reasonLower = String(reason || '').toLowerCase();
            isIosMacFlow = iosFlowExplicit || /ios|xcode|simulator|testflight|app store/.test(reasonLower);

            // In iOS/mac workflows, only render the card when a Swift/Xcode zip already exists.
            if (isIosMacFlow && !projectZipUrl) {
                console.log('[DOWNLOAD_OFFER] Suppressed iOS card: project zip not ready yet');
                return;
            }

            var info = RHODES_DOWNLOADS[product];
            if (!info) {
                addMsg('ai', reason || ('Download ' + product));
                return;
            }

            // Pick the right download for this device
            var downloadKey = SYSTEM_INFO.downloadKey || 'any';
            if (isIosMacFlow) {
                downloadKey = (downloadKey === 'macos_intel') ? 'macos_intel' : 'macos';
            }
            var primary = info.links[downloadKey] || info.links.macos || info.links.any;
            var displayIcon = isIosMacFlow ? '\uF8FF' : info.icon;
            var displayName = isIosMacFlow ? 'Rhodes Code for macOS' : info.name;

            // Build card HTML
            var cardHtml = '<div class="download-card">';
            cardHtml += '<div class="download-card-header">';
            cardHtml += '<span class="download-card-icon">' + displayIcon + '</span>';
            cardHtml += '<span class="download-card-title">' + displayName + '</span>';
            cardHtml += '</div>';
            if (reason) {
                cardHtml += '<div class="download-card-reason">' + reason.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
            }
            cardHtml += '<a href="' + primary.url + '" class="download-card-btn" target="_blank" rel="noopener">' + primary.label + '</a>';
            if (primary.note) {
                cardHtml += '<div class="download-card-note">' + primary.note + '</div>';
            }
            if (isIosMacFlow && projectZipUrl) {
                cardHtml += '<div class="download-card-alts">';
                cardHtml += '<a href="' + projectZipUrl + '" class="download-card-alt" target="_blank" rel="noopener">' + projectZipLabel + '</a>';
                cardHtml += '</div>';
            }
            // Show alternate links for other platforms
            var altKeys = Object.keys(info.links).filter(function(k) { return k !== downloadKey && k !== 'any'; });
            if (isIosMacFlow) {
                altKeys = [];
            }
            if (altKeys.length > 0) {
                cardHtml += '<div class="download-card-alts">';
                altKeys.forEach(function(k) {
                    var alt = info.links[k];
                    cardHtml += '<a href="' + alt.url + '" class="download-card-alt" target="_blank" rel="noopener">' + alt.note + '</a>';
                });
                cardHtml += '</div>';
            }
            cardHtml += '</div>';

            // Insert into chat
            if (chat) chat.classList.remove('intro-center');
            var div = document.createElement('div');
            div.className = 'msg ai';
            div.innerHTML = cardHtml;
            document.getElementById('chat').appendChild(div);
            var chatEl = document.getElementById('chat');
            chatEl.scrollTop = chatEl.scrollHeight;
        };


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
                if (!isEmbeddableUserSiteUrl(url)) return url;
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

        // ============================================
        // MOBILE MENU FUNCTIONS
        // ============================================
        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu-dropdown');
            if (menu) {
                menu.classList.toggle('active');
                // Toggle hamburger icon
                const menuToggle = document.getElementById('menu-toggle');
                const sc = document.querySelector('.session-controls');
                if (menu.classList.contains('active')) {
                    menuToggle.innerHTML = '✕';
                    menuToggle.title = 'Close menu';
                    if (sc) sc.style.display = 'none';
                } else {
                    menuToggle.innerHTML = '☰';
                    menuToggle.title = '☰';
                    if (sc) sc.style.display = '';
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
                const sc = document.querySelector('.session-controls');
                if (sc) sc.style.display = '';
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
            el.innerHTML = linkifyUrls(cleanText
                .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre>$2</pre>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\*\*(https?:\/\/[^\s*]+)\*\*/g, '$1')
                .replace(/'(https?:\/\/[^\s']+)'/g, '$1')
                .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
                .replace(/(?<![*])\*([^*]+?)\*(?![*])/g, '<em>$1</em>')
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
                .replace(/\n/g, '<br>'));
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
            apiKey: "AIzaSyBZ1BCmsiSCgEjEMXkeMxedzqUtzQMJnO4",
            authDomain: "rhodes-agi-and-languages.firebaseapp.com",
            projectId: "rhodes-agi-and-languages",
            storageBucket: "rhodes-agi-and-languages.firebasestorage.app",
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
                window.ws = ws;
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
                    setStatus(false, 'RECONNECTING');
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
                    // Only show auth modal if no saved credentials (first visit)
                    const _hasToken = !!(localStorage.getItem('rhodes_user_token') || localStorage.getItem('rhodes_session_id'));
                    if (!_hasToken) {
                        authModal.style.display = 'flex';
                        const debugBtn = document.getElementById('debug-btn');
                        if (debugBtn) debugBtn.style.display = 'inline';
                        setTimeout(() => {
                            console.log('Auto-connecting as guest (timeout fallback)');
                            TOKEN = '';
                            USER_TOKEN = '';
                            connect();
                        }, 100);
                    } else {
                        // Already authenticated - just retry silently
                        setTimeout(connect, 2000);
                    }
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
                // Resume for both logged-in AND guest sessions
                // Don't auto-resume a split session from the main chat
                const _candidate = RHODES_ID || savedSessionId || '';
                const resumeSession = wantsNewRhodes ? '' :
                    (_candidate.indexOf('split-') === -1 ? _candidate : '');

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
                        platform: (window.rhodes && window.rhodes.isDesktop) ? 'desktop-electron' : 'web',
                        desktop_mode: !!(window.rhodes && window.rhodes.isDesktop),
                        desktop_capabilities: (window.rhodes && window.rhodes.isDesktop) ? ['exec','read','write','edit','delete','mkdir','ls','glob','grep','webfetch','screenshot','click','type'] : [],
                        hostname: location.hostname,
                        system: {
                            browser: SYSTEM_INFO.browser.name,
                            browser_engine: SYSTEM_INFO.browser.engine,
                            os: SYSTEM_INFO.os.name,
                            os_version: SYSTEM_INFO.os.version || null,
                            os_distro: SYSTEM_INFO.os.distro || null,
                            is_mobile: SYSTEM_INFO.isMobile,
                            hostname: (window.__RHODES_DESKTOP__ && window.__RHODES_DESKTOP__.platform === 'darwin') ? 'macOS' : (SYSTEM_INFO.os.name || 'unknown'),
                            user_agent: navigator.userAgent
                        }
                    }
                }));
            };

            ws.onmessage = (e) => {
                if (epoch !== wsEpoch) return;
                const msg = JSON.parse(e.data);
                console.log('WebSocket message received:', msg.msg_type || msg.type, msg.payload?.success ? 'success' : 'fail');

                if (window.rhodesWsHelpers && window.rhodesWsHelpers.handleDesktopBridgeMessage(msg)) return;
                if (window.rhodesWsHelpers && window.rhodesWsHelpers.handleSessionListResponse(msg, { addMsg, escapeHtml })) return;

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
                        // Set admin status in config
                        if (window.RHODES_CONFIG) {
                            window.RHODES_CONFIG.isAdmin = msg.payload.is_admin || false;
                        }
                        const instanceLabel = wantsNewRhodes ? ' [NEW]' : '';

                        // Clear chat only once for ?new=1 (initial creation); do not clear on reconnect.
                        if (wantsNewRhodes && !didInitialAuth) {
                            chat.innerHTML = '';
                        }
                        didInitialAuth = true;

                        // Save rhodes_id for auto-resume on next visit (both users and guests)
                        // Don't save if this is a temporary new session
                        if (RHODES_ID && !wantsNewRhodes && RHODES_ID.indexOf('split-') === -1) {
                            if (RHODES_ID.indexOf('split-') === -1) rhodesStorage.setItem('rhodes_session_id', RHODES_ID);
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
                            if (typeof VoiceChat !== 'undefined') VoiceChat._suppressSpeak = true;
                            for (const m of msg.payload.conversation) {
                                // Skip tool result messages and empty assistant messages (tool call initiators)
                                if (m.role === 'tool') continue;
                                if (m.role === 'assistant' && (!m.content || !m.content.trim())) continue;
                                const content = m.role === 'user' ? maskPasswords(m.content) : m.content;
                                addMsg(m.role === 'user' ? 'user' : 'ai', content);
                            }
                            if (typeof VoiceChat !== 'undefined') VoiceChat._suppressSpeak = false;
                        }

                        if (IS_GUEST) {
                            GUEST_MESSAGES_REMAINING = msg.payload.guest_messages_remaining || 3;
                            CURRENT_USERNAME = null;
                            setStatus(true, `GUEST (${GUEST_MESSAGES_REMAINING} msgs left)${instanceLabel}`);
                            try { authModal.style.display = 'none'; } catch {}
                            window._wsConnectAttempts = 0;
                            showGuestOnboardingMessage();
                        } else {
                            GUEST_HAS_ACTIVITY = false;
                            const username = msg.payload.user?.username || '';
                            CURRENT_USERNAME = username.toLowerCase();
                        rhodesStorage.setItem('rhodes_username', CURRENT_USERNAME);
                            setStatus(true, username ? `CONNECTED (${username})${instanceLabel}` : `CONNECTED${instanceLabel}`);
                            try { authModal.style.display = 'none'; } catch {}
                            window._wsConnectAttempts = 0;
                            removeGuestOnboardingMessages();
                            // Only show connection message once per browser session
                            const chatEl = document.getElementById('chat'); const chatHasContent = chatEl && chatEl.children.length > 0; if (wantsNewRhodes && !chatHasContent) {
                                addMsg("ai", `Hi, ${username || "there"}! What can I help you with today?`);
                                CONNECTION_MSG_SHOWN = true;
                            } else if (!CONNECTION_MSG_SHOWN && !chatHasContent && (!msg.payload.conversation || msg.payload.conversation.length === 0)) {
                                addMsg("ai", `Welcome back, ${CURRENT_USERNAME || "there"}! What can I help you with?`);
                                CONNECTION_MSG_SHOWN = true;
                            }
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
                        
                        // Send continuation request if we were disconnected during generation
                        if (window._needsContinuation) {
                            console.log('[WS] Sending continuation request after reconnect');
                            window._needsContinuation = false;
                            ws.send(JSON.stringify({
                                msg_type: 'system_message',
                                msg_id: generateUUID(),
                                timestamp: new Date().toISOString(),
                                payload: {
                                    content: '[server just restarted, please continue generation]',
                                    stream: true
                                }
                            }));
                            // Re-show loading indicator since we are expecting a response
                            showLoading();
                        }

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
                                    console.log('Auto-connecting as guest');
                                    TOKEN = '';
                                    USER_TOKEN = '';
                                    connect();
                                }
                            }, 500);
                        }
                    }
                } else if (msg.msg_type === 'project_switched' && !window.__RHODES_DISABLE_PROJECTS) {
                    const p = msg.payload || {};
                    window.__RHODES_ACTIVE_PROJECT_ID = (p.project_id !== undefined) ? p.project_id : null;
                    window.__RHODES_ACTIVE_PROJECT_NAME = p.name || null;
                    try {
                        if (typeof window.__rhodesUpdateProjectBadge === 'function') window.__rhodesUpdateProjectBadge();
                    } catch {}

                    const quiet = !!(p.is_default || p.quiet);
                    if (!quiet) {
                        showToast(p.name ? ('Project: ' + p.name) : 'Project cleared');
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
                } else if (msg.msg_type === 'reasoning_chunk') {
                    // Live reasoning/thinking stream — admin only
                    if (!window.RHODES_CONFIG || !window.RHODES_CONFIG.isAdmin) return;
                    if (activeReqId && msg.payload && msg.payload.req_id && msg.payload.req_id !== activeReqId) return;
                    const rChunk = msg.payload.content || '';
                    if (rChunk) {
                        hideLoading();
                        if (!window._reasoningEl) {
                            window._reasoningContent = '';
                            const div = document.createElement('div');
                            div.className = 'msg ai reasoning-stream';
                            const details = document.createElement('details');
                            details.open = true;
                            const summary = document.createElement('summary');
                            summary.style.cssText = "cursor:pointer;color:var(--cyan);font-family:'Orbitron',monospace;font-size:12px;user-select:none;margin-bottom:6px;";
                            summary.innerHTML = 'Thinking <span style="opacity:0.6">...</span>';
                            const pre = document.createElement('pre');
                            pre.style.cssText = 'white-space:pre-wrap;word-break:break-word;margin:0;padding:10px;background:rgba(0,0,0,0.2);border:1px solid rgba(0,255,204,0.1);border-radius:6px;color:var(--text);opacity:0.55;font-size:12.5px;line-height:1.5;max-height:400px;overflow-y:auto;';
                            details.appendChild(summary);
                            details.appendChild(pre);
                            div.appendChild(details);
                            const chatEl = document.getElementById('chat');
                            if (chatEl) { chatEl.appendChild(div); chatEl.scrollTop = chatEl.scrollHeight; }
                            window._reasoningEl = div;
                            window._reasoningPre = pre;
                            window._reasoningSummary = summary;
                        }
                        window._reasoningContent += rChunk;
                        const tokEst = Math.round(window._reasoningContent.length / 4);
                        window._reasoningPre.textContent = window._reasoningContent;
                        window._reasoningSummary.innerHTML = 'Thinking <span style="opacity:0.5;font-size:11px;">(' + tokEst + ' tokens)</span> <span style="opacity:0.6">...</span>';
                        window._reasoningPre.scrollTop = window._reasoningPre.scrollHeight;
                        const chatEl = document.getElementById('chat');
                        if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
                    }
                } else if (msg.msg_type === 'ai_message_chunk') {
                    // Streaming chunk - append to current message
                    // Close reasoning display when content starts streaming
                    if (window._reasoningEl && window._reasoningSummary) {
                        const _toks = Math.round((window._reasoningContent||'').length/4);
                        window._reasoningSummary.innerHTML = 'Reasoning <span style="opacity:0.5;font-size:11px;">(' + _toks + ' tokens)</span>';
                        const _det = window._reasoningEl.querySelector('details');
                        if (_det) _det.open = false;
                        window._reasoningEl = null;
                        window._reasoningPre = null;
                        window._reasoningSummary = null;
                    }
                    if (activeReqId && msg.payload && msg.payload.req_id && msg.payload.req_id !== activeReqId) return;
                    const chunk = msg.payload.content || '';
                    if (chunk) {
                        if (_seenRecently('chunk:' + chunk.slice(0, 64), 150)) return;
                        // Filter internal system messages that should never reach the user
                        if (chunk.includes('[Response regenerated') || chunk.includes('[RETRACTION') || chunk.includes('CRITICAL SCIENTIFIC INTEGRITY WARNING') || chunk.includes('[CONTEXT COMPACTION NOTICE]')) {
                            console.log('[FILTER] Blocked internal message from display:', chunk.slice(0, 80));
                            return;
                        }
                        if (!window.streamingMsgEl) {
                            // First chunk - create message element
                            hideLoading();
                            // Collapse any open tool container so content appears after tool dots
                            if (typeof collapseToolCalls === 'function') collapseToolCalls();
                            window.streamingContent = '';
                            window.streamingMsgEl = addMsgStreaming('ai', '');
                        }
                        window.streamingContent += chunk;
                        updateStreamingMsg(window.streamingMsgEl, window.streamingContent);
                        // Feed chunk to streaming TTS for real-time audio
                        if (window.StreamingTTS) {
                            try { window.StreamingTTS.feedChunk(chunk); } catch(e) {}
                        }
                    }
                } else if (msg.msg_type === "ai_message") {
                    console.log("[DEBUG] ai_message received:", JSON.stringify(msg.payload).slice(0, 500));
                    console.log("[DEBUG] debug_reasoning present:", !!msg.payload.debug_reasoning, "len:", msg.payload.debug_reasoning ? msg.payload.debug_reasoning.length : 0);
                    const pendingTurnStartTs = (window._pendingGeneration && window._pendingGeneration.timestamp) ? window._pendingGeneration.timestamp : 0;
                    hideLoading();
                    // Clear any streaming state
                    if (window.streamingMsgEl) {
                        window.streamingMsgEl.remove();  // Remove the tool-only element
                        window.streamingMsgEl = null;
                        window.streamingContent = '';
                    }
                    // Close any live reasoning display
                    if (window._reasoningEl && window._reasoningSummary) {
                        const _toks2 = Math.round((window._reasoningContent||'').length/4);
                        window._reasoningSummary.innerHTML = 'Reasoning <span style="opacity:0.5;font-size:11px;">(' + _toks2 + ' tokens)</span>';
                        const _rDet = window._reasoningEl.querySelector('details');
                        if (_rDet) _rDet.open = false;
                        window._reasoningEl = null;
                        window._reasoningPre = null;
                        window._reasoningSummary = null;
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
                    // Check for download offer in content
                    if (msg.payload.content && msg.payload.content.includes('[DOWNLOAD_OFFER:')) {
                        const dMatch = msg.payload.content.match(/\[DOWNLOAD_OFFER:(\{[^}]+\})\]/);
                        if (dMatch) {
                            try {
                                const dOpts = JSON.parse(dMatch[1]);
                                window._renderDownloadCard(dOpts, null);
                                msg.payload.content = msg.payload.content.replace(/\[DOWNLOAD_OFFER:\{[^}]+\}\]/, '').trim();
                                if (!msg.payload.content) return;
                            } catch(e) { console.error('Download offer parse error:', e); }
                        }
                    }
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

                    const responseTimeLabel = getWallToWallLabel(msg.payload || {}, pendingTurnStartTs);
                    msg.payload.content = msg.payload.content || '';

                    // Update valence context with current round info
                    if (typeof window.updateValenceContext === 'function') {
                        window.updateValenceContext(
                            msg.payload.round_id || msg.msg_id || activeReqId,
                            msg.msg_id || activeReqId,
                            msg.payload.model || null
                        );
                    }

                    // ALWAYS display content as a fresh message
                    if (msg.payload.content && msg.payload.content.trim()) {
                        const k = 'ai:' + (msg.payload.req_id || '') + ':' + msg.payload.content.slice(0, 240);
                        if (_seenRecently(k, 2000)) return;
                        // Collapse tool log so any subsequent tool calls appear after this message
                        if (typeof collapseToolCalls === 'function') collapseToolCalls();
                        const node = addMsg('ai', msg.payload.content, false, responseTimeLabel);
                        if (msg.payload.debug_reasoning && window.RHODES_CONFIG && window.RHODES_CONFIG.isAdmin) {
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
                        CURRENT_USERNAME = (msg.payload.username || '').toLowerCase();
                        rhodesStorage.setItem('rhodes_username', CURRENT_USERNAME);
                        setStatus(true, 'CONNECTED (' + msg.payload.username + ')');
                        addMsg('ai', 'Welcome ' + msg.payload.username + '! Your account is ready.');
                        updateHeaderAuth();
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
                        // Update session ID from merged session (guest_web_ -> user_N_)
                        if (msg.payload.session_id) {
                            RHODES_ID = msg.payload.session_id;
                            if (RHODES_ID.indexOf('split-') === -1) rhodesStorage.setItem('rhodes_session_id', RHODES_ID);
                        }
                        authModal.style.display = 'none';
                        // Redirect to returnTo if specified (e.g., from /download/ page)
                        if (returnTo) {
                            window.location.href = returnTo;
                            return;
                        }
                        // Session already upgraded server-side — update auth state
                        CURRENT_USERNAME = (msg.payload.username || '').toLowerCase();
                        rhodesStorage.setItem('rhodes_username', CURRENT_USERNAME);
                        addMsg('ai', `Welcome back, ${msg.payload.username}!`);
                        setStatus(true, 'CONNECTED (' + msg.payload.username + ')');
                        updateHeaderAuth();
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
                        // Update session ID from merged session (guest_web_ -> user_N_)
                        if (msg.payload.session_id) {
                            RHODES_ID = msg.payload.session_id;
                            if (RHODES_ID.indexOf('split-') === -1) rhodesStorage.setItem('rhodes_session_id', RHODES_ID);
                        }
                        authModal.style.display = 'none';
                        // Session already upgraded server-side — update auth state
                        CURRENT_USERNAME = (msg.payload.username || '').toLowerCase();
                        rhodesStorage.setItem('rhodes_username', CURRENT_USERNAME);
                        addMsg('ai', `Welcome, ${msg.payload.username}! Signed in with Google.`);
                        setStatus(true, 'CONNECTED (' + msg.payload.username + ')');
                        updateHeaderAuth();
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
                        console.log('[RESUME] Received conversation:', conversation.length, 'messages');
                        try { chat.innerHTML = ''; } catch {}
                        for (const m of conversation) {
                            // Skip tool result messages and empty assistant messages
                            if (m.role === 'tool') continue;
                            if (m.role === 'assistant' && (!m.content || !m.content.trim())) continue;
                            // Mask passwords in user messages when replaying history
                            const content = m.role === 'user' ? maskPasswords(m.content) : m.content;
                            addMsg(m.role === 'user' ? 'user' : 'ai', content);
                        }
                        const sid = msg.payload.session_id || msg.payload.rhodes_id || '';
                        if (sid) {
                            RHODES_ID = sid;
                            if (RHODES_ID.indexOf('split-') === -1) rhodesStorage.setItem('rhodes_session_id', RHODES_ID);
                            const sessionEl = document.getElementById('session-id');
                            if (sessionEl) {
                                sessionEl.textContent = RHODES_ID;
                                sessionEl.style.display = 'inline';
                            }
                        }
                        // Show model info if present (helps user know what mode they're in)
                        const sessionModel = msg.payload.model || '';
                        if (typeof window.updateValenceContext === 'function') {
                            window.updateValenceContext(null, null, sessionModel || null);
                        }
                        const modelPretty = sessionModel === 'opus' ? 'ALPHA' :
                            sessionModel === 'sonnet' ? 'BETA' :
                            sessionModel === 'deepseek' ? 'DELTA' :
                            sessionModel === 'haiku' ? 'ADA' :
                    sessionModel === 'kimi' ? 'EPSILON' :
                    sessionModel === 'grok' ? 'ZETA' :
                            sessionModel.includes('delta') ? 'DELTA' :
                            sessionModel.includes('alpha') ? 'ALPHA' :
                            (sessionModel ? sessionModel.toUpperCase() : '');
                        window.__pendingSessionSwitch = null;
                        const modelNote = modelPretty ? ` (${modelPretty} mode)` : '';
                        addMsg('ai', `Session ${sid || '(unknown)'} resumed. ${msg.payload.message_count} messages loaded.${modelNote}`);
                    } else {
                        addMsg('ai', `Failed to resume session: ${msg.payload.error}`);
                    }
                } else if (msg.msg_type === 'session_new_response') {
                    if (msg.payload.success) {
                        // Clear chat and switch to new session
                        try { chat.innerHTML = ''; } catch {}
                        // Reset tool totals for new session
                        if (typeof resetToolTotals === 'function') resetToolTotals();
                        const sid = msg.payload.session_id || '';
                        if (sid) {
                            RHODES_ID = sid;
                            if (RHODES_ID.indexOf('split-') === -1) rhodesStorage.setItem('rhodes_session_id', RHODES_ID);
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
                } else if (msg.msg_type === 'model_set_response') {
                    if (msg.payload && msg.payload.success) {
                        const model = (msg.payload.model || '').toString().toLowerCase();
                        const _isDsModel = model.startsWith('ds1.');
                        const _dsPrefix = _isDsModel ? 'DS:' : '';
                        const pretty = _dsPrefix + (
                            model === 'opus' ? 'ALPHA' :
                            model === 'sonnet' ? 'BETA' :
                            model === 'deepseek' ? 'DELTA' :
                            model === 'haiku' ? 'ADA' :
                    model === 'kimi' ? 'EPSILON' :
                    model === 'grok' ? 'ZETA' :
                                model.includes('r1.13') || model.includes('ds1.13') ? 'Claude 3 Opus' :
                                model.includes('r1.14') || model.includes('ds1.14') ? 'GPT-4o' :
                                model.includes('r1.15') || model.includes('ds1.15') ? 'GPT-4o+' :
                            (model ? model.toUpperCase() : 'MODEL'));
                        const planBadge = model.endsWith('ep') ? ' [PLAN]' : '';
                        showToast(`Mode switched to ${pretty}${planBadge}`);
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
                        if (RHODES_ID.indexOf('split-') === -1) rhodesStorage.setItem('rhodes_session_id', RHODES_ID);
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
                    model === 'kimi' ? 'EPSILON' :
                    model === 'grok' ? 'ZETA' :
                                model.includes('r1.13') ? 'Claude 3 Opus' :
                                model.includes('r1.14') ? 'GPT-4o' :
                                model.includes('r1.15') ? 'GPT-4o+' :
                                (model ? model.toUpperCase() : 'MODEL');
                            showToast(`Mode switched to ${pretty}`);
                        } else {
                            showToast('Session rotated');
                        }
                    }
                } else if (msg.msg_type === 'error') {
                    const errText = (msg.payload && msg.payload.error) || 'An error occurred';
                    addMsg('ai', '[System] ' + errText);
                } else if (msg.msg_type === 'local_file_request') {
                    // Handle local file operations via browser extension
                    handleLocalFileRequest(msg);
                } else if (msg.msg_type === 'agent_command') {
                    // Desktop local tool execution - server asks us to run a command
                    if (window.rhodes && window.rhodes.isDesktop) {
                        const cmdId = msg.cmd_id;
                        const cmdType = msg.cmd_type;
                        const cmdPayload = msg.payload || {};
                        console.log('[DESKTOP] Agent command:', cmdType, cmdId);
                        (async () => {
                            let result;
                            try {
                                switch (cmdType) {
                                    case 'shell_exec':
                                        result = await window.rhodes.exec(cmdPayload.command, cmdPayload.cwd, (cmdPayload.timeout || 60) * 1000);
                                        break;
                                    case 'python_exec':
                                        result = await window.rhodes.exec('python3 -c ' + JSON.stringify(cmdPayload.code || ''));
                                        break;
                                    case 'file_read':
                                        result = await window.rhodes.read(cmdPayload.path);
                                        break;
                                    case 'file_write':
                                        result = await window.rhodes.write(cmdPayload.path, cmdPayload.content);
                                        break;
                                    case 'file_list':
                                        result = await window.rhodes.ls(cmdPayload.path || '~');
                                        break;
                                    case 'screenshot':
                                        result = await window.rhodes.screenshot();
                                        break;
                                    case 'click':
                                        result = await window.rhodes.click(cmdPayload.x, cmdPayload.y);
                                        break;
                                    case 'type_text':
                                        result = await window.rhodes.type(cmdPayload.text);
                                        break;
                                    default:
                                        result = {success: false, error: 'Unknown command: ' + cmdType};
                                }
                            } catch (err) {
                                result = {success: false, error: err.message || String(err)};
                            }
                            if (ws && ws.readyState === 1) {
                                ws.send(JSON.stringify({
                                    msg_type: 'agent_result',
                                    payload: Object.assign({cmd_id: cmdId}, result)
                                }));
                            }
                            console.log('[DESKTOP] Command result:', cmdType, result.success !== false ? 'OK' : result.error);
                        })();
                    }
                } else if (msg.msg_type === 'system_message') {
                    // Plan mode toggle and other system notifications
                    if (msg.payload && msg.payload.content) {
                        addMsg('ai', msg.payload.content);
                    }
                } else if (msg.msg_type === 'injection_debug') {
                    showInjectionDebug(msg.payload);
                
                } else if (msg.msg_type === 'handoff_notify') {
                    // Server-push: social CLI hit CAPTCHA, open VNC viewer immediately
                    const hd = msg.payload || {};
                    if (typeof window.openHandoffViewer === 'function' && hd.novnc_url) {
                        window.openHandoffViewer(hd.novnc_url, hd.cli_name || 'cli', hd.reason || 'Solve CAPTCHA to continue');
                    }
                } else if (msg.msg_type === 'handoff_complete') {
                    // Don't auto-close — let user close VNC when ready
                    if (typeof showToast === 'function') {
                        showToast('Task completed — you can close the VNC viewer when ready');
                    }
                } else if (msg.msg_type === 'split_mode_command') {
                    // Server-push: enter split mode (from /multisandbox command)
                    const sp = msg.payload || {};
                    const paneCount = sp.pane_count || 4;
                    window._multisandboxMode = sp.multisandbox || false;
                    const resumeIds = sp.resume_sessions || null;
                    console.log('[MULTISANDBOX] Entering split mode:', paneCount, 'panes, multisandbox:', window._multisandboxMode, 'resume:', resumeIds);
                    if (typeof window.enterSplitMode === 'function') {
                        window.enterSplitMode(paneCount, resumeIds);
                    } else {
                        addMsg('ai', '[System] Split mode not available. Load rhodes-split.js first.');
                    }
                                } else if (msg.msg_type === 'user_sites_response') {
                    if (typeof window._renderUserSites === 'function') {
                        window._renderUserSites(msg.payload.sites || []);
                    }
                } else if (msg.msg_type === 'terminal_response') {
                    const tp = msg.payload || {};
                    if (tp.error) {
                        if (typeof showToast === 'function') showToast('Terminal: ' + tp.error);
                    } else if (tp.url) {
                        if (typeof window._openTerminalViewer === 'function') {
                            window._openTerminalViewer(tp.url, tp.username || 'user');
                        }
                    }
                } else if (msg.msg_type === 'terminal_stopped') {
                    const overlay = document.getElementById('terminal-overlay');
                    if (overlay) overlay.remove();
                    if (typeof showToast === 'function') showToast('Terminal stopped');
                } else if (msg.msg_type === 'tool_call') {
                    const tool = msg.payload;

            // ── Handoff viewer auto-detect ──
            if (tool.status === 'complete' && tool.result) {
                if (typeof window.checkHandoffResult === 'function') {
                    const wasHandoff = window.checkHandoffResult(tool.result);
                    // Don't suppress tool display — let it show in the tool log too
                }
            }
                    // FIXED: Removed filter that drops tool calls when user sends new message
                    // if (activeReqId && tool && tool.req_id && tool.req_id !== activeReqId) return;
                    const toolName = tool.name || 'unknown';
                    const toolArgs = tool.arguments || {};
                    const isPrivileged = !IS_GUEST && USER_TOKEN;
                    const round = tool.round || 0;

                    if ((toolName.includes('think') || toolName === 'claude_search' || toolName === 'mark_insight') && !isPrivileged) return;

                    const status = tool.status || 'complete';
                    const fingerprintSrc =
                        toolArgs.command || toolArgs.path || toolArgs.thought || (typeof tool.result === 'string' ? tool.result : '') || JSON.stringify(toolArgs || {}).slice(0, 200);
                    const fp = `tool:${toolName}:${round}:${status}:${String(fingerprintSrc).slice(0, 180)}`;
                    if (_seenRecently(fp, 2000)) return;
                    // Show all tool statuses (starting/running/complete) so it doesn't look "sporadic".
                    
                    // Auto-handle download offers emitted by any tool result (e.g., local_* with no connected desktop)
                    if (status === 'complete' && tool && tool.result && typeof tool.result === 'object' && tool.result._download_offer) {
                        if (typeof collapseToolCalls === 'function') collapseToolCalls();
                        window._renderDownloadCard(toolArgs, tool.result);

                        const localSetupHint = [tool.result.error || '', tool.result.message || '']
                            .join(' ')
                            .trim();
                        if (localSetupHint) {
                            addMsg('ai', localSetupHint);
                        }

                        if (Array.isArray(tool.result.recommended_next_steps) && tool.result.recommended_next_steps.length > 0) {
                            const steps = tool.result.recommended_next_steps
                                .map((s, i) => `${i + 1}. ${s}`)
                                .join('\n');
                            addMsg('ai', `Next steps:\n${steps}`);
                        }
                        return;
                    }

                    // Message and respond tools should display as normal messages, not tool calls
                    if (toolName === 'message' || toolName === 'respond' || toolName === 'offer_download') {
                        // Only display on 'complete' status to avoid showing same message twice
                        if (status !== 'complete') return;
                        
                        // Play completion sound for verification tools (Bash commands)
                        if (toolName === 'Bash' && window.playCompletionSound) {
                            window.playCompletionSound();
                        }
                        
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
                            if (typeof collapseToolCalls === 'function') collapseToolCalls();
                            // Check for download offer card
                            if (toolName === 'offer_download') {
                                window._renderDownloadCard(toolArgs, tool.result);
                            } else {
                                addMsg('ai', messageText);
                            }
                        }
                        return;
                    }

                    // Tool dot container (groups tool dots together)
                    let msgEl = window.toolLogEl;
                    if (!msgEl) {
                        // Finalize any streaming content so tool dots appear after it
                        if (window.streamingMsgEl) {
                            // Finalize the streaming element: render markdown, remove cursor
                            if (window.streamingContent && window.marked) {
                                window.streamingMsgEl.innerHTML = window.marked.parse(window.streamingContent);
                            }
                            window.streamingMsgEl.classList.remove('streaming');
                            window.streamingMsgEl = null;
                            window.streamingContent = '';
                        }
                        msgEl = document.createElement('div');
                        msgEl.className = 'tool-dot-container';
                        document.getElementById('chat').appendChild(msgEl);
                        window.toolLogEl = msgEl;
                    }

                    // Build preview and details
                    let detailsContent = '';
                    let preview = '';
                    
                    if (toolName.includes('think') && toolArgs.thought) {
                        const t = toolArgs.thought;
                        detailsContent = '<pre style="color:var(--green);white-space:pre-wrap;">' + escapeHtml(t) + '</pre>';
                        preview = t.substring(0, 80).split('\n').join(' ') + '...';
                    } else if (toolArgs.command) {
                        detailsContent = '<pre style="color:var(--cyan);white-space:pre-wrap;">' + escapeHtml(toolArgs.command) + '</pre>';
                        preview = toolArgs.command.substring(0, 60);
                    } else if ((toolName === 'Write' || toolName === 'Edit') && (toolArgs.file_path || toolArgs.path)) {
                        const filePath = toolArgs.file_path || toolArgs.path;
                        let details = '<strong>File:</strong> ' + escapeHtml(filePath);
                        if (toolArgs.content) details += '<br><pre style="max-height:200px;overflow:auto">' + escapeHtml(toolArgs.content) + '</pre>';
                        if (toolArgs.old_string) details += '<br><strong>Old:</strong><pre>' + escapeHtml(toolArgs.old_string) + '</pre>';
                        if (toolArgs.new_string) details += '<br><strong>New:</strong><pre>' + escapeHtml(toolArgs.new_string) + '</pre>';
                        detailsContent = details;
                        preview = filePath;
                    } else if (toolArgs.file_path || toolArgs.path) {
                        preview = toolArgs.file_path || toolArgs.path;
                        detailsContent = '<pre>' + escapeHtml(preview) + '</pre>';
                    } else if (toolArgs.url) {
                        preview = toolArgs.url;
                        detailsContent = '<pre>' + escapeHtml(preview) + '</pre>';
                    } else {
                        detailsContent = '<pre style="white-space:pre-wrap;">' + escapeHtml(JSON.stringify(toolArgs, null, 2)) + '</pre>';
                        preview = Object.keys(toolArgs).slice(0,3).join(', ');
                    }

                    // Add result to details if complete
                    if (status === 'complete' && tool.result) {
                        const resultStr = typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result, null, 2);
                        const truncResult = resultStr.length > 500 ? resultStr.substring(0, 500) + '...' : resultStr;
                        // Linkify URLs in result and add VNC/site embeds
                        let resultHtml = escapeHtml(truncResult);
                        let resultEmbeds = '';
                        // VNC URL -> embed button
                        const vncMatch = resultStr.match(/https?:\/\/[^\s"']*(?:cli-vnc\/\d+\/vnc(?:_lite)?\.html|sites\/[^\s"']*vnc)[^\s"']*/);
                        if (vncMatch) {
                            const vu = vncMatch[0].replace(/'/g, "\\'");
                            resultEmbeds += '<div style="margin:4px 0;"><button onclick="if(typeof window.openHandoffViewer===\'function\'){window.openHandoffViewer(\'' + vu + '\',\'VNC\',\'Remote session\')}else{window.open(\'' + vu + '\',\'rhodes_vnc\',\'width=1024,height=768\')}" style="background:rgba(0,255,65,0.15);border:1px solid var(--green);color:var(--green);padding:4px 12px;cursor:pointer;font-family:Orbitron,monospace;font-size:11px;border-radius:3px;">Open VNC Session</button></div>';
                        }
                        // User-site URL -> preview iframe
                        const siteMatch = resultStr.match(/https?:\/\/rhodesagi\.com\/user-sites\/[^\s"'`\)\]]+/);
                        if (siteMatch) {
                            const su = siteMatch[0].replace(/[),.;!?]+$/g, '');
                            const sn = su.replace(/https?:\/\/rhodesagi\.com\/user-sites\//, '');
                            const suPath = su.split('#')[0].split('?')[0].toLowerCase();
                            const embeddable = !suPath.endsWith('/') && /\.(html?|xhtml|svg)$/.test(suPath);
                            if (embeddable) {
                                resultEmbeds += '<div style="margin:4px 0;border:1px solid var(--cyan);border-radius:4px;overflow:hidden;"><div style="padding:4px 8px;background:rgba(0,191,255,0.08);display:flex;justify-content:space-between;align-items:center;"><a href="' + su + '" target="_blank" style="color:var(--cyan);font-size:11px;">' + sn + '</a><button onclick="var ifr=this.closest(\'div\').parentElement.querySelector(\'iframe\');ifr.style.display=ifr.style.display===\'none\'?\'block\':\'none\'" style="background:none;border:1px solid var(--cyan);color:var(--cyan);padding:2px 8px;cursor:pointer;font-size:10px;border-radius:3px;">Preview</button></div><iframe src="' + su + '" style="width:100%;height:250px;border:none;background:#fff;display:none;" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe></div>';
                            } else {
                                resultEmbeds += '<div style="margin:4px 0;border:1px solid var(--cyan);border-radius:4px;overflow:hidden;background:rgba(0,191,255,0.06);padding:6px 8px;"><a href="' + su + '" target="_blank" style="color:var(--cyan);font-size:11px;">' + sn + '</a><span style="margin-left:8px;color:var(--dim);font-size:10px;">Preview disabled for non-web file</span></div>';
                            }
                        }
                        // Linkify URLs in the escaped result text
                        resultHtml = resultHtml.replace(/(https?:\/\/[^\s<>&`]+(?:&amp;[^\s<>&`]+)*)/g, '<a href="$1" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;">$1</a>');
                        detailsContent += '<div style="margin-top:6px;border-top:1px solid rgba(255,255,255,0.1);padding-top:6px;"><span style="color:var(--green);">Result:</span>' + resultEmbeds + '<pre style="white-space:pre-wrap;color:var(--text);max-height:150px;overflow:auto;">' + resultHtml + '</pre></div>';
                    }

                    // Timer logic
                    const timerKey = toolName + '|' + round + '|' + preview.slice(0,50);
                    let durationLabel = '';
                    if (status === 'starting' || status === 'running') {
                        if (!window._toolTimers.has(timerKey)) {
                            window._toolTimers.set(timerKey, Date.now());
                            if (typeof trackToolStart === 'function') trackToolStart(timerKey);
                        }
                    } else if (status === 'complete') {
                        const serverDuration = tool.duration_ms;
                        let durationMs;
                        if (serverDuration && serverDuration > 0) {
                            durationMs = serverDuration;
                        } else {
                            const startTime = window._toolTimers.get(timerKey);
                            durationMs = startTime ? (Date.now() - startTime) : 0;
                        }
                        durationLabel = durationMs ? formatDuration(durationMs) : '';
                        if (typeof trackToolComplete === 'function') trackToolComplete(timerKey, serverDuration);
                    }

                    // Build compact dot indicator
                    const isComplete = (status === 'complete');
                    const indicator = isComplete ? '\u25cf' : '\u25cb';
                    const shortPreview = preview.length > 40 ? preview.substring(0, 40) + '...' : preview;
                    const dotLabel = toolName + (shortPreview ? ': ' + shortPreview : '');

                    const wrapperDiv = document.createElement('div');
                    wrapperDiv.className = 'tool-dot-wrapper';
                    wrapperDiv.setAttribute('data-status', status);

                    const dotSpan = document.createElement('span');
                    dotSpan.className = 'tool-dot';
                    dotSpan.setAttribute('data-status', status);
                    dotSpan.onclick = function() { wrapperDiv.classList.toggle('tool-dot-expanded'); };
                    dotSpan.innerHTML = '<span class="tool-dot-indicator">' + indicator + '</span>' +
                        '<span class="tool-dot-name">' + escapeHtml(dotLabel) + '</span>' +
                        (durationLabel ? '<span class="tool-dot-duration">' + durationLabel + '</span>' : '');

                    const detDiv = document.createElement('div');
                    detDiv.className = 'tool-dot-details';
                    detDiv.innerHTML = detailsContent;

                    wrapperDiv.appendChild(dotSpan);
                    wrapperDiv.appendChild(detDiv);

                    // Idempotent: key on toolName|round only (preview may differ between start/complete)
                    // Use a sequential counter for multiple tools of same name in same round
                    if (!window._toolRoundCounters) window._toolRoundCounters = new Map();
                    const baseKey = toolName + '|' + round;
                    let toolKey;
                    if (status === 'starting' || status === 'running') {
                        // Check for existing running entry (dedup streaming + batch starting events)
                        toolKey = null;
                        for (const [k, v] of window._toolItems) {
                            if (k.startsWith(baseKey + '|') && v.lastStatus && v.lastStatus !== 'complete') {
                                toolKey = k;
                                break;
                            }
                        }
                        if (!toolKey) {
                            const count = window._toolRoundCounters.get(baseKey) || 0;
                            toolKey = baseKey + '|' + count;
                            window._toolRoundCounters.set(baseKey, count + 1);
                        }
                        // Store the key on the wrapper for completion matching
                        wrapperDiv.setAttribute('data-tool-key', toolKey);
                    } else {
                        // Complete: find the oldest running entry with same baseKey
                        toolKey = null;
                        for (const [k, v] of window._toolItems) {
                            if (k.startsWith(baseKey + '|') && v.lastStatus !== 'complete' && v.el && v.el.isConnected) {
                                toolKey = k;
                                break;
                            }
                        }
                        if (!toolKey) {
                            // No running entry found — use baseKey with next counter
                            const count = window._toolRoundCounters.get(baseKey) || 0;
                            toolKey = baseKey + '|' + count;
                            window._toolRoundCounters.set(baseKey, count + 1);
                        }
                    }

                    const existing = window._toolItems.get(toolKey);
                    if (existing) {
                        if (existing.el && existing.el.isConnected) {
                            // Update in place
                            existing.el.querySelector('.tool-dot').setAttribute('data-status', status);
                            existing.el.setAttribute('data-status', status);
                            existing.el.querySelector('.tool-dot').innerHTML = dotSpan.innerHTML;
                            existing.el.querySelector('.tool-dot-details').innerHTML = detailsContent;
                            existing.lastStatus = status;
                        } else {
                            // Element orphaned (container collapsed) — remove old dot, show in current group
                            if (existing.el && existing.el.parentNode) existing.el.remove();
                            msgEl.appendChild(wrapperDiv);
                            window._toolItems.set(toolKey, { el: wrapperDiv, lastStatus: status });
                        }
                    } else {
                        msgEl.appendChild(wrapperDiv);
                        window._toolItems.set(toolKey, { el: wrapperDiv, lastStatus: status });
                        if (typeof updateToolTotalsDisplay === 'function') updateToolTotalsDisplay();
                    }
                    document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;


                } else if (msg.msg_type === 'interrupt_ack') {
                    // Collapse tool calls on interrupt so they remain visible
                    if (typeof collapseToolCalls === 'function') collapseToolCalls();
                    hideLoading();
                    showToast('Interrupted');
                }

            };

            ws.onclose = (event) => {
                if (epoch !== wsEpoch) return;
                clearTimeout(connectionTimeout);
                const wasReady = wsReadyForMessages;
                if (window.rhodesWsHelpers && window.rhodesWsHelpers.handleSocketDisconnect) {
                    window.rhodesWsHelpers.handleSocketDisconnect('DISCONNECTED', wasReady);
                } else {
                    wsReadyForMessages = false;
                    connectionInProgress = false;
                    setStatus(false, 'DISCONNECTED');
                    setTimeout(connect, 1500);
                }
            };
            ws.onerror = (error) => {
                if (epoch !== wsEpoch) return;
                clearTimeout(connectionTimeout);
                const wasReady = wsReadyForMessages;
                if (window.rhodesWsHelpers && window.rhodesWsHelpers.handleSocketDisconnect) {
                    window.rhodesWsHelpers.handleSocketDisconnect('ERROR', wasReady);
                } else {
                    wsReadyForMessages = false;
                    connectionInProgress = false;
                    setStatus(false, 'ERROR');
                    setTimeout(connect, 1500);
                }
            };
        }

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
(function() {
    if (window.__rhodesProjectUiInstalled) return;
    window.__rhodesProjectUiInstalled = true;

    function _pathPrefix() {
        try {
            return (window.location.pathname || '').startsWith('/v2/') ? '/v2' : '';
        } catch {
            return '';
        }
    }

    function _getUserToken() {
        try {
            return (typeof USER_TOKEN !== 'undefined' && USER_TOKEN) ? USER_TOKEN : (localStorage.getItem('rhodes_user_token') || '');
        } catch {
            return '';
        }
    }

    function _ensureConnected() {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            showToast('Not connected');
            return false;
        }
        return true;
    }

    function _switchProject(projectId) {
        if (!_ensureConnected()) return;
        ws.send(JSON.stringify({
            msg_type: 'switch_project',
            msg_id: (typeof generateUUID === 'function') ? generateUUID() : undefined,
            timestamp: new Date().toISOString(),
            payload: { project_id: projectId }
        }));
    }

    let modal = null;
    let overlay = null;
    let listEl = null;
    let titleEl = null;
    let addBtnEl = null;
    let downBtnEl = null;

    function _closePicker() {
        if (overlay) overlay.style.display = 'none';
        if (modal) modal.style.display = 'none';
    }

    function _ensurePickerDom() {
        if (modal && overlay) return;

        overlay = document.createElement('div');
        overlay.id = 'project-modal-overlay';
        overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:10020;';
        overlay.addEventListener('click', function(e) {
            try { e.preventDefault(); e.stopPropagation(); } catch {}
            _closePicker();
        });

        modal = document.createElement('div');
        modal.id = 'project-modal';
        modal.style.cssText = 'display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:min(560px,92vw);max-height:78vh;overflow:auto;background:var(--panel);border:1px solid var(--cyan);border-radius:6px;z-index:10021;padding:18px 18px 14px 18px;font-family:Orbitron,monospace;box-shadow:0 0 22px rgba(0,255,213,0.12);';

        titleEl = document.createElement('div');
        titleEl.style.cssText = 'color:var(--cyan);font-weight:800;letter-spacing:1px;font-size:14px;margin-bottom:10px;text-transform:uppercase;';
        titleEl.textContent = 'PROJECT';

        const help = document.createElement('div');
        help.style.cssText = 'color:var(--dim);font-size:12px;line-height:1.4;margin-bottom:12px;';
        help.innerHTML = 'Pick a saved project to apply to this session. These instructions are injected as USER-level context.<span style="display:none"> and do not replace the Rhodes System Prompt.</span>';

        listEl = document.createElement('div');
        listEl.id = 'project-modal-list';

        const footer = document.createElement('div');
        footer.style.cssText = 'display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;';

        const createProjectBtn = document.createElement('button');
        createProjectBtn.textContent = 'CREATE PROJECT';
        createProjectBtn.style.cssText = 'margin-right:auto;background:transparent;border:1px solid var(--green);color:var(--green);padding:6px 10px;border-radius:4px;cursor:pointer;font-size:12px;';
        createProjectBtn.onclick = function(e) {
            try { e.preventDefault(); e.stopPropagation(); } catch {}
            _showCreateForm();
        };



        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
        clearBtn.style.cssText = 'background:transparent;border:1px solid var(--red);color:var(--red);padding:6px 10px;border-radius:4px;cursor:pointer;font-size:12px;';
        clearBtn.onclick = function() { _switchProject(null); _closePicker(); };

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = 'background:transparent;border:1px solid var(--green);color:var(--green);padding:6px 10px;border-radius:4px;cursor:pointer;font-size:12px;';
        closeBtn.onclick = _closePicker;

        footer.appendChild(clearBtn);
        footer.appendChild(closeBtn);

        modal.appendChild(titleEl);
        modal.appendChild(help);
        modal.appendChild(createProjectBtn);
        createProjectBtn.style.cssText = 'background:transparent;border:1px solid var(--green);color:var(--green);padding:8px 14px;border-radius:4px;cursor:pointer;font-size:12px;margin-bottom:12px;display:block;';
        modal.appendChild(listEl);
        modal.appendChild(footer);

        document.body.appendChild(overlay);
        document.body.appendChild(modal);
        modal.addEventListener('click', function(e) {
            try { e.stopPropagation(); } catch {}
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') _closePicker();
        });
    }

    async function _loadProjects() {
        const tok = _getUserToken();
        if (!tok) throw new Error('Login required');

        const resp = await fetch('/api/user/projects', {
            headers: { 'Authorization': 'Bearer ' + tok }
        });
        if (!resp.ok) throw new Error('Failed to load projects');
        const data = await resp.json();
        return data.projects || [];
    }

    function _renderProjects(projects) {
        if (!listEl) return;
        if (!projects || projects.length === 0) {
            listEl.innerHTML = '<div style="color:var(--dim);padding:10px;border:1px dashed var(--border);border-radius:6px;">No projects yet. Create one above.</div>';
            return;
        }

        var activeId = window.__RHODES_ACTIVE_PROJECT_ID || null;
        var activeProject = activeId ? projects.find(function(p) { return p.id === activeId; }) : null;
        var otherProjects = projects.filter(function(p) { return !(activeId && p.id === activeId); });

        listEl.innerHTML = '';

        // Render active project
        if (activeProject) {
            _renderOneProject(activeProject, true);
        }

        // Render other projects with header, only if there are any
        if (otherProjects.length > 0) {
            var header = document.createElement('div');
            header.style.cssText = 'color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:12px 0 8px 0;';
            header.textContent = 'Other Projects';
            listEl.appendChild(header);
            otherProjects.forEach(function(p) {
                _renderOneProject(p, false);
            });
        }
    }

    function _renderOneProject(p, isActive) {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:10px 10px;border:1px solid ' + (isActive ? 'var(--green)' : 'var(--border)') + ';border-radius:6px;background:' + (isActive ? 'rgba(0,255,65,0.06)' : 'rgba(0,0,0,0.18)') + ';margin-bottom:8px;cursor:pointer;';

        var left = document.createElement('div');
        left.style.cssText = 'min-width:0;flex:1;';
        var name = document.createElement('div');
        name.style.cssText = 'color:' + (isActive ? 'var(--green)' : 'var(--cyan)') + ';font-size:13px;font-weight:800;line-height:1.2;';
        name.textContent = (p.name || ('Project ' + p.id)) + (isActive ? '  \u2713' : '');
        var desc = document.createElement('div');
        desc.style.cssText = 'color:var(--dim);font-size:11px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        desc.textContent = p.description || '';
        left.appendChild(name);
        if (isActive) {
            var badge = document.createElement('div');
            badge.style.cssText = 'color:var(--green);font-size:10px;margin-top:3px;text-transform:uppercase;letter-spacing:1px;';
            badge.textContent = 'Active';
            left.appendChild(badge);
        }
        left.appendChild(desc);

        var right = document.createElement('div');
        right.style.cssText = 'display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex-shrink:0;';

        if (isActive) {
            var editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.style.cssText = 'background:transparent;border:1px solid var(--cyan);color:var(--cyan);padding:6px 10px;border-radius:4px;cursor:pointer;font-size:12px;';
            editBtn.onclick = function(e) { e.stopPropagation(); _showEditForm(p); };
            right.appendChild(editBtn);
        } else {
            var useBtn = document.createElement('button');
            useBtn.textContent = 'Use';
            useBtn.style.cssText = 'background:transparent;border:1px solid var(--green);color:var(--green);padding:6px 10px;border-radius:4px;cursor:pointer;font-size:12px;';
            useBtn.onclick = function(e) { e.stopPropagation(); _switchProject(p.id); _closePicker(); };
            right.appendChild(useBtn);
        }

        row.onclick = function() {
            if (isActive) {
                _showEditForm(p);
            } else {
                _switchProject(p.id);
                _closePicker();
            }
        };

        row.appendChild(left);
        row.appendChild(right);
        listEl.appendChild(row);
    }

    let editFormEl = null;

    function _showEditForm(proj) {
        _ensurePickerDom();
        overlay.style.display = 'block';
        modal.style.display = 'block';
        titleEl.textContent = 'EDIT PROJECT';
        listEl.innerHTML = '';

        editFormEl = document.createElement('div');
        editFormEl.style.cssText = 'padding:4px 0;';
        editFormEl.innerHTML =
            '<div style="margin-bottom:12px;">' +
                '<label style="display:block;color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Project Name *</label>' +
                '<input type="text" id="edit-proj-name" style="width:100%;padding:10px;background:var(--bg);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:13px;border-radius:3px;box-sizing:border-box;">' +
            '</div>' +
            '<div style="margin-bottom:12px;">' +
                '<label style="display:block;color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Description</label>' +
                '<input type="text" id="edit-proj-desc" style="width:100%;padding:10px;background:var(--bg);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:13px;border-radius:3px;box-sizing:border-box;">' +
            '</div>' +
            '<div style="margin-bottom:4px;">' +
                '<div id="edit-instr-toggle" style="color:var(--cyan);cursor:pointer;font-size:11px;text-transform:uppercase;letter-spacing:1px;user-select:none;margin-bottom:8px;">&#9654; Instructions (optional)</div>' +
                '<div id="edit-instr-body" style="display:none;">' +
                    '<label style="display:block;color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Instructions</label>' +
                    '<textarea id="edit-proj-prompt" style="width:100%;min-height:100px;padding:10px;background:var(--bg);border:1px solid var(--border);color:var(--text);font-family:monospace;font-size:13px;border-radius:3px;box-sizing:border-box;resize:vertical;"></textarea>' +
                    '<div style="margin-top:8px;"><input type="file" id="edit-prompt-file" accept=".md,.txt" style="display:none;"><button id="edit-import-btn" style="background:transparent;border:1px solid var(--green);color:var(--green);padding:5px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit;">Import from file</button></div>' +
                '</div>' +
            '</div>' +
            '<div id="edit-msg" style="display:none;padding:8px 12px;margin-bottom:8px;border-radius:3px;font-size:12px;"></div>' +
            '<div style="display:flex;gap:10px;justify-content:flex-end;align-items:center;margin-top:12px;">' +
                '<span id="edit-version-btn" style="display:none;margin-right:auto;cursor:pointer;opacity:0.5;font-size:14px;" title="Version history">&#128336;</span>' +
                '<button id="edit-back-btn" style="background:transparent;border:1px solid var(--cyan);color:var(--cyan);padding:8px 14px;border-radius:4px;cursor:pointer;font-size:12px;font-family:inherit;">Back</button>' +
                '<button id="edit-save-btn" style="background:transparent;border:1px solid var(--dim);color:var(--dim);padding:8px 14px;border-radius:4px;cursor:pointer;font-size:12px;font-family:inherit;">Save</button>' +
            '</div>' +
            '<div id="edit-version-panel" style="display:none;margin-top:10px;border:1px solid var(--border);border-radius:4px;padding:10px;max-height:200px;overflow-y:auto;"></div>';

        listEl.appendChild(editFormEl);

        // Hide CREATE PROJECT button when editing
        var createBtn = document.querySelector('#project-modal button');
        var _hiddenCreateBtns = [];
        var allBtns = modal.querySelectorAll('button');
        allBtns.forEach(function(b) {
            if (b.textContent === 'CREATE PROJECT') {
                b.style.display = 'none';
                _hiddenCreateBtns.push(b);
            }
        });

        // Populate fields
        var nameEl = document.getElementById('edit-proj-name');
        var descEl = document.getElementById('edit-proj-desc');
        var promptEl = document.getElementById('edit-proj-prompt');
        var instrToggle = document.getElementById('edit-instr-toggle');
        var instrBody = document.getElementById('edit-instr-body');
        var msgEl = document.getElementById('edit-msg');

        if (nameEl) nameEl.value = proj.name || '';
        if (descEl) descEl.value = proj.description || '';
        if (promptEl) promptEl.value = proj.system_prompt || '';

        // Show instructions section if there are instructions
        if (proj.system_prompt && proj.system_prompt.trim()) {
            if (instrBody) instrBody.style.display = 'block';
            if (instrToggle) instrToggle.innerHTML = '&#9660; Instructions (optional)';
        }

        // Toggle
        if (instrToggle && instrBody) {
            instrToggle.onclick = function() {
                var open = instrBody.style.display !== 'none';
                instrBody.style.display = open ? 'none' : 'block';
                instrToggle.innerHTML = (open ? '&#9654;' : '&#9660;') + ' Instructions (optional)';
            };
        }

        // File import
        var importBtn = document.getElementById('edit-import-btn');
        var fileInput = document.getElementById('edit-prompt-file');
        if (importBtn && fileInput) {
            importBtn.onclick = function() { fileInput.click(); };
            fileInput.onchange = function() {
                var file = fileInput.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function(ev) {
                    if (promptEl) promptEl.value = ev.target.result;
                    if (instrBody) instrBody.style.display = 'block';
                    if (instrToggle) instrToggle.innerHTML = '&#9660; Instructions (optional)';
                };
                reader.readAsText(file);
                fileInput.value = '';
            };
        }

        // Track original values to detect changes
        var _origName = nameEl ? nameEl.value : '';
        var _origDesc = descEl ? descEl.value : '';
        var _origPrompt = promptEl ? promptEl.value : '';

        var _isDirty = false;
        function _checkDirty() {
            _isDirty = (nameEl && nameEl.value !== _origName) ||
                       (descEl && descEl.value !== _origDesc) ||
                       (promptEl && promptEl.value !== _origPrompt);
            var saveBtn = document.getElementById('edit-save-btn');
            var backBtnEl = document.getElementById('edit-back-btn');
            if (saveBtn) {
                saveBtn.style.borderColor = _isDirty ? 'var(--green)' : 'var(--dim)';
                saveBtn.style.color = _isDirty ? 'var(--green)' : 'var(--dim)';
            }
            if (backBtnEl) {
                backBtnEl.style.borderColor = _isDirty ? 'var(--dim)' : 'var(--cyan)';
                backBtnEl.style.color = _isDirty ? 'var(--dim)' : 'var(--cyan)';
            }
        }
        if (nameEl) nameEl.addEventListener('input', _checkDirty);
        if (descEl) descEl.addEventListener('input', _checkDirty);
        if (promptEl) promptEl.addEventListener('input', _checkDirty);

        // Back - confirm if dirty, restore CREATE PROJECT buttons
        var backBtn = document.getElementById('edit-back-btn');
        if (backBtn) backBtn.onclick = function() {
            if (_isDirty && !confirm('Discard unsaved changes?')) return;
            _hiddenCreateBtns.forEach(function(b) { b.style.display = ''; });
            openProjectPicker();
        };

        // Save
        var saveBtn = document.getElementById('edit-save-btn');
        if (saveBtn) saveBtn.onclick = async function() {
            var name = nameEl ? nameEl.value.trim() : '';
            if (!name) {
                if (msgEl) { msgEl.style.display = 'block'; msgEl.style.background = 'rgba(255,0,100,0.1)'; msgEl.style.border = '1px solid var(--red)'; msgEl.style.color = 'var(--red)'; msgEl.textContent = 'Name is required'; }
                return;
            }
            var desc = descEl ? descEl.value.trim() : '';
            var prompt = promptEl ? promptEl.value : '';
            var body = { name: name, description: desc };
            body.system_prompt = (prompt && prompt.trim()) ? prompt : '';

            try {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';
                var tok = _getUserToken();
                var resp = await fetch('/api/user/projects/' + proj.id, {
                    method: 'PUT',
                    headers: { 'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if (!resp.ok) { var err = await resp.json().catch(function() { return {}; }); throw new Error(err.error || 'Failed'); }
                // Re-apply the project so the server picks up new prompt
                _switchProject(proj.id);
                _closePicker();
                if (typeof showToast === 'function') showToast('Project updated');
            } catch (e) {
                if (msgEl) { msgEl.style.display = 'block'; msgEl.style.background = 'rgba(255,0,100,0.1)'; msgEl.style.border = '1px solid var(--red)'; msgEl.style.color = 'var(--red)'; msgEl.textContent = 'Error: ' + e.message; }
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save';
            }
        };

        // Version history button - fetch from server, show if 2+ versions
        var versionBtn = document.getElementById('edit-version-btn');
        var versionPanel = document.getElementById('edit-version-panel');
        (async function() {
            try {
                var tok = _getUserToken();
                var vResp = await fetch('/api/user/projects/' + proj.id + '/versions', {
                    headers: { 'Authorization': 'Bearer ' + tok }
                });
                if (!vResp.ok) return;
                var vData = await vResp.json();
                var versions = vData.versions || [];
                if (versions.length >= 2 && versionBtn) {
                    versionBtn.style.display = 'inline';
                    versionBtn.onclick = function() {
                        if (versionPanel.style.display === 'none') {
                            versionPanel.style.display = 'block';
                            versionPanel.innerHTML = '<div style="color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Version History (' + versions.length + ')</div>' +
                                versions.map(function(v, i) {
                                    var d = new Date(v.created_at);
                                    var label = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
                                    var isCurrent = (i === 0);
                                    return '<div style="padding:6px 8px;margin-bottom:4px;border-radius:3px;background:rgba(0,0,0,0.2);border:1px solid ' + (isCurrent ? 'var(--green)' : 'var(--border)') + ';cursor:' + (isCurrent ? 'default' : 'pointer') + ';" ' +
                                        (isCurrent ? '' : 'data-vid="' + v.id + '"') + '>' +
                                        '<div style="color:' + (isCurrent ? 'var(--green)' : 'var(--cyan)') + ';font-size:11px;">' + label + (isCurrent ? ' (current)' : '') + '</div>' +
                                        '<div style="color:var(--dim);font-size:10px;margin-top:2px;">' + (v.name || '') + '</div>' +
                                        '</div>';
                                }).join('');
                            versionPanel.querySelectorAll('[data-vid]').forEach(function(el) {
                                el.onclick = function() {
                                    var vid = parseInt(el.getAttribute('data-vid'));
                                    var v = versions.find(function(x) { return x.id === vid; });
                                    if (!v) return;
                                    if (!confirm('Restore this version from ' + new Date(v.created_at).toLocaleString() + '?')) return;
                                    if (nameEl) nameEl.value = v.name || '';
                                    if (descEl) descEl.value = v.description || '';
                                    if (promptEl) promptEl.value = v.system_prompt || '';
                                    versionPanel.style.display = 'none';
                                    _checkDirty();
                                };
                            });
                        } else {
                            versionPanel.style.display = 'none';
                        }
                    };
                }
            } catch(vErr) {}
        })();

        // Focus name
        setTimeout(function() { if (nameEl) nameEl.focus(); }, 100);
    }

    let createFormEl = null;

    function _showCreateForm() {
        _ensurePickerDom();
        overlay.style.display = 'block';
        modal.style.display = 'block';
        titleEl.textContent = 'NEW PROJECT';
        listEl.innerHTML = '';

        if (!createFormEl) {
            createFormEl = document.createElement('div');
            createFormEl.style.cssText = 'padding:4px 0;';
            createFormEl.innerHTML =
                '<div style="margin-bottom:12px;">' +
                    '<label style="display:block;color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Project Name *</label>' +
                    '<input type="text" id="picker-proj-name" placeholder="e.g., Code Review, Research" style="width:100%;padding:10px;background:var(--bg);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:13px;border-radius:3px;box-sizing:border-box;">' +
                '</div>' +
                '<div style="margin-bottom:12px;">' +
                    '<label style="display:block;color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Description</label>' +
                    '<input type="text" id="picker-proj-desc" placeholder="Brief description" style="width:100%;padding:10px;background:var(--bg);border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:13px;border-radius:3px;box-sizing:border-box;">' +
                '</div>' +
                '<div style="margin-bottom:4px;">' +
                    '<div id="picker-instr-toggle" style="color:var(--cyan);cursor:pointer;font-size:11px;text-transform:uppercase;letter-spacing:1px;user-select:none;margin-bottom:8px;">&#9654; Add Instructions (optional)</div>' +
                    '<div id="picker-instr-body" style="display:none;">' +
                        '<label style="display:block;color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Instructions</label>' +
                        '<textarea id="picker-proj-prompt" placeholder="Type project instructions here..." style="width:100%;min-height:100px;padding:10px;background:var(--bg);border:1px solid var(--border);color:var(--text);font-family:monospace;font-size:13px;border-radius:3px;box-sizing:border-box;resize:vertical;"></textarea>' +
                        '<div style="margin-top:8px;"><input type="file" id="picker-prompt-file" accept=".md,.txt" style="display:none;"><button id="picker-import-btn" style="background:transparent;border:1px solid var(--green);color:var(--green);padding:5px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit;">Import from file</button></div>' +
                    '</div>' +
                '</div>' +
                '<div id="picker-create-msg" style="display:none;padding:8px 12px;margin-bottom:8px;border-radius:3px;font-size:12px;"></div>' +
                '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;">' +
                    '<button id="picker-create-back" style="background:transparent;border:1px solid var(--dim);color:var(--dim);padding:8px 14px;border-radius:4px;cursor:pointer;font-size:12px;font-family:inherit;">Back</button>' +
                    '<button id="picker-create-save" style="background:transparent;border:1px solid var(--green);color:var(--green);padding:8px 14px;border-radius:4px;cursor:pointer;font-size:12px;font-family:inherit;">Create & Use</button>' +
                '</div>';
        }

        listEl.appendChild(createFormEl);

        // Wire up toggle
        var toggle = document.getElementById('picker-instr-toggle');
        var instrBody = document.getElementById('picker-instr-body');
        if (toggle && instrBody) {
            toggle.onclick = function() {
                var open = instrBody.style.display !== 'none';
                instrBody.style.display = open ? 'none' : 'block';
                toggle.innerHTML = (open ? '&#9654;' : '&#9660;') + ' Add Instructions (optional)';
            };
        }

        // Clear fields
        var nameEl = document.getElementById('picker-proj-name');
        var descEl = document.getElementById('picker-proj-desc');
        var promptEl = document.getElementById('picker-proj-prompt');
        var msgEl = document.getElementById('picker-create-msg');
        if (nameEl) nameEl.value = '';
        if (descEl) descEl.value = '';
        if (promptEl) promptEl.value = '';
        if (instrBody) instrBody.style.display = 'none';
        if (toggle) toggle.innerHTML = '&#9654; Add Instructions (optional)';
        if (msgEl) msgEl.style.display = 'none';

        // Wire up file import
        var importBtn = document.getElementById('picker-import-btn');
        var fileInput = document.getElementById('picker-prompt-file');
        if (importBtn && fileInput) {
            importBtn.onclick = function() { fileInput.click(); };
            fileInput.onchange = function() {
                var file = fileInput.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function(ev) {
                    if (promptEl) promptEl.value = ev.target.result;
                    if (instrBody) instrBody.style.display = 'block';
                    if (toggle) toggle.innerHTML = '&#9660; Add Instructions (optional)';
                    var nm = document.getElementById('picker-proj-name');
                    if (nm && !nm.value.trim()) nm.value = file.name.replace(/\.(md|txt)$/i, '');
                };
                reader.readAsText(file);
                fileInput.value = '';
            };
        }

        // Focus name
        setTimeout(function() { if (nameEl) nameEl.focus(); }, 100);

        // Back button
        var backBtn = document.getElementById('picker-create-back');
        if (backBtn) backBtn.onclick = function() { openProjectPicker(); };

        // Save button
        var saveBtn = document.getElementById('picker-create-save');
        if (saveBtn) saveBtn.onclick = async function() {
            var name = (nameEl ? nameEl.value.trim() : '');
            if (!name) {
                if (msgEl) { msgEl.style.display = 'block'; msgEl.style.background = 'rgba(255,0,100,0.1)'; msgEl.style.border = '1px solid var(--red)'; msgEl.style.color = 'var(--red)'; msgEl.textContent = 'Project name is required'; }
                return;
            }
            var desc = (descEl ? descEl.value.trim() : '');
            var prompt = (promptEl ? promptEl.value : '');
            var body = { name: name, description: desc };
            if (prompt && prompt.trim()) body.system_prompt = prompt;
            else body.system_prompt = '';

            try {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Creating...';
                var tok = _getUserToken();
                var resp = await fetch('/api/user/projects', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                if (!resp.ok) { var err = await resp.json().catch(function() { return {}; }); throw new Error(err.error || 'Failed'); }
                var data = await resp.json();
                var newId = data.id;
                // Switch to the new project immediately
                if (newId) _switchProject(newId);
                _closePicker();
                if (typeof showToast === 'function') showToast('Project created');
            } catch (e) {
                if (msgEl) { msgEl.style.display = 'block'; msgEl.style.background = 'rgba(255,0,100,0.1)'; msgEl.style.border = '1px solid var(--red)'; msgEl.style.color = 'var(--red)'; msgEl.textContent = 'Error: ' + e.message; }
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Create & Use';
            }
        };
    }

    async function openProjectPicker() {
        _ensurePickerDom();

        overlay.style.display = 'block';
        modal.style.display = 'block';
        titleEl.textContent = 'PROJECT';
        listEl.innerHTML = '<div style="color:var(--dim);padding:10px;">Loading...</div>';

        try {
            const projects = await _loadProjects();
            _renderProjects(projects);
        } catch (e) {
            const authModal = document.getElementById('auth-modal');
            if (String(e.message || '').toLowerCase().includes('login') && authModal) {
                try {
                    authModal.style.display = 'flex';
                    if (typeof showAuthTab === 'function') showAuthTab('login');
                } catch {}
            }
            listEl.innerHTML = '<div style="color:var(--red);padding:10px;border:1px solid rgba(255,0,100,0.3);border-radius:6px;">' + escapeHtml(String(e.message || e)) + '</div>';
        }
    }

    async function _applyDefaultProjectOrOpenPicker() {
        try {
            const projects = await _loadProjects();
            const def = (projects || []).find(p => !!p.is_default);
            if (def && def.id) {
                _switchProject(def.id);
                return;
            }
            openProjectPicker();
            showToast('No default project set');
        } catch (e) {
            openProjectPicker();
        }
    }

    function _ensureHeaderControls() {
        if (window.__RHODES_DISABLE_PROJECTS) return;
        const sc = document.querySelector('.session-controls');
        if (!sc) return;
        if (document.getElementById('project-add-btn')) return;

        const newBtn = document.getElementById('new-rhodes-btn');
        const sessionDropdown = sc.querySelector('.session-dropdown');
        const sessionsBtn = document.getElementById('sessions-btn');
        const searchBtn = document.getElementById('search-sessions-btn');
        if (!newBtn || !sessionDropdown || !sessionsBtn) return;

        function _isMobileViewport() {
            try {
                if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return true;
            } catch {}
            try {
                if (typeof SYSTEM_INFO !== 'undefined' && SYSTEM_INFO && SYSTEM_INFO.isMobile) return true;
            } catch {}
            return false;
        }

        // Build a 2-row stack:
        // Row 1: existing session controls.
        // Row 2: "+ PROJECT" with its own picker button aligned under the sessions picker.
        const existingChildren = Array.from(sc.children);
        const stack = document.createElement('div');
        stack.id = 'session-controls-stack';
        stack.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

        const row1 = document.createElement('div');
        row1.id = 'session-controls-row1';
        row1.style.cssText = 'display:flex;align-items:center;';

        const row2 = document.createElement('div');
        row2.id = 'session-controls-row2';
        row2.style.cssText = 'display:flex;align-items:center;';

        // Move original controls into row1 in original order.
        existingChildren.forEach(function(ch) { row1.appendChild(ch); });

        // Create project controls for row2.
        const baseStyle = (newBtn.getAttribute('style') || '');

        // Force the row1 "picker" and "search" controls to match the same rectangle styling as "+ New Session".
        // The HTML uses a mix of borders/radii; normalize so the arrow doesn't look like its own separate widget.
        try {
            newBtn.style.border = '1px solid var(--cyan)';
            newBtn.style.color = 'var(--cyan)';
            newBtn.style.borderRadius = '3px 0 0 3px';
        } catch {}
        try {
            sessionsBtn.style.cssText = baseStyle;
            sessionsBtn.style.border = '1px solid var(--cyan)';
            sessionsBtn.style.color = 'var(--cyan)';
            sessionsBtn.style.borderRadius = '0 3px 3px 0';
            sessionsBtn.style.marginLeft = '-1px';
            sessionsBtn.style.minWidth = '44px';
        } catch {}

        addBtnEl = document.createElement('button');
        addBtnEl.id = 'project-add-btn';
        addBtnEl.textContent = '+ PROJECT';
        addBtnEl.title = 'Apply default project to this session';
        addBtnEl.style.cssText = baseStyle;
        addBtnEl.style.border = '1px solid var(--green)';
        addBtnEl.style.color = 'var(--green)';
        addBtnEl.style.borderRadius = '3px 0 0 3px';
        addBtnEl.style.boxSizing = 'border-box';
        addBtnEl.onclick = function(e) {
            try { e.preventDefault(); e.stopPropagation(); } catch {}
            _applyDefaultProjectOrOpenPicker();
        };

        downBtnEl = document.createElement('button');
        downBtnEl.id = 'project-down-btn';
        downBtnEl.textContent = '▼';
        downBtnEl.title = 'Pick project';
        downBtnEl.style.cssText = baseStyle;
        downBtnEl.style.border = '1px solid var(--green)';
        downBtnEl.style.borderRadius = '0 3px 3px 0';
        downBtnEl.style.color = 'var(--green)';
        downBtnEl.style.marginLeft = '-1px';
        downBtnEl.style.minWidth = '44px';
        downBtnEl.style.boxSizing = 'border-box';
        downBtnEl.onclick = function(e) {
            try { e.preventDefault(); e.stopPropagation(); } catch {}
            openProjectPicker();
        };

        row2.appendChild(addBtnEl);
        row2.appendChild(downBtnEl);

        // Replace session-controls contents with stack.
        sc.innerHTML = '';
        sc.appendChild(stack);
        stack.appendChild(row2);
        stack.appendChild(row1);

        // Mobile: show controls briefly, then auto-collapse into a single down-arrow toggle.
        (function installMobileAutoCollapse() {
            if (!_isMobileViewport()) return;
            if (document.getElementById('session-controls-collapse-btn')) return;

            // Force column layout so the collapse toggle sits above the stack cleanly.
            try { sc.style.flexDirection = 'column'; } catch {}
            try { sc.style.alignItems = 'center'; } catch {}
            try { sc.style.gap = '8px'; } catch {}

            const collapseBtn = document.createElement('span');
            collapseBtn.id = 'session-controls-collapse-btn';
            collapseBtn.textContent = '▾';
            collapseBtn.title = 'Show controls';
            // Intentionally tiny (per request), not a full-size touch button.
            collapseBtn.style.cssText = 'display:none;color:var(--cyan);font-size:16px;line-height:1;cursor:pointer;user-select:none;padding:2px 6px;opacity:0.9;';
            sc.insertBefore(collapseBtn, stack);

            const expandedDisplay = (stack.style.display || 'flex');
            let collapsed = false;
            let timer = null;
            const _origJustify = sc.style.justifyContent;
            const _origPadding = sc.style.padding;
            const _origMarginBottom = sc.style.marginBottom;

            function scheduleAutoCollapse() {
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => {
                    if (!_isMobileViewport()) return;
                    const dd = document.getElementById('sessions-list');
                    if (dd && dd.classList.contains('show')) {
                        scheduleAutoCollapse();
                        return;
                    }
                    setCollapsed(true);
                }, 3500);
            }

            function setCollapsed(next) {
                collapsed = !!next;
                if (collapsed) {
                    stack.style.display = 'none';
                    collapseBtn.textContent = '▾';
                    collapseBtn.title = 'Show controls';
                    collapseBtn.style.display = 'inline-block';
                    // Collapse container to the smallest possible footprint.
                    try { sc.style.justifyContent = 'center'; } catch {}
                    try { sc.style.padding = '0'; } catch {}
                    try { sc.style.marginBottom = '0'; } catch {}
                } else {
                    stack.style.display = expandedDisplay;
                    collapseBtn.style.display = 'none';
                    try { sc.style.justifyContent = _origJustify; } catch {}
                    try { sc.style.padding = _origPadding; } catch {}
                    try { sc.style.marginBottom = _origMarginBottom; } catch {}
                    scheduleAutoCollapse();
                }
            }

            collapseBtn.onclick = function(e) {
                try { e.preventDefault(); e.stopPropagation(); } catch {}
                // Only used to expand once controls are hidden.
                setCollapsed(false);
            };

            // Any interaction with the stack keeps it open a bit longer.
            sc.addEventListener('click', function() { if (!collapsed) scheduleAutoCollapse(); }, true);
            sc.addEventListener('touchstart', function() { if (!collapsed) scheduleAutoCollapse(); }, { capture: true, passive: true });

            // Initial behavior: show, then hide.
            setCollapsed(false);

            window.addEventListener('resize', function() {
                if (_isMobileViewport()) {
                    if (collapsed) collapseBtn.style.display = 'inline-block';
                    // Keep current collapsed/expanded state.
                    if (!collapsed && stack.style.display === 'none') stack.style.display = expandedDisplay;
                    return;
                }
                // Desktop: always show controls; hide toggle.
                if (timer) clearTimeout(timer);
                stack.style.display = expandedDisplay;
                collapseBtn.style.display = 'none';
                collapsed = false;
            });
        })();

        function syncWidths() {
            try {
                const wNew = Math.ceil(newBtn.getBoundingClientRect().width);
                const wSess = Math.ceil(sessionsBtn.getBoundingClientRect().width);
                if (wNew > 0) addBtnEl.style.width = wNew + 'px';
                if (wSess > 0) downBtnEl.style.width = wSess + 'px';
            } catch {}
        }
        // Run sync after layout is stable — rAF alone fires too early on login
        requestAnimationFrame(function() { requestAnimationFrame(syncWidths); });
        window.addEventListener('resize', syncWidths);

        window.__rhodesUpdateProjectBadge = function() {
            const name = window.__RHODES_ACTIVE_PROJECT_NAME || '';
            const active = !!name;
            if (addBtnEl) {
                addBtnEl.title = active ? ('Active: ' + name) : 'Apply default project to this session';
                addBtnEl.style.borderColor = active ? 'var(--green)' : 'var(--cyan)';
                addBtnEl.style.color = active ? 'var(--green)' : 'var(--cyan)';
            }
            if (downBtnEl) {
                downBtnEl.title = active ? ('Pick project (active: ' + name + ')') : 'Pick project';
                downBtnEl.style.borderColor = active ? 'var(--green)' : 'var(--cyan)';
                downBtnEl.style.color = active ? 'var(--green)' : 'var(--cyan)';
            }
        };
        window.__rhodesUpdateProjectBadge();
    }

    document.addEventListener('DOMContentLoaded', function() {
        try { _ensureHeaderControls(); } catch {}
        try {
            const mobileMenu = document.getElementById('mobile-menu-dropdown');
            if (mobileMenu && !document.getElementById('mobile-project-link')) {
                const a = document.createElement('a');
                a.id = 'mobile-project-link';
                a.href = '#';
                a.className = 'mobile-menu-item';
                a.textContent = '+ PROJECT';
                a.onclick = function() {
                    try { openProjectPicker(); } catch {}
                    try { if (typeof closeMobileMenu === 'function') closeMobileMenu(); } catch {}
                    return false;
                };
                // Insert after sessions items if present, else near top.
                const after = document.getElementById('mobile-sessions-list');
                if (after && after.parentNode === mobileMenu) {
                    mobileMenu.insertBefore(a, after.nextSibling);
                } else {
                    mobileMenu.insertBefore(a, mobileMenu.firstChild);
                }
            }
        } catch {}
    });

    window.openProjectPicker = openProjectPicker;
    window.switchProject = _switchProject;

    window._slashCommands["/project"] = function(args) {
        const a = String(args || '').trim();
        if (!a) {
            openProjectPicker();
            return null;
        }
        const low = a.toLowerCase();
        if (low === 'clear' || low === 'none' || low === 'off') {
            _switchProject(null);
            return 'Project cleared';
        }
        const n = parseInt(a, 10);
        if (!Number.isNaN(n)) {
            _switchProject(n);
            return 'Switching project...';
        }
        return 'Usage: /project | /project <id> | /project clear';
    };
    window._slashCommands["/projects"] = window._slashCommands["/project"];
})();

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


// ── Rhodes Sites Panel + Sandbox Terminal ────────────────────────────────────
// Your Sites panel — shows user-hosted sites from sandbox ~/public_html
// Sandbox Terminal — noVNC iframe terminal (xterm via x11vnc)

(function() {
    'use strict';

    // ── Sites Panel ──────────────────────────────────────────────────────────

    window.showSitesPanel = function() {
        const panel = document.getElementById('sites-panel');
        if (!panel) return;
        panel.classList.add('show');
        // Request sites list from server
        const body = document.getElementById('sites-panel-body');
        if (body) body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--dim);">Loading sites...</div>';
        if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            window.ws.send(JSON.stringify({ msg_type: 'list_user_sites' }));
        }
    };

    // Close button
    document.addEventListener('DOMContentLoaded', function() {
        const closeBtn = document.getElementById('close-sites');
        if (closeBtn) {
            closeBtn.onclick = function() {
                const panel = document.getElementById('sites-panel');
                if (panel) panel.classList.remove('show');
            };
        }
    });

    function _escHtml(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function _formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function _timeAgo(isoStr) {
        try {
            const d = new Date(isoStr);
            const now = new Date();
            const diff = (now - d) / 1000;
            if (diff < 60) return 'just now';
            if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
            if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
            if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
            return d.toLocaleDateString();
        } catch (e) {
            return '';
        }
    }

    window._renderUserSites = function(sites) {
        const body = document.getElementById('sites-panel-body');
        if (!body) return;

        if (!sites || sites.length === 0) {
            // Empty state
            body.innerHTML = [
                '<div class="sites-empty">',
                '  <div class="sites-empty-icon">&#127760;</div>',
                '  <div class="sites-empty-title">No Sites Yet</div>',
                '  <div class="sites-empty-desc">',
                '    Ask Rhodes to create and host a website, game, or web app.<br>',
                '    Your creations will appear here.',
                '  </div>',
                '  <button class="sites-create-btn" onclick="window._sitesCreateAndClose()">Create a Site</button>',
                '</div>'
            ].join('\n');
            return;
        }

        // Preview frame at top
        let html = '<div id="site-preview-container" class="site-preview-container">';
        html += '  <div class="site-preview-header">';
        html += '    <span id="site-preview-label" class="site-preview-label">Select a site</span>';
        html += '    <div class="site-preview-actions">';
        html += '      <a id="site-preview-newtab" href="#" target="_blank" rel="noopener" class="site-preview-btn" style="display:none;">Open in New Tab &#8599;</a>';
        html += '    </div>';
        html += '  </div>';
        html += '  <iframe id="site-preview-iframe" class="site-preview-iframe" src="about:blank"></iframe>';
        html += '</div>';

        // Header bar with count + buttons
        html += '<div class="sites-header-bar">';
        html += '<span class="site-count">' + sites.length + ' site' + (sites.length !== 1 ? 's' : '') + '</span>';
        html += '<div style="display:flex;gap:8px;">';
        html += '<button onclick="window._openSandboxTerminal()" title="Open terminal">Open Terminal</button>';
        html += '<button onclick="window._sitesCreateAndClose()">+ Create New Site</button>';
        html += '</div></div>';

        // Sites grid
        html += '<div class="sites-grid">';
        for (let i = 0; i < sites.length; i++) {
            const site = sites[i];
            const icon = site.type === 'directory' ? '&#128193;' : '&#128196;';
            const meta = [];
            if (site.type === 'directory' && site.file_count !== undefined) {
                meta.push(site.file_count + ' file' + (site.file_count !== 1 ? 's' : ''));
            }
            if (site.size !== undefined) {
                meta.push(_formatSize(site.size));
            }
            if (site.last_modified) {
                meta.push(_timeAgo(site.last_modified));
            }

            const url = _escHtml(site.url || '#');
            const name = _escHtml(site.name);
            html += '<div class="site-card' + (i === 0 ? ' active' : '') + '" data-url="' + url + '" data-name="' + name + '" onclick="window._previewSite(this)">';
            html += '  <div class="site-thumb"><iframe src="' + url + '" tabindex="-1" loading="lazy" scrolling="no" sandbox="allow-scripts allow-same-origin"></iframe></div>';
            html += '  <div class="site-info">';
            html += '    <div class="site-name">' + name + '</div>';
            html += '    <div class="site-meta">' + _escHtml(meta.join(' \u00b7 ')) + '</div>';
            html += '  </div>';
            html += '  <a class="site-newtab-link" href="' + url + '" target="_blank" rel="noopener" title="Open in new tab" onclick="event.stopPropagation()">&#8599;</a>';
            html += '</div>';
        }
        html += '</div>';

        body.innerHTML = html;

        // Auto-preview the first site
        if (sites.length > 0) {
            const firstCard = body.querySelector('.site-card');
            if (firstCard) window._previewSite(firstCard);
        }
    };

    window._previewSite = function(cardEl) {
        if (!cardEl) return;
        const url = cardEl.getAttribute('data-url');
        const name = cardEl.getAttribute('data-name');
        if (!url) return;

        // Update active state
        document.querySelectorAll('#sites-panel-body .site-card').forEach(function(c) { c.classList.remove('active'); });
        cardEl.classList.add('active');

        // Update preview
        const iframe = document.getElementById('site-preview-iframe');
        const label = document.getElementById('site-preview-label');
        const newtab = document.getElementById('site-preview-newtab');
        if (iframe) iframe.src = url;
        if (label) label.textContent = name || 'Preview';
        if (newtab) {
            newtab.href = url;
            newtab.style.display = 'inline-block';
        }
    };

    window._sitesCreateAndClose = function() {
        // Close sites panel
        const panel = document.getElementById('sites-panel');
        if (panel) panel.classList.remove('show');
        // Prefill chat input
        const input = document.getElementById('msg') || document.querySelector('textarea');
        if (input) {
            input.value = 'Create and host a website for my ';
            input.focus();
            // Move cursor to end
            input.setSelectionRange(input.value.length, input.value.length);
        }
    };

    // ── Sandbox Terminal ─────────────────────────────────────────────────────

    window._openSandboxTerminal = function() {
        if (typeof showToast === 'function') showToast('Starting terminal...');
        if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            window.ws.send(JSON.stringify({ msg_type: 'terminal_start' }));
        }
    };

    window._openTerminalViewer = function(url, username) {
        // Remove any existing terminal overlay
        const existing = document.getElementById('terminal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'terminal-overlay';

        // Header
        const header = document.createElement('div');
        header.className = 'terminal-header';

        const titleDiv = document.createElement('div');
        titleDiv.innerHTML = '<div class="terminal-title">SANDBOX TERMINAL</div>'
            + '<div class="terminal-user">' + _escHtml(username) + '@rhodes</div>';

        const btnDiv = document.createElement('div');
        btnDiv.className = 'terminal-buttons';

        // Pop Out button
        const popoutBtn = document.createElement('button');
        popoutBtn.textContent = 'Pop Out';
        popoutBtn.title = 'Open in separate window';
        popoutBtn.onclick = function() {
            window.open(url, 'rhodes_terminal',
                'width=1024,height=700,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes');
        };
        btnDiv.appendChild(popoutBtn);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.className = 'terminal-close-btn';
        closeBtn.onclick = function() { window._closeSandboxTerminal(); };
        btnDiv.appendChild(closeBtn);

        header.appendChild(titleDiv);
        header.appendChild(btnDiv);
        overlay.appendChild(header);

        // Iframe
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
        overlay.appendChild(iframe);

        document.body.appendChild(overlay);

        // Close sites panel if open
        const sitesPanel = document.getElementById('sites-panel');
        if (sitesPanel) sitesPanel.classList.remove('show');
    };

    window._closeSandboxTerminal = function() {
        const overlay = document.getElementById('terminal-overlay');
        if (overlay) overlay.remove();
        // Send stop to server
        if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            window.ws.send(JSON.stringify({ msg_type: 'terminal_stop' }));
        }
    };

    // Escape key closes terminal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('terminal-overlay');
            if (overlay) {
                e.preventDefault();
                e.stopPropagation();
                window._closeSandboxTerminal();
            }
        }
    });

})();
