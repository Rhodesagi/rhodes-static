/**
 * Player - FPS player controller with iron sight aiming
 * Handles movement, camera rotation, FOV transitions
 */

class Player {
    constructor(scene, isPlayer1, startPosition) {
        this.scene = scene;
        this.isPlayer1 = isPlayer1;
        this.isAlive = true;
        this.health = 100;
        
        // Movement constants
        this.moveSpeed = 4; // m/s
        this.sprintMultiplier = 1.5;
        this.lookSpeed = 0.002;
        
        // Position and rotation
        this.position = startPosition.clone();
        this.rotation = new THREE.Euler(0, 0, 0);
        this.velocity = new THREE.Vector3();
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.camera.position.copy(this.position);
        this.camera.position.y += 1.7; // Eye height
        
        // FOV settings for iron sights
        this.normalFOV = 75;
        this.aimFOV = 25;
        this.currentFOV = this.normalFOV;
        this.targetFOV = this.normalFOV;
        this.fovTransitionSpeed = 8;
        
        // Aiming state
        this.isAiming = false;
        this.aimTransition = 0;
        
        // Weapon bob/sway
        this.bobTime = 0;
        this.bobAmount = 0.02;
        
        // Create musket
        this.musket = new Musket(scene, isPlayer1);
        
        // Attach musket to camera (first person view)
        this.camera.add(this.musket.mesh);
        
        // Last hit time (for hit effects)
        this.lastHitTime = 0;
        
        // Respawn timer
        this.respawnTimer = 0;
    }
    
    update(deltaTime, input, environment, otherPlayer) {
        if (!this.isAlive) {
            this.respawnTimer -= deltaTime;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }
        
        // Handle aiming
        if (input.aim) {
            if (!this.isAiming) {
                this.isAiming = true;
                this.targetFOV = this.aimFOV;
            }
        } else {
            if (this.isAiming) {
                this.isAiming = false;
                this.targetFOV = this.normalFOV;
            }
        }
        
        // Smooth FOV transition
        this.currentFOV = THREE.MathUtils.lerp(this.currentFOV, this.targetFOV, deltaTime * this.fovTransitionSpeed);
        this.camera.fov = this.currentFOV;
        this.camera.updateProjectionMatrix();
        
        // Handle rotation (mouse for P1, keyboard for P2)
        if (this.isPlayer1 && input.mouseDeltaX !== undefined) {
            this.rotation.y -= input.mouseDeltaX * this.lookSpeed;
            this.rotation.x = Math.max(-Math.PI / 2, 
                Math.min(Math.PI / 2, this.rotation.x - input.mouseDeltaY * this.lookSpeed));
        } else if (!this.isPlayer1) {
            // Player 2 uses keys for rotation when not moving
            if (!input.moveForward && !input.moveBackward) {
                if (input.lookLeft) this.rotation.y += deltaTime * 2;
                if (input.lookRight) this.rotation.y -= deltaTime * 2;
            }
        }
        
        // Calculate movement direction
        const moveDirection = new THREE.Vector3();
        
        if (input.moveForward) moveDirection.z -= 1;
        if (input.moveBackward) moveDirection.z += 1;
        if (input.moveLeft) moveDirection.x -= 1;
        if (input.moveRight) moveDirection.x += 1;
        
        // Normalize and rotate
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            
            // Rotate to camera direction
            const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, this.rotation.y, 0));
            const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, this.rotation.y, 0));
            
            moveDirection = forward.multiplyScalar(moveDirection.z).add(right.multiplyScalar(moveDirection.x));
        }
        
        // Apply movement with collision
        let targetSpeed = this.moveSpeed;
        if (this.isAiming) targetSpeed *= 0.5; // Slower when aiming
        
        // Smooth velocity
        this.velocity.lerp(moveDirection.multiplyScalar(targetSpeed), deltaTime * 10);
        
        // Calculate new position
        const movement = this.velocity.clone().multiplyScalar(deltaTime);
        const newPosition = this.position.clone().add(movement);
        
        // Check and resolve collisions
        const resolvedPosition = environment.resolveCollision(newPosition, 0.5);
        this.position.copy(resolvedPosition);
        
        // Update camera position
        this.camera.position.copy(this.position);
        this.camera.position.y += 1.7;
        
        // Add weapon bob when moving
        if (this.velocity.length() > 0.5) {
            this.bobTime += deltaTime * 10;
            const bobY = Math.sin(this.bobTime * 2) * this.bobAmount;
            const bobX = Math.cos(this.bobTime) * this.bobAmount * 0.5;
            this.camera.position.y += bobY;
            this.camera.position.x += bobX;
        }
        
        // Update camera rotation
        this.camera.rotation.x = this.rotation.x;
        this.camera.rotation.y = this.rotation.y;
        
        // Update musket
        this.musket.update(deltaTime, this.isAiming, this.camera);
        
        // Handle firing
        if (input.fire) {
            const fired = this.musket.fire();
            if (fired) {
                return this.createProjectile();
            }
        }
        
        // Handle reload
        if (input.reload) {
            this.musket.startReload();
        }
        
        return null;
    }
    
    createProjectile() {
        // Get muzzle position in world space
        const muzzlePos = this.musket.getMuzzlePosition();
        
        // Get barrel direction (from camera + slight randomization for realism)
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        
        // Add some spread based on whether aiming
        const spread = this.isAiming ? 0.01 : 0.03;
        direction.x += (Math.random() - 0.5) * spread;
        direction.y += (Math.random() - 0.5) * spread;
        direction.normalize();
        
        return new Projectile(muzzlePos, direction, this);
    }
    
    takeDamage(amount, hitPosition) {
        this.health -= amount;
        this.lastHitTime = Date.now();
        
        // Screen shake effect (camera kick)
        this.camera.position.add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        ));
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.isAlive = false;
        this.respawnTimer = 3; // 3 second respawn
        
        // Drop the musket visually
        this.musket.mesh.visible = false;
    }
    
    respawn() {
        this.isAlive = true;
        this.health = 100;
        this.musket.mesh.visible = true;
        this.musket.reset();
        
        // Respawn at random position
        this.position.set(
            (Math.random() - 0.5) * 40,
            0,
            (Math.random() - 0.5) * 40
        );
        
        // Ensure not too close to other player
        // (Will be handled by game)
    }
    
    setAspectRatio(aspect) {
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }
    
    // Get camera for rendering
    getCamera() {
        return this.camera;
    }
    
    // Get position for hit detection
    getPosition() {
        return this.position;
    }
}