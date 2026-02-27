/**
 * Musket Mechanics - Authentic 18th Century Flintlock Simulation
 * Complete 10-step reloading process with accurate timing
 */

const ReloadSteps = {
    READY: { name: 'Ready', duration: 0 },
    OPEN_PAN: { name: 'Opening Pan', duration: 300 },
    POUR_POWDER: { name: 'Pouring Powder', duration: 800 },
    CLOSE_PAN: { name: 'Closing Pan', duration: 200 },
    INSERT_BALL: { name: 'Inserting Ball', duration: 500 },
    RAMROD_EXTRACT: { name: 'Drawing Ramrod', duration: 400 },
    RAM_DOWN: { name: 'Ramming Home', duration: 1000 },
    RAMROD_REPLACE: { name: 'Replacing Ramrod', duration: 400 },
    HALF_COCK: { name: 'Half-Cock', duration: 300 },
    PRIME_PAN: { name: 'Priming Pan', duration: 600 },
    FULL_COCK: { name: 'Full Cock', duration: 300 }
};

const RELOAD_SEQUENCE = [
    ReloadSteps.OPEN_PAN,
    ReloadSteps.POUR_POWDER,
    ReloadSteps.CLOSE_PAN,
    ReloadSteps.INSERT_BALL,
    ReloadSteps.RAMROD_EXTRACT,
    ReloadSteps.RAM_DOWN,
    ReloadSteps.RAMROD_REPLACE,
    ReloadSteps.HALF_COCK,
    ReloadSteps.PRIME_PAN,
    ReloadSteps.FULL_COCK
];

class Musket {
    constructor(playerId) {
        this.playerId = playerId;
        this.loaded = true;
        this.reloading = false;
        this.reloadStartTime = 0;
        this.currentStepIndex = -1;
        this.aiming = false;
        this.cocked = true;
        
        // Musket visual representation
        this.mesh = null;
        this.hammerMesh = null;
        this.panMesh = null;
        this.ramrodMesh = null;
        
        // Animation states
        this.recoilAmount = 0;
        this.reloadAnimationTime = 0;
        this.hammerAngle = 0; // 0 = fired, 1 = half-cock, 2 = full-cock
        this.panOpen = false;
        this.ramrodExtended = false;
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Main barrel - dark steel
        const barrelGeo = new THREE.CylinderGeometry(0.03, 0.04, 1.2, 16);
        const barrelMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.4,
            metalness: 0.8
        });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.4;
        group.add(barrel);
        
        // Barrel bands
        for (let i = 0; i < 3; i++) {
            const bandGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.05, 16);
            const bandMat = new THREE.MeshStandardMaterial({ 
                color: 0x4a3c2a,
                roughness: 0.6,
                metalness: 0.3
            });
            const band = new THREE.Mesh(bandGeo, bandMat);
            band.rotation.x = Math.PI / 2;
            band.position.z = -0.2 - (i * 0.35);
            group.add(band);
        }
        
        // Stock - wood
        const stockGeo = new THREE.BoxGeometry(0.08, 0.12, 0.8);
        const stockMat = new THREE.MeshStandardMaterial({ 
            color: 0x4a3728,
            roughness: 0.8,
            metalness: 0.1
        });
        const stock = new THREE.Mesh(stockGeo, stockMat);
        stock.position.set(0, -0.08, 0.2);
        group.add(stock);
        
        // Butt plate
        const buttGeo = new THREE.BoxGeometry(0.1, 0.15, 0.05);
        const buttMat = new THREE.MeshStandardMaterial({ 
            color: 0x3a3020,
            roughness: 0.5,
            metalness: 0.4
        });
        const butt = new THREE.Mesh(buttGeo, buttMat);
        butt.position.set(0, -0.08, 0.65);
        group.add(butt);
        
        // Lock mechanism
        const lockGeo = new THREE.BoxGeometry(0.06, 0.1, 0.15);
        const lockMat = new THREE.MeshStandardMaterial({ 
            color: 0x3a3a3a,
            roughness: 0.4,
            metalness: 0.7
        });
        const lock = new THREE.Mesh(lockGeo, lockMat);
        lock.position.set(0.06, 0, -0.15);
        group.add(lock);
        
        // Hammer (cock)
        const hammerGeo = new THREE.BoxGeometry(0.04, 0.08, 0.02);
        const hammerMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.4,
            metalness: 0.8
        });
        this.hammerMesh = new THREE.Mesh(hammerGeo, hammerMat);
        this.hammerMesh.position.set(0.08, 0.08, -0.22);
        this.hammerMesh.geometry.translate(0, 0.04, 0);
        group.add(this.hammerMesh);
        
        // Frizzen pan
        const panGeo = new THREE.BoxGeometry(0.05, 0.02, 0.06);
        const panMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.5,
            metalness: 0.6
        });
        this.panMesh = new THREE.Mesh(panGeo, panMat);
        this.panMesh.position.set(0.06, 0.02, -0.15);
        group.add(this.panMesh);
        
        // Trigger guard
        const guardGeo = new THREE.TorusGeometry(0.04, 0.005, 8, 16, Math.PI);
        const guardMat = new THREE.MeshStandardMaterial({ 
            color: 0x3a3020,
            roughness: 0.5,
            metalness: 0.4
        });
        const guard = new THREE.Mesh(guardGeo, guardMat);
        guard.rotation.z = Math.PI;
        guard.position.set(0, -0.12, 0.05);
        group.add(guard);
        
        // Trigger
        const triggerGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.04, 8);
        const triggerMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.4,
            metalness: 0.8
        });
        const trigger = new THREE.Mesh(triggerGeo, triggerMat);
        trigger.rotation.x = Math.PI / 4;
        trigger.position.set(0, -0.1, 0.05);
        group.add(trigger);
        
        // Ramrod
        const ramrodGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.9, 8);
        const ramrodMat = new THREE.MeshStandardMaterial({ 
            color: 0x3a3020,
            roughness: 0.6,
            metalness: 0.2
        });
        this.ramrodMesh = new THREE.Mesh(ramrodGeo, ramrodMat);
        this.ramrodMesh.rotation.x = Math.PI / 2;
        this.ramrodMesh.position.set(0, -0.12, -0.3);
        group.add(this.ramrodMesh);
        
        // Front sight
        const sightGeo = new THREE.BoxGeometry(0.005, 0.02, 0.01);
        const sightMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.5,
            metalness: 0.7
        });
        const sight = new THREE.Mesh(sightGeo, sightMat);
        sight.position.set(0, 0.08, -1.0);
        group.add(sight);
        
        this.mesh = group;
        return group;
    }
    
    fire() {
        if (!this.loaded || !this.cocked || this.reloading) {
            return false; // Click - hammer falls but no shot
        }
        
        this.loaded = false;
        this.cocked = false;
        this.hammerAngle = 0;
        this.recoilAmount = 1.0;
        
        // Animate hammer falling
        if (this.hammerMesh) {
            this.hammerMesh.rotation.x = -0.5;
        }
        
        return true;
    }
    
    startReload() {
        if (this.loaded || this.reloading) return false;
        
        this.reloading = true;
        this.reloadStartTime = Date.now();
        this.currentStepIndex = 0;
        
        return true;
    }
    
    cancelReload() {
        this.reloading = false;
        this.currentStepIndex = -1;
    }
    
    update(deltaTime) {
        // Update recoil recovery
        if (this.recoilAmount > 0) {
            this.recoilAmount = Math.max(0, this.recoilAmount - deltaTime * 2);
        }
        
        // Update reload progress
        if (this.reloading) {
            const elapsed = Date.now() - this.reloadStartTime;
            let accumulatedTime = 0;
            
            for (let i = 0; i < RELOAD_SEQUENCE.length; i++) {
                const step = RELOAD_SEQUENCE[i];
                if (elapsed < accumulatedTime + step.duration) {
                    this.currentStepIndex = i;
                    
                    // Update animations based on step
                    this.updateReloadAnimation(i, (elapsed - accumulatedTime) / step.duration);
                    break;
                }
                accumulatedTime += step.duration;
            }
            
            // Check if reload complete
            const totalTime = RELOAD_SEQUENCE.reduce((sum, s) => sum + s.duration, 0);
            if (elapsed >= totalTime) {
                this.reloading = false;
                this.loaded = true;
                this.cocked = true;
                this.currentStepIndex = -1;
                this.hammerAngle = 2;
                
                // Reset positions
                if (this.hammerMesh) this.hammerMesh.rotation.x = -0.8;
                if (this.panMesh) this.panMesh.position.y = 0.02;
                if (this.ramrodMesh) {
                    this.ramrodMesh.position.set(0, -0.12, -0.3);
                    this.ramrodMesh.rotation.set(Math.PI / 2, 0, 0);
                }
            }
        }
        
        // Update visual recoil
        if (this.mesh) {
            const recoilZ = this.recoilAmount * 0.15;
            const recoilRot = this.recoilAmount * 0.3;
            this.mesh.position.z = recoilZ;
            this.mesh.rotation.x = recoilRot;
        }
    }
    
    updateReloadAnimation(stepIndex, progress) {
        if (!this.mesh) return;
        
        switch (stepIndex) {
            case 0: // Opening pan
                if (this.panMesh) {
                    this.panMesh.position.y = 0.02 + (progress * 0.02);
                }
                break;
            case 3: // Insert ball - slight muzzle movement
                this.mesh.rotation.x = Math.sin(progress * Math.PI) * 0.1;
                break;
            case 4: // Extract ramrod
                if (this.ramrodMesh) {
                    this.ramrodMesh.position.y = -0.12 + (progress * 0.15);
                    this.ramrodMesh.position.z = -0.3 + (progress * 0.4);
                }
                break;
            case 5: // Ram down - pumping motion
                if (this.ramrodMesh) {
                    const pump = Math.sin(progress * Math.PI * 3) * 0.3;
                    this.ramrodMesh.position.z = 0.1 - pump;
                }
                break;
            case 6: // Replace ramrod
                if (this.ramrodMesh) {
                    this.ramrodMesh.position.y = 0.03 - (progress * 0.15);
                    this.ramrodMesh.position.z = 0.1 - (progress * 0.4);
                }
                break;
            case 7: // Half cock
                if (this.hammerMesh) {
                    this.hammerMesh.rotation.x = -0.5 - (progress * 0.3);
                }
                break;
            case 9: // Full cock
                if (this.hammerMesh) {
                    this.hammerMesh.rotation.x = -0.8 - (progress * 0.2);
                }
                break;
        }
    }
    
    setAiming(aiming) {
        this.aiming = aiming;
    }
    
    tilt(amount) {
        // Q/E tilts the musket for aiming adjustments
        if (this.mesh) {
            this.mesh.rotation.z = amount * 0.15;
        }
    }
    
    getReloadProgress() {
        if (!this.reloading) return { active: false, progress: 0, step: null };
        
        const elapsed = Date.now() - this.reloadStartTime;
        const totalTime = RELOAD_SEQUENCE.reduce((sum, s) => sum + s.duration, 0);
        const progress = Math.min(100, (elapsed / totalTime) * 100);
        
        return {
            active: true,
            progress: progress,
            step: RELOAD_SEQUENCE[this.currentStepIndex]
        };
    }
}
