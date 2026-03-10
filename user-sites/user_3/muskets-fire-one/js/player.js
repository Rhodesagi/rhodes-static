// Player controller with movement, aiming, and musket mechanics

class Player {
    constructor(id, startPosition, color) {
        this.id = id;
        this.position = startPosition.clone();
        this.rotation = { yaw: 0, pitch: 0 };
        this.color = color;
        
        // Movement
        this.velocity = new THREE.Vector3();
        this.speed = 2.5; // m/s
        this.height = 1.7;
        
        // Camera
        this.camera = null;
        this.fovNormal = 60;
        this.fovIronSights = 25;
        this.currentFov = this.fovNormal;
        this.targetFov = this.fovNormal;
        
        // Iron sights
        this.ironSightsActive = false;
        this.swayAmount = 0.02;
        this.breathingTime = 0;
        
        // Musket
        this.musket = new Musket(id);
        
        // Iron sights
        this.ironSights = new IronSights();
        
        // Health/score
        this.health = 100;
        this.deaths = 0;
        this.alive = true;
        this.respawnTimer = 0;
        
        // Animation
        this.walkCycle = 0;
        this.musketBob = 0;
        
        // Create 3D objects
        this.createMesh();
    }
    
    createMesh() {
        // Player body (visible to other player)
        const geometry = new THREE.CapsuleGeometry(0.3, 1.4, 4, 8);
        const material = new THREE.MeshLambertMaterial({ color: this.color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.position.y = this.height / 2;
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const headMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 }); // Skin tone
        this.headMesh = new THREE.Mesh(headGeo, headMat);
        this.headMesh.position.y = 0.9;
        this.mesh.add(this.headMesh);
        
        // Tricorn hat
        const hatGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 3);
        const hatMat = new THREE.MeshLambertMaterial({ color: this.color });
        this.hatMesh = new THREE.Mesh(hatGeo, hatMat);
        this.hatMesh.position.y = 1.15;
        this.hatMesh.rotation.y = Math.PI;
        this.mesh.add(this.hatMesh);
        
        // Musket (visible on back when not aiming)
        this.createMusketMesh();
    }
    
    createMusketMesh() {
        // Musket geometry group
        this.musketGroup = new THREE.Group();
        
        // Stock
        const stockGeo = new THREE.BoxGeometry(0.08, 0.12, 0.8);
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x4a3020 });
        const stock = new THREE.Mesh(stockGeo, woodMat);
        stock.position.z = -0.2;
        this.musketGroup.add(stock);
        
        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8);
        const metalMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        const barrel = new THREE.Mesh(barrelGeo, metalMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.1;
        this.musketGroup.add(barrel);
        
        // Flintlock mechanism
        const lockGeo = new THREE.BoxGeometry(0.06, 0.08, 0.1);
        const lock = new THREE.Mesh(lockGeo, metalMat);
        lock.position.set(0.06, 0.05, -0.1);
        this.musketGroup.add(lock);
        
        // Ramrod (animated)
        const ramrodGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.9, 4);
        const ramrodMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        this.ramrodMesh = new THREE.Mesh(ramrodGeo, ramrodMat);
        this.ramrodMesh.rotation.x = Math.PI / 2;
        this.ramrodMesh.position.set(0.05, -0.05, 0);
        this.musketGroup.add(this.ramrodMesh);
        
        // Smoke particle system
        this.smokeGroup = new THREE.Group();
        this.musketGroup.add(this.smokeGroup);
        
        // Position musket on player's back
        this.musketGroup.position.set(0.2, 0.3, -0.3);
        this.musketGroup.rotation.x = -0.3;
        this.mesh.add(this.musketGroup);
    }
    
    update(deltaTime, input) {
        if (!this.alive) {
            this.updateRespawn(deltaTime);
            return;
        }
        
        this.breathingTime += deltaTime;
        
        // Handle movement
        this.handleMovement(input, deltaTime);
        
        // Handle aiming
        this.handleAiming(input, deltaTime);
        
        // Handle iron sights
        this.handleIronSights(input);
        
        // Handle musket
        this.handleMusket(input);
        
        // Update musket
        this.musket.update(deltaTime);
        
        // Update animations
        this.updateAnimations(deltaTime);
        
        // Update FOV
        this.currentFov += (this.targetFov - this.currentFov) * 5 * deltaTime;
        if (this.camera) {
            this.camera.fov = this.currentFov;
            this.camera.updateProjectionMatrix();
        }
        
        // Update mesh position
        this.mesh.position.x = this.position.x;
        this.mesh.position.z = this.position.z;
        this.mesh.rotation.y = this.rotation.yaw + Math.PI;
    }
    
    handleMovement(input, deltaTime) {
        const moveSpeed = this.speed * deltaTime;
        
        // Calculate movement vector relative to facing direction
        let moveX = 0;
        let moveZ = 0;
        
        if (input.moveForward) moveZ -= 1;
        if (input.moveBackward) moveZ += 1;
        if (input.moveLeft) moveX -= 1;
        if (input.moveRight) moveX += 1;
        
        // Normalize diagonal movement
        if (moveX !== 0 && moveZ !== 0) {
            const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX /= len;
            moveZ /= len;
        }
        
        // Rotate movement by yaw
        const cos = Math.cos(this.rotation.yaw);
        const sin = Math.sin(this.rotation.yaw);
        
        const worldMoveX = moveX * cos - moveZ * sin;
        const worldMoveZ = moveX * sin + moveZ * cos;
        
        // Apply movement
        this.position.x += worldMoveX * moveSpeed;
        this.position.z += worldMoveZ * moveSpeed;
        
        // Boundary clamp
        this.position.x = Math.max(-45, Math.min(45, this.position.x));
        this.position.z = Math.max(-45, Math.min(45, this.position.z));
        
        // Update walk cycle
        if (moveX !== 0 || moveZ !== 0) {
            this.walkCycle += deltaTime * 8;
        }
    }
    
    handleAiming(input, deltaTime) {
        const aimSpeed = 1.5 * deltaTime;
        
        // Mouse/keyboard aim
        if (input.aimUp) this.rotation.pitch += aimSpeed;
        if (input.aimDown) this.rotation.pitch -= aimSpeed;
        if (input.aimLeft) this.rotation.yaw += aimSpeed;
        if (input.aimRight) this.rotation.yaw -= aimSpeed;
        
        // Clamp pitch
        this.rotation.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.rotation.pitch));
        
        // Apply sway when not in iron sights
        if (!this.ironSightsActive) {
            const swayX = Math.sin(this.breathingTime * 1.5) * this.swayAmount;
            const swayY = Math.cos(this.breathingTime * 1.2) * this.swayAmount * 0.5;
            this.rotation.yaw += swayX * deltaTime;
            this.rotation.pitch += swayY * deltaTime;
        } else {
            // Reduced sway in iron sights
            const swayX = Math.sin(this.breathingTime * 1.5) * this.swayAmount * 0.3;
            const swayY = Math.cos(this.breathingTime * 1.2) * this.swayAmount * 0.15;
            this.rotation.yaw += swayX * deltaTime;
            this.rotation.pitch += swayY * deltaTime;
        }
    }
    
    handleIronSights(input) {
        if (input.ironSights) {
            this.ironSightsActive = true;
            this.targetFov = this.fovIronSights;
            this.ironSights.show();
        } else {
            this.ironSightsActive = false;
            this.targetFov = this.fovNormal;
            this.ironSights.hide();
        }
    }
    
    handleMusket(input) {
        // Fire
        if (input.fire) {
            if (this.musket.fire()) {
                this.fireProjectile();
            }
        }
        
        // Reload
        if (input.reload) {
            this.musket.startReload();
        }
    }
    
    fireProjectile() {
        // Calculate muzzle position
        const muzzleOffset = new THREE.Vector3(0, 0, 0.6);
        muzzleOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.yaw);
        
        const origin = this.position.clone();
        origin.y += this.height - 0.1;
        origin.add(muzzleOffset);
        
        // Calculate direction from camera
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.rotation.pitch);
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.yaw);
        
        // Fire
        physics.fireProjectile(origin, direction, this.id);
        
        // Play gunshot sound
        audio.playMusketFire();
        
        // Recoil kick
        this.musket.recoilOffset = 0.2;
    }
    
    updateAnimations(deltaTime) {
        // Walk bob
        if (this.walkCycle > 0) {
            this.musketBob = Math.sin(this.walkCycle) * 0.03;
        } else {
            this.musketBob *= 0.9;
        }
        
        // Update ramrod position based on musket state
        this.ramrodMesh.position.z = this.musket.ramrodOffset;
        
        // Apply recoil to musket rotation
        const recoilX = this.musket.recoilOffset;
        this.musketGroup.rotation.x = -0.3 + recoilX;
    }
    
    updateRespawn(deltaTime) {
        this.respawnTimer -= deltaTime;
        if (this.respawnTimer <= 0) {
            this.respawn();
        }
    }
    
    takeDamage(amount, attackerId) {
        if (!this.alive) return;
        
        this.health -= amount;
        if (this.health <= 0) {
            this.die(attackerId);
        }
    }
    
    die(killerId) {
        this.alive = false;
        this.deaths++;
        this.respawnTimer = 3; // 3 second respawn
        this.mesh.visible = false;
        
        // Report kill to game
        if (window.game) {
            window.game.onKill(killerId, this.id);
        }
    }
    
    respawn() {
        this.alive = true;
        this.health = 100;
        this.mesh.visible = true;
        this.musket.reset();
        
        // Random respawn position
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 20;
        this.position.x = Math.cos(angle) * dist;
        this.position.z = Math.sin(angle) * dist;
    }
    
    getCameraPosition() {
        const pos = this.position.clone();
        pos.y += this.height - 0.1 + this.musketBob;
        return pos;
    }
    
    getCameraRotation() {
        return {
            yaw: this.rotation.yaw,
            pitch: this.rotation.pitch
        };
    }
    
    getReloadStatus() {
        return {
            state: this.musket.state,
            step: this.musket.getReloadStep(),
            stepName: this.musket.getReloadStepName(),
            loaded: this.musket.loaded,
            canFire: this.musket.canFire
        };
    }
}

// Export
window.Player = Player;
