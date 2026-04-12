/**
 * Musket Weapon System
 * Historically accurate flintlock musket with full reload simulation
 * Brown Bess / Charleville style mechanics
 */

const ReloadState = {
    IDLE: 'idle',
    HALF_COCK: 'half_cock',
    OPEN_FRIZZEN: 'open_frizzen',
    POUR_POWDER: 'pour_powder',
    INSERT_BALL: 'insert_ball',
    RAMROD_1: 'ramrod_1',
    RAMROD_2: 'ramrod_2',
    RAMROD_3: 'ramrod_3',
    REMOVE_ROD: 'remove_rod',
    CLOSE_FRIZZEN: 'close_frizzen',
    FULL_COCK: 'full_cock',
    READY_TO_FIRE: 'ready_to_fire',
    FIRE: 'fire',
    CLEANING: 'cleaning'
};

const StateTiming = {
    [ReloadState.HALF_COCK]: 0.3,
    [ReloadState.OPEN_FRIZZEN]: 0.4,
    [ReloadState.POUR_POWDER]: 1.0,
    [ReloadState.INSERT_BALL]: 0.8,
    [ReloadState.RAMROD_1]: 0.6,
    [ReloadState.RAMROD_2]: 0.5,
    [ReloadState.RAMROD_3]: 0.5,
    [ReloadState.REMOVE_ROD]: 0.7,
    [ReloadState.CLOSE_FRIZZEN]: 0.3,
    [ReloadState.FULL_COCK]: 0.4,
    [ReloadState.FIRE]: 0.2,
    [ReloadState.CLEANING]: 0.5
};

const StateDescriptions = {
    [ReloadState.IDLE]: 'Musket ready - Press R to begin reload',
    [ReloadState.HALF_COCK]: 'Pulling hammer to half-cock...',
    [ReloadState.OPEN_FRIZZEN]: 'Opening frizzen...',
    [ReloadState.POUR_POWDER]: 'Pouring black powder down barrel...',
    [ReloadState.INSERT_BALL]: 'Inserting patched ball...',
    [ReloadState.RAMROD_1]: 'Ramming ball - First stroke...',
    [ReloadState.RAMROD_2]: 'Ramming ball - Second stroke...',
    [ReloadState.RAMROD_3]: 'Ramming ball - Third stroke...',
    [ReloadState.REMOVE_ROD]: 'Removing ramrod...',
    [ReloadState.CLOSE_FRIZZEN]: 'Closing frizzen...',
    [ReloadState.FULL_COCK]: 'Pulling to full cock...',
    [ReloadState.READY_TO_FIRE]: 'READY TO FIRE',
    [ReloadState.FIRE]: 'FIRING',
    [ReloadState.CLEANING]: 'Cleaning fouled barrel...'
};

class Musket {
    constructor() {
        this.state = ReloadState.IDLE;
        this.stateTimer = 0;
        this.loaded = false;
        this.cocked = false;
        
        // Weapon specs
        this.barrelLength = 1.2; // meters
        this.muzzleVelocity = 300; // m/s
        this.accuracySpread = 0.02; // radians (about 1.15 degrees)
        
        // Create 3D model (simplified geometry)
        this.mesh = this.createModel();
        
        // Ramrod (visible during reload)
        this.ramrod = this.createRamrod();
        this.mesh.add(this.ramrod);
        this.ramrod.visible = false;
        
        // Hammer/frizzen animation parts
        this.hammer = this.createHammer();
        this.mesh.add(this.hammer);
        
        this.frizzen = this.createFrizzen();
        this.mesh.add(this.frizzen);
        
        // Visual state
        this.ironSightsActive = false;
        this.swayPhase = 0;
        
        // Powder effects
        this.powderParticles = [];
    }
    
    createModel() {
        const group = new THREE.Group();
        
        // Stock (wood)
        const stockGeo = new THREE.BoxGeometry(0.08, 0.12, 1.2);
        const stockMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const stock = new THREE.Mesh(stockGeo, stockMat);
        stock.position.z = -0.3;
        stock.position.y = -0.1;
        group.add(stock);
        
        // Barrel (metal)
        const barrelGeo = new THREE.CylinderGeometry(0.025, 0.03, 1.2, 16);
        const barrelMat = new THREE.MeshPhongMaterial({ 
            color: 0x222222,
            shininess: 30
        });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.3;
        barrel.position.y = 0.05;
        group.add(barrel);
        
        // Muzzle
        const muzzleGeo = new THREE.TorusGeometry(0.03, 0.005, 8, 16);
        const muzzleMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
        const muzzle = new THREE.Mesh(muzzleGeo, muzzleGeo, muzzleMat);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.z = 0.9;
        muzzle.position.y = 0.05;
        group.add(muzzle);
        
        // Rear sight (notch)
        const rearSightGeo = new THREE.BoxGeometry(0.02, 0.02, 0.01);
        const sightMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const rearSight = new THREE.Mesh(rearSightGeo, sightMat);
        rearSight.position.set(0, 0.08, -0.2);
        rearSight.geometry.translate(0, 0.01, 0); // U-notch shape
        group.add(rearSight);
        
        // Front sight (post)
        const frontSightGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.03);
        const frontSight = new THREE.Mesh(frontSightGeo, sightMat);
        frontSight.position.set(0, 0.1, 0.5);
        group.add(frontSight);
        
        // Trigger guard
        const guardGeo = new THREE.TorusGeometry(0.04, 0.005, 8, 16, Math.PI);
        const guard = new THREE.Mesh(guardGeo, barrelMat);
        guard.position.set(0, -0.15, -0.1);
        group.add(guard);
        
        // Buttplate
        const buttGeo = new THREE.BoxGeometry(0.08, 0.15, 0.02);
        const butt = new THREE.Mesh(buttGeo, barrelMat);
        butt.position.set(0, -0.08, -0.9);
        group.add(butt);
        
        return group;
    }
    
    createRamrod() {
        const rodGeo = new THREE.CylinderGeometry(0.008, 0.008, 1.3, 8);
        const rodMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const rod = new THREE.Mesh(rodGeo, rodMat);
        rod.rotation.x = Math.PI / 2;
        rod.position.set(0, 0, 0);
        return rod;
    }
    
    createHammer() {
        const hammerGeo = new THREE.BoxGeometry(0.02, 0.05, 0.02);
        const hammerMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const hammer = new THREE.Mesh(hammerGeo, hammerMat);
        hammer.position.set(0, 0.1, -0.35);
        return hammer;
    }
    
    createFrizzen() {
        const frizzenGeo = new THREE.BoxGeometry(0.025, 0.03, 0.025);
        const frizzenMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const frizzen = new THREE.Mesh(frizzenGeo, frizzenMat);
        frizzen.position.set(0, 0.12, -0.38);
        return frizzen;
    }
    
    update(dt, time) {
        this.swayPhase += dt;
        
        // State machine timing
        if (this.state !== ReloadState.IDLE && this.state !== ReloadState.READY_TO_FIRE) {
            this.stateTimer += dt;
            const stateDuration = StateTiming[this.state] || 0.5;
            
            if (this.stateTimer >= stateDuration) {
                this.advanceState();
            }
        }
        
        // Animation based on state
        this.animateReload(dt);
        
        // Iron sights sway (breathing + movement)
        if (this.ironSightsActive) {
            const swayX = Math.sin(this.swayPhase * 0.8) * 0.002;
            const swayY = Math.cos(this.swayPhase * 0.6) * 0.002 + Math.sin(this.swayPhase * 2) * 0.001;
            this.mesh.position.x = swayX;
            this.mesh.position.y = swayY - 0.1;
            this.mesh.rotation.z = swayX * 0.5;
        } else {
            this.mesh.position.set(0, -0.15, 0.2);
            this.mesh.rotation.set(0, 0, 0);
        }
        
        // Hammer animation
        this.animateHammer();
    }
    
    animateReload(dt) {
        // Show/hide ramrod based on state
        const ramrodStates = [
            ReloadState.RAMROD_1,
            ReloadState.RAMROD_2,
            ReloadState.RAMROD_3,
            ReloadState.REMOVE_ROD
        ];
        
        if (ramrodStates.includes(this.state)) {
            this.ramrod.visible = true;
            
            // Animate ramrod motion
            const progress = this.stateTimer / (StateTiming[this.state] || 0.5);
            
            if (this.state === ReloadState.RAMROD_1 || this.state === ReloadState.RAMROD_2 || this.state === ReloadState.RAMROD_3) {
                // Ramming motion - push down and up
                const ramPhase = Math.sin(progress * Math.PI);
                this.ramrod.position.z = 0.3 - ramPhase * 0.4;
                this.ramrod.position.y = 0.05 + ramPhase * 0.1;
            } else if (this.state === ReloadState.REMOVE_ROD) {
                // Pulling ramrod out
                this.ramrod.position.z = 0.3 + progress * 0.5;
                this.ramrod.position.y = 0.05;
            }
        } else {
            this.ramrod.visible = false;
        }
        
        // Powder pour effect
        if (this.state === ReloadState.POUR_POWDER && this.stateTimer < 0.3) {
            // Could spawn particles here
        }
    }
    
    animateHammer() {
        // Hammer position based on cock state
        let hammerAngle = 0;
        
        switch (this.state) {
            case ReloadState.IDLE:
            case ReloadState.HALF_COCK:
                hammerAngle = Math.PI / 6; // Half-cock position
                break;
            case ReloadState.FULL_COCK:
            case ReloadState.READY_TO_FIRE:
                hammerAngle = Math.PI / 3; // Full cock
                break;
            case ReloadState.FIRE:
                hammerAngle = 0; // Fired position
                break;
            default:
                hammerAngle = Math.PI / 6;
        }
        
        this.hammer.rotation.x = hammerAngle;
        
        // Frizzen position
        if (this.state === ReloadState.OPEN_FRIZZEN || 
            this.state === ReloadState.POUR_POWDER ||
            this.state === ReloadState.INSERT_BALL ||
            this.state === ReloadState.RAMROD_1 ||
            this.state === ReloadState.RAMROD_2 ||
            this.state === ReloadState.RAMROD_3 ||
            this.state === ReloadState.REMOVE_ROD) {
            this.frizzen.rotation.x = Math.PI / 2; // Open
        } else {
            this.frizzen.rotation.x = 0; // Closed
        }
    }
    
    advanceState() {
        const stateOrder = [
            ReloadState.HALF_COCK,
            ReloadState.OPEN_FRIZZEN,
            ReloadState.POUR_POWDER,
            ReloadState.INSERT_BALL,
            ReloadState.RAMROD_1,
            ReloadState.RAMROD_2,
            ReloadState.RAMROD_3,
            ReloadState.REMOVE_ROD,
            ReloadState.CLOSE_FRIZZEN,
            ReloadState.FULL_COCK,
            ReloadState.READY_TO_FIRE
        ];
        
        const currentIndex = stateOrder.indexOf(this.state);
        
        if (currentIndex >= 0 && currentIndex < stateOrder.length - 1) {
            this.state = stateOrder[currentIndex + 1];
            this.stateTimer = 0;
            
            if (this.state === ReloadState.READY_TO_FIRE) {
                this.loaded = true;
                this.cocked = true;
            }
        } else if (this.state === ReloadState.FIRE) {
            this.state = ReloadState.IDLE;
            this.loaded = false;
            this.cocked = false;
            this.stateTimer = 0;
        }
    }
    
    startReload() {
        if (this.state === ReloadState.IDLE || this.state === ReloadState.READY_TO_FIRE) {
            if (this.state === ReloadState.READY_TO_FIRE) {
                // Already loaded - must fire first or eject
                return false;
            }
            this.state = ReloadState.HALF_COCK;
            this.stateTimer = 0;
            return true;
        }
        return false;
    }
    
    fire() {
        if (this.state === ReloadState.READY_TO_FIRE && this.loaded && this.cocked) {
            this.state = ReloadState.FIRE;
            this.stateTimer = 0;
            this.loaded = false;
            this.cocked = false;
            return true;
        }
        return false;
    }
    
    toggleIronSights() {
        this.ironSightsActive = !this.ironSightsActive;
        return this.ironSightsActive;
    }
    
    getMuzzlePosition() {
        const pos = new THREE.Vector3(0, 0.05, 0.9);
        pos.applyMatrix4(this.mesh.matrixWorld);
        return pos;
    }
    
    getFiringDirection(cameraDirection) {
        // Add slight random spread for realism
        const spread = (Math.random() - 0.5) * this.accuracySpread;
        const spreadY = (Math.random() - 0.5) * this.accuracySpread * 0.5;
        
        const direction = cameraDirection.clone();
        direction.x += spread;
        direction.y += spreadY;
        direction.normalize();
        
        return direction;
    }
    
    getStateDescription() {
        return StateDescriptions[this.state] || '';
    }
    
    isReadyToFire() {
        return this.state === ReloadState.READY_TO_FIRE;
    }
    
    isReloading() {
        return this.state !== ReloadState.IDLE && this.state !== ReloadState.READY_TO_FIRE && this.state !== ReloadState.FIRE;
    }
}