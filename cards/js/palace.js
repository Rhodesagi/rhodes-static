/**
 * RhodesCards Memory Palace — Main orchestrator (Raycaster version)
 * Manages palace CRUD, create flow, and coordinates raycaster + map gen.
 */
(function() {
    'use strict';

    var Palace = {
        currentPalace: null,
        mapData: null, // { map, width, height, sprites, spawn }

        // ── API ──
        async loadPalaceList() {
            var res = await RC.api('GET', '/palaces');
            return (res && res.palaces) ? res.palaces : [];
        },

        async createPalace(name, templateId, lociCount) {
            var res = await RC.api('POST', '/palaces', { name: name || 'Untitled Palace' });
            if (!res || !res.id) return null;

            // Generate map
            var data;
            if (templateId) {
                data = RC.PalaceMapGen.generateFromTemplate(templateId);
            } else {
                data = RC.PalaceMapGen.generate(lociCount || 20);
            }

            // Convert sprites to loci format for DB
            var loci = data.sprites.map(function(s) {
                return {
                    position: [s.x, s.y],
                    marker_type: s.type,
                    marker_settings: {},
                    card_ids: s.data.card_ids || [],
                    label: s.data.label || ''
                };
            });

            // Save to DB
            await RC.api('PUT', '/palaces/' + res.id + '/bulk', {
                name: name,
                spawn_point: { position: data.spawn },
                settings: { map: data.map, width: data.width, height: data.height, version: 2 },
                surfaces: [], connectors: [],
                loci: loci
            });

            return { id: res.id };
        },

        async deletePalace(id) {
            await RC.api('DELETE', '/palaces/' + id);
        },

        async loadPalace(id) {
            var res = await RC.api('GET', '/palaces/' + id);
            if (!res || !res.palace) return null;
            this.currentPalace = res.palace;

            // Reconstruct map data
            var settings = res.palace.settings || {};
            if (settings.map && settings.width) {
                this.mapData = {
                    map: settings.map,
                    width: settings.width,
                    height: settings.height,
                    spawn: res.palace.spawn_point ? res.palace.spawn_point.position : [3, 3],
                    sprites: (res.loci || []).map(function(l) {
                        return {
                            x: l.position[0],
                            y: l.position[1],
                            type: l.marker_type || 'orb',
                            data: { label: l.label, card_ids: l.card_ids || [], id: l.id }
                        };
                    })
                };
            }
            return res;
        },

        async savePalace() {
            if (!this.currentPalace || !this.mapData) return;
            var loci = this.mapData.sprites.map(function(s) {
                return {
                    position: [s.x, s.y],
                    marker_type: s.type,
                    marker_settings: {},
                    card_ids: s.data.card_ids || [],
                    label: s.data.label || ''
                };
            });
            await RC.api('PUT', '/palaces/' + this.currentPalace.id + '/bulk', {
                name: this.currentPalace.name,
                spawn_point: { position: this.mapData.spawn },
                settings: { map: this.mapData.map, width: this.mapData.width, height: this.mapData.height, version: 2 },
                surfaces: [], connectors: [],
                loci: loci
            });
            RC.toast('Palace saved');
        },

        // ── Enter palace ──
        async enter(palaceId) {
            document.getElementById('view-palaces').classList.remove('active');
            document.getElementById('view-palace').classList.add('active');

            var data = await this.loadPalace(palaceId);
            if (!data || !this.mapData) { RC.toast('Failed to load palace'); return; }

            RC.Raycaster.init('palace-canvas');
            RC.Raycaster.setMap(this.mapData.map, this.mapData.width, this.mapData.height);
            RC.Raycaster.setSprites(this.mapData.sprites);
            RC.Raycaster.setPos(this.mapData.spawn[0], this.mapData.spawn[1], 0);
            RC.Raycaster.interactCallback = this._onInteract.bind(this);
            RC.Raycaster.start();

            document.getElementById('palace-name').textContent = this.currentPalace.name;
        },

        _onInteract: function(sprite, index) {
            if (!sprite.data) return;
            var cardIds = sprite.data.card_ids || [];
            if (cardIds.length === 0) {
                this._showBindDialog(sprite, index);
            } else {
                RC.PalaceLoci.activateLocusRay(sprite, index);
            }
        },

        _showBindDialog: function(sprite, index) {
            RC.Raycaster.stop();
            if (document.pointerLockElement) document.exitPointerLock();
            var overlay = document.getElementById('palace-review-overlay');
            overlay.style.display = 'flex';
            overlay.innerHTML = '<div class="palace-review-card">' +
                '<h3>' + RC.esc(sprite.data.label || 'Empty Locus') + '</h3>' +
                '<p>No cards bound to this location.</p>' +
                '<button class="btn btn-primary" onclick="RC.PalaceLoci.openCardBinderRay(' + index + ')">Bind Cards</button>' +
                '<button class="btn" onclick="RC.Palace.closeOverlay()">Close</button>' +
            '</div>';
        },

        closeOverlay: function() {
            document.getElementById('palace-review-overlay').style.display = 'none';
            RC.Raycaster.start();
        },

        exit: function() {
            RC.Raycaster.dispose();
            document.getElementById('view-palace').classList.remove('active');
            this.currentPalace = null;
            this.mapData = null;
            RC.showView('decks');
        },
    };

    // ── Palace list view ──
    Palace.showPalaceList = async function() {
        var list = document.getElementById('palace-list');
        if (!list) return;
        list.innerHTML = '<div class="loading">Loading palaces...</div>';

        try { var palaces = await this.loadPalaceList(); }
        catch(e) { list.innerHTML = '<div class="empty-state"><p>Failed to load.</p></div>'; return; }

        if (!palaces.length) { this._showCreateView(list); return; }

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

    // ── Create view ──
    Palace._showCreateView = function(container) {
        var templates = RC.PalaceMapGen.templates;
        var html = '<div class="palace-create-section">';
        html += '<h3>Choose a Template</h3><div class="palace-template-grid">';
        templates.forEach(function(t) {
            html += '<div class="palace-template-card" onclick="RC.Palace._createFromTemplate(\'' + t.id + '\', \'' + RC.esc(t.name) + '\')">' +
                '<div class="template-preview" style="background:' + (t.preview || '#333') + '"></div>' +
                '<div class="template-info"><strong>' + RC.esc(t.name) + '</strong>' +
                '<span class="template-desc">' + RC.esc(t.desc) + '</span>' +
                '<span class="template-loci">' + t.loci + ' loci</span></div></div>';
        });
        html += '</div><div class="palace-divider"><span>or</span></div>';
        html += '<h3>Generate Custom Palace</h3><div class="palace-custom-form">' +
            '<label>Palace name</label><input type="text" id="customPalaceName" class="modal-input" placeholder="e.g. Anatomy Palace...">' +
            '<label>How many loci?</label><input type="number" id="customLociCount" class="modal-input" value="20" min="4" max="200">' +
            '<div class="loci-hint">Each locus holds one flashcard. More loci = bigger dungeon.</div>' +
            '<button class="btn btn-primary" onclick="RC.Palace._createCustom()">Generate Palace</button></div>';
        html += '<div style="margin-top:12px"><button class="btn btn-sm" onclick="RC.Palace.showPalaceList()">Back</button></div></div>';
        container.innerHTML = html;
    };

    Palace._createFromTemplate = async function(templateId, templateName) {
        var list = document.getElementById('palace-list');
        list.innerHTML = '<div class="loading">Building palace...</div>';
        var res = await this.createPalace(templateName, templateId, null);
        if (res && res.id) this.enter(res.id);
        else { RC.toast('Failed'); this.showPalaceList(); }
    };

    Palace._createCustom = async function() {
        var name = (document.getElementById('customPalaceName').value || '').trim();
        var count = parseInt(document.getElementById('customLociCount').value) || 20;
        if (!name) { document.getElementById('customPalaceName').style.borderColor = '#f44'; return; }
        count = Math.max(4, Math.min(200, count));
        var list = document.getElementById('palace-list');
        list.innerHTML = '<div class="loading">Generating ' + count + '-loci palace...</div>';
        var res = await this.createPalace(name, null, count);
        if (res && res.id) this.enter(res.id);
        else { RC.toast('Failed'); this.showPalaceList(); }
    };

    Palace.confirmDelete = function(id, name) {
        var m = document.getElementById('palaceDeleteModal');
        document.getElementById('palaceDeleteName').textContent = name;
        m.style.display = 'flex'; m._deleteId = id;
    };
    Palace._confirmDelete = function() {
        var m = document.getElementById('palaceDeleteModal');
        m.style.display = 'none';
        this.deletePalace(m._deleteId).then(function() { RC.Palace.showPalaceList(); });
    };
    Palace._cancelDelete = function() { document.getElementById('palaceDeleteModal').style.display = 'none'; };

    RC.Palace = Palace;
})();
