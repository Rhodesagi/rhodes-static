/**
 * Player Controller
 * Handles input, movement, camera control, and weapon management
 */

class Player {
    constructor(id, startPosition, controls) {
        this.id = id;
        this.position = startPosition.clone();
        this.rotation = new THREE.Euler(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        
        // Player dimensions
        this.height = 1.7;
        this.radius = 0.3;
        this.eyeHeight = 1.6;
        
        // Movement state
        this.moveSpeed = 3.0; // m/s (historically accurate slow movement)
        this.sprintSpeed = 4.5;
        this.currentSpeed = this.moveSpeed;
        this.isMoving = false;
        this.isSprinting = false;
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.updateCameraPosition();
        
        // Weapon
        this.musket = new Musket();
        
        // Input configuration
        this.controls = controls;
        this.keys = {};
        this.mouseSensitivity = 0.002;
        this.keyboardLookSpeed = 0.03;
        
        // Health
        this.health = 100;
        this.alive = true;
        this.respawnTimer = 0;
        
        // Weapon bob
        this.bobPhase = 0;
        this.bobAmount = 0.02;
        
        // Ground collision
        this.onGround = true;
        this.gravity = -9.8;
        this.verticalVelocity = 0;
        
        // Pointer lock state
        this.pointerLocked = false;
    }
    
    setPointerLock(locked) {
        this.pointerLocked = locked;
    }
    
    handleKeyDown(key) {
        this.keys[key.toLowerCase()] = true;
        
        // Action keys
        if (key === this.controls.reload) {
            this.musket.startReload();
        }
        
        if (key === this.controls.fire) {
            this.attemptFire();
        }
        
        if (key === this.controls.ironSights) {
            this.musket.toggleIronSights();
        }
    }
    
    handleKeyUp(key) {
        this.keys[key.toLowerCase()] = false;
    }
    
    handleMouseMove(deltaX, deltaY) {
        if (!this.pointerLocked) return;
        
        // Yaw (left/right)
        this.rotation.y -= deltaX * this.mouseSensitivity;
        
        // Pitch (up/down) - clamp to avoid flipping
        this.rotation.x -= deltaY * this.mouseSensitivity;
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
    }
    
    handleKeyboardLook(left, right, up, down, dt) {
        // For player 2 using keyboard for looking
        if (left) this.rotation.y += this.keyboardLookSpeed;
        if (right) this.rotation.y -= this.keyboardLookSpeed;
        if (up) this.rotation.x += this.keyboardLookSpeed;
        if (down) this.rotation.x -= this.keyboardLookSpeed;
        
        // Clamp pitch
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
    }
    
    update(dt, worldBounds) {
        if (!this.alive) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }
        
        // Movement input
        const moveVector = new THREE.Vector3(0, 0, 0);
        
        if (this.keys[this.controls.forward]) moveVector.z -= 1;
        if (this.keys[this.controls.backward]) moveVector.z += 1;
        if (this.keys[this.controls.left]) moveVector.x -= 1;
        if (this.keys[this.controls.right]) moveVector.x += 1;
        
        // Normalize and apply rotation
        if (moveVector.length() > 0) {
            moveVector.normalize();
            moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
            
            this.isMoving = true;
            this.currentSpeed = this.keys[this.controls.sprint] ? this.sprintSpeed : this.moveSpeed;
            
            // Weapon bob
            this.bobPhase += dt * (this.currentSpeed * 2);
        } else {
            this.isMoving = false;
            this.bobPhase = 0;
        }
        
        // Apply movement
        const targetVelocity = moveVector.multiplyScalar(this.currentSpeed);
        this.velocity.x = targetVelocity.x;
        this.velocity.z = targetVelocity.z;
        
        // Update position
        this.position.x += this.velocity.x * dt;
        this.position.z += this.velocity.z * dt;
        
        // World bounds collision
        if (worldBounds) {
            this.position.x = Math.max(worldBounds.minX + this.radius, 
                Math.min(worldBounds.maxX - this.radius, this.position.x));
            this.position.z = Math.max(worldBounds.minZ + this.radius,
                Math.min(worldBounds.maxZ - this.radius, this.position.z));
        }
        
        // Update camera and weapon
        this.updateCameraPosition();
        this.updateWeapon(dt);
        
        // Update musket
        this.musket.update(dt, performance.now() / 1000);
    }
    
    updateCameraPosition() {
        // Apply bob
        const bobOffset = this.isMoving ? Math.sin(this.bobPhase) * this.bobAmount : 0;
        
        // Calculate camera position
        const eyePos = new THREE.Vector3(
            this.position.x,
            this.position.y + this.eyeHeight + bobOffset,
            this.position.z
        );
        
        this.camera.position.copy(eyePos);
        
        // Calculate look direction
        const lookDirection = new THREE.Vector3(0, 0, -1);
        lookDirection.applyEuler(this.rotation);
        
        const target = eyePos.clone().add(lookDirection);
        this.camera.lookAt(target);
        
        // Update FOV for iron sights
        if (this.musket.ironSightsActive) {
            this.camera.fov = 45;
        } else {
            this.camera.fov = 75;
        }
        this.camera.updateProjectionMatrix();
    }
    
    updateWeapon(dt) {
        // Position weapon relative to camera
        const weaponOffset = new THREE.Vector3(0.15, -0.15, -0.4);
        
        if (this.musket.ironSightsActive) {
            // Bring weapon up to eye level for iron sights
            weaponOffset.set(0, -0.05, -0.2);
        }
        
        // Apply weapon rotation to match camera
        this.musket.mesh.rotation.set(0, 0, 0);
        this.musket.mesh.rotation.x = this.rotation.x;
        this.musket.mesh.rotation.y = this.rotation.y + Math.PI;
        
        // Position weapon in view
        const weaponPos = this.camera.position.clone().add(
            weaponOffset.applyEuler(this.rotation)
        );
        
        this.musket.mesh.position.copy(weaponPos);
        this.musket.mesh.rotation.copy(this.rotation);
        this.musket.mesh.rotateY(Math.PI); // Weapon points forward
    }
    
    attemptFire() {
        if (!this.alive) return null;
        
        if (this.musket.fire()) {
            // Calculate muzzle position and direction
            const muzzlePos = this.getMuzzlePosition();
            const direction = this.musket.getFiringDirection(this.getAimDirection());
            
            return {
                position: muzzlePos,
                direction: direction,
                velocity: this.musket.muzzleVelocity,
                owner: this
            };
        }
        return null;
    }
    
    getMuzzlePosition() {
        // Get muzzle position in world space
        const pos = new THREE.Vector3(0, 0.05, 0.9);
        pos.applyEuler(this.rotation);
        pos.add(this.camera.position);
        return pos;
    }
    
    getAimDirection() {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyEuler(this.rotation);
        return direction;
    }
    
    takeDamage(amount) {
        if (!this.alive) return;
        
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.alive = false;
        this.health = 0;
        this.respawnTimer = 3; // 3 second respawn
        
        // Reset musket
        this.musket.state = 'idle';
        this.musket.loaded = false;
        this.musket.cocked = false;
    }
    
    respawn() {
        this.alive = true;
        this.health = 100;
        
        // Random respawn position
        const spawnPoints = [
            new THREE.Vector3(-8, 0, -8),
            new THREE.Vector3(8, 0, -8),
            new THREE.Vector3(-8, 0, 8),
            new THREE.Vector3(8, 0, 8),
            new THREE.Vector3(0, 0, 0)
        ];
        
        this.position = spawnPoints[Math.floor(Math.random() * spawnPoints.length)].clone();
        this.rotation.set(0, Math.random() * Math.PI * 2, 0);
        this.velocity.set(0, 0, 0);
    }
    
    getState() {
        return {
            position: this.position.clone(),
            rotation: this.rotation.clone(),
            health: this.health,
            alive: this.alive,
            loaded: this.musket.loaded,
            state: this.musket.state
        };
    }
}