// Musket Class - Procedural reload animations and state machine

const ReloadState = {
    READY: 'ready',
    PRIMING: 'priming',      // Half-cock, open pan
    POWDER: 'powder',        // Pour powder into barrel
    PATCH: 'patch',          // Place patch
    BALL: 'ball',            // Place ball
    RAMMING: 'ramming',      // Ram everything down
    FULL_COCK: 'fullcock',   // Full cock, close pan
    AIMING: 'aiming'         // Ready to fire
};

class Musket {
    constructor(scene, isPlayer1) {
        this.scene = scene;
        this.isPlayer1 = isPlayer1;
        this.state = ReloadState.READY;
        this.stateTimer = 0;
        this.loaded = false;
        
        // Animation properties
        this.animationTime = 0;
        this.currentAnim = null;
        this.animProgress = 0;
        
        // Visual group
        this.mesh = new THREE.Group();
        this.buildMusket();
        
        // State timing (seconds)
        this.stateDurations = {
            [ReloadState.PRIMING]: 1.5,
            [ReloadState.POWDER]: 2.0,
            [ReloadState.PATCH]: 1.0,
            [ReloadState.BALL]: 1.5,
            [ReloadState.RAMMING]: 3.0,
            [ReloadState.FULL_COCK]: 1.0,
            [ReloadState.AIMING]: 0.5
        };
        
        // Flash intensity
        this.flashIntensity = 0;
    }
    
    buildMusket() {
        const woodColor = this.isPlayer1 ? 0x5c4033 : 0x4a3728;
        const metalColor = 0x3a3a3a;
        const brassColor = 0xb5a642;
        
        // Main stock (wood) - longer and more detailed
        const stockGeo = new THREE.BoxGeometry(0.06, 0.1, 1.0);
        const stockMat = new THREE.MeshStandardMaterial({ 
            color: woodColor,
            roughness: 0.8
        });
        this.stock = new THREE.Mesh(stockGeo, stockMat);
        this.mesh.add(this.stock);
        
        // Stock butt plate (metal)
        const buttGeo = new THREE.BoxGeometry(0.07, 0.12, 0.05);
        const metalMat = new THREE.MeshStandardMaterial({ 
            color: metalColor,
            metalness: 0.7,
            roughness: 0.4
        });
        const butt = new THREE.Mesh(buttGeo, metalMat);
        butt.position.z = -0.5;
        this.mesh.add(butt);
        
        // Barrel (metal) - longer and thinner
        const barrelGeo = new THREE.CylinderGeometry(0.018, 0.015, 1.1, 12);
        const barrelMat = new THREE.MeshStandardMaterial({ 
            color: metalColor,
            metalness: 0.8,
            roughness: 0.3
        });
        this.barrel = new THREE.Mesh(barrelGeo, barrelMat);
        this.barrel.rotation.x = Math.PI / 2;
        this.barrel.position.set(0, 0.07, 0.15);
        this.mesh.add(this.barrel);
        
        // Barrel bands (brass)
        for (let i = 0; i < 3; i++) {
            const bandGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.03, 8);
            const brassMat = new THREE.MeshStandardMaterial({ 
                color: brassColor,
                metalness: 0.9,
                roughness: 0.2
            });
            const band = new THREE.Mesh(bandGeo, brassMat);
            band.rotation.x = Math.PI / 2;
            band.position.set(0, 0.07, -0.2 + i * 0.25);
            this.mesh.add(band);
        }
        
        // Front sight - distinct blade sight
        const frontSightBaseGeo = new THREE.BoxGeometry(0.02, 0.01, 0.01);
        const sightMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const frontBase = new THREE.Mesh(frontSightBaseGeo, sightMat);
        frontBase.position.set(0, 0.13, 0.65);
        this.mesh.add(frontBase);
        
        // Front sight blade
        const frontBladeGeo = new THREE.BoxGeometry(0.005, 0.025, 0.003);
        this.frontSight = new THREE.Mesh(frontBladeGeo, sightMat);
        this.frontSight.position.set(0, 0.15, 0.65);
        this.mesh.add(this.frontSight);
        
        // Rear sight - notch sight, clearly visible
        const rearSightBaseGeo = new THREE.BoxGeometry(0.025, 0.01, 0.04);
        this.rearSight = new THREE.Mesh(rearSightBaseGeo, sightMat);
        this.rearSight.position.set(0, 0.11, -0.22);
        this.mesh.add(this.rearSight);
        
        // Rear sight notch (cutout visualization)
        const notchGeo = new THREE.BoxGeometry(0.008, 0.012, 0.005);
        const notchMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const notch = new THREE.Mesh(notchGeo, notchMat);
        notch.position.set(0, 0.118, -0.22);
        this.mesh.add(notch);
        
        // Hammer/flintlock mechanism
        const hammerBaseGeo = new THREE.BoxGeometry(0.025, 0.06, 0.025);
        this.hammer = new THREE.Mesh(hammerBaseGeo, metalMat);
        this.hammer.position.set(0, 0.14, -0.18);
        this.mesh.add(this.hammer);
        
        // Frizzen (part of lock mechanism)
        const frizzenGeo = new THREE.BoxGeometry(0.03, 0.04, 0.02);
        const frizzen = new THREE.Mesh(frizzenGeo, metalMat);
        frizzen.position.set(0.04, 0.12, -0.15);
        frizzen.rotation.z = -0.3;
        this.mesh.add(frizzen);
        
        // Pan (flash area) - where powder ignites
        const panGeo = new THREE.BoxGeometry(0.035, 0.008, 0.035);
        const panMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        this.pan = new THREE.Mesh(panGeo, panMat);
        this.pan.position.set(0, 0.115, -0.14);
        this.mesh.add(this.pan);
        
        // Trigger guard
        const triggerGuardGeo = new THREE.TorusGeometry(0.04, 0.003, 4, 8, Math.PI);
        const triggerGuard = new THREE.Mesh(triggerGuardGeo, metalMat);
        triggerGuard.rotation.z = Math.PI;
        triggerGuard.position.set(0, 0.02, -0.05);
        this.mesh.add(triggerGuard);
        
        // Trigger
        const triggerGeo = new THREE.BoxGeometry(0.008, 0.02, 0.008);
        this.trigger = new THREE.Mesh(triggerGeo, metalMat);
        this.trigger.position.set(0, 0.03, -0.05);
        this.trigger.rotation.x = 0.3;
        this.mesh.add(this.trigger);
        
        // Flash effect (hidden by default)
        const flashGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00, 
            transparent: true, 
            opacity: 0 
        });
        this.flash = new THREE.Mesh(flashGeo, flashMat);
        this.flash.position.set(0, 0.115, -0.14);
        this.mesh.add(this.flash);
        
        // Muzzle flash
        const muzzleFlashGeo = new THREE.ConeGeometry(0.05, 0.2, 8);
        const muzzleFlashMat = new THREE.MeshBasicMaterial({ 
            color: 0xff6600,
            transparent: true,
            opacity: 0
        });
        this.muzzleFlash = new THREE.Mesh(muzzleFlashGeo, muzzleFlashMat);
        this.muzzleFlash.rotation.x = -Math.PI / 2;
        this.muzzleFlash.position.set(0, 0.07, 0.75);
        this.mesh.add(this.muzzleFlash);
        
        // Ramrod (visible during reload)
        const ramrodGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.9, 6);
        const ramrodMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        this.ramrod = new THREE.Mesh(ramrodGeo, ramrodMat);
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrod.position.set(0.035, 0.015, 0);
        this.ramrod.visible = false;
        this.mesh.add(this.ramrod);
        
        // Ramrod thimbles (holders)
        for (let i = 0; i < 2; i++) {
            const thimbleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.02, 6);
            const thimble = new THREE.Mesh(thimbleGeo, brassMat);
            thimble.rotation.x = Math.PI / 2;
            thimble.position.set(0.035, 0.015, -0.1 + i * 0.3);
            this.mesh.add(thimble);
        }
        
        // Add to scene
        this.scene.add(this.mesh);
    }
    
    startReload() {
        if (this.loaded || this.state !== ReloadState.READY) return false;
        this.state = ReloadState.PRIMING;
        this.stateTimer = 0;
        this.animProgress = 0;
        return true;
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Handle reload state machine
        if (this.state !== ReloadState.READY && this.state !== ReloadState.AIMING) {
            this.stateTimer += deltaTime;
            const duration = this.stateDurations[this.state];
            this.animProgress = this.stateTimer / duration;
            
            if (this.stateTimer >= duration) {
                this.advanceReloadState();
            }
        }
        
        // Update procedural animations
        this.updateAnimations(deltaTime);
        
        // Update muzzle flash fade
        if (this.flashIntensity > 0) {
            this.flashIntensity -= deltaTime * 5;
            if (this.flashIntensity < 0) this.flashIntensity = 0;
            this.flash.material.opacity = this.flashIntensity;
            this.muzzleFlash.material.opacity = this.flashIntensity * 0.8;
        }
    }
    
    advanceReloadState() {
        switch (this.state) {
            case ReloadState.PRIMING:
                this.state = ReloadState.POWDER;
                break;
            case ReloadState.POWDER:
                this.state = ReloadState.PATCH;
                break;
            case ReloadState.PATCH:
                this.state = ReloadState.BALL;
                break;
            case ReloadState.BALL:
                this.state = ReloadState.RAMMING;
                break;
            case ReloadState.RAMMING:
                this.state = ReloadState.FULL_COCK;
                break;
            case ReloadState.FULL_COCK:
                this.state = ReloadState.AIMING;
                this.loaded = true;
                break;
        }
        this.stateTimer = 0;
        this.animProgress = 0;
    }
    
    updateAnimations(deltaTime) {
        // Procedural animations based on state
        const animSpeed = 2.0;
        
        switch (this.state) {
            case ReloadState.PRIMING:
                // Tilt musket down, cock hammer to half-cock
                this.mesh.rotation.x = this.lerp(0, -0.4, this.animProgress);
                this.hammer.rotation.z = this.lerp(0, 0.4, this.animProgress);
                // Slight sideways tilt for visual interest
                this.mesh.rotation.z = Math.sin(this.animationTime * 3) * 0.02;
                break;
                
            case ReloadState.POWDER:
                // Shake/pour motion - more exaggerated
                const shake = Math.sin(this.animationTime * 8) * 0.03 * (1 - this.animProgress * 0.5);
                this.mesh.rotation.z = shake;
                this.mesh.rotation.x = -0.4 + Math.sin(this.animProgress * Math.PI) * 0.1;
                // Tilt to pour
                if (this.animProgress > 0.3 && this.animProgress < 0.7) {
                    this.mesh.rotation.x -= 0.2;
                }
                break;
                
            case ReloadState.PATCH:
                // Place patch - subtle reach motion
                this.mesh.rotation.x = -0.3 + Math.sin(this.animProgress * Math.PI) * 0.15;
                this.mesh.rotation.y = Math.sin(this.animProgress * Math.PI * 2) * 0.1;
                break;
                
            case ReloadState.BALL:
                // Place ball - pushing motion
                this.mesh.rotation.x = -0.35 + Math.sin(this.animProgress * Math.PI) * 0.2;
                // Forward push
                this.mesh.position.z += Math.sin(this.animProgress * Math.PI) * 0.02;
                break;
                
            case ReloadState.RAMMING:
                // Show ramrod, move up and down vigorously
                this.ramrod.visible = true;
                // Multiple ramming strokes
                const ramCycles = 3;
                const ramPhase = (this.animProgress * ramCycles) % 1;
                const ramProgress = Math.sin(ramPhase * Math.PI); // 0 to 1 to 0
                this.ramrod.position.z = this.lerp(0.5, 0.0, ramProgress);
                this.mesh.rotation.x = -0.25;
                // Slight up/down with ramming
                this.mesh.position.y = Math.sin(ramPhase * Math.PI * 2) * 0.005;
                break;
                
            case ReloadState.FULL_COCK:
                // Cock hammer fully, hide ramrod, return to ready
                this.ramrod.visible = false;
                this.hammer.rotation.z = this.lerp(0.4, 0, this.animProgress);
                this.mesh.rotation.x = this.lerp(-0.25, 0, this.animProgress);
                this.mesh.rotation.z = this.lerp(0, 0, this.animProgress);
                this.mesh.position.y = 0;
                break;
                
            case ReloadState.AIMING:
                // Ready position - slight idle sway
                this.mesh.rotation.x = Math.sin(this.animationTime * 0.5) * 0.01;
                this.mesh.rotation.z = Math.cos(this.animationTime * 0.3) * 0.005;
                break;
                
            case ReloadState.READY:
                // Idle animation - breathing motion
                this.mesh.rotation.x = Math.sin(this.animationTime * 0.8) * 0.015;
                this.mesh.rotation.z = Math.cos(this.animationTime * 0.6) * 0.008;
                break;
        }
    }
    
    lerp(a, b, t) {
        return a + (b - a) * Math.max(0, Math.min(1, t));
    }
    
    fire() {
        if (!this.loaded || this.state !== ReloadState.AIMING) {
            return null;
        }
        
        // Flash effects
        this.flashIntensity = 1;
        
        // Trigger animation
        this.trigger.rotation.x = 0.1;
        setTimeout(() => { this.trigger.rotation.x = 0.3; }, 100);
        
        // Get muzzle position for projectile
        const muzzlePos = new THREE.Vector3(0, 0.07, 0.7);
        muzzlePos.applyMatrix4(this.mesh.matrixWorld);
        
        // Get firing direction
        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyQuaternion(this.mesh.quaternion);
        direction.normalize();
        
        // Reset state
        this.loaded = false;
        this.state = ReloadState.READY;
        this.hammer.rotation.z = 0.6; // Fallen hammer
        
        return { position: muzzlePos, direction: direction };
    }
    
    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }
    
    setRotation(yaw, pitch) {
        this.mesh.rotation.y = yaw;
        this.mesh.rotation.x += pitch;
    }
    
    setVisible(visible) {
        this.mesh.visible = visible;
    }
    
    getReloadProgress() {
        if (this.state === ReloadState.READY) return 1;
        if (this.state === ReloadState.AIMING) return 1;
        
        const states = [
            ReloadState.PRIMING,
            ReloadState.POWDER,
            ReloadState.PATCH,
            ReloadState.BALL,
            ReloadState.RAMMING,
            ReloadState.FULL_COCK
        ];
        
        const currentIndex = states.indexOf(this.state);
        if (currentIndex === -1) return 0;
        
        const totalStates = states.length;
        const baseProgress = currentIndex / totalStates;
        const stateProgress = this.animProgress / totalStates;
        
        return baseProgress + stateProgress;
    }
    
    getCurrentState() {
        return this.state;
    }
    
    isReloading() {
        return this.state !== ReloadState.READY && this.state !== ReloadState.AIMING;
    }
    
    destroy() {
        this.scene.remove(this.mesh);
    }
}
