/**
 * Renderer class - handles split-screen rendering and scene management
 */

class Renderer {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);
        
        // Lighting
        this.setupLighting();
        
        // Environment
        this.createEnvironment();
        
        // Renderers for split screen
        this.renderer1 = null;
        this.renderer2 = null;
        
        // Canvas containers
        this.container1 = document.getElementById('top-screen');
        this.container2 = document.getElementById('bottom-screen');
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        this.scene.add(sunLight);
        
        // Hemisphere light for natural outdoor look
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.3);
        this.scene.add(hemiLight);
    }
    
    createEnvironment() {
        // Ground
        const groundGeo = new THREE.PlaneGeometry(100, 100, 50, 50);
        
        // Create uneven terrain
        const vertices = groundGeo.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            vertices[i + 2] = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5;
        }
        groundGeo.computeVertexNormals();
        
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: 0x3d5c3d,
            roughness: 0.9
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Dueling field markers
        this.createFieldMarkers();
        
        // Trees
        this.createTrees();
        
        // Barriers/rock formations
        this.createBarriers();
    }
    
    createFieldMarkers() {
        // Starting positions marked with stones
        const positions = [
            { x: 0, z: -15 },
            { x: 0, z: 15 },
            { x: -15, z: 0 },
            { x: 15, z: 0 }
        ];
        
        positions.forEach(pos => {
            const stoneGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 8);
            const stoneMat = new THREE.MeshStandardMaterial({ 
                color: 0x808080,
                roughness: 0.8
            });
            const stone = new THREE.Mesh(stoneGeo, stoneMat);
            stone.position.set(pos.x, 0.4, pos.z);
            this.scene.add(stone);
        });
        
        // Center marker
        const centerGeo = new THREE.RingGeometry(1, 1.2, 32);
        const centerMat = new THREE.MeshBasicMaterial({ 
            color: 0x8B4513,
            side: THREE.DoubleSide
        });
        const center = new THREE.Mesh(centerGeo, centerMat);
        center.rotation.x = -Math.PI / 2;
        center.position.y = 0.05;
        this.scene.add(center);
    }
    
    createTrees() {
        const treePositions = [
            { x: -20, z: -20 }, { x: 25, z: -18 },
            { x: -22, z: 15 }, { x: 18, z: 22 },
            { x: -30, z: 0 }, { x: 30, z: 5 },
            { x: 0, z: -35 }, { x: -5, z: 32 }
        ];
        
        treePositions.forEach(pos => {
            // Trunk
            const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3, 8);
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.set(pos.x, 1.5, pos.z);
            this.scene.add(trunk);
            
            // Foliage (cone layers)
            for (let i = 0; i < 3; i++) {
                const foliageGeo = new THREE.ConeGeometry(2 - i * 0.4, 2.5, 8);
                const foliageMat = new THREE.MeshStandardMaterial({ 
                    color: 0x1a472a,
                    roughness: 0.8
                });
                const foliage = new THREE.Mesh(foliageGeo, foliageMat);
                foliage.position.set(pos.x, 3.5 + i * 1.5, pos.z);
                this.scene.add(foliage);
            }
        });
    }
    
    createBarriers() {
        // Rock formations for cover
        const rockPositions = [
            { x: -10, z: -8, scale: 1.5 },
            { x: 12, z: -5, scale: 1.2 },
            { x: -8, z: 10, scale: 1.3 },
            { x: 10, z: 8, scale: 1.4 },
            { x: 0, z: -22, scale: 2 },
            { x: -18, z: -5, scale: 1 }
        ];
        
        rockPositions.forEach(rock => {
            const rockGeo = new THREE.DodecahedronGeometry(rock.scale, 0);
            const rockMat = new THREE.MeshStandardMaterial({ 
                color: 0x666666,
                roughness: 0.9
            });
            const rockMesh = new THREE.Mesh(rockGeo, rockMat);
            rockMesh.position.set(rock.x, rock.scale * 0.5, rock.z);
            rockMesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            this.scene.add(rockMesh);
        });
    }
    
    initRenderers() {
        // Create renderers for both screens
        this.renderer1 = new THREE.WebGLRenderer({ antialias: true });
        this.renderer2 = new THREE.WebGLRenderer({ antialias: true });
        
        this.updateRendererSizes();
        
        // Append canvases
        this.container1.appendChild(this.renderer1.domElement);
        this.container2.appendChild(this.renderer2.domElement);
        
        // Handle resize
        window.addEventListener('resize', () => this.updateRendererSizes());
    }
    
    updateRendererSizes() {
        const width = window.innerWidth;
        const height = window.innerHeight / 2;
        
        if (this.renderer1) {
            this.renderer1.setSize(width, height);
        }
        if (this.renderer2) {
            this.renderer2.setSize(width, height);
        }
    }
    
    render(player1, player2) {
        // Render player 1's view
        if (player1.alive) {
            this.renderer1.render(this.scene, player1.camera);
        } else {
            // Respawn countdown
            this.renderDeathScreen(this.renderer1, player1.respawnTimer);
        }
        
        // Render player 2's view
        if (player2.alive) {
            this.renderer2.render(this.scene, player2.camera);
        } else {
            this.renderDeathScreen(this.renderer2, player2.respawnTimer);
        }
    }
    
    renderDeathScreen(renderer, timer) {
        const ctx = renderer.domElement.getContext('2d');
        if (!ctx) return;
        
        // Clear with black
        renderer.setClearColor(0x000000);
        renderer.clear();
        
        // Note: In real implementation, we'd use 2D canvas overlay
        // For now, the blood overlay CSS handles the visual
    }
    
    addToScene(object) {
        this.scene.add(object);
    }
    
    removeFromScene(object) {
        this.scene.remove(object);
    }
}
