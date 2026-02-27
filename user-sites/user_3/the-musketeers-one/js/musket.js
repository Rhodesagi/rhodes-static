const ReloadState = {
    READY: 'ready',
    HALF_COCK: 'half_cock',
    POUR_POWDER: 'pour_powder',
    BALL_PATCH: 'ball_patch',
    RAMROD_OUT: 'ramrod_out',
    RAMROD_DOWN: 'ramrod_down',
    RAMROD_RETURN: 'ramrod_return',
    PRIME_PAN: 'prime_pan',
    CLOSE_FRIZZEN: 'close_frizzen',
    FULL_COCK: 'full_cock',
    SHOULDERING: 'shouldering'
};

class Musket {
    constructor(scene, isPlayer2) {
        this.scene = scene;
        this.isPlayer2 = isPlayer2;
        this.reloadState = ReloadState.READY;
        this.reloadProgress = 0;
        this.reloadTimer = 0;
        this.loaded = true;
        this.musketGroup = new THREE.Group();
        this.hammerRotation = 0;
        this.frizzenOpen = 0;
        this.ramrodPosition = 0;
        this.barrelTilt = 0;
        this.buildMusket();
        this.musketGroup.position.set(0.2, -0.15, -0.4);
        this.smokeParticles = [];
    }
    
    buildMusket() {
        const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x4A3728 });
        const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.8 });
        const darkMetalMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.7 });
        
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.8), woodMaterial);
        this.stockMesh = stock;
        this.musketGroup.add(stock);
        
        const butt = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.08, 0.02), metalMaterial);
        butt.position.set(0, 0.01, 0.41);
        this.musketGroup.add(butt);
        
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.6, 12), metalMaterial);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.03, -0.1);
        this.barrelMesh = barrel;
        this.musketGroup.add(barrel);
        
        for (let i = 0; i < 3; i++) {
            const band = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12), darkMetalMaterial);
            band.rotation.x = Math.PI / 2;
            band.position.set(0, 0.03, 0.05 - i * 0.15);
            this.musketGroup.add(band);
        }
        
        this.rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.004), darkMetalMaterial);
        this.rearSight.position.set(0, 0.045, -0.25);
        this.musketGroup.add(this.rearSight);
        
        this.frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.01, 0.002), darkMetalMaterial);
        this.frontSight.position.set(0, 0.048, -0.38);
        this.musketGroup.add(this.frontSight);
        
        const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.06, 0.08), darkMetalMaterial);
        lockPlate.position.set(0.025, 0.02, -0.15);
        this.musketGroup.add(lockPlate);
        
        this.hammer = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.04, 0.02), darkMetalMaterial);
        this.hammer.position.set(0.03, 0.05, -0.18);
        this.hammerPivot = new THREE.Group();
        this.hammerPivot.position.set(0.03, 0.04, -0.19);
        this.hammer.position.set(0, 0.02, 0.01);
        this.hammerPivot.add(this.hammer);
        this.musketGroup.add(this.hammerPivot);
        
        this.frizzen = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.025, 0.02), metalMaterial);
        this.frizzen.position.set(0.028, 0.035, -0.14);
        this.frizzenPivot = new THREE.Group();
        this.frizzenPivot.position.set(0.025, 0.025, -0.15);
        this.frizzen.position.set(0.003, 0.01, 0.01);
        this.frizzenPivot.add(this.frizzen);
        this.musketGroup.add(this.frizzenPivot);
        
        const pan = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.005, 0.015), darkMetalMaterial);
        pan.position.set(0.025, 0.03, -0.14);
        this.musketGroup.add(pan);
        
        const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.003, 4, 8, Math.PI), darkMetalMaterial);
        triggerGuard.rotation.z = Math.PI;
        triggerGuard.position.set(0, -0.02, -0.02);
        this.musketGroup.add(triggerGuard);
        
        const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.015, 0.008), darkMetalMaterial);
        trigger.position.set(0, -0.01, -0.02);
        trigger.rotation.x = 0.3;
        this.musketGroup.add(trigger);
        
        this.ramrod = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.55, 6), woodMaterial);
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrod.position.set(0, -0.025, -0.1);
        this.ramrodStoredPos = this.ramrod.position.clone();
        this.musketGroup.add(this.ramrod);
        
        const flashGeom = new THREE.SphereGeometry(0.08, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({ color: 0xFFAA00, transparent: true, opacity: 0 });
        this.muzzleFlash = new THREE.Mesh(flashGeom, flashMaterial);
        this.muzzleFlash.position.set(0, 0.03, -0.4);
        this.musketGroup.add(this.muzzleFlash);
    }
    
    canFire() { return this.loaded && this.reloadState === ReloadState.READY; }
    canReload() { return this.reloadState === ReloadState.READY && !this.loaded; }
    
    fire() {
        if (!this.canFire()) return false;
        this.loaded = false;
        let progress = 1;
        const fallAnim = setInterval(() => {
            progress -= 0.2;
            this.hammerPivot.rotation.x = progress * Math.PI / 4;
            if (progress <= 0) { clearInterval(fallAnim); this.hammerPivot.rotation.x = 0; }
        }, 16);
        this.muzzleFlash.material.opacity = 0.9;
        let opacity = 0.9;
        const flashAnim = setInterval(() => {
            opacity -= 0.15;
            this.muzzleFlash.material.opacity = opacity;
            if (opacity <= 0) { clearInterval(flashAnim); this.muzzleFlash.material.opacity = 0; }
        }, 30);
        return true;
    }
    
    startReload() {
        if (!this.canReload()) return false;
        this.reloadState = ReloadState.HALF_COCK;
        this.reloadProgress = 0;
        this.reloadTimer = 0;
        return true;
    }
    
    update(deltaTime) {
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.life -= deltaTime * 0.5;
            p.mesh.position.add(p.velocity.clone().multiplyScalar(deltaTime));
            p.mesh.scale.multiplyScalar(1.02);
            p.mesh.material.opacity = p.life * 0.6;
            if (p.life <= 0) { this.scene.remove(p.mesh); this.smokeParticles.splice(i, 1); }
        }
        if (this.reloadState !== ReloadState.READY) this.updateReload(deltaTime);
    }
    
    updateReload(deltaTime) {
        this.reloadTimer += deltaTime;
        const stepTimes = {
            [ReloadState.HALF_COCK]: 0.4, [ReloadState.POUR_POWDER]: 0.6, [ReloadState.BALL_PATCH]: 0.5,
            [ReloadState.RAMROD_OUT]: 0.4, [ReloadState.RAMROD_DOWN]: 1.2, [ReloadState.RAMROD_RETURN]: 0.5,
            [ReloadState.PRIME_PAN]: 0.6, [ReloadState.CLOSE_FRIZZEN]: 0.3, [ReloadState.FULL_COCK]: 0.4, [ReloadState.SHOULDERING]: 0.3
        };
        const currentStepTime = stepTimes[this.reloadState] || 0.5;
        this.reloadProgress = Math.min(1, this.reloadTimer / currentStepTime);
        this.animateReloadStep();
        if (this.reloadTimer >= currentStepTime) this.advanceReloadState();
    }
    
    animateReloadStep() {
        const t = this.reloadProgress;
        switch (this.reloadState) {
            case ReloadState.HALF_COCK: this.hammerPivot.rotation.x = t * 0.5 * Math.PI / 4; break;
            case ReloadState.POUR_POWDER: this.musketGroup.rotation.x = -t * 0.3; break;
            case ReloadState.BALL_PATCH: this.musketGroup.rotation.x = -0.3; break;
            case ReloadState.RAMROD_OUT:
                this.ramrodPosition = t;
                this.ramrod.position.z = this.ramrodStoredPos.z + t * 0.3;
                this.ramrod.position.y = this.ramrodStoredPos.y + t * 0.1;
                break;
            case ReloadState.RAMROD_DOWN:
                const stroke = Math.sin(t * Math.PI * 6) * 0.1;
                this.ramrod.position.z = this.ramrodStoredPos.z + 0.3 - stroke;
                break;
            case ReloadState.RAMROD_RETURN:
                this.ramrodPosition = 1 - t;
                this.ramrod.position.z = this.ramrodStoredPos.z + 0.3 * (1 - t);
                this.ramrod.position.y = this.ramrodStoredPos.y + 0.1 * (1 - t);
                break;
            case ReloadState.PRIME_PAN:
                this.frizzenOpen = t;
                this.frizzenPivot.rotation.x = -t * Math.PI / 3;
                break;
            case ReloadState.CLOSE_FRIZZEN:
                this.frizzenOpen = 1 - t;
                this.frizzenPivot.rotation.x = -(1 - t) * Math.PI / 3;
                break;
            case ReloadState.FULL_COCK:
                this.hammerPivot.rotation.x = (0.5 + t * 0.5) * Math.PI / 4;
                break;
            case ReloadState.SHOULDERING:
                this.musketGroup.rotation.x = -0.3 * (1 - t);
                break;
        }
    }
    
    advanceReloadState() {
        const stateOrder = [ReloadState.HALF_COCK, ReloadState.POUR_POWDER, ReloadState.BALL_PATCH, ReloadState.RAMROD_OUT, ReloadState.RAMROD_DOWN, ReloadState.RAMROD_RETURN, ReloadState.PRIME_PAN, ReloadState.CLOSE_FRIZZEN, ReloadState.FULL_COCK, ReloadState.SHOULDERING];
        const currentIndex = stateOrder.indexOf(this.reloadState);
        if (currentIndex < stateOrder.length - 1) {
            this.reloadState = stateOrder[currentIndex + 1];
            this.reloadTimer = 0;
            this.reloadProgress = 0;
        } else {
            this.reloadState = ReloadState.READY;
            this.loaded = true;
        }
    }
    
    addToCamera(camera) { camera.add(this.musketGroup); }
}
