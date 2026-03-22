/**
 * RhodesCards Memory Palace — Main module
 * Orchestrates renderer, walker, builder, traversal, loci, and I/O.
 * All on RC.Palace namespace.
 */
(function() {
    'use strict';

    const Palace = {
        currentPalace: null,  // { id, name, settings, spawn_point }
        surfaces: [],
        connectors: [],
        loci: [],
        mode: 'walk',  // 'walk' | 'build' | 'review'
        dirty: false,

        // ── Palace list / management ──

        async loadPalaceList() {
            const res = await RC.api('GET', '/palaces');
            if (!res.palaces) return [];
            return res.palaces;
        },

        async createPalace(name) {
            const res = await RC.api('POST', '/palaces', { name: name || 'Untitled Palace' });
            return res;
        },

        async deletePalace(id) {
            await RC.api('DELETE', '/palaces/' + id);
        },

        async loadPalace(id) {
            const res = await RC.api('GET', '/palaces/' + id);
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
            // Collect scene state from renderer
            const sceneData = RC.PalaceRenderer.exportSceneData();
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
            document.getElementById('view-palace').classList.add('active');
            const data = await this.loadPalace(palaceId);
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
            const bar = document.getElementById('palace-toolbar');
            if (!bar) return;
            bar.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            const active = bar.querySelector('[data-mode="' + this.mode + '"]');
            if (active) active.classList.add('active');
            document.getElementById('palace-name').textContent = this.currentPalace ? this.currentPalace.name : '';
        }
    };

    // ── Palace list view ──

    Palace.showPalaceList = async function() {
        RC.showView('palaces');
        const list = document.getElementById('palace-list');
        list.innerHTML = '<div class="loading">Loading palaces...</div>';
        const palaces = await this.loadPalaceList();
        if (palaces.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>No memory palaces yet.</p>' +
                '<button onclick="alert(1)" class="btn btn-primary">Create Your First Palace</button></div>';
            return;
        }
        list.innerHTML = palaces.map(p =>
            '<div class="palace-card" onclick="RC.Palace.enter(' + p.id + ')">' +
                '<h3>' + RC.esc(p.name) + '</h3>' +
                '<div class="palace-meta">' + p.loci_count + ' loci</div>' +
                '<button class="btn-sm btn-danger" onclick="event.stopPropagation(); RC.Palace.confirmDelete(' + p.id + ', \'' + RC.esc(p.name) + '\')">&times;</button>' +
            '</div>'
        ).join('');
    };

    Palace.promptCreate = function() {
        var list = document.getElementById('palace-list');
        list.innerHTML = '<div class="palace-create-form">' +
            '<h3>Create Memory Palace</h3>' +
            '<input type="text" id="newPalaceName" class="modal-input" placeholder="e.g. Medical Tower, Latin Villa..." autofocus>' +
            '<div style="margin-top:12px;display:flex;gap:8px">' +
                '<button class="btn btn-primary" onclick="RC.Palace._doCreate()">Create</button>' +
                '<button class="btn" onclick="RC.Palace.showPalaceList()">Cancel</button>' +
            '</div>' +
        '</div>';
        setTimeout(function() {
            var inp = document.getElementById('newPalaceName');
            if (inp) {
                inp.focus();
                inp.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') RC.Palace._doCreate();
                });
            }
        }, 50);
    };

    Palace._doCreate = function() {
        var inp = document.getElementById('newPalaceName');
        var name = inp ? inp.value.trim() : '';
        if (!name) { if (inp) inp.style.borderColor = '#f44'; return; }
        RC.Palace.createPalace(name).then(function(res) {
            if (res && res.id) RC.Palace.enter(res.id);
        });
    };

    Palace.confirmDelete = function(id, name) {
        const modal = document.getElementById('palaceDeleteModal');
        document.getElementById('palaceDeleteName').textContent = name;
        modal.style.display = 'flex';
        modal._deleteId = id;
    };

    Palace._confirmDelete = function() {
        const modal = document.getElementById('palaceDeleteModal');
        const id = modal._deleteId;
        modal.style.display = 'none';
        this.deletePalace(id).then(() => this.showPalaceList());
    };

    Palace._cancelDelete = function() {
        document.getElementById('palaceDeleteModal').style.display = 'none';
    };

    RC.Palace = Palace;
})();
