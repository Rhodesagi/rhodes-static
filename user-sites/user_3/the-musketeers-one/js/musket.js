/**
 * Musket Class - Brown Bess style flintlock musket
 * Authentic 12-step reloading sequence
 */

const ReloadState = {
    READY: 'ready',
    HALF_COCK: 'half_cock',      // 1. Pull hammer to half-cock (safety)
    POUR_POWDER: 'pour_powder',   // 2. Pour powder from cartridge
    BALL_PATCH: 'ball_patch',     // 3. Place ball and patch
    RAMROD_OUT: 'ramrod_out',     // 4. Remove ramrod
    RAMROD_DOWN: 'ramrod_down',   // 5. Ram ball down (3 strokes)
    RAMROD_RETURN: 'ramrod_return', // 6. Return ramrod
    PRIME_PAN: 'prime_pan',       // 7. Open frizzen, prime pan
    CLOSE_FRIZZEN: 'close_frizzen', // 8. Close frizzen
    FULL_COCK: 'full_cock',       // 9. Pull to full cock
    SHOULDering: 'shouldering'    // 10. Return to shouldered position
};

class Musket {
    constructor(scene, isPlayer2 = false) {
        this.scene = scene;
        this.isPlayer2 = isPlayer2;
        this.reloadState = ReloadState.READY;
        this.reloadProgress = 0;
        this.reloadTimer = 0;
        this.loaded = true; // Start loaded
        
        // Animation parameters
        this.musketGroup = new THREE.Group();
        this.hammerRotation = 0; // 0 = down, 0.5 = half-cock, 1 = full-cock
        this.frizzenOpen = 0; // 0 = closed, 1 = open
        this.ramrodPosition = 0; // 0 = stored, 1 = extended
        this.barrelTilt = 0; // 0 = upright, 1 = tilted for loading
        
        // Build the musket mesh
        this.buildMusket();
        
        // Position in front of camera
        this.musketGroup.position.set(0.2, -0.15, -0.4);
        
        // Iron sight offsets (sight height over bore)
        this.rearSightOffset = new THREE.Vector3(0, 0.015, -0.15);
        this.frontSightOffset = new THREE.Vector3(0, 0.012, 0.25);
    }
    
    buildMusket() {
        const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x4A3728 });
        const metalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            roughness: 0.3,
            metalness: 0.8
        });
        const darkMetalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.4,
            metalness: 0.7
        });
        
        // Stock (main wooden body)
        const stockGeom = new THREE.BoxGeometry(0.04, 0.06, 0.8);
        const stock = new THREE.Mesh(stockGeom, woodMaterial);
        stock.position.set(0, 0, 0);
        this.stockMesh = stock;
        this.musketGroup.add(stock);
        
        // Butt plate
        const buttGeom = new THREE.BoxGeometry(0.042, 0.08, 0.02);
        const butt = new THREE.Mesh(buttGeom, metalMaterial);
        butt.position.set(0, 0.01, 0.41);
        this.musketGroup.add(butt);
        
        // Barrel
        const barrelGeom = new THREE.CylinderGeometry(0.012, 0.015, 0.6, 12);
        const barrel = new THREE.Mesh(barrelGeom, metalMaterial);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.03, -0.1);
        this.barrelMesh = barrel;
        this.musketGroup.add(barrel);
        
        // Barrel bands
        for (let i = 0; i < 3; i++) {
            const bandGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12);
            const band = new THREE.Mesh(bandGeom, darkMetalMaterial);
            band.rotation.x = Math.PI / 2;
            band.position.set(0, 0.03, 0.05 - i * 0.15);
            this.musketGroup.add(band);
        }
        
        // Rear sight (notch)
        const rearSightGeom = new THREE.BoxGeometry(0.008, 0.008, 0.004);
        const rearSight = new THREE.Mesh(rearSightGeom, darkMetalMaterial);
        rearSight.position.set(0, 0.045, -0.25);
        this.rearSight = rearSight;
        this.musketGroup.add(rearSight);
        
        // Front sight blade
        const frontSightGeom = new THREE.BoxGeometry(0.004, 0.01, 0.002);
        const frontSight = new THREE.Mesh(frontSightGeom, darkMetalMaterial);
        frontSight.position.set(0, 0.048, -0.38);
        this.frontSight = frontSight;
        this.musketGroup.add(frontSight);
        
        // Lock mechanism (flintlock)
        const lockPlateGeom = new THREE.BoxGeometry(0.015, 0.06, 0.08);
        const lockPlate = new THREE.Mesh(lockPlateGeom, darkMetalMaterial);
        lockPlate.position.set(0.025, 0.02, -0.15);
        this.musketGroup.add(lockPlate);
        
        // Hammer (cock)
        const hammerGeom = new THREE.BoxGeometry(0.008, 0.04, 0.02);
        this.hammer = new THREE.Mesh(hammerGeom, darkMetalMaterial);
        this.hammer.position.set(0.03, 0.05, -0.18);
        this.hammerPivot = new THREE.Group();
        this.hammerPivot.position.set(0.03, 0.04, -0.19);
        this.hammer.position.set(0, 0.02, 0.01);
        this.hammerPivot.add(this.hammer);
        this.musketGroup.add(this.hammerPivot);
        
        // Frizzen (steel striker)
        const frizzenGeom = new THREE.BoxGeometry(0.01, 0.025, 0.02);
        this.frizzen = new THREE.Mesh(frizzenGeom, metalMaterial);
        this.frizzen.position.set(0.028, 0.035, -0.14);
        this.frizzenPivot = new THREE.Group();
        this.frizzenPivot.position.set(0.025, 0.025, -0.15);
        this.frizzen.position.set(0.003, 0.01, 0.01);
        this.frizzenPivot.add(this.frizzen);
        this.musketGroup.add(this.frizzenPivot);
        
        // Pan (powder receptacle)
        const panGeom = new THREE.BoxGeometry(0.012, 0.005, 0.015);
        const pan = new THREE.Mesh(panGeom, darkMetalMaterial);
        pan.position.set(0.025, 0.03, -0.14);
        this.musketGroup.add(pan);
        
        // Trigger guard
        const triggerGuardGeom = new THREE.TorusGeometry(0.02, 0.003, 4, 8, Math.PI);
        const triggerGuard = new THREE.Mesh(triggerGuardGeom, darkMetalMaterial);
        triggerGuard.rotation.z = Math.PI;
        triggerGuard.position.set(0, -0.02, -0.02);
        this.musketGroup.add(triggerGuard);
        
        // Trigger
        const triggerGeom = new THREE.BoxGeometry(0.004, 0.015, 0.008);
        const trigger = new THREE.Mesh(triggerGeom, darkMetalMaterial);
        trigger.position.set(0, -0.01, -0.02);
        trigger.rotation.x = 0.3;
        this.musketGroup.add(trigger);
        
        // Ramrod (stored under barrel)
        const ramrodGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.55, 6);
        this.ramrod = new THREE.Mesh(ramrodGeom, woodMaterial);
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrod.position.set(0, -0.025, -0.1);
        this.ramrodStoredPos = this.ramrod.position.clone();
        this.musketGroup.add(this.ramrod);
        
        // Muzzle flash (hidden by default)
        const flashGeom = new THREE.SphereGeometry(0.08, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFAA00,
            transparent: true,
            opacity: 0
        });
        this.muzzleFlash = new THREE.Mesh(flashGeom, flashMaterial);
        this.muzzleFlash.position.set(0, 0.03, -0.4);
        this.musketGroup.add(this.muzzleFlash);
        
        // Smoke particle system
        this.smokeParticles = [];
    }
    
    canFire() {
        return this.loaded && this.reloadState === ReloadState.READY;
    }
    
    canReload() {
        return this.reloadState === ReloadState.READY && this.loaded === false;
    }
    
    fire() {
        if (!this.canFire()) return false;
        
        this.loaded = false;
        
        // Animate hammer falling
        this.animateHammerFall();
        
        // Muzzle flash
        this.showMuzzleFlash();
        
        // Create smoke
        this.createSmoke();
        
        return true;
    }
    
    animateHammerFall() {
        let progress = 1; // Full cock to fired
        const fallAnim = setInterval(() => {
            progress -= 0.2;
            this.hammerPivot.rotation.x = progress * Math.PI / 4;
            if (progress <= 0) {
                clearInterval(fallAnim);
                this.hammerPivot.rotation.x = 0;
            }
        }, 16);
    }
    
    showMuzzleFlash() {
        this.muzzleFlash.material.opacity = 0.9;
        let opacity = 0.9;
        const flashAnim = setInterval(() => {
            opacity -= 0.15;
            this.muzzleFlash.material.opacity = opacity;
            if (opacity <= 0) {
                clearInterval(flashAnim);
                this.muzzleFlash.material.opacity = 0;
            }
        }, 30);
    }
    
    createSmoke() {
        for (let i = 0; i < 5; i++) {
            const smokeGeom = new THREE.SphereGeometry(0.02 + Math.random() * 0.02, 6, 6);
            const smokeMat = new THREE.MeshBasicMaterial({
                color: 0x888888,
                transparent: true,
                opacity: 0.6
            });
            const smoke = new THREE.Mesh(smokeGeom, smokeMat);
            
            const worldPos = new THREE.Vector3();
            this.barrelMesh.getWorldPosition(worldPos);
            smoke.position.copy(worldPos);
            smoke.position.z -= 0.3;
            smoke.position.y += 0.03;
            
            this.scene.add(smoke);
            
            this.smokeParticles.push({
                mesh: smoke,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    0.5 + Math.random() * 0.5,
                    -1 - Math.random()
                ),
                life: 1.0
            });
        }
    }
    
    startReload() {
        if (!this.canReload()) return false;
        
        this.reloadState = ReloadState.HALF_COCK;
        this.reloadProgress = 0;
        this.reloadTimer = 0;
        return true;
    }
    
    update(deltaTime) {
        // Update smoke
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.life -= deltaTime * 0.5;
            p.mesh.position.add(p.velocity.clone().multiplyScalar(deltaTime));
            p.mesh.scale.multiplyScalar(1.02);
            p.mesh.material.opacity = p.life * 0.6;
            
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.smokeParticles.splice(i, 1);
            }
        }
        
        // Reload state machine
        if (this.reloadState !== ReloadState.READY) {
            this.updateReload(deltaTime);
        }
    }
    
    updateReload(deltaTime) {
        this.reloadTimer += deltaTime;
        
        // Each step takes specific time (authentic cadence)
        const stepTimes = {
            [ReloadState.HALF_COCK]: 0.4,
            [ReloadState.POUR_POWDER]: 0.6,
            [ReloadState.BALL_PATCH]: 0.5,
            [ReloadState.RAMROD_OUT]: 0.4,
            [ReloadState.RAMROD_DOWN]: 1.2,
            [ReloadState.RAMROD_RETURN]: 0.5,
            [ReloadState.PRIME_PAN]: 0.6,
            [ReloadState.CLOSE_FRIZZEN]: 0.3,
            [ReloadState.FULL_COCK]: 0.4,
            [ReloadState.SHOULDERING]: 0.3
        };
        
        const currentStepTime = stepTimes[this.reloadState] || 0.5;
        this.reloadProgress = Math.min(1, this.reloadTimer / currentStepTime);
        
        // Animate current step
        this.animateReloadStep();
        
        // Advance state
        if (this.reloadTimer >= currentStepTime) {
            this.advanceReloadState();
        }
    }
    
    animateReloadStep() {
        const t = this.reloadProgress;
        
        switch (this.reloadState) {
            case ReloadState.HALF_COCK:
                // Pull hammer to half-cock position
                this.hammerPivot.rotation.x = t * 0.5 * Math.PI / 4;
                break;
                
            case ReloadState.POUR_POWDER:
                // Tilt barrel up slightly
                this.musketGroup.rotation.x = -t * 0.3;
                break;
                
            case ReloadState.BALL_PATCH:
                // Keep tilted, simulate placing ball
                this.musketGroup.rotation.x = -0.3;
                break;
                
            case ReloadState.RAMROD_OUT:
                // Extract ramrod
                this.ramrodPosition = t;
                this.ramrod.position.z = this.ramrodStoredPos.z + t * 0.3;
                this.ramrod.position.y = this.ramrodStoredPos.y + t * 0.1;
                break;
                
            case ReloadState.RAMROD_DOWN:
                // Ram the ball down (3 strokes simulated)
                const stroke = Math.sin(t * Math.PI * 6) * 0.1;
                this.ramrod.position.z = this.ramrodStoredPos.z + 0.3 - stroke;
                break;
                
            case ReloadState.RAMROD_RETURN:
                // Return ramrod to storage
                this.ramrodPosition = 1 - t;
                this.ramrod.position.z = this.ramrodStoredPos.z + 0.3 * (1 - t);
                this.ramrod.position.y = this.ramrodStoredPos.y + 0.1 * (1 - t);
                break;
                
            case ReloadState.PRIME_PAN:
                // Open frizzen and prime
                this.frizzenOpen = t;
                this.frizzenPivot.rotation.x = -t * Math.PI / 3;
                break;
                
            case ReloadState.CLOSE_FRIZZEN:
                // Close frizzen
                this.frizzenOpen = 1 - t;
                this.frizzenPivot.rotation.x = -(1 - t) * Math.PI / 3;
                break;
                
            case ReloadState.FULL_COCK:
                // Pull to full cock
                this.hammerPivot.rotation.x = (0.5 + t * 0.5) * Math.PI / 4;
                break;
                
            case ReloadState.SHOULDERING:
                // Return to shouldered position
                this.musketGroup.rotation.x = -0.3 * (1 - t);
                break;
        }
    }
    
    advanceReloadState() {
        const stateOrder = [
            ReloadState.HALF_COCK,
            ReloadState.POUR_POWDER,
            ReloadState.BALL_PATCH,
            ReloadState.RAMROD_OUT,
            ReloadState.RAMROD_DOWN,
            ReloadState.RAMROD_RETURN,
            ReloadState.PRIME_PAN,
            ReloadState.CLOSE_FRIZZEN,
            ReloadState.FULL_COCK,
            ReloadState.SHOULDERING
        ];
        
        const currentIndex = stateOrder.indexOf(this.reloadState);
        if (currentIndex < stateOrder.length - 1) {
            this.reloadState = stateOrder[currentIndex + 1];
            this.reloadTimer = 0;
            this.reloadProgress = 0;
        } else {
            // Reload complete
            this.reloadState = ReloadState.READY;
            this.loaded = true;
            this.reloadProgress = 0;
            this.reloadTimer = 0;
        }
    }
    
    getReloadStatus() {
        if (this.reloadState === ReloadState.READY) {
            return this.loaded ? "Ready" : "Empty";
        }
        return this.reloadState.replace(/_/g, ' ');
    }
    
    addToCamera(camera) {
        camera.add(this.musketGroup);
    }
}