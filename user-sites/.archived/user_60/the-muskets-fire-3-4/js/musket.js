// Muskets Fire 3 - Procedural Musket Model with Flintlock Reload Animation
// All geometry created via Three.js primitives - no external assets

class MusketModel {
    constructor() {
        this.mesh = new THREE.Group();
        this.components = {};
        this.buildModel();
    }
    
    buildModel() {
        // Materials - period-appropriate colors
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        const metalMat = new THREE.MeshStandardMaterial({ 
            color: 0x444444, 
            roughness: 0.6,
            metalness: 0.7
        });
        const brassMat = new THREE.MeshStandardMaterial({ 
            color: 0xcda434, 
            roughness: 0.4,
            metalness: 0.8
        });
        const darkMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        
        // Stock (main body)
        const stockGeo = new THREE.BoxGeometry(0.08, 0.12, 0.9);
        // Taper the stock
        const stockPos = stockGeo.attributes.position;
        for (let i = 0; i < stockPos.count; i++) {
            const z = stockPos.getZ(i);
            const x = stockPos.getX(i);
            if (z < -0.2) { // Butt end
                stockPos.setX(i, x * 0.7);
            }
            if (z > 0.3) { // Front of stock
                stockPos.setX(i, x * 0.6);
                stockPos.setY(i, stockPos.getY(i) * 0.7);
            }
        }
        stockGeo.computeVertexNormals();
        this.components.stock = new THREE.Mesh(stockGeo, woodMat);
        this.components.stock.position.set(0, -0.05, 0.1);
        this.mesh.add(this.components.stock);
        
        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.025, 0.03, 1.0, 16);
        this.components.barrel = new THREE.Mesh(barrelGeo, metalMat);
        this.components.barrel.rotation.x = -Math.PI / 2;
        this.components.barrel.position.set(0, 0.02, -0.35);
        this.mesh.add(this.components.barrel);
        
        // Breech (bulge at lock end of barrel)
        const breechGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.15, 16);
        this.components.breech = new THREE.Mesh(breechGeo, metalMat);
        this.components.breech.rotation.x = -Math.PI / 2;
        this.components.breech.position.set(0, 0.02, 0.08);
        this.mesh.add(this.components.breech);
        
        // Flintlock mechanism (hammer, frizzen, pan)
        const lockGroup = new THREE.Group();
        
        // Hammer (cock)
        const hammerGeo = new THREE.BoxGeometry(0.02, 0.08, 0.03);
        this.components.hammer = new THREE.Mesh(hammerGeo, darkMat);
        this.components.hammer.position.set(0, 0.06, 0);
        this.components.hammer.rotation.z = -0.3; // Half-cocked position
        lockGroup.add(this.components.hammer);
        
        // Hammer pivot/screw
        const hammerPivotGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.02, 8);
        const hammerPivot = new THREE.Mesh(hammerPivotGeo, brassMat);
        hammerPivot.rotation.x = Math.PI / 2;
        hammerPivot.position.set(0, 0.02, 0);
        lockGroup.add(hammerPivot);
        
        // Frizzen (steel cover)
        const frizzenGeo = new THREE.BoxGeometry(0.015, 0.06, 0.04);
        this.components.frizzen = new THREE.Mesh(frizzenGeo, metalMat);
        this.components.frizzen.position.set(0, 0.04, 0.05);
        this.components.frizzen.rotation.x = -0.2;
        lockGroup.add(this.components.frizzen);
        
        // Flash pan
        const panGeo = new THREE.BoxGeometry(0.025, 0.005, 0.03);
        const pan = new THREE.Mesh(panGeo, darkMat);
        pan.position.set(0, 0.03, 0.04);
        lockGroup.add(pan);
        
        // Trigger guard
        const triggerGuardGeo = new THREE.TorusGeometry(0.04, 0.005, 4, 12, Math.PI);
        const triggerGuard = new THREE.Mesh(triggerGuardGeo, metalMat);
        triggerGuard.rotation.z = Math.PI;
        triggerGuard.position.set(0, -0.08, 0.05);
        lockGroup.add(triggerGuard);
        
        // Trigger
        this.components.trigger = new THREE.Mesh(
            new THREE.BoxGeometry(0.005, 0.03, 0.01),
            metalMat
        );
        this.components.trigger.position.set(0, -0.07, 0.05);
        lockGroup.add(this.components.trigger);
        
        lockGroup.position.set(0.04, 0, 0.12);
        this.components.lock = lockGroup;
        this.mesh.add(lockGroup);
        
        // SIGHTS - Critical for iron sight aiming
        // Rear sight (notch sight on tang)
        const rearSightBase = new THREE.Mesh(
            new THREE.BoxGeometry(0.015, 0.015, 0.02),
            metalMat
        );
        rearSightBase.position.set(0, 0.08, 0.12);
        
        // Notch (actual sight)
        const notchGeo = new THREE.BoxGeometry(0.002, 0.008, 0.005);
        this.components.rearNotch = new THREE.Mesh(notchGeo, darkMat);
        this.components.rearNotch.position.set(0, 0.002, 0);
        rearSightBase.add(this.components.rearNotch);
        this.mesh.add(rearSightBase);
        
        // Front sight (post/blade at muzzle)
        const frontSightGeo = new THREE.BoxGeometry(0.003, 0.015, 0.003);
        this.components.frontSight = new THREE.Mesh(frontSightGeo, metalMat);
        this.components.frontSight.position.set(0, 0.055, -0.85);
        this.mesh.add(this.components.frontSight);
        
        // Ramrod (stored under barrel)
        const ramrodGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.8, 8);
        this.components.ramrod = new THREE.Mesh(ramrodGeo, metalMat);
        this.components.ramrod.rotation.x = -Math.PI / 2;
        this.components.ramrod.position.set(0, -0.08, -0.25);
        this.mesh.add(this.components.ramrod);
        
        // Ramrod thimbles (hold rod to barrel)
        for (let i = 0; i < 3; i++) {
            const thimble = new THREE.Mesh(
                new THREE.TorusGeometry(0.012, 0.003, 4, 12),
                metalMat
            );
            thimble.rotation.y = Math.PI / 2;
            thimble.position.set(0, -0.04, -0.1 - (i * 0.25));
            this.mesh.add(thimble);
        }
        
        // Buttplate
        const buttplateGeo = new THREE.BoxGeometry(0.07, 0.14, 0.015);
        const buttplate = new THREE.Mesh(buttplateGeo, metalMat);
        buttplate.position.set(0, -0.05, 0.55);
        buttplate.rotation.x = -0.1;
        this.mesh.add(buttplate);
        
        // Muzzle flash position
        this.muzzlePosition = new THREE.Vector3(0, 0.02, -0.85);
    }
    
    getMuzzleWorldPosition() {
        return this.muzzlePosition.clone().applyMatrix4(this.mesh.matrixWorld);
    }
    
    // Get direction from rear sight through front sight (for aiming)
    getAimDirection() {
        const rearPos = new THREE.Vector3(0, 0.082, 0.12);
        const frontPos = new THREE.Vector3(0, 0.055, -0.85);
        rearPos.applyMatrix4(this.mesh.matrixWorld);
        frontPos.applyMatrix4(this.mesh.matrixWorld);
        return frontPos.sub(rearPos).normalize();
    }
    
    // Set hammer position: 0=full cock, 1=half cock, 2=fired down
    setHammerState(state) {
        // Rotations for full cock (ready to fire), half cock (safety), fired (down)
        const angles = [-0.8, -0.3, 0.3];
        this.components.hammer.rotation.z = angles[state] || -0.8;
    }
    
    // Animate frizzen open/closed
    setFrizzenOpen(open) {
        this.components.frizzen.rotation.x = open ? -1.2 : -0.2;
    }
}

// Reload State Machine for Flintlock Musket
class ReloadStateMachine {
    constructor(musketModel, audioSystem) {
        this.musket = musketModel;
        this.audio = audioSystem;
        this.state = 'IDLE'; // IDLE, RELOADING_*, READY
        this.stage = 0;
        this.stageProgress = 0;
        this.totalStages = 7;
        this.stageDuration = 2800; // ms per stage
        
        // Stage names for UI
        this.stageNames = [
            'HALF-COCK HAMMER',
            'MEASURE POWDER',
            'SET PATCH',
            'SEAT BALL',
            'RAM CHARGE',
            'PRIME PAN',
            'FULL-COCK'
        ];
    }
    
    startReload() {
        if (this.state !== 'IDLE' && this.state !== 'READY') return;
        this.state = 'RELOADING';
        this.stage = 0;
        this.stageProgress = 0;
        this.musket.setHammerState(1); // Half cock
        this.audio.playClick();
    }
    
    update(dt) {
        if (this.state !== 'RELOADING') return;
        
        this.stageProgress += dt;
        const progress = Math.min(this.stageProgress / this.stageDuration, 1);
        
        // Animate current stage
        this.animateStage(this.stage, progress);
        
        if (progress >= 1) {
            this.stage++;
            this.stageProgress = 0;
            this.audio.playMechanical();
            
            if (this.stage >= this.totalStages) {
                this.state = 'READY';
                this.musket.setHammerState(0); // Full cock
                this.audio.playCock();
            }
        }
    }
    
    animateStage(stage, progress) {
        const musket = this.musket;
        const ease = t => t < 0.5 ? 2*t*t : -1 + (4-2*t)*t; // Ease in-out
        const p = ease(progress);
        
        switch(stage) {
            case 0: // Half-cock hammer - already set, brief pause
                break;
                
            case 1: // Measure powder - musket tilts
                musket.mesh.rotation.z = THREE.MathUtils.lerp(0, 0.5, Math.sin(p * Math.PI));
                break;
                
            case 2: // Set patch - muzzle up
                musket.mesh.rotation.x = THREE.MathUtils.lerp(0, -0.3, Math.sin(p * Math.PI));
                musket.mesh.rotation.z = 0;
                break;
                
            case 3: // Seat ball - ramrod motion simulation (offset from stored position)
                musket.components.ramrod.position.y = THREE.MathUtils.lerp(
                    -0.08, -0.02, Math.sin(p * Math.PI * 2) > 0 ? Math.sin(p * Math.PI * 2) : 0
                );
                break;
                
            case 4: // Ram charge - more ramrod motion
                musket.components.ramrod.position.y = THREE.MathUtils.lerp(
                    -0.08, -0.02, Math.sin(p * Math.PI * 3) > 0 ? Math.sin(p * Math.PI * 3) : 0
                );
                musket.mesh.rotation.x = 0;
                break;
                
            case 5: // Prime pan - frizzen opens, tilt to access
                musket.setFrizzenOpen(true);
                musket.mesh.rotation.z = THREE.MathUtils.lerp(0, -0.2, Math.sin(p * Math.PI));
                break;
                
            case 6: // Full cock - close frizzen, set hammer
                musket.setFrizzenOpen(false);
                musket.mesh.rotation.z = 0;
                const hammerProgress = p < 0.5 ? p * 2 : 1;
                musket.setHammerState(THREE.MathUtils.lerp(1, 0, hammerProgress));
                break;
        }
        
        // Reset ramrod position when not in ram stages
        if (stage !== 3 && stage !== 4) {
            musket.components.ramrod.position.y = THREE.MathUtils.lerp(musket.components.ramrod.position.y, -0.08, 0.1);
        }
    }
    
    getProgress() {
        if (this.state !== 'RELOADING') return this.state === 'READY' ? 1 : 0;
        return (this.stage + (this.stageProgress / this.stageDuration)) / this.totalStages;
    }
    
    getCurrentStageName() {
        if (this.state === 'IDLE') return 'UNLOADED';
        if (this.state === 'READY') return 'READY TO FIRE';
        return this.stageNames[this.stage] || 'RELOADING';
    }
    
    canFire() {
        return this.state === 'READY';
    }
    
    fire() {
        if (this.state === 'READY') {
            this.state = 'IDLE';
            this.musket.setHammerState(2); // Hammer falls
            return true;
        }
        return false;
    }
}

// Muzzle flash effect
class MuzzleFlash {
    constructor(scene) {
        this.mesh = new THREE.Group();
        
        // Main flash cone
        const flashGeo = new THREE.ConeGeometry(0.05, 0.3, 8);
        const flashMat = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00, 
            transparent: true,
            opacity: 0.9
        });
        this.flash = new THREE.Mesh(flashGeo, flashMat);
        this.flash.rotation.x = -Math.PI / 2;
        this.mesh.add(this.flash);
        
        // Smoke puff
        const smokeGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const smokeMat = new THREE.MeshBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.5
        });
        this.smoke = new THREE.Mesh(smokeGeo, smokeMat);
        this.mesh.add(this.smoke);
        
        this.mesh.visible = false;
        scene.add(this.mesh);
        
        this.active = false;
        this.timer = 0;
        this.duration = 150; // ms
    }
    
    trigger(position, direction) {
        this.mesh.position.copy(position);
        this.mesh.lookAt(position.clone().add(direction));
        this.mesh.visible = true;
        this.active = true;
        this.timer = 0;
        
        // Random flash variation
        this.flash.scale.setScalar(0.8 + Math.random() * 0.4);
        this.flash.rotation.z = Math.random() * Math.PI * 2;
    }
    
    update(dt) {
        if (!this.active) return;
        
        this.timer += dt;
        const progress = this.timer / this.duration;
        
        if (progress >= 1) {
            this.active = false;
            this.mesh.visible = false;
            return;
        }
        
        // Fade out
        this.flash.material.opacity = 0.9 * (1 - progress);
        this.smoke.material.opacity = 0.5 * (1 - progress);
        this.smoke.scale.setScalar(1 + progress * 2);
    }
}
