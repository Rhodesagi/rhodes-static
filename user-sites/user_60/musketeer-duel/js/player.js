/**
 * Player controller
 * Combines camera, movement, and musket handling
 */

class Player {
    constructor(scene, id, spawnPosition, spawnRotation) {
        this.id = id;
        this.scene = scene;
        
        // Position and rotation
        this.position = spawnPosition.clone();
        this.rotation = spawnRotation.clone();
        this.velocity = new THREE.Vector3();
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(60, 0.5, 0.1, 1000);
        this.camera.position.copy(this.position);
        this.camera.rotation.copy(this.rotation);
        
        // Height
        this.eyeHeight = 1.7;
        this.position.y = this.eyeHeight;
        
        // Movement
        this.moveSpeed = 4.0; // m/s
        this.turnSpeed = 2.0; // rad/s
        this.currentMoveSpeed = 0;
        
        // Input state
        this.lookEuler = new THREE.Euler(0, spawnRotation.y, 0, 'YXZ');
        this.lookInput = { x: 0, y: 0 };
        
        // Musket
        this.musket = new Musket(scene, id);
        this.scene.add(this.musket.group);
        
        // Hit state
        this.isAlive = true;
        this.respawnTimer = 0;
        
        // Third person mesh for opponent to see
        this.bodyMesh = this.createBodyMesh();
        this.scene.add(this.bodyMesh);
        
        // Weapon bob
        this.weaponBob = 0;
        this.bobPhase = 0;
    }
    
    createBodyMesh() {
        const group = new THREE.Group();
        
        // Simple cylinder body
        const bodyGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.7, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: this.id === 1 ? 0xcc4444 : 0x4444cc,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.85;
        group.add(body);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.18, 8, 8);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.y = 1.8;
        group.add(head);
        
        // Hat (tricorne style simplified)
        const hatGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 8);
        const hatMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const hat = new THREE.Mesh(hatGeo, hatMat);
        hat.position.y = 1.95;
        group.add(hat);
        
        // Brim
        const brimGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.02, 8);
        const brim = new THREE.Mesh(brimGeo, hatMat);
        brim.position.y = 1.9;
        group.add(brim);
        
        // Position body
        group.position.copy(this.position);
        
        return group;
    }
    
    update(dt, input, particleSystem, projectiles, otherPlayer) {
        if (!this.isAlive) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }
        
        // Update look direction
        const lookInput = input.getLookInput(this.id);
        this.lookEuler.y -= lookInput.x * this.turnSpeed * dt * 0.1;
        this.lookEuler.x -= lookInput.y * this.turnSpeed * dt * 0.1;
        
        // Clamp pitch
        this.lookEuler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.lookEuler.x));
        
        this.camera.rotation.copy(this.lookEuler);
        
        // Get movement input
        const moveInput = input.getMovementVector(this.id);
        
        // Calculate movement direction relative to look direction
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(new THREE.Euler(0, this.lookEuler.y, 0));
        forward.y = 0;
        forward.normalize();
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyEuler(new THREE.Euler(0, this.lookEuler.y, 0));
        right.y = 0;
        right.normalize();
        
        // Movement vector
        const moveDir = new THREE.Vector3()
            .addScaledVector(forward, moveInput.z)
            .addScaledVector(right, moveInput.x);
        
        if (moveDir.length() > 0) {
            moveDir.normalize();
            this.currentMoveSpeed = this.moveSpeed;
            this.bobPhase += dt * 10;
        } else {
            this.currentMoveSpeed = 0;
            this.bobPhase = 0;
        }
        
        // Apply movement
        const movement = moveDir.multiplyScalar(this.currentMoveSpeed * dt);
        
        // Check musket movement restrictions
        const canMoveNow = this.musket.canMove || 
                          (this.musket.currentStage !== 'ramrod_down');
        
        if (canMoveNow) {
            this.position.add(movement);
        }
        
        // Update camera position
        this.camera.position.copy(this.position);
        this.camera.position.y = this.eyeHeight;
        
        // Update body mesh position (for other player to see)
        this.bodyMesh.position.copy(this.position);
        this.bodyMesh.rotation.y = this.lookEuler.y;
        
        // Update musket position (attached to camera)
        this.musket.group.position.copy(this.camera.position);
        this.musket.group.rotation.copy(this.camera.rotation);
        
        // Add weapon bob when moving
        const bobAmount = Math.sin(this.bobPhase) * 0.02 * (this.currentMoveSpeed / this.moveSpeed);
        const swayAmount = Math.cos(this.bobPhase * 0.5) * 0.01 * (this.currentMoveSpeed / this.moveSpeed);
        
        this.musket.group.position.y += bobAmount;
        this.musket.group.position.x += swayAmount;
        
        // Handle inputs
        const time = performance.now() / 1000;
        
        // Aiming
        if (this.id === 1) {
            this.musket.setAiming(input.p1.q);
        } else {
            this.musket.setAiming(input.p2.aim);
        }
        
        // Reload advancement
        let reloadPressed = false;
        if (this.id === 1) {
            reloadPressed = input.isJustPressed('p1', 'e');
        } else {
            reloadPressed = input.isJustPressed('p2', 'reload');
        }
        
        if (reloadPressed) {
            this.musket.advanceReload();
        }
        
        // Firing
        let firePressed = false;
        if (this.id === 1) {
            firePressed = input.isJustPressed('p1', 'f');
        } else {
            firePressed = input.isJustPressed('p2', 'fire');
        }
        
        if (firePressed && this.musket.isReadyToFire()) {
            const fired = this.musket.fire();
            if (fired) {
                // Actually fire projectile
                const muzzlePos = this.getMuzzleWorldPosition();
                const fireDir = this.getFireDirection();
                projectiles.fire(muzzlePos, fireDir, 450, this.id);
            }
        }
        
        // Update musket
        this.musket.update(dt, this.currentMoveSpeed / this.moveSpeed, time, this.camera.rotation);
    }
    
    getMuzzleWorldPosition() {
        // Get musket's world matrix
        this.musket.group.updateMatrixWorld();
        return this.musket.getMuzzlePosition(this.musket.group.matrixWorld);
    }
    
    getFireDirection() {
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyEuler(this.camera.rotation);
        return dir;
    }
    
    onHit(ball) {
        // Player was hit!
        this.isAlive = false;
        this.respawnTimer = 3.0;
        
        // Hide body temporarily
        this.bodyMesh.visible = false;
        
        // Create hit effect
        // Could add sound here
    }
    
    respawn() {
        this.isAlive = true;
        this.bodyMesh.visible = true;
        
        // Reset position to spawn
        this.position.set(
            this.id === 1 ? -10 : 10,
            this.eyeHeight,
            0
        );
        this.lookEuler.set(0, this.id === 1 ? Math.PI / 2 : -Math.PI / 2, 0, 'YXZ');
        
        // Reset musket
        this.musket.reset();
    }
    
    /**
     * Get camera FOV based on aiming
     */
    getFOV() {
        return this.musket.getAimFOV(60);
    }
    
    /**
     * Get reload status text for display
     */
    getStatusText() {
        return this.musket.getReloadStatus();
    }
}