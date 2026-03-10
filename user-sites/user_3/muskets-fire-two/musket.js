class Musket {
    constructor() {
        this.loaded = false;
        this.primed = false;
        this.cocked = false;
        this.state = 'ready'; // ready, reloading, inspecting
        this.reloadAnimation = null;
        
        // Create procedural musket mesh
        this.mesh = this.createMusketMesh();
        this.mesh.visible = false; // Hidden until equipped
        
        // Iron sight configuration
        this.rearSightOffset = new THREE.Vector3(0, 0.015, -0.12);
        this.frontSightOffset = new THREE.Vector3(0, 0.018, 0.35);
    }

    createMusketMesh() {
        const musketGroup = new THREE.Group();
        
        // Materials
        const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3c2a });
        const metalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.4,
            metalness: 0.8
        });
        const brassMaterial = new THREE.MeshStandardMaterial({
            color: 0x8a7a4a,
            roughness: 0.3,
            metalness: 0.9
        });
        
        // Stock
        const stockGeo = new THREE.BoxGeometry(0.06, 0.08, 0.5);
        const stock = new THREE.Mesh(stockGeo, woodMaterial);
        stock.position.set(0, -0.05, -0.1);
        stock.rotation.x = 0.1;
        musketGroup.add(stock);
        
        // Butt plate
        const buttGeo = new THREE.BoxGeometry(0.065, 0.085, 0.02);
        const butt = new THREE.Mesh(buttGeo, metalMaterial);
        butt.position.set(0, -0.04, -0.36);
        musketGroup.add(butt);
        
        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.7, 12);
        const barrel = new THREE.Mesh(barrelGeo, metalMaterial);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0, 0.15);
        musketGroup.add(barrel);
        
        // Muzzle
        const muzzleGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.02, 12);
        const muzzle = new THREE.Mesh(muzzleGeo, metalMaterial);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, 0, 0.51);
        musketGroup.add(muzzle);
        
        // Breech
        const breechGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 12);
        const breech = new THREE.Mesh(breechGeo, metalMaterial);
        breech.rotation.x = Math.PI / 2;
        breech.position.set(0, 0, -0.2);
        musketGroup.add(breech);
        
        // Lock mechanism
        const lockPlateGeo = new THREE.BoxGeometry(0.02, 0.06, 0.1);
        const lockPlate = new THREE.Mesh(lockPlateGeo, metalMaterial);
        lockPlate.position.set(0.035, -0.02, -0.15);
        musketGroup.add(lockPlate);
        
        // Hammer (cock)
        this.hammer = new THREE.Group();
        const hammerGeo = new THREE.BoxGeometry(0.015, 0.04, 0.02);
        const hammerMesh = new THREE.Mesh(hammerGeo, metalMaterial);
        hammerMesh.position.set(0, 0.02, 0);
        this.hammer.add(hammerMesh);
        this.hammer.position.set(0.04, -0.02, -0.18);
        musketGroup.add(this.hammer);
        
        // Frizzen (pan cover)
        this.frizzen = new THREE.Group();
        const frizzenGeo = new THREE.BoxGeometry(0.018, 0.03, 0.025);
        const frizzenMesh = new THREE.Mesh(frizzenGeo, metalMaterial);
        frizzenMesh.position.set(0, 0.015, 0);
        this.frizzen.add(frizzenMesh);
        this.frizzen.position.set(0.038, -0.03, -0.14);
        musketGroup.add(this.frizzen);
        
        // Trigger guard
        const guardGeo = new THREE.TorusGeometry(0.025, 0.003, 4, 8, Math.PI);
        const guard = new THREE.Mesh(guardGeo, metalMaterial);
        guard.rotation.z = Math.PI;
        guard.position.set(0, -0.08, -0.05);
        musketGroup.add(guard);
        
        // Trigger
        const triggerGeo = new THREE.BoxGeometry(0.004, 0.02, 0.004);
        const trigger = new THREE.Mesh(triggerGeo, metalMaterial);
        trigger.position.set(0, -0.07, -0.05);
        trigger.rotation.x = -0.3;
        musketGroup.add(trigger);
        
        // Rear sight (notch)
        const rearSightGeo = new THREE.BoxGeometry(0.01, 0.008, 0.005);
        const rearSight = new THREE.Mesh(rearSightGeo, metalMaterial);
        rearSight.position.set(0, 0.015, -0.12);
        musketGroup.add(rearSight);
        
        // Front sight (post)
        const frontSightGeo = new THREE.BoxGeometry(0.004, 0.01, 0.003);
        const frontSight = new THREE.Mesh(frontSightGeo, metalMaterial);
        frontSight.position.set(0, 0.018, 0.35);
        musketGroup.add(frontSight);
        
        // Ramrod pipes
        for (let i = 0; i < 3; i++) {
            const pipeGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.015, 8);
            const pipe = new THREE.Mesh(pipeGeo, brassMaterial);
            pipe.rotation.z = Math.PI / 2;
            pipe.position.set(0.025, -0.08, -0.1 + i * 0.2);
            musketGroup.add(pipe);
        }
        
        // Ramrod (stored under barrel)
        const rodGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.6, 6);
        const rod = new THREE.Mesh(rodGeo, woodMaterial);
        rod.rotation.x = Math.PI / 2;
        rod.position.set(0.025, -0.09, 0.1);
        musketGroup.add(rod);
        
        return musketGroup;
    }

    equip(player) {
        this.player = player;
        this.mesh.visible = true;
        this.reloadAnimation = new ReloadAnimation(this, player);
        
        // Attach to camera for first-person view
        player.camera.add(this.mesh);
        this.mesh.position.set(0.08, -0.08, 0.12);
        this.mesh.rotation.set(0, 0, -0.05);
    }

    fire() {
        if (!this.loaded || !this.primed || !this.cocked) {
            audio.playDryClick();
            return false;
        }
        
        // Get muzzle position in world space
        const muzzleOffset = new THREE.Vector3(0, 0, 0.52);
        const muzzleWorld = muzzleOffset.clone();
        muzzleWorld.applyMatrix4(this.mesh.matrixWorld);
        
        // Get firing direction from iron sights
        const rearSightWorld = this.rearSightOffset.clone();
        rearSightWorld.applyMatrix4(this.mesh.matrixWorld);
        const frontSightWorld = this.frontSightOffset.clone();
        frontSightWorld.applyMatrix4(this.mesh.matrixWorld);
        
        const fireDirection = new THREE.Vector3().subVectors(frontSightWorld, rearSightWorld).normalize();
        
        // Add slight randomness for smoothbore inaccuracy
        const spread = 0.015; // Radians
        fireDirection.x += (Math.random() - 0.5) * spread;
        fireDirection.y += (Math.random() - 0.5) * spread;
        fireDirection.z += (Math.random() - 0.5) * spread;
        fireDirection.normalize();
        
        // Fire projectile
        ballistics.fire(muzzleWorld, fireDirection, this.player);
        
        // Effects
        audio.playMusketFire();
        this.createMuzzleFlash(muzzleWorld);
        
        // Reset weapon state
        this.loaded = false;
        this.primed = false;
        this.cocked = false;
        this.hammer.rotation.x = 0;
        
        // Recoil animation
        this.animateRecoil();
        
        return true;
    }

    createMuzzleFlash(position) {
        // Flash light
        const flashLight = new THREE.PointLight(0xffaa44, 5, 10);
        flashLight.position.copy(position);
        game.scene.add(flashLight);
        
        // Flash particles
        for (let i = 0; i < 12; i++) {
            const geometry = new THREE.PlaneGeometry(0.08, 0.08);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffaa44,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            particle.lookAt(game.camera.position);
            
            const angle = (i / 12) * Math.PI * 2;
            const speed = 2 + Math.random() * 2;
            particle.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    Math.random() * speed,
                    Math.sin(angle) * speed
                ),
                life: 0.1 + Math.random() * 0.1
            };
            game.muzzleFlashParticles.push(particle);
            game.scene.add(particle);
        }
        
        // Smoke
        for (let i = 0; i < 8; i++) {
            const geometry = new THREE.PlaneGeometry(0.15, 0.15);
            const material = new THREE.MeshBasicMaterial({
                color: 0xaaaaaa,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide
            });
            const smoke = new THREE.Mesh(geometry, material);
            smoke.position.copy(position);
            smoke.position.x += (Math.random() - 0.5) * 0.1;
            smoke.position.y += (Math.random() - 0.5) * 0.1;
            smoke.position.z += (Math.random() - 0.5) * 0.1;
            smoke.lookAt(game.camera.position);
            
            smoke.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    1 + Math.random(),
                    (Math.random() - 0.5) * 0.5
                ),
                life: 1.0,
                rotationSpeed: (Math.random() - 0.5) * 2
            };
            game.smokeParticles.push(smoke);
            game.scene.add(smoke);
        }
        
        // Remove light after brief flash
        setTimeout(() => {
            game.scene.remove(flashLight);
        }, 50);
    }

    animateRecoil() {
        const startRotation = this.mesh.rotation.x;
        const recoilAmount = 0.3;
        let progress = 0;
        
        const recoilInterval = setInterval(() => {
            progress += 0.1;
            if (progress <= 1) {
                // Kick back
                this.mesh.rotation.x = startRotation - Math.sin(progress * Math.PI) * recoilAmount;
                this.mesh.position.z = 0.12 + Math.sin(progress * Math.PI) * 0.05;
            } else {
                // Return
                this.mesh.rotation.x = startRotation;
                this.mesh.position.z = 0.12;
                clearInterval(recoilInterval);
            }
        }, 16);
    }

    startReload() {
        if (this.state !== 'ready' || this.loaded) return;
        
        this.state = 'reloading';
        this.reloadAnimation.start();
    }

    inspect() {
        // Tilt weapon to show lock state and visually indicate load status
        if (this.state === 'ready') {
            this.state = 'inspecting';
            
            // Tilt weapon for visual inspection
            this.mesh.rotation.z = 0.5;
            this.mesh.rotation.x = 0.3;
            
            // Open frizzen to visually check prime status
            if (this.primed) {
                // Flash pan is primed - show small particle effect
                this.createPanCheckEffect();
            } else {
                // Open frizzen to show empty pan
                this.frizzen.rotation.x = -0.5;
            }
            
            // Audio feedback for inspection
            setTimeout(() => {
                if (this.primed) {
                    audio.playPanHiss(); // Subtle hiss if primed
                }
            }, 200);
            
            setTimeout(() => {
                this.mesh.rotation.z = -0.05;
                this.mesh.rotation.x = 0;
                this.frizzen.rotation.x = 0;
                this.state = 'ready';
            }, 1500);
        }
    }

    createPanCheckEffect() {
        // Visual indicator for primed pan
        const geometry = new THREE.PlaneGeometry(0.03, 0.03);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.8
        });
        const spark = new THREE.Mesh(geometry, material);
        spark.position.set(0.038, -0.02, -0.14);
        this.mesh.add(spark);
        
        setTimeout(() => {
            this.mesh.remove(spark);
        }, 500);
    }
    }

    update(dt) {
        if (this.reloadAnimation) {
            this.reloadAnimation.update(dt);
        }
        
        // Update particle effects
        this.updateParticles();
    }

    updateParticles() {
        // Muzzle flash particles
        for (let i = game.muzzleFlashParticles.length - 1; i >= 0; i--) {
            const p = game.muzzleFlashParticles[i];
            p.userData.life -= 0.016;
            p.position.add(p.userData.velocity.clone().multiplyScalar(0.016));
            p.material.opacity = p.userData.life * 4;
            p.lookAt(game.camera.position);
            
            if (p.userData.life <= 0) {
                game.scene.remove(p);
                game.muzzleFlashParticles.splice(i, 1);
            }
        }
        
        // Smoke particles
        for (let i = game.smokeParticles.length - 1; i >= 0; i--) {
            const p = game.smokeParticles[i];
            p.userData.life -= 0.008;
            p.position.add(p.userData.velocity.clone().multiplyScalar(0.016));
            p.rotation.z += p.userData.rotationSpeed * 0.016;
            p.material.opacity = p.userData.life * 0.4;
            p.scale.setScalar(1 + (1 - p.userData.life) * 2);
            p.lookAt(game.camera.position);
            
            if (p.userData.life <= 0) {
                game.scene.remove(p);
                game.smokeParticles.splice(i, 1);
            }
        }
        
        // Impact particles
        for (let i = game.impactParticles.length - 1; i >= 0; i--) {
            const p = game.impactParticles[i];
            p.userData.life -= 0.02;
            p.position.add(p.userData.velocity.clone().multiplyScalar(0.016));
            p.userData.velocity.y -= 9.8 * 0.016 * 0.016; // Gravity
            p.material.opacity = p.userData.life * 0.6;
            
            if (p.userData.life <= 0 || p.position.y < 0) {
                game.scene.remove(p);
                game.impactParticles.splice(i, 1);
            }
        }
    }
}