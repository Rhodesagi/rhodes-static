// Musket State Machine and Model
// Historically accurate 18th century Brown Bess style musket

const ReloadState = {
    READY: 'READY',
    EMPTY: 'EMPTY',
    BITE_CARTRIDGE: 'BITE_CARTRIDGE',
    POUR_POWDER: 'POUR_POWDER',
    PATCH_BALL: 'PATCH_BALL',
    RAMROD_OUT: 'RAMROD_OUT',
    RAMROD_DOWN: 'RAMROD_DOWN',
    RAMROD_IN: 'RAMROD_IN',
    PRIME_PAN: 'PRIME_PAN',
    HALF_COCK: 'HALF_COCK',
    FULL_COCK: 'FULL_COCK'
};

const ReloadTimes = {
    [ReloadState.BITE_CARTRIDGE]: 1200,
    [ReloadState.POUR_POWDER]: 2000,
    [ReloadState.PATCH_BALL]: 1500,
    [ReloadState.RAMROD_OUT]: 800,
    [ReloadState.RAMROD_DOWN]: 3500,
    [ReloadState.RAMROD_IN]: 800,
    [ReloadState.PRIME_PAN]: 2000,
    [ReloadState.HALF_COCK]: 600,
    [ReloadState.FULL_COCK]: 400
};

class Musket {
    constructor(scene, isPlayer2 = false) {
        this.scene = scene;
        this.isPlayer2 = isPlayer2;
        this.state = ReloadState.READY;
        this.reloadTimer = 0;
        this.reloadProgress = 0;
        
        // Ballistics
        this.muzzleVelocity = 450; // m/s
        this.spreadCone = 0.08; // radians (smoothbore inaccuracy)
        this.maxRange = 200; // meters
        
        // Visual group
        this.mesh = new THREE.Group();
        
        // Build the musket model
        this.buildMusket();
        
        // Aiming state
        this.isAiming = false;
        this.aimProgress = 0; // 0 to 1
        
        // Animation helpers
        this.ramrod = null;
        this.hammer = null;
        this.originalHammerRot = 0;
    }
    
    buildMusket() {
        const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        const metalMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        const brassMaterial = new THREE.MeshLambertMaterial({ color: 0xb5a642 });
        
        // Stock (main wooden body)
        const stockGeom = new THREE.BoxGeometry(0.08, 0.12, 0.7);
        const stock = new THREE.Mesh(stockGeom, woodMaterial);
        stock.position.set(0, -0.05, 0.2);
        this.mesh.add(stock);
        
        // Butt plate
        const buttGeom = new THREE.BoxGeometry(0.09, 0.14, 0.05);
        const butt = new THREE.Mesh(buttGeom, metalMaterial);
        butt.position.set(0, -0.05, 0.55);
        this.mesh.add(butt);
        
        // Barrel (smoothbore)
        const barrelGeom = new THREE.CylinderGeometry(0.025, 0.03, 1.0, 12);
        const barrel = new THREE.Mesh(barrelGeom, metalMaterial);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.15);
        this.mesh.add(barrel);
        
        // Muzzle (slight flare)
        const muzzleGeom = new THREE.CylinderGeometry(0.035, 0.025, 0.08, 12);
        const muzzle = new THREE.Mesh(muzzleGeom, metalMaterial);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, 0.02, -0.68);
        this.mesh.add(muzzle);
        
        // Breech/breech plug area
        const breechGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 12);
        const breech = new THREE.Mesh(breechGeom, metalMaterial);
        breech.rotation.x = Math.PI / 2;
        breech.position.set(0, 0.02, 0.35);
        this.mesh.add(breech);
        
        // Flintlock mechanism (frizzen, pan, hammer)
        const lockPlateGeom = new THREE.BoxGeometry(0.02, 0.08, 0.12);
        const lockPlate = new THREE.Mesh(lockPlateGeom, metalMaterial);
        lockPlate.position.set(0.05, 0.04, 0.38);
        this.mesh.add(lockPlate);
        
        // Hammer (cock)
        const hammerGeom = new THREE.BoxGeometry(0.02, 0.06, 0.02);
        this.hammer = new THREE.Mesh(hammerGeom, metalMaterial);
        this.hammer.position.set(0.05, 0.09, 0.42);
        this.hammer.rotation.x = 0; // Forward = fired, Back = cocked
        this.mesh.add(this.hammer);
        
        // Pan
        const panGeom = new THREE.BoxGeometry(0.03, 0.01, 0.04);
        const pan = new THREE.Mesh(panGeom, metalMaterial);
        pan.position.set(0.05, 0.08, 0.35);
        this.mesh.add(pan);
        
        // Frizzen
        const frizzenGeom = new THREE.BoxGeometry(0.02, 0.06, 0.05);
        const frizzen = new THREE.Mesh(frizzenGeom, metalMaterial);
        frizzen.position.set(0.05, 0.09, 0.33);
        frizzen.rotation.x = -0.3;
        this.mesh.add(frizzen);
        
        // Trigger guard
        const guardGeom = new THREE.TorusGeometry(0.04, 0.005, 4, 8, Math.PI);
        const guard = new THREE.Mesh(guardGeom, metalMaterial);
        guard.rotation.z = Math.PI / 2;
        guard.position.set(0, -0.08, 0.22);
        this.mesh.add(guard);
        
        // Trigger
        const triggerGeom = new THREE.BoxGeometry(0.005, 0.04, 0.01);
        const trigger = new THREE.Mesh(triggerGeom, metalMaterial);
        trigger.position.set(0, -0.06, 0.22);
        trigger.rotation.x = 0.3;
        this.mesh.add(trigger);
        
        // Ramrod (stored under barrel)
        const ramrodGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.9, 6);
        this.ramrod = new THREE.Mesh(ramrodGeom, metalMaterial);
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrod.position.set(0, -0.12, -0.1);
        this.mesh.add(this.ramrod);
        
        // Rear sight (simple notch)
        const rearSightGeom = new THREE.BoxGeometry(0.02, 0.02, 0.01);
        const rearSight = new THREE.Mesh(rearSightGeom, metalMaterial);
        rearSight.position.set(0, 0.06, 0.15);
        this.mesh.add(rearSight);
        
        // Front sight (blade)
        const frontSightGeom = new THREE.BoxGeometry(0.008, 0.025, 0.01);
        const frontSight = new THREE.Mesh(frontSightGeom, metalMaterial);
        frontSight.position.set(0, 0.055, -0.6);
        this.mesh.add(frontSight);
        
        // Bands holding barrel to stock
        for (let i = 0; i < 3; i++) {
            const bandGeom = new THREE.TorusGeometry(0.045, 0.008, 4, 12);
            const band = new THREE.Mesh(bandGeom, brassMaterial);
            band.rotation.x = Math.PI / 2;
            band.position.set(0, 0, 0.0 + i * 0.3);
            this.mesh.add(band);
        }
        
        // Muzzle position for projectile spawn
        this.muzzleOffset = new THREE.Vector3(0, 0.02, -0.72);
        
        // Bore direction (relative to mesh)
        this.boreDirection = new THREE.Vector3(0, 0, -1);
        
        // Recoil spring
        this.recoilOffset = 0;
        this.targetRecoil = 0;
    }
    
    update(deltaTime) {
        // Handle reloading state machine
        if (this.state !== ReloadState.READY && this.state !== ReloadState.EMPTY) {
            this.reloadTimer += deltaTime * 1000;
            const stateTime = ReloadTimes[this.state] || 1000;
            this.reloadProgress = Math.min(1, this.reloadTimer / stateTime);
            
            if (this.reloadTimer >= stateTime) {
                this.advanceReloadState();
            }
            
            // Animate based on state
            this.animateReloadState(deltaTime);
        }
        
        // Aim smoothing
        const aimSpeed = 4.0;
        if (this.isAiming) {
            this.aimProgress = Math.min(1, this.aimProgress + deltaTime * aimSpeed);
        } else {
            this.aimProgress = Math.max(0, this.aimProgress - deltaTime * aimSpeed);
        }
        
        // Recoil recovery
        this.recoilOffset += (this.targetRecoil - this.recoilOffset) * 10 * deltaTime;
        this.targetRecoil *= 0.9; // Decay
        
        // Apply aim and recoil transforms
        this.updateTransforms();
    }
    
    updateTransforms() {
        // Base position adjustments based on aim
        const hipPos = { x: 0.25, y: -0.2, z: 0.4 };
        const aimPos = { x: 0, y: -0.08, z: 0.15 };
        
        const t = this.aimProgress;
        const r = this.recoilOffset;
        
        this.mesh.position.x = hipPos.x + (aimPos.x - hipPos.x) * t;
        this.mesh.position.y = hipPos.y + (aimPos.y - hipPos.y) * t - r * 0.3;
        this.mesh.position.z = hipPos.z + (aimPos.z - hipPos.z) * t - r * 0.5;
        
        // Rotation: bring up to eye level
        const hipRot = { x: 0, y: 0.1, z: 0 };
        const aimRot = { x: -0.05, y: 0, z: 0 }; // Slight upward tilt for iron sights
        
        this.mesh.rotation.x = hipRot.x + (aimRot.x - hipRot.x) * t + r * 0.5;
        this.mesh.rotation.y = hipRot.y + (aimRot.y - hipRot.y) * t;
        this.mesh.rotation.z = hipRot.z + (aimRot.z - hipRot.z) * t + r * 0.1;
    }
    
    animateReloadState(deltaTime) {
        // Visual feedback for each reload state
        switch(this.state) {
            case ReloadState.RAMROD_OUT:
                // Slide ramrod out from under barrel
                this.ramrod.position.y = THREE.MathUtils.lerp(-0.12, 0.05, this.reloadProgress);
                this.ramrod.position.z = THREE.MathUtils.lerp(-0.1, -0.1, this.reloadProgress);
                break;
            case ReloadState.RAMROD_DOWN:
                // Ramrod down barrel
                const rodProgress = Math.sin(this.reloadProgress * Math.PI); // Down then up
                this.ramrod.position.z = THREE.MathUtils.lerp(-0.1, -0.5, rodProgress);
                break;
            case ReloadState.RAMROD_IN:
                // Return ramrod to storage
                this.ramrod.position.y = THREE.MathUtils.lerp(0.05, -0.12, this.reloadProgress);
                break;
            case ReloadState.HALF_COCK:
                // Pull hammer to half-cock
                this.hammer.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 4, this.reloadProgress);
                break;
            case ReloadState.FULL_COCK:
                // Pull to full cock
                this.hammer.rotation.x = THREE.MathUtils.lerp(Math.PI / 4, Math.PI / 2, this.reloadProgress);
                break;
            case ReloadState.READY:
                this.hammer.rotation.x = Math.PI / 2; // Full cock
                break;
        }
    }
    
    advanceReloadState() {
        const stateOrder = [
            ReloadState.EMPTY,
            ReloadState.BITE_CARTRIDGE,
            ReloadState.POUR_POWDER,
            ReloadState.PATCH_BALL,
            ReloadState.RAMROD_OUT,
            ReloadState.RAMROD_DOWN,
            ReloadState.RAMROD_IN,
            ReloadState.PRIME_PAN,
            ReloadState.HALF_COCK,
            ReloadState.FULL_COCK,
            ReloadState.READY
        ];
        
        const currentIndex = stateOrder.indexOf(this.state);
        if (currentIndex >= 0 && currentIndex < stateOrder.length - 1) {
            this.state = stateOrder[currentIndex + 1];
            this.reloadTimer = 0;
            this.reloadProgress = 0;
        }
    }
    
    startReload() {
        if (this.state === ReloadState.EMPTY || this.state === ReloadState.READY) {
            this.state = ReloadState.BITE_CARTRIDGE;
            this.reloadTimer = 0;
            this.isAiming = false;
            return true;
        }
        return false;
    }
    
    canFire() {
        return this.state === ReloadState.READY && this.aimProgress > 0.3;
    }
    
    fire(camera) {
        if (!this.canFire()) return null;
        
        // Fire the weapon
        this.state = ReloadState.EMPTY;
        this.hammer.rotation.x = 0; // Hammer falls
        
        // Recoil
        this.targetRecoil = 0.15;
        
        // Get muzzle position in world space
        const muzzlePos = this.muzzleOffset.clone();
        muzzlePos.applyMatrix4(this.mesh.matrixWorld);
        
        // Get bore direction with camera rotation
        const direction = this.boreDirection.clone();
        direction.transformDirection(this.mesh.matrixWorld);
        
        // Add smoothbore inaccuracy (cone spread)
        const spread = this.spreadCone * (1 - this.aimProgress * 0.5); // Less spread when aiming
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * spread;
        
        direction.x += Math.sin(theta) * Math.cos(phi);
        direction.y += Math.sin(theta) * Math.sin(phi);
        direction.z += Math.cos(theta) - 1; // Subtract to keep normalized-ish
        direction.normalize();
        
        return {
            origin: muzzlePos,
            direction: direction,
            velocity: this.muzzleVelocity,
            time: 0
        };
    }
    
    setAiming(aiming) {
        // Cannot aim while reloading (except very start)
        if (this.state !== ReloadState.READY && this.state !== ReloadState.EMPTY) {
            this.isAiming = false;
            return;
        }
        this.isAiming = aiming;
    }
    
    isReloading() {
        return this.state !== ReloadState.READY && this.state !== ReloadState.EMPTY;
    }
    
    getReloadStateName() {
        if (this.state === ReloadState.READY) return "Ready";
        if (this.state === ReloadState.EMPTY) return "Empty";
        return this.state.replace(/_/g, ' ');
    }
    
    getReloadPercent() {
        if (this.state === ReloadState.READY) return 100;
        if (this.state === ReloadState.EMPTY) return 0;
        
        const stateOrder = [
            ReloadState.EMPTY,
            ReloadState.BITE_CARTRIDGE,
            ReloadState.POUR_POWDER,
            ReloadState.PATCH_BALL,
            ReloadState.RAMROD_OUT,
            ReloadState.RAMROD_DOWN,
            ReloadState.RAMROD_IN,
            ReloadState.PRIME_PAN,
            ReloadState.HALF_COCK,
            ReloadState.FULL_COCK,
            ReloadState.READY
        ];
        
        const currentIndex = stateOrder.indexOf(this.state);
        const basePercent = (currentIndex / (stateOrder.length - 1)) * 100;
        const statePercent = this.reloadProgress * (100 / (stateOrder.length - 1));
        return Math.min(99, basePercent + statePercent);
    }
}