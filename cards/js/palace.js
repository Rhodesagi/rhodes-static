/**
 * RhodesCards Memory Palace — Main module
 * Orchestrates renderer, walker, builder, traversal, loci, and I/O.
 * All on RC.Palace namespace.
 */
(function() {
    'use strict';

    const Palace = {
        currentPalace: null,
        surfaces: [],
        connectors: [],
        loci: [],
        mode: 'walk',
        dirty: false,

        // ── Palace list / management ──

        async loadPalaceList() {
            var res = await RC.api('GET', '/palaces');
            if (!res.palaces) return [];
            return res.palaces;
        },

        async createPalace(name, templateId, lociCount) {
            var res = await RC.api('POST', '/palaces', { name: name || 'Untitled Palace' });
            if (!res || !res.id) return null;
            var palaceId = res.id;

            // Generate layout
            var layout;
            if (templateId) {
                layout = RC.PalaceTemplates.generate(templateId);
            } else if (lociCount) {
                layout = RC.PalaceGenerator.generate(lociCount);
            } else {
                layout = RC.PalaceGenerator.generate(20);
            }

            // Save generated layout to DB via bulk endpoint
            if (layout) {
                await RC.api('PUT', '/palaces/' + palaceId + '/bulk', {
                    name: name,
                    spawn_point: layout.spawn_point,
                    surfaces: layout.surfaces,
                    connectors: layout.connectors,
                    loci: layout.loci
                });
            }

            return { id: palaceId };
        },

        async deletePalace(id) {
            await RC.api('DELETE', '/palaces/' + id);
        },

        async loadPalace(id) {
            var res = await RC.api('GET', '/palaces/' + id);
            if (!res.palace) return null;
            this.currentPalace = res.palace;
            this.surfaces = res.surfaces || [];
            this.connectors = res.connectors || [];
            this.loci = res.loci || [];
            this.dirty = false;
            return res;
        },

        async savePalace() {
            if (!this.currentPalace) return;
            var sceneData = RC.PalaceRenderer.exportSceneData();
            await RC.api('PUT', '/palaces/' + this.currentPalace.id + '/bulk', {
                name: this.currentPalace.name,
                spawn_point: this.currentPalace.spawn_point,
                surfaces: sceneData.surfaces,
                connectors: sceneData.connectors,
                loci: sceneData.loci
            });
            this.dirty = false;
            RC.toast('Palace saved');
        },

        // ── Mode switching ──

        setMode(mode) {
            this.mode = mode;
            if (mode === 'build') {
                RC.PalaceBuilder.enable();
                RC.PalaceWalker.unlock();
            } else if (mode === 'walk') {
                RC.PalaceBuilder.disable();
                RC.PalaceWalker.lock();
            } else if (mode === 'review') {
                RC.PalaceBuilder.disable();
                RC.PalaceWalker.lock();
            }
            this._updateUI();
        },

        // ── Enter palace view ──

        async enter(palaceId) {
            document.getElementById('view-palaces').classList.remove('active');
            document.getElementById('view-palace').classList.add('active');
            var data = await this.loadPalace(palaceId);
            if (!data) { RC.toast('Failed to load palace'); return; }
            RC.PalaceRenderer.init('palace-canvas');
            RC.PalaceRenderer.buildScene(this.surfaces, this.connectors, this.loci);
            RC.PalaceWalker.init(RC.PalaceRenderer.camera, RC.PalaceRenderer.renderer.domElement);
            RC.PalaceLoci.init(this.loci);
            this.setMode('walk');
            this._updateUI();
            RC.PalaceRenderer.animate();
        },

        exit() {
            RC.PalaceWalker.dispose();
            RC.PalaceRenderer.dispose();
            RC.PalaceBuilder.disable();
            document.getElementById('view-palace').classList.remove('active');
            this.currentPalace = null;
            RC.showView('decks');
        },

        _updateUI() {
            var bar = document.getElementById('palace-toolbar');
            if (!bar) return;
            bar.querySelectorAll('.mode-btn').forEach(function(b) { b.classList.remove('active'); });
            var active = bar.querySelector('[data-mode="' + this.mode + '"]');
            if (active) active.classList.add('active');
            var nameEl = document.getElementById('palace-name');
            if (nameEl) nameEl.textContent = this.currentPalace ? this.currentPalace.name : '';
        }
    };

    // ── Palace list view ──

    Palace.showPalaceList = async function() {
        var list = document.getElementById('palace-list');
        if (!list) return;
        list.innerHTML = '<div class="loading">Loading palaces...</div>';

        try {
            var palaces = await this.loadPalaceList();
        } catch(e) {
            list.innerHTML = '<div class="empty-state"><p>Failed to load palaces.</p></div>';
            return;
        }

        if (palaces.length === 0) {
            this._showCreateView(list);
            return;
        }

        var html = '<div class="palace-grid">';
        html += palaces.map(function(p) {
            return '<div class="palace-card" onclick="RC.Palace.enter(' + p.id + ')">' +
                '<h3>' + RC.esc(p.name) + '</h3>' +
                '<div class="palace-meta">' + (p.loci_count || 0) + ' loci</div>' +
                '<button class="btn-sm btn-danger" onclick="event.stopPropagation(); RC.Palace.confirmDelete(' + p.id + ', \'' + RC.esc(p.name).replace(/'/g, "\\'") + '\')">&times;</button>' +
            '</div>';
        }).join('');
        html += '<div class="palace-card palace-card-new" onclick="RC.Palace._showCreateView(document.getElementById(\'palace-list\'))">' +
            '<div class="palace-new-icon">+</div><div>New Palace</div></div>';
        html += '</div>';
        list.innerHTML = html;
    };

    // ── Create view: templates + custom ──

    Palace._showCreateView = function(container) {
        var templates = RC.PalaceTemplates.catalog;
        var html = '<div class="palace-create-section">';
        html += '<h3>Choose a Template</h3>';
        html += '<div class="palace-template-grid">';
        templates.forEach(function(t) {
            html += '<div class="palace-template-card" onclick="RC.Palace._createFromTemplate(\'' + t.id + '\', \'' + RC.esc(t.name) + '\')">' +
                '<div class="template-preview" style="background:' + t.preview + '"></div>' +
                '<div class="template-info">' +
                    '<strong>' + RC.esc(t.name) + '</strong>' +
                    '<span class="template-desc">' + RC.esc(t.desc) + '</span>' +
                    '<span class="template-loci">' + t.loci + ' loci</span>' +
                '</div></div>';
        });
        html += '</div>';

        html += '<div class="palace-divider"><span>or</span></div>';

        html += '<h3>Generate Custom Palace</h3>';
        html += '<div class="palace-custom-form">' +
            '<label>Palace name</label>' +
            '<input type="text" id="customPalaceName" class="modal-input" placeholder="e.g. Anatomy Palace, History Manor...">' +
            '<label>How many loci?</label>' +
            '<input type="number" id="customLociCount" class="modal-input" value="20" min="4" max="200">' +
            '<div class="loci-hint">Each locus holds one flashcard. More loci = bigger palace.</div>' +
            '<button class="btn btn-primary" onclick="RC.Palace._createCustom()">Generate Palace</button>' +
        '</div>';

        html += '<div style="margin-top:12px"><button class="btn btn-sm" onclick="RC.Palace.showPalaceList()">Back</button></div>';
        html += '</div>';
        container.innerHTML = html;
    };

    Palace._createFromTemplate = async function(templateId, templateName) {
        var list = document.getElementById('palace-list');
        list.innerHTML = '<div class="loading">Building palace...</div>';
        var res = await this.createPalace(templateName, templateId, null);
        if (res && res.id) {
            this.enter(res.id);
        } else {
            RC.toast('Failed to create palace');
            this.showPalaceList();
        }
    };

    Palace._createCustom = async function() {
        var nameInput = document.getElementById('customPalaceName');
        var countInput = document.getElementById('customLociCount');
        var name = nameInput ? nameInput.value.trim() : '';
        var count = countInput ? parseInt(countInput.value) : 20;
        if (!name) { if (nameInput) nameInput.style.borderColor = '#f44'; return; }
        if (count < 4) count = 4;
        if (count > 200) count = 200;

        var list = document.getElementById('palace-list');
        list.innerHTML = '<div class="loading">Generating ' + count + ' loci palace...</div>';
        var res = await this.createPalace(name, null, count);
        if (res && res.id) {
            this.enter(res.id);
        } else {
            RC.toast('Failed to create palace');
            this.showPalaceList();
        }
    };

    Palace.confirmDelete = function(id, name) {
        var modal = document.getElementById('palaceDeleteModal');
        document.getElementById('palaceDeleteName').textContent = name;
        modal.style.display = 'flex';
        modal._deleteId = id;
    };

    Palace._confirmDelete = function() {
        var modal = document.getElementById('palaceDeleteModal');
        var id = modal._deleteId;
        modal.style.display = 'none';
        this.deletePalace(id).then(function() { RC.Palace.showPalaceList(); });
    };

    Palace._cancelDelete = function() {
        document.getElementById('palaceDeleteModal').style.display = 'none';
    };

    RC.Palace = Palace;
})();
