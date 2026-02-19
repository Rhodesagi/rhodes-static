/* RHODES v2 module: rhodes.part7.sites-terminal.js */
/* Source: contiguous slice of rhodes.monolith.js */


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
