// Muskets Fire 3 - Player Controller with Iron Sight Aiming
// No artificial crosshairs - proper rear notch / front post alignment

class Player {
    constructor(id, scene, audioSystem) {
        this.id = id;
        this.health = 100;
        this.isDead = false;
        
        // Camera system
        this.camera = new THREE.PerspectiveCamera(60, 1, 0.01, 1000);
        this.camera.position.set(id === 1 ? -5 : 5, 1.7, 0);
        
        // Viewport
        this.viewport = {
            x: id === 1 ? 0 : 0.5,
            y: 0,
            width: 0.5,
            height: 1
        };
        
        // Movement
        this.position = this.camera.position.clone();
        this.velocity = new THREE.Vector3();
        this.rotation = { x: 0, y: id === 1 ? Math.PI / 2 : -Math.PI / 2 };
        this.pitch = 0;
        this.yaw = this.rotation.y;
        
        // Weapon system
        this.musketModel = new MusketModel();
        this.reloadSystem = new ReloadStateMachine(this.musketModel, audioSystem);
        this.scene = scene;
        scene.add(this.musketModel.mesh);
        
        // Weapon positioning
        this.weaponOffset = new THREE.Vector3(0.15, -0.1, 0.25);
        this.aimOffset = new THREE.Vector3(0, -0.04, 0.15);
        
        // Iron sight aiming
        this.isAiming = false;
        this.aimTransition = 0; // 0 = hip, 1 = aimed
        this.normalFOV = 60;
        this.aimFOV = 25; // Zoomed for iron sights
        
        // Aim alignment
        this.rearSightPos = new THREE.Vector3(0, 0.082, 0.12); // Local to musket
        this.frontSightPos = new THREE.Vector3(0, 0.055, -0.85); // Local to musket
        
        // Input state
        this.keys = {};
        this.mouseDelta = { x: 0, y: 0 };
        this.pointerLocked = false;
        
        // Keyboard aim for player 2 (no 2nd mouse in browser)
        this.keyboardAim = { x: 0, y: 0 };
        
        // Sway/bob
        this.swayPhase = 0;
        this.breathing = 0;
        
        // Flash effect
        this.flash = new MuzzleFlash(scene);
        
        // Collision
        this.radius = 0.3;
        this.height = 1.7;
        
        // Bind input
        this.setupInput();
        
        // Initial position update
        this.updateWeaponPosition();
    }
    
    setupInput() {
        if (this.id === 1) {
            // Player 1: WASD + Mouse (Pointer Lock)
            document.addEventListener('keydown', (e) => {
                if (this.id === 1) this.keys[e.code] = true;
            });
            document.addEventListener('keyup', (e) => {
                if (this.id === 1) this.keys[e.code] = false;
            });
            
            // Mouse movement
            document.addEventListener('mousemove', (e) => {
                if (this.id === 1 && this.pointerLocked) {
                    this.mouseDelta.x += e.movementX * 0.002;
                    this.mouseDelta.y += e.movementY * 0.002;
                }
            });
            
            // Click to lock pointer (left half)
            document.getElementById('p1-ui').addEventListener('click', () => {
                if (this.id === 1) {
                    document.getElementById('gameCanvas').requestPointerLock();
                }
            });
            
            document.addEventListener('pointerlockchange', () => {
                this.pointerLocked = !!document.pointerLockElement;
            });
            
            document.addEventListener('mousedown', (e) => {
                if (this.id === 1 && e.button === 0 && this.pointerLocked) {
                    this.fire();
                }
            });
            
        } else {
            // Player 2: IJKL + Arrow keys (no mouse)
            document.addEventListener('keydown', (e) => {
                if (this.id === 2) {
                    this.keys[e.code] = true;
                    // Arrow keys for looking
                    if (e.code === 'ArrowLeft') this.keyboardAim.x -= 0.15;
                    if (e.code === 'ArrowRight') this.keyboardAim.x += 0.15;
                    if (e.code === 'ArrowUp') this.keyboardAim.y -= 0.15;
                    if (e.code === 'ArrowDown') this.keyboardAim.y += 0.15;
                    if (e.code === 'Enter') this.fire();
                }
            });
            document.addEventListener('keyup', (e) => {
                if (this.id === 2) this.keys[e.code] = false;
            });
        }
    }
    
    update(dt, otherPlayer, environment) {
        if (this.isDead) return;
        
        // Reload update
        this.reloadSystem.update(dt);
        
        // Muzzle flash update
        this.flash.update(dt);
        
        // Movement
        this.updateMovement(dt, environment);
        
        // Looking/aiming
        this.updateAiming(dt);
        
        // Weapon positioning
        this.updateWeaponPosition();
        
        // Breathing/sway animation
        this.swayPhase += dt * 0.002;
        this.breathing = Math.sin(this.swayPhase) * 0.001;
        
        // Clamp pitch
        this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI / 2.2, Math.PI / 2.2);
        
        // Update camera rotation
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch + (this.isAiming ? 0 : this.breathing);
    }
    
    updateMovement(dt, environment) {
        const speed = 3.0 * dt; // m/s
        const move = new THREE.Vector3();
        
        if (this.id === 1) {
            // P1: WASD
            if (this.keys['KeyW']) move.z -= 1;
            if (this.keys['KeyS']) move.z += 1;
            if (this.keys['KeyA']) move.x -= 1;
            if (this.keys['KeyD']) move.x += 1;
        } else {
            // P2: IJKL
            if (this.keys['KeyI']) move.z -= 1;
            if (this.keys['KeyK']) move.z += 1;
            if (this.keys['KeyJ']) move.x -= 1;
            if (this.keys['KeyL']) move.x += 1;
        }
        
        // Normalize and apply rotation
        if (move.length() > 0) {
            move.normalize();
            move.multiplyScalar(speed);
            
            // Rotate by yaw
            const rotatedX = move.x * Math.cos(this.yaw) + move.z * Math.sin(this.yaw);
            const rotatedZ = -move.x * Math.sin(this.yaw) + move.z * Math.cos(this.yaw);
            
            this.velocity.x = rotatedX;
            this.velocity.z = rotatedZ;
        } else {
            this.velocity.x *= 0.9;
            this.velocity.z *= 0.9;
        }
        
        // Apply velocity with collision
        const newPos = this.position.clone();
        newPos.x += this.velocity.x;
        newPos.z += this.velocity.z;
        
        // Simple bounds check
        newPos.x = THREE.MathUtils.clamp(newPos.x, -18, 18);
        newPos.z = THREE.MathUtils.clamp(newPos.z, -18, 18);
        
        this.position.copy(newPos);
        this.camera.position.copy(this.position);
    }
    
    updateAiming(dt) {
        if (this.id === 1) {
            // Mouse aiming
            this.yaw -= this.mouseDelta.x;
            this.pitch -= this.mouseDelta.y;
            this.mouseDelta.x = 0;
            this.mouseDelta.y = 0;
        } else {
            // Keyboard smoothing
            this.yaw -= this.keyboardAim.x * dt * 0.1;
            this.pitch -= this.keyboardAim.y * dt * 0.1;
            this.keyboardAim.x *= 0.9;
            this.keyboardAim.y *= 0.9;
        }
        
        // Hold Right Click (or Shift) to aim iron sights
        const aimInput = this.id === 1 ? 
            (this.keys['ShiftLeft'] || this.keys['ShiftRight']) : 
            (this.keys['ShiftLeft']);
        
        this.isAiming = aimInput;
        
        // Smooth transition
        const targetTransition = this.isAiming ? 1 : 0;
        this.aimTransition += (targetTransition - this.aimTransition) * dt * 0.008;
        
        // Update FOV
        this.camera.fov = THREE.MathUtils.lerp(this.normalFOV, this.aimFOV, this.aimTransition);
        this.camera.updateProjectionMatrix();
    }
    
    updateWeaponPosition() {
        const musket = this.musketModel.mesh;
        
        // Get camera direction
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.camera.quaternion);
        
        // Position weapon
        const offset = new THREE.Vector3().lerpVectors(
            this.weaponOffset,
            this.aimOffset,
            this.aimTransition
        );
        
        // Add sway
        offset.x += Math.sin(this.swayPhase) * 0.002;
        offset.y += this.breathing;
        
        // Calculate weapon position in camera space
        const weaponPos = this.camera.position.clone().add(
            forward.clone().multiplyScalar(offset.z)
        );
        
        // Side offset
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.camera.quaternion);
        weaponPos.add(right.clone().multiplyScalar(offset.x));
        
        // Up offset
        const up = new THREE.Vector3(0, 1, 0);
        up.applyQuaternion(this.camera.quaternion);
        weaponPos.add(up.clone().multiplyScalar(offset.y + 1.6)); // Eye height offset
        
        musket.position.copy(weaponPos);
        
        // Weapon rotation - align with camera
        musket.rotation.x = this.camera.rotation.x;
        musket.rotation.y = this.camera.rotation.y;
        musket.rotation.z = this.camera.rotation.z;
        
        // Add slight idle sway rotation
        musket.rotation.z += Math.sin(this.swayPhase * 0.7) * 0.01;
        
        // Iron sight alignment adjustment when aiming
        if (this.aimTransition > 0.5) {
            // Fine-tune weapon rotation to align sights
            // This is the critical "iron sight" feature
            musket.rotateY(0.02); // Align rear notch with eye
            musket.rotateX(-0.01); // Slight elevation compensation
        }
    }
    
    fire() {
        if (!this.reloadSystem.canFire()) {
            // Click on empty - dry fire sound or just ignore
            return;
        }
        
        // Trigger reload sequence
        this.reloadSystem.fire();
        
        // Muzzle flash
        const muzzlePos = this.musketModel.getMuzzleWorldPosition();
        const aimDir = this.musketModel.getAimDirection();
        this.flash.trigger(muzzlePos, aimDir);
        
        // Return projectile info for ballistics
        return {
            origin: muzzlePos,
            direction: aimDir,
            player: this
        };
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
        return this.health;
    }
    
    getAimRay() {
        return {
            origin: this.musketModel.getMuzzleWorldPosition(),
            direction: this.musketModel.getAimDirection()
        };
    }
    
    respawn() {
        this.health = 100;
        this.isDead = false;
        this.position.set(
            this.id === 1 ? -5 : 5,
            1.7,
            0
        );
        this.camera.position.copy(this.position);
        this.yaw = this.id === 1 ? Math.PI / 2 : -Math.PI / 2;
        this.pitch = 0;
        this.reloadSystem.state = 'IDLE';
    }
    
    getUIState() {
        return {
            health: this.health,
            reloadProgress: this.reloadSystem.getProgress(),
            reloadStage: this.reloadSystem.getCurrentStageName(),
            isAiming: this.isAiming,
            canFire: this.reloadSystem.canFire()
        };
    }
}
