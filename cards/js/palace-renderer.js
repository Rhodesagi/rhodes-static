/**
 * RhodesCards Memory Palace — Three.js Renderer v2
 *
 * PBR + HDRI + GLB props + post-processing. r137 addons required.
 *
 * v2 template shape (see memory/reference-palace-v2-schema.md):
 *   { meta, environment, materials, surfaces, props, connectors, loci }
 *
 * Backward compat: v1 DB shape { surfaces, connectors, loci } still renders
 * via fallback environment (procedural sky + grass ground).
 */
(function() {
    'use strict';

    const PR = {
        scene: null,
        camera: null,
        renderer: null,
        composer: null,            // EffectComposer (desktop only)
        clock: null,
        animFrameId: null,
        container: null,

        // Scene object groups for easy iteration
        surfaceMeshes: [],
        connectorMeshes: [],
        lociMeshes: [],
        propMeshes: [],

        // Resource caches (per-session)
        _materialLib: {},          // name -> MeshStandardMaterial
        _textureCache: {},         // url -> THREE.Texture
        _gltfCache: {},            // url -> THREE.Group (to clone)
        _hdrCache: {},             // url -> PMREM envMap
        _legacyMaterials: {},      // JSON(matObj) -> MeshStandardMaterial (v1 path)

        _pmremGen: null,
        _gltfLoader: null,
        _rgbeLoader: null,
        _texLoader: null,

        _sunLight: null,
        _hemiLight: null,
        _ambientLight: null,
        _groundMesh: null,
        _plazaMesh: null,
        _skyMesh: null,             // procedural fallback
        _mobile: false,

        // ─────────────────────────────────────────────
        // Init
        // ─────────────────────────────────────────────
        init(canvasId, opts) {
            opts = opts || {};
            const container = document.getElementById(canvasId);
            if (!container) return;
            this.container = container;

            this._mobile = this._detectMobile();

            this.clock = new THREE.Clock();
            this.scene = new THREE.Scene();

            // Camera
            this.camera = new THREE.PerspectiveCamera(
                75,
                container.clientWidth / container.clientHeight,
                0.1,
                1200
            );
            this.camera.position.set(0, 1.6, 0);

            // WebGL renderer — PBR-correct output, ACES tone mapping
            this.renderer = new THREE.WebGLRenderer({
                antialias: !this._mobile,
                powerPreference: this._mobile ? 'low-power' : 'high-performance',
                preserveDrawingBuffer: false,
            });
            this.renderer.setSize(container.clientWidth, container.clientHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this._mobile ? 1.5 : 2));
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.0;
            this.renderer.physicallyCorrectLights = true;
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = this._mobile
                ? THREE.PCFShadowMap
                : THREE.PCFSoftShadowMap;
            container.appendChild(this.renderer.domElement);

            // Loaders
            this._texLoader = new THREE.TextureLoader();
            this._rgbeLoader = new THREE.RGBELoader();
            this._gltfLoader = new THREE.GLTFLoader();
            this._pmremGen = new THREE.PMREMGenerator(this.renderer);
            this._pmremGen.compileEquirectangularShader();

            // Default lighting — templates can override these via environment block
            this._installDefaultLighting();

            // Fallback environment: procedural sky + grass ground (for v1 palaces
            // without HDRI). Replaced/hidden when a template sets environment.hdri.
            this._installFallbackSky();
            this._installFallbackGround();

            // Post-processing (desktop only)
            if (!this._mobile && opts.postProcessing !== false) {
                this._setupPostProcessing();
            }

            window.addEventListener('resize', () => this._onResize());
        },

        _detectMobile() {
            const w = window.innerWidth;
            const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
            const smallScreen = w < 900;
            const ua = navigator.userAgent || '';
            const mobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
            return mobileUA || (touch && smallScreen);
        },

        _installDefaultLighting() {
            this._ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
            this.scene.add(this._ambientLight);

            this._sunLight = new THREE.DirectionalLight(0xffeedd, 2.5);
            this._sunLight.position.set(60, 100, 40);
            this._sunLight.castShadow = true;
            this._sunLight.shadow.mapSize.width = this._mobile ? 1024 : 2048;
            this._sunLight.shadow.mapSize.height = this._mobile ? 1024 : 2048;
            this._sunLight.shadow.camera.near = 1;
            this._sunLight.shadow.camera.far = 400;
            this._sunLight.shadow.camera.left = -100;
            this._sunLight.shadow.camera.right = 100;
            this._sunLight.shadow.camera.top = 100;
            this._sunLight.shadow.camera.bottom = -100;
            this._sunLight.shadow.bias = -0.0002;
            this.scene.add(this._sunLight);
            this.scene.add(this._sunLight.target);

            this._hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x6b8e4e, 0.35);
            this.scene.add(this._hemiLight);
        },

        _installFallbackSky() {
            const skyGeo = new THREE.SphereGeometry(800, 32, 24);
            const skyMat = new THREE.ShaderMaterial({
                uniforms: {
                    topColor: { value: new THREE.Color(0x4a90c8) },
                    bottomColor: { value: new THREE.Color(0xc8e0f0) },
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
                        h = pow(h, 0.7);
                        gl_FragColor = vec4(mix(bottomColor, topColor, h), 1.0);
                    }
                `,
                side: THREE.BackSide,
                depthWrite: false,
            });
            this._skyMesh = new THREE.Mesh(skyGeo, skyMat);
            this.scene.add(this._skyMesh);
            this.scene.background = new THREE.Color(0xc8e0f0);
            this.scene.fog = new THREE.Fog(0xb8d4e8, 80, 500);
        },

        _installFallbackGround() {
            const groundGeo = new THREE.PlaneGeometry(1000, 1000);
            const groundMat = new THREE.MeshStandardMaterial({
                color: 0x5a8a3c,
                roughness: 0.95,
                metalness: 0,
            });
            this._groundMesh = new THREE.Mesh(groundGeo, groundMat);
            this._groundMesh.rotation.x = -Math.PI / 2;
            this._groundMesh.position.y = -0.05;
            this._groundMesh.receiveShadow = true;
            this.scene.add(this._groundMesh);
        },

        _setupPostProcessing() {
            if (typeof THREE.EffectComposer !== 'function') {
                console.warn('[PR] EffectComposer not loaded; skipping post-processing');
                return;
            }
            this.composer = new THREE.EffectComposer(this.renderer);
            this.composer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            const renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);

            if (typeof THREE.SSAOPass === 'function') {
                const ssao = new THREE.SSAOPass(
                    this.scene, this.camera,
                    this.container.clientWidth, this.container.clientHeight
                );
                ssao.kernelRadius = 8;
                ssao.minDistance = 0.005;
                ssao.maxDistance = 0.08;
                this.composer.addPass(ssao);
            }

            if (typeof THREE.UnrealBloomPass === 'function') {
                const bloom = new THREE.UnrealBloomPass(
                    new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
                    0.35,  // strength
                    0.6,   // radius
                    0.85   // threshold
                );
                this.composer.addPass(bloom);
            }
        },

        _onResize() {
            if (!this.camera || !this.renderer || !this.container) return;
            const w = this.container.clientWidth;
            const h = this.container.clientHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
            if (this.composer) this.composer.setSize(w, h);
        },

        // ─────────────────────────────────────────────
        // v2 template entrypoint
        // ─────────────────────────────────────────────
        /**
         * Load a v2 template object. Returns a Promise that resolves when
         * all assets (HDRI, textures, GLBs) are loaded and the scene is ready.
         *
         * Accepts either v2 shape {meta, environment, materials, surfaces, props, connectors, loci}
         * or legacy {surfaces, connectors, loci}.
         */
        async loadTemplate(tmpl) {
            if (!tmpl) return;
            this.clearScene();

            const isV2 = !!(tmpl.meta || tmpl.environment || tmpl.materials || tmpl.props);

            if (isV2) {
                // 1. Environment (HDRI + sun override)
                if (tmpl.environment) {
                    await this._applyEnvironment(tmpl.environment);
                }
                // 2. Material library
                if (tmpl.materials) {
                    await this._loadMaterialLibrary(tmpl.materials);
                }
                // 3. Surfaces (reference materials by string key)
                (tmpl.surfaces || []).forEach(s => this._addSurface(s));
                // 4. Props (GLB instances)
                if (tmpl.props && tmpl.props.length) {
                    await this._loadProps(tmpl.props);
                }
            } else {
                // Legacy v1 path
                (tmpl.surfaces || []).forEach(s => this._addSurface(s));
            }

            // 5. Connectors + loci (same shape in v1 and v2)
            (tmpl.connectors || []).forEach(c => this._addConnector(c));
            (tmpl.loci || []).forEach(l => this._addLocus(l));

            // 6. Apply spawn point to camera
            const spawn = tmpl.meta?.spawn_point || tmpl.spawn_point;
            if (spawn && spawn.position) {
                this.camera.position.set(spawn.position[0], spawn.position[1], spawn.position[2]);
                if (spawn.rotation_y != null) {
                    this.camera.rotation.y = spawn.rotation_y * Math.PI / 180;
                }
            }
        },

        // Legacy entrypoint kept for any caller that still passes raw arrays
        buildScene(surfaces, connectors, loci) {
            return this.loadTemplate({ surfaces, connectors, loci });
        },

        clearScene() {
            [this.surfaceMeshes, this.connectorMeshes, this.lociMeshes, this.propMeshes].forEach(group => {
                group.forEach(m => this.scene.remove(m));
                group.length = 0;
            });
            // Invalidate per-template material lib so next template gets fresh
            this._materialLib = {};
        },

        // ─────────────────────────────────────────────
        // Environment (HDRI + lights)
        // ─────────────────────────────────────────────
        async _applyEnvironment(env) {
            // Fog
            if (env.fog) {
                this.scene.fog = new THREE.Fog(env.fog.color, env.fog.near, env.fog.far);
            }
            // Ambient
            if (env.ambient && this._ambientLight) {
                this._ambientLight.intensity = env.ambient.intensity ?? 0.1;
                if (env.ambient.color) this._ambientLight.color.set(env.ambient.color);
            }
            // Sun
            if (env.sun && this._sunLight) {
                if (env.sun.position) this._sunLight.position.set(...env.sun.position);
                if (env.sun.intensity != null) this._sunLight.intensity = env.sun.intensity;
                if (env.sun.color) this._sunLight.color.set(env.sun.color);
                if (env.sun.cast_shadow != null) this._sunLight.castShadow = env.sun.cast_shadow;
                if (env.sun.shadow_bounds) {
                    const b = env.sun.shadow_bounds;
                    this._sunLight.shadow.camera.left = -b;
                    this._sunLight.shadow.camera.right = b;
                    this._sunLight.shadow.camera.top = b;
                    this._sunLight.shadow.camera.bottom = -b;
                    this._sunLight.shadow.camera.updateProjectionMatrix();
                }
            }

            // HDRI
            if (env.hdri) {
                // Mobile fallback: swap _2k.hdr for _1k.hdr path
                let url = env.hdri;
                if (this._mobile) url = url.replace('_2k.hdr', '_1k.hdr').replace('/2k/', '/1k/');
                try {
                    const envMap = await this._loadHDRI(url);
                    this.scene.environment = envMap;
                    if (env.hdri_as_background !== false) {
                        this.scene.background = envMap;
                        // Hide procedural sky when HDRI is backgrounded
                        if (this._skyMesh) this._skyMesh.visible = false;
                    }
                    if (env.hdri_intensity != null) {
                        this.renderer.toneMappingExposure = env.hdri_intensity;
                    }
                } catch (e) {
                    console.warn('[PR] HDRI load failed, keeping procedural sky:', e);
                }
            }

            // Templates that specify their own ground hide the fallback
            if (env.hide_fallback_ground && this._groundMesh) {
                this._groundMesh.visible = false;
            }
        },

        _loadHDRI(url) {
            if (this._hdrCache[url]) return Promise.resolve(this._hdrCache[url]);
            return new Promise((resolve, reject) => {
                this._rgbeLoader.load(
                    url,
                    (tex) => {
                        const envMap = this._pmremGen.fromEquirectangular(tex).texture;
                        tex.dispose();
                        this._hdrCache[url] = envMap;
                        resolve(envMap);
                    },
                    undefined,
                    reject
                );
            });
        },

        // ─────────────────────────────────────────────
        // PBR material library
        // ─────────────────────────────────────────────
        async _loadMaterialLibrary(mats) {
            const names = Object.keys(mats);
            await Promise.all(names.map(name => this._buildPBRMaterial(name, mats[name])));
        },

        async _buildPBRMaterial(name, spec) {
            const repeat = spec.repeat || [1, 1];

            const loadMap = (url, isColor) => {
                if (!url) return Promise.resolve(null);
                if (this._textureCache[url]) return Promise.resolve(this._textureCache[url]);
                return new Promise((resolve) => {
                    this._texLoader.load(
                        url,
                        (tex) => {
                            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                            tex.repeat.set(repeat[0], repeat[1]);
                            if (isColor) tex.encoding = THREE.sRGBEncoding;
                            tex.anisotropy = this._mobile ? 4 : 8;
                            this._textureCache[url] = tex;
                            resolve(tex);
                        },
                        undefined,
                        () => {
                            console.warn('[PR] texture failed:', url);
                            resolve(null);
                        }
                    );
                });
            };

            const [albedo, normal, rough, ao] = await Promise.all([
                loadMap(spec.albedo, true),
                loadMap(spec.normal, false),
                loadMap(spec.roughness, false),
                loadMap(spec.ao, false),
            ]);

            const mat = new THREE.MeshStandardMaterial({
                map: albedo,
                normalMap: normal,
                roughnessMap: rough,
                aoMap: ao,
                roughness: spec.roughness_scale != null ? spec.roughness_scale : 1.0,
                metalness: spec.metalness != null ? spec.metalness : 0.0,
                color: spec.color_tint != null ? new THREE.Color(spec.color_tint) : 0xffffff,
                side: THREE.FrontSide,
            });
            if (spec.emissive) mat.emissive = new THREE.Color(spec.emissive);
            if (spec.emissive_intensity) mat.emissiveIntensity = spec.emissive_intensity;

            this._materialLib[name] = mat;
            return mat;
        },

        _resolveMaterial(ref) {
            // v2 string key
            if (typeof ref === 'string') {
                if (this._materialLib[ref]) return this._materialLib[ref];
                console.warn('[PR] unknown material key:', ref);
                return this._fallbackMaterial(0x888888);
            }
            // v1 object { color, texture, ... }
            if (ref && typeof ref === 'object') {
                const key = JSON.stringify(ref);
                if (this._legacyMaterials[key]) return this._legacyMaterials[key];
                const color = ref.color || '#888888';
                const opacity = ref.opacity != null ? ref.opacity : 1.0;
                const mat = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(color),
                    roughness: ref.roughness != null ? ref.roughness : 0.85,
                    metalness: ref.metalness != null ? ref.metalness : 0.05,
                    transparent: opacity < 1,
                    opacity: opacity,
                    side: THREE.FrontSide,
                });
                this._legacyMaterials[key] = mat;
                return mat;
            }
            return this._fallbackMaterial();
        },

        _fallbackMaterial(color) {
            return new THREE.MeshStandardMaterial({
                color: color || 0x888888,
                roughness: 0.9,
                metalness: 0,
            });
        },

        // ─────────────────────────────────────────────
        // GLB props
        // ─────────────────────────────────────────────
        async _loadProps(props) {
            // Group by glb URL for batch loading
            const byUrl = {};
            props.forEach(p => {
                (byUrl[p.glb] = byUrl[p.glb] || []).push(p);
            });

            await Promise.all(Object.keys(byUrl).map(async (url) => {
                const root = await this._loadGLB(url);
                if (!root) return;
                byUrl[url].forEach(p => this._instantiateProp(root, p));
            }));
        },

        _loadGLB(url) {
            if (this._gltfCache[url]) return Promise.resolve(this._gltfCache[url]);
            return new Promise((resolve) => {
                this._gltfLoader.load(
                    url,
                    (gltf) => {
                        const root = gltf.scene;
                        // Ensure all meshes cast/receive shadows by default
                        root.traverse(obj => {
                            if (obj.isMesh) {
                                obj.castShadow = true;
                                obj.receiveShadow = true;
                                if (obj.material && obj.material.map) {
                                    obj.material.map.encoding = THREE.sRGBEncoding;
                                }
                            }
                        });
                        this._gltfCache[url] = root;
                        resolve(root);
                    },
                    undefined,
                    (err) => {
                        console.warn('[PR] GLB load failed:', url, err);
                        resolve(null);
                    }
                );
            });
        },

        _instantiateProp(rootGroup, p) {
            const clone = rootGroup.clone(true);
            const t = p.transform || { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] };
            clone.position.set(...(t.position || [0,0,0]));
            const rot = t.rotation || [0,0,0];
            clone.rotation.set(
                rot[0] * Math.PI / 180,
                rot[1] * Math.PI / 180,
                rot[2] * Math.PI / 180
            );
            const sc = t.scale;
            if (Array.isArray(sc)) clone.scale.set(sc[0], sc[1], sc[2]);
            else if (typeof sc === 'number') clone.scale.set(sc, sc, sc);

            if (p.material_override && this._materialLib[p.material_override]) {
                const mat = this._materialLib[p.material_override];
                clone.traverse(obj => {
                    if (obj.isMesh) obj.material = mat;
                });
            }
            if (p.cast_shadow === false || p.receive_shadow === false) {
                clone.traverse(obj => {
                    if (obj.isMesh) {
                        if (p.cast_shadow === false) obj.castShadow = false;
                        if (p.receive_shadow === false) obj.receiveShadow = false;
                    }
                });
            }
            clone.userData = { dbType: 'prop', dbData: p };
            this.scene.add(clone);
            this.propMeshes.push(clone);
            return clone;
        },

        // ─────────────────────────────────────────────
        // Surfaces (primitives — floors, walls, ceilings, roofs)
        // ─────────────────────────────────────────────
        _addSurface(s) {
            const t = s.transform || { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] };
            const d = s.dimensions || { width: 4, height: 3 };
            const mat = this._resolveMaterial(s.material);
            let mesh;

            if (s.type === 'wall') {
                const wallH = d.height || 3;
                const thick = d.depth || 0.3;
                const geo = new THREE.BoxGeometry(d.width || 4, wallH, thick);
                mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(t.position[0], (t.position[1] || 0) + wallH / 2, t.position[2]);
                mesh.rotation.set(
                    (t.rotation[0] || 0) * Math.PI / 180,
                    (t.rotation[1] || 0) * Math.PI / 180,
                    (t.rotation[2] || 0) * Math.PI / 180
                );
            } else if (s.type === 'ceiling') {
                const thick = d.depth || 0.15;
                const geo = new THREE.BoxGeometry(d.width || 4, thick, d.height || 4);
                mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(t.position[0], t.position[1], t.position[2]);
                mesh.rotation.set(
                    (t.rotation[0] || 0) * Math.PI / 180,
                    (t.rotation[1] || 0) * Math.PI / 180,
                    (t.rotation[2] || 0) * Math.PI / 180
                );
            } else if (s.type === 'roof') {
                // Sloped roof: box with a pitched rotation, material usually terracotta
                const thick = d.depth || 0.25;
                const geo = new THREE.BoxGeometry(d.width || 4, thick, d.height || 4);
                mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(t.position[0], t.position[1], t.position[2]);
                mesh.rotation.set(
                    (t.rotation[0] || 0) * Math.PI / 180,
                    (t.rotation[1] || 0) * Math.PI / 180,
                    (t.rotation[2] || 0) * Math.PI / 180
                );
            } else {
                // Floor / ramp — a thick slab (not a plane) for proper shadows + AO
                const thick = d.depth || 0.2;
                const geo = new THREE.BoxGeometry(d.width || 4, thick, d.height || 4);
                mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(t.position[0], (t.position[1] || 0) - thick / 2, t.position[2]);
                mesh.rotation.set(
                    (t.rotation[0] || 0) * Math.PI / 180,
                    (t.rotation[1] || 0) * Math.PI / 180,
                    (t.rotation[2] || 0) * Math.PI / 180
                );
                if (t.scale) mesh.scale.set(t.scale[0], t.scale[1], t.scale[2]);
            }

            mesh.receiveShadow = true;
            mesh.castShadow = true;
            mesh.userData = { dbType: 'surface', dbData: s, dbId: s.id };

            this.scene.add(mesh);
            this.surfaceMeshes.push(mesh);
            return mesh;
        },

        // ─────────────────────────────────────────────
        // Connectors (stairs, bridges, elevators, ladders, portals)
        // ─────────────────────────────────────────────
        _addConnector(c) {
            const from = c.from_point?.position || [0,0,0];
            const to = c.to_point?.position || [0,0,0];
            const matRef = c.material || { color: '#8a7b66' };
            const mat = this._resolveMaterial(matRef);

            if (c.type === 'bridge' || c.type === 'road') {
                const points = [];
                if (c.path_points && c.path_points.length > 0) {
                    c.path_points.forEach(p => points.push(new THREE.Vector3(p[0], p[1], p[2])));
                } else {
                    points.push(new THREE.Vector3(from[0], from[1], from[2]));
                    const mid = [(from[0]+to[0])/2, Math.max(from[1], to[1]) + 1, (from[2]+to[2])/2];
                    points.push(new THREE.Vector3(mid[0], mid[1], mid[2]));
                    points.push(new THREE.Vector3(to[0], to[1], to[2]));
                }
                const curve = new THREE.CatmullRomCurve3(points);
                const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.6, 6, false);
                const mesh = new THREE.Mesh(tubeGeo, mat);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.userData = { dbType: 'connector', dbData: c, dbId: c.id };
                this.scene.add(mesh);
                this.connectorMeshes.push(mesh);
            } else if (c.type === 'stairs') {
                const steps = 14;
                const dx = (to[0] - from[0]) / steps;
                const dy = (to[1] - from[1]) / steps;
                const dz = (to[2] - from[2]) / steps;
                const group = new THREE.Group();
                const stepGeo = new THREE.BoxGeometry(1.4, 0.18, 0.45);
                for (let i = 0; i < steps; i++) {
                    const step = new THREE.Mesh(stepGeo, mat);
                    step.position.set(from[0] + dx * i, from[1] + dy * i, from[2] + dz * i);
                    step.castShadow = true;
                    step.receiveShadow = true;
                    group.add(step);
                }
                group.userData = { dbType: 'connector', dbData: c, dbId: c.id };
                this.scene.add(group);
                this.connectorMeshes.push(group);
            } else if (c.type === 'elevator') {
                // Multi-floor elevator: c.stops = [{y, label}, ...] OR legacy from/to pair
                const stops = c.stops || [
                    { y: from[1], label: c.from_label || 'Lower' },
                    { y: to[1], label: c.to_label || 'Upper' },
                ];
                const shaftX = c.position ? c.position[0] : from[0];
                const shaftZ = c.position ? c.position[1] : from[2];
                const minY = Math.min(...stops.map(s => s.y));
                const maxY = Math.max(...stops.map(s => s.y));
                const height = maxY - minY || 3;
                // Translucent oval shaft — scale X wider than Z for oval cross-section
                const geo = new THREE.CylinderGeometry(1.2, 1.2, height + 2, 24, 1, true);
                const shaftMat = new THREE.MeshStandardMaterial({
                    color: 0xccddee, transparent: true, opacity: 0.12, side: THREE.DoubleSide,
                    roughness: 0.02, metalness: 0.98,
                });
                const mesh = new THREE.Mesh(geo, shaftMat);
                mesh.position.set(shaftX, (minY + maxY) / 2 + 1, shaftZ);
                mesh.scale.set(1.4, 1, 0.9); // oval: wider on X, narrower on Z
                // Store resolved stops for interaction
                mesh.userData = { dbType: 'connector', dbData: c, dbId: c.id, connectorType: 'elevator',
                                  elevatorStops: stops, elevatorX: shaftX, elevatorZ: shaftZ };
                this.scene.add(mesh);
                this.connectorMeshes.push(mesh);
                // Floor indicator rings at each stop (oval to match shaft)
                stops.forEach((stop) => {
                    const ringGeo = new THREE.TorusGeometry(1.2, 0.06, 8, 32);
                    const ringMat = new THREE.MeshStandardMaterial({
                        color: 0x88ccff, emissive: 0x2266aa, emissiveIntensity: 1.5,
                        roughness: 0.2, metalness: 0.8,
                    });
                    const ring = new THREE.Mesh(ringGeo, ringMat);
                    ring.rotation.x = Math.PI / 2;
                    ring.position.set(shaftX, stop.y + 0.1, shaftZ);
                    ring.scale.set(1.4, 0.9, 1); // oval to match shaft
                    ring.userData = { dbType: 'connector', dbData: c, dbId: c.id, connectorType: 'elevator',
                                     elevatorStops: stops, elevatorX: shaftX, elevatorZ: shaftZ };
                    this.scene.add(ring);
                    this.connectorMeshes.push(ring);
                });
            } else if (c.type === 'ladder') {
                const height = Math.abs(to[1] - from[1]) || 3;
                const rungs = Math.max(1, Math.floor(height / 0.3));
                const group = new THREE.Group();
                const rungGeo = new THREE.BoxGeometry(0.6, 0.04, 0.08);
                const rungMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.8 });
                for (let i = 0; i < rungs; i++) {
                    const rung = new THREE.Mesh(rungGeo, rungMat);
                    rung.position.y = from[1] + (i * 0.3);
                    rung.castShadow = true;
                    group.add(rung);
                }
                group.position.set(from[0], 0, from[2]);
                group.userData = { dbType: 'connector', dbData: c, dbId: c.id };
                this.scene.add(group);
                this.connectorMeshes.push(group);
            } else if (c.type === 'portal') {
                const ringGeo = new THREE.TorusGeometry(0.9, 0.1, 12, 48);
                const ringMat = new THREE.MeshStandardMaterial({
                    color: 0xffccff, emissive: 0x880088, emissiveIntensity: 2.5,
                    roughness: 0.3, metalness: 0.5,
                });
                const ring1 = new THREE.Mesh(ringGeo, ringMat);
                ring1.position.set(from[0], from[1] + 1, from[2]);
                ring1.userData = { dbType: 'connector', dbData: c, dbId: c.id, portalEnd: 'from' };
                this.scene.add(ring1);
                this.connectorMeshes.push(ring1);
                const ring2 = new THREE.Mesh(ringGeo, ringMat);
                ring2.position.set(to[0], to[1] + 1, to[2]);
                ring2.userData = { dbType: 'connector', dbData: c, dbId: c.id, portalEnd: 'to' };
                this.scene.add(ring2);
                this.connectorMeshes.push(ring2);
            }
        },

        // ─────────────────────────────────────────────
        // Loci (memory markers)
        // ─────────────────────────────────────────────
        _addLocus(l) {
            const pos = l.position || [0, 1, 0];
            let mesh;

            switch (l.marker_type) {
                case 'pedestal': {
                    const group = new THREE.Group();
                    const baseGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.9, 12);
                    const baseMat = new THREE.MeshStandardMaterial({ color: 0xd0c8b8, roughness: 0.6, metalness: 0.05 });
                    const base = new THREE.Mesh(baseGeo, baseMat);
                    base.position.y = 0.45;
                    base.castShadow = true;
                    base.receiveShadow = true;
                    group.add(base);
                    const topGeo = new THREE.CylinderGeometry(0.32, 0.22, 0.06, 12);
                    const top = new THREE.Mesh(topGeo, baseMat);
                    top.position.y = 0.93;
                    top.castShadow = true;
                    group.add(top);
                    group.position.set(pos[0], pos[1], pos[2]);
                    mesh = group;
                    break;
                }
                case 'frame': {
                    const shape = new THREE.Shape();
                    shape.moveTo(-0.45, -0.32);
                    shape.lineTo(0.45, -0.32);
                    shape.lineTo(0.45, 0.32);
                    shape.lineTo(-0.45, 0.32);
                    shape.lineTo(-0.45, -0.32);
                    const hole = new THREE.Path();
                    hole.moveTo(-0.38, -0.26);
                    hole.lineTo(0.38, -0.26);
                    hole.lineTo(0.38, 0.26);
                    hole.lineTo(-0.38, 0.26);
                    hole.lineTo(-0.38, -0.26);
                    shape.holes.push(hole);
                    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1 });
                    const mat = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.4, metalness: 0.3 });
                    mesh = new THREE.Mesh(geo, mat);
                    mesh.position.set(pos[0], pos[1], pos[2]);
                    mesh.castShadow = true;
                    break;
                }
                case 'door': {
                    const geo = new THREE.BoxGeometry(1.0, 2.1, 0.1);
                    const mat = new THREE.MeshStandardMaterial({ color: 0x4a2f1a, roughness: 0.85, metalness: 0 });
                    mesh = new THREE.Mesh(geo, mat);
                    mesh.position.set(pos[0], pos[1] + 1.05, pos[2]);
                    mesh.castShadow = true;
                    break;
                }
                case 'statue': {
                    const group = new THREE.Group();
                    const mat = new THREE.MeshStandardMaterial({ color: 0xeeeae0, roughness: 0.4, metalness: 0.02 });
                    const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 1.1, 8);
                    const body = new THREE.Mesh(bodyGeo, mat);
                    body.position.y = 0.55;
                    body.castShadow = true;
                    group.add(body);
                    const headGeo = new THREE.SphereGeometry(0.17, 10, 10);
                    const head = new THREE.Mesh(headGeo, mat);
                    head.position.y = 1.28;
                    head.castShadow = true;
                    group.add(head);
                    group.position.set(pos[0], pos[1], pos[2]);
                    mesh = group;
                    break;
                }
                case 'glow': {
                    const geo = new THREE.SphereGeometry(0.16, 18, 18);
                    const mat = new THREE.MeshStandardMaterial({
                        color: 0xffd080, emissive: 0xff9040, emissiveIntensity: 3,
                        transparent: true, opacity: 0.85,
                    });
                    mesh = new THREE.Mesh(geo, mat);
                    mesh.position.set(pos[0], pos[1], pos[2]);
                    const light = new THREE.PointLight(0xffb060, 1.5, 6, 2);
                    light.position.copy(mesh.position);
                    this.scene.add(light);
                    break;
                }
                default: { // 'orb'
                    const geo = new THREE.SphereGeometry(0.19, 18, 18);
                    const mat = new THREE.MeshStandardMaterial({
                        color: 0x88aaff, emissive: 0x3366dd, emissiveIntensity: 1.8,
                        transparent: true, opacity: 0.9,
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

        // ─────────────────────────────────────────────
        // Export (editor roundtrip, v1 compat)
        // ─────────────────────────────────────────────
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
                        scale: [m.scale.x, m.scale.y, m.scale.z],
                    },
                    dimensions: d.dimensions || { width: 4, height: 3 },
                    material: d.material || { color: '#888888' },
                    label: d.label,
                    sort_order: d.sort_order || 0,
                };
            });
            const connectors = this.connectorMeshes
                .filter(m => m.userData.dbType === 'connector')
                .map(m => m.userData.dbData || {});
            const loci = this.lociMeshes.map(m => {
                const d = m.userData.dbData || {};
                const pos = m.position;
                return {
                    surface_id: d.surface_id,
                    position: [pos.x, pos.y, pos.z],
                    marker_type: d.marker_type || 'orb',
                    marker_settings: d.marker_settings || {},
                    card_ids: d.card_ids || [],
                    label: d.label,
                };
            });
            return { surfaces, connectors, loci };
        },

        // ─────────────────────────────────────────────
        // Animation loop
        // ─────────────────────────────────────────────
        animate() {
            this.animFrameId = requestAnimationFrame(() => this.animate());
            const delta = this.clock.getDelta();
            const t = this.clock.getElapsedTime();

            // Bob orbs/glows gently
            this.lociMeshes.forEach((m, i) => {
                const mt = m.userData.dbData?.marker_type;
                if (mt === 'orb' || mt === 'glow') {
                    const base = m.userData.dbData.position?.[1] ?? 1;
                    m.position.y = base + Math.sin(t * 2 + i) * 0.05;
                }
            });

            // Walker / traversal updates
            if (RC.PalaceWalker && RC.PalaceWalker.update) RC.PalaceWalker.update(delta);
            if (RC.PalaceTraverse && RC.PalaceTraverse.update) RC.PalaceTraverse.update(delta);

            // Render — composer on desktop, direct on mobile
            if (this.composer) {
                this.composer.render(delta);
            } else {
                this.renderer.render(this.scene, this.camera);
            }
        },

        dispose() {
            if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
            this.clearScene();
            if (this._pmremGen) this._pmremGen.dispose();
            if (this.composer) this.composer.dispose?.();
            if (this.renderer) {
                this.renderer.domElement.remove();
                this.renderer.dispose();
            }
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.composer = null;
            this._materialLib = {};
            this._textureCache = {};
            this._gltfCache = {};
            this._hdrCache = {};
            this._legacyMaterials = {};
        },
    };

    RC.PalaceRenderer = PR;
})();
