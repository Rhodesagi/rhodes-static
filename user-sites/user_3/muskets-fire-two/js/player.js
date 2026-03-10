// Player Class - Movement, camera, aiming, and combat

class Player {
    constructor(scene, inputManager, playerNum, startPos) {
        this.scene = scene;
        this.input = inputManager;
        this.playerNum = playerNum;
        this.position = startPos.clone();
        this.rotation = { yaw: 0, pitch: 0 };
        
        // Physics
        this.velocity = new THREE.Vector3();
        this.speed = 2.5; // m/s
        this.height = 1.7;
        this.radius = 0.3;
        
        // Health
        this.health = 100;
        this.alive = true;
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.camera.position.copy(this.position);
        this.camera.position.y += this.height;
        
        // Iron sight positioning - camera at rear sight, looking through front sight
        this.rearSightOffset = new THREE.Vector3(0, -0.03, 0.08);
        this.frontSightDistance = 0.5; // Distance to front sight
        
        // Aiming state
        this.aimingDownSights = false;
        this.adsTransition = 0; // 0 = hip, 1 = ADS
        
        // Recoil
        this.recoilOffset = 0;
        
        // Create musket
        this.musket = new Musket(scene, playerNum === 1);
        
        // Death cam
        this.deathCamOffset = new THREE.Vector3();
        
        // Update musket position
        this.updateMusketPosition();
    }
    
    update(deltaTime, worldBounds) {
        if (!this.alive) return;
        
        // Handle input
        this.handleMovement(deltaTime, worldBounds);
        this.handleAiming(deltaTime);
        this.handleCombat(deltaTime);
        
        // Update camera position
        this.updateCameraPosition();
        
        // Update musket
        this.musket.update(deltaTime);
        this.updateMusketPosition();
        
        // Apply recoil recovery
        this.recoilOffset *= Math.pow(0.1, deltaTime);
    }
    
    handleMovement(deltaTime, worldBounds) {
        const moveInput = this.input.getMovement(this.playerNum);
        
        if (moveInput.x === 0 && moveInput.z === 0) {
            // Decelerate
            this.velocity.multiplyScalar(0.8);
        } else {
            // Calculate movement direction based on camera rotation
            const forward = new THREE.Vector3(
                Math.sin(this.rotation.yaw),
                0,
                Math.cos(this.rotation.yaw)
            );
            const right = new THREE.Vector3(
                Math.cos(this.rotation.yaw),
                0,
                -Math.sin(this.rotation.yaw)
            );
            
            const moveDir = new THREE.Vector3()
                .addScaledVector(forward, -moveInput.z)
                .addScaledVector(right, moveInput.x);
            
            // Slower when ADS
            const speedMult = this.aimingDownSights ? 0.4 : 1.0;
            
            this.velocity.x = moveDir.x * this.speed * speedMult;
            this.velocity.z = moveDir.z * this.speed * speedMult;
        }
        
        // Apply velocity
        const newPos = this.position.clone().add(
            this.velocity.clone().multiplyScalar(deltaTime)
        );
        
        // World bounds collision
        if (newPos.x >= worldBounds.minX && newPos.x <= worldBounds.maxX &&
            newPos.z >= worldBounds.minZ && newPos.z <= worldBounds.maxZ) {
            this.position.copy(newPos);
        }
        
        // Keep player on ground
        this.position.y = 0;
    }
    
    handleAiming(deltaTime) {
        // Check ADS input
        const wantsADS = this.input.isAiming(this.playerNum);
        const adsSpeed = 5.0; // Transition speed
        
        if (wantsADS) {
            this.aimingDownSights = true;
            this.adsTransition = Math.min(1, this.adsTransition + deltaTime * adsSpeed);
        } else {
            this.aimingDownSights = false;
            this.adsTransition = Math.max(0, this.adsTransition - deltaTime * adsSpeed);
        }
        
        // Handle mouse look (only if this player has pointer lock)
        const mouseDelta = this.input.getMouseDelta(this.playerNum);
        
        // For Player 2, also check arrow keys as alternative
        let lookX = mouseDelta.x;
        let lookY = mouseDelta.y;
        
        if (this.playerNum === 2 && lookX === 0 && lookY === 0) {
            const arrowAim = this.input.getArrowKeyAim(2);
            lookX = arrowAim.x * 200 * deltaTime;
            lookY = arrowAim.y * 200 * deltaTime;
        }
        
        const sensitivity = 0.002;
        this.rotation.yaw -= lookX * sensitivity;
        this.rotation.pitch -= lookY * sensitivity;
        
        // Clamp pitch
        this.rotation.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.pitch));
    }
    
    handleCombat(deltaTime) {
        // Reload
        if (this.input.isReloading(this.playerNum)) {
            this.musket.startReload();
        }
        
        // Fire
        if (this.input.isFiring(this.playerNum)) {
            const fireResult = this.musket.fire();
            if (fireResult) {
                // Apply recoil
                this.recoilOffset = 0.05;
                
                // Notify game to spawn projectile
                if (this.onFire) {
                    this.onFire(fireResult.position, fireResult.direction);
                }
            }
        }
    }
    
    updateCameraPosition() {
        // Base camera position (player eye level)
        this.camera.position.copy(this.position);
        this.camera.position.y += this.height;
        
        // Calculate forward direction
        const forward = new THREE.Vector3(
            Math.sin(this.rotation.yaw) * Math.cos(this.rotation.pitch),
            Math.sin(this.rotation.pitch),
            Math.cos(this.rotation.yaw) * Math.cos(this.rotation.pitch)
        ).normalize();
        
        const right = new THREE.Vector3(
            Math.cos(this.rotation.yaw),
            0,
            -Math.sin(this.rotation.yaw)
        ).normalize();
        
        // Iron Sights: Position camera at rear sight location
        if (this.adsTransition > 0) {
            // Calculate rear sight position in world space
            // The rear sight is offset from the center line of the gun
            const sightOffsetWorld = right.clone().multiplyScalar(this.rearSightOffset.x)
                .add(new THREE.Vector3(0, 1, 0).multiplyScalar(this.rearSightOffset.y))
                .add(forward.clone().multiplyScalar(this.rearSightOffset.z));
            
            // Apply sight offset
            this.camera.position.add(sightOffsetWorld.multiplyScalar(this.adsTransition));
            
            // Subtle FOV change for ADS
            const baseFOV = 75;
            const adsFOV = 60;
            this.camera.fov = baseFOV - (baseFOV - adsFOV) * this.adsTransition;
            this.camera.updateProjectionMatrix();
        } else {
            this.camera.fov = 75;
            this.camera.updateProjectionMatrix();
        }
        
        // Apply rotation with recoil
        const recoilPitch = this.recoilOffset;
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.rotation.yaw;
        this.camera.rotation.x = this.rotation.pitch + recoilPitch;
    }
    
    updateMusketPosition() {
        // Get camera direction vectors
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
        
        // Hip fire position (musket held at waist level, angled)
        const hipOffset = right.clone().multiplyScalar(0.2)
            .add(up.clone().multiplyScalar(-0.2))
            .add(forward.clone().multiplyScalar(0.4));
        
        // ADS position (musket shouldered, aligned with camera)
        // When in ADS, the musket should appear more centered
        const adsOffset = right.clone().multiplyScalar(0.05)
            .add(up.clone().multiplyScalar(-0.06))
            .add(forward.clone().multiplyScalar(0.25));
        
        // Blend between hip and ADS
        const finalOffset = hipOffset.clone().lerp(adsOffset, this.adsTransition);
        
        const musketPos = this.camera.position.clone().add(finalOffset);
        this.musket.setPosition(musketPos.x, musketPos.y, musketPos.z);
        
        // Set musket rotation to match camera
        this.musket.mesh.rotation.y = this.rotation.yaw + Math.PI;
        this.musket.mesh.rotation.x = -this.rotation.pitch - this.recoilOffset;
        this.musket.mesh.rotation.z = 0;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }
    
    die() {
        this.alive = false;
        this.musket.setVisible(false);
        
        // Death camera - fall back
        this.deathCamOffset.set(
            Math.sin(this.rotation.yaw) * 0.5,
            -0.5,
            Math.cos(this.rotation.yaw) * 0.5
        );
    }
    
    respawn(startPos) {
        this.position.copy(startPos);
        this.health = 100;
        this.alive = true;
        this.musket.setVisible(true);
        this.musket.state = ReloadState.READY;
        this.musket.loaded = false;
        this.velocity.set(0, 0, 0);
    }
    
    getForwardVector() {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.camera.quaternion);
        return forward;
    }
    
    setViewport(x, y, width, height) {
        this.camera.viewport = { x, y, width, height };
    }
    
    destroy() {
        this.musket.destroy();
    }
}
