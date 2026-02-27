/**
 * Musket class - handles firing, ballistics, and full reload animation
 * Historically accurate Brown Bess style musket mechanics
 */

class Musket {
    constructor() {
        this.loaded = false;
        this.reloading = false;
        this.aiming = false;
        
        // Reload stages (historically accurate ~25 second reload)
        this.reloadStages = [
            { name: 'Cock Flint', duration: 1500, action: 'cock' },
            { name: 'Pour Powder', duration: 3000, action: 'powder' },
            { name: 'Place Patch', duration: 2000, action: 'patch' },
            { name: 'Seat Ball', duration: 2500, action: 'ball' },
            { name: 'Ram Cartridge', duration: 4000, action: 'ram' },
            { name: 'Prime Pan', duration: 2500, action: 'prime' },
            { name: 'Full Cock', duration: 1500, action: 'fullcock' }
        ];
        
        this.currentStage = 0;
        this.reloadProgress = 0;
        this.reloadStartTime = 0;
        
        // Ballistics
        this.muzzleVelocity = 150; // m/s (typical for smoothbore musket)
        this.ballMass = 0.01; // kg
        this.ballDiameter = 0.015; // m
        
        // Model parts for animation
        this.parts = {
            barrel: null,
            stock: null,
            lock: null,
            hammer: null,
            ramrod: null,
            sights: null
        };
    }
    
    createModel() {
        const group = new THREE.Group();
        
        // Barrel (long cylinder)
        const barrelGeo = new THREE.CylinderGeometry(0.03, 0.025, 1.4, 16);
        const barrelMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            metalness: 0.8,
            roughness: 0.3
        });
        this.parts.barrel = new THREE.Mesh(barrelGeo, barrelMat);
        this.parts.barrel.rotation.x = Math.PI / 2;
        this.parts.barrel.position.z = 0.7;
        group.add(this.parts.barrel);
        
        // Stock (wooden body)
        const stockGeo = new THREE.BoxGeometry(0.08, 0.12, 0.8);
        const stockMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.8
        });
        this.parts.stock = new THREE.Mesh(stockGeo, stockMat);
        this.parts.stock.position.y = -0.08;
        this.parts.stock.position.z = -0.1;
        group.add(this.parts.stock);
        
        // Lock mechanism
        const lockGeo = new THREE.BoxGeometry(0.04, 0.06, 0.15);
        const lockMat = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            metalness: 0.7
        });
        this.parts.lock = new THREE.Mesh(lockGeo, lockMat);
        this.parts.lock.position.set(0.05, 0.02, 0.3);
        group.add(this.parts.lock);
        
        // Hammer (cock)
        const hammerGeo = new THREE.BoxGeometry(0.02, 0.08, 0.03);
        const hammerMat = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.8
        });
        this.parts.hammer = new THREE.Mesh(hammerGeo, hammerMat);
        this.parts.hammer.position.set(0.06, 0.08, 0.25);
        group.add(this.parts.hammer);
        
        // Front sight (blade)
        const frontSightGeo = new THREE.BoxGeometry(0.005, 0.03, 0.01);
        const sightMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const frontSight = new THREE.Mesh(frontSightGeo, sightMat);
        frontSight.position.set(0, 0.035, 1.38);
        group.add(frontSight);
        
        // Rear sight (notch)
        const rearSightGeo = new THREE.BoxGeometry(0.02, 0.015, 0.01);
        const rearSight = new THREE.Mesh(rearSightGeo, sightMat);
        rearSight.position.set(0, 0.02, 0.5);
        group.add(rearSight);
        
        // Ramrod (stored under barrel)
        const ramrodGeo = new THREE.CylinderGeometry(0.003, 0.003, 1.2, 8);
        const ramrodMat = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            metalness: 0.6
        });
        this.parts.ramrod = new THREE.Mesh(ramrodGeo, ramrodMat);
        this.parts.ramrod.rotation.x = Math.PI / 2;
        this.parts.ramrod.position.set(0, -0.06, 0.5);
        group.add(this.parts.ramrod);
        
        // Trigger guard
        const guardGeo = new THREE.TorusGeometry(0.04, 0.003, 8, 16, Math.PI);
        const guardMat = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            metalness: 0.7
        });
        const guard = new THREE.Mesh(guardGeo, guardMat);
        guard.rotation.z = Math.PI;
        guard.position.set(0, -0.12, 0.15);
        group.add(guard);
        
        // Buttplate
        const buttGeo = new THREE.BoxGeometry(0.06, 0.15, 0.02);
        const buttMat = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.6
        });
        const buttplate = new THREE.Mesh(buttGeo, buttMat);
        buttplate.position.set(0, -0.05, -0.51);
        group.add(buttplate);
        
        return group;
    }
    
    fire(position, direction) {
        if (!this.loaded || this.reloading) {
            return null;
        }
        
        this.loaded = false;
        
        // Animate hammer fall
        if (this.parts.hammer) {
            this.parts.hammer.rotation.x = 0;
        }
        
        // Create musket ball
        const ballGeo = new THREE.SphereGeometry(0.008, 8, 8);
        const ballMat = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            metalness: 0.9
        });
        const ball = new THREE.Mesh(ballGeo, ballMat);
        
        // Start position at muzzle
        const muzzleOffset = direction.clone().multiplyScalar(1.4);
        ball.position.copy(position).add(muzzleOffset);
        
        // Ballistics
        const velocity = direction.clone().multiplyScalar(this.muzzleVelocity * 0.016); // per frame
        
        return {
            mesh: ball,
            velocity: velocity,
            created: Date.now(),
            gravity: new THREE.Vector3(0, -0.005, 0)
        };
    }
    
    startReload() {
        if (this.loaded || this.reloading) return false;
        
        this.reloading = true;
        this.currentStage = 0;
        this.reloadStartTime = Date.now();
        this.reloadProgress = 0;
        
        return true;
    }
    
    updateReload() {
        if (!this.reloading) return null;
        
        const now = Date.now();
        const elapsed = now - this.reloadStartTime;
        
        let stageTime = 0;
        let cumulativeTime = 0;
        
        for (let i = 0; i <= this.currentStage; i++) {
            cumulativeTime += this.reloadStages[i].duration;
        }
        
        // Check if current stage complete
        if (elapsed >= cumulativeTime) {
            this.onStageComplete(this.currentStage);
            this.currentStage++;
            
            if (this.currentStage >= this.reloadStages.length) {
                this.completeReload();
                return { complete: true };
            }
        }
        
        // Calculate progress for current stage
        const prevCumulative = cumulativeTime - this.reloadStages[this.currentStage].duration;
        const stageProgress = (elapsed - prevCumulative) / this.reloadStages[this.currentStage].duration;
        
        // Total progress
        const totalDuration = this.reloadStages.reduce((sum, s) => sum + s.duration, 0);
        this.reloadProgress = (elapsed / totalDuration) * 100;
        
        this.animateReloadStage(this.currentStage, Math.min(stageProgress, 1));
        
        return {
            stage: this.reloadStages[this.currentStage].name,
            progress: this.reloadProgress,
            stageProgress: stageProgress
        };
    }
    
    onStageComplete(stageIndex) {
        // Stage completion effects
        const stage = this.reloadStages[stageIndex];
        
        switch(stage.action) {
            case 'cock':
                if (this.parts.hammer) {
                    this.parts.hammer.rotation.x = -0.5;
                }
                break;
            case 'ram':
                // Ramrod animation
                if (this.parts.ramrod) {
                    this.parts.ramrod.position.z = 0.5;
                }
                break;
        }
    }
    
    animateReloadStage(stageIndex, progress) {
        const stage = this.reloadStages[stageIndex];
        
        switch(stage.action) {
            case 'ram':
                // Animate ramrod going into barrel
                if (this.parts.ramrod && progress < 0.8) {
                    const ramProgress = progress / 0.8;
                    this.parts.ramrod.position.z = 0.5 + ramProgress * 0.6;
                }
                break;
            case 'fullcock':
                // Hammer comes to full cock
                if (this.parts.hammer) {
                    this.parts.hammer.rotation.x = -0.8 * progress;
                }
                break;
        }
    }
    
    completeReload() {
        this.reloading = false;
        this.loaded = true;
        this.currentStage = 0;
        this.reloadProgress = 0;
        
        // Reset ramrod position
        if (this.parts.ramrod) {
            this.parts.ramrod.position.z = 0.5;
        }
    }
    
    toggleAim(aiming) {
        this.aiming = aiming;
    }
    
    getAimOffset() {
        // Return camera offset for iron sight alignment
        if (this.aiming) {
            return new THREE.Vector3(0, -0.02, 0.15);
        }
        return new THREE.Vector3(0.15, -0.1, 0.3);
    }
}
