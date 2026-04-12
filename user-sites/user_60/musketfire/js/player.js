// MUSKETFIRE - Player class with movement, health, and musket

class Player {
    constructor(scene, playerNum, startPos) {
        this.scene = scene;
        this.playerNum = playerNum;
        this.position = startPos.clone();
        this.rotation = new THREE.Euler(0, playerNum === 1 ? 0 : Math.PI, 0);
        this.velocity = new THREE.Vector3();
        
        // Movement constants
        this.moveSpeed = 3.0; // m/s - slow (carrying musket)
        this.sprintSpeed = 5.0;
        this.mouseSensitivity = 0.002;
        this.radius = 0.4;
        
        // Health
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.dead = false;
        this.respawnTimer = 0;
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60, // FOV
            1, // Aspect set by renderer
            0.1,
            200
        );
        this.camera.position.copy(this.position);
        this.camera.position.y += 1.6; // Eye height
        this.scene.add(this.camera);
        
        // Weapon - attached to camera
        this.musket = new Musket(scene, playerNum === 1);
        this.camera.add(this.musket.mesh);
        this.musket.mesh.position.set(0.3, -0.3, 0.5);
        this.musket.mesh.rotation.y = -0.1;
        
        // Visual player model (for other player to see)
        this.createVisualModel();
        
        // Footstep timer
        this.footstepTimer = 0;
        
        // Damage overlay
        this.damageFlash = 0;
    }
    
    createVisualModel() {
        const color = this.playerNum === 1 ? 0x4a9 : 0xa94;
        
        // Simple capsule body
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.7, 12);
        const bodyMat = new THREE.MeshLambertMaterial({ color: color });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = 0.85;
        this.bodyMesh.castShadow = true;
        
        this.visualGroup = new THREE.Group();
        this.visualGroup.add(this.bodyMesh);
        this.visualGroup.position.copy(this.position);
        this.scene.add(this.visualGroup);
        
        // Third-person musket (simple)
        const musketGeo = new THREE.BoxGeometry(0.1, 0.1, 1.4);
        const musketMat = new THREE.MeshLambertMaterial({ color: 0x4a3c2d });
        this.visualMusket = new THREE.Mesh(musketGeo, musketMat);
        this.visualMusket.position.set(0.4, 1.2, 0.4);
        this.visualMusket.rotation.y = -0.3;
        this.visualGroup.add(this.visualMusket);
    }
    
    update(dt, world, input) {
        if (this.dead) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }
        
        // Handle input
        const moveInput = this.playerNum === 1 ? 
            input.getP1Movement() : input.getP2Movement();
        
        const mouseDelta = this.playerNum === 1 ?
            input.getP1MouseDelta() : input.getP2MouseDelta(dt);
        
        // Rotation (yaw only for body, pitch for camera)
        this.rotation.y -= mouseDelta.x * this.mouseSensitivity;
        this.camera.rotation.x -= mouseDelta.y * this.mouseSensitivity;
        this.camera.rotation.x = THREE.MathUtils.clamp(
            this.camera.rotation.x, -Math.PI / 2, Math.PI / 2
        );
        
        // Calculate movement direction relative to camera
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
        
        // Movement velocity
        const targetVel = new THREE.Vector3();
        targetVel.addScaledVector(forward, moveInput.z);
        targetVel.addScaledVector(right, moveInput.x);
        targetVel.multiplyScalar(this.moveSpeed);
        
        // Smooth acceleration
        this.velocity.lerp(targetVel, dt * 5);
        
        // Apply movement
        const moveStep = this.velocity.clone().multiplyScalar(dt);
        const newPos = this.position.clone().add(moveStep);
        
        // Ground height
        newPos.y = world.getHeightAt(newPos.x, newPos.z) + 0.1;
        
        // Collision check
        if (!world.checkCollision(newPos, this.radius)) {
            this.position.copy(newPos);
        } else {
            // Try sliding
            const slideX = this.position.clone();
            slideX.x += moveStep.x;
            if (!world.checkCollision(slideX, this.radius)) {
                this.position.x = slideX.x;
                this.position.z = newPos.z;
            } else {
                const slideZ = this.position.clone();
                slideZ.z += moveStep.z;
                if (!world.checkCollision(slideZ, this.radius)) {
                    this.position.x = newPos.x;
                    this.position.z = slideZ.z;
                }
            }
            this.velocity.x *= 0.5;
            this.velocity.z *= 0.5;
        }
        
        // Update camera position
        this.camera.position.x = this.position.x;
        this.camera.position.z = this.position.z;
        this.camera.position.y = this.position.y + 1.6;
        this.camera.rotation.y = this.rotation.y;
        
        // Update visual model
        this.visualGroup.position.x = this.position.x;
        this.visualGroup.position.z = this.position.z;
        this.visualGroup.position.y = this.position.y;
        this.visualGroup.rotation.y = this.rotation.y;
        
        // Update weapon aim
        const aimDownSights = this.playerNum === 1 ?
            input.isP1AimPressed() : input.isP2AimPressed();
        this.musket.setAimDownSights(aimDownSights);
        
        // Weapon update
        this.musket.update(dt);
        
        // Footsteps
        if (moveInput.x !== 0 || moveInput.z !== 0) {
            this.footstepTimer += dt;
            if (this.footstepTimer > 0.5) {
                sounds.playFootstep();
                this.footstepTimer = 0;
            }
        }
        
        // Damage flash fade
        if (this.damageFlash > 0) {
            this.damageFlash -= dt * 2;
            if (this.damageFlash < 0) this.damageFlash = 0;
        }
    }
    
    fire(input) {
        if (this.dead) return false;
        
        const firePressed = this.playerNum === 1 ?
            input.isP1FirePressed() : input.isP2FirePressed();
        
        if (firePressed) {
            if (this.musket.isReady()) {
                // Fire!
                const fired = this.musket.fire();
                if (fired) {
                    input.setP1FirePressed(false); // Reset
                    return true;
                }
            } else {
                // Not ready - could restart reload if early enough
            }
        }
        return false;
    }
    
    takeDamage(amount) {
        if (this.dead) return;
        
        this.health -= amount;
        this.damageFlash = 1.0;
        sounds.playHit();
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.dead = true;
        this.health = 0;
        this.respawnTimer = 3.0;
        
        // Drop visual
        this.visualGroup.visible = false;
    }
    
    respawn() {
        this.dead = false;
        this.health = this.maxHealth;
        this.respawnTimer = 0;
        
        // Random spawn
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 20;
        this.position.set(
            Math.cos(angle) * dist,
            0,
            Math.sin(angle) * dist
        );
        this.rotation.y = Math.random() * Math.PI * 2;
        
        this.visualGroup.visible = true;
        
        // Reset weapon
        this.musket.reloadState = RELOAD_PHASES.READY;
    }
    
    getMuzzlePosition() {
        return this.musket.getMuzzlePosition();
    }
    
    getAimDirection() {
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyQuaternion(this.camera.quaternion);
        return dir;
    }
    
    getReloadStatus() {
        return this.musket.getReloadStatus();
    }
    
    getDamageFlash() {
        return this.damageFlash;
    }
}

// Export
window.Player = Player;
