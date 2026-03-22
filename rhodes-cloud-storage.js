/**
 * Rhodes Cloud Storage Integration
 * Manages Google Drive & OneDrive connections, file browsing, and reference insertion.
 */
(function() {
    'use strict';

    const CloudStorage = {
        status: null,
        modal: null,

        // Get auth token from existing Rhodes auth
        _getToken() {
            return (window.rhodesStorage || localStorage).getItem('rhodes_user_token')
                || (window.rhodesStorage || localStorage).getItem('rhodes_token')
                || '';
        },

        _headers() {
            return { 'Authorization': 'Bearer ' + this._getToken(), 'Content-Type': 'application/json' };
        },

        // Fetch connection status
        async refreshStatus() {
            try {
                const resp = await fetch('/api/cloud/status', { headers: this._headers() });
                if (!resp.ok) {
                    const container = document.getElementById('cloud-connections');
                    if (container) {
                        container.innerHTML = '<div class="cloud-provider" style="color:var(--dim);text-align:center;padding:20px 0;">Please log in to connect cloud storage.</div>';
                    }
                    return;
                }
                this.status = await resp.json();
                this._updateUI();
            } catch (e) {
                console.warn('[CloudStorage] Status fetch failed:', e);
                const container = document.getElementById('cloud-connections');
                if (container) {
                    container.innerHTML = '<div class="cloud-provider" style="color:var(--dim);text-align:center;padding:20px 0;">Could not load cloud storage status.</div>';
                }
            }
        },

        _updateUI() {
            const container = document.getElementById('cloud-connections');
            if (!container || !this.status) return;

            let html = '';

            // Google Drive
            const g = this.status.providers?.google;
            if (this.status.google_available) {
                if (g?.connected) {
                    html += '<div class="cloud-provider connected">' +
                        '<span class="cloud-provider-icon">📁</span>' +
                        '<span class="cloud-provider-name">Google Drive</span>' +
                        '<span class="cloud-provider-email">' + (g.email || 'Connected') + '</span>' +
                        '<button onclick="CloudStorage.disconnect(\'google\')" class="cloud-disconnect-btn">Disconnect</button>' +
                        '</div>';
                } else {
                    html += '<div class="cloud-provider">' +
                        '<span class="cloud-provider-icon">📁</span>' +
                        '<span class="cloud-provider-name">Google Drive</span>' +
                        '<button onclick="CloudStorage.connect(\'google\')" class="cloud-connect-btn">Connect</button>' +
                        '</div>';
                }
            }

            // OneDrive
            const o = this.status.providers?.onedrive;
            if (this.status.onedrive_available) {
                if (o?.connected) {
                    html += '<div class="cloud-provider connected">' +
                        '<span class="cloud-provider-icon">☁️</span>' +
                        '<span class="cloud-provider-name">OneDrive</span>' +
                        '<span class="cloud-provider-email">' + (o.email || 'Connected') + '</span>' +
                        '<button onclick="CloudStorage.disconnect(\'onedrive\')" class="cloud-disconnect-btn">Disconnect</button>' +
                        '</div>';
                } else {
                    html += '<div class="cloud-provider">' +
                        '<span class="cloud-provider-icon">☁️</span>' +
                        '<span class="cloud-provider-name">OneDrive</span>' +
                        '<button onclick="CloudStorage.connect(\'onedrive\')" class="cloud-connect-btn">Connect</button>' +
                        '</div>';
                }
            }

            if (!this.status.google_available && !this.status.onedrive_available) {
                html = '<div class="cloud-provider" style="color:var(--dim);">Cloud storage not configured on this server.</div>';
            }

            container.innerHTML = html;

            // Cloud attach button is always visible
        },

        // Start OAuth flow
        async connect(provider) {
            try {
                const resp = await fetch('/api/cloud/' + provider + '/auth', { headers: this._headers() });
                const data = await resp.json();
                if (data.auth_url) {
                    window.location.href = data.auth_url;
                } else {
                    alert(data.error || 'Failed to start connection');
                }
            } catch (e) {
                alert('Connection failed: ' + e.message);
            }
        },

        // Open file browser if connected, or show connection modal
        openOrConnect() {
            const g = this.status?.providers?.google;
            if (g?.connected) {
                this.openBrowser();
            } else {
                document.getElementById('cloud-settings-modal').style.display = 'flex';
                this.refreshStatus();
            }
        },

        // Disconnect provider
        async disconnect(provider) {
            if (!confirm('Disconnect ' + (provider === 'google' ? 'Google Drive' : 'OneDrive') + '?')) return;
            try {
                await fetch('/api/cloud/' + provider + '/disconnect', { method: 'POST', headers: this._headers() });
                await this.refreshStatus();
            } catch (e) {
                alert('Disconnect failed: ' + e.message);
            }
        },

        // Open file browser modal
        async openBrowser() {
            if (!this.status) await this.refreshStatus();

            const providers = [];
            if (this.status?.providers?.google?.connected) providers.push('google');
            if (this.status?.providers?.onedrive?.connected) providers.push('onedrive');

            if (providers.length === 0) {
                alert('No cloud storage connected. Connect Google Drive or OneDrive in your account settings.');
                return;
            }

            this._showModal(providers[0], providers);
        },

        _showModal(activeProvider, providers) {
            // Remove existing modal
            if (this.modal) this.modal.remove();

            const modal = document.createElement('div');
            modal.id = 'cloud-browser-modal';
            modal.className = 'cloud-modal-overlay';
            modal.innerHTML =
                '<div class="cloud-modal">' +
                    '<div class="cloud-modal-header">' +
                        '<div class="cloud-modal-tabs">' +
                            providers.map(p =>
                                '<button class="cloud-tab' + (p === activeProvider ? ' active' : '') + '" data-provider="' + p + '">' +
                                (p === 'google' ? '📁 Google Drive' : '☁️ OneDrive') + '</button>'
                            ).join('') +
                        '</div>' +
                        '<div class="cloud-modal-actions">' +
                            '<input type="text" id="cloud-search-input" placeholder="Search files..." class="cloud-search-input">' +
                            '<button onclick="CloudStorage._doSearch()" class="cloud-search-btn">Search</button>' +
                            '<button onclick="CloudStorage._closeModal()" class="cloud-close-btn">✕</button>' +
                        '</div>' +
                    '</div>' +
                    '<div id="cloud-breadcrumbs" class="cloud-breadcrumbs"><span class="cloud-crumb" data-id="">Root</span></div>' +
                    '<div id="cloud-file-list" class="cloud-file-list"><div class="cloud-loading">Loading...</div></div>' +
                '</div>';

            document.body.appendChild(modal);
            this.modal = modal;

            // Event listeners
            modal.querySelector('.cloud-modal-overlay')?.addEventListener('click', (e) => {
                if (e.target === modal) this._closeModal();
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this._closeModal();
            });
            modal.querySelectorAll('.cloud-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    this._activeProvider = tab.dataset.provider;
                    modal.querySelectorAll('.cloud-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    this._breadcrumbs = [{ id: '', name: 'Root' }];
                    this._renderBreadcrumbs();
                    this._loadFiles();
                });
            });

            document.getElementById('cloud-search-input').addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this._doSearch();
            });

            this._activeProvider = activeProvider;
            this._breadcrumbs = [{ id: '', name: 'Root' }];
            this._loadFiles();
        },

        _closeModal() {
            if (this.modal) {
                this.modal.remove();
                this.modal = null;
            }
        },

        async _loadFiles(folderId) {
            const list = document.getElementById('cloud-file-list');
            if (!list) return;
            list.innerHTML = '<div class="cloud-loading">Loading...</div>';

            try {
                let url = '/api/cloud/' + this._activeProvider + '/files';
                if (folderId) url += '?folder_id=' + encodeURIComponent(folderId);
                const resp = await fetch(url, { headers: this._headers() });
                const data = await resp.json();

                if (data.error) {
                    list.innerHTML = '<div class="cloud-error">' + data.error + '</div>';
                    return;
                }

                const files = data.files || [];
                if (files.length === 0) {
                    list.innerHTML = '<div class="cloud-empty">No files found</div>';
                    return;
                }

                list.innerHTML = files.map(f => this._renderFile(f)).join('');
            } catch (e) {
                list.innerHTML = '<div class="cloud-error">Failed to load files: ' + e.message + '</div>';
            }
        },

        _renderFile(f) {
            const isFolder = f.mimeType === 'application/vnd.google-apps.folder' || f.mimeType === 'folder';
            const icon = isFolder ? '📂' : this._fileIcon(f.name, f.mimeType);
            const size = f.size ? this._formatSize(f.size) : '';

            if (isFolder) {
                return '<div class="cloud-file-row cloud-folder" onclick="CloudStorage._openFolder(\'' + f.id + '\', \'' + this._escapeHtml(f.name) + '\')">' +
                    '<span class="cloud-file-icon">' + icon + '</span>' +
                    '<span class="cloud-file-name">' + this._escapeHtml(f.name) + '</span>' +
                    '<span class="cloud-file-size">' + size + '</span>' +
                    '</div>';
            }

            return '<div class="cloud-file-row">' +
                '<span class="cloud-file-icon">' + icon + '</span>' +
                '<span class="cloud-file-name">' + this._escapeHtml(f.name) + '</span>' +
                '<span class="cloud-file-size">' + size + '</span>' +
                '<button class="cloud-ref-btn" onclick="CloudStorage._insertReference(\'' + this._activeProvider + '\', \'' + f.id + '\', \'' + this._escapeHtml(f.name).replace(/'/g, "\\'") + '\')">Reference</button>' +
                '</div>';
        },

        _openFolder(id, name) {
            this._breadcrumbs.push({ id, name });
            this._renderBreadcrumbs();
            this._loadFiles(id);
        },

        _renderBreadcrumbs() {
            const el = document.getElementById('cloud-breadcrumbs');
            if (!el) return;
            el.innerHTML = this._breadcrumbs.map((b, i) =>
                '<span class="cloud-crumb" onclick="CloudStorage._navToCrumb(' + i + ')">' + this._escapeHtml(b.name) + '</span>'
            ).join(' / ');
        },

        _navToCrumb(index) {
            this._breadcrumbs = this._breadcrumbs.slice(0, index + 1);
            this._renderBreadcrumbs();
            const folderId = this._breadcrumbs[this._breadcrumbs.length - 1].id;
            this._loadFiles(folderId || undefined);
        },

        async _doSearch() {
            const input = document.getElementById('cloud-search-input');
            const q = (input?.value || '').trim();
            if (!q) return;

            const list = document.getElementById('cloud-file-list');
            if (!list) return;
            list.innerHTML = '<div class="cloud-loading">Searching...</div>';

            try {
                const resp = await fetch('/api/cloud/' + this._activeProvider + '/search?q=' + encodeURIComponent(q), { headers: this._headers() });
                const data = await resp.json();
                const files = data.files || [];

                if (files.length === 0) {
                    list.innerHTML = '<div class="cloud-empty">No results for "' + this._escapeHtml(q) + '"</div>';
                    return;
                }

                list.innerHTML = files.map(f => this._renderFile(f)).join('');
            } catch (e) {
                list.innerHTML = '<div class="cloud-error">Search failed: ' + e.message + '</div>';
            }
        },

        _insertReference(provider, fileId, fileName) {
            const input = document.getElementById('input');
            if (!input) return;
            const ref = '[cloud-file: ' + provider + '/' + fileId + ' "' + fileName + '"]';
            const cursorPos = input.selectionStart || input.value.length;
            input.value = input.value.substring(0, cursorPos) + ref + input.value.substring(input.selectionEnd || cursorPos);
            input.focus();
            this._closeModal();
        },

        // Helpers
        _fileIcon(name, mime) {
            if (!name) return '📄';
            const ext = name.split('.').pop()?.toLowerCase();
            const icons = {
                pdf: '📕', doc: '📝', docx: '📝', txt: '📝', md: '📝',
                xls: '📊', xlsx: '📊', csv: '📊',
                ppt: '📎', pptx: '📎',
                jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️',
                mp3: '🎵', mp4: '🎬', mov: '🎬',
                zip: '📦', rar: '📦',
                js: '💻', py: '💻', html: '💻', css: '💻', json: '💻',
            };
            return icons[ext] || '📄';
        },

        _formatSize(bytes) {
            if (!bytes || bytes <= 0) return '';
            if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
            if (bytes > 1024) return Math.round(bytes / 1024) + ' KB';
            return bytes + ' B';
        },

        _escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str || '';
            return div.innerHTML;
        },

        // Init
        init() {
            // Check for OAuth redirect params
            const params = new URLSearchParams(window.location.search);
            if (params.get('cloud_connected')) {
                // Remove param from URL
                params.delete('cloud_connected');
                const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
                window.history.replaceState({}, '', newUrl);
            }
            if (params.get('cloud_error')) {
                const err = params.get('cloud_error');
                console.error('[CloudStorage] OAuth error:', err);
                params.delete('cloud_error');
                const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
                window.history.replaceState({}, '', newUrl);
            }

            // Refresh status if logged in
            if (this._getToken()) {
                this.refreshStatus();
            }
        }
    };

    // Export globally
    window.CloudStorage = CloudStorage;

    // Auto-init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CloudStorage.init());
    } else {
        CloudStorage.init();
    }
})();
