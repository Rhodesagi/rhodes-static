// Musket weapon with historically accurate reloading process
class Musket {
    constructor(scene, camera, isPlayer2 = false) {
        this.scene = scene;
        this.camera = camera;
        this.isPlayer2 = isPlayer2;
        
        // Reload states
        this.RELOAD_STATES = {
            READY: 'ready',
            PRIMING: 'priming',      // Cocking hammer, placing flint
            POWDERING: 'powdering',  // Pouring powder into barrel
            LOADING: 'loading',      // Inserting ball and patch
            RAMROD: 'ramrod',        // Ramming charge home
            AIMING: 'aiming'         // Iron sights engaged
        };
        
        this.state = this.RELOAD_STATES.READY;
        this.loaded = true; // Start with loaded musket
        this.stateTimer = 0;
        
        // Timing (seconds) - historically ~15-20 seconds for trained soldier
        this.TIMINGS = {
            priming: 2.0,
            powdering: 3.0,
            loading: 2.5,
            ramrod: 4.0
        };
        
        // Visual elements
        this.weaponGroup = new THREE.Group();
        this.barrelEnd = new THREE.Vector3();
        this.createMusketModel();
        
        // Firing
        this.lastFireTime = 0;
        this.fireCooldown = 0.5;
        
        // Animation
        this.recoilOffset = 0;
        this.swayTime = 0;
        this.isAiming = false;
        this.baseFOV = 75;
        this.aimFOV = 35;
        
        // Flash particle system
        this.flashLight = null;
        this.createMuzzleFlash();
    }
    
    createMusketModel() {
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.8 });
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xb5a642, roughness: 0.2, metalness: 0.9 });
        
        // Stock
        const stockGeo = new THREE.BoxGeometry(0.08, 0.12, 0.6);
        const stock = new THREE.Mesh(stockGeo, woodMat);
        stock.position.set(0.15, -0.1, 0.2);
        stock.rotation.x = -0.1;
        this.weaponGroup.add(stock);
        
        // Buttplate
        const buttGeo = new THREE.BoxGeometry(0.09, 0.14, 0.05);
        const butt = new THREE.Mesh(buttGeo, metalMat);
        butt.position.set(0.15, -0.08, 0.52);
        this.weaponGroup.add(butt);
        
        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.9, 12);
        const barrel = new THREE.Mesh(barrelGeo, metalMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0.15, 0.05, -0.25);
        this.weaponGroup.add(barrel);
        
        // Barrel bands
        for (let i = 0; i < 3; i++) {
            const bandGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.04, 12);
            const band = new THREE.Mesh(bandGeo, brassMat);
            band.rotation.x = Math.PI / 2;
            band.position.set(0.15, 0.05, -0.05 - i * 0.25);
            this.weaponGroup.add(band);
        }
        
        // Flintlock mechanism
        const lockPlateGeo = new THREE.BoxGeometry(0.06, 0.12, 0.08);
        const lockPlate = new THREE.Mesh(lockPlateGeo, metalMat);
        lockPlate.position.set(0.22, 0.02, -0.15);
        this.weaponGroup.add(lockPlate);
        
        // Hammer
        const hammerGeo = new THREE.BoxGeometry(0.03, 0.08, 0.03);
        this.hammer = new THREE.Mesh(hammerGeo, metalMat);
        this.hammer.position.set(0.22, 0.08, -0.18);
        this.hammer.rotation.z = -0.3;
        this.weaponGroup.add(this.hammer);
        
        // Frizzen
        const frizzenGeo = new THREE.BoxGeometry(0.02, 0.06, 0.04);
        const frizzen = new THREE.Mesh(frizzenGeo, metalMat);
        frizzen.position.set(0.22, 0.05, -0.12);
        this.weaponGroup.add(frizzen);
        
        // Trigger guard
        const guardGeo = new THREE.TorusGeometry(0.04, 0.008, 6, 12, Math.PI);
        const guard = new THREE.Mesh(guardGeo, brassMat);
        guard.rotation.z = Math.PI;
        guard.position.set(0.15, -0.06, 0.05);
        this.weaponGroup.add(guard);
        
        // Trigger
        const triggerGeo = new THREE.BoxGeometry(0.015, 0.04, 0.015);
        const trigger = new THREE.Mesh(triggerGeo, metalMat);
        trigger.position.set(0.15, -0.06, 0.05);
        trigger.rotation.x = -0.3;
        this.weaponGroup.add(trigger);
        
        // Ramrod (stored under barrel)
        const ramrodGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.7, 8);
        this.ramrod = new THREE.Mesh(ramrodGeo, metalMat);
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrod.position.set(0.15, -0.08, -0.25);
        this.weaponGroup.add(this.ramrod);
        
        // Ramrod thimbles
        for (let i = 0; i < 3; i++) {
            const thimbleGeo = new THREE.TorusGeometry(0.015, 0.004, 6, 12);
            const thimble = new THREE.Mesh(thimbleGeo, brassMat);
            thimble.rotation.y = Math.PI / 2;
            thimble.position.set(0.15, -0.08, -0.05 - i * 0.25);
            this.weaponGroup.add(thimble);
        }
        
        // Front sight
        const sightGeo = new THREE.BoxGeometry(0.008, 0.03, 0.02);
        const sight = new THREE.Mesh(sightGeo, metalMat);
        sight.position.set(0.15, 0.15, -0.65);
        this.weaponGroup.add(sight);
        
        // Attach to camera
        this.camera.add(this.weaponGroup);
        this.weaponGroup.traverse((child) => { if (child.isMesh) child.layers.set(isPlayer2 ? 2 : 1); });
        this.weaponGroup.position.set(0.25, -0.2, -0.5);
        
        // Barrel end position for raycasting
        this.barrelOffset = new THREE.Vector3(0, 0.05, -0.7);
    }
    
    createMuzzleFlash() {
        this.flashLight = new THREE.PointLight(0xffaa00, 0, 8);
        this.flashLight.position.set(0, 0.05, -0.7);
        this.weaponGroup.add(this.flashLight);
        
        // Flash sprite
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 150, 50, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 80, 20, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        this.flashSprite = new THREE.Sprite(spriteMat);
        this.flashSprite.scale.set(0.5, 0.5, 0.5);
        this.flashSprite.position.set(0, 0.05, -0.75);
        this.flashSprite.visible = false;
        this.weaponGroup.add(this.flashSprite);
    }
    
    update(delta, input) {
        this.swayTime += delta;
        
        // Handle aiming
        this.isAiming = input.aim && this.state === this.RELOAD_STATES.READY;
        const targetFOV = this.isAiming ? this.aimFOV : this.baseFOV;
        this.camera.fov += (targetFOV - this.camera.fov) * delta * 5;
        this.camera.updateProjectionMatrix();
        
        // Weapon position for iron sights
        if (this.isAiming) {
            this.weaponGroup.position.lerp(new THREE.Vector3(0, -0.12, -0.3), delta * 8);
            this.weaponGroup.rotation.z = THREE.MathUtils.lerp(this.weaponGroup.rotation.z, -0.02, delta * 8);
        } else {
            this.weaponGroup.position.lerp(new THREE.Vector3(0.25, -0.2, -0.5), delta * 8);
            this.weaponGroup.rotation.z = THREE.MathUtils.lerp(this.weaponGroup.rotation.z, 0, delta * 8);
        }
        
        // Breathing sway
        const swayX = Math.sin(this.swayTime * 0.8) * 0.002;
        const swayY = Math.cos(this.swayTime * 0.6) * 0.003;
        this.weaponGroup.position.x += swayX;
        this.weaponGroup.position.y += swayY;
        
        // Handle reloading state machine
        if (input.reload && this.state === this.RELOAD_STATES.READY && !this.loaded) {
            this.startReload();
        }
        
        this.updateReloadState(delta);
        
        // Recoil recovery
        this.recoilOffset *= 0.9;
        this.weaponGroup.position.z -= this.recoilOffset;
        
        // Update flash
        if (this.flashSprite.visible) {
            this.flashIntensity -= delta * 15;
            if (this.flashIntensity <= 0) {
                this.flashSprite.visible = false;
                this.flashLight.intensity = 0;
            } else {
                this.flashLight.intensity = this.flashIntensity;
                this.flashSprite.material.opacity = this.flashIntensity / 8;
            }
        }
    }
    
    startReload() {
        this.state = this.RELOAD_STATES.PRIMING;
        this.stateTimer = 0;
    }
    
    updateReloadState(delta) {
        if (this.state === this.RELOAD_STATES.READY) return;
        
        this.stateTimer += delta;
        
        // Animate based on state
        switch (this.state) {
            case this.RELOAD_STATES.PRIMING:
                // Cock hammer
                this.hammer.rotation.z = -0.3 - (this.stateTimer / this.TIMINGS.priming) * 0.5;
                if (this.stateTimer >= this.TIMINGS.priming) {
                    this.state = this.RELOAD_STATES.POWDERING;
                    this.stateTimer = 0;
                }
                break;
                
            case this.RELOAD_STATES.POWDERING:
                // Tilt musket for powder
                this.weaponGroup.rotation.x = Math.sin(this.stateTimer * 3) * 0.1 - 0.2;
                if (this.stateTimer >= this.TIMINGS.powdering) {
                    this.weaponGroup.rotation.x = 0;
                    this.state = this.RELOAD_STATES.LOADING;
                    this.stateTimer = 0;
                }
                break;
                
            case this.RELOAD_STATES.LOADING:
                // Lower muzzle
                this.weaponGroup.rotation.x = -0.3 * (1 - this.stateTimer / this.TIMINGS.loading);
                if (this.stateTimer >= this.TIMINGS.loading) {
                    this.weaponGroup.rotation.x = 0;
                    this.state = this.RELOAD_STATES.RAMROD;
                    this.stateTimer = 0;
                }
                break;
                
            case this.RELOAD_STATES.RAMROD:
                // Animate ramrod
                const rodProgress = this.stateTimer / this.TIMINGS.ramrod;
                this.ramrod.position.z = -0.25 + Math.sin(rodProgress * Math.PI * 4) * 0.3;
                this.ramrod.position.y = -0.08 + Math.abs(Math.sin(rodProgress * Math.PI * 4)) * 0.15;
                
                if (this.stateTimer >= this.TIMINGS.ramrod) {
                    this.ramrod.position.set(0.15, -0.08, -0.25);
                    this.state = this.RELOAD_STATES.READY;
                    this.loaded = true;
                    this.stateTimer = 0;
                    this.hammer.rotation.z = -0.3;
                }
                break;
        }
    }
    
    canFire() {
        return this.loaded && this.state === this.RELOAD_STATES.READY && !this.isAiming;
    }
    
    fire() {
        if (!this.canFire()) return null;
        
        this.loaded = false;
        this.recoilOffset = 0.15;
        
        // Muzzle flash
        this.flashSprite.visible = true;
        this.flashIntensity = 8;
        this.flashLight.intensity = 8;
        
        // Play sound
        this.playFireSound();
        
        // Hammer falls
        this.hammer.rotation.z = 0.2;
        
        // Get barrel world position for raycast origin
        const barrelWorldPos = new THREE.Vector3();
        // Barrel offset will be transformed below
        
        // Calculate spread (smoothbore musket accuracy)
        const spreadX = (Math.random() - 0.5) * 0.03;
        const spreadY = (Math.random() - 0.5) * 0.03;
        
        const direction = new THREE.Vector3(spreadX, spreadY, -1);
        direction.applyQuaternion(this.camera.quaternion);
        direction.normalize();
        
        // Get actual world position of barrel
        this.weaponGroup.localToWorld(barrelWorldPos.copy(this.barrelOffset));
        
        return {
            origin: barrelWorldPos,
            direction: direction,
            velocity: 150, // m/s approximate for musket ball
            damage: 100
        };
    }
    
    getReloadStatus() {
        if (this.state === this.RELOAD_STATES.READY) {
            return this.loaded ? "Ready" : "Empty - Press Reload";
        }
        return this.state.charAt(0).toUpperCase() + this.state.slice(1);
    }
}

    playFireSound() {
        // Create audio context on first user interaction
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const ctx = window.audioContext;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        
        // Create gunshot sound using white noise
        const bufferSize = ctx.sampleRate * 0.3; // 300ms
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
        }
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        // Lowpass filter for muffled boom
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        source.start();
    }
