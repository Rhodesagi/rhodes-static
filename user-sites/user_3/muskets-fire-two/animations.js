class ReloadAnimation {
    constructor(musket, player) {
        this.musket = musket;
        this.player = player;
        this.step = 0;
        this.stepTime = 0;
        this.active = false;
        this.completed = false;
        
        // Step durations in seconds
        this.stepDurations = {
            0: 0.5,  // Check lock
            1: 1.0,  // Pour powder
            2: 0.8,  // Insert ball
            3: 1.2,  // Ram
            4: 0.6,  // Prime pan
            5: 0.5   // Cock flint
        };
        
        // Hand positions for procedural animation
        this.rightHand = new THREE.Object3D();
        this.leftHand = new THREE.Object3D();
        this.musket.mesh.add(this.rightHand);
        this.musket.mesh.add(this.leftHand);
    }

    start() {
        this.active = true;
        this.step = 0;
        this.stepTime = 0;
        this.completed = false;
        this.playStepSound();
    }

    update(dt) {
        if (!this.active || this.completed) return;
        
        this.stepTime += dt;
        const duration = this.stepDurations[this.step];
        const progress = Math.min(this.stepTime / duration, 1);
        
        // Procedural hand animation based on step
        this.animateStep(this.step, progress);
        
        if (progress >= 1) {
            this.step++;
            this.stepTime = 0;
            
            if (this.step > 5) {
                this.completed = true;
                this.active = false;
                this.musket.state = 'ready';
                this.musket.loaded = true;
                this.musket.primed = true;
                this.musket.cocked = true;
            } else {
                this.playStepSound();
            }
        }
    }

    animateStep(step, progress) {
        const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const e = ease(progress);
        
        switch(step) {
            case 0: // Check lock - tilt weapon to inspect
                this.musket.mesh.rotation.z = THREE.MathUtils.lerp(0, 0.3, e);
                this.musket.mesh.rotation.x = THREE.MathUtils.lerp(0, 0.2, e);
                if (progress > 0.5) {
                    this.musket.mesh.rotation.z = THREE.MathUtils.lerp(0.3, 0, (progress - 0.5) * 2);
                    this.musket.mesh.rotation.x = THREE.MathUtils.lerp(0.2, 0, (progress - 0.5) * 2);
                }
                break;
                
            case 1: // Pour powder - grab horn, pour, return
                if (progress < 0.3) {
                    // Reach for powder horn
                    this.rightHand.position.set(0.1, -0.1, 0.1);
                } else if (progress < 0.7) {
                    // Pour into barrel
                    this.musket.mesh.rotation.x = THREE.MathUtils.lerp(0, -0.4, e);
                    this.rightHand.position.set(0, 0.3, 0);
                } else {
                    // Return to grip
                    this.musket.mesh.rotation.x = THREE.MathUtils.lerp(-0.4, 0, (progress - 0.7) / 0.3);
                    this.rightHand.position.set(0, 0, 0);
                }
                break;
                
            case 2: // Insert ball
                if (progress < 0.4) {
                    // Grab ball from pouch
                    this.leftHand.position.set(-0.15, -0.1, 0.1);
                } else if (progress < 0.8) {
                    // Insert into muzzle
                    this.leftHand.position.set(0, 0.4, 0);
                    this.musket.mesh.rotation.x = THREE.MathUtils.lerp(0, -0.3, Math.sin(progress * Math.PI));
                } else {
                    // Return
                    this.leftHand.position.set(-0.15, -0.1, 0);
                    this.musket.mesh.rotation.x = 0;
                }
                break;
                
            case 3: // Ram - grab rod, push down, remove
                if (progress < 0.2) {
                    // Grab ramrod
                    this.rightHand.position.set(0.05, 0.3, 0.05);
                } else if (progress < 0.6) {
                    // Ram down
                    const ramProgress = (progress - 0.2) / 0.4;
                    this.rightHand.position.set(0.05, 0.3 - ramProgress * 0.3, 0.05);
                    this.musket.mesh.rotation.x = THREE.MathUtils.lerp(0, -0.1, Math.sin(ramProgress * Math.PI));
                } else if (progress < 0.8) {
                    // Pull out
                    this.rightHand.position.set(0.05, 0.3, 0.05);
                } else {
                    // Return rod
                    this.rightHand.position.set(0, 0, 0);
                    this.musket.mesh.rotation.x = 0;
                }
                break;
                
            case 4: // Prime pan - open, add powder, close
                if (progress < 0.5) {
                    // Open frizzen, add powder
                    this.musket.frizzen.rotation.x = THREE.MathUtils.lerp(0, -0.5, e * 2);
                    this.leftHand.position.set(0.05, 0.15, 0.05);
                } else {
                    // Close frizzen
                    this.musket.frizzen.rotation.x = THREE.MathUtils.lerp(-0.5, 0, (progress - 0.5) * 2);
                    this.leftHand.position.set(-0.15, -0.1, 0);
                }
                break;
                
            case 5: // Cock flint
                if (progress < 0.5) {
                    // Pull hammer back
                    this.musket.hammer.rotation.x = THREE.MathUtils.lerp(0, -0.6, e * 2);
                } else {
                    // Click into place
                    this.musket.hammer.rotation.x = -0.6;
                }
                break;
        }
    }

    playStepSound() {
        switch(this.step) {
            case 0: // No sound for check
                break;
            case 1:
                audio.playPowderPour();
                break;
            case 3:
                audio.playRamRod();
                break;
            case 4:
                audio.playPanHiss();
                break;
            case 5:
                audio.playCockFlint();
                break;
        }
    }

    reset() {
        this.active = false;
        this.completed = false;
        this.step = 0;
        this.stepTime = 0;
        this.rightHand.position.set(0, 0, 0);
        this.leftHand.position.set(-0.15, -0.1, 0);
        this.musket.mesh.rotation.x = 0;
        this.musket.mesh.rotation.z = 0;
        this.musket.hammer.rotation.x = 0;
        this.musket.frizzen.rotation.x = 0;
    }
}