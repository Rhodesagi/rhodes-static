/**
 * Musket Module - 12-step flintlock reload sequence
 * Authentic Brown Bess procedure
 */

class Musket {
    constructor(audioContext) {
        this.state = 'ready'; // ready, reloading, aimed, fired
        this.loaded = true;
        this.cocked = true;
        
        this.reloadStep = 0;
        this.reloadProgress = 0;
        this.isReloading = false;
        
        this.audioContext = audioContext;
        
        // 12-step reload sequence
        this.reloadSteps = [
            { name: 'Half-cock', duration: 800, sound: 'click' },
            { name: 'Open pan', duration: 600, sound: 'metal' },
            { name: 'Prime pan', duration: 1200, sound: 'pour' },
            { name: 'Close pan', duration: 500, sound: 'snap' },
            { name: 'Cast about', duration: 1000, sound: 'swish' },
            { name: 'Charge barrel', duration: 1500, sound: 'pour' },
            { name: 'Draw rammer', duration: 800, sound: 'slide' },
            { name: 'Ram cartridge', duration: 2000, sound: 'thud' },
            { name: 'Return rammer', duration: 800, sound: 'click' },
            { name: 'Full cock', duration: 600, sound: 'click' },
            { name: 'Shoulder arms', duration: 800, sound: null },
            { name: 'Ready', duration: 0, sound: null }
        ];
        
        this.sights = new IronSights();
        this.model = this.sights.createMusketModel();
        this.model.visible = true;
        
        // Animation offsets
        this.positionOffset = new THREE.Vector3();
        this.rotationOffset = new THREE.Euler();
        
        // Timer for reload steps
        this.reloadTimer = null;
        this.currentStepStartTime = 0;
    }

    /**
     * Fire the musket
     */
    fire() {
        if (!this.loaded || !this.cocked || this.isReloading) {
            return { fired: false, reason: this.getUnfireableReason() };
        }
        
        this.loaded = false;
        this.cocked = false;
        this.state = 'fired';
        
        // Play fire sound
        this.playSound('fire');
        
        // Flash effect
        this.createMuzzleFlash();
        
        // Smoke effect
        this.createSmoke();
        
        return { fired: true };
    }

    getUnfireableReason() {
        if (this.isReloading) return 'Reloading';
        if (!this.loaded) return 'Empty';
        if (!this.cocked) return 'Uncocked';
        return 'Unknown';
    }

    /**
     * Start reload sequence
     */
    startReload() {
        if (this.isReloading || this.loaded) return false;
        
        this.isReloading = true;
        this.reloadStep = 0;
        this.reloadProgress = 0;
        this.currentStepStartTime = Date.now();
        
        this.processReloadStep();
        return true;
    }

    /**
     * Process current reload step
     */
    processReloadStep() {
        if (this.reloadStep >= this.reloadSteps.length - 1) {
            // Reload complete
            this.isReloading = false;
            this.loaded = true;
            this.cocked = true;
            this.state = 'ready';
            this.reloadStep = 0;
            return;
        }
        
        const step = this.reloadSteps[this.reloadStep];
        
        if (step.sound) {
            this.playSound(step.sound);
        }
        
        // Schedule next step
        this.reloadTimer = setTimeout(() => {
            this.reloadStep++;
            this.currentStepStartTime = Date.now();
            this.processReloadStep();
        }, step.duration);
    }

    /**
     * Cancel reload (emergency)
     */
    cancelReload() {
        if (this.reloadTimer) {
            clearTimeout(this.reloadTimer);
            this.reloadTimer = null;
        }
        this.isReloading = false;
        this.reloadStep = 0;
    }

    /**
     * Get current reload status for UI
     */
    getReloadStatus() {
        if (!this.isReloading) return null;
        return {
            step: this.reloadStep,
            totalSteps: this.reloadSteps.length - 1,
            name: this.reloadSteps[this.reloadStep].name,
            progress: this.getStepProgress()
        };
    }

    getStepProgress() {
        if (!this.isReloading) return 0;
        const step = this.reloadSteps[this.reloadStep];
        const elapsed = Date.now() - this.currentStepStartTime;
        return Math.min(1, elapsed / step.duration);
    }

    /**
     * Update musket visual position/rotation based on state
     */
    update(deltaTime, isAiming, musketRotation) {
        const time = Date.now() / 1000;
        
        // Base position (at hip)
        let targetPos = new THREE.Vector3(0.15, -0.15, 0.2);
        let targetRot = new THREE.Euler(0, 0, 0);
        
        if (isAiming) {
            // Shouldered position for aiming
            targetPos = new THREE.Vector3(0, -0.08, 0.15);
            targetRot = new THREE.Euler(0, 0, 0);
            
            // Slight sway when aiming
            targetPos.x += Math.sin(time * 0.5) * 0.002;
            targetPos.y += Math.cos(time * 0.7) * 0.003;
        } else if (this.isReloading) {
            // Reload animations based on step
            this.applyReloadAnimation(targetPos, targetRot);
        }
        
        // Apply musket rotation (Q/E)
        targetRot.z += musketRotation;
        
        // Smooth interpolation
        this.model.position.lerp(targetPos, 10 * deltaTime);
        
        // Rotation interpolation
        this.model.rotation.x += (targetRot.x - this.model.rotation.x) * 10 * deltaTime;
        this.model.rotation.y += (targetRot.y - this.model.rotation.y) * 10 * deltaTime;
        this.model.rotation.z += (targetRot.z - this.model.rotation.z) * 10 * deltaTime;
        
        // Update ramrod position during reload
        if (this.isReloading) {
            this.sights.updateRamrod(this.model, this.reloadStep, this.getStepProgress());
        }
    }

    applyReloadAnimation(pos, rot) {
        const step = this.reloadStep;
        const progress = this.getStepProgress();
        
        switch(step) {
            case 0: // Half-cock
                pos.set(0.1, -0.1, 0.2);
                rot.z = 0.2;
                break;
            case 1: // Open pan
                pos.set(0.12, -0.08, 0.18);
                rot.z = 0.3;
                break;
            case 2: // Prime pan
                pos.set(0.08, -0.05, 0.15);
                rot.z = 0.4;
                break;
            case 3: // Close pan
                pos.set(0.1, -0.1, 0.2);
                rot.z = 0.2;
                break;
            case 4: // Cast about (muzzle up)
                pos.set(0, -0.05, 0.1);
                rot.x = -0.5 * progress;
                break;
            case 5: // Charge barrel
                pos.set(0, 0.1, 0.05);
                rot.x = -0.8;
                break;
            case 6: // Draw rammer
                pos.set(0.1, -0.08, 0.2);
                rot.x = 0;
                rot.z = 0.1;
                break;
            case 7: // Ram
                pos.set(0.05, -0.02, 0.15);
                rot.x = -0.2;
                break;
            case 8: // Return rammer
                pos.set(0.1, -0.08, 0.2);
                rot.z = 0.1;
                break;
            case 9: // Full cock
                pos.set(0.15, -0.12, 0.2);
                rot.z = 0;
                break;
            case 10: // Shoulder arms
                pos.set(0.15, -0.15, 0.2);
                rot.x *= (1 - progress);
                break;
        }
    }

    createMuzzleFlash() {
        // Create flash at muzzle position
        const flash = new THREE.PointLight(0xffaa00, 5, 10);
        flash.position.set(0, 0, -0.9);
        this.model.add(flash);
        
        // Flash geometry
        const flashGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ 
            color: 0xffddaa,
            transparent: true,
            opacity: 0.9
        });
        const flashMesh = new THREE.Mesh(flashGeo, flashMat);
        flashMesh.position.set(0, 0, -0.9);
        this.model.add(flashMesh);
        
        // Remove after short time
        setTimeout(() => {
            this.model.remove(flash);
            this.model.remove(flashMesh);
        }, 50);
    }

    createSmoke() {
        // Create smoke particles
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const smoke = new THREE.Mesh(
                    new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 6, 6),
                    new THREE.MeshBasicMaterial({
                        color: 0xaaaaaa,
                        transparent: true,
                        opacity: 0.4
                    })
                );
                smoke.position.set(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    -0.9
                );
                
                const velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    Math.random() * 0.5 + 0.2,
                    -1 - Math.random() * 0.5
                );
                
                this.model.add(smoke);
                
                const animate = () => {
                    smoke.position.add(velocity.clone().multiplyScalar(0.016));
                    smoke.scale.multiplyScalar(1.02);
                    smoke.material.opacity -= 0.01;
                    
                    if (smoke.material.opacity <= 0) {
                        this.model.remove(smoke);
                    } else {
                        requestAnimationFrame(animate);
                    }
                };
                animate();
            }, i * 50);
        }
    }

    /**
     * Play sound effect
     */
    playSound(type) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        switch(type) {
            case 'fire':
                // Create noise burst for gunshot
                const bufferSize = this.audioContext.sampleRate * 0.5;
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
                }
                const noise = this.audioContext.createBufferSource();
                noise.buffer = buffer;
                const noiseGain = this.audioContext.createGain();
                noiseGain.gain.setValueAtTime(0.8, this.audioContext.currentTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                noise.connect(noiseGain);
                noiseGain.connect(this.audioContext.destination);
                noise.start();
                return;
                
            case 'click':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.05);
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.05);
                break;
                
            case 'metal':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;
                
            case 'pour':
                // Simulate powder pouring
                const pourBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.3, this.audioContext.sampleRate);
                const pourData = pourBuffer.getChannelData(0);
                for (let i = 0; i < pourBuffer.length; i++) {
                    pourData[i] = (Math.random() * 2 - 1) * 0.1 * (1 - i / pourBuffer.length);
                }
                const pour = this.audioContext.createBufferSource();
                pour.buffer = pourBuffer;
                pour.connect(gainNode);
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                pour.start();
                break;
                
            case 'slide':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                oscillator.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
                
            case 'thud':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;
                
            case 'snap':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.05);
                break;
        }
    }

    /**
     * Get muzzle position in world space
     */
    getMuzzlePosition(camera) {
        // Muzzle is at local z = -0.9
        const muzzleLocal = new THREE.Vector3(0, 0, -0.9);
        muzzleLocal.applyMatrix4(this.model.matrixWorld);
        return muzzleLocal;
    }
}