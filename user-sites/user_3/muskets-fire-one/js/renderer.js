// Split-screen renderer with dual viewports

class Renderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
        // Create main renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // Create cameras for both players
        this.cameraP1 = new THREE.PerspectiveCamera(60, this.width / (this.height / 2), 0.1, 200);
        this.cameraP2 = new THREE.PerspectiveCamera(60, this.width / (this.height / 2), 0.1, 200);
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 150);
        
        // Lighting
        this.setupLighting();
        
        // World
        this.createWorld();
        
        // Projectile visual meshes
        this.projectileMeshes = [];
        
        // Resize handler
        window.addEventListener('resize', () => this.onResize());
    }
    
    setupLighting() {
        // Ambient
        const ambient = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambient);
        
        // Directional (sun)
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 200;
        sun.shadow.camera.left = -100;
        sun.shadow.camera.right = 100;
        sun.shadow.camera.top = 100;
        sun.shadow.camera.bottom = -100;
        this.scene.add(sun);
        
        // Hemisphere for sky/ground blend
        const hemi = new THREE.HemisphereLight(0x87CEEB, 0x3d5c2d, 0.4);
        this.scene.add(hemi);
    }
    
    createWorld() {
        // Ground
        const groundGeo = new THREE.PlaneGeometry(200, 200, 50, 50);
        
        // Add some noise to vertices for terrain
        const pos = groundGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const height = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 1.5 +
                          Math.sin(x * 0.2) * Math.cos(y * 0.2) * 0.3;
            pos.setZ(i, height);
        }
        groundGeo.computeVertexNormals();
        
        const groundMat = new THREE.MeshLambertMaterial({ 
            color: 0x3d5c2d,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add some trees/bushes for cover
        this.createVegetation();
        
        // Add barriers/walls
        this.createBarriers();
        
        // Add some rocks
        this.createRocks();
    }
    
    createVegetation() {
        const treeColors = [0x2d4c1e, 0x3d5c2d, 0x1e3c0f];
        
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            
            // Don't spawn too close to center
            if (Math.sqrt(x * x + z * z) < 15) continue;
            
            // Trunk
            const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 6);
            const trunkMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.set(x, 1, z);
            trunk.castShadow = true;
            
            // Foliage
            const foliageGeo = new THREE.ConeGeometry(1.5, 4, 6);
            const foliageMat = new THREE.MeshLambertMaterial({ 
                color: treeColors[Math.floor(Math.random() * treeColors.length)] 
            });
            const foliage = new THREE.Mesh(foliageGeo, foliageMat);
            foliage.position.y = 3;
            foliage.castShadow = true;
            trunk.add(foliage);
            
            this.scene.add(trunk);
        }
    }
    
    createBarriers() {
        // Stone walls for cover
        const wallMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dist = 25;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            
            const wallGeo = new THREE.BoxGeometry(4, 2, 1);
            const wall = new THREE.Mesh(wallGeo, wallMat);
            wall.position.set(x, 1, z);
            wall.rotation.y = angle + Math.PI / 2;
            wall.castShadow = true;
            wall.receiveShadow = true;
            this.scene.add(wall);
        }
    }
    
    createRocks() {
        const rockMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 160;
            const z = (Math.random() - 0.5) * 160;
            
            if (Math.sqrt(x * x + z * z) < 10) continue;
            
            const size = Math.random() * 1.5 + 0.5;
            const rockGeo = new THREE.DodecahedronGeometry(size, 0);
            const rock = new THREE.Mesh(rockGeo, rockMat);
            rock.position.set(x, size * 0.5, z);
            rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            rock.castShadow = true;
            rock.receiveShadow = true;
            this.scene.add(rock);
        }
    }
    
    addPlayerMesh(mesh) {
        this.scene.add(mesh);
    }
    
    updateCameras(player1, player2) {
        // Update P1 camera
        const p1Pos = player1.getCameraPosition();
        const p1Rot = player1.getCameraRotation();
        
        this.cameraP1.position.copy(p1Pos);
        this.cameraP1.rotation.order = 'YXZ';
        this.cameraP1.rotation.y = p1Rot.yaw + Math.PI;
        this.cameraP1.rotation.x = -p1Rot.pitch;
        
        // Update P1 FOV
        this.cameraP1.fov = player1.currentFov;
        this.cameraP1.updateProjectionMatrix();
        
        // Attach/detach iron sights for P1
        if (player1.ironSightsActive) {
            if (!player1.ironSights.getMesh().parent) {
                this.cameraP1.add(player1.ironSights.getMesh());
            }
        } else {
            if (player1.ironSights.getMesh().parent) {
                this.cameraP1.remove(player1.ironSights.getMesh());
            }
        }
        
        // Update P2 camera
        const p2Pos = player2.getCameraPosition();
        const p2Rot = player2.getCameraRotation();
        
        this.cameraP2.position.copy(p2Pos);
        this.cameraP2.rotation.order = 'YXZ';
        this.cameraP2.rotation.y = p2Rot.yaw + Math.PI;
        this.cameraP2.rotation.x = -p2Rot.pitch;
        
        // Update P2 FOV
        this.cameraP2.fov = player2.currentFov;
        this.cameraP2.updateProjectionMatrix();
        
        // Attach/detach iron sights for P2
        if (player2.ironSightsActive) {
            if (!player2.ironSights.getMesh().parent) {
                this.cameraP2.add(player2.ironSights.getMesh());
            }
        } else {
            if (player2.ironSights.getMesh().parent) {
                this.cameraP2.remove(player2.ironSights.getMesh());
            }
        }
    }
    
    updateProjectiles(projectiles) {
        // Clear old projectile meshes
        for (const mesh of this.projectileMeshes) {
            this.scene.remove(mesh);
        }
        this.projectileMeshes = [];
        
        // Create new meshes for active projectiles
        const ballGeo = new THREE.SphereGeometry(0.02, 6, 6);
        const ballMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        
        for (const proj of projectiles) {
            const mesh = new THREE.Mesh(ballGeo, ballMat);
            mesh.position.copy(proj.position);
            this.scene.add(mesh);
            this.projectileMeshes.push(mesh);
            
            // Add trail
            if (proj.trail.length > 1) {
                const trailGeo = new THREE.BufferGeometry().setFromPoints(proj.trail);
                const trailMat = new THREE.LineBasicMaterial({ 
                    color: 0x444444,
                    transparent: true,
                    opacity: 0.5
                });
                const trail = new THREE.Line(trailGeo, trailMat);
                this.scene.add(trail);
                this.projectileMeshes.push(trail);
            }
        }
    }
    
    render() {
        const halfHeight = Math.floor(this.height / 2);
        
        // Render Player 1 view (top half)
        this.renderer.setViewport(0, halfHeight, this.width, halfHeight);
        this.renderer.setScissor(0, halfHeight, this.width, halfHeight);
        this.renderer.setScissorTest(true);
        this.renderer.render(this.scene, this.cameraP1);
        
        // Render Player 2 view (bottom half)
        this.renderer.setViewport(0, 0, this.width, halfHeight);
        this.renderer.setScissor(0, 0, this.width, halfHeight);
        this.renderer.setScissorTest(true);
        this.renderer.render(this.scene, this.cameraP2);
        
        // Disable scissor for any additional rendering
        this.renderer.setScissorTest(false);
    }
    
    onResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
        this.renderer.setSize(this.width, this.height);
        
        // Update camera aspect ratios
        const aspect = this.width / (this.height / 2);
        this.cameraP1.aspect = aspect;
        this.cameraP1.updateProjectionMatrix();
        this.cameraP2.aspect = aspect;
        this.cameraP2.updateProjectionMatrix();
    }
    
    // Render iron sight overlay to a canvas
    renderIronSights(ctx, width, height) {
        // Draw rear sight (notch)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Rear sight aperture
        ctx.beginPath();
        ctx.moveTo(centerX - 20, centerY - 5);
        ctx.lineTo(centerX - 8, centerY - 5);
        ctx.moveTo(centerX + 8, centerY - 5);
        ctx.lineTo(centerX + 20, centerY - 5);
        ctx.stroke();
        
        // Front sight post
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + 5);
        ctx.lineTo(centerX, centerY + 25);
        ctx.stroke();
        
        // Vignette effect
        const gradient = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 200);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
}

// Export
window.Renderer = Renderer;
