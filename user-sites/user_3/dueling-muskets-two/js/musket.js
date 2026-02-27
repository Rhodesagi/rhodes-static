class Musket {
    constructor() {
        this.mesh = new THREE.Group();
        this.buildMusket();
        
        // Reload state
        this.reloading = false;
        this.reloadStage = 0;
        this.reloadProgress = 0;
        
        // Reload stages with durations (seconds)
        this.reloadStages = [
            { name: 'Half-cock', duration: 0.3 },
            { name: 'Open frizzen', duration: 0.3 },
            { name: 'Powder charge', duration: 0.8 },
            { name: 'Ball & patch', duration: 0.6 },
            { name: 'Ram cartridge', duration: 1.2 },
            { name: 'Prime pan', duration: 0.7 },
            { name: 'Close frizzen', duration: 0.3 },
            { name: 'Full-cock', duration: 0.3 }
        ];
        
        this.totalReloadTime = this.reloadStages.reduce((a, s) => a + s.duration, 0);
        this.aiming = false;
        this.loaded = true;
        this.cocked = true;
    }
    
    buildMusket() {
        // Materials
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x5D4037 });
        const steelMat = new THREE.MeshLambertMaterial({ color: 0x708090 });
        const brassMat = new THREE.MeshLambertMaterial({ color: 0xB8860B });
        const darkSteelMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        
        // Stock (main wooden body)
        const stockGeo = new THREE.BoxGeometry(0.08, 0.12, 0.8);
        this.stock = new THREE.Mesh(stockGeo, woodMat);
        this.stock.position.set(0, -0.06, 0.1);
        this.mesh.add(this.stock);
        
        // Butt plate
        const buttGeo = new THREE.BoxGeometry(0.09, 0.14, 0.05);
        const butt = new THREE.Mesh(buttGeo, steelMat);
        butt.position.set(0, -0.06, 0.52);
        this.mesh.add(butt);
        
        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.025, 0.03, 1.0, 12);
        this.barrel = new THREE.Mesh(barrelGeo, steelMat);
        this.barrel.rotation.x = Math.PI / 2;
        this.barrel.position.set(0, 0.02, -0.3);
        this.mesh.add(this.barrel);
        
        // Barrel bands (3 brass bands)
        for (let i = 0; i < 3; i++) {
            const bandGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12);
            const band = new THREE.Mesh(bandGeo, brassMat);
            band.rotation.x = Math.PI / 2;
            band.position.set(0, 0.02, -0.1 - i * 0.25);
            this.mesh.add(band);
        }
        
        // Lock mechanism (flintlock)
        const lockPlateGeo = new THREE.BoxGeometry(0.04, 0.08, 0.15);
        this.lockPlate = new THREE.Mesh(lockPlateGeo, steelMat);
        this.lockPlate.position.set(0.05, 0.02, -0.15);
        this.mesh.add(this.lockPlate);
        
        // Hammer (cock)
        const hammerGeo = new THREE.BoxGeometry(0.02, 0.06, 0.02);
        this.hammer = new THREE.Mesh(hammerGeo, darkSteelMat);
        this.hammer.position.set(0.06, 0.06, -0.18);
        this.hammerPivot = new THREE.Group();
        this.hammerPivot.position.set(0.06, 0.02, -0.2);
        this.hammerPivot.add(this.hammer);
        this.hammer.position.set(0, 0.04, 0.02);
        this.mesh.add(this.hammerPivot);
        
        // Frizzen (steel striking plate)
        const frizzenGeo = new THREE.BoxGeometry(0.015, 0.04, 0.03);
        this.frizzen = new THREE.Mesh(frizzenGeo, steelMat);
        this.frizzen.position.set(0.055, 0.04, -0.12);
        this.frizzenPivot = new THREE.Group();
        this.frizzenPivot.position.set(0.055, 0.02, -0.1);
        this.frizzenPivot.add(this.frizzen);
        this.frizzen.position.set(0, 0.02, -0.02);
        this.mesh.add(this.frizzenPivot);
        
        // Pan (priming powder holder)
        const panGeo = new THREE.BoxGeometry(0.02, 0.01, 0.02);
        const pan = new THREE.Mesh(panGeo, brassMat);
        pan.position.set(0.055, 0.025, -0.11);
        this.mesh.add(pan);
        
        // Trigger guard
        const guardGeo = new THREE.TorusGeometry(0.03, 0.005, 4, 12, Math.PI);
        const guard = new THREE.Mesh(guardGeo, brassMat);
        guard.rotation.z = Math.PI / 2;
        guard.position.set(0, -0.04, 0.05);
        this.mesh.add(guard);
        
        // Trigger
        const triggerGeo = new THREE.BoxGeometry(0.005, 0.03, 0.01);
        this.trigger = new THREE.Mesh(triggerGeo, steelMat);
        this.trigger.position.set(0, -0.035, 0.05);
        this.trigger.rotation.x = -0.3;
        this.mesh.add(this.trigger);
        
        // Rear sight (notch)
        const rearSightGeo = new THREE.BoxGeometry(0.02, 0.015, 0.005);
        const rearSight = new THREE.Mesh(rearSightGeo, steelMat);
        rearSight.position.set(0, 0.055, -0.05);
        this.mesh.add(rearSight);
        
        // Front sight (blade/post)
        const frontSightGeo = new THREE.BoxGeometry(0.008, 0.02, 0.005);
        const frontSight = new THREE.Mesh(frontSightGeo, steelMat);
        frontSight.position.set(0, 0.06, -0.78);
        this.mesh.add(frontSight);
        
        // Ramrod (under barrel)
        const ramrodGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.9, 8);
        this.ramrod = new THREE.Mesh(ramrodGeo, steelMat);
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrod.position.set(0, -0.08, -0.25);
        this.mesh.add(this.ramrod);
        
        // Ramrod thimbles
        for (let i = 0; i < 3; i++) {
            const thimbleGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.015, 8);
            const thimble = new THREE.Mesh(thimbleGeo, steelMat);
            thimble.rotation.x = Math.PI / 2;
            thimble.position.set(0, -0.08, -0.05 - i * 0.3);
            this.mesh.add(thimble);
        }
        
        // Ramrod handle
        const ramrodHandleGeo = new THREE.CylinderGeometry(0.012, 0.008, 0.04, 8);
        this.ramrodHandle = new THREE.Mesh(ramrodHandleGeo, brassMat);
        this.ramrodHandle.rotation.x = Math.PI / 2;
        this.ramrodHandle.position.set(0, -0.08, 0.22);
        this.mesh.add(this.ramrodHandle);
        
        // Muzzle position for bullet spawn
        this.muzzleOffset = new THREE.Vector3(0, 0.02, -0.85);
        
        // Rear sight position for aiming
        this.rearSightPos = new THREE.Vector3(0, 0.055, -0.05);
    }
    
    startReload() {
        if (this.reloading || !this.cocked) return false;
        this.reloading = true;
        this.reloadStage = 0;
        this.reloadProgress = 0;
        this.loaded = false;
        this.cocked = false;
        return true;
    }
    
    updateReload(dt) {
        if (!this.reloading) return null;
        
        this.reloadProgress += dt;
        
        // Calculate which stage we're in
        let accumulated = 0;
        let currentStageIdx = 0;
        for (let i = 0; i < this.reloadStages.length; i++) {
            accumulated += this.reloadStages[i].duration;
            if (this.reloadProgress <= accumulated) {
                currentStageIdx = i;
                break;
            }
            currentStageIdx = i + 1;
        }
        
        // Update animations based on stage
        this.updateReloadAnimation(currentStageIdx, accumulated - this.reloadStages[currentStageIdx]?.duration || 0);
        
        // Check completion
        if (this.reloadProgress >= this.totalReloadTime) {
            this.reloading = false;
            this.loaded = true;
            this.cocked = true;
            return 'complete';
        }
        
        return this.reloadStages[currentStageIdx]?.name || 'Finishing...';
    }
    
    updateReloadAnimation(stage, stageStartTime) {
        const stageProgress = (this.reloadProgress - stageStartTime) / this.reloadStages[stage]?.duration || 1;
        
        switch (stage) {
            case 0: // Half-cock
                this.hammerPivot.rotation.z = THREE.MathUtils.lerp(0, -Math.PI / 4, stageProgress);
                break;
            case 1: // Open frizzen
                this.frizzenPivot.rotation.y = THREE.MathUtils.lerp(0, Math.PI / 3, stageProgress);
                break;
            case 2: // Powder charge - tilt musket up
                this.mesh.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 6, Math.sin(stageProgress * Math.PI));
                break;
            case 3: // Ball & patch - tilt back down
                this.mesh.rotation.x = THREE.MathUtils.lerp(-Math.PI / 6, 0, stageProgress);
                break;
            case 4: // Ram cartridge
                // Animate ramrod extraction and ramming
                const ramCycle = Math.sin(stageProgress * Math.PI * 2) * 0.3;
                this.ramrod.position.z = -0.25 + ramCycle;
                this.ramrodHandle.position.z = 0.22 + ramCycle;
                break;
            case 5: // Prime pan - slight tilt
                this.mesh.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 12, Math.sin(stageProgress * Math.PI));
                break;
            case 6: // Close frizzen
                this.frizzenPivot.rotation.y = THREE.MathUtils.lerp(Math.PI / 3, 0, stageProgress);
                break;
            case 7: // Full-cock
                this.hammerPivot.rotation.z = THREE.MathUtils.lerp(-Math.PI / 4, -Math.PI / 2, stageProgress);
                // Reset ramrod position
                this.ramrod.position.z = -0.25;
                this.ramrodHandle.position.z = 0.22;
                break;
        }
    }
    
    setAiming(aiming) {
        this.aiming = aiming;
        // Smooth transition handled in update
    }
    
    getMuzzlePosition() {
        const pos = this.muzzleOffset.clone();
        pos.applyMatrix4(this.mesh.matrixWorld);
        return pos;
    }
    
    getAimDirection() {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.mesh.getWorldQuaternion(new THREE.Quaternion()));
        return direction;
    }
    
    fire() {
        if (!this.loaded || !this.cocked || this.reloading) return null;
        
        this.loaded = false;
        this.cocked = false;
        
        // Animate hammer falling
        this.hammerPivot.rotation.z = 0;
        
        // Flash effect
        this.createMuzzleFlash();
        
        return {
            origin: this.getMuzzlePosition(),
            direction: this.getAimDirection()
        };
    }
    
    createMuzzleFlash() {
        const flashGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ 
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.9
        });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.copy(this.getMuzzlePosition());
        this.mesh.parent.add(flash);
        
        // Smoke
        const smokeGeo = new THREE.SphereGeometry(0.05, 6, 6);
        const smokeMat = new THREE.MeshBasicMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.6
        });
        const smoke = new THREE.Mesh(smokeGeo, smokeMat);
        smoke.position.copy(this.getMuzzlePosition());
        smoke.position.y += 0.1;
        this.mesh.parent.add(smoke);
        
        // Animate flash fade
        let flashLife = 0;
        const animateFlash = () => {
            flashLife += 0.05;
            flash.scale.setScalar(1 + flashLife * 2);
            flash.material.opacity = 0.9 - flashLife;
            smoke.scale.setScalar(1 + flashLife);
            smoke.position.y += 0.02;
            smoke.material.opacity = Math.max(0, 0.6 - flashLife);
            
            if (flashLife < 1) {
                requestAnimationFrame(animateFlash);
            } else {
                this.mesh.parent.remove(flash);
                this.mesh.parent.remove(smoke);
            }
        };
        animateFlash();
    }
    
    reset() {
        this.reloading = false;
        this.loaded = true;
        this.cocked = true;
        this.hammerPivot.rotation.z = -Math.PI / 2;
        this.frizzenPivot.rotation.y = 0;
        this.mesh.rotation.x = 0;
    }
}