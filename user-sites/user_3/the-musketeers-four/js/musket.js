/**
 * Musket.js - Authentic flintlock musket mechanics
 * Full reload animation sequence, iron sights, no crosshairs
 */

class Musket {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.mesh = null;
        this.ramrod = null;
        this.sightTilt = 0; // For Q/E adjustment
        
        // Reload states
        this.RELOAD_STATES = {
            READY: 'Ready',
            EMPTY: 'Empty',
            HALF_COCK: 'Half-cock...',
            POWDER: 'Pouring powder...',
            PATCH: 'Adding patch...',
            RAM: 'Ramming...',
            FULL_COCK: 'Full-cock...'
        };
        
        this.state = this.RELOAD_STATES.READY;
        this.loaded = true;
        this.aiming = false;
        
        // Animation timing
        this.reloadProgress = 0;
        this.currentReloadStage = 0;
        this.reloadStages = [
            { state: this.RELOAD_STATES.HALF_COCK, duration: 0.8 },
            { state: this.RELOAD_STATES.POWDER, duration: 1.0 },
            { state: this.RELOAD_STATES.PATCH, duration: 0.8 },
            { state: this.RELOAD_STATES.RAM, duration: 1.5 },
            { state: this.RELOAD_STATES.FULL_COCK, duration: 0.6 }
        ];
        
        this.createMusketModel();
    }
    
    createMusketModel() {
        // Musket group attached to camera
        this.mesh = new THREE.Group();
        
        // Main barrel (Brown Bess style)
        const barrelGeo = new THREE.CylinderGeometry(0.015, 0.02, 1.2, 12);
        const barrelMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.4,
            metalness: 0.8
        });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.4;
        barrel.position.y = -0.15;
        this.mesh.add(barrel);
        
        // Stock (wood)
        const stockGeo = new THREE.BoxGeometry(0.08, 0.12, 0.8);
        const stockMat = new THREE.MeshStandardMaterial({ 
            color: 0x4a3728,
            roughness: 0.8
        });
        const stock = new THREE.Mesh(stockGeo, stockMat);
        stock.position.z = 0.3;
        stock.position.y = -0.2;
        this.mesh.add(stock);
        
        // Rear sight (notch)
        const rearSightGeo = new THREE.BoxGeometry(0.02, 0.015, 0.01);
        const sightMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        const rearSight = new THREE.Mesh(rearSightGeo, sightMat);
        rearSight.position.set(0, -0.08, 0.15);
        this.mesh.add(rearSight);
        
        // Front sight post
        const frontSightGeo = new THREE.BoxGeometry(0.008, 0.025, 0.008);
        const frontSight = new THREE.Mesh(frontSightGeo, sightMat);
        frontSight.position.set(0, -0.07, -0.95);
        this.mesh.add(frontSight);
        
        // Flintlock mechanism
        const lockGeo = new THREE.BoxGeometry(0.03, 0.08, 0.06);
        const lockMat = new THREE.MeshStandardMaterial({ 
            color: 0x3a3a3a,
            metalness: 0.7,
            roughness: 0.5
        });
        const lock = new THREE.Mesh(lockGeo, lockMat);
        lock.position.set(0.05, -0.12, 0.1);
        this.mesh.add(lock);
        
        // Frizzen (hammer)
        const frizzenGeo = new THREE.BoxGeometry(0.02, 0.06, 0.03);
        this.frizzen = new THREE.Mesh(frizzenGeo, lockMat);
        this.frizzen.position.set(0.05, -0.05, 0.08);
        this.frizzen.rotation.z = -0.3;
        this.mesh.add(this.frizzen);
        
        // Ramrod (animated during reload)
        const ramrodGeo = new THREE.CylinderGeometry(0.004, 0.004, 1.0, 8);
        const ramrodMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a });
        this.ramrod = new THREE.Mesh(ramrodGeo, ramrodMat);
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrod.position.set(0.06, -0.25, 0.2);
        this.mesh.add(this.ramrod);
        
        // Initial position (hip fire)
        this.updatePosition();
        this.camera.add(this.mesh);
    }
    
    updatePosition() {
        if (this.aiming) {
            // Iron sights view - aligned for aiming
            this.mesh.position.set(0, -0.08, 0.25);
            this.mesh.rotation.set(0, 0, this.sightTilt);
        } else {
            // Hip position
            this.mesh.position.set(0.2, -0.3, 0.4);
            this.mesh.rotation.set(0.1, -0.1, this.sightTilt);
        }
    }
    
    toggleAim() {
        this.aiming = !this.aiming;
        this.updatePosition();
        return this.aiming;
    }
    
    adjustSight(delta) {
        // Q/E adjusts tilt for range compensation
        this.sightTilt += delta;
        this.sightTilt = Math.max(-0.15, Math.min(0.15, this.sightTilt));
        this.updatePosition();
    }
    
    fire() {
        if (!this.loaded || this.state !== this.RELOAD_STATES.READY) {
            return null;
        }
        
        // Animate flintlock
        this.frizzen.rotation.z = 0.2;
        setTimeout(() => {
            this.frizzen.rotation.z = -0.3;
        }, 100);
        
        // Calculate muzzle position and direction
        const muzzlePos = new THREE.Vector3(0, -0.15, -1.0);
        muzzlePos.applyMatrix4(this.mesh.matrixWorld);
        
        // Direction from camera through sights
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        
        // Add slight dispersion
        direction.x += (Math.random() - 0.5) * 0.02;
        direction.y += (Math.random() - 0.5) * 0.02;
        direction.normalize();
        
        this.loaded = false;
        this.state = this.RELOAD_STATES.EMPTY;
        
        // Muzzle flash
        this.createMuzzleFlash(muzzlePos);
        
        return { position: muzzlePos, direction: direction };
    }
    
    createMuzzleFlash(position) {
        const flashGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00,
            transparent: true,
            opacity: 0.9
        });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.copy(position);
        this.scene.add(flash);
        
        // Smoke
        const smokeGeo = new THREE.SphereGeometry(0.1, 6, 6);
        const smokeMat = new THREE.MeshBasicMaterial({
            color: 0x555555,
            transparent: true,
            opacity: 0.5
        });
        const smoke = new THREE.Mesh(smokeGeo, smokeMat);
        smoke.position.copy(position);
        this.scene.add(smoke);
        
        // Animate flash fade
        let age = 0;
        const animate = () => {
            age += 0.016;
            if (age > 0.1) {
                this.scene.remove(flash);
            } else {
                flashMat.opacity = 0.9 * (1 - age / 0.1);
            }
            
            if (age > 1.0) {
                this.scene.remove(smoke);
                return;
            }
            smoke.scale.multiplyScalar(1.02);
            smokeMat.opacity = 0.5 * (1 - age);
            smoke.position.y += 0.01;
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    startReload() {
        if (this.loaded || this.state !== this.RELOAD_STATES.EMPTY) {
            return false;
        }
        
        this.currentReloadStage = 0;
        this.reloadProgress = 0;
        this.state = this.reloadStages[0].state;
        return true;
    }
    
    updateReload(deltaTime) {
        if (this.loaded || this.currentReloadStage >= this.reloadStages.length) {
            return;
        }
        
        const stage = this.reloadStages[this.currentReloadStage];
        this.reloadProgress += deltaTime;
        
        // Animate ramrod during RAM stage
        if (stage.state === this.RELOAD_STATES.RAM && this.ramrod) {
            const ramProgress = Math.min(this.reloadProgress / stage.duration, 1);
            // Ramrod moves forward then back
            if (ramProgress < 0.5) {
                this.ramrod.position.z = 0.2 - (ramProgress * 2 * 0.8);
            } else {
                this.ramrod.position.z = -0.6 + ((ramProgress - 0.5) * 2 * 0.8);
            }
        }
        
        if (this.reloadProgress >= stage.duration) {
            this.currentReloadStage++;
            this.reloadProgress = 0;
            
            if (this.currentReloadStage < this.reloadStages.length) {
                this.state = this.reloadStages[this.currentReloadStage].state;
            } else {
                this.state = this.RELOAD_STATES.READY;
                this.loaded = true;
                // Reset ramrod
                if (this.ramrod) {
                    this.ramrod.position.z = 0.2;
                }
            }
        }
    }
    
    getState() {
        return {
            state: this.state,
            loaded: this.loaded,
            aiming: this.aiming,
            progress: this.currentReloadStage < this.reloadStages.length ? 
                this.reloadProgress / this.reloadStages[this.currentReloadStage].duration : 1
        };
    }
}