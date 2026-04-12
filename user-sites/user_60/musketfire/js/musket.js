// MUSKETFIRE - Musket weapon with historically accurate reload
// 8-phase reload state machine - 15 seconds total

const RELOAD_PHASES = {
    READY: 0,
    START: 1,
    OPEN_PAN: 2,
    POUR_POWDER: 3,
    PATCH_BALL: 4,
    RAMROD_DOWN: 5,
    RETURN_ROD: 6,
    PRIME_PAN: 7,
    CLOSE_COCK: 8
};

const PHASE_TIMES = {
    [RELOAD_PHASES.START]: 0.0,
    [RELOAD_PHASES.OPEN_PAN]: 0.5,
    [RELOAD_PHASES.POUR_POWDER]: 3.0,
    [RELOAD_PHASES.PATCH_BALL]: 5.0,
    [RELOAD_PHASES.RAMROD_DOWN]: 9.0,
    [RELOAD_PHASES.RETURN_ROD]: 10.5,
    [RELOAD_PHASES.PRIME_PAN]: 12.0,
    [RELOAD_PHASES.CLOSE_COCK]: 14.5,
    [RELOAD_PHASES.READY]: 15.0
};

const PHASE_NAMES = {
    [RELOAD_PHASES.READY]: 'Ready',
    [RELOAD_PHASES.START]: 'Reloading...',
    [RELOAD_PHASES.OPEN_PAN]: 'Opening pan',
    [RELOAD_PHASES.POUR_POWDER]: 'Pouring powder',
    [RELOAD_PHASES.PATCH_BALL]: 'Patching ball',
    [RELOAD_PHASES.RAMROD_DOWN]: 'Ramming (DONT STOP!)',
    [RELOAD_PHASES.RETURN_ROD]: 'Returning ramrod',
    [RELOAD_PHASES.PRIME_PAN]: 'Priming pan',
    [RELOAD_PHASES.CLOSE_COCK]: 'Cocking...'
};

class Musket {
    constructor(scene, isPlayer1) {
        this.scene = scene;
        this.isPlayer1 = isPlayer1;
        this.reloadState = RELOAD_PHASES.READY;
        this.reloadTimer = 0;
        this.reloadProgress = 0;
        
        // Visual mesh container
        this.mesh = new THREE.Group();
        
        // Create musket geometry
        this.createMusketMesh();
        
        // Animation state
        this.recoil = 0;
        this.aimOffset = new THREE.Vector3();
        this.sightsUp = false;
        
        // Muzzle position for projectile spawn
        this.muzzlePosition = new THREE.Vector3(0, 0, 1.4);
        
        this.scene.add(this.mesh);
    }
    
    createMusketMesh() {
        const color = this.isPlayer1 ? 0x4a9 : 0xa94;
        
        // Stock (main body)
        const stockGeo = new THREE.BoxGeometry(0.15, 0.25, 1.2);
        const stockMat = new THREE.MeshLambertMaterial({ color: 0x4a3c2d });
        const stock = new THREE.Mesh(stockGeo, stockMat);
        stock.position.set(0, -0.1, -0.4);
        stock.castShadow = true;
        this.mesh.add(stock);
        
        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 12);
        const barrelMat = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.3
        });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.05, 0.4);
        barrel.castShadow = true;
        this.barrel = barrel;
        this.mesh.add(barrel);
        
        // Muzzle band
        const bandGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12);
        const bandMat = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            metalness: 0.9,
            roughness: 0.2
        });
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.rotation.x = Math.PI / 2;
        band.position.set(0, 0.05, 1.1);
        this.mesh.add(band);
        
        // Rear sight (simple notch)
        const sightGeo = new THREE.BoxGeometry(0.02, 0.04, 0.02);
        const sight = new THREE.Mesh(sightGeo, bandMat);
        sight.position.set(0, 0.12, 0.2);
        this.mesh.add(sight);
        
        // Front sight post
        const frontSightGeo = new THREE.BoxGeometry(0.01, 0.03, 0.01);
        const frontSight = new THREE.Mesh(frontSightGeo, bandMat);
        frontSight.position.set(0, 0.12, 1.05);
        this.mesh.add(frontSight);
        
        // Frizzen/flash pan (lock plate)
        const lockGeo = new THREE.BoxGeometry(0.08, 0.12, 0.15);
        const lock = new THREE.Mesh(lockGeo, bandMat);
        lock.position.set(0.08, 0.05, 0.3);
        this.frizzen = lock;
        this.mesh.add(lock);
        
        // Ramrod thimbles
        const thimbleGeo = new THREE.TorusGeometry(0.03, 0.01, 4, 8);
        const thimble1 = new THREE.Mesh(thimbleGeo, bandMat);
        thimble1.position.set(0, -0.15, 0.2);
        this.mesh.add(thimble1);
        
        const thimble2 = new THREE.Mesh(thimbleGeo, bandMat);
        thimble2.position.set(0, -0.15, 0.8);
        this.mesh.add(thimble2);
        
        // Ramrod (stored under barrel)
        const ramrodGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.3, 6);
        const ramrodMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        this.ramrod = new THREE.Mesh(ramrodGeo, ramrodMat);
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrod.position.set(0, -0.15, 0.4);
        this.mesh.add(this.ramrod);
        
        // Trigger guard
        const guardGeo = new THREE.BoxGeometry(0.02, 0.08, 0.2);
        const guard = new THREE.Mesh(guardGeo, bandMat);
        guard.position.set(0, -0.15, -0.1);
        this.mesh.add(guard);
        
        // Butt plate
        const buttGeo = new THREE.BoxGeometry(0.16, 0.3, 0.05);
        const butt = new THREE.Mesh(buttGeo, bandMat);
        butt.position.set(0, -0.1, -1.0);
        this.mesh.add(butt);
        
        // Muzzle flash (hidden by default)
        const flashGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00,
            transparent: true,
            opacity: 0
        });
        this.muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
        this.muzzleFlash.position.set(0, 0.05, 1.15);
        this.mesh.add(this.muzzleFlash);
    }
    
    fire() {
        if (this.reloadState !== RELOAD_PHASES.READY) return false;
        
        // Recoil animation
        this.recoil = 1.0;
        
        // Flash
        this.muzzleFlash.material.opacity = 1;
        
        // Sound
        sounds.playMusketFire();
        
        // Set to empty, auto-start reload
        this.startReload();
        
        return true;
    }
    
    startReload() {
        this.reloadState = RELOAD_PHASES.START;
        this.reloadTimer = 0;
    }
    
    update(dt) {
        // Recoil recovery
        if (this.recoil > 0) {
            this.recoil = Math.max(0, this.recoil - dt * 4);
            this.mesh.position.z = -this.recoil * 0.2;
            this.mesh.rotation.x = -this.recoil * 0.3;
        } else {
            this.mesh.position.z = 0;
        }
        
        // Muzzle flash fade
        if (this.muzzleFlash.material.opacity > 0) {
            this.muzzleFlash.material.opacity -= dt * 10;
            if (this.muzzleFlash.material.opacity < 0) {
                this.muzzleFlash.material.opacity = 0;
            }
        }
        
        // Reload state machine
        if (this.reloadState !== RELOAD_PHASES.READY) {
            this.reloadTimer += dt;
            
            // Update progress
            this.reloadProgress = this.reloadTimer / PHASE_TIMES[RELOAD_PHASES.READY];
            
            // Check phase transitions
            const phases = [
                RELOAD_PHASES.START,
                RELOAD_PHASES.OPEN_PAN,
                RELOAD_PHASES.POUR_POWDER,
                RELOAD_PHASES.PATCH_BALL,
                RELOAD_PHASES.RAMROD_DOWN,
                RELOAD_PHASES.RETURN_ROD,
                RELOAD_PHASES.PRIME_PAN,
                RELOAD_PHASES.CLOSE_COCK,
                RELOAD_PHASES.READY
            ];
            
            for (let i = phases.length - 2; i >= 0; i--) {
                const phase = phases[i];
                if (this.reloadState < phase && this.reloadTimer >= PHASE_TIMES[phase]) {
                    this.reloadState = phase;
                    this.onPhaseChange(phase);
                    break;
                }
            }
            
            // Update reload animations
            this.updateReloadAnimation(dt);
        }
        
        // Iron sights position
        if (this.sightsUp) {
            this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, -0.15, dt * 10);
            this.mesh.position.z = THREE.MathUtils.lerp(this.mesh.position.z, 0.3, dt * 10);
            this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, -0.1, dt * 10);
        } else {
            this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, -0.3, dt * 10);
            this.mesh.position.z = THREE.MathUtils.lerp(this.mesh.position.z, 0.5, dt * 10);
            this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0, dt * 10);
        }
    }
    
    onPhaseChange(phase) {
        // Play sounds for specific phases
        switch(phase) {
            case RELOAD_PHASES.RAMROD_DOWN:
                // Start animating ramrod
                break;
            case RELOAD_PHASES.RETURN_ROD:
                sounds.playRamrodHit();
                break;
            case RELOAD_PHASES.CLOSE_COCK:
                sounds.playReloadClick();
                break;
        }
    }
    
    updateReloadAnimation(dt) {
        // Visual feedback during reload phases
        switch(this.reloadState) {
            case RELOAD_PHASES.OPEN_PAN:
                // Tilt frizzen back
                this.frizzen.rotation.z = THREE.MathUtils.lerp(
                    this.frizzen.rotation.z, -0.5, dt * 5
                );
                break;
                
            case RELOAD_PHASES.POUR_POWDER:
            case RELOAD_PHASES.PATCH_BALL:
                // Barrel angled down for loading
                this.mesh.rotation.x = THREE.MathUtils.lerp(
                    this.mesh.rotation.x, 0.5, dt * 3
                );
                break;
                
            case RELOAD_PHASES.RAMROD_DOWN:
                // Ramrod extends into barrel
                const ramProgress = (this.reloadTimer - PHASE_TIMES[RELOAD_PHASES.RAMROD_DOWN]) / 
                                     (PHASE_TIMES[RELOAD_PHASES.RETURN_ROD] - PHASE_TIMES[RELOAD_PHASES.RAMROD_DOWN]);
                this.ramrod.position.z = 0.4 + ramProgress * 0.8;
                this.ramrod.rotation.x = Math.PI / 2 + ramProgress * 0.3;
                // Barrel still angled
                this.mesh.rotation.x = 0.5;
                break;
                
            case RELOAD_PHASES.RETURN_ROD:
            case RELOAD_PHASES.PRIME_PAN:
            case RELOAD_PHASES.CLOSE_COCK:
                // Return to neutral
                this.frizzen.rotation.z = THREE.MathUtils.lerp(
                    this.frizzen.rotation.z, 0, dt * 5
                );
                this.ramrod.position.z = THREE.MathUtils.lerp(
                    this.ramrod.position.z, 0.4, dt * 5
                );
                this.ramrod.rotation.x = THREE.MathUtils.lerp(
                    this.ramrod.rotation.x, Math.PI / 2, dt * 5
                );
                this.mesh.rotation.x = THREE.MathUtils.lerp(
                    this.mesh.rotation.x, 0, dt * 5
                );
                break;
        }
    }
    
    setAimDownSights(aiming) {
        this.sightsUp = aiming;
    }
    
    getMuzzlePosition() {
        // Calculate world position of muzzle
        const pos = this.muzzlePosition.clone();
        pos.applyMatrix4(this.mesh.matrixWorld);
        return pos;
    }
    
    getDirection() {
        // Get forward direction of barrel
        const dir = new THREE.Vector3(0, 0, 1);
        dir.applyQuaternion(this.mesh.quaternion);
        return dir;
    }
    
    isReady() {
        return this.reloadState === RELOAD_PHASES.READY;
    }
    
    getReloadStatus() {
        return {
            state: this.reloadState,
            name: PHASE_NAMES[this.reloadState],
            progress: this.reloadProgress
        };
    }
}

// Export
window.Musket = Musket;
window.RELOAD_PHASES = RELOAD_PHASES;
