class Musket {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        this.RELOAD_STATES = {
            READY: 'READY',
            POUR_POWDER: 'POUR_POWDER',
            INSERT_PATCH: 'INSERT_PATCH',
            LOAD_BALL: 'LOAD_BALL',
            RAMROD: 'RAMROD',
            PRIME_PAN: 'PRIME_PAN',
            COCK_HAMMER: 'COCK_HAMMER'
        };
        
        this.reloadState = this.RELOAD_STATES.READY;
        this.loaded = true;
        this.cocked = true;
        this.primed = true;
        this.reloading = false;
        this.reloadTimer = 0;
        this.reloadProgress = 0;
        
        this.stateTimings = {
            [this.RELOAD_STATES.POUR_POWDER]: 0.6,
            [this.RELOAD_STATES.INSERT_PATCH]: 0.5,
            [this.RELOAD_STATES.LOAD_BALL]: 0.5,
            [this.RELOAD_STATES.RAMROD]: 1.2,
            [this.RELOAD_STATES.PRIME_PAN]: 0.7,
            [this.RELOAD_STATES.COCK_HAMMER]: 0.5
        };
        
        this.group = new THREE.Group();
        this.hipGroup = new THREE.Group();
        
        this.parts = {};
        this.buildModel(this.hipGroup);
        
        this.hipGroup.position.set(0.3, -0.3, -0.5);
        this.hipGroup.rotation.set(0, -0.1, 0.1);
        
        this.group.add(this.hipGroup);
        this.camera.add(this.group);
        
        this.aiming = false;
        this.aimProgress = 0;
        this.recoil = 0;
    }
    
    buildModel(parent) {
        const barrelMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a, metalness: 0.7, roughness: 0.4 
        });
        const stockMat = new THREE.MeshStandardMaterial({ 
            color: 0x4a3728, roughness: 0.8 
        });
        const metalMat = new THREE.MeshStandardMaterial({ 
            color: 0x444444, metalness: 0.7 
        });
        const darkMat = new THREE.MeshStandardMaterial({ 
            color: 0x222222, metalness: 0.7 
        });
        
        // Barrel
        this.parts.barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.025, 1.2, 8),
            barrelMat
        );
        this.parts.barrel.position.z = -0.3;
        this.parts.barrel.rotation.x = Math.PI / 2;
        parent.add(this.parts.barrel);
        
        // Bands
        for (let i = 0; i < 3; i++) {
            const band = new THREE.Mesh(
                new THREE.CylinderGeometry(0.026, 0.026, 0.02, 8),
                metalMat
            );
            band.rotation.x = Math.PI / 2;
            band.position.z = -0.8 + i * 0.35;
            this.parts.barrel.add(band);
        }
        
        // Stock
        const stock = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.12, 0.9),
            stockMat
        );
        stock.position.set(0, -0.06, 0.2);
        parent.add(stock);
        
        const butt = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.15, 0.3),
            stockMat
        );
        butt.position.set(0, 0.02, 0.7);
        butt.rotation.x = -0.2;
        stock.add(butt);
        
        // Lock
        const lockPlate = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.08, 0.15),
            metalMat
        );
        lockPlate.position.set(0.05, 0.02, -0.1);
        parent.add(lockPlate);
        
        // Hammer
        this.parts.hammer = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.08, 0.05),
            darkMat
        );
        this.parts.hammer.position.set(0, 0.06, 0.05);
        this.parts.hammer.rotation.x = 0.3;
        lockPlate.add(this.parts.hammer);
        
        // Frizzen
        this.parts.frizzen = new THREE.Mesh(
            new THREE.BoxGeometry(0.025, 0.04, 0.04),
            metalMat
        );
        this.parts.frizzen.position.set(0, -0.02, 0.08);
        this.parts.frizzen.rotation.x = 0.2;
        lockPlate.add(this.parts.frizzen);
        
        // Trigger guard
        const triggerGuard = new THREE.Mesh(
            new THREE.TorusGeometry(0.04, 0.005, 4, 8, Math.PI),
            metalMat
        );
        triggerGuard.position.set(0, -0.05, 0.15);
        triggerGuard.rotation.z = Math.PI;
        parent.add(triggerGuard);
        
        // Ramrod
        this.parts.ramrod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.004, 0.004, 1.1, 6),
            metalMat
        );
        this.parts.ramrod.position.set(0, -0.045, -0.25);
        this.parts.ramrod.rotation.x = Math.PI / 2;
        parent.add(this.parts.ramrod);
        
        // Sights
        this.parts.frontSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.003, 0.015, 0.003),
            darkMat
        );
        this.parts.frontSight.position.set(0, 0.025, -0.85);
        this.parts.barrel.add(this.parts.frontSight);
        
        this.parts.rearSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.01, 0.008, 0.005),
            darkMat
        );
        this.parts.rearSight.position.set(0, 0.02, -0.15);
        this.parts.barrel.add(this.parts.rearSight);
        
        // Muzzle flash
        this.parts.flash = new THREE.PointLight(0xffaa00, 0, 5);
        this.parts.flash.position.set(0, 0, -0.85);
        this.parts.barrel.add(this.parts.flash);
        
        // Store muzzle offset for firing
        this.muzzleOffset = new THREE.Vector3(0, 0, -0.85);
    }
    
    startReload() {
        if (this.reloading || this.loaded) return false;
        
        this.reloading = true;
        this.reloadState = this.RELOAD_STATES.POUR_POWDER;
        this.reloadTimer = 0;
        this.reloadProgress = 0;
        return true;
    }
    
    updateReload(delta) {
        if (!this.reloading) return null;
        
        this.reloadTimer += delta;
        const currentTiming = this.stateTimings[this.reloadState] || 0.5;
        this.reloadProgress = Math.min(this.reloadTimer / currentTiming, 1);
        
        if (this.reloadTimer >= currentTiming) {
            this.advanceReloadState();
        }
        
        return this.getReloadStatusText();
    }
    
    advanceReloadState() {
        const states = [
            this.RELOAD_STATES.POUR_POWDER,
            this.RELOAD_STATES.INSERT_PATCH,
            this.RELOAD_STATES.LOAD_BALL,
            this.RELOAD_STATES.RAMROD,
            this.RELOAD_STATES.PRIME_PAN,
            this.RELOAD_STATES.COCK_HAMMER,
            this.RELOAD_STATES.READY
        ];
        
        const currentIdx = states.indexOf(this.reloadState);
        if (currentIdx < states.length - 1) {
            this.reloadState = states[currentIdx + 1];
        } else {
            this.reloading = false;
            this.loaded = true;
            this.cocked = true;
            this.primed = true;
        }
        
        this.reloadTimer = 0;
        this.reloadProgress = 0;
    }
    
    getReloadStatusText() {
        const descriptions = {
            [this.RELOAD_STATES.POUR_POWDER]: 'Pouring powder...',
            [this.RELOAD_STATES.INSERT_PATCH]: 'Inserting patch...',
            [this.RELOAD_STATES.LOAD_BALL]: 'Loading ball...',
            [this.RELOAD_STATES.RAMROD]: 'Ramming cartridge...',
            [this.RELOAD_STATES.PRIME_PAN]: 'Priming pan...',
            [this.RELOAD_STATES.COCK_HAMMER]: 'Cocking hammer...'
        };
        return descriptions[this.reloadState] || '';
    }
    
    fire(playerPos, playerYaw, playerPitch) {
        if (!this.loaded || !this.cocked || this.reloading) return null;
        
        this.loaded = false;
        this.cocked = false;
        this.primed = false;
        this.recoil = 1.0;
        
        // Flash
        if (this.parts.flash) {
            this.parts.flash.intensity = 5;
            setTimeout(() => { 
                if (this.parts.flash) this.parts.flash.intensity = 0; 
            }, 60);
        }
        
        // Calculate actual muzzle position in world space
        // Start from player position at eye height
        const muzzlePos = playerPos.clone();
        
        // Apply yaw and pitch to get direction
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyEuler(new THREE.Euler(playerPitch, playerYaw, 0, 'YXZ'));
        
        // Offset to muzzle position (eye level, slightly right, forward)
        const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, playerYaw, 0));
        const up = new THREE.Vector3(0, 1, 0);
        
        muzzlePos.add(right.multiplyScalar(0.15)); // Slight right offset
        muzzlePos.add(direction.clone().multiplyScalar(0.6)); // Forward to muzzle
        muzzlePos.add(up.multiplyScalar(-0.05)); // Slight down from eye line
        
        // Add musket spread (muskets are inaccurate)
        const spread = 0.025;
        const perpX = new THREE.Vector3().crossVectors(direction, up).normalize();
        const perpY = new THREE.Vector3().crossVectors(direction, perpX).normalize();
        
        direction.add(perpX.multiplyScalar((Math.random() - 0.5) * spread));
        direction.add(perpY.multiplyScalar((Math.random() - 0.5) * spread));
        direction.normalize();
        
        // Smoke
        this.createSmoke(muzzlePos);
        
        return {
            position: muzzlePos,
            direction: direction,
            velocity: 135
        };
    }
    
    createSmoke(pos) {
        for (let i = 0; i < 12; i++) {
            const smoke = new THREE.Mesh(
                new THREE.PlaneGeometry(0.12, 0.12),
                new THREE.MeshBasicMaterial({
                    color: 0xaaaaaa,
                    transparent: true,
                    opacity: 0.5,
                    side: THREE.DoubleSide
                })
            );
            smoke.position.copy(pos);
            smoke.position.x += (Math.random() - 0.5) * 0.08;
            smoke.position.y += (Math.random() - 0.5) * 0.08;
            
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 0.8,
                0.2 + Math.random() * 0.3,
                (Math.random() - 0.5) * 0.8
            );
            
            this.scene.add(smoke);
            
            let life = 1.0;
            const animate = () => {
                life -= 0.015;
                if (life <= 0) {
                    this.scene.remove(smoke);
                    return;
                }
                smoke.position.add(vel);
                vel.multiplyScalar(0.98);
                smoke.material.opacity = life * 0.4;
                smoke.scale.setScalar(1 + (1 - life) * 3);
                smoke.rotation.z += 0.02;
                requestAnimationFrame(animate);
            };
            animate();
        }
    }
    
    setAiming(aiming) {
        this.aiming = aiming;
    }
    
    update(delta) {
        if (this.recoil > 0) {
            this.recoil = Math.max(0, this.recoil - delta * 4);
        }
        
        const targetProgress = this.aiming ? 1 : 0;
        this.aimProgress += (targetProgress - this.aimProgress) * delta * 6;
        
        const hipPos = new THREE.Vector3(0.3, -0.3, -0.5);
        const aimPos = new THREE.Vector3(0, -0.12, -0.2);
        
        hipPos.lerp(aimPos, this.aimProgress);
        this.hipGroup.position.copy(hipPos);
        
        this.hipGroup.position.z += this.recoil * 0.08;
        this.hipGroup.rotation.x = -this.recoil * 0.2;
        
        if (this.parts.hammer) {
            const targetRot = this.cocked ? 0.3 : 0;
            this.parts.hammer.rotation.x += (targetRot - this.parts.hammer.rotation.x) * delta * 10;
        }
        
        if (this.parts.frizzen) {
            const targetRot = this.primed ? 0.2 : -0.3;
            this.parts.frizzen.rotation.x += (targetRot - this.parts.frizzen.rotation.x) * delta * 10;
        }
        
        if (this.reloading && this.reloadState === this.RELOAD_STATES.RAMROD && this.parts.ramrod) {
            const ramCycle = Math.sin(this.reloadProgress * Math.PI * 6);
            this.parts.ramrod.position.z = -0.25 + ramCycle * 0.15;
            this.parts.ramrod.rotation.x = Math.PI / 2 + ramCycle * 0.1;
        } else if (this.parts.ramrod) {
            this.parts.ramrod.position.z = -0.25;
            this.parts.ramrod.rotation.x = Math.PI / 2;
        }
    }
    
    getAmmoStatus() {
        if (this.reloading) return 'RELOADING';
        if (!this.loaded) return 'EMPTY';
        if (!this.cocked) return 'UNCocked';
        return 'READY';
    }
}
