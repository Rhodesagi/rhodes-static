// Musket class - handles musket model, reload process, aiming, firing

class Musket {
    constructor(scene, camera, playerNumber) {
        this.scene = scene;
        this.camera = camera;
        this.playerNumber = playerNumber;
        
        // Musket state
        this.loaded = true;
        this.isReloading = false;
        this.reloadStep = 0;
        this.reloadSteps = 5;
        this.reloadTimePerStep = 1.0; // seconds
        this.reloadTimer = 0;
        this.justFired = false;
        
        // Aiming
        this.isAiming = false;
        this.aimOffset = new THREE.Vector3(0.1, -0.1, -0.3);
        this.hipOffset = new THREE.Vector3(0.5, -0.3, -0.8);
        
        // Turning with Q/E
        this.turnAngle = 0;
        this.maxTurnAngle = Math.PI / 6; // 30 degrees
        this.turnSpeed = 3.0; // radians per second
        
        // Create musket model
        this.createModel();
        
        // Position musket
        this.updatePosition();
    }
    
    createModel() {
        // Group to hold all musket parts
        this.musketGroup = new THREE.Group();
        this.scene.add(this.musketGroup);
        
        // Stock (wooden part)
        const stockGeometry = new THREE.BoxGeometry(0.1, 0.15, 1.2);
        const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        this.stock = new THREE.Mesh(stockGeometry, stockMaterial);
        this.stock.position.set(0, 0, 0.6);
        this.musketGroup.add(this.stock);
        
        // Barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8);
        const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        this.barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        this.barrel.rotation.x = Math.PI / 2;
        this.barrel.position.set(0, 0, 1.0);
        this.musketGroup.add(this.barrel);
        
        // Flintlock mechanism
        const lockGeometry = new THREE.BoxGeometry(0.08, 0.05, 0.1);
        const lockMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
        this.lock = new THREE.Mesh(lockGeometry, lockMaterial);
        this.lock.position.set(0.05, 0, 0.3);
        this.musketGroup.add(this.lock);
        
        // Hammer (cock)
        const hammerGeometry = new THREE.BoxGeometry(0.04, 0.08, 0.04);
        const hammerMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
        this.hammer = new THREE.Mesh(hammerGeometry, hammerMaterial);
        this.hammer.position.set(0.07, 0.02, 0.3);
        this.musketGroup.add(this.hammer);
        
        // Iron sights
        this.createIronSights();
        
        // Set initial rotation
        this.musketGroup.rotation.order = 'YXZ';
    }
    
    createIronSights() {
        // Rear sight (notch)
        const rearSightGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.01);
        const rearSightMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.rearSight = new THREE.Mesh(rearSightGeometry, rearSightMaterial);
        this.rearSight.position.set(0, 0.02, 1.1);
        this.musketGroup.add(this.rearSight);
        
        // Front sight (blade)
        const frontSightGeometry = new THREE.BoxGeometry(0.01, 0.03, 0.01);
        const frontSightMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.frontSight = new THREE.Mesh(frontSightGeometry, frontSightMaterial);
        this.frontSight.position.set(0, 0.02, 1.5);
        this.musketGroup.add(this.frontSight);
        
        // Initially hide sights (only visible when aiming)
        this.rearSight.visible = false;
        this.frontSight.visible = false;
    }
    
    updatePosition() {
        if (!this.musketGroup) return;
        
        // Position relative to camera
        const offset = this.isAiming ? this.aimOffset : this.hipOffset;
        
        // Apply turn angle rotation around Y axis
        this.musketGroup.rotation.y = this.turnAngle;
        
        // Position musket in front of camera
        const cameraWorldPosition = new THREE.Vector3();
        const cameraWorldQuaternion = new THREE.Quaternion();
        
        this.camera.getWorldPosition(cameraWorldPosition);
        this.camera.getWorldQuaternion(cameraWorldQuaternion);
        
        // Calculate offset position
        const offsetPosition = new THREE.Vector3(offset.x, offset.y, offset.z);
        offsetPosition.applyQuaternion(cameraWorldQuaternion);
        
        this.musketGroup.position.copy(cameraWorldPosition).add(offsetPosition);
        
        // Align musket with camera rotation (plus turn angle)
        this.musketGroup.quaternion.copy(cameraWorldQuaternion);
        this.musketGroup.rotateY(this.turnAngle);
    }
    
    setAiming(aiming) {
        this.isAiming = aiming;
        this.rearSight.visible = aiming;
        this.frontSight.visible = aiming;
        this.updatePosition();
    }
    
    update(delta, keys) {
        // Handle Q/E turning
        const turnLeftKey = this.playerNumber === 1 ? 'KeyQ' : 'KeyN';
        const turnRightKey = this.playerNumber === 1 ? 'KeyE' : 'KeyM';
        
        if (keys[turnLeftKey]) {
            this.turnAngle = Math.max(-this.maxTurnAngle, this.turnAngle - this.turnSpeed * delta);
        } else if (keys[turnRightKey]) {
            this.turnAngle = Math.min(this.maxTurnAngle, this.turnAngle + this.turnSpeed * delta);
        } else {
            // Return to center slowly
            if (this.turnAngle > 0) {
                this.turnAngle = Math.max(0, this.turnAngle - this.turnSpeed * delta * 0.5);
            } else if (this.turnAngle < 0) {
                this.turnAngle = Math.min(0, this.turnAngle + this.turnSpeed * delta * 0.5);
            }
        }
        
        // Update reload if in progress
        if (this.isReloading) {
            this.reloadTimer += delta;
            
            // Check if current step is complete
            if (this.reloadTimer >= this.reloadTimePerStep) {
                this.reloadTimer = 0;
                this.reloadStep++;
                
                // Update musket model for current reload step
                this.updateReloadAnimation();
                
                // Check if reload complete
                if (this.reloadStep >= this.reloadSteps) {
                    this.finishReload();
                }
            }
        }
        
        // Update musket position
        this.updatePosition();
    }
    
    fire() {
        if (!this.loaded || this.isReloading) return;
        
        this.loaded = false;
        this.justFired = true;
        
        // Animate hammer strike
        this.hammer.rotation.x = -Math.PI / 4;
        
        // Reset hammer after delay
        setTimeout(() => {
            this.hammer.rotation.x = 0;
        }, 200);
        
        // Muzzle flash effect (simplified)
        const flashGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(this.frontSight.position).add(new THREE.Vector3(0, 0, 0.1));
        this.musketGroup.add(flash);
        
        setTimeout(() => {
            this.musketGroup.remove(flash);
        }, 100);
        
        console.log(`Player ${this.playerNumber} fired!`);
    }
    
    startReload() {
        if (this.loaded || this.isReloading) return;
        
        this.isReloading = true;
        this.reloadStep = 1;
        this.reloadTimer = 0;
        
        console.log(`Player ${this.playerNumber} started reloading`);
        this.updateReloadAnimation();
    }
    
    updateReloadAnimation() {
        // Animate musket based on current reload step
        switch(this.reloadStep) {
            case 1: // Half-cock hammer (safety)
                this.hammer.rotation.x = -Math.PI / 8;
                break;
            case 2: // Pour powder (tilt musket)
                this.musketGroup.rotation.x = Math.PI / 6;
                break;
            case 3: // Ram ball (vertical movement)
                // Simple animation - move ramrod visual
                break;
            case 4: // Prime pan (hammer back to half-cock)
                this.hammer.rotation.x = -Math.PI / 4;
                this.musketGroup.rotation.x = 0;
                break;
            case 5: // Full-cock and ready
                this.hammer.rotation.x = -Math.PI / 2;
                break;
        }
    }
    
    finishReload() {
        this.isReloading = false;
        this.reloadStep = 0;
        this.loaded = true;
        
        // Reset musket rotation
        this.musketGroup.rotation.x = 0;
        
        console.log(`Player ${this.playerNumber} reload complete`);
    }
    
    // For debugging
    getStatus() {
        return {
            loaded: this.loaded,
            isReloading: this.isReloading,
            reloadStep: this.reloadStep,
            isAiming: this.isAiming,
            turnAngle: this.turnAngle
        };
    }
}