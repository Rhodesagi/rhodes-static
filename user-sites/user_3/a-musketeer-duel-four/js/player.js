/**
 * Player Module - FPS controller with Q/E musket rotation
 * Player 1: WASD + QERFX
 * Player 2: IJKL + UOPM Enter
 */

class Player {
    constructor(id, startPosition, controls) {
        this.id = id;
        this.position = startPosition.clone();
        this.rotation = new THREE.Euler(0, 0, 0);
        this.musketRotation = 0; // Q/E rotation (wrist roll)
        
        // Movement
        this.velocity = new THREE.Vector3();
        this.speed = 3.0; // m/s (realistic walking speed)
        this.height = 1.7;
        this.radius = 0.3;
        
        // Controls
        this.controls = controls;
        this.keys = {};
        
        // Camera
        this.camera = null;
        this.musket = null;
        
        // State
        this.health = 100;
        this.isAiming = false;
        this.sights = new IronSights();
        this.ballistics = new Ballistics();
        this.projectiles = [];
        
        // Aiming constraints
        this.musketRotationSpeed = 1.5; // rad/s
        this.maxMusketRotation = 0.5; // ~30 degrees max wrist rotation
        
        // Collision
        this.mapBounds = { minX: -25, maxX: 25, minZ: -25, maxZ: 25 };
        this.obstacles = []; // Will be populated by game
    }

    init(scene, audioContext) {
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.camera.position.copy(this.position);
        this.camera.position.y = this.height;
        
        // Create musket
        this.musket = new Musket(audioContext);
        scene.add(this.musket.model);
        
        // Initial camera update
        this.updateCamera();
    }

    /**
     * Handle key input
     */
    setKey(key, pressed) {
        this.keys[key] = pressed;
    }

    /**
     * Update player state
     */
    update(deltaTime, otherPlayer) {
        // Handle input
        this.handleInput(deltaTime);
        
        // Apply movement
        this.applyMovement(deltaTime);
        
        // Check collision with other player
        this.checkPlayerCollision(otherPlayer);
        
        // Update musket
        if (this.musket) {
            this.musket.update(deltaTime, this.isAiming, this.musketRotation);
        }
        
        // Update camera
        this.updateCamera();
        
        // Update projectiles
        this.ballistics.updateProjectiles(
            this.projectiles, 
            deltaTime, 
            this.camera.parent || new THREE.Scene(),
            (pos) => this.checkProjectileHit(pos, otherPlayer)
        );
    }

    handleInput(deltaTime) {
        const c = this.controls;
        
        // Movement
        let moveForward = 0;
        let moveRight = 0;
        
        if (this.keys[c.forward]) moveForward += 1;
        if (this.keys[c.backward]) moveForward -= 1;
        if (this.keys[c.left]) moveRight -= 1;
        if (this.keys[c.right]) moveRight += 1;
        
        // Normalize diagonal movement
        if (moveForward !== 0 && moveRight !== 0) {
            const len = Math.sqrt(moveForward * moveForward + moveRight * moveRight);
            moveForward /= len;
            moveRight /= len;
        }
        
        // Apply to velocity
        this.velocity.x = 0;
        this.velocity.z = 0;
        
        if (moveForward !== 0 || moveRight !== 0) {
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
            forward.y = 0;
            forward.normalize();
            
            const right = new THREE.Vector3(1, 0, 0);
            right.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
            right.y = 0;
            right.normalize();
            
            this.velocity.add(forward.multiplyScalar(moveForward * this.speed));
            this.velocity.add(right.multiplyScalar(moveRight * this.speed));
        }
        
        // Musket rotation (Q/E) - constrained to avoid gimbal lock
        if (this.keys[c.rotateLeft]) {
            this.musketRotation += this.musketRotationSpeed * deltaTime;
        }
        if (this.keys[c.rotateRight]) {
            this.musketRotation -= this.musketRotationSpeed * deltaTime;
        }
        
        // Clamp musket rotation to realistic wrist limits
        this.musketRotation = Math.max(
            -this.maxMusketRotation, 
            Math.min(this.maxMusketRotation, this.musketRotation)
        );
        
        // Auto-return to center when not pressing
        if (!this.keys[c.rotateLeft] && !this.keys[c.rotateRight]) {
            this.musketRotation *= 0.95; // Return to center
        }
        
        // Aiming
        this.isAiming = this.keys[c.aim] || false;
        
        // Fire
        if (this.keys[c.fire]) {
            this.fire();
            this.keys[c.fire] = false; // Prevent autofire
        }
        
        // Reload
        if (this.keys[c.reload]) {
            this.musket.startReload();
            this.keys[c.reload] = false;
        }
    }

    applyMovement(deltaTime) {
        // Calculate new position
        const newPos = this.position.clone();
        newPos.x += this.velocity.x * deltaTime;
        newPos.z += this.velocity.z * deltaTime;
        
        // Check map bounds
        newPos.x = Math.max(
            this.mapBounds.minX + this.radius,
            Math.min(this.mapBounds.maxX - this.radius, newPos.x)
        );
        newPos.z = Math.max(
            this.mapBounds.minZ + this.radius,
            Math.min(this.mapBounds.maxZ - this.radius, newPos.z)
        );
        
        // Check obstacle collision
        for (const obstacle of this.obstacles) {
            if (this.checkObstacleCollision(newPos, obstacle)) {
                // Slide along obstacle
                const dx = newPos.x - obstacle.x;
                const dz = newPos.z - obstacle.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                
                if (dist < this.radius + obstacle.radius) {
                    const push = (this.radius + obstacle.radius - dist) / dist;
                    newPos.x += dx * push;
                    newPos.z += dz * push;
                }
            }
        }
        
        this.position.copy(newPos);
    }

    checkObstacleCollision(pos, obstacle) {
        const dx = pos.x - obstacle.x;
        const dz = pos.z - obstacle.z;
        const distSq = dx * dx + dz * dz;
        const minDist = this.radius + obstacle.radius;
        return distSq < minDist * minDist;
    }

    checkPlayerCollision(otherPlayer) {
        if (!otherPlayer) return;
        
        const dx = this.position.x - otherPlayer.position.x;
        const dz = this.position.z - otherPlayer.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const minDist = this.radius + otherPlayer.radius;
        
        if (dist < minDist) {
            // Push apart
            const push = (minDist - dist) / dist;
            const pushX = dx * push * 0.5;
            const pushZ = dz * push * 0.5;
            
            this.position.x += pushX;
            this.position.z += pushZ;
            otherPlayer.position.x -= pushX;
            otherPlayer.position.z -= pushZ;
        }
    }

    fire() {
        if (!this.musket) return;
        
        const result = this.musket.fire();
        if (result.fired) {
            // Get aim direction
            const aimData = this.sights.calculateAimDirection(this.camera, this.musketRotation);
            
            // Fire projectile from muzzle
            const muzzlePos = this.musket.getMuzzlePosition(this.camera);
            const projectile = this.ballistics.fire(muzzlePos, aimData.boreAxis);
            projectile.owner = this.id;
            
            // Create visual
            projectile.mesh = this.ballistics.createProjectileMesh(
                this.camera.parent || new THREE.Scene()
            );
            
            this.projectiles.push(projectile);
        }
    }

    checkProjectileHit(pos, otherPlayer) {
        if (!otherPlayer || otherPlayer.health <= 0) return false;
        
        const dx = pos.x - (otherPlayer.position.x);
        const dz = pos.z - (otherPlayer.position.z);
        const dy = pos.y - (otherPlayer.position.y + 1.0);
        
        const distSq = dx * dx + dy * dy + dz * dz;
        const hitRadius = 0.4; // Body hitbox
        
        if (distSq < hitRadius * hitRadius) {
            // Hit!
            otherPlayer.takeDamage(50); // One shot = half health
            return true;
        }
        
        return false;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        
        // Screen shake effect
        if (this.camera) {
            this.camera.position.x += (Math.random() - 0.5) * 0.1;
            this.camera.position.y += (Math.random() - 0.5) * 0.1;
        }
    }

    updateCamera() {
        if (!this.camera) return;
        
        this.camera.position.x = this.position.x;
        this.camera.position.z = this.position.z;
        this.camera.position.y = this.height;
        
        this.camera.rotation.copy(this.rotation);
        
        // Update musket model position relative to camera
        if (this.musket) {
            // Attach musket to camera
            this.camera.add(this.musket.model);
            
            // Adjust FOV based on aiming
            const targetFOV = this.isAiming ? 45 : 75;
            this.camera.fov += (targetFOV - this.camera.fov) * 0.1;
            this.camera.updateProjectionMatrix();
        }
    }

    /**
     * Get status for UI
     */
    getStatus() {
        return {
            health: this.health,
            ammo: this.musket ? (this.musket.loaded ? 'READY' : 
                this.musket.isReloading ? 'RELOADING' : 'EMPTY') : 'UNKNOWN',
            reloadStatus: this.musket ? this.musket.getReloadStatus() : null
        };
    }

    isDead() {
        return this.health <= 0;
    }

    respawn(position) {
        this.health = 100;
        this.position.copy(position);
        this.velocity.set(0, 0, 0);
        if (this.musket) {
            this.musket.cancelReload();
            this.musket.loaded = true;
            this.musket.cocked = true;
        }
    }
}