// MUSKETS FIRE - 2 Player FPS
// Iron sights only, authentic reloading, no HUD
// Single WebGL context with gl.scissor/gl.viewport for split-screen

const CONFIG = {
    playerSpeed: 5,
    lookSensitivity: 0.002,
    gamepadSensitivity: 2.5,
    keyboardLookSensitivity: 60,
    projectileSpeed: 45,
    gravity: 9.8,
    misfireChance: 0.15,
    smokeLifetime: 3.0,
    reloadSteps: ['halfcock', 'powder', 'patchball', 'ramrod', 'prime', 'fullcock'],
    reloadTimes: { halfcock: 0.3, powder: 0.8, patchball: 0.6, ramrod: 1.2, prime: 0.5, fullcock: 0.3 }
};

class AudioSystem {
    constructor() {
        this.context = null;
        this.pool = [];
        this.maxPoolSize = 16;
        this.buffers = {};
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.createBuffers();
            this.initialized = true;
        } catch(e) {
            console.warn('Audio init failed:', e);
        }
    }

    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    createBuffers() {
        this.buffers.noise = this.createNoiseBuffer(0.5, 'brown');
        this.buffers.shortNoise = this.createNoiseBuffer(0.3, 'white');
    }

    createNoiseBuffer(duration, type = 'white') {
        if (!this.context) return null;
        const sampleRate = this.context.sampleRate;
        const buffer = this.context.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = type === 'white' ? (Math.random() * 2 - 1) : (Math.random() * 2 - 1) * (1 - i / data.length);
        }
        return buffer;
    }

    getPooledGain() {
        if (this.pool.length > 0) {
            const gain = this.pool.pop();
            gain.gain.value = 1;
            return gain;
        }
        return this.context ? this.context.createGain() : null;
    }

    returnToPool(gain) {
        if (this.pool.length < this.maxPoolSize) {
            try { gain.disconnect(); } catch(e) {}
            this.pool.push(gain);
        }
    }

    playMusketFire() {
        if (!this.context || this.context.state !== 'running') return;
        const t = this.context.currentTime;
        const noise = this.context.createBufferSource();
        noise.buffer = this.buffers.noise;
        const noiseFilter = this.context.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(2000, t);
        noiseFilter.frequency.exponentialRampToValueAtTime(200, t + 0.3);
        const noiseGain = this.getPooledGain();
        if (!noiseGain) return;
        noiseGain.gain.setValueAtTime(0.8, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        noise.onended = () => this.returnToPool(noiseGain);
        noise.connect(noiseFilter).connect(noiseGain).connect(this.context.destination);
        noise.start(t);

        const osc = this.context.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
        const oscGain = this.context.createGain();
        oscGain.gain.setValueAtTime(0.5, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.connect(oscGain).connect(this.context.destination);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    playMisfire() {
        if (!this.context || this.context.state !== 'running') return;
        const t = this.context.currentTime;
        // Fizzle sound + flash in pan visual feedback
        const noise = this.context.createBufferSource();
        noise.buffer = this.buffers.shortNoise;
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, t);
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        noise.connect(filter).connect(gain).connect(this.context.destination);
        noise.start(t);
    }

    playClick() {
        if (!this.context || this.context.state !== 'running') return;
        const t = this.context.currentTime;
        const osc = this.context.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(2000, t);
        osc.frequency.exponentialRampToValueAtTime(500, t + 0.05);
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        osc.connect(gain).connect(this.context.destination);
        osc.start(t);
        osc.stop(t + 0.05);
    }

    playPowderPour() {
        if (!this.context || this.context.state !== 'running') return;
        const t = this.context.currentTime;
        const noise = this.context.createBufferSource();
        noise.buffer = this.buffers.shortNoise;
        const filter = this.context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, t);
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);
        noise.connect(filter).connect(gain).connect(this.context.destination);
        noise.start(t);
    }

    playRamrod() {
        if (!this.context || this.context.state !== 'running') return;
        const t = this.context.currentTime;
        const osc = this.context.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, t);
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.connect(gain).connect(this.context.destination);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    playExplosion() {
        if (!this.context || this.context.state !== 'running') return;
        const t = this.context.currentTime;
        const noise = this.context.createBufferSource();
        noise.buffer = this.buffers.noise;
        const filter = this.context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(200, t);
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(1.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
        noise.connect(filter).connect(gain).connect(this.context.destination);
        noise.start(t);
    }
}

class SmokeSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.maxParticles = 200;
        this.geometry = new THREE.PlaneGeometry(0.5, 0.5);
        this.material = new THREE.MeshBasicMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            depthWrite: false
        });
    }

    spawn(position, direction) {
        if (this.particles.length >= this.maxParticles) {
            // Remove oldest particle
            const old = this.particles.shift();
            this.scene.remove(old.mesh);
            old.mesh.geometry.dispose();
            old.mesh.material.dispose();
        }
        
        for (let i = 0; i < 6; i++) {
            const mesh = new THREE.Mesh(this.geometry, this.material.clone());
            mesh.position.copy(position);
            mesh.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
            ));
            
            const spread = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                Math.random() * 0.3 + 0.2,
                (Math.random() - 0.5) * 0.5
            );
            const velocity = direction.clone().multiplyScalar(-0.3).add(spread);
            
            this.scene.add(mesh);
            this.particles.push({
                mesh: mesh,
                velocity: velocity,
                lifetime: CONFIG.smokeLifetime * (0.8 + Math.random() * 0.4),
                maxLifetime: CONFIG.smokeLifetime * (0.8 + Math.random() * 0.4)
            });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.lifetime -= dt;
            
            if (p.lifetime <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }
            
            p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
            p.velocity.y += 0.3 * dt;
            p.velocity.multiplyScalar(0.97);
            
            const lifeRatio = p.lifetime / p.maxLifetime;
            const scale = 1 + (1 - lifeRatio) * 5;
            p.mesh.scale.set(scale, scale, scale);
            p.mesh.material.opacity = 0.5 * lifeRatio;
            p.mesh.lookAt(p.mesh.position.clone().add(p.velocity));
        }
    }
    
    clear() {
        for (const p of this.particles) {
            this.scene.remove(p.mesh);
            p.mesh.material.dispose();
        }
        this.particles = [];
    }
}

class GamepadInput {
    constructor() {
        this.connected = false;
        this.gamepad = null;
        this.lookX = 0;
        this.lookY = 0;
        this.deadzone = 0.15;
    }

    update() {
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let pad of pads) {
            if (pad) {
                this.gamepad = pad;
                this.connected = true;
                this.lookX = Math.abs(pad.axes[2]) > this.deadzone ? pad.axes[2] : 0;
                this.lookY = Math.abs(pad.axes[3]) > this.deadzone ? pad.axes[3] : 0;
                return;
            }
        }
        this.connected = false;
        this.gamepad = null;
        this.lookX = 0;
        this.lookY = 0;
    }

    getButton(index) {
        return this.gamepad && this.gamepad.buttons[index] && this.gamepad.buttons[index].pressed;
    }

    getFire() { return this.getButton(7) || this.getButton(5); }
    getAim() { return this.getButton(6) || this.getButton(4); }
    getReload() { return this.getButton(2) || this.getButton(3); }
}

class MusketModel {
    constructor() {
        this.mesh = new THREE.Group();
        this.createMusket();
    }

    createMusket() {
        const woodMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.8 });
        const brassMaterial = new THREE.MeshStandardMaterial({ color: 0xb5a642, roughness: 0.3, metalness: 0.9 });

        const stockGeo = new THREE.BoxGeometry(0.08, 0.12, 0.8);
        const stock = new THREE.Mesh(stockGeo, woodMaterial);
        stock.position.set(0, -0.06, 0.2);
        this.mesh.add(stock);

        const barrelGeo = new THREE.CylinderGeometry(0.025, 0.03, 1.2, 16);
        const barrel = new THREE.Mesh(barrelGeo, metalMaterial);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.3);
        this.mesh.add(barrel);

        this.frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.035, 0.005), metalMaterial);
        this.frontSight.position.set(0, 0.075, -0.88);
        this.mesh.add(this.frontSight);

        const rearSightBase = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.015, 0.015), metalMaterial);
        rearSightBase.position.set(0, 0.055, 0.12);
        this.mesh.add(rearSightBase);
        
        const rearNotch = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.008, 0.016), new THREE.MeshBasicMaterial({ color: 0x000000 }));
        rearNotch.position.set(0, 0.063, 0.12);
        this.mesh.add(rearNotch);

        const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.06), metalMaterial);
        lockPlate.position.set(0.05, 0.02, -0.1);
        this.mesh.add(lockPlate);

        this.hammer = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.02), metalMaterial);
        this.hammer.position.set(0.06, 0.08, -0.12);
        this.hammer.geometry.translate(0, 0.03, 0);
        this.mesh.add(this.hammer);

        this.frizzen = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.02), metalMaterial);
        this.frizzen.position.set(0.05, 0.02, -0.08);
        this.mesh.add(this.frizzen);

        this.pan = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.005, 0.02), new THREE.MeshLambertMaterial({ color: 0x222222 }));
        this.pan.position.set(0.05, 0.023, -0.08);
        this.pan.visible = false;
        this.mesh.add(this.pan);

        this.powder = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.003, 0.015), new THREE.MeshLambertMaterial({ color: 0x666666 }));
        this.powder.position.set(0.05, 0.026, -0.08);
        this.powder.visible = false;
        this.mesh.add(this.powder);

        const triggerGuardGeo = new THREE.TorusGeometry(0.03, 0.003, 4, 8, Math.PI);
        const triggerGuard = new THREE.Mesh(triggerGuardGeo, brassMaterial);
        triggerGuard.rotation.z = Math.PI;
        triggerGuard.position.set(0, -0.08, 0.05);
        this.mesh.add(triggerGuard);

        this.trigger = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.03, 0.008), metalMaterial);
        this.trigger.position.set(0, -0.08, 0.05);
        this.trigger.geometry.translate(0, 0.015, 0);
        this.mesh.add(this.trigger);

        this.ramrod = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.9, 8), metalMaterial);
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrod.position.set(0, -0.08, -0.25);
        this.mesh.add(this.ramrod);

        this.ramrodInBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.8, 8), metalMaterial);
        this.ramrodInBarrel.rotation.x = Math.PI / 2;
        this.ramrodInBarrel.position.set(0, 0.02, -0.2);
        this.ramrodInBarrel.visible = false;
        this.mesh.add(this.ramrodInBarrel);

        const hornGeo = new THREE.ConeGeometry(0.04, 0.15, 8, 1, true);
        this.powderHorn = new THREE.Mesh(hornGeo, new THREE.MeshLambertMaterial({ color: 0xf5deb3 }));
        this.powderHorn.rotation.z = -Math.PI / 3;
        this.powderHorn.rotation.x = Math.PI / 2;
        this.powderHorn.position.set(-0.15, -0.05, 0.3);
        this.powderHorn.visible = false;
        this.mesh.add(this.powderHorn);

        this.barrel = barrel;
    }

    setHammerCocked(cocked) {
        this.hammer.rotation.x = cocked ? -0.6 : 0;
    }

    setFrizzenOpen(open) {
        this.frizzen.rotation.x = open ? -0.8 : 0;
        this.pan.visible = open;
    }

    setPrimed(primed) {
        this.powder.visible = primed;
    }

    setTriggerPulled(pulled) {
        this.trigger.rotation.x = pulled ? 0.3 : 0;
    }

    showRamrodInHand(show) {
        this.ramrod.visible = !show;
        if (!this.handRamrod) {
            this.handRamrod = this.ramrod.clone();
            this.mesh.add(this.handRamrod);
        }
        this.handRamrod.visible = show;
        if (show) {
            this.handRamrod.position.set(0.08, -0.02, -0.1);
            this.handRamrod.rotation.set(0.5, 0, 0.3);
        }
    }

    showRamrodInBarrel(show) {
        this.ramrodInBarrel.visible = show;
        this.ramrod.visible = !show;
    }

    showPowderHorn(show) {
        this.powderHorn.visible = show;
    }
}

class MusketWeapon {
    constructor(audio) {
        this.audio = audio;
        this.model = new MusketModel();
        this.state = 'ready';
        this.loaded = false;
        this.primed = false;
        this.hammerCocked = false;
        this.ramrodRetained = false;
        this.misfire = false;
        this.reloadProgress = 0;
        this.currentReloadTime = 0;
        this.reloadStartTime = 0;
        
        this.weaponGroup = new THREE.Group();
        this.weaponGroup.add(this.model.mesh);
        
        this.hipPosition = new THREE.Vector3(0.2, -0.2, -0.4);
        this.hipRotation = new THREE.Euler(0, 0, -0.1);
        
        this.sightPosition = new THREE.Vector3(0.0, -0.12, -0.25);
        this.sightRotation = new THREE.Euler(0, 0, 0);
        
        this.usingSights = false;
        this.recoilOffset = 0;
        this.exploded = false;
        this.misfireFlash = null;
    }

    update(dt) {
        if (this.exploded) return;

        // State timeout protection - auto-reset if stuck >30s
        if (this.state !== 'ready' && this.state !== 'firing') {
            if (Date.now() - this.reloadStartTime > 30000) {
                this.reset();
                return;
            }
            
            this.currentReloadTime += dt;
            const targetTime = CONFIG.reloadTimes[this.state];
            this.reloadProgress = this.currentReloadTime / targetTime;
            this.animateReloadState(dt);
            
            if (this.currentReloadTime >= targetTime) {
                this.advanceReloadState();
            }
        }
        
        this.recoilOffset = THREE.MathUtils.lerp(this.recoilOffset, 0, dt * 5);
        
        const targetPos = this.usingSights ? this.sightPosition : this.hipPosition;
        this.weaponGroup.position.copy(targetPos);
        this.weaponGroup.position.z += this.recoilOffset;
        this.weaponGroup.rotation.copy(this.usingSights ? this.sightRotation : this.hipRotation);
        
        // Update misfire flash
        if (this.misfireFlash) {
            this.misfireFlash.intensity *= 0.9;
            if (this.misfireFlash.intensity < 0.1) {
                this.weaponGroup.remove(this.misfireFlash);
                this.misfireFlash = null;
            }
        }
    }

    animateReloadState(dt) {
        const progress = this.reloadProgress;
        
        switch(this.state) {
            case 'halfcock':
                this.model.setHammerCocked(true);
                break;
            case 'powder':
                this.model.showPowderHorn(true);
                this.weaponGroup.rotation.z = Math.sin(progress * Math.PI) * 0.3;
                if (progress > 0.5 && !this.poured) {
                    this.audio.playPowderPour();
                    this.poured = true;
                }
                break;
            case 'patchball':
                this.model.showPowderHorn(false);
                this.weaponGroup.rotation.x = Math.sin(progress * Math.PI) * 0.2;
                break;
            case 'ramrod':
                this.model.showRamrodInHand(true);
                if (progress < 0.5) {
                    const insertProgress = progress * 2;
                    this.model.handRamrod.position.z = -0.1 - insertProgress * 0.5;
                    this.model.showRamrodInBarrel(insertProgress > 0.3);
                } else {
                    const removeProgress = (progress - 0.5) * 2;
                    this.model.handRamrod.position.z = -0.6 + removeProgress * 0.5;
                    this.model.showRamrodInBarrel(removeProgress < 0.7);
                }
                if (progress > 0.25 && progress < 0.3 && !this.rammed) {
                    this.audio.playRamrod();
                    this.rammed = true;
                }
                break;
            case 'prime':
                this.model.showRamrodInHand(false);
                this.model.showRamrodInBarrel(false);
                this.model.setFrizzenOpen(true);
                if (!this.primed) {
                    this.misfire = Math.random() < CONFIG.misfireChance;
                }
                break;
            case 'fullcock':
                this.hammerCocked = true;
                this.primed = true;
                this.loaded = true;
                this.model.setPrimed(true);
                this.ramrodRetained = false;
                break;
        }
    }

    advanceReloadState() {
        const states = CONFIG.reloadSteps;
        const currentIdx = states.indexOf(this.state);
        
        this.poured = false;
        this.rammed = false;
        
        if (currentIdx < states.length - 1) {
            this.state = states[currentIdx + 1];
            this.currentReloadTime = 0;
            this.audio.playClick();
            
            if (this.state === 'ramrod') {
                this.ramrodRetained = true;
            }
        } else {
            this.state = 'ready';
            this.currentReloadTime = 0;
            this.model.setFrizzenOpen(false);
        }
    }

    startReload() {
        if (this.state === 'ready' && !this.loaded && !this.exploded) {
            this.state = 'halfcock';
            this.currentReloadTime = 0;
            this.reloadStartTime = Date.now();
            this.audio.playClick();
        }
    }

    fire() {
        if (this.exploded) return false;
        
        if (this.state === 'ready' && this.loaded && this.primed && this.hammerCocked) {
            if (this.ramrodRetained) {
                this.explode();
                return false;
            }
            
            this.state = 'firing';
            this.model.setTriggerPulled(true);
            this.model.setHammerCocked(false);
            
            if (this.misfire) {
                this.audio.playMisfire();
                this.model.setPrimed(false);
                // Visual misfire feedback - flash in pan
                this.misfireFlash = new THREE.PointLight(0xff6600, 2, 2);
                this.misfireFlash.position.set(0.05, 0.05, -0.08);
                this.weaponGroup.add(this.misfireFlash);
            } else {
                this.audio.playMusketFire();
                this.recoilOffset = 0.15;
            }
            
            this.loaded = false;
            this.primed = false;
            this.hammerCocked = false;
            this.misfire = false;
            this.model.setFrizzenOpen(false);
            this.model.setPrimed(false);
            
            setTimeout(() => {
                this.model.setTriggerPulled(false);
                this.state = 'ready';
            }, 100);
            
            return !this.misfire;
        }
        return false;
    }

    explode() {
        this.exploded = true;
        this.audio.playExplosion();
        
        const flash = new THREE.PointLight(0xff4400, 5, 10);
        flash.position.set(0, 0, -0.5);
        this.weaponGroup.add(flash);
        
        this.model.mesh.rotation.z = Math.random() * 0.5;
        this.model.mesh.position.y -= 0.1;
        
        setTimeout(() => {
            if (flash.parent) flash.parent.remove(flash);
        }, 500);
    }

    reset() {
        this.exploded = false;
        this.loaded = false;
        this.primed = false;
        this.hammerCocked = false;
        this.ramrodRetained = false;
        this.misfire = false;
        this.state = 'ready';
        this.currentReloadTime = 0;
        this.model.mesh.rotation.set(0, 0, 0);
        this.model.mesh.position.set(0, 0, 0);
        this.model.setFrizzenOpen(false);
        this.model.setPrimed(false);
        this.model.showRamrodInBarrel(false);
        this.model.showRamrodInHand(false);
        this.model.showPowderHorn(false);
    }

    toggleSights() {
        if (!this.exploded) {
            this.usingSights = !this.usingSights;
        }
    }

    getMuzzlePosition() {
        const pos = new THREE.Vector3(0, 0.02, -0.9);
        pos.applyMatrix4(this.weaponGroup.matrixWorld);
        return pos;
    }

    getMuzzleDirection() {
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyQuaternion(this.weaponGroup.getWorldQuaternion(new THREE.Quaternion()));
        return dir;
    }
}

class Projectile {
    constructor(position, direction, owner) {
        this.owner = owner;
        this.position = position.clone();
        this.velocity = direction.clone().multiplyScalar(CONFIG.projectileSpeed);
        
        const geo = new THREE.SphereGeometry(0.015, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(this.position);
        
        this.active = true;
        this.lifetime = 5;
    }

    update(dt, worldObjects, players) {
        if (!this.active) return;
        
        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.active = false;
            return;
        }
        
        this.velocity.y -= CONFIG.gravity * dt * 0.5;
        const moveStep = this.velocity.clone().multiplyScalar(dt);
        const newPosition = this.position.clone().add(moveStep);
        
        for (const obj of worldObjects) {
            if (obj.position && this.position.distanceTo(obj.position) < 1.5) {
                this.active = false;
                return;
            }
        }
        
        for (const player of players) {
            if (player !== this.owner && player.alive) {
                if (this.position.distanceTo(player.position) < 0.5) {
                    this.active = false;
                    player.hit();
                    return;
                }
            }
        }
        
        this.position.copy(newPosition);
        this.mesh.position.copy(this.position);
    }
}

class Player {
    constructor(id, spawnPos, inputConfig) {
        this.id = id;
        this.position = spawnPos.clone();
        this.rotation = new THREE.Euler(0, id === 1 ? 0 : Math.PI, 0);
        this.height = 1.7;
        this.radius = 0.3;
        this.health = 100;
        this.alive = true;
        
        this.input = inputConfig;
        this.inputState = { forward: 0, right: 0, fire: false, sights: false, reload: false };
        
        this.gamepad = id === 2 ? new GamepadInput() : null;
        
        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
        this.camera.position.copy(this.position);
        this.camera.position.y += this.height - 0.1;
        
        this.weapon = new MusketWeapon(game.audio);
        this.camera.add(this.weapon.weaponGroup);
        
        this.velocity = new THREE.Vector3();
        
        // Keyboard look accumulator for P2
        this.keyboardLook = { x: 0, y: 0 };
    }

    update(dt, worldObjects, otherPlayer) {
        if (!this.alive) return;
        
        this.readInput();
        
        if (this.gamepad) {
            this.gamepad.update();
        }
        
        // Look
        if (this.id === 1) {
            // P1 uses mouse deltas set by pointer lock handler
        } else {
            // P2: Gamepad preferred, keyboard fallback
            if (this.gamepad && this.gamepad.connected) {
                this.rotation.y -= this.gamepad.lookX * CONFIG.gamepadSensitivity * dt;
                this.rotation.x -= this.gamepad.lookY * CONFIG.gamepadSensitivity * dt;
                this.keyboardLook.x = 0;
                this.keyboardLook.y = 0;
            } else {
                // Keyboard look with smoothing
                this.rotation.y -= this.keyboardLook.x * CONFIG.lookSensitivity * CONFIG.keyboardLookSensitivity;
                this.rotation.x -= this.keyboardLook.y * CONFIG.lookSensitivity * CONFIG.keyboardLookSensitivity;
            }
        }
        
        this.rotation.x = THREE.MathUtils.clamp(this.rotation.x, -Math.PI/2.5, Math.PI/2.5);
        this.camera.rotation.copy(this.rotation);
        
        // Move
        const moveDir = new THREE.Vector3();
        if (this.inputState.forward !== 0) moveDir.z -= this.inputState.forward;
        if (this.inputState.right !== 0) moveDir.x += this.inputState.right;
        
        if (moveDir.length() > 0) {
            moveDir.normalize().multiplyScalar(CONFIG.playerSpeed * dt);
            moveDir.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
            const newPos = this.position.clone().add(moveDir);
            
            // Check collision with world
            let worldCollide = false;
            for (const obj of worldObjects) {
                if (obj.position && newPos.distanceTo(obj.position) < 1.5) {
                    worldCollide = true;
                    break;
                }
            }
            
            // Check collision with other player
            let playerCollide = false;
            if (otherPlayer && newPos.distanceTo(otherPlayer.position) < 0.8) {
                playerCollide = true;
            }
            
            if (!worldCollide && !playerCollide) {
                this.position.copy(newPos);
            }
        }
        
        this.camera.position.copy(this.position);
        this.camera.position.y += this.height - 0.1;
        
        // Weapon actions
        const aimPressed = this.inputState.sights || (this.gamepad && this.gamepad.getAim());
        if (aimPressed && !this.prevAim) {
            this.weapon.toggleSights();
        }
        this.prevAim = aimPressed;
        
        const reloadPressed = this.inputState.reload || (this.gamepad && this.gamepad.getReload());
        if (reloadPressed && !this.prevReload) {
            this.weapon.startReload();
        }
        this.prevReload = reloadPressed;
        
        const firePressed = this.inputState.fire || (this.gamepad && this.gamepad.getFire());
        if (firePressed && !this.prevFire) {
            if (this.weapon.fire()) {
                const muzzlePos = this.weapon.getMuzzlePosition();
                const muzzleDir = this.weapon.getMuzzleDirection();
                game.spawnProjectile(muzzlePos, muzzleDir, this);
                game.smoke.spawn(muzzlePos, muzzleDir);
            }
            if (this.weapon.exploded) {
                this.hit(100);
            }
        }
        this.prevFire = firePressed;
        
        this.weapon.update(dt);
    }

    readInput() {
        const keys = game.keys;
        
        this.inputState.forward = 0;
        this.inputState.right = 0;
        this.keyboardLook.x = 0;
        this.keyboardLook.y = 0;
        
        if (this.id === 1) {
            if (keys[this.input.forward]) this.inputState.forward += 1;
            if (keys[this.input.back]) this.inputState.forward -= 1;
            if (keys[this.input.left]) this.inputState.right -= 1;
            if (keys[this.input.right]) this.inputState.right += 1;
            this.inputState.fire = keys[this.input.fire] || game.mouseButtons[0];
            this.inputState.sights = keys[this.input.sights] || game.mouseButtons[2];
            this.inputState.reload = keys[this.input.reload];
        } else {
            // P2: Arrows for movement
            if (keys[this.input.forward]) this.inputState.forward += 1;
            if (keys[this.input.back]) this.inputState.forward -= 1;
            if (keys[this.input.left]) this.inputState.right -= 1;
            if (keys[this.input.right]) this.inputState.right += 1;
            
            // IJKL for keyboard look (fallback when no gamepad)
            if (keys['KeyI']) this.keyboardLook.y -= 1;
            if (keys['KeyK']) this.keyboardLook.y += 1;
            if (keys['KeyJ']) this.keyboardLook.x -= 1;
            if (keys['KeyL']) this.keyboardLook.x += 1;
            
            this.inputState.fire = keys[this.input.fire];
            this.inputState.sights = keys[this.input.sights];
            this.inputState.reload = keys[this.input.reload];
        }
    }

    addMouseDelta(dx, dy) {
        if (this.id === 1) {
            this.rotation.y -= dx * CONFIG.lookSensitivity;
            this.rotation.x -= dy * CONFIG.lookSensitivity;
        }
    }

    hit(damage = 50) {
        this.health -= damage;
        if (this.health <= 0) {
            this.respawn();
        }
    }

    respawn() {
        this.health = 100;
        this.alive = true;
        this.position.set(
            this.id === 1 ? -10 : 10,
            0,
            this.id === 1 ? -10 : 10
        );
        this.rotation.y = this.id === 1 ? 0 : Math.PI;
        this.weapon.reset();
    }
}

class World {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        this.createArena();
    }

    createArena() {
        const groundGeo = new THREE.PlaneGeometry(100, 100, 20, 20);
        const pos = groundGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5;
            pos.setZ(i, z);
        }
        groundGeo.computeVertexNormals();
        
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x3d5c3d });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);
        this.objects.push(ground);
        
        const boxGeo = new THREE.BoxGeometry(1, 2, 1);
        const boxMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        
        const positions = [
            [-5, 1, -5], [5, 1, -5], [-5, 1, 5], [5, 1, 5],
            [0, 1, -8], [0, 1, 8], [-8, 1, 0], [8, 1, 0],
            [-3, 0.5, -3], [3, 0.5, -3], [-3, 0.5, 3], [3, 0.5, 3]
        ];
        
        for (const pos of positions) {
            const box = new THREE.Mesh(boxGeo, boxMat);
            box.position.set(...pos);
            this.scene.add(box);
            this.objects.push(box);
        }
        
        const ambient = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambient);
        
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(10, 20, 10);
        sun.castShadow = true;
        this.scene.add(sun);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setScissorTest(true);
        this.renderer.autoClear = false;
        
        this.audio = new AudioSystem();
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 10, 80);
        
        this.smoke = new SmokeSystem(this.scene);
        this.world = new World(this.scene);
        
        this.keys = {};
        this.mouseButtons = [false, false, false];
        this.setupInput();
        
        this.players = [];
        this.projectiles = [];
        
        // P1: WASD + Mouse (E for sights instead of Shift to avoid ghosting)
        const p1Input = {
            forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD',
            fire: '', sights: 'KeyE', reload: 'KeyR'
        };
        this.players.push(new Player(1, new THREE.Vector3(-10, 0, -10), p1Input));
        this.scene.add(this.players[0].camera);
        
        // P2: Arrows + IJKL look + Enter/Period/Slash (no Shift to avoid ghosting)
        const p2Input = {
            forward: 'ArrowUp', back: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
            fire: 'Enter', sights: 'Period', reload: 'Slash'
        };
        this.players.push(new Player(2, new THREE.Vector3(10, 0, 10), p2Input));
        this.scene.add(this.players[1].camera);
        
        // Pointer lock for P1 only
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
            this.audio.init();
            this.audio.resume();
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = document.pointerLockElement === this.canvas;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.pointerLocked) {
                this.players[0].addMouseDelta(e.movementX, e.movementY);
            }
        });
        
        window.addEventListener('keydown', () => {
            this.audio.init();
            this.audio.resume();
        }, { once: true });
        
        window.addEventListener('resize', () => this.onResize());
        this.onResize();
        
        this.lastTime = performance.now();
        this.animate();
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        window.addEventListener('mousedown', (e) => {
            this.mouseButtons[e.button] = true;
        });
        
        window.addEventListener('mouseup', (e) => {
            this.mouseButtons[e.button] = false;
        });
        
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
        });
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.renderer.setSize(width, height);
        
        const halfWidth = width / 2;
        this.players[0].camera.aspect = halfWidth / height;
        this.players[0].camera.updateProjectionMatrix();
        
        this.players[1].camera.aspect = halfWidth / height;
        this.players[1].camera.updateProjectionMatrix();
    }

    spawnProjectile(position, direction, owner) {
        const proj = new Projectile(position, direction, owner);
        this.projectiles.push(proj);
        this.scene.add(proj.mesh);
    }

    update(dt) {
        this.smoke.update(dt);
        
        for (let i = 0; i < this.players.length; i++) {
            const otherPlayer = this.players[i === 0 ? 1 : 0];
            this.players[i].update(dt, this.world.objects, otherPlayer);
        }
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(dt, this.world.objects, this.players);
            
            if (!proj.active) {
                this.scene.remove(proj.mesh);
                this.projectiles.splice(i, 1);
            }
        }
    }

    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const halfWidth = Math.floor(width / 2);
        
        this.renderer.clear();
        
        // P1 viewport - left half
        this.renderer.setScissor(0, 0, halfWidth, height);
        this.renderer.setViewport(0, 0, halfWidth, height);
        this.renderer.render(this.scene, this.players[0].camera);
        
        // P2 viewport - right half
        this.renderer.setScissor(halfWidth, 0, halfWidth, height);
        this.renderer.setViewport(halfWidth, 0, halfWidth, height);
        this.renderer.render(this.scene, this.players[1].camera);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;
        
        this.update(dt);
        this.render();
    }
}

let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});
