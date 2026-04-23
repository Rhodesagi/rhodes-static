// Extracted from rhodes.js: session dropdown/search/share subsystem

window.installRhodesSessionUi = function installRhodesSessionUi(deps) {
    if (!deps || window.__rhodesSessionUiInstalled) return;
    window.__rhodesSessionUiInstalled = true;

    const rhodesStorage = deps.rhodesStorage;
    const generateUUID = deps.generateUUID;
    const showToast = deps.showToast;
    const connect = deps.connect;
    const getWs = deps.getWs;
    const isWsReady = deps.isWsReady;
    const isGuest = deps.isGuest;
    const getCurrentUsername = deps.getCurrentUsername;
    const getRhodesId = deps.getRhodesId;
    const setRhodesId = deps.setRhodesId;
    const setWantsNewRhodes = deps.setWantsNewRhodes;

    function escHtml(s) {
        return escapeHtml(String(s ?? ''));
    }

    function withSessionNote(label, note) {
        const cleanNote = String(note ?? '').trim().toLowerCase();
        return cleanNote ? (label + ' (' + cleanNote + ')') : label;
    }

    async function requestSessionListViaWS() {
        const ws = getWs();
        if (!ws || ws.readyState !== WebSocket.OPEN || !isWsReady()) {
            throw new Error('Disconnected');
        }
        if (isGuest() || !getCurrentUsername()) {
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
                    try {
                        rej && rej(new Error('Session list timed out'));
                    } catch {}
                }
            }, 6000);
        });

        return window._pendingSessionListPromise;
    }

    function renderSessions(sessions) {
        const resultsDiv = document.getElementById('sessions-results');
        if (!sessions || sessions.length === 0) {
            resultsDiv.innerHTML = '<div class="sessions-empty">No sessions found</div>';
            return;
        }

        const activeSessionId = getRhodesId();

        // Separate split sessions from normal sessions
        const splitGroups = {};
        const splitFallbackGroups = {};
        const splitFallbackKeyClaimedByPrimary = {};
        const normalSessions = [];
        sessions.forEach(s => {
            const isSplit = (s.session_id && s.session_id.includes('split-')) || s.is_split;
            if (isSplit) {
                const splitGroupId = String(s.split_group_id || '').trim();
                const created = (s.created_at || s.updated_at || '').substring(0, 16);
                const userPrefix = s.session_id.replace(/-p\d+$/, '').replace(/split-\d+-.*/, 'split').replace(/_[a-f0-9]{8}$/, '');
                const fallbackKey = userPrefix + '_' + created;
                const groupKey = splitGroupId ? ('group_' + splitGroupId) : fallbackKey;
                s.__splitFallbackKey = fallbackKey;
                if (!splitGroups[groupKey]) splitGroups[groupKey] = [];
                splitGroups[groupKey].push(s);
                if (!splitFallbackGroups[fallbackKey]) splitFallbackGroups[fallbackKey] = [];
                splitFallbackGroups[fallbackKey].push(s);
                if (splitGroupId) splitFallbackKeyClaimedByPrimary[fallbackKey] = true;
            } else {
                normalSessions.push(s);
            }
        });

        function getSplitMessageCount(s) {
            const persisted = Number(s && s.persisted_message_count);
            if (Number.isFinite(persisted) && persisted >= 0) return persisted;
            const raw = Number(s && (s.message_count ?? s.rounds ?? 0));
            return Number.isFinite(raw) ? raw : 0;
        }

        function getRenderSplitGroup(key) {
            const group = splitGroups[key] || [];
            if (!group.length) return group;
            const first = group[0];
            const fallbackKey = first.__splitFallbackKey;
            if (String(first.split_group_id || '').trim() && splitFallbackGroups[fallbackKey]) {
                return splitFallbackGroups[fallbackKey];
            }
            return group;
        }

        function buildBestSplitPaneMap(group) {
            const paneBest = {};
            (group || []).forEach(function(gs) {
                const m = gs.session_id && (gs.session_id.match(/-p(\d+)$/) || gs.session_id.match(/split-(\d+)/));
                if (!m) return;
                const paneNum = parseInt(m[1], 10);
                const prev = paneBest[paneNum];
                if (!prev) {
                    paneBest[paneNum] = gs;
                    return;
                }
                const prevCount = getSplitMessageCount(prev);
                const currCount = getSplitMessageCount(gs);
                const prevTs = Date.parse(prev.updated_at || prev.created_at || '') || 0;
                const currTs = Date.parse(gs.updated_at || gs.created_at || '') || 0;
                if (currCount > prevCount || (currCount === prevCount && currTs > prevTs)) {
                    paneBest[paneNum] = gs;
                }
            });
            return paneBest;
        }

        function renderItem(s) {
            const isActive = s.session_id === activeSessionId;
            const ts = s.updated_at || s.created_at || '';
            const dt = ts ? new Date(ts) : null;
            const date = dt && !isNaN(dt.getTime()) ? dt.toLocaleDateString() : '';
            const time = dt && !isNaN(dt.getTime()) ? dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const title = withSessionNote((s.title || '').trim() || s.session_id || 'Session', s.session_note);
            const count = (s.message_count ?? s.rounds ?? 0);
            const model = (s.model || '').trim();
            return '<div class="session-item' + (isActive ? ' active' : '') + '" onclick="loadSession(\'' + s.session_id + '\', event)">' +
                '<div class="session-preview">' + escHtml(title) + '</div>' +
                '<div class="session-meta">' + escHtml((date && time) ? (date + ' ' + time) : (date || time)) + (model ? (' \u2022 ' + escHtml(model)) : '') + ' \u2022 ' + escHtml(String(count)) + ' messages</div>' +
                '</div>';
        }

        let html = '';
        const groupKeys = Object.keys(splitGroups).sort().reverse().filter(key => {
            const group = splitGroups[key] || [];
            if (!group.length) return false;
            const first = group[0];
            if (!String(first.split_group_id || '').trim() && splitFallbackKeyClaimedByPrimary[first.__splitFallbackKey]) {
                return false;
            }
            return Object.values(buildBestSplitPaneMap(getRenderSplitGroup(key))).some(s => getSplitMessageCount(s) > 0);
        });

        // Split sessions section (highlighted, at top)
        if (groupKeys.length > 0) {
            html += '<div class="split-sessions-section">';
            html += '<div class="split-sessions-header" onclick="var el=document.getElementById(\'split-sessions-body\');el.style.display=el.style.display===\'none\'?\'block\':\'none\';this.querySelector(\'.sg-arrow\').textContent=el.style.display===\'none\'?\'\u25b6\':\'\u25bc\'">';
            html += '<span class="sg-arrow">\u25bc</span> Split Mode Sessions (' + groupKeys.length + ')';
            html += '</div>';
            html += '<div id="split-sessions-body">';

            groupKeys.forEach((key, idx) => {
                const group = getRenderSplitGroup(key);
                const paneBest = buildBestSplitPaneMap(group);
                const detailSessions = Object.keys(paneBest).map(Number).sort((a, b) => a - b).map(pn => paneBest[pn]);
                const first = group[0];
                const ts = first.created_at || '';
                const dt = ts ? new Date(ts) : null;
                const date = dt && !isNaN(dt.getTime()) ? dt.toLocaleDateString() : '';
                const time = dt && !isNaN(dt.getTime()) ? dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                const totalMsgs = detailSessions.reduce((sum, s) => sum + getSplitMessageCount(s), 0);
                const gid = 'split-group-' + idx;

                var resumeData = {};
                Object.keys(paneBest).forEach(function(pn) {
                    resumeData[pn] = paneBest[pn].session_id;
                });
                var paneNums = Object.keys(resumeData).map(Number).filter(function(n) { return Number.isFinite(n) && n > 0 && n <= 6; });
                var resumePaneCount = paneNums.length ? Math.max.apply(null, paneNums) : Math.min(group.length, 4);
                resumePaneCount = Math.max(2, Math.min(6, resumePaneCount));
                var resumeJson = JSON.stringify(resumeData).replace(/'/g, "\\'");

                html += '<div class="split-group-item">';
                html += '<div class="split-group-row">';
                html += "<div class=\"split-group-info\" onclick=\"event.stopPropagation();window._multisandboxMode=true;var _rd=" + resumeJson + ";window.enterSplitMode(" + resumePaneCount + ",_rd)\">";
                html += '<span style="font-size:11px;font-weight:bold;color:var(--cyan);">' + resumePaneCount + '-pane split</span>';
                html += '<span style="font-size:10px;color:var(--dim);margin-left:8px;">' + escHtml((date && time) ? (date + ' ' + time) : (date || time)) + '</span>';
                html += '<span style="font-size:10px;color:var(--dim);margin-left:6px;">' + totalMsgs + ' msgs</span>';
                html += '</div>';
                html += "<button class=\"split-resume-btn\" onclick=\"event.stopPropagation();window._multisandboxMode=true;var _rd=" + resumeJson + ";window.enterSplitMode(" + resumePaneCount + ",_rd)\">▶ Resume</button>";
                html += '</div>';
                html += '<div id="' + gid + '" style="display:none;padding:4px 0 4px 12px;">';
                detailSessions.forEach(function(s) {
                    var title = withSessionNote((s.title || '').trim() || s.session_id || 'Session', s.session_note);
                    var count = getSplitMessageCount(s);
                    var paneMatch = s.session_id.match(/-p(\d+)$/) || s.session_id.match(/split-(\d+)/);
                    var paneLabel = paneMatch ? 'Pane ' + paneMatch[1] : '';
                    html += '<div class="session-item" style="cursor:pointer;" onclick="loadSession(\'' + s.session_id + '\', event)">';
                    html += '<div class="session-preview">' + (paneLabel ? '<span style="color:var(--cyan);font-size:10px;margin-right:6px;">' + paneLabel + '</span>' : '') + escHtml(title) + '</div>';
                    html += '<div class="session-meta">' + count + ' messages</div>';
                    html += '</div>';
                });
                html += '</div>';
                html += '</div>';
            });

            html += '</div></div>';
        }

        // Normal sessions
        normalSessions.forEach(s => { html += renderItem(s); });

        resultsDiv.innerHTML = html;
    }

    async function toggleSessionDropdown(event) {
        if (event) event.stopPropagation();
        const dropdown = document.getElementById('sessions-list');
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            return;
        }

        if (!getCurrentUsername()) {
            document.getElementById('sessions-results').innerHTML = '<div class="sessions-empty">Login to see sessions</div>';
            dropdown.classList.add('show');
            return;
        }

        document.getElementById('sessions-results').innerHTML = '<div class="sessions-empty">Loading...</div>';
        const searchInput = document.getElementById('session-search-input');
        if (searchInput) searchInput.value = '';
        dropdown.classList.add('show');

        try {
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
    }

    let currentSearchQuery = '';

    async function filterSessions() {
        if (!window.sessionsData) return;

        const searchInput = document.getElementById('session-search-input');
        const query = searchInput.value.toLowerCase().trim();
        currentSearchQuery = query;

        if (!query) {
            renderSessions(window.sessionsData);
            return;
        }

        const resultsDiv = document.getElementById('sessions-results');
        resultsDiv.innerHTML = '<div class="sessions-empty">Searching all content...</div>';

        const metaHits = (window.sessionsData || []).filter((s) => {
            const sid = String(s.session_id || '').toLowerCase();
            const title = String(s.title || '').toLowerCase();
            const model = String(s.model || '').toLowerCase();
            return sid.includes(query) || title.includes(query) || model.includes(query);
        });

        try {
            const token = rhodesStorage.getItem('rhodes_user_token');
            const headers = token ? { Authorization: 'Bearer ' + token } : {};
            const resp = await fetch('/api/search?q=' + encodeURIComponent(query), { headers });

            if (currentSearchQuery !== query) return;

            if (resp.ok) {
                const data = await resp.json();
                const ftsResults = Array.isArray(data.results) ? data.results : [];
                const loadedById = {};
                (window.sessionsData || []).forEach(s => { loadedById[s.session_id] = s; });

                // Deduplicate FTS rows by session_id (keep first = highest score).
                const ftsBySession = {};
                ftsResults.forEach(r => {
                    if (r && r.session_id && !ftsBySession[r.session_id]) {
                        ftsBySession[r.session_id] = r;
                    }
                });

                // Start with metadata-substring hits (already full session objects).
                const resultMap = {};
                metaHits.forEach(s => { resultMap[s.session_id] = s; });

                // For each FTS hit, reuse the loaded session object if we have it,
                // otherwise synthesize one from the FTS payload so matches in
                // un-loaded (older) sessions still surface.
                Object.keys(ftsBySession).forEach(sid => {
                    const r = ftsBySession[sid];
                    let s = loadedById[sid];
                    if (!s) {
                        s = {
                            session_id: sid,
                            title: r.title || sid,
                            model: r.model || '',
                            message_count: (r.message_count != null ? r.message_count : 0),
                            created_at: r.session_created_at || r.created_at || '',
                            updated_at: r.updated_at || r.created_at || '',
                            metadata: r.metadata || null,
                            _fromFts: true,
                        };
                    }
                    s._searchSnippet = r.snippet || s._searchSnippet;
                    resultMap[sid] = s;
                });

                const combinedResults = Object.values(resultMap);

                // Sort by updated_at desc so older matching sessions interleave
                // with recent metadata hits in a sensible order.
                combinedResults.sort((a, b) => {
                    const aTs = Date.parse(a.updated_at || a.created_at || '') || 0;
                    const bTs = Date.parse(b.updated_at || b.created_at || '') || 0;
                    return bTs - aTs;
                });

                if (combinedResults.length > 0) {
                    renderSessions(combinedResults);
                } else {
                    resultsDiv.innerHTML = '<div class="sessions-empty">No sessions found</div>';
                }
            } else if (metaHits.length > 0) {
                renderSessions(metaHits);
            } else {
                resultsDiv.innerHTML = '<div class="sessions-empty">No sessions found</div>';
            }
        } catch (e) {
            console.warn('FTS search failed:', e);
            if (metaHits.length > 0) {
                renderSessions(metaHits);
            } else {
                resultsDiv.innerHTML = '<div class="sessions-empty">No sessions found</div>';
            }
        }
    }

    async function enhanceWithContentSearch(query, existingResults) {
        if (!window.sessionsData || !query) return;

        try {
            const existingIds = new Set(existingResults.map(s => s.session_id));
            const sessionsToSearch = window.sessionsData
                .filter(s => !existingIds.has(s.session_id))
                .slice(0, 5);

            const contentMatches = [];

            for (const session of sessionsToSearch) {
                try {
                    const resp = await fetch('/api/session/' + session.session_id + '?username=' + encodeURIComponent(getCurrentUsername()));
                    if (!resp.ok) continue;

                    const data = await resp.json();
                    if (!data.messages || !Array.isArray(data.messages)) continue;

                    const hasMatch = data.messages.some(msg => {
                        const content = (msg.content || '').toLowerCase();
                        return content.includes(query);
                    });

                    if (hasMatch) contentMatches.push(session);
                } catch (e) {
                    console.warn('Error searching session content:', session.session_id, e);
                }
            }

            if (contentMatches.length > 0) {
                const allResults = [...existingResults, ...contentMatches];
                renderSessions(allResults);
            }
        } catch (e) {
            console.warn('Error in enhanceWithContentSearch:', e);
        }
    }

    async function searchSessionContent(query) {
        if (!query || currentSearchQuery !== query) return;

        const resultsDiv = document.getElementById('sessions-results');

        try {
            const token = rhodesStorage.getItem('rhodes_user_token');
            const headers = token ? { Authorization: 'Bearer ' + token } : {};
            const resp = await fetch('/api/search?q=' + encodeURIComponent(query), { headers });
            if (!resp.ok) {
                console.warn('Search API error:', resp.status);
                resultsDiv.innerHTML = '<div class="sessions-empty">Search unavailable</div>';
                return;
            }

            const data = await resp.json();
            if (currentSearchQuery !== query) return;

            if (data.error) {
                console.warn('Search error:', data.error);
                resultsDiv.innerHTML = '<div class="sessions-empty">Search error</div>';
                return;
            }

            if (data.results && data.results.length > 0) {
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
    }

    function toggleSessionSearch(event) {
        if (event) event.stopPropagation();
        const dropdown = document.getElementById('sessions-list');

        if (!dropdown.classList.contains('show')) {
            toggleSessionDropdown(event);
            setTimeout(() => {
                const searchInput = document.getElementById('session-search-input');
                if (searchInput) searchInput.focus();
            }, 100);
        } else {
            const searchInput = document.getElementById('session-search-input');
            if (searchInput) searchInput.focus();
        }
    }

    async function loadSession(sessionId, event) {
        if (event) event.stopPropagation();
        document.getElementById('sessions-list').classList.remove('show');
        if (sessionId === getRhodesId()) return;

        try {
            const ws = getWs();
            if (!ws || ws.readyState !== WebSocket.OPEN || !isWsReady()) {
                showToast('Disconnected - reconnecting...');
                setWantsNewRhodes(false);
                setRhodesId(sessionId);
                if (window.rhodesSessionState && window.rhodesSessionState.setResumeSessionIdForCurrentIdentity) {
                    window.rhodesSessionState.setResumeSessionIdForCurrentIdentity(sessionId);
                } else {
                    rhodesStorage.setItem('rhodes_session_id', sessionId);
                }
                if (ws) ws.close();
                connect();
                return;
            }

            window.__pendingSessionSwitch = sessionId;
            document.getElementById('sessions-results').innerHTML = '<div class="sessions-empty">Loading session...</div>';
            ws.send(JSON.stringify({
                msg_type: 'session_resume_request',
                msg_id: generateUUID(),
                timestamp: new Date().toISOString(),
                payload: { session_id: sessionId }
            }));
            showToast('Switching sessions...');
        } catch (e) {
            showToast('Error loading session');
        }
    }

    function getShareLink() {
        const sessionId = getRhodesId();
        if (!sessionId) return;
        const isV2 = (window.location.pathname === '/v2' || window.location.pathname.startsWith('/v2/'));
        const basePath = isV2 ? '/v2/' : '/';
        const shareUrl = window.location.origin + basePath + '?resume=' + sessionId;
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('Share link copied!');
        }).catch(() => {
            prompt('Share link:', shareUrl);
        });
    }

    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('sessions-list');
        const btn = document.getElementById('sessions-btn');
        const searchBtn = document.getElementById('search-sessions-btn');
        if (dropdown && !dropdown.contains(e.target) && e.target !== btn && e.target !== searchBtn) {
            dropdown.classList.remove('show');
        }
    });

    window.renderSessions = renderSessions;
    window.toggleSessionDropdown = toggleSessionDropdown;
    window.filterSessions = filterSessions;
    window.debouncedSearch = (() => {
        let timeout;
        return () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => filterSessions(), 300);
        };
    })();
    window.enhanceWithContentSearch = enhanceWithContentSearch;
    window.searchSessionContent = searchSessionContent;
    window.toggleSessionSearch = toggleSessionSearch;
    window.loadSession = loadSession;
    window.getShareLink = getShareLink;
};
