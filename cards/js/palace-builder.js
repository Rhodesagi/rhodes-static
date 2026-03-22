/**
 * RhodesCards Memory Palace — Builder Mode
 * Place surfaces, connectors, loci. Drag, resize, delete.
 */
(function() {
    'use strict';

    const PB = {
        enabled: false,
        selectedObject: null,
        placingType: null,   // what we're about to place
        placingSubType: null,
        ghostMesh: null,     // preview mesh following cursor
        transformMode: 'translate', // 'translate' | 'rotate' | 'scale'
        _mouseMove: null,
        _mouseDown: null,
        _keyHandler: null,
        raycaster: new THREE.Raycaster(),
        mouse: new THREE.Vector2(),

        enable() {
            this.enabled = true;
            document.getElementById('builder-panel').style.display = 'block';
            this._mouseMove = (e) => this._onMouseMove(e);
            this._mouseDown = (e) => this._onMouseDown(e);
            this._keyHandler = (e) => this._onKey(e);
            const canvas = RC.PalaceRenderer.renderer.domElement;
            canvas.addEventListener('mousemove', this._mouseMove);
            canvas.addEventListener('mousedown', this._mouseDown);
            document.addEventListener('keydown', this._keyHandler);
        },

        disable() {
            this.enabled = false;
            this._clearGhost();
            this.selectedObject = null;
            document.getElementById('builder-panel').style.display = 'none';
            const canvas = RC.PalaceRenderer.renderer?.domElement;
            if (canvas) {
                canvas.removeEventListener('mousemove', this._mouseMove);
                canvas.removeEventListener('mousedown', this._mouseDown);
            }
            document.removeEventListener('keydown', this._keyHandler);
        },

        // ── Start placing a primitive ──

        startPlace(type, subType) {
            this.placingType = type;
            this.placingSubType = subType;
            this._createGhost(type, subType);
        },

        _createGhost(type, subType) {
            this._clearGhost();
            let geo, mat;
            mat = new THREE.MeshStandardMaterial({
                color: 0x44ff88, transparent: true, opacity: 0.4, side: THREE.DoubleSide
            });

            if (type === 'surface') {
                geo = new THREE.PlaneGeometry(4, 3);
                this.ghostMesh = new THREE.Mesh(geo, mat);
                if (subType === 'floor') this.ghostMesh.rotation.x = -Math.PI / 2;
            } else if (type === 'locus') {
                geo = new THREE.SphereGeometry(0.18, 16, 16);
                this.ghostMesh = new THREE.Mesh(geo, mat);
            } else if (type === 'connector') {
                geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                this.ghostMesh = new THREE.Mesh(geo, mat);
            }

            if (this.ghostMesh) {
                this.ghostMesh.userData._isGhost = true;
                RC.PalaceRenderer.scene.add(this.ghostMesh);
            }
        },

        _clearGhost() {
            if (this.ghostMesh) {
                RC.PalaceRenderer.scene.remove(this.ghostMesh);
                this.ghostMesh.geometry?.dispose();
                this.ghostMesh = null;
            }
        },

        _onMouseMove(e) {
            if (!this.enabled) return;
            const rect = RC.PalaceRenderer.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            if (this.ghostMesh) {
                // Project onto ground plane or surfaces
                this.raycaster.setFromCamera(this.mouse, RC.PalaceRenderer.camera);
                const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                const intersect = new THREE.Vector3();
                this.raycaster.ray.intersectPlane(plane, intersect);
                if (intersect) {
                    // Snap to grid
                    this.ghostMesh.position.set(
                        Math.round(intersect.x * 2) / 2,
                        this.placingSubType === 'wall' ? 1.5 : 0,
                        Math.round(intersect.z * 2) / 2
                    );
                }
            }
        },

        _onMouseDown(e) {
            if (!this.enabled) return;

            if (this.ghostMesh && this.placingType) {
                // Place the primitive
                this._placePrimitive();
                return;
            }

            // Selection mode — pick objects
            this.raycaster.setFromCamera(this.mouse, RC.PalaceRenderer.camera);
            const all = [
                ...RC.PalaceRenderer.surfaceMeshes,
                ...RC.PalaceRenderer.connectorMeshes,
                ...RC.PalaceRenderer.lociMeshes
            ];
            const hits = this.raycaster.intersectObjects(all, true);
            if (hits.length > 0) {
                let obj = hits[0].object;
                while (obj && !obj.userData.dbType) obj = obj.parent;
                this._select(obj);
            } else {
                this._deselect();
            }
        },

        _placePrimitive() {
            const pos = this.ghostMesh.position.clone();
            const type = this.placingType;
            const sub = this.placingSubType;

            if (type === 'surface') {
                const surfData = {
                    type: sub || 'floor',
                    transform: {
                        position: [pos.x, pos.y, pos.z],
                        rotation: sub === 'floor' ? [0, 0, 0] : [0, 0, 0],
                        scale: [1, 1, 1]
                    },
                    dimensions: { width: 4, height: sub === 'wall' ? 3 : 4 },
                    material: { color: sub === 'floor' ? '#555566' : '#666677', opacity: 1.0 },
                    label: null,
                    sort_order: RC.PalaceRenderer.surfaceMeshes.length
                };
                const mesh = RC.PalaceRenderer._addSurface(surfData);
                RC.Palace.dirty = true;
            } else if (type === 'locus') {
                const locData = {
                    position: [pos.x, pos.y + 1, pos.z],
                    marker_type: sub || 'orb',
                    marker_settings: {},
                    card_ids: [],
                    label: null
                };
                RC.PalaceRenderer._addLocus(locData);
                RC.Palace.dirty = true;
            } else if (type === 'connector') {
                // Connectors need two points — store first click, wait for second
                if (!this._connectorStart) {
                    this._connectorStart = [pos.x, pos.y, pos.z];
                    RC.toast('Click destination point');
                    return;
                }
                const connData = {
                    type: sub || 'stairs',
                    from_point: { position: this._connectorStart },
                    to_point: { position: [pos.x, pos.y, pos.z] },
                    path_points: null,
                    speed: 1.0,
                    material: { color: '#4488ff', opacity: 0.8 },
                    label: null
                };
                RC.PalaceRenderer._addConnector(connData);
                this._connectorStart = null;
                RC.Palace.dirty = true;
            }

            // Continue placing (hold shift) or stop
            if (!this._shiftHeld) {
                this._clearGhost();
                this.placingType = null;
                this.placingSubType = null;
            }
        },

        _select(obj) {
            this._deselect();
            if (!obj) return;
            this.selectedObject = obj;
            // Outline effect — swap material emissive
            if (obj.material) {
                obj._origEmissive = obj.material.emissive?.clone();
                obj.material.emissive = new THREE.Color(0x44ff44);
            }
            this._showPropertiesPanel(obj);
        },

        _deselect() {
            if (this.selectedObject) {
                if (this.selectedObject.material && this.selectedObject._origEmissive) {
                    this.selectedObject.material.emissive = this.selectedObject._origEmissive;
                }
                this.selectedObject = null;
            }
            document.getElementById('builder-props').innerHTML = '';
        },

        _showPropertiesPanel(obj) {
            const panel = document.getElementById('builder-props');
            const d = obj.userData.dbData || {};
            let html = '<h4>' + (d.type || d.marker_type || 'Object') + '</h4>';
            html += '<label>Label: <input id="prop-label" value="' + (d.label || '') + '" onchange="RC.PalaceBuilder.updateProp(\'label\', this.value)"></label>';

            if (obj.userData.dbType === 'surface') {
                html += '<label>Width: <input type="number" id="prop-w" value="' + (d.dimensions?.width || 4) + '" onchange="RC.PalaceBuilder.updateDimension(\'width\', this.value)"></label>';
                html += '<label>Height: <input type="number" id="prop-h" value="' + (d.dimensions?.height || 3) + '" onchange="RC.PalaceBuilder.updateDimension(\'height\', this.value)"></label>';
                html += '<label>Color: <input type="color" value="' + (d.material?.color || '#888888') + '" onchange="RC.PalaceBuilder.updateColor(this.value)"></label>';
            }

            if (obj.userData.dbType === 'locus') {
                html += '<label>Marker: <select onchange="RC.PalaceBuilder.updateProp(\'marker_type\', this.value)">';
                ['orb','frame','pedestal','door','statue','glow'].forEach(t => {
                    html += '<option' + (t === d.marker_type ? ' selected' : '') + '>' + t + '</option>';
                });
                html += '</select></label>';
                html += '<div class="locus-cards"><b>Cards:</b> ' + (d.card_ids?.length || 0) + ' bound';
                html += ' <button onclick="RC.PalaceLoci.openCardBinder(' + (d.id || 0) + ')">Bind Cards</button></div>';
            }

            html += '<div class="prop-actions">';
            html += '<button onclick="RC.PalaceBuilder.deleteSelected()" class="btn-danger">Delete</button>';
            html += '</div>';
            panel.innerHTML = html;
        },

        updateProp(key, value) {
            if (!this.selectedObject) return;
            this.selectedObject.userData.dbData[key] = value;
            RC.Palace.dirty = true;
        },

        updateDimension(dim, value) {
            if (!this.selectedObject) return;
            const d = this.selectedObject.userData.dbData;
            if (!d.dimensions) d.dimensions = {};
            d.dimensions[dim] = parseFloat(value);
            // Rebuild geometry
            const geo = new THREE.PlaneGeometry(d.dimensions.width, d.dimensions.height);
            this.selectedObject.geometry.dispose();
            this.selectedObject.geometry = geo;
            RC.Palace.dirty = true;
        },

        updateColor(color) {
            if (!this.selectedObject || !this.selectedObject.material) return;
            this.selectedObject.material.color.set(color);
            this.selectedObject.userData.dbData.material = this.selectedObject.userData.dbData.material || {};
            this.selectedObject.userData.dbData.material.color = color;
            RC.Palace.dirty = true;
        },

        deleteSelected() {
            if (!this.selectedObject) return;
            const obj = this.selectedObject;
            RC.PalaceRenderer.scene.remove(obj);

            // Remove from appropriate array
            const type = obj.userData.dbType;
            if (type === 'surface') {
                RC.PalaceRenderer.surfaceMeshes = RC.PalaceRenderer.surfaceMeshes.filter(m => m !== obj);
            } else if (type === 'connector') {
                RC.PalaceRenderer.connectorMeshes = RC.PalaceRenderer.connectorMeshes.filter(m => m !== obj);
            } else if (type === 'locus') {
                RC.PalaceRenderer.lociMeshes = RC.PalaceRenderer.lociMeshes.filter(m => m !== obj);
            }

            this._deselect();
            RC.Palace.dirty = true;
        },

        _onKey(e) {
            if (!this.enabled) return;
            this._shiftHeld = e.shiftKey;

            if (e.code === 'Delete' || e.code === 'Backspace') {
                if (this.selectedObject) this.deleteSelected();
            }
            if (e.code === 'KeyS' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                RC.Palace.savePalace();
            }
        }
    };

    RC.PalaceBuilder = PB;
})();
