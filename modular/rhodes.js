// Global error handling
        window.addEventListener('error', function(e) {
            console.error('RHODES Global Error:', e.error, 'at', e.filename, ':', e.lineno, ':', e.colno);
            // Show visible error banner
            try {
                const errorBanner = document.createElement('div');
                errorBanner.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#ff0000;color:#fff;padding:10px;z-index:99999;font-family:monospace;font-size:12px;text-align:center;';
                errorBanner.textContent = 'JavaScript Error: ' + (e.error ? e.error.toString() : e.message) + ' (check console for details)';
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
                errorBanner.textContent = 'Promise Rejection: ' + (e.reason ? e.reason.toString() : 'Unknown error');
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
        let autoGuestAttempted = false;
        let connectionInProgress = false;
        // Auto-detect WebSocket URL based on current host
        const wsProtocol = 'wss:';
        const isGitHubPages = window.location.hostname.includes('github.io');
        const isRhodesDomain = window.location.hostname.includes('rhodesagi.com');
        const wsHost = (isGitHubPages || isRhodesDomain) ? 'rhodesagi.com' : window.location.hostname;
        const wsPort = (isGitHubPages || isRhodesDomain) ? '' : ':8766';
        const wsPath = (isGitHubPages || isRhodesDomain) ? '/ws' : '';
        const defaultServer = `${wsProtocol}//${wsHost}${wsPort}${wsPath}`;
        console.log('WebSocket URL calculation:', {
            wsProtocol, wsHost, wsPort, wsPath, defaultServer,
            currentHostname: window.location.hostname,
            isGitHubPages, isRhodesDomain
        });
        let SERVER = localStorage.getItem('rhodes_server') || defaultServer;
        console.log('SERVER URL:', SERVER);
        console.log('WebSocket supported:', 'WebSocket' in window);
        let TOKEN = localStorage.getItem('rhodes_token') || '';
        let USER_TOKEN = localStorage.getItem('rhodes_user_token') || '';
        // Clear stale guest tokens - only keep if we have a valid user token
        if (TOKEN && !USER_TOKEN) {
            console.log('Clearing stale guest token');
            TOKEN = '';
            localStorage.removeItem('rhodes_token');
        }
        let IS_GUEST = true;
        let GUEST_MESSAGES_REMAINING = 3;
        let CLIENT_ID = localStorage.getItem('rhodes_client_id') || 'web_' + Math.random().toString(36).substr(2,6);
        let RHODES_ID = null;  // Human-readable session ID (e.g., rh-7x3k9-m2p4q)
        let CURRENT_USERNAME = null;  // Current authenticated username

        // UUID fallback for HTTP (crypto.randomUUID requires HTTPS)
        const generateUUID = () => {
            if (crypto.randomUUID) return crypto.randomUUID();
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0;
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
        };
        localStorage.setItem('rhodes_client_id', CLIENT_ID);

        // TAB_ID: Session identifier for Rhodes instance
        // Default: localStorage (persists across browser closes = same Rhodes)
        // With ?new param or "New Rhodes" button: sessionStorage (temporary new instance)
        const urlParams = new URLSearchParams(window.location.search);
        let wantsNewRhodes = urlParams.get('new') === '1';
        const resumeSessionId = urlParams.get('resume');  // Resume a previous session
        const viewSessionId = urlParams.get('view');      // View-only mode for shared session
        const sharedQA = urlParams.get('qa');  // Shared Q&A pair (base64 encoded)

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

        let TAB_ID;
        if (wantsNewRhodes) {
            // New Rhodes requested - use sessionStorage (dies when tab closes)
            TAB_ID = sessionStorage.getItem('rhodes_new_tab_id');
            if (!TAB_ID) {
                TAB_ID = 'new_' + Math.random().toString(36).substr(2,8);
                sessionStorage.setItem('rhodes_new_tab_id', TAB_ID);
            }
        } else {
            // Default - use localStorage (persists = same Rhodes always)
            TAB_ID = localStorage.getItem('rhodes_tab_id');
            if (!TAB_ID) {
                TAB_ID = 'main_' + Math.random().toString(36).substr(2,8);
                localStorage.setItem('rhodes_tab_id', TAB_ID);
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
            window.open(newUrl, '_blank');
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

        // Session dropdown functions
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
                const resp = await fetch(`/api/sessions?username=${encodeURIComponent(CURRENT_USERNAME)}`);
                const data = await resp.json();

                // Store sessions globally for filtering
                window.sessionsData = data.sessions || [];

                if (window.sessionsData.length > 0) {
                    renderSessions(window.sessionsData);
                } else {
                    document.getElementById('sessions-results').innerHTML = '<div class="sessions-empty">No previous sessions</div>';
                }
            } catch (e) {
                document.getElementById('sessions-results').innerHTML = '<div class="sessions-empty">Error loading sessions</div>';
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
                const date = new Date(s.last_active).toLocaleDateString();
                const time = new Date(s.last_active).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                return `
                    <div class="session-item${isActive ? ' active' : ''}" onclick="loadSession('${s.session_id}', event)">
                        <div class="session-preview">${s.preview || 'Empty session'}</div>
                        <div class="session-meta">${date} ${time} • ${s.message_count} messages</div>
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

            // First, filter by metadata (fast)
            const metadataFiltered = window.sessionsData.filter(s => {
                const preview = (s.preview || '').toLowerCase();
                const sessionId = (s.session_id || '').toLowerCase();
                const date = new Date(s.last_active).toLocaleDateString().toLowerCase();
                const time = new Date(s.last_active).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}).toLowerCase();
                const messageCount = s.message_count?.toString() || '';
                
                return preview.includes(query) || 
                       sessionId.includes(query) ||
                       date.includes(query) ||
                       time.includes(query) ||
                       messageCount.includes(query);
            });

            // Check if query hasn't changed during async operations
            if (currentSearchQuery !== query) return;

            // Show metadata results immediately
            if (metadataFiltered.length > 0) {
                renderSessions(metadataFiltered);
                
                // Also try content search in background for potentially more results
                setTimeout(() => {
                    if (currentSearchQuery === query) {
                        enhanceWithContentSearch(query, metadataFiltered);
                    }
                }, 100);
            } else {
                // No metadata matches, try content search
                await searchSessionContent(query);
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
                        const resp = await fetch(`/api/session/${session.session_id}`);
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
            if (!window.sessionsData || !query || currentSearchQuery !== query) return;
            
            const resultsDiv = document.getElementById('sessions-results');
            const matchingSessions = [];
            
            // Limit search for performance
            const sessionsToSearch = window.sessionsData.slice(0, Math.min(window.sessionsData.length, 8));
            
            for (const session of sessionsToSearch) {
                try {
                    const resp = await fetch(`/api/session/${session.session_id}`);
                    if (!resp.ok) continue;
                    
                    const data = await resp.json();
                    if (!data.messages || !Array.isArray(data.messages)) continue;
                    
                    const hasMatch = data.messages.some(msg => {
                        const content = (msg.content || '').toLowerCase();
                        return content.includes(query);
                    });
                    
                    if (hasMatch) {
                        matchingSessions.push(session);
                    }
                } catch (e) {
                    console.warn('Error searching session content:', session.session_id, e);
                }
                
                // Check if query changed during search
                if (currentSearchQuery !== query) return;
            }
            
            // Only update if still current query
            if (currentSearchQuery === query) {
                if (matchingSessions.length > 0) {
                    renderSessions(matchingSessions);
                } else {
                    resultsDiv.innerHTML = '<div class="sessions-empty">No sessions found containing: "' + query + '"</div>';
                }
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

            // Load session history
            try {
                const resp = await fetch(`/api/session/${sessionId}`);
                const data = await resp.json();

                // Clear chat and load history
                chat.innerHTML = '';
                if (data.messages && data.messages.length > 0) {
                    for (const m of data.messages) {
                        addMsg(m.role === 'user' ? 'user' : 'ai', m.content, true);
                    }
                }

                // Update session ID and reconnect
                RHODES_ID = sessionId;
                localStorage.setItem('rhodes_session_id', sessionId);
                document.getElementById('session-id').textContent = sessionId;

                // Reconnect websocket with new session
                if (ws) ws.close();
                wantsNewRhodes = false;
                connect();

                showToast('Loaded session');
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

        // Share a Q&A pair - stores on server and copies link
        window.shareQA = async function(qaId) {
            const msgEl = document.querySelector(`[data-qa-id="${qaId}"]`);
            if (!msgEl) return;

            const question = msgEl.dataset.question;
            const answer = msgEl.dataset.answer;

            try {
                // Send to server to store
                const response = await fetch('/api/share-qa', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question, answer })
                });

                if (response.ok) {
                    const data = await response.json();
                    const shareUrl = window.location.origin + '/qa/' + data.id;
                    await navigator.clipboard.writeText(shareUrl);
                    showToast('Share link copied!');
                } else {
                    // Fallback: encode in URL
                    const encoded = btoa(JSON.stringify({ q: question, a: answer }));
                    const shareUrl = window.location.origin + '?qa=' + encoded;
                    await navigator.clipboard.writeText(shareUrl);
                    showToast('Share link copied (local)');
                }
            } catch (e) {
                // Fallback: encode in URL
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

        // Guest connect
        const guestConnectBtn = document.getElementById('guest-connect-btn');
        if (guestConnectBtn) {
            guestConnectBtn.onclick = () => {
                console.log('Guest connect clicked');
                TOKEN = '';
                USER_TOKEN = '';
                localStorage.removeItem('rhodes_server');
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
        if (localStorage.getItem('rhodes-theme') === 'light') {
            document.body.classList.add('light-mode');
            themeToggle.textContent = '🌙';
        }
        themeToggle.onclick = (e) => {
            e.preventDefault();
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            themeToggle.textContent = isLight ? '🌙' : '☀️';
            localStorage.setItem('rhodes-theme', isLight ? 'light' : 'dark');
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

        let lastUserMessage = '';  // Track for Q&A sharing

        // Outbound queue: if WS is not ready, queue messages and flush after auth.
        let wsReadyForMessages = false;
        const outboundQueue = [];
        function queueOutboundMessage(messageObj) {
            outboundQueue.push(messageObj);
        }
        function flushOutboundQueue() {
            if (!ws || ws.readyState !== WebSocket.OPEN || !wsReadyForMessages) return;
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
            const hasUsedVoice = localStorage.getItem('hasUsedVoice');
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
                shareBtn = `<button class="qa-share-btn" onclick="shareQA('${qaId}')" title="Share this Q&A">SHARE</button>`;
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
                downloadsPanel.style.display = 'block';
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
            if (sharedQA) return;
            
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

             // Show auth modal if no credentials AND first time (let guest try)
            const hasUserToken = USER_TOKEN && (USER_TOKEN || "").length > 10;
            const hasToken = TOKEN && (TOKEN || "").length > 10;
            console.log('Token check - USER_TOKEN:', USER_TOKEN, 'length:', (USER_TOKEN || "").length, 'hasUserToken:', hasUserToken);
            console.log('Token check - TOKEN:', TOKEN ? 'present' : 'empty', 'length:', (TOKEN || "").length, 'hasToken:', hasToken);

            // Auto-connect as guest or with saved credentials
            authModal.style.display = 'none';
            setStatus(false, 'CONNECTING');

            try {
                ws = new WebSocket(SERVER);
                console.log('WebSocket created successfully for:', SERVER);
                console.log('WebSocket readyState after creation:', ws.readyState);
                // Debug: log readyState after 2 seconds to see if it changes
                setTimeout(() => {
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
                connectionInProgress = false;
                console.log('WebSocket connection timeout - onopen not called within 5s');
                if (ws && ws.readyState !== WebSocket.OPEN) {
                    console.log('WebSocket state:', ws.readyState, 'forcing auth modal');
                    setStatus(false, 'CONNECTION TIMEOUT');
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
                clearTimeout(connectionTimeout);
                connectionInProgress = false;
                // Hide debug button on successful connection
                const debugBtn = document.getElementById('debug-btn');
                if (debugBtn) debugBtn.style.display = 'none';
                console.log('WebSocket opened, sending auth request');
                // Get saved session ID for auto-resume
                const savedSessionId = localStorage.getItem('rhodes_session_id') || '';

                ws.send(JSON.stringify({
                    msg_type: 'auth_request',
                    msg_id: generateUUID(),
                    timestamp: new Date().toISOString(),
                    payload: {
                        client_id: CLIENT_ID,
                        tab_id: TAB_ID,
                        token: hasToken ? TOKEN : '',
                        user_token: hasUserToken ? USER_TOKEN : '',
                        resume_session: (hasUserToken && !wantsNewRhodes) ? savedSessionId : '',  // Auto-resume for logged-in users (unless new session requested)
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

                        // Clear chat if new session requested
                        if (wantsNewRhodes) {
                            chat.innerHTML = '';
                        }

                        // Save rhodes_id for logged-in users (auto-resume on next visit)
                        // Don't save if this is a temporary new session
                        if (RHODES_ID && !IS_GUEST && !wantsNewRhodes) {
                            localStorage.setItem('rhodes_session_id', RHODES_ID);
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
                            addMsg('ai', `Welcome! You have ${GUEST_MESSAGES_REMAINING} free message${GUEST_MESSAGES_REMAINING === 1 ? '' : 's'}. <a href="#" onclick="showAuthTab('register');return false;" style="color:var(--green);text-decoration:underline;">Create an account</a> or <a href="#" onclick="showAuthTab('login');return false;" style="color:var(--cyan);text-decoration:underline;">login</a> to continue for longer.`);
                        } else {
                            const username = msg.payload.user?.username || '';
                            CURRENT_USERNAME = username.toLowerCase();
                            setStatus(true, username ? `CONNECTED (${username})${instanceLabel}` : `CONNECTED${instanceLabel}`);
                            addMsg('ai', wantsNewRhodes ? 'New Rhodes instance created. Ready for input.' : 'Secure connection established. Ready for input.');
                        }

                        // Handle resume if requested
                        if (resumeSessionId && ws) {
                            ws.send(JSON.stringify({
                                msg_type: 'session_resume_request',
                                msg_id: generateUUID(),
                                timestamp: new Date().toISOString(),
                                payload: { rhodes_id: resumeSessionId }
                            }));
                        }

                        wsReadyForMessages = true;
                        flushOutboundQueue();
                        localStorage.setItem('rhodes_server', SERVER);
                    } else {
                        // Check for rate limit error
                        if (msg.payload.error === 'rate_limit') {
                            setStatus(false, 'SESSION LIMIT');
                            showToast(msg.payload.message || 'Session limit reached (5/hour)');
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
                } else if (msg.msg_type === 'ai_message_chunk') {
                    // Streaming chunk - append to current message
                    const chunk = msg.payload.content || '';
                    if (chunk) {
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
                    hideLoading();
                    // Clear any streaming state
                    if (window.streamingMsgEl) {
                        window.streamingMsgEl.remove();  // Remove the tool-only element
                        window.streamingMsgEl = null;
                        window.streamingContent = '';
                    }
                    // ALWAYS display content as a fresh message
                    if (msg.payload.content && msg.payload.content.trim()) {
                        addMsg('ai', msg.payload.content);
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
                        localStorage.setItem('rhodes_user_token', USER_TOKEN);
                        IS_GUEST = false;
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
                        localStorage.setItem('rhodes_user_token', USER_TOKEN);
                        IS_GUEST = false;
                        authModal.style.display = 'none';
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
                } else if (msg.msg_type === 'google_login_response') {
                    const errorEl = document.getElementById('login-error');
                    if (msg.payload.success) {
                        USER_TOKEN = msg.payload.token;
                        localStorage.setItem('rhodes_user_token', USER_TOKEN);
                        IS_GUEST = false;
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
                        // Load conversation history into chat
                        const conversation = msg.payload.conversation || [];
                        for (const m of conversation) {
                            // Mask passwords in user messages when replaying history
                            const content = m.role === 'user' ? maskPasswords(m.content) : m.content;
                            addMsg(m.role === 'user' ? 'user' : 'ai', content);
                        }
                        addMsg('ai', `Session ${msg.payload.rhodes_id} resumed. ${msg.payload.message_count} messages loaded.`);
                    } else {
                        addMsg('ai', `Failed to resume session: ${msg.payload.error}`);
                    }
                } else if (msg.msg_type === 'session_list_response') {
                    // Display session list in chat
                    if (msg.payload.success && msg.payload.sessions) {
                        let listHtml = '<strong>Your Sessions:</strong><br>';
                        for (const s of msg.payload.sessions.slice(0, 10)) {
                            const date = new Date(s.created_at).toLocaleDateString();
                            const preview = s.last_message ? s.last_message.substring(0, 50) + '...' : 'No messages';
                            listHtml += `<a href="?resume=${s.rhodes_id}" style="color:var(--cyan)">${s.rhodes_id}</a> (${date}) - ${preview}<br>`;
                        }
                        addMsg('ai', listHtml);
                    }
                } else if (msg.msg_type === 'local_file_request') {
                    // Handle local file operations via browser extension
                    handleLocalFileRequest(msg);
                } else if (msg.msg_type === 'tool_call') {
                    const tool = msg.payload;
                    const toolName = tool.name || 'unknown';
                    const toolArgs = tool.arguments || {};
                    const isPrivileged = !IS_GUEST && USER_TOKEN;
                    const round = tool.round || 0;

                    if (toolName.includes('think') && !isPrivileged) return;

                    const status = tool.status || 'complete';
                    
                    // Only display completed tools (skip 'starting' status)
                    if (status !== 'complete') return;
                    
                    // Message and respond tools should display as normal messages, not tool calls
                    if (toolName === 'message' || toolName === 'respond') {
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
                            addMsg('ai', messageText);
                        }
                        return;
                    }

                    let msgEl = window.streamingMsgEl;
                    if (!msgEl) {
                        msgEl = document.createElement('div');
                        msgEl.className = 'msg ai';
                        document.getElementById('chat').appendChild(msgEl);
                        window.streamingMsgEl = msgEl;
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
                    toolDiv.innerHTML = headerHtml + '<div class="tool-call-preview">' + escapeHtml(preview) + '</div><div class="tool-call-details">' + detailsContent + '</div>';

                    const cursor = msgEl.querySelector('.streaming-cursor');
                    if (cursor) {
                        msgEl.insertBefore(toolDiv, cursor);
                    } else {
                        msgEl.appendChild(toolDiv);
                    }
                    document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
                }

            };

            ws.onclose = (event) => {
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
                    console.log('[WS] Giving up after ' + attempt + ' attempts (auth never succeeded)');
                    showToast('Connection failed. Refresh the page or try again in a moment.');
                    return;
                }
                const delay = Math.min(1500 * Math.pow(1.7, attempt - 1), 30000);
                console.log('[WS] Reconnecting in ' + delay + 'ms (attempt ' + attempt + ')');
                setTimeout(connect, delay);
            };
            ws.onerror = (error) => {
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
                    console.log('[WS] Giving up after ' + attempt + ' attempts (auth never succeeded)');
                    showToast('Connection failed. Refresh the page or try again in a moment.');
                    return;
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
                showToast('Could not access webcam: ' + err.message);
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

        // Drag and drop handler
        const chatEl = document.getElementById('chat');
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
        function send() {
            console.log('send function called');
            let text = input.value.trim();
            if (!text && pendingImages.length === 0) return;

            // Parse model prefix: --Alpha, --Beta, --Ada
            let requestModel = null;  // null = use server default
            let modelName = null;     // Display name (not the actual model)
            if (text.startsWith('--Alpha ')) {
                requestModel = 'opus';
                modelName = 'ALPHA';
                text = text.slice(8).trim();
            } else if (text.startsWith('--Beta ')) {
                requestModel = 'sonnet';
                modelName = 'BETA';
                text = text.slice(7).trim();
            } else if (text.startsWith('--Ada ')) {
                requestModel = 'haiku';
                modelName = 'ADA';
                text = text.slice(6).trim();
            }

            // Show user message with image indicators (mask passwords for display)
            // Only show model indicator to admin (sebastian)
            const isAdmin = CURRENT_USERNAME && CURRENT_USERNAME.includes('sebastian');
            const modelIndicator = (modelName && isAdmin) ? ` [${modelName}]` : '';
            const fileIndicator = pendingImages.length > 0 ? ` [${pendingImages.length} file${pendingImages.length > 1 ? 's' : ''} attached]` : '';
            addMsg('user', maskPasswords(text) + modelIndicator + fileIndicator);
            input.value = '';

            const messageObj = {
                msg_type: 'user_message',
                msg_id: generateUUID(),
                timestamp: new Date().toISOString(),
                payload: {
                    content: text,
                    model: requestModel,  // Override model for this message
                    attachments: pendingImages.map(img => ({
                        type: 'image',
                        media_type: img.media_type,
                        data: img.data
                    })),
                    audio_output: !!(globalThis.VoiceChat && globalThis.VoiceChat.voiceEnabled),
                    stream: true  // Enable streaming responses
                }
            };

            // Clear images after send/queue
            pendingImages = [];
            updateImagePreview();

            if (!ws || ws.readyState !== WebSocket.OPEN || !wsReadyForMessages) {
                queueOutboundMessage(messageObj);
                showToast('Disconnected — queued message and reconnecting…');
                connect();
                showLoading();
                clearToolCalls();
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
            loadingEl = document.createElement('div');
            loadingEl.className = 'loading-msg';
            loadingEl.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <div class="loading-dots">
                        <span></span><span></span><span></span>
                    </div>
                    <span class="loading-text" id="loading-text">Processing...</span>
                </div>
            `;
            chat.appendChild(loadingEl);
            chat.scrollTop = chat.scrollHeight;

            // Cycle through loading texts
            let textIdx = 0;
            loadingInterval = setInterval(() => {
                textIdx = (textIdx + 1) % loadingTexts.length;
                const textEl = document.getElementById('loading-text');
                if (textEl) textEl.textContent = loadingTexts[textIdx] + '...';
            }, 2000);
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
                        voiceBar.style.display = 'none';
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
                        .replace(/\btudor\s*mayonnaise\b/gi, 'tutor me on it')
                        .replace(/\btutor\s*mayonnaise\b/gi, 'tutor me on it')
                        .replace(/\btutor\s*me\s*on\s*is\b/gi, 'tutor me on it')
                        .replace(/\broads\s*a\s*g\s*i\b/gi, 'Rhodes AGI')
                        .replace(/\broads\s*agi\b/gi, 'Rhodes AGI')
                        .replace(/\broads\s*AI\b/gi, 'Rhodes AGI');
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
                        const delay = endsWithPause ? 4000 : 2000;  // 4s if thinking, 2s otherwise

                        // Set new timer - submit after pause
                        this.submitTimeout = setTimeout(async () => {
                            const finalText = fullTranscript.trim();
                            // Check if text is just filler - if so, extend listening
                            const isFillerOnly = /^(uh+m*|um+|er+m*|ah+|hmm+|the|a|an|i|is|it|so|and|but|like|well|you know)$/i.test(finalText);
                            if (isFillerOnly) {
                                // Filler only = user still thinking, extend listening
                                console.log('Filler detected, extending listening');
                                return;  // Don't submit, keep listening
                            }

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
                                                console.log('Haiku says thought incomplete, extending listening');
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
                    modeBtn.innerHTML = this.pushToTalk ? '🖐️ TAP TO TALK HANDS-FREE' : '🎙️ HANDS-FREE';
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
                if (!this.recognition) {
                    console.error('No recognition object!');
                    return;
                }
                // Track voice usage for profile image feature
                if (!localStorage.getItem('hasUsedVoice')) {
                    localStorage.setItem('hasUsedVoice', 'true');
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
                if (!this.recognition) return;
                try {
                    this.recognition.stop();
                } catch (e) {}
                this.isRecording = false;
                document.getElementById('voice-record-btn').classList.remove('recording');
                document.getElementById('voice-indicator').classList.remove('active');
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
                            if (!self.pushToTalk && !self.isRecording) {
                                self.startRecording();
                            }
                        };

                        // Safety timeout - stop animation after 2 minutes max (in case onended doesn't fire)
                        self.ttsSafetyTimeout = setTimeout(() => {
                            if (self.ttsPlaying) {
                                console.warn('TTS safety timeout - forcing animation stop');
                                cleanupAudio('timeout');
                            }
                        }, 120000);

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
