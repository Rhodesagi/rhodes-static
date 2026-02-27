const ReloadState = {
    READY: 'READY',
    EMPTY: 'EMPTY',
    OPENING_PAN: 'OPENING_PAN',
    PRIMING_PAN: 'PRIMING_PAN',
    CLOSING_PAN: 'CLOSING_PAN',
    OPENING_FRIZZEN: 'OPENING_FRIZZEN',
    POURING_POWDER: 'POURING_POWDER',
    INSERTING_BALL: 'INSERTING_BALL',
    RAMMING: 'RAMMING',
    RETURNING_RAMROD: 'RETURNING_RAMROD',
    HALF_COCKING: 'HALF_COCKING',
    FULL_COCKING: 'FULL_COCKING',
    AIMING: 'AIMING',
    FIRING: 'FIRING'
};

class Musket {
    constructor() {
        this.state = ReloadState.EMPTY;
        this.progress = 0;
        this.loaded = false;
        this.primed = false;
        this.cocked = false;
        this.aiming = false;
        this.musketAngle = 0;
        
        this.timings = {
            [ReloadState.PRIMING_PAN]: 800,
            [ReloadState.POURING_POWDER]: 1200,
            [ReloadState.RAMMING]: 2000,
            [ReloadState.RETURNING_RAMROD]: 1000,
            [ReloadState.HALF_COCKING]: 300,
            [ReloadState.FULL_COCKING]: 300,
            [ReloadState.FIRING]: 100
        };
        
        this.currentStepStart = 0;
        this.ramCount = 0;
        this.maxRams = 3;
        
        this.mesh = null;
        this.panCover = null;
        this.frizzen = null;
        this.hammer = null;
        this.ramrod = null;
        
        this.onStateChange = null;
        this.onFire = null;
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        const barrelGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.4, 12);
        const barrelMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.4,
            metalness: 0.8
        });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.3;
        group.add(barrel);
        
        const stockGeo = new THREE.BoxGeometry(0.12, 0.15, 1.0);
        const stockMat = new THREE.MeshStandardMaterial({ 
            color: 0x4a3728,
            roughness: 0.8
        });
        const stock = new THREE.Mesh(stockGeo, stockMat);
        stock.position.set(0, -0.08, 0.3);
        group.add(stock);
        
        const buttGeo = new THREE.BoxGeometry(0.14, 0.25, 0.3);
        const butt = new THREE.Mesh(buttGeo, stockMat);
        butt.position.set(0, 0.02, 0.85);
        group.add(butt);
        
        const lockGeo = new THREE.BoxGeometry(0.08, 0.15, 0.2);
        const lockMat = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.7
        });
        const lock = new THREE.Mesh(lockGeo, lockMat);
        lock.position.set(0.08, 0.05, -0.2);
        group.add(lock);
        
        const panGeo = new THREE.BoxGeometry(0.06, 0.02, 0.06);
        const pan = new THREE.Mesh(panGeo, lockMat);
        pan.position.set(0.08, 0.12, -0.25);
        group.add(pan);
        
        const coverGeo = new THREE.BoxGeometry(0.07, 0.01, 0.07);
        this.panCover = new THREE.Mesh(coverGeo, lockMat);
        this.panCover.position.set(0.08, 0.135, -0.25);
        this.panCover.userData.closed = true;
        group.add(this.panCover);
        
        const frizzenGeo = new THREE.BoxGeometry(0.02, 0.1, 0.08);
        this.frizzen = new THREE.Mesh(frizzenGeo, lockMat);
        this.frizzen.position.set(0.12, 0.15, -0.22);
        this.frizzen.userData.open = false;
        group.add(this.frizzen);
        
        const hammerGeo = new THREE.BoxGeometry(0.03, 0.12, 0.04);
        this.hammer = new THREE.Mesh(hammerGeo, lockMat);
        this.hammer.position.set(0.08, 0.2, -0.18);
        this.hammer.rotation.z = 0;
        this.hammer.userData.position = 'down';
        group.add(this.hammer);
        
        const ramrodGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.8, 6);
        const ramrodMat = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            metalness: 0.6
        });
        this.ramrod = new THREE.Mesh(ramrodGeo, ramrodMat);
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrod.position.set(0, -0.12, 0.1);
        this.ramrod.userData.drawn = false;
        group.add(this.ramrod);
        
        const frontSightGeo = new THREE.BoxGeometry(0.005, 0.03, 0.01);
        const sightMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const frontSight = new THREE.Mesh(frontSightGeo, sightMat);
        frontSight.position.set(0, 0.08, -1.0);
        group.add(frontSight);
        
        const rearSightGeo = new THREE.BoxGeometry(0.02, 0.02, 0.01);
        const rearSight = new THREE.Mesh(rearSightGeo, sightMat);
        rearSight.position.set(0, 0.06, -0.5);
        group.add(rearSight);
        
        this.mesh = group;
        return group;
    }
    
    update(deltaTime, inputState) {
        if (inputState.turnMusketLeft) {
            this.musketAngle += 1.5 * deltaTime;
        }
        if (inputState.turnMusketRight) {
            this.musketAngle -= 1.5 * deltaTime;
        }
        
        this.musketAngle = Math.max(-0.5, Math.min(0.5, this.musketAngle));
        this.aiming = inputState.aim;
        
        if (inputState.firePressed && this.canFire()) {
            this.fire();
            return;
        }
        
        if (inputState.reloadPressed || inputState.reloadHeld) {
            this.processReload(inputState.reloadHeld, deltaTime);
        }
        
        this.updateAnimations(deltaTime);
    }
    
    canFire() {
        return this.state === ReloadState.READY && 
               this.loaded && 
               this.primed && 
               this.cocked === 'full' &&
               this.aiming;
    }
    
    fire() {
        this.state = ReloadState.FIRING;
        this.cocked = false;
        this.primed = false;
        this.loaded = false;
        
        if (this.hammer) {
            this.hammer.rotation.z = 0;
            this.hammer.userData.position = 'down';
        }
        
        if (this.onFire) {
            this.onFire();
        }
        
        setTimeout(() => {
            this.state = ReloadState.EMPTY;
            if (this.onStateChange) {
                this.onStateChange(this.getStatusText());
            }
        }, 200);
    }
    
    processReload(isHeld, deltaTime) {
        const now = Date.now();
        
        switch (this.state) {
            case ReloadState.EMPTY:
            case ReloadState.READY:
                if (!isHeld) {
                    this.state = ReloadState.OPENING_PAN;
                    this.animatePanCover(true);
                }
                break;
            case ReloadState.OPENING_PAN:
                if (isHeld) {
                    this.state = ReloadState.PRIMING_PAN;
                    this.currentStepStart = now;
                }
                break;
            case ReloadState.PRIMING_PAN:
                if (now - this.currentStepStart >= this.timings[ReloadState.PRIMING_PAN]) {
                    this.primed = true;
                    if (!isHeld) {
                        this.state = ReloadState.CLOSING_PAN;
                        this.animatePanCover(false);
                    }
                }
                break;
            case ReloadState.CLOSING_PAN:
                if (!isHeld) {
                    this.state = ReloadState.OPENING_FRIZZEN;
                    this.animateFrizzen(true);
                }
                break;
            case ReloadState.OPENING_FRIZZEN:
                if (isHeld) {
                    this.state = ReloadState.POURING_POWDER;
                    this.currentStepStart = now;
                }
                break;
            case ReloadState.POURING_POWDER:
                if (now - this.currentStepStart >= this.timings[ReloadState.POURING_POWDER]) {
                    if (!isHeld) {
                        this.state = ReloadState.INSERTING_BALL;
                    }
                }
                break;
            case ReloadState.INSERTING_BALL:
                if (!isHeld) {
                    this.state = ReloadState.RAMMING;
                    this.ramCount = 0;
                    this.animateRamrod(true);
                }
                break;
            case ReloadState.RAMMING:
                if (!isHeld) {
                    this.ramCount++;
                    if (this.ramCount >= this.maxRams) {
                        this.loaded = true;
                        this.state = ReloadState.RETURNING_RAMROD;
                        this.animateRamrod(false);
                    }
                }
                break;
            case ReloadState.RETURNING_RAMROD:
                this.state = ReloadState.HALF_COCKING;
                break;
            case ReloadState.HALF_COCKING:
                if (!isHeld) {
                    this.cocked = 'half';
                    this.animateHammer('half');
                    this.state = ReloadState.FULL_COCKING;
                }
                break;
            case ReloadState.FULL_COCKING:
                if (!isHeld) {
                    this.cocked = 'full';
                    this.animateHammer('full');
                    this.state = ReloadState.READY;
                }
                break;
        }
        
        if (this.onStateChange) {
            this.onStateChange(this.getStatusText());
        }
    }
    
    animatePanCover(open) {
        if (!this.panCover) return;
        this.panCover.userData.targetRotation = open ? -Math.PI / 3 : 0;
        this.panCover.userData.closed = !open;
    }
    
    animateFrizzen(open) {
        if (!this.frizzen) return;
        this.frizzen.userData.targetRotation = open ? Math.PI / 4 : 0;
        this.frizzen.userData.open = open;
    }
    
    animateRamrod(drawn) {
        if (!this.ramrod) return;
        this.ramrod.userData.targetZ = drawn ? -0.5 : 0.1;
        this.ramrod.userData.drawn = drawn;
    }
    
    animateHammer(position) {
        if (!this.hammer) return;
        switch(position) {
            case 'half':
                this.hammer.userData.targetRotation = Math.PI / 6;
                break;
            case 'full':
                this.hammer.userData.targetRotation = Math.PI / 2.5;
                break;
            default:
                this.hammer.userData.targetRotation = 0;
        }
        this.hammer.userData.position = position;
    }
    
    updateAnimations(deltaTime) {
        const speed = 5 * deltaTime;
        
        if (this.panCover && this.panCover.userData.targetRotation !== undefined) {
            this.panCover.rotation.x += (this.panCover.userData.targetRotation - this.panCover.rotation.x) * speed;
        }
        
        if (this.frizzen && this.frizzen.userData.targetRotation !== undefined) {
            this.frizzen.rotation.z += (this.frizzen.userData.targetRotation - this.frizzen.rotation.z) * speed;
        }
        
        if (this.ramrod && this.ramrod.userData.targetZ !== undefined) {
            this.ramrod.position.z += (this.ramrod.userData.targetZ - this.ramrod.position.z) * speed;
        }
        
        if (this.hammer && this.hammer.userData.targetRotation !== undefined) {
            this.hammer.rotation.z += (this.hammer.userData.targetRotation - this.hammer.rotation.z) * speed;
        }
        
        if (this.mesh) {
            this.mesh.rotation.y = this.musketAngle;
            const targetY = this.aiming ? -0.15 : -0.3;
            const targetX = this.aiming ? 0 : 0.1;
            this.mesh.position.y += (targetY - this.mesh.position.y) * speed;
            this.mesh.position.x += (targetX - this.mesh.position.x) * speed;
            const targetRotX = this.aiming ? 0 : 0.1;
            this.mesh.rotation.x += (targetRotX - this.mesh.rotation.x) * speed;
        }
    }
    
    getStatusText() {
        switch(this.state) {
            case ReloadState.READY:
                return this.loaded ? "READY TO FIRE" : "EMPTY";
            case ReloadState.EMPTY:
                return "EMPTY - Press reload to start";
            case ReloadState.OPENING_PAN:
                return "Opening pan cover...";
            case ReloadState.PRIMING_PAN:
                return "Priming pan with powder...";
            case ReloadState.CLOSING_PAN:
                return "Closing pan cover...";
            case ReloadState.OPENING_FRIZZEN:
                return "Opening frizzen...";
            case ReloadState.POURING_POWDER:
                return "Pouring main powder charge...";
            case ReloadState.INSERTING_BALL:
                return "Inserting ball and patch...";
            case ReloadState.RAMMING:
                return `Ramming cartridge... (${this.ramCount}/${this.maxRams})`;
            case ReloadState.RETURNING_RAMROD:
                return "Returning ramrod...";
            case ReloadState.HALF_COCKING:
                return "Half-cocking...";
            case ReloadState.FULL_COCKING:
                return "Full-cock...";
            case ReloadState.AIMING:
                return "AIMING";
            case ReloadState.FIRING:
                return "FIRING!";
            default:
                return "Loading...";
        }
    }
}
