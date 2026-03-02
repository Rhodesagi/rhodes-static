// Musket class - represents a flintlock musket with accurate reloading

class Musket {
    constructor(scene, camera, playerNum) {
        this.scene = scene;
        this.camera = camera;
        this.playerNum = playerNum;
        
        // Musket state
        this.loaded = false;
        this.aiming = false;
        this.reloading = false;
        this.reloadStep = 0; // 0-5
        this.reloadProgress = 0; // 0-1 per step
        
        // Musket parts
        this.group = new THREE.Group();
        this.createModel();
        
        // Position relative to camera
        this.group.position.set(0.5, -0.3, -1);
        this.group.rotation.set(0, 0, 0);
        this.camera.add(this.group);
        
        // Iron sight reference point
        this.sight = new THREE.Vector3(0, 0, -2);
        
        // Animation targets
        this.defaultPosition = new THREE.Vector3(0.5, -0.3, -1);
        this.aimPosition = new THREE.Vector3(0, -0.1, -0.5);
        this.defaultRotation = new THREE.Euler(0, 0, 0);
        this.aimRotation = new THREE.Euler(0, 0, 0);
        
        // Turn angle (Q/E)
        this.turnAngle = 0;
        this.maxTurn = Math.PI / 8; // 22.5 degrees
        
        // Recoil
        this.recoil = 0;
    }
    
    createModel() {
        // Barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2);
        const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.x = 0.6;
        this.group.add(barrel);
        
        // Stock (wood)
        const stockGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.8);
        const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.set(-0.3, 0, 0);
        this.group.add(stock);
        
        // Flintlock mechanism
        const lockGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.1);
        const lockMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const lock = new THREE.Mesh(lockGeometry, lockMaterial);
        lock.position.set(0.2, 0.1, 0);
        this.group.add(lock);
        
        // Hammer
        const hammerGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.05);
        const hammerMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        this.hammer = new THREE.Mesh(hammerGeometry, hammerMaterial);
        this.hammer.position.set(0.2, 0.2, 0);
        this.hammer.rotation.z = -Math.PI / 4;
        this.group.add(this.hammer);
        
        // Iron sights
        const rearSightGeometry = new THREE.BoxGeometry(0.02, 0.05, 0.02);
        const rearSight = new THREE.Mesh(rearSightGeometry, lockMaterial);
        rearSight.position.set(1.0, 0.05, 0);
        this.group.add(rearSight);
        
        const frontSightGeometry = new THREE.BoxGeometry(0.02, 0.08, 0.02);
        const frontSight = new THREE.Mesh(frontSightGeometry, lockMaterial);
        frontSight.position.set(1.5, 0.05, 0);
        this.group.add(frontSight);
        
        // Ramrod (initially not visible)
        const ramrodGeometry = new THREE.CylinderGeometry(0.01, 0.01, 1.0);
        const ramrodMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
        this.ramrod = new THREE.Mesh(ramrodGeometry, ramrodMaterial);
        this.ramrod.rotation.z = Math.PI / 2;
        this.ramrod.position.set(0.6, -0.2, 0);
        this.ramrod.visible = false;
        this.group.add(this.ramrod);
    }
    
    update(keys, deltaTime) {
        // Handle aiming
        const aimKey = this.playerNum === 1 ? 'x' : 'm';
        if (keys[aimKey] && this.loaded && !this.reloading) {
            this.startAiming();
        } else {
            this.stopAiming();
        }
        
        // Handle turning (Q/E for player1, I/K for player2)
        const turnLeftKey = this.playerNum === 1 ? 'q' : 'i';
        const turnRightKey = this.playerNum === 1 ? 'e' : 'k';
        
        if (keys[turnLeftKey]) {
            this.turnAngle = Math.max(this.turnAngle - deltaTime * 2, -this.maxTurn);
        } else if (keys[turnRightKey]) {
            this.turnAngle = Math.min(this.turnAngle + deltaTime * 2, this.maxTurn);
        } else {
            // Return to center slowly
            if (this.turnAngle > 0) {
                this.turnAngle = Math.max(this.turnAngle - deltaTime, 0);
            } else if (this.turnAngle < 0) {
                this.turnAngle = Math.min(this.turnAngle + deltaTime, 0);
            }
        }
        
        // Apply turn
        this.group.rotation.y = this.turnAngle;
        
        // Handle reloading
        const reloadKey = this.playerNum === 1 ? 'r' : 'l';
        if (keys[reloadKey] && !this.reloading && !this.aiming) {
            this.startReload();
        }
        
        if (this.reloading) {
            this.updateReload(deltaTime);
        }
        
        // Update recoil
        if (this.recoil > 0) {
            this.recoil = Math.max(this.recoil - deltaTime * 5, 0);
            this.group.position.z = this.defaultPosition.z + this.recoil * 0.2;
        }
        
        // Smooth aiming transition
        const targetPos = this.aiming ? this.aimPosition : this.defaultPosition;
        const targetRot = this.aiming ? this.aimRotation : this.defaultRotation;
        
        this.group.position.lerp(targetPos, deltaTime * 8);
        this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, targetRot.x, deltaTime * 8);
        this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, targetRot.z, deltaTime * 8);
    }
    
    startAiming() {
        if (!this.aiming) {
            this.aiming = true;
            // Zoom camera FOV
            this.camera.fov = 40;
            this.camera.updateProjectionMatrix();
        }
    }
    
    stopAiming() {
        if (this.aiming) {
            this.aiming = false;
            this.camera.fov = 75;
            this.camera.updateProjectionMatrix();
        }
    }
    
    startReload() {
        this.reloading = true;
        this.reloadStep = 0;
        this.reloadProgress = 0;
        this.loaded = false;
        this.ramrod.visible = true;
        console.log(`Player ${this.playerNum} started reloading`);
    }
    
    updateReload(deltaTime) {
        this.reloadProgress += deltaTime * 0.5; // each step takes ~2 seconds
        
        if (this.reloadProgress >= 1) {
            this.reloadStep++;
            this.reloadProgress = 0;
            
            // Visual feedback for each step
            switch (this.reloadStep) {
                case 1: // Pour powder
                    console.log(`Player ${this.playerNum}: Pour powder`);
                    break;
                case 2: // Ram rod
                    console.log(`Player ${this.playerNum}: Ram rod`);
                    break;
                case 3: // Prime pan
                    console.log(`Player ${this.playerNum}: Prime pan`);
                    break;
                case 4: // Cock hammer
                    this.hammer.rotation.z = -Math.PI / 2;
                    console.log(`Player ${this.playerNum}: Cock hammer`);
                    break;
                case 5: // Ready
                    this.hammer.rotation.z = -Math.PI / 4;
                    this.ramrod.visible = false;
                    this.loaded = true;
                    this.reloading = false;
                    console.log(`Player ${this.playerNum}: Musket loaded!`);
                    return;
            }
        }
        
        // Animate current step
        if (this.reloadStep === 2) { // Ram rod
            this.ramrod.position.y = -0.2 + Math.sin(this.reloadProgress * Math.PI) * 0.3;
        }
    }
    
    fire() {
        if (!this.loaded || this.reloading) return false;
        
        console.log(`Player ${this.playerNum} fires!`);
        this.loaded = false;
        this.aiming = false;
        this.recoil = 1;
        
        // Reset hammer
        this.hammer.rotation.z = 0;
        
        // Play fire sound
        if (typeof playSound === 'function') {
            playSound('fire', 0.5);
        }
        
        return true;
    }
    
    getSightDirection() {
        // Returns world direction vector where musket is pointing
        const direction = new THREE.Vector3(0, 0, -1);
        this.group.localToWorld(direction);
        direction.sub(this.group.getWorldPosition(new THREE.Vector3()));
        direction.normalize();
        return direction;
    }
}
