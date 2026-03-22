/**
 * RhodesCards Memory Palace — Three.js Renderer
 * Converts DB primitives (surfaces, connectors, loci) into a 3D scene.
 */
(function() {
    'use strict';

    const PR = {
        scene: null,
        camera: null,
        renderer: null,
        clock: null,
        animFrameId: null,

        // Scene object groups for easy iteration
        surfaceMeshes: [],
        connectorMeshes: [],
        lociMeshes: [],

        // Materials cache
        _materials: {},

        init(canvasId) {
            const container = document.getElementById(canvasId);
            if (!container) return;

            this.clock = new THREE.Clock();
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x1a1a2e);
            this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.015);

            this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 500);
            this.camera.position.set(0, 1.6, 0);

            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(container.clientWidth, container.clientHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            container.appendChild(this.renderer.domElement);

            // Lights
            const ambient = new THREE.AmbientLight(0x404060, 0.6);
            this.scene.add(ambient);
            const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
            dirLight.position.set(20, 40, 20);
            dirLight.castShadow = true;
            this.scene.add(dirLight);
            // Hemisphere for outdoor feel
            const hemi = new THREE.HemisphereLight(0x87ceeb, 0x362d59, 0.3);
            this.scene.add(hemi);

            // Grid helper (subtle reference plane)
            const grid = new THREE.GridHelper(200, 200, 0x333355, 0x222244);
            grid.position.y = -0.01;
            this.scene.add(grid);

            // Skybox — simple gradient via large sphere
            const skyGeo = new THREE.SphereGeometry(400, 32, 32);
            const skyMat = new THREE.ShaderMaterial({
                uniforms: {
                    topColor: { value: new THREE.Color(0x0d1b2a) },
                    bottomColor: { value: new THREE.Color(0x1b2838) },
                },
                vertexShader: `
                    varying vec3 vWorldPos;
                    void main() {
                        vec4 wp = modelMatrix * vec4(position, 1.0);
                        vWorldPos = wp.xyz;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 topColor;
                    uniform vec3 bottomColor;
                    varying vec3 vWorldPos;
                    void main() {
                        float h = normalize(vWorldPos).y * 0.5 + 0.5;
                        gl_FragColor = vec4(mix(bottomColor, topColor, h), 1.0);
                    }
                `,
                side: THREE.BackSide
            });
            this.scene.add(new THREE.Mesh(skyGeo, skyMat));

            window.addEventListener('resize', () => this._onResize(container));
        },

        _onResize(container) {
            if (!this.camera || !this.renderer) return;
            this.camera.aspect = container.clientWidth / container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(container.clientWidth, container.clientHeight);
        },

        // ── Build scene from DB data ──

        buildScene(surfaces, connectors, loci) {
            this.clearScene();
            surfaces.forEach(s => this._addSurface(s));
            connectors.forEach(c => this._addConnector(c));
            loci.forEach(l => this._addLocus(l));
        },

        clearScene() {
            this.surfaceMeshes.forEach(m => this.scene.remove(m));
            this.connectorMeshes.forEach(m => this.scene.remove(m));
            this.lociMeshes.forEach(m => this.scene.remove(m));
            this.surfaceMeshes = [];
            this.connectorMeshes = [];
            this.lociMeshes = [];
        },

        _getMaterial(matData) {
            const key = JSON.stringify(matData);
            if (this._materials[key]) return this._materials[key];
            const color = matData.color || '#888888';
            const opacity = matData.opacity != null ? matData.opacity : 1.0;
            const mat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(color),
                roughness: 0.7,
                metalness: 0.1,
                transparent: opacity < 1,
                opacity: opacity,
                side: THREE.DoubleSide
            });
            this._materials[key] = mat;
            return mat;
        },

        _addSurface(s) {
            const t = s.transform || { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] };
            const d = s.dimensions || { width: 4, height: 3 };
            const geo = new THREE.PlaneGeometry(d.width, d.height);
            const mat = this._getMaterial(s.material || {});
            const mesh = new THREE.Mesh(geo, mat);

            mesh.position.set(t.position[0], t.position[1], t.position[2]);
            mesh.rotation.set(
                t.rotation[0] * Math.PI / 180,
                t.rotation[1] * Math.PI / 180,
                t.rotation[2] * Math.PI / 180
            );
            if (t.scale) mesh.scale.set(t.scale[0], t.scale[1], t.scale[2]);

            // Floors face up by default
            if (s.type === 'floor' || s.type === 'ramp') {
                mesh.rotation.x = -Math.PI / 2 + (t.rotation[0] * Math.PI / 180);
            }

            mesh.receiveShadow = true;
            mesh.castShadow = true;
            mesh.userData = { dbType: 'surface', dbData: s, dbId: s.id };

            this.scene.add(mesh);
            this.surfaceMeshes.push(mesh);
            return mesh;
        },

        _addConnector(c) {
            const from = c.from_point.position || [0,0,0];
            const to = c.to_point.position || [0,0,0];
            const mat = this._getMaterial(c.material || { color: '#4488ff', opacity: 0.8 });

            if (c.type === 'bridge' || c.type === 'road') {
                // Spline-based path
                const points = [];
                if (c.path_points && c.path_points.length > 0) {
                    c.path_points.forEach(p => points.push(new THREE.Vector3(p[0], p[1], p[2])));
                } else {
                    points.push(new THREE.Vector3(from[0], from[1], from[2]));
                    // Auto-arc for bridges
                    const mid = [(from[0]+to[0])/2, Math.max(from[1], to[1]) + 2, (from[2]+to[2])/2];
                    points.push(new THREE.Vector3(mid[0], mid[1], mid[2]));
                    points.push(new THREE.Vector3(to[0], to[1], to[2]));
                }
                const curve = new THREE.CatmullRomCurve3(points);
                // Bridge deck (flat ribbon along spline)
                const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.5, 4, false);
                const mesh = new THREE.Mesh(tubeGeo, mat);
                mesh.userData = { dbType: 'connector', dbData: c, dbId: c.id };
                this.scene.add(mesh);
                this.connectorMeshes.push(mesh);

                // Walkable flat surface along the bridge
                const bridgePoints = curve.getPoints(40);
                const bridgeGeo = new THREE.BufferGeometry().setFromPoints(bridgePoints);
                const bridgeLine = new THREE.Line(bridgeGeo, new THREE.LineBasicMaterial({ color: 0x88aaff }));
                this.scene.add(bridgeLine);
                this.connectorMeshes.push(bridgeLine);
            } else if (c.type === 'elevator') {
                // Vertical shaft — translucent cylinder
                const height = Math.abs(to[1] - from[1]) || 3;
                const geo = new THREE.CylinderGeometry(0.6, 0.6, height, 8, 1, true);
                const shaftMat = new THREE.MeshStandardMaterial({
                    color: 0x4488ff, transparent: true, opacity: 0.2, side: THREE.DoubleSide
                });
                const mesh = new THREE.Mesh(geo, shaftMat);
                mesh.position.set(from[0], (from[1] + to[1]) / 2, from[2]);
                mesh.userData = { dbType: 'connector', dbData: c, dbId: c.id, connectorType: 'elevator' };
                this.scene.add(mesh);
                this.connectorMeshes.push(mesh);
                // Platform indicator
                const platGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 8);
                const platMat = new THREE.MeshStandardMaterial({ color: 0x66aaff, emissive: 0x224488 });
                const platBottom = new THREE.Mesh(platGeo, platMat);
                platBottom.position.set(from[0], from[1], from[2]);
                this.scene.add(platBottom);
                this.connectorMeshes.push(platBottom);
            } else if (c.type === 'ladder') {
                // Series of rungs
                const height = Math.abs(to[1] - from[1]) || 3;
                const rungs = Math.floor(height / 0.3);
                const group = new THREE.Group();
                const rungGeo = new THREE.BoxGeometry(0.6, 0.04, 0.08);
                const rungMat = new THREE.MeshStandardMaterial({ color: 0x886644 });
                for (let i = 0; i < rungs; i++) {
                    const rung = new THREE.Mesh(rungGeo, rungMat);
                    rung.position.y = from[1] + (i * 0.3);
                    group.add(rung);
                }
                group.position.set(from[0], 0, from[2]);
                group.userData = { dbType: 'connector', dbData: c, dbId: c.id };
                this.scene.add(group);
                this.connectorMeshes.push(group);
            } else if (c.type === 'stairs') {
                const steps = 10;
                const dx = (to[0] - from[0]) / steps;
                const dy = (to[1] - from[1]) / steps;
                const dz = (to[2] - from[2]) / steps;
                const group = new THREE.Group();
                const stepGeo = new THREE.BoxGeometry(1.2, 0.15, 0.4);
                const stepMat = this._getMaterial(c.material || { color: '#777777' });
                for (let i = 0; i < steps; i++) {
                    const step = new THREE.Mesh(stepGeo, stepMat);
                    step.position.set(from[0] + dx * i, from[1] + dy * i, from[2] + dz * i);
                    step.castShadow = true;
                    step.receiveShadow = true;
                    group.add(step);
                }
                group.userData = { dbType: 'connector', dbData: c, dbId: c.id };
                this.scene.add(group);
                this.connectorMeshes.push(group);
            } else if (c.type === 'portal') {
                // Glowing ring at each end
                const ringGeo = new THREE.TorusGeometry(0.8, 0.08, 8, 32);
                const ringMat = new THREE.MeshStandardMaterial({
                    color: 0xff44ff, emissive: 0x880088, emissiveIntensity: 2
                });
                const ring1 = new THREE.Mesh(ringGeo, ringMat);
                ring1.position.set(from[0], from[1] + 1, from[2]);
                ring1.userData = { dbType: 'connector', dbData: c, dbId: c.id, portalEnd: 'from' };
                this.scene.add(ring1);
                this.connectorMeshes.push(ring1);

                const ring2 = new THREE.Mesh(ringGeo, ringMat.clone());
                ring2.position.set(to[0], to[1] + 1, to[2]);
                ring2.userData = { dbType: 'connector', dbData: c, dbId: c.id, portalEnd: 'to' };
                this.scene.add(ring2);
                this.connectorMeshes.push(ring2);
            }
        },

        _addLocus(l) {
            const pos = l.position || [0, 1, 0];
            let mesh;

            switch (l.marker_type) {
                case 'pedestal': {
                    const group = new THREE.Group();
                    const baseGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8);
                    const baseMat = new THREE.MeshStandardMaterial({ color: 0x666677 });
                    const base = new THREE.Mesh(baseGeo, baseMat);
                    base.position.y = 0.4;
                    group.add(base);
                    const topGeo = new THREE.CylinderGeometry(0.3, 0.2, 0.05, 8);
                    const top = new THREE.Mesh(topGeo, baseMat);
                    top.position.y = 0.82;
                    group.add(top);
                    group.position.set(pos[0], pos[1], pos[2]);
                    mesh = group;
                    break;
                }
                case 'frame': {
                    const shape = new THREE.Shape();
                    shape.moveTo(-0.4, -0.3);
                    shape.lineTo(0.4, -0.3);
                    shape.lineTo(0.4, 0.3);
                    shape.lineTo(-0.4, 0.3);
                    shape.lineTo(-0.4, -0.3);
                    const hole = new THREE.Path();
                    hole.moveTo(-0.35, -0.25);
                    hole.lineTo(0.35, -0.25);
                    hole.lineTo(0.35, 0.25);
                    hole.lineTo(-0.35, 0.25);
                    hole.lineTo(-0.35, -0.25);
                    shape.holes.push(hole);
                    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false });
                    const mat = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
                    mesh = new THREE.Mesh(geo, mat);
                    mesh.position.set(pos[0], pos[1], pos[2]);
                    break;
                }
                case 'door': {
                    const geo = new THREE.BoxGeometry(0.9, 2, 0.08);
                    const mat = new THREE.MeshStandardMaterial({ color: 0x654321 });
                    mesh = new THREE.Mesh(geo, mat);
                    mesh.position.set(pos[0], pos[1] + 1, pos[2]);
                    break;
                }
                case 'statue': {
                    const group = new THREE.Group();
                    // Simple abstract statue: stacked shapes
                    const bodyGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.0, 6);
                    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
                    const body = new THREE.Mesh(bodyGeo, bodyMat);
                    body.position.y = 0.5;
                    group.add(body);
                    const headGeo = new THREE.SphereGeometry(0.15, 8, 8);
                    const head = new THREE.Mesh(headGeo, bodyMat);
                    head.position.y = 1.15;
                    group.add(head);
                    group.position.set(pos[0], pos[1], pos[2]);
                    mesh = group;
                    break;
                }
                case 'glow': {
                    const geo = new THREE.SphereGeometry(0.15, 16, 16);
                    const mat = new THREE.MeshStandardMaterial({
                        color: 0x44ffaa, emissive: 0x22aa66, emissiveIntensity: 3,
                        transparent: true, opacity: 0.7
                    });
                    mesh = new THREE.Mesh(geo, mat);
                    mesh.position.set(pos[0], pos[1], pos[2]);
                    // Point light for actual glow
                    const light = new THREE.PointLight(0x44ffaa, 1, 5);
                    light.position.copy(mesh.position);
                    this.scene.add(light);
                    break;
                }
                default: { // 'orb'
                    const geo = new THREE.SphereGeometry(0.18, 16, 16);
                    const mat = new THREE.MeshStandardMaterial({
                        color: 0x6688ff, emissive: 0x2244aa, emissiveIntensity: 1.5,
                        transparent: true, opacity: 0.85
                    });
                    mesh = new THREE.Mesh(geo, mat);
                    mesh.position.set(pos[0], pos[1], pos[2]);
                    break;
                }
            }

            mesh.userData = { dbType: 'locus', dbData: l, dbId: l.id };
            this.scene.add(mesh);
            this.lociMeshes.push(mesh);
            return mesh;
        },

        // ── Export scene data back to DB format ──

        exportSceneData() {
            const surfaces = this.surfaceMeshes.map(m => {
                const d = m.userData.dbData || {};
                return {
                    type: d.type || 'floor',
                    transform: {
                        position: [m.position.x, m.position.y, m.position.z],
                        rotation: [
                            m.rotation.x * 180 / Math.PI,
                            m.rotation.y * 180 / Math.PI,
                            m.rotation.z * 180 / Math.PI
                        ],
                        scale: [m.scale.x, m.scale.y, m.scale.z]
                    },
                    dimensions: d.dimensions || { width: 4, height: 3 },
                    material: d.material || { color: '#888888' },
                    label: d.label,
                    sort_order: d.sort_order || 0
                };
            });
            const connectors = this.connectorMeshes
                .filter(m => m.userData.dbType === 'connector')
                .map(m => m.userData.dbData || {});
            const loci = this.lociMeshes.map(m => {
                const d = m.userData.dbData || {};
                const pos = m.position || m.children?.[0]?.parent?.position;
                return {
                    surface_id: d.surface_id,
                    position: [
                        pos ? pos.x : 0,
                        pos ? pos.y : 1,
                        pos ? pos.z : 0
                    ],
                    marker_type: d.marker_type || 'orb',
                    marker_settings: d.marker_settings || {},
                    card_ids: d.card_ids || [],
                    label: d.label
                };
            });
            return { surfaces, connectors, loci };
        },

        // ── Animation loop ──

        animate() {
            this.animFrameId = requestAnimationFrame(() => this.animate());
            const delta = this.clock.getDelta();

            // Animate loci (gentle bob)
            const t = this.clock.getElapsedTime();
            this.lociMeshes.forEach((m, i) => {
                if (m.userData.dbData?.marker_type === 'orb' || m.userData.dbData?.marker_type === 'glow') {
                    m.position.y = (m.userData.dbData.position?.[1] || 1) + Math.sin(t * 2 + i) * 0.05;
                }
            });

            // Walker update
            if (RC.PalaceWalker && RC.PalaceWalker.update) {
                RC.PalaceWalker.update(delta);
            }

            // Traversal update
            if (RC.PalaceTraverse && RC.PalaceTraverse.update) {
                RC.PalaceTraverse.update(delta);
            }

            this.renderer.render(this.scene, this.camera);
        },

        dispose() {
            if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
            this.clearScene();
            if (this.renderer) {
                this.renderer.domElement.remove();
                this.renderer.dispose();
            }
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this._materials = {};
        }
    };

    RC.PalaceRenderer = PR;
})();
