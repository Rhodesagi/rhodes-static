/* RHODES v2 module: rhodes.part1.bootstrap.js */
/* Source: contiguous slice of rhodes.monolith.js */

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
                    macos: { label: 'Download for macOS', url: 'https://rhodesagi.com/download/rhodes-code-2.0.0-arm64.dmg', note: 'Apple Silicon (.dmg)' },
                    macos_intel: { label: 'Download for macOS (Intel)', url: 'https://rhodesagi.com/download/rhodes-code-2.0.0-mac-x64.zip', note: 'Intel (.zip)' },
                    windows: { label: 'Download for Windows', url: 'https://rhodesagi.com/download/rhodes-code-2.0.0-setup.exe', note: 'Windows 10+ (.exe)' },
                    linux: { label: 'Download for Linux', url: 'https://rhodesagi.com/download/rhodes-code-2.0.0.AppImage', note: 'AppImage (.AppImage)' },
                    any: { label: 'Download Rhodes Code', url: 'https://rhodesagi.com/account', note: 'Visit account page for downloads' }
                }
            }
        };

        window._renderDownloadCard = function(args, toolResult) {
            var product = (args && args.product) || 'rhodes_code';
            var reason = (args && args.reason) || '';

            // Parse from tool result if needed
            if (toolResult && typeof toolResult === 'object' && toolResult.display_text) {
                var m = toolResult.display_text.match(/\[DOWNLOAD_OFFER:(\{[^}]+\})\]/);
                if (m) {
                    try {
                        var parsed = JSON.parse(m[1]);
                        product = parsed.product || product;
                        reason = parsed.reason || reason;
                    } catch(e) {}
                }
            }

            var info = RHODES_DOWNLOADS[product];
            if (!info) {
                addMsg('ai', reason || ('Download ' + product));
                return;
            }

            // Pick the right download for this device
            var downloadKey = SYSTEM_INFO.downloadKey || 'any';
            var primary = info.links[downloadKey] || info.links.any;

            // Build card HTML
            var cardHtml = '<div class="download-card">';
            cardHtml += '<div class="download-card-header">';
            cardHtml += '<span class="download-card-icon">' + info.icon + '</span>';
            cardHtml += '<span class="download-card-title">' + info.name + '</span>';
            cardHtml += '</div>';
            if (reason) {
                cardHtml += '<div class="download-card-reason">' + reason.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
            }
            cardHtml += '<a href="' + primary.url + '" class="download-card-btn" target="_blank" rel="noopener">' + primary.label + '</a>';
            if (primary.note) {
                cardHtml += '<div class="download-card-note">' + primary.note + '</div>';
            }
            // Show alternate links for other platforms
            var altKeys = Object.keys(info.links).filter(function(k) { return k !== downloadKey && k !== 'any'; });
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

