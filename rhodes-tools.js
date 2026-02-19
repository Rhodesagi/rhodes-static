// Extracted from rhodes.js: tool UI/timing subsystem
        // Tool call display: keep a persistent per-turn log so tool calls don't vanish when streaming finalizes.
        window.toolLogEl = null;
        window._toolItems = new Map();
        window._toolTimers = new Map();
        // Server restart continuation tracking
        window._pendingGeneration = null;  // Set when waiting for AI response
        window._needsContinuation = false; // Set when disconnect happened during generation
 // toolKey -> {el, lastStatus}

        // Session-level tool totals tracking
        window._toolTotals = {
            count: 0,           // Total number of tool calls
            elapsedMs: 0,       // Total elapsed time in milliseconds
            activeTools: new Set(), // Currently running tools (for live updates)
            startTimes: new Map()   // Track start times for completed calls
        };
        window._toolTotalsEl = null; // The totals display element
        window._toolTotalsInterval = null; // Interval for live time updates

        function updateToolTotalsDisplay() {
            if (!window.toolLogEl) return;

            // Create or find totals element
            let totalsEl = window._toolTotalsEl;
            if (!totalsEl || !totalsEl.isConnected) {
                totalsEl = document.createElement('div');
                totalsEl.className = 'tool-totals';
                window._toolTotalsEl = totalsEl;
            }

            // Calculate current elapsed including active tools
            let liveElapsed = window._toolTotals.elapsedMs;
            const now = Date.now();
            window._toolTotals.activeTools.forEach(key => {
                const start = window._toolTimers.get(key);
                if (start) liveElapsed += (now - start);
            });

            // Format time as seconds
            const totalSec = (liveElapsed / 1000).toFixed(1);
            const hasActive = window._toolTotals.activeTools.size > 0;

            const dotsHtml = hasActive ? '<span class="tool-totals-dots"><span>.</span><span>.</span><span>.</span></span>' : '';

            totalsEl.innerHTML =
                '<span class="tool-totals-icon">\u2699</span>' +
                '<span class="tool-totals-label">Total</span>' +
                '<span class="tool-totals-count">' + window._toolTotals.count + ' call' + (window._toolTotals.count !== 1 ? 's' : '') + '</span>' +
                '<span class="tool-totals-time">' + dotsHtml + '<span class="tool-totals-time-value">' + totalSec + 's</span></span>';

            // Append to tool log if not already there
            if (!totalsEl.isConnected && window.toolLogEl) {
                window.toolLogEl.appendChild(totalsEl);
            }

            // Start/stop live update interval based on active tools
            if (hasActive && !window._toolTotalsInterval) {
                window._toolTotalsInterval = setInterval(updateToolTotalsDisplay, 100);
            } else if (!hasActive && window._toolTotalsInterval) {
                clearInterval(window._toolTotalsInterval);
                window._toolTotalsInterval = null;
            }
        }

        function trackToolStart(toolKey) {
            window._toolTotals.count++;
            window._toolTotals.activeTools.add(toolKey);
            window._toolTotals.startTimes.set(toolKey, Date.now());
            updateToolTotalsDisplay();
        }

        function trackToolComplete(toolKey, serverDurationMs) {
            if (window._toolTotals.activeTools.has(toolKey)) {
                window._toolTotals.activeTools.delete(toolKey);
                // DeepSeek duration_ms is cumulative turn time; max() avoids double-counting.
                if (serverDurationMs && serverDurationMs > 0) {
                    window._toolTotals.elapsedMs = Math.max(window._toolTotals.elapsedMs, serverDurationMs);
                } else {
                    const startTime = window._toolTotals.startTimes.get(toolKey) || window._toolTimers.get(toolKey);
                    if (startTime) {
                        window._toolTotals.elapsedMs += (Date.now() - startTime);
                    }
                }
            }
            updateToolTotalsDisplay();
        }

        function resetToolTotals() {
            window._toolTotals = {
                count: 0,
                elapsedMs: 0,
                activeTools: new Set(),
                startTimes: new Map()
            };
            if (window._toolTotalsInterval) {
                clearInterval(window._toolTotalsInterval);
                window._toolTotalsInterval = null;
            }
            window._toolTotalsEl = null;
        }

        function formatResponseDuration(ms) {
            const totalSeconds = Math.max(0, Math.round(ms / 1000));
            if (totalSeconds < 60) return totalSeconds + 's';
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            if (seconds === 0) return minutes + 'm';
            return minutes + 'm ' + seconds + 's';
        }

        function getWallToWallLabel(payload, pendingStartTs) {
            if (payload && payload.partial) return '';
            let ms = 0;
            const serverTurnMs = Number(payload && payload.turn_time_ms);
            if (Number.isFinite(serverTurnMs) && serverTurnMs > 0) {
                ms = serverTurnMs;
            } else if (pendingStartTs && pendingStartTs > 0) {
                ms = Date.now() - pendingStartTs;
            }
            if (ms <= 0) return '';
            return formatResponseDuration(ms);
        }

        function clearToolCalls() {
            // First collapse current tools to preserve them in the chat
            try {
                if (typeof collapseToolCalls === 'function') collapseToolCalls();
            } catch {}
            // Reset state for NEW tools (collapsed ones remain visible)
            window.toolLogEl = null;
            try { window._toolItems.clear(); } catch {}
            // Reset tool totals for the new tool box
            if (typeof resetToolTotals === 'function') resetToolTotals();
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
            window._toolTimers = new Map();
        }

