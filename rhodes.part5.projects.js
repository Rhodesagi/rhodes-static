/* RHODES v2 module: rhodes.part5.projects.js */
/* Source: contiguous slice of rhodes.monolith.js */

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

