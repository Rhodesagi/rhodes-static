import * as THREE from 'https://esm.sh/three@0.160.0';
import { playSound } from './game.js';

export class Musket {
    constructor(scene) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        this.loaded = true;
        this.isReloading = false;
        this.reloadState = 0;
        this.reloadTimer = 0;
        this.hammerCocked = true;
        
        // Reload stage durations (seconds)
        this.reloadStages = [
            { name: 'Prime Pan', duration: 0.8 },
            { name: 'Pour Powder', duration: 1.0 },
            { name: 'Patch Ball', duration: 1.2 },
            { name: 'Ramrod', duration: 1.5 },
            { name: 'Cock Flint', duration: 0.7 }
        ];
        
        this.buildProceduralMusket();
        scene.add(this.mesh);
        
        // Animation parts
        this.ramrodVisible = false;
        this.hammerAngle = 0;
        this.panOpen = false;
    }
    
    buildProceduralMusket() {
        const woodMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a3728,
            roughness: 0.8 
        });
        const metalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x555555,
            roughness: 0.3,
            metalness: 0.8
        });
        const brassMaterial = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            roughness: 0.3,
            metalness: 0.7
        });
        
        // Main stock
        const stockGeo = new THREE.BoxGeometry(0.12, 0.15, 1.2);
        // Taper the stock
        const positions = stockGeo.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const z = positions.getZ(i);
            if (z > 0.3) {
                // Barrel area - thinner
                positions.setY(i, positions.getY(i) * 0.6);
            }
            if (z < -0.4) {
                // Butt area - wider
                positions.setY(i, positions.getY(i) * 1.3);
                positions.setX(i, positions.getX(i) * 1.2);
            }
        }
        stockGeo.computeVertexNormals();
        const stock = new THREE.Mesh(stockGeo, woodMaterial);
        stock.position.set(0.25, -0.15, 0);
        this.mesh.add(stock);
        
        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.04, 0.045, 1.0, 12);
        const barrel = new THREE.Mesh(barrelGeo, metalMaterial);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0.25, 0, 0.5);
        this.mesh.add(barrel);
        
        // Barrel bands
        for (let i = 0; i < 3; i++) {
            const band = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12),
                brassMaterial
            );
            band.rotation.x = Math.PI / 2;
            band.position.set(0.25, 0, 0.3 + i * 0.35);
            this.mesh.add(band);
        }
        
        // Lock mechanism (flintlock)
        const lockPlate = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.12, 0.25),
            metalMaterial
        );
        lockPlate.position.set(0.32, -0.05, 0.2);
        this.mesh.add(lockPlate);
        
        // Hammer (cock)
        this.hammer = new THREE.Group();
        const hammerBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.15),
            metalMaterial
        );
        const hammerHead = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.08, 0.06),
            metalMaterial
        );
        hammerHead.position.set(0, 0.1, 0.03);
        this.hammer.add(hammerBase);
        this.hammer.add(hammerHead);
        this.hammer.position.set(0.35, 0, 0.15);
        this.mesh.add(this.hammer);
        
        // Frizzen (pan cover)
        this.frizzen = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.08, 0.1),
            metalMaterial
        );
        this.frizzen.position.set(0.35, -0.02, 0.25);
        this.mesh.add(this.frizzen);
        
        // Pan
        const pan = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.02, 0.08),
            metalMaterial
        );
        pan.position.set(0.35, -0.06, 0.25);
        this.mesh.add(pan);
        
        // Trigger guard
        const triggerGuard = new THREE.Mesh(
            new THREE.TorusGeometry(0.06, 0.01, 4, 8, Math.PI),
            metalMaterial
        );
        triggerGuard.rotation.z = Math.PI;
        triggerGuard.position.set(0.25, -0.22, -0.1);
        this.mesh.add(triggerGuard);
        
        // Trigger
        this.trigger = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.08, 0.02),
            metalMaterial
        );
        this.trigger.position.set(0.25, -0.18, -0.1);
        this.trigger.rotation.x = 0.3;
        this.mesh.add(this.trigger);
        
        // Ramrod (under barrel)
        this.ramrod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 1.0, 8),
            woodMaterial
        );
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrod.position.set(0.25, -0.08, 0.5);
        this.ramrod.visible = false;
        this.mesh.add(this.ramrod);
        
        // Ramrod thimbles
        for (let i = 0; i < 3; i++) {
            const thimble = new THREE.Mesh(
                new THREE.TorusGeometry(0.025, 0.005, 4, 8),
                metalMaterial
            );
            thimble.rotation.y = Math.PI / 2;
            thimble.position.set(0.25, -0.08, 0.4 + i * 0.3);
            this.mesh.add(thimble);
        }
        
        // Iron sights
        const frontSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.005, 0.04, 0.01),
            metalMaterial
        );
        frontSight.position.set(0.25, 0.06, 0.95);
        this.mesh.add(frontSight);
        
        const rearSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.03, 0.01),
            metalMaterial
        );
        rearSight.position.set(0.25, 0.04, 0.35);
        this.mesh.add(rearSight);
        
        // Initial hammer position (cocked)
        this.updateHammer();
    }
    
    updateHammer() {
        if (this.hammerCocked) {
            this.hammer.rotation.z = -0.5;
        } else {
            this.hammer.rotation.z = 0.3;
        }
    }
    
    fire() {
        if (!this.loaded || !this.hammerCocked) return;
        
        this.loaded = false;
        this.hammerCocked = false;
        this.updateHammer();
        
        // Animate hammer falling
        this.animateHammerFall();
        
        playSound('fire');
    }
    
    animateHammerFall() {
        let progress = 0;
        const duration = 100; // ms
        const start = performance.now();
        
        const animate = () => {
            const elapsed = performance.now() - start;
            progress = Math.min(elapsed / duration, 1);
            
            this.hammer.rotation.z = -0.5 + progress * 0.8;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    startReload() {
        this.isReloading = true;
        this.reloadState = 0;
        this.reloadTimer = 0;
        playSound('reload');
    }
    
    getReloadStageName() {
        if (!this.isReloading) return '';
        return this.reloadStages[this.reloadState]?.name || '';
    }
    
    update(delta, playerPos, playerRot, musketRot, isAiming) {
        // Position the musket in front of camera
        const offset = new THREE.Vector3(0.3, -0.2, -0.4);
        
        if (isAiming) {
            // Bring closer for iron sight alignment
            offset.set(0, -0.08, -0.25);
        }
        
        // Apply rotations
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRot);
        offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), musketRot);
        
        this.mesh.position.copy(playerPos).add(offset);
        
        // Apply full rotation
        const q = new THREE.Quaternion();
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), playerRot);
        const q2 = new THREE.Quaternion();
        q2.setFromAxisAngle(new THREE.Vector3(1, 0, 0), musketRot);
        this.mesh.quaternion.copy(q).multiply(q2);
        
        // Update reload animation
        if (this.isReloading) {
            this.updateReloadAnimation(delta);
        }
    }
    
    updateReloadAnimation(delta) {
        this.reloadTimer += delta;
        
        const currentStage = this.reloadStages[this.reloadState];
        
        // Animation effects based on stage
        switch(this.reloadState) {
            case 0: // Prime Pan
                this.frizzen.rotation.z = Math.min(this.reloadTimer * 2, 0.5);
                break;
            case 1: // Pour Powder
                // Slight tilt animation
                break;
            case 2: // Patch Ball
                // Hand motion (not visible but could add particle)
                break;
            case 3: // Ramrod
                this.ramrod.visible = true;
                const ramProgress = this.reloadTimer / currentStage.duration;
                this.ramrod.position.z = 0.5 + Math.sin(ramProgress * Math.PI * 4) * 0.1;
                break;
            case 4: // Cock Flint
                this.ramrod.visible = false;
                const cockProgress = this.reloadTimer / currentStage.duration;
                this.hammer.rotation.z = 0.3 - cockProgress * 0.8;
                this.frizzen.rotation.z = 0.5 - cockProgress * 0.5;
                break;
        }
        
        // Advance stage
        if (this.reloadTimer >= currentStage.duration) {
            this.reloadState++;
            this.reloadTimer = 0;
            
            if (this.reloadState >= this.reloadStages.length) {
                this.isReloading = false;
                this.loaded = true;
                this.hammerCocked = true;
                this.hammer.rotation.z = -0.5;
                this.ramrod.visible = false;
                this.frizzen.rotation.z = 0;
            }
        }
    }
}
