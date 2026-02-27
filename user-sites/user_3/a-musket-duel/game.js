// A MUSKET DUEL - Two Player FPS
// Iron sights only. No HUD overlays. Authentic reload sequence.

class Musket {
    constructor(scene, isPlayer2 = false) {
        this.scene = scene;
        this.isPlayer2 = isPlayer2;
        this.loaded = true;
        this.reloading = false;
        this.reloadProgress = 0;
        this.reloadStep = 0;
        this.musketGroup = new THREE.Group();
        this.tiltAngle = 0;
        this.aiming = false;
        
        this.reloadSteps = [
            "Half-cock...",
            "Pour powder...",
            "Patch and ball...",
            "Ram home...",
            "Prime pan...",
            "Full cock...",
            "READY"
        ];
        
        this.createMusketModel();
        scene.add(this.musketGroup);
        this.musketGroup.visible = false; // Hidden until aiming
    }
    
    createMusketModel() {
        // Materials
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        const steelMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a, 
            metalness: 0.8, 
            roughness: 0.3 
        });
        const brassMat = new THREE.MeshStandardMaterial({ 
            color: 0xb5a642, 
            metalness: 0.7, 
            roughness: 0.4 
        });
        
        // Main stock (wood)
        const stockGeo = new THREE.BoxGeometry(0.12, 0.08, 0.8);
        const stock = new THREE.Mesh(stockGeo, woodMat);
        stock.position.set(0, -0.05, 0.3);
        this.musketGroup.add(stock);
        
        // Buttplate (steel)
        const buttGeo = new THREE.BoxGeometry(0.14, 0.1, 0.05);
        const butt = new THREE.Mesh(buttGeo, steelMat);
        butt.position.set(0, -0.05, 0.72);
        this.musketGroup.add(butt);
        
        // Barrel (steel)
        const barrelGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.0, 12);
        const barrel = new THREE.Mesh(barrelGeo, steelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.2);
        this.musketGroup.add(barrel);
        
        // Barrel bands (brass)
        for(let i = 0; i < 3; i++) {
            const bandGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.04, 12);
            const band = new THREE.Mesh(bandGeo, brassMat);
            band.rotation.x = Math.PI / 2;
            band.position.set(0, 0.02, -0.1 - i * 0.3);
            this.musketGroup.add(band);
        }
        
        // Lock mechanism (flintlock)
        const lockGeo = new THREE.BoxGeometry(0.06, 0.08, 0.15);
        const lock = new THREE.Mesh(lockGeo, steelMat);
        lock.position.set(0.06, 0.02, 0.1);
        this.musketGroup.add(lock);
        
        // Hammer (cock)
        const hammerGeo = new THREE.BoxGeometry(0.02, 0.08, 0.04);
        this.hammer = new THREE.Mesh(hammerGeo, steelMat);
        this.hammer.position.set(0.08, 0.08, 0.15);
        this.hammer.rotation.z = -0.3;
        this.musketGroup.add(this.hammer);
        
        // Frizzen/pan cover
        const frizzenGeo = new THREE.BoxGeometry(0.03, 0.06, 0.05);
        this.frizzen = new THREE.Mesh(frizzenGeo, steelMat);
        this.frizzen.position.set(0.08, 0.06, 0.08);
        this.frizzen.rotation.z = 0.2;
        this.musketGroup.add(this.frizzen);
        
        // Trigger guard (brass)
        const guardGeo = new THREE.TorusGeometry(0.04, 0.008, 6, 12, Math.PI);
        const guard = new THREE.Mesh(guardGeo, brassMat);
        guard.rotation.z = Math.PI / 2;
        guard.position.set(0, -0.08, 0.15);
        this.musketGroup.add(guard);
        
        // Trigger
        const triggerGeo = new THREE.BoxGeometry(0.01, 0.04, 0.01);
        this.trigger = new THREE.Mesh(triggerGeo, steelMat);
        this.trigger.position.set(0, -0.08, 0.12);
        this.musketGroup.add(this.trigger);
        
        // Front sight (blade)
        const frontSightGeo = new THREE.BoxGeometry(0.005, 0.025, 0.01);
        const frontSight = new THREE.Mesh(frontSightGeo, steelMat);
        frontSight.position.set(0, 0.055, -0.65);
        this.musketGroup.add(frontSight);
        
        // Rear sight (notch)
        const rearSightGeo = new THREE.BoxGeometry(0.01, 0.02, 0.02);
        const rearSight = new THREE.Mesh(rearSightGeo, steelMat);
        rearSight.position.set(0, 0.04, -0.05);
        this.musketGroup.add(rearSight);
    }
    
    aim(camera) {
        this.aiming = true;
        this.musketGroup.visible = true;
        this.updatePosition(camera);
    }
    
    stopAim() {
        this.aiming = false;
        this.musketGroup.visible = false;
    }
    
    updatePosition(camera) {
        if (!this.aiming) return;
        
        // Position musket in view - aligned for iron sights
        this.musketGroup.position.copy(camera.position);
        this.musketGroup.quaternion.copy(camera.quaternion);
        
        // Offset to shoulder position
        const offset = new THREE.Vector3(
            this.isPlayer2 ? 0.15 : -0.15, // Different shoulder for each player
            -0.12, 
            0.25
        );
        offset.applyQuaternion(camera.quaternion);
        this.musketGroup.position.add(offset);
        
        // Apply tilt (musket rotation)
        this.musketGroup.rotateZ(this.tiltAngle);
        this.musketGroup.rotateY(this.tiltAngle * 0.3);
    }
    
    setTilt(angle) {
        this.tiltAngle = Math.max(-0.4, Math.min(0.4, angle));
    }
    
    fire(camera) {
        if (!this.loaded || this.reloading) {
            return null;
        }
        
        this.loaded = false;
        
        // Animate hammer fall
        this.hammer.rotation.z = 0.1;
        
        // Calculate muzzle position and direction
        const muzzlePos = new THREE.Vector3(0, 0.02, -0.7);
        muzzlePos.applyQuaternion(this.musketGroup.quaternion);
        muzzlePos.add(this.musketGroup.position);
        
        // Get aim direction with slight randomness for realism
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.tiltAngle);
        
        // Add some inaccuracy based on movement
        const spread = 0.02;
        direction.x += (Math.random() - 0.5) * spread;
        direction.y += (Math.random() - 0.5) * spread;
        direction.normalize();
        
        // Muzzle flash effect
        this.createMuzzleFlash(muzzlePos);
        
        return {
            origin: muzzlePos,
            direction: direction,
            velocity: 180, // m/s for musket ball
            damage: 100
        };
    }
    
    createMuzzleFlash(position) {
        const flashGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ 
            color: 0xffffaa,
            transparent: true,
            opacity: 0.9
        });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.copy(position);
        this.scene.add(flash);
        
        // Smoke
        const smokeGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const smokeMat = new THREE.MeshBasicMaterial({ 
            color: 0x666666,
            transparent: true,
            opacity: 0.5
        });
        const smoke = new THREE.Mesh(smokeGeo, smokeMat);
        smoke.position.copy(position);
        this.scene.add(smoke);
        
        // Animate flash fade
        let opacity = 0.9;
        const fadeFlash = () => {
            opacity -= 0.1;
            flash.material.opacity = opacity;
            smoke.material.opacity = opacity * 0.5;
            smoke.scale.multiplyScalar(1.1);
            if (opacity > 0) {
                requestAnimationFrame(fadeFlash);
            } else {
                this.scene.remove(flash);
                this.scene.remove(smoke);
            }
        };
        fadeFlash();
    }
    
    startReload(onStep) {
        if (this.loaded || this.reloading) return;
        this.reloading = true;
        this.reloadStep = 0;
        this.reloadProgress = 0;
        this.onReloadStep = onStep;
        if (onStep) onStep(this.reloadSteps[0]);
    }
    
    updateReload(deltaTime) {
        if (!this.reloading) return;
        
        this.reloadProgress += deltaTime;
        
        // Each step takes ~0.6 seconds
        const stepTime = 0.6;
        const currentStepIdx = Math.floor(this.reloadProgress / stepTime);
        
        if (currentStepIdx > this.reloadStep && currentStepIdx < this.reloadSteps.length) {
            this.reloadStep = currentStepIdx;
            if (this.onReloadStep) {
                this.onReloadStep(this.reloadSteps[this.reloadStep]);
            }
            
            // Animate specific actions
            this.animateReloadStep(this.reloadStep);
        }
        
        if (this.reloadProgress >= stepTime * this.reloadSteps.length) {
            this.reloading = false;
            this.loaded = true;
            this.reloadProgress = 0;
            this.reloadStep = 0;
            // Reset hammer
            this.hammer.rotation.z = -0.3;
            if (this.onReloadStep) this.onReloadStep("");
        }
    }
    
    animateReloadStep(step) {
        switch(step) {
            case 0: // Half-cock
                this.hammer.rotation.z = -0.15;
                break;
            case 1: // Pour powder
                this.musketGroup.rotateX(0.1);
                setTimeout(() => this.musketGroup.rotateX(-0.1), 200);
                break;
            case 2: // Patch and ball
                this.musketGroup.rotateX(-0.05);
                setTimeout(() => this.musketGroup.rotateX(0.05), 300);
                break;
            case 4: // Prime pan
                this.frizzen.rotation.z = -0.3;
                setTimeout(() => this.frizzen.rotation.z = 0.2, 400);
                break;
            case 5: // Full cock
                this.hammer.rotation.z = -0.3;
                break;
        }
    }
}

class Player {
    constructor(scene, canvas, isPlayer2 = false) {
        this.scene = scene;
        this.canvas = canvas;
        this.isPlayer2 = isPlayer2;
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
        this.camera.position.y = 1.7; // Eye height
        
        // Position players facing each other
        if (isPlayer2) {
            this.camera.position.set(0, 1.7, -15);
            this.camera.rotation.y = Math.PI;
        } else {
            this.camera.position.set(0, 1.7, 15);
        }
        
        // Movement
        this.velocity = new THREE.Vector3();
        this.moveSpeed = 3.5;
        this.rotationSpeed = 2.0;
        
        // Keys state
        this.keys = {};
        
        // Musket
        this.musket = new Musket(scene, isPlayer2);
        
        // Health
        this.health = 100;
        this.alive = true;
        this.respawnTimer = 0;
        
        // Score
        this.score = 0;
        
        // Create player mesh (for opponent to see)
        this.createPlayerMesh();
    }
    
    createPlayerMesh() {
        const group = new THREE.Group();
        
        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.6, 8);
        const bodyMat = new THREE.MeshLambertMaterial({ 
            color: this.isPlayer2 ? 0x1a3a5c : 0x5c1a1a // Blue vs Red coats
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.8;
        group.add(body);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const headMat = new THREE.MeshLambertMaterial({ color: 0xffdbac });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.75;
        group.add(head);
        
        // Tricorne hat
        const hatBrimGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 3);
        const hatMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
        hatBrim.position.y = 2.0;
        hatBrim.rotation.y = Math.PI / 6;
        group.add(hatBrim);
        
        const hatTopGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.2, 8);
        const hatTop = new THREE.Mesh(hatTopGeo, hatMat);
        hatTop.position.y = 2.15;
        group.add(hatTop);
        
        this.mesh = group;
        this.scene.add(group);
    }
    
    updateMeshPosition() {
        if (this.mesh) {
            this.mesh.position.x = this.camera.position.x;
            this.mesh.position.z = this.camera.position.z;
            this.mesh.rotation.y = this.camera.rotation.y;
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.alive = false;
        this.mesh.visible = false;
        this.respawnTimer = 3;
    }
    
    respawn() {
        this.alive = true;
        this.health = 100;
        this.mesh.visible = true;
        
        if (this.isPlayer2) {
            this.camera.position.set(
                (Math.random() - 0.5) * 10,
                1.7,
                -15 + (Math.random() - 0.5) * 5
            );
            this.camera.rotation.y = Math.PI;
        } else {
            this.camera.position.set(
                (Math.random() - 0.5) * 10,
                1.7,
                15 + (Math.random() - 0.5) * 5
            );
            this.camera.rotation.y = 0;
        }
    }
    
    update(deltaTime, terrain) {
        if (!this.alive) {
            this.respawnTimer -= deltaTime;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }
        
        const moveVec = new THREE.Vector3();
        
        // Get forward and right vectors
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.camera.rotation.y);
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.camera.rotation.y);
        
        if (this.isPlayer2) {
            // Player 2: IJKL movement
            if (this.keys['KeyI']) moveVec.add(forward);
            if (this.keys['KeyK']) moveVec.sub(forward);
            if (this.keys['KeyJ']) moveVec.sub(right);
            if (this.keys['KeyL']) moveVec.add(right);
            
            // Rotate
            if (this.keys['KeyU']) this.camera.rotation.y += this.rotationSpeed * deltaTime;
            if (this.keys['KeyO']) this.camera.rotation.y -= this.rotationSpeed * deltaTime;
            
            // Tilt musket
            if (this.keys['KeyY']) this.musket.setTilt(this.musket.tiltAngle + deltaTime);
            if (this.keys['KeyP']) this.musket.setTilt(this.musket.tiltAngle - deltaTime);
            
        } else {
            // Player 1: WASD movement
            if (this.keys['KeyW']) moveVec.add(forward);
            if (this.keys['KeyS']) moveVec.sub(forward);
            if (this.keys['KeyA']) moveVec.sub(right);
            if (this.keys['KeyD']) moveVec.add(right);
            
            // Rotate
            if (this.keys['KeyQ']) this.camera.rotation.y += this.rotationSpeed * deltaTime;
            if (this.keys['KeyE']) this.camera.rotation.y -= this.rotationSpeed * deltaTime;
            
            // Tilt musket
            if (this.keys['KeyZ']) this.musket.setTilt(this.musket.tiltAngle + deltaTime);
            if (this.keys['KeyC']) this.musket.setTilt(this.musket.tiltAngle - deltaTime);
        }
        
        // Normalize and apply speed
        if (moveVec.length() > 0) {
            moveVec.normalize().multiplyScalar(this.moveSpeed * deltaTime);
        }
        
        // Collision detection with terrain bounds
        const newX = this.camera.position.x + moveVec.x;
        const newZ = this.camera.position.z + moveVec.z;
        
        if (Math.abs(newX) < 30 && Math.abs(newZ) < 30) {
            this.camera.position.x = newX;
            this.camera.position.z = newZ;
        }
        
        // Update musket position
        this.musket.updatePosition(this.camera);
        this.musket.updateReload(deltaTime);
        
        // Update mesh for opponent visibility
        this.updateMeshPosition();
    }
    
    onKeyDown(code) {
        this.keys[code] = true;
    }
    
    onKeyUp(code) {
        this.keys[code] = false;
    }
}

class Bullet {
    constructor(scene, data) {
        this.scene = scene;
        this.origin = data.origin.clone();
        this.direction = data.direction.clone();
        this.velocity = data.velocity;
        this.damage = data.damage;
        this.distance = 0;
        this.maxDistance = 200;
        
        // Create visual
        const geo = new THREE.SphereGeometry(0.015, 6, 6);
        const mat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(this.origin);
        scene.add(this.mesh);
        
        // Trail
        this.trail = [];
    }
    
    update(deltaTime, players) {
        const moveDist = this.velocity * deltaTime;
        this.distance += moveDist;
        
        // Move bullet
        const moveVec = this.direction.clone().multiplyScalar(moveDist);
        this.mesh.position.add(moveVec);
        
        // Add trail point
        this.trail.push(this.mesh.position.clone());
        if (this.trail.length > 10) this.trail.shift();
        
        // Check collisions with players
        for (const player of players) {
            if (!player.alive) continue;
            
            const dx = this.mesh.position.x - player.camera.position.x;
            const dz = this.mesh.position.z - player.camera.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            // Headshot check
            const headDist = Math.sqrt(
                dx * dx + 
                (this.mesh.position.y - (player.camera.position.y + 0.05)) ** 2 +
                dz * dz
            );
            
            if (headDist < 0.3) {
                return { hit: true, player: player, headshot: true };
            }
            
            // Body hit
            if (dist < 0.4 && this.mesh.position.y > 0.5 && this.mesh.position.y < 1.8) {
                return { hit: true, player: player, headshot: false };
            }
        }
        
        // Remove if too far
        if (this.distance > this.maxDistance) {
            this.destroy();
            return { hit: false, expired: true };
        }
        
        return { hit: false };
    }
    
    destroy() {
        this.scene.remove(this.mesh);
    }
}

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
        
        // Two renderers for split screen
        this.renderer1 = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('canvas1'),
            antialias: true 
        });
        this.renderer2 = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('canvas2'),
            antialias: true 
        });
        
        this.setupRenderers();
        this.createWorld();
        
        // Players
        this.player1 = new Player(this.scene, document.getElementById('canvas1'), false);
        this.player2 = new Player(this.scene, document.getElementById('canvas2'), true);
        this.players = [this.player1, this.player2];
        
        // Bullets
        this.bullets = [];
        
        // Input handling
        this.setupInput();
        
        // Start loop
        this.clock = new THREE.Clock();
        this.animate();
    }
    
    setupRenderers() {
        const container1 = document.getElementById('p1-view');
        const container2 = document.getElementById('p2-view');
        
        const resize = () => {
            const w1 = container1.clientWidth;
            const h1 = container1.clientHeight;
            const w2 = container2.clientWidth;
            const h2 = container2.clientHeight;
            
            this.renderer1.setSize(w1, h1);
            this.player1.camera.aspect = w1 / h1;
            this.player1.camera.updateProjectionMatrix();
            
            this.renderer2.setSize(w2, h2);
            this.player2.camera.aspect = w2 / h2;
            this.player2.camera.updateProjectionMatrix();
        };
        
        resize();
        window.addEventListener('resize', resize);
    }
    
    createWorld() {
        // Ground - grassy field
        const groundGeo = new THREE.PlaneGeometry(100, 100, 50, 50);
        
        // Add some noise to vertices for uneven terrain
        const pos = groundGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5;
            pos.setZ(i, z);
        }
        groundGeo.computeVertexNormals();
        
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x3a5f3a });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);
        
        // Dueling boundary markers (posts)
        for (let i = -20; i <= 20; i += 10) {
            if (i === 0) continue;
            this.createPost(i, -20);
            this.createPost(i, 20);
        }
        this.createPost(-20, 0);
        this.createPost(20, 0);
        
        // Trees for atmosphere
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            if (Math.abs(x) < 15 && Math.abs(z) < 15) continue; // Clear dueling area
            this.createTree(x, z);
        }
        
        // Lighting
        const ambient = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambient);
        
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        this.scene.add(sun);
        
        // Sky color
        this.scene.background = new THREE.Color(0x87CEEB);
    }
    
    createPost(x, z) {
        const geo = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
        const mat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        const post = new THREE.Mesh(geo, mat);
        post.position.set(x, 1, z);
        this.scene.add(post);
        
        // Post top
        const topGeo = new THREE.ConeGeometry(0.12, 0.3, 8);
        const top = new THREE.Mesh(topGeo, mat);
        top.position.set(x, 2.15, z);
        this.scene.add(top);
    }
    
    createTree(x, z) {
        const group = new THREE.Group();
        
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.5;
        group.add(trunk);
        
        // Foliage (low poly style)
        const leavesGeo = new THREE.ConeGeometry(2, 4, 8);
        const leavesMat = new THREE.MeshLambertMaterial({ color: 0x2d5a2d });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.y = 4;
        group.add(leaves);
        
        const leaves2 = new THREE.Mesh(
            new THREE.ConeGeometry(1.5, 3, 8),
            leavesMat
        );
        leaves2.position.y = 5.5;
        group.add(leaves2);
        
        group.position.set(x, 0, z);
        this.scene.add(group);
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.player1.onKeyDown(e.code);
            this.player2.onKeyDown(e.code);
            
            // Player 1 actions
            if (e.code === 'KeyX') {
                this.player1.musket.aim(this.player1.camera);
                document.getElementById('p1-reload').classList.add('active');
            }
            if (e.code === 'KeyF') {
                this.fireMusket(this.player1);
            }
            if (e.code === 'KeyR') {
                this.startReload(this.player1, 'p1-reload');
            }
            
            // Player 2 actions (M = aim, Period = fire, Comma = reload)
            if (e.code === 'KeyM') {
                this.player2.musket.aim(this.player2.camera);
                document.getElementById('p2-reload').classList.add('active');
            }
            if (e.code === 'Period') {
                this.fireMusket(this.player2);
            }
            if (e.code === 'Comma') {
                this.startReload(this.player2, 'p2-reload');
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.player1.onKeyUp(e.code);
            this.player2.onKeyUp(e.code);
            
            if (e.code === 'KeyX') {
                this.player1.musket.stopAim();
                document.getElementById('p1-reload').classList.remove('active');
            }
            if (e.code === 'KeyM') {
                this.player2.musket.stopAim();
                document.getElementById('p2-reload').classList.remove('active');
            }
        });
    }
    
    fireMusket(player) {
        const bulletData = player.musket.fire(player.camera);
        if (bulletData) {
            const bullet = new Bullet(this.scene, bulletData);
            this.bullets.push(bullet);
        }
    }
    
    startReload(player, indicatorId) {
        const indicator = document.getElementById(indicatorId);
        player.musket.startReload((step) => {
            if (step) {
                indicator.innerHTML = `<span class="reload-step">${step}</span>`;
            } else {
                indicator.innerHTML = '';
                indicator.classList.remove('active');
            }
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = Math.min(this.clock.getDelta(), 0.1);
        
        // Update players
        this.player1.update(deltaTime);
        this.player2.update(deltaTime);
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            const result = bullet.update(deltaTime, this.players);
            
            if (result.hit) {
                bullet.destroy();
                this.bullets.splice(i, 1);
                
                const target = result.player;
                const shooter = target === this.player1 ? this.player2 : this.player1;
                
                // Award point to shooter
                shooter.score++;
                document.getElementById(shooter === this.player1 ? 'p1-score' : 'p2-score').textContent = shooter.score;
                
                // Flash hit indicator on target's screen
                const hitId = target === this.player1 ? 'p1-hit' : 'p2-hit';
                const hitEl = document.getElementById(hitId);
                hitEl.classList.add('active');
                setTimeout(() => hitEl.classList.remove('active'), 200);
                
                // Kill target
                target.takeDamage(100);
                
                // Check for winner
                if (shooter.score >= 5) {
                    this.showWinner(shooter);
                }
            } else if (result.expired) {
                this.bullets.splice(i, 1);
            }
        }
        
        // Render both views
        this.renderer1.render(this.scene, this.player1.camera);
        this.renderer2.render(this.scene, this.player2.camera);
    }
    
    showWinner(winner) {
        const winnerText = document.getElementById('winner-text');
        winnerText.textContent = winner === this.player1 ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!';
        document.getElementById('winner-screen').style.display = 'flex';
    }
}

let game;

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    game = new Game();
}

function resetGame() {
    document.getElementById('winner-screen').style.display = 'none';
    game.player1.score = 0;
    game.player2.score = 0;
    document.getElementById('p1-score').textContent = '0';
    document.getElementById('p2-score').textContent = '0';
    game.player1.respawn();
    game.player2.respawn();
}