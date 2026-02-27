class Player {
    constructor(id, startPos, color) {
        this.id = id;
        this.position = startPos.clone();
        this.rotation = new THREE.Euler(0, id === 1 ? Math.PI : 0, 0);
        this.velocity = new THREE.Vector3();
        this.speed = 3.0;
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.camera.position.copy(this.position);
        this.camera.rotation.copy(this.rotation);
        
        // Musket
        this.musket = new Musket();
        this.musketOffset = new THREE.Vector3(0.15, -0.1, -0.3);
        this.musketAimOffset = new THREE.Vector3(0, -0.05, -0.15);
        
        // Viewport (set by game)
        this.viewport = { x: 0, y: 0, width: 1, height: 0.5 };
        
        // Physics
        this.radius = 0.3;
        this.height = 1.7;
        this.onGround = false;
        
        // Health
        this.health = 100;
        this.alive = true;
        
        // Musket tilt (Q/E controls)
        this.musketTilt = 0;
        this.tiltSpeed = 1.5;
        this.maxTilt = Math.PI / 6;
        
        // Recoil
        this.recoil = 0;
        
        // Create player model (for other player to see)
        this.createModel(color);
    }
    
    createModel(color) {
        this.model = new THREE.Group();
        
        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.6, 8);
        const bodyMat = new THREE.MeshLambertMaterial({ color: color });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.position.y = 0.8;
        this.model.add(this.body);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const headMat = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
        this.head = new THREE.Mesh(headGeo, headMat);
        this.head.position.y = 1.75;
        this.model.add(this.head);
        
        // Tricorne hat
        const hatBrimGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 3);
        const hatMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
        this.hat = new THREE.Mesh(hatBrimGeo, hatMat);
        this.hat.position.y = 1.95;
        this.model.add(this.hat);
        
        const hatCrownGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.2, 8);
        const hatCrown = new THREE.Mesh(hatCrownGeo, hatMat);
        hatCrown.position.y = 2.05;
        this.model.add(hatCrown);
        
        // Add musket to model (visible to other player)
        this.visibleMusket = new Musket();
        this.visibleMusket.mesh.scale.setScalar(0.8);
        this.visibleMusket.mesh.position.set(0.3, 1.0, 0.3);
        this.visibleMusket.mesh.rotation.y = -Math.PI / 4;
        this.model.add(this.visibleMusket.mesh);
        
        this.model.position.copy(this.position);
    }
    
    update(dt, keys, walls) {
        if (!this.alive) return;
        
        // Movement
        const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.rotation);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3(1, 0, 0).applyEuler(this.rotation);
        right.y = 0;
        right.normalize();
        
        let moveDir = new THREE.Vector3();
        
        if (this.id === 1) {
            // Player 1: WASD
            if (keys['w'] || keys['W']) moveDir.add(forward);
            if (keys['s'] || keys['S']) moveDir.sub(forward);
            if (keys['a'] || keys['A']) moveDir.sub(right);
            if (keys['d'] || keys['D']) moveDir.add(right);
        } else {
            // Player 2: Arrow keys
            if (keys['ArrowUp']) moveDir.add(forward);
            if (keys['ArrowDown']) moveDir.sub(forward);
            if (keys['ArrowLeft']) moveDir.sub(right);
            if (keys['ArrowRight']) moveDir.add(right);
        }
        
        if (moveDir.length() > 0) {
            moveDir.normalize();
            this.velocity.x = moveDir.x * this.speed;
            this.velocity.z = moveDir.z * this.speed;
        } else {
            this.velocity.x *= 0.8;
            this.velocity.z *= 0.8;
        }
        
        // Apply movement with collision
        this.moveWithCollision(dt, walls);
        
        // Musket tilt (Q/E)
        if (this.id === 1) {
            if (keys['q'] || keys['Q']) this.musketTilt += this.tiltSpeed * dt;
            if (keys['e'] || keys['E']) this.musketTilt -= this.tiltSpeed * dt;
        } else {
            if (keys['/']) this.musketTilt += this.tiltSpeed * dt;
            if (keys['.']) this.musketTilt -= this.tiltSpeed * dt;
        }
        this.musketTilt = Math.max(-this.maxTilt, Math.min(this.maxTilt, this.musketTilt));
        
        // Update musket
        const reloadStatus = this.musket.updateReload(dt);
        
        // Recoil recovery
        this.recoil = Math.max(0, this.recoil - dt * 2);
        
        // Update camera position
        this.updateCamera();
        
        // Update model
        this.model.position.copy(this.position);
        this.model.rotation.y = this.rotation.y;
        
        return reloadStatus;
    }
    
    moveWithCollision(dt, walls) {
        const newPos = this.position.clone();
        newPos.x += this.velocity.x * dt;
        newPos.z += this.velocity.z * dt;
        
        // Wall collision
        for (const wall of walls) {
            const dx = newPos.x - wall.x;
            const dz = newPos.z - wall.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const minDist = this.radius + wall.radius;
            
            if (dist < minDist) {
                // Slide along wall
                const nx = dx / dist;
                const nz = dz / dist;
                const overlap = minDist - dist;
                
                newPos.x += nx * overlap;
                newPos.z += nz * overlap;
            }
        }
        
        this.position.copy(newPos);
    }
    
    updateCamera() {
        // Camera follows player position
        this.camera.position.copy(this.position);
        this.camera.position.y += 1.6; // Eye height
        
        // Apply rotation
        this.camera.rotation.x = this.rotation.x;
        this.camera.rotation.y = this.rotation.y;
        this.camera.rotation.z = this.rotation.z;
        
        // Apply recoil
        this.camera.rotation.x += this.recoil * 0.3;
        
        // Position musket in view
        const isAiming = this.musket.aiming;
        const offset = isAiming ? this.musketAimOffset : this.musketOffset;
        
        this.musket.mesh.position.copy(this.camera.position);
        this.musket.mesh.position.add(
            offset.clone().applyEuler(this.camera.rotation)
        );
        
        this.musket.mesh.rotation.copy(this.camera.rotation);
        this.musket.mesh.rotation.z += this.musketTilt;
        
        // When aiming, move camera to sight position
        if (isAiming) {
            // Offset to align rear sight with view
            const sightOffset = new THREE.Vector3(0, 0.02, -0.3);
            this.camera.position.add(sightOffset.applyEuler(this.camera.rotation));
            this.camera.fov = 45; // Zoom in
        } else {
            this.camera.fov = 75;
        }
        this.camera.updateProjectionMatrix();
    }
    
    aim(enabled) {
        this.musket.setAiming(enabled);
    }
    
    fire() {
        const result = this.musket.fire();
        if (result) {
            this.recoil = 1.0;
        }
        return result;
    }
    
    reload() {
        return this.musket.startReload();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
        }
        return this.alive;
    }
    
    reset(startPos) {
        this.position.copy(startPos);
        this.health = 100;
        this.alive = true;
        this.musket.reset();
        this.velocity.set(0, 0, 0);
        this.musketTilt = 0;
        this.recoil = 0;
    }
    
    setViewport(x, y, width, height) {
        this.viewport = { x, y, width, height };
    }
    
    // Mouse look for this player (called when mouse moves in their viewport)
    look(deltaX, deltaY, sensitivity = 0.002) {
        this.rotation.y -= deltaX * sensitivity;
        this.rotation.x -= deltaY * sensitivity;
        this.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.rotation.x));
    }
}