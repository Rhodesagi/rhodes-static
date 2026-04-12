// The Muskets Fire - 2 Player FPS
// Split screen, iron sights only, no HUD

const CONFIG = {
    playerSpeed: 3.5,
    playerTurnSpeed: 2.0,
    bulletGravity: 9.8,
    fieldSize: 100,
    fogDensity: 0.015
};

class Projectile {
    constructor(data, owner) {
        this.origin = data.origin.clone();
        this.position = data.origin.clone();
        this.velocity = data.direction.clone().multiplyScalar(data.velocity);
        this.owner = owner;
        this.birthTime = Date.now();
        this.active = true;
        this.radius = 0.018; // .69 cal ball
        
        // Visual
        const geom = new THREE.SphereGeometry(this.radius, 6, 6);
        const mat = new THREE.MeshBasicMaterial({ color: 0x222222 });
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.position.copy(this.position);
        
        // Trail
        const trailGeom = new THREE.BufferGeometry();
        const positions = new Float32Array(20 * 3);
        trailGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.trail = new THREE.Line(trailGeom, new THREE.LineBasicMaterial({ 
            color: 0x444444, 
            transparent: true, 
            opacity: 0.5 
        }));
        this.trailPoints = [];
    }
    
    update(deltaTime, scene, players) {
        if (!this.active) return;
        
        // Apply gravity
        this.velocity.y -= CONFIG.bulletGravity * deltaTime;
        
        // Move
        const move = this.velocity.clone().multiplyScalar(deltaTime);
        this.position.add(move);
        this.mesh.position.copy(this.position);
        
        // Trail
        this.trailPoints.push(this.position.clone());
        if (this.trailPoints.length > 10) this.trailPoints.shift();
        this.updateTrail();
        
        // Collision with players
        for (let player of players) {
            if (player === this.owner) continue;
            
            const dist = this.position.distanceTo(player.camera.position);
            if (dist < 0.5) { // Hit!
                this.active = false;
                player.hit();
                this.createHitEffect(this.position);
                return;
            }
        }
        
        // Ground collision
        if (this.position.y < 0) {
            this.active = false;
            this.createDustEffect(this.position);
        }
        
        // Range limit
        if (this.position.distanceTo(this.origin) > 400) {
            this.active = false;
        }
    }
    
    updateTrail() {
        const positions = this.trail.geometry.attributes.position.array;
        for (let i = 0; i < this.trailPoints.length; i++) {
            positions[i * 3] = this.trailPoints[i].x;
            positions[i * 3 + 1] = this.trailPoints[i].y;
            positions[i * 3 + 2] = this.trailPoints[i].z;
        }
        this.trail.geometry.attributes.position.needsUpdate = true;
    }
    
    createHitEffect(pos) {
        // Blood/particle burst
        const particleCount = 8;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 3,
                (Math.random() - 0.5) * 3
            ));
        }
        
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ 
            color: 0x8a0303, 
            size: 0.1,
            transparent: true 
        });
        
        const particles = new THREE.Points(geom, material);
        scene.add(particles);
        
        // Animate and remove
        let life = 1.0;
        const animate = () => {
            life -= 0.02;
            if (life <= 0) {
                scene.remove(particles);
                return;
            }
            material.opacity = life;
            
            const pos = particles.geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                pos[i * 3] += velocities[i].x * 0.016;
                pos[i * 3 + 1] += velocities[i].y * 0.016;
                pos[i * 3 + 2] += velocities[i].z * 0.016;
                velocities[i].y -= 9.8 * 0.016;
            }
            particles.geometry.attributes.position.needsUpdate = true;
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    createDustEffect(pos) {
        pos = pos.clone();
        pos.y = 0.01;
        
        const geom = new THREE.CircleGeometry(0.2, 8);
        const mat = new THREE.MeshBasicMaterial({ 
            color: 0x8b7355, 
            transparent: true,
            opacity: 0.6 
        });
        const dust = new THREE.Mesh(geom, mat);
        dust.rotation.x = -Math.PI / 2;
        dust.position.copy(pos);
        scene.add(dust);
        
        let scale = 1;
        let opacity = 0.6;
        const animate = () => {
            scale += 0.05;
            opacity -= 0.02;
            dust.scale.set(scale, scale, 1);
            dust.material.opacity = opacity;
            
            if (opacity <= 0) {
                scene.remove(dust);
                return;
            }
            requestAnimationFrame(animate);
        };
        animate();
    }
}

class Player {
    constructor(isPlayer2, startPos) {
        this.isPlayer2 = isPlayer2;
        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
        this.camera.position.copy(startPos);
        this.camera.position.y = 1.7; // Eye height
        
        // Movement state
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Euler(0, isPlayer2 ? Math.PI : 0, 0);
        this.camera.rotation.copy(this.rotation);
        
        // Input state
        this.keys = {};
        this.mouseDelta = { x: 0, y: 0 };
        this.isMouseLocked = false;
        
        // Look angles (for keyboard look)
        this.lookYaw = isPlayer2 ? Math.PI : 0;
        this.lookPitch = 0;
        
        // Musket
        this.musket = null;
        
        // Health
        this.alive = true;
        this.respawnTimer = 0;
        
        // Audio context
        this.audioListener = new THREE.AudioListener();
        this.camera.add(this.audioListener);
        
        // Team colors for identification
        this.uniformColor = isPlayer2 ? 0x8a1c1c : 0x1c3a8a; // Red coat vs Blue coat
    }
    
    hit() {
        if (!this.alive) return;
        this.alive = false;
        this.respawnTimer = 3000; // 3 second respawn
        
        // Play death sound
        this.playSound('death');
    }
    
    respawn(startPos) {
        this.alive = true;
        this.camera.position.copy(startPos);
        this.camera.position.y = 1.7;
        this.velocity.set(0, 0, 0);
        this.rotation.set(0, this.isPlayer2 ? Math.PI : 0, 0);
        this.lookYaw = this.isPlayer2 ? Math.PI : 0;
        this.lookPitch = 0;
        
        // Reset musket
        if (this.musket) {
            this.musket.state = 'READY';
        }
    }
    
    update(deltaTime, scene, game) {
        // Handle respawn
        if (!this.alive) {
            this.respawnTimer -= deltaTime * 1000;
            if (this.respawnTimer <= 0) {
                const newPos = this.isPlayer2 ? 
                    new THREE.Vector3(20, 0, 0) : new THREE.Vector3(-20, 0, 0);
                this.respawn(newPos);
            }
            return;
        }
        
        // Movement (disabled while reloading)
        const canMove = !this.musket || !this.musket.isReloading();
        
        if (canMove) {
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyEuler(this.camera.rotation);
            forward.y = 0;
            forward.normalize();
            
            const right = new THREE.Vector3(1, 0, 0);
            right.applyEuler(this.camera.rotation);
            right.y = 0;
            right.normalize();
            
            const moveDir = new THREE.Vector3();
            
            if (this.keys['forward']) moveDir.add(forward);
            if (this.keys['backward']) moveDir.sub(forward);
            if (this.keys['left']) moveDir.sub(right);
            if (this.keys['right']) moveDir.add(right);
            
            if (moveDir.length() > 0) {
                moveDir.normalize();
                this.velocity.x = moveDir.x * CONFIG.playerSpeed;
                this.velocity.z = moveDir.z * CONFIG.playerSpeed;
            } else {
                this.velocity.x *= 0.8;
                this.velocity.z *= 0.8;
            }
        } else {
            // Stop movement while reloading
            this.velocity.x = 0;
            this.velocity.z = 0;
        }
        
        // Apply movement with collision
        const nextPos = this.camera.position.clone();
        nextPos.x += this.velocity.x * deltaTime;
        nextPos.z += this.velocity.z * deltaTime;
        
        // Simple bounds check
        if (Math.abs(nextPos.x) < CONFIG.fieldSize && Math.abs(nextPos.z) < CONFIG.fieldSize) {
            this.camera.position.x = nextPos.x;
            this.camera.position.z = nextPos.z;
        }
        
        // Update rotation
        if (this.isPlayer2) {
            // Keyboard look
            if (this.keys['lookUp']) this.lookPitch += CONFIG.playerTurnSpeed * deltaTime;
            if (this.keys['lookDown']) this.lookPitch -= CONFIG.playerTurnSpeed * deltaTime;
            if (this.keys['lookLeft']) this.lookYaw += CONFIG.playerTurnSpeed * deltaTime;
            if (this.keys['lookRight']) this.lookYaw -= CONFIG.playerTurnSpeed * deltaTime;
            
            this.lookPitch = Math.max(-1.2, Math.min(1.2, this.lookPitch));
            
            this.camera.rotation.x = this.lookPitch;
            this.camera.rotation.y = this.lookYaw;
        } else {
            // Mouse look (pointer lock)
            if (this.isMouseLocked) {
                this.lookYaw -= this.mouseDelta.x * 0.002;
                this.lookPitch -= this.mouseDelta.y * 0.002;
                this.lookPitch = Math.max(-1.2, Math.min(1.2, this.lookPitch));
                
                this.camera.rotation.y = this.lookYaw;
                this.camera.rotation.x = this.lookPitch;
                
                this.mouseDelta.x = 0;
                this.mouseDelta.y = 0;
            }
        }
        
        // Update musket
        if (this.musket) {
            this.musket.update(deltaTime);
            
            // Sync musket with camera
            this.musket.mesh.position.add(this.camera.position);
            this.musket.mesh.quaternion.copy(this.camera.quaternion);
            this.musket.mesh.rotateY(this.isPlayer2 ? Math.PI : 0);
        }
    }
    
    playSound(type) {
        // Web Audio API sound synthesis
        const listener = this.audioListener;
        // Sounds would be attached to the listener here
    }
    
    handleKey(key, pressed) {
        if (this.isPlayer2) {
            // Arrow keys for movement, IJKL for look
            if (key === 'ArrowUp') this.keys['forward'] = pressed;
            if (key === 'ArrowDown') this.keys['backward'] = pressed;
            if (key === 'ArrowLeft') this.keys['left'] = pressed;
            if (key === 'ArrowRight') this.keys['right'] = pressed;
            if (key === 'i' || key === 'I') this.keys['lookUp'] = pressed;
            if (key === 'k' || key === 'K') this.keys['lookDown'] = pressed;
            if (key === 'j' || key === 'J') this.keys['lookLeft'] = pressed;
            if (key === 'l' || key === 'L') this.keys['lookRight'] = pressed;
            if (key === 'Enter') {
                if (pressed) this.fireOrAim(true);
                else this.fireOrAim(false);
            }
            if ((key === ',' || key === '<') && pressed) this.startReload();
        } else {
            // WASD for movement
            if (key === 'w' || key === 'W') this.keys['forward'] = pressed;
            if (key === 's' || key === 'S') this.keys['backward'] = pressed;
            if (key === 'a' || key === 'A') this.keys['left'] = pressed;
            if (key === 'd' || key === 'D') this.keys['right'] = pressed;
            if (key === 'r' || key === 'R') {
                if (pressed) this.startReload();
            }
        }
    }
    
    handleMouseMove(deltaX, deltaY) {
        if (!this.isPlayer2) {
            this.mouseDelta.x += deltaX;
            this.mouseDelta.y += deltaY;
        }
    }
    
    fireOrAim(active) {
        if (!this.musket) return;
        
        if (active) {
            this.musket.setAiming(true);
            // Small delay before fire to simulate trigger pull
            if (this.musket.canFire()) {
                // Fire on press if already aiming
                this.doFire();
            }
        } else {
            this.musket.setAiming(false);
        }
    }
    
    doFire() {
        const projectileData = this.musket.fire(this.camera);
        if (projectileData) {
            // Add to game projectiles
            if (window.gameInstance) {
                window.gameInstance.addProjectile(projectileData, this);
            }
            
            // Screen shake effect
            this.camera.position.y -= 0.05;
            setTimeout(() => {
                if (this.camera) this.camera.position.y += 0.05;
            }, 50);
        }
    }
    
    startReload() {
        if (this.musket) {
            this.musket.startReload();
        }
    }
}

class Game {
    constructor() {
        this.container = document.getElementById('gameContainer');
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.FogExp2(0x87CEEB, CONFIG.fogDensity);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);
        
        // Players
        this.player1 = new Player(false, new THREE.Vector3(-20, 1.7, 0));
        this.player2 = new Player(true, new THREE.Vector3(20, 1.7, 0));
        this.players = [this.player1, this.player2];
        
        // Muskets
        this.player1.musket = new Musket(this.scene, false);
        this.scene.add(this.player1.musket.mesh);
        
        this.player2.musket = new Musket(this.scene, true);
        this.scene.add(this.player2.musket.mesh);
        
        // Level geometry
        this.buildLevel();
        
        // Projectiles
        this.projectiles = [];
        
        // Input handling
        this.setupInput();
        
        // Resize handling
        window.addEventListener('resize', () => this.onResize());
        
        // Store for projectile access
        window.gameInstance = this;
        
        // Start loop
        this.lastTime = 0;
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }
    
    buildLevel() {
        // Ground
        const groundGeom = new THREE.PlaneGeometry(200, 200, 20, 20);
        
        // Add some noise to vertices for uneven terrain
        const pos = groundGeom.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
            pos[i + 1] = (Math.random() - 0.5) * 0.5; // Small height variation
        }
        groundGeom.computeVertexNormals();
        
        const groundMat = new THREE.MeshLambertMaterial({ 
            color: 0x4a5d23,
            wireframe: false
        });
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Trees
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            
            // Don't spawn in starting areas
            if (Math.abs(x) < 30 && Math.abs(z) < 10) continue;
            
            this.createTree(x, z);
        }
        
        // Rocks/barriers
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            if (Math.abs(x) < 25) continue;
            
            this.createRock(x, z);
        }
        
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambient);
        
        // Directional light (sun)
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        sun.shadow.camera.left = -100;
        sun.shadow.camera.right = 100;
        sun.shadow.camera.top = 100;
        sun.shadow.camera.bottom = -100;
        this.scene.add(sun);
    }
    
    createTree(x, z) {
        const group = new THREE.Group();
        
        // Trunk
        const trunkGeom = new THREE.CylinderGeometry(0.3, 0.4, 3, 6);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        group.add(trunk);
        
        // Foliage (conifer style)
        const foliageMat = new THREE.MeshLambertMaterial({ color: 0x1a4a1c });
        
        for (let i = 0; i < 3; i++) {
            const cone = new THREE.Mesh(
                new THREE.ConeGeometry(2 - i * 0.4, 2.5, 7),
                foliageMat
            );
            cone.position.y = 3 + i * 1.5;
            cone.castShadow = true;
            group.add(cone);
        }
        
        group.position.set(x, 0, z);
        this.scene.add(group);
    }
    
    createRock(x, z) {
        const geom = new THREE.DodecahedronGeometry(Math.random() * 1.5 + 0.5, 0);
        const mat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const rock = new THREE.Mesh(geom, mat);
        rock.position.set(x, 0.5, z);
        rock.castShadow = true;
        rock.receiveShadow = true;
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        this.scene.add(rock);
    }
    
    setupInput() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.player1.handleKey(e.key, true);
            this.player2.handleKey(e.key, true);
        });
        
        document.addEventListener('keyup', (e) => {
            this.player1.handleKey(e.key, false);
            this.player2.handleKey(e.key, false);
        });
        
        // Mouse lock for player 1
        this.renderer.domElement.addEventListener('click', () => {
            if (!this.player1.isMouseLocked) {
                this.renderer.domElement.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.player1.isMouseLocked = document.pointerLockElement === this.renderer.domElement;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.player1.isMouseLocked) {
                this.player1.handleMouseMove(e.movementX, e.movementY);
            }
        });
        
        // Player 1 mouse (fire/aim)
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.player1.fireOrAim(true);
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.player1.fireOrAim(false);
            }
        });
    }
    
    addProjectile(data, owner) {
        const proj = new Projectile(data, owner);
        this.projectiles.push(proj);
        this.scene.add(proj.mesh);
        this.scene.add(proj.trail);
    }
    
    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate(time) {
        requestAnimationFrame(this.animate);
        
        const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;
        
        if (deltaTime <= 0) return;
        
        // Update players
        for (let player of this.players) {
            player.update(deltaTime, this.scene, this);
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(deltaTime, this.scene, this.players);
            
            if (!proj.active) {
                this.scene.remove(proj.mesh);
                this.scene.remove(proj.trail);
                this.projectiles.splice(i, 1);
            }
        }
        
        // Render split screen
        this.renderSplitScreen();
    }
    
    renderSplitScreen() {
        const width = this.renderer.domElement.width;
        const height = this.renderer.domElement.height;
        
        // Clear
        this.renderer.clear();
        
        // Left half - Player 1
        this.renderer.setScissorTest(true);
        this.renderer.setScissor(0, 0, width / 2, height);
        this.renderer.setViewport(0, 0, width / 2, height);
        
        // Sync musket with camera
        this.syncMusketToCamera(this.player1);
        this.renderer.render(this.scene, this.player1.camera);
        
        // Right half - Player 2
        this.renderer.setScissor(width / 2, 0, width / 2, height);
        this.renderer.setViewport(width / 2, 0, width / 2, height);
        
        this.syncMusketToCamera(this.player2);
        this.renderer.render(this.scene, this.player2.camera);
        
        this.renderer.setScissorTest(false);
    }
    
    syncMusketToCamera(player) {
        if (!player.musket) return;
        
        // Position musket at camera
        player.musket.mesh.position.copy(player.camera.position);
        player.musket.mesh.rotation.copy(player.camera.rotation);
        
        // Offset based on aim state
        const aim = player.musket.aimProgress;
        
        // Right hand side offset (lowered when not aiming)
        const hipOffset = new THREE.Vector3(0.3, -0.3, 0.5);
        const aimOffset = new THREE.Vector3(0.12, -0.12, 0.3);
        
        const currentOffset = new THREE.Vector3().lerpVectors(hipOffset, aimOffset, aim);
        currentOffset.applyEuler(player.camera.rotation);
        
        player.musket.mesh.position.add(currentOffset);
        
        // Apply recoil offset
        const recoil = new THREE.Vector3(0, 0, -player.musket.recoilOffset * 0.2);
        recoil.applyEuler(player.camera.rotation);
        player.musket.mesh.position.add(recoil);
    }
}

// Start button
let game = null;
document.getElementById('startBtn').addEventListener('click', () => {
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('splitLine').style.display = 'block';
    
    game = new Game();
    
    // Request pointer lock for player 1
    setTimeout(() => {
        document.querySelector('canvas').requestPointerLock();
    }, 100);
});