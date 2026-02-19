/* RHODES v2 module: rhodes.part3.ui-core.js */
/* Source: contiguous slice of rhodes.monolith.js */

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
                    // Admin error detail popup
                    if (msg.payload.error_detail && window.RHODES_CONFIG && window.RHODES_CONFIG.isAdmin) {
                        const errPopup = document.createElement('div');
                        errPopup.textContent = msg.payload.error_detail;
                        errPopup.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#cc0000;color:#fff;padding:12px 24px;border-radius:6px;z-index:10001;font-size:13px;font-family:monospace;max-width:80vw;word-break:break-all;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.4);';
                        errPopup.title = 'Click to dismiss';
                        errPopup.onclick = () => errPopup.remove();
                        document.body.appendChild(errPopup);
                        setTimeout(() => { if (errPopup.parentNode) errPopup.remove(); }, 15000);
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
                        const siteMatch = resultStr.match(/https?:\/\/rhodesagi\.com\/user-sites\/[^\s"']+/);
                        if (siteMatch) {
                            const su = siteMatch[0];
                            const sn = su.replace(/https?:\/\/rhodesagi\.com\/user-sites\//, '');
                            resultEmbeds += '<div style="margin:4px 0;border:1px solid var(--cyan);border-radius:4px;overflow:hidden;"><div style="padding:4px 8px;background:rgba(0,191,255,0.08);display:flex;justify-content:space-between;align-items:center;"><a href="' + su + '" target="_blank" style="color:var(--cyan);font-size:11px;">' + sn + '</a><button onclick="var ifr=this.closest(\'div\').parentElement.querySelector(\'iframe\');ifr.style.display=ifr.style.display===\'none\'?\'block\':\'none\'" style="background:none;border:1px solid var(--cyan);color:var(--cyan);padding:2px 8px;cursor:pointer;font-size:10px;border-radius:3px;">Preview</button></div><iframe src="' + su + '" style="width:100%;height:250px;border:none;background:#fff;display:none;" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe></div>';
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

