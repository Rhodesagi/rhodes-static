class Musket {
    constructor(player) {
        this.player = player;
        this.loaded = true;
        this.ammo = 1; // single shot
        this.reloadState = 'ready'; // ready, lowering, powder, bullet, ramming, priming, raising
        this.reloadProgress = 0;
        this.reloadTotalTime = 5; // seconds for full reload
        this.aimFov = 30;
        this.normalFov = 75;
        this.tiltAngle = 0;
        
        // Create 3D model
        this.group = new THREE.Group();
        this.buildModel();
        
        // Attach to player camera (will be handled in game.js)
        this.offset = new THREE.Vector3(0.3, -0.2, -0.5);
        
        // Iron sight alignment
        this.sightPosition = new THREE.Vector3(0, 0.05, -0.7);
        
        // Muzzle position for bullet spawn
        this.muzzlePosition = new THREE.Vector3(0, 0.1, -1);
    }
    
    buildModel() {
        const brown = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const black = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const metal = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
        const gold = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
        
        // Stock (wooden part)
        const stockGeom = new THREE.BoxGeometry(0.1, 0.15, 1);
        this.stock = new THREE.Mesh(stockGeom, brown);
        this.stock.position.set(0, 0, -0.5);
        this.group.add(this.stock);
        
        // Barrel (long cylinder)
        const barrelGeom = new THREE.CylinderGeometry(0.03, 0.03, 1, 8);
        this.barrel = new THREE.Mesh(barrelGeom, metal);
        this.barrel.position.set(0, 0.05, -0.5);
        this.barrel.rotation.x = Math.PI / 2;
        this.group.add(this.barrel);
        
        // Hammer (flintlock)
        const hammerGeom = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        this.hammer = new THREE.Mesh(hammerGeom, black);
        this.hammer.position.set(0.05, 0.1, -0.2);
        this.group.add(this.hammer);
        
        // Trigger
        const triggerGeom = new THREE.BoxGeometry(0.02, 0.05, 0.02);
        this.trigger = new THREE.Mesh(triggerGeom, black);
        this.trigger.position.set(0.05, -0.05, -0.1);
        this.group.add(this.trigger);
        
        // Iron sights (front and rear)
        const frontSightGeom = new THREE.BoxGeometry(0.01, 0.05, 0.01);
        this.frontSight = new THREE.Mesh(frontSightGeom, metal);
        this.frontSight.position.set(0, 0.08, -0.95);
        this.group.add(this.frontSight);
        
        const rearSightGeom = new THREE.BoxGeometry(0.02, 0.03, 0.01);
        this.rearSight = new THREE.Mesh(rearSightGeom, metal);
        this.rearSight.position.set(0, 0.07, -0.3);
        this.group.add(this.rearSight);
        
        // Ramrod (hanging under barrel)
        const ramrodGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.8, 6);
        this.ramrod = new THREE.Mesh(ramrodGeom, metal);
        this.ramrod.position.set(0, -0.1, -0.5);
        this.group.add(this.ramrod);
        
        // Powder horn (side)
        const hornGeom = new THREE.ConeGeometry(0.04, 0.1, 8);
        this.horn = new THREE.Mesh(hornGeom, gold);
        this.horn.position.set(-0.1, 0, -0.3);
        this.horn.rotation.z = Math.PI / 2;
        this.group.add(this.horn);
    }
    
    update(deltaTime) {
        // Update position relative to player camera
        const camera = this.player.id === 1 ? camera1 : camera2;
        this.group.position.copy(camera.position);
        this.group.rotation.copy(camera.rotation);
        
        // Apply offset and tilt
        this.group.translateX(this.offset.x);
        this.group.translateY(this.offset.y);
        this.group.translateZ(this.offset.z);
        
        // Apply musket tilt (up/down)
        this.group.rotateX(this.player.tiltAngle);
        
        // Aiming: adjust FOV and position
        if (this.player.isAiming) {
            // Move musket closer to center for iron sight view
            this.group.position.y += 0.05;
            this.group.position.z += 0.1;
            // Camera FOV adjusted in game.js
        }
        
        // Reload animation
        if (this.player.isReloading) {
            this.updateReload(deltaTime);
        }
    }
    
    updateReload(deltaTime) {
        this.reloadProgress += deltaTime;
        const phaseDuration = this.reloadTotalTime / 6;
        const phase = Math.floor(this.reloadProgress / phaseDuration);
        
        switch (phase) {
            case 0: // lowering musket
                this.group.rotation.x += deltaTime * 0.5;
                this.group.position.y -= deltaTime * 0.2;
                break;
            case 1: // pouring powder
                // animate horn
                this.horn.rotation.z += deltaTime * 3;
                break;
            case 2: // inserting bullet
                // bullet appear at muzzle
                break;
            case 3: // ramming with ramrod
                this.ramrod.position.z += deltaTime * 0.5;
                if (this.ramrod.position.z > -0.1) this.ramrod.position.z = -0.1;
                break;
            case 4: // priming pan
                this.hammer.rotation.x += deltaTime * 2;
                break;
            case 5: // raising musket
                this.group.rotation.x -= deltaTime * 0.5;
                this.group.position.y += deltaTime * 0.2;
                break;
        }
        
        if (this.reloadProgress >= this.reloadTotalTime) {
            this.finishReload();
        }
    }
    
    startReload() {
        if (this.player.isReloading || this.loaded) return;
        this.player.isReloading = true;
        this.reloadState = 'lowering';
        this.reloadProgress = 0;
        document.getElementById(`p${this.player.id}-status`).textContent = 'Reloading...';
    }
    
    finishReload() {
        this.player.isReloading = false;
        this.loaded = true;
        this.ammo = 1;
        this.reloadState = 'ready';
        document.getElementById(`p${this.player.id}-status`).textContent = 'Loaded';
    }
    
    fire() {
        if (!this.loaded || this.player.isReloading) return false;
        this.loaded = false;
        this.ammo = 0;
        // Trigger hammer animation
        this.hammer.rotation.x = Math.PI / 4;
        setTimeout(() => { this.hammer.rotation.x = 0; }, 200);
        
        // Fire bullet
        fireBullet(this.player, this);
        
        // Update status
        document.getElementById(`p${this.player.id}-status`).textContent = 'Empty';
        return true;
    }
    
    getMuzzlePosition() {
        const worldPos = new THREE.Vector3();
        this.group.localToWorld(worldPos.copy(this.muzzlePosition));
        return worldPos;
    }
}