// A Musketeer Duel Four - 2-Player Flintlock FPS
// Complete game with authentic iron sights and 12-step reload

// Ballistics Module - Authentic .69 cal Brown Bess
class Ballistics {
    constructor() {
        this.GRAVITY = 9.81;
        this.MUZZLE_VELOCITY = 320;
        this.BALL_DIAMETER = 0.0175;
        this.BALL_MASS = 0.035;
        this.DRAG_COEFFICIENT = 0.47;
        this.AIR_DENSITY = 1.225;
        this.CROSS_SECTIONAL_AREA = Math.PI * Math.pow(this.BALL_DIAMETER / 2, 2);
    }

    fire(origin, direction) {
        const velocity = direction.clone().multiplyScalar(this.MUZZLE_VELOCITY);
        return {
            origin: origin.clone(),
            position: origin.clone(),
            velocity: velocity,
            active: true,
            owner: null,
            mesh: null
        };
    }

    updateProjectiles(projectiles, deltaTime, scene, onHit) {
        const toRemove = [];
        for (let i = 0; i < projectiles.length; i++) {
            const proj = projectiles[i];
            if (!proj.active) continue;

            const speed = proj.velocity.length();
            const dragForce = 0.5 * this.AIR_DENSITY * Math.pow(speed, 2) * 
                             this.DRAG_COEFFICIENT * this.CROSS_SECTIONAL_AREA;
            const dragAccel = dragForce / this.BALL_MASS;
            const dragDir = proj.velocity.clone().normalize().negate();
            
            proj.velocity.add(dragDir.multiplyScalar(dragAccel * deltaTime));
            proj.velocity.y -= this.GRAVITY * deltaTime;
            
            proj.position.add(proj.velocity.clone().multiplyScalar(deltaTime));

            if (proj.position.y < 0.05 || Math.abs(proj.position.x) > 50 || Math.abs(proj.position.z) > 50) {
                proj.active = false;
                toRemove.push(i);
            } else if (onHit && onHit(proj.position, proj.owner)) {
                proj.active = false;
                toRemove.push(i);
            }

            if (proj.mesh) proj.mesh.position.copy(proj.position);
        }
        
        for (let i = toRemove.length - 1; i >= 0; i--) {
            const idx = toRemove[i];
            if (projectiles[idx].mesh) scene.remove(projectiles[idx].mesh);
            projectiles.splice(idx, 1);
        }
    }

    createProjectileMesh(scene) {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.BALL_DIAMETER / 2, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
        );
        scene.add(mesh);
        return mesh;
    }
}

// Iron Sights Module - Authentic Brown Bess sights
class IronSights {
    constructor() {
        this.SIGHT_RADIUS = 0.76;
        this.FRONT_HEIGHT = 0.015;
    }

    calculateAimDirection(camera, musketRotation = 0) {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        
        const up = new THREE.Vector3(0, 1, 0);
        up.applyQuaternion(camera.quaternion);
        
        // Bore axis is slightly below sight line
        const boreAxis = direction.clone();
        boreAxis.sub(up.clone().multiplyScalar(0.015));
        boreAxis.normalize();
        
        return { direction, boreAxis, up };
    }

    createMusketModel() {
        const musket = new THREE.Group();
        
        const woodMat = new THREE.MeshStandardMaterial({ 
            color: 0x4a3728, 
            roughness: 0.7, 
            metalness: 0.1 
        });
        const metalMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a, 
            roughness: 0.4, 
            metalness: 0.9 
        });
        const brassMat = new THREE.MeshStandardMaterial({
            color: 0x8a7a4a,
            roughness: 0.3,
            metalness: 0.8
        });
        
        // Barrel
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.014, 1.15, 8), 
            metalMat
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.28;
        musket.add(barrel);
        
        // Breech
        const breech = new THREE.Mesh(
            new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8),
            metalMat
        );
        breech.rotation.x = Math.PI / 2;
        breech.position.z = 0.32;
        musket.add(breech);
        
        // Stock
        const stock = new THREE.Mesh(
            new THREE.BoxGeometry(0.045, 0.09, 0.75), 
            woodMat
        );
        stock.position.set(0, -0.065, 0.28);
        musket.add(stock);
        
        // Buttplate
        const buttplate = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.12, 0.015),
            metalMat
        );
        buttplate.position.set(0, -0.04, 0.67);
        musket.add(buttplate);
        
        // Lock mechanism
        const lock = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.07, 0.09),
            metalMat
        );
        lock.position.set(0.025, 0.025, 0.22);
        musket.add(lock);
        
        // Frizzen
        const frizzen = new THREE.Mesh(
            new THREE.BoxGeometry(0.015, 0.04, 0.025),
            metalMat
        );
        frizzen.position.set(0.04, 0.05, 0.26);
        musket.add(frizzen);
        
        // Trigger guard
        const triggerGuard = new THREE.Mesh(
            new THREE.TorusGeometry(0.025, 0.004, 4, 12, Math.PI),
            brassMat
        );
        triggerGuard.rotation.z = Math.PI;
        triggerGuard.position.set(0, -0.09, 0.08);
        musket.add(triggerGuard);
        
        // Trigger
        const trigger = new THREE.Mesh(
            new THREE.CylinderGeometry(0.003, 0.003, 0.03),
            metalMat
        );
        trigger.rotation.x = Math.PI / 2;
        trigger.position.set(0, -0.075, 0.06);
        musket.add(trigger);
        
        // Front sight (blade) - positioned at muzzle
        const frontSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.002, 0.018, 0.003),
            metalMat
        );
        frontSight.position.set(0, 0.008, -0.85);
        musket.add(frontSight);
        
        // Rear sight (V-notch) - positioned near lock
        const rearSightBase = new THREE.Mesh(
            new THREE.BoxGeometry(0.012, 0.006, 0.008),
            metalMat
        );
        rearSightBase.position.set(0, 0.005, 0.18);
        musket.add(rearSightBase);
        
        const rearLeft = new THREE.Mesh(
            new THREE.BoxGeometry(0.002, 0.01, 0.003),
            metalMat
        );
        rearLeft.position.set(-0.004, 0.01, 0.18);
        musket.add(rearLeft);
        
        const rearRight = new THREE.Mesh(
            new THREE.BoxGeometry(0.002, 0.01, 0.003),
            metalMat
        );
        rearRight.position.set(0.004, 0.01, 0.18);
        musket.add(rearRight);
        
        // Ramrod (stored under barrel)
        const ramrod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.0035, 0.0035, 0.85, 6),
            metalMat
        );
        ramrod.rotation.x = Math.PI / 2;
        ramrod.position.set(0.022, -0.11, -0.08);
        ramrod.name = 'ramrod';
        musket.add(ramrod);
        
        // Ramrod pipes
        for (let i = 0; i < 3; i++) {
            const pipe = new THREE.Mesh(
                new THREE.CylinderGeometry(0.005, 0.005, 0.02, 6),
                brassMat
            );
            pipe.rotation.x = Math.PI / 2;
            pipe.position.set(0.022, -0.11, -0.3 + i * 0.25);
            musket.add(pipe);
        }
        
        return musket;
    }

    updateRamrodAnimation(musket, step, progress) {
        const ramrod = musket.getObjectByName('ramrod');
        if (!ramrod) return;
        
        // Step 7: Draw rammer, Step 8: Ram, Step 9: Return rammer
        switch(step) {
            case 7: // Drawing rammer
                ramrod.position.x = 0.022 + progress * 0.12;
                ramrod.rotation.z = progress * 0.5;
                break;
            case 8: // Ramming down barrel
                ramrod.position.x = 0;
                ramrod.rotation.z = 0;
                ramrod.position.z = -0.08 - progress * 0.5;
                break;
            case 9: // Returning rammer
                ramrod.position.x = progress * 0.022;
                ramrod.rotation.z = (1 - progress) * 0.5;
                ramrod.position.z = -0.58 + progress * 0.5;
                break;
            default:
                // Stored position
                ramrod.position.set(0.022, -0.11, -0.08);
                ramrod.rotation.z = 0;
        }
    }
}

// Musket Module - 12-step flintlock reload
class Musket {
    constructor(audioContext) {
        this.state = 'ready';
        this.loaded = true;
        this.cocked = true;
        this.isReloading = false;
        this.reloadStep = 0;
        this.reloadProgress = 0;
        this.currentStepStartTime = 0;
        this.audioContext = audioContext;
        
        // Authentic 12-step Brown Bess reload sequence
        this.reloadSteps = [
            { name: 'Half-cock', duration: 800, anim: 'halfcock' },
            { name: 'Open pan', duration: 600, anim: 'openpan' },
            { name: 'Prime pan', duration: 1200, anim: 'prime' },
            { name: 'Close pan', duration: 500, anim: 'closepan' },
            { name: 'Cast about', duration: 1000, anim: 'cast' },
            { name: 'Charge barrel', duration: 1500, anim: 'charge' },
            { name: 'Draw rammer', duration: 800, anim: 'draw' },
            { name: 'Ram cartridge', duration: 2000, anim: 'ram' },
            { name: 'Return rammer', duration: 800, anim: 'return' },
            { name: 'Full cock', duration: 600, anim: 'fullcock' },
            { name: 'Shoulder arms', duration: 800, anim: 'shoulder' },
            { name: 'Ready', duration: 0, anim: null }
        ];
        
        this.sights = new IronSights();
        this.model = this.sights.createMusketModel();
        this.reloadTimer = null;
    }

    fire() {
        if (!this.loaded || !this.cocked || this.isReloading) {
            return { fired: false, reason: this.getUnfireableReason() };
        }
        
        this.loaded = false;
        this.cocked = false;
        this.state = 'fired';
        
        this.playSound('fire');
        this.createMuzzleFlash();
        
        return { fired: true };
    }

    getUnfireableReason() {
        if (this.isReloading) return 'RELOADING';
        if (!this.loaded) return 'EMPTY';
        if (!this.cocked) return 'UNC0CKED';
        return 'UNKNOWN';
    }

    startReload() {
        if (this.isReloading || this.loaded) return false;
        
        this.isReloading = true;
        this.reloadStep = 0;
        this.reloadProgress = 0;
        this.currentStepStartTime = Date.now();
        
        this.processReloadStep();
        return true;
    }

    processReloadStep() {
        if (this.reloadStep >= this.reloadSteps.length - 1) {
            this.isReloading = false;
            this.loaded = true;
            this.cocked = true;
            this.state = 'ready';
            this.reloadStep = 0;
            return;
        }
        
        const step = this.reloadSteps[this.reloadStep];
        
        // Play step-specific sound
        this.playStepSound(step.anim);
        
        this.reloadTimer = setTimeout(() => {
            this.reloadStep++;
            this.currentStepStartTime = Date.now();
            this.processReloadStep();
        }, step.duration);
    }

    playStepSound(anim) {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        switch(anim) {
            case 'halfcock':
            case 'fullcock':
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
                osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.05);
                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
                osc.start();
                osc.stop(this.audioContext.currentTime + 0.05);
                break;
            case 'openpan':
            case 'closepan':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
                gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                osc.start();
                osc.stop(this.audioContext.currentTime + 0.1);
                break;
            case 'prime':
            case 'charge':
                // Pouring sound (noise)
                const bufferSize = this.audioContext.sampleRate * 0.3;
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * 0.1 * (1 - i / bufferSize);
                }
                const noise = this.audioContext.createBufferSource();
                noise.buffer = buffer;
                noise.connect(gain);
                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                noise.start();
                break;
        }
    }

    playSound(type) {
        if (!this.audioContext) return;
        
        if (type === 'fire') {
            // Gunshot noise
            const bufferSize = this.audioContext.sampleRate * 0.6;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.08));
            }
            const noise = this.audioContext.createBufferSource();
            noise.buffer = buffer;
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.9, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
            noise.connect(gain);
            gain.connect(this.audioContext.destination);
            noise.start();
        }
    }

    createMuzzleFlash() {
        const flash = new THREE.PointLight(0xffaa00, 8, 12);
        flash.position.set(0, 0, -0.9);
        this.model.add(flash);
        
        const flashMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({ 
                color: 0xffddaa, 
                transparent: true, 
                opacity: 0.9 
            })
        );
        flashMesh.position.set(0, 0, -0.9);
        this.model.add(flashMesh);
        
        // Smoke
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const smoke = new THREE.Mesh(
                    new THREE.SphereGeometry(0.04 + Math.random() * 0.04, 6, 6),
                    new THREE.MeshBasicMaterial({
                        color: 0x888888,
                        transparent: true,
                        opacity: 0.5
                    })
                );
                smoke.position.set(
                    (Math.random() - 0.5) * 0.08,
                    (Math.random() - 0.5) * 0.08,
                    -0.9
                );
                const vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    Math.random() * 0.5 + 0.2,
                    -0.8 - Math.random() * 0.5
                );
                this.model.add(smoke);
                
                let life = 1.0;
                const anim = () => {
                    smoke.position.add(vel.clone().multiplyScalar(0.016));
                    vel.y += 0.01;
                    life -= 0.02;
                    smoke.material.opacity = life * 0.5;
                    smoke.scale.multiplyScalar(1.02);
                    if (life > 0) requestAnimationFrame(anim);
                    else this.model.remove(smoke);
                };
                anim();
            }, i * 40);
        }
        
        setTimeout(() => {
            this.model.remove(flash);
            this.model.remove(flashMesh);
        }, 60);
    }

    cancelReload() {
        if (this.reloadTimer) {
            clearTimeout(this.reloadTimer);
            this.reloadTimer = null;
        }
        this.isReloading = false;
        this.reloadStep = 0;
    }

    getReloadStatus() {
        if (!this.isReloading) return null;
        return {
            step: this.reloadStep,
            totalSteps: this.reloadSteps.length - 1,
            name: this.reloadSteps[this.reloadStep].name
        };
    }

    getStepProgress() {
        if (!this.isReloading) return 0;
        const step = this.reloadSteps[this.reloadStep];
        const elapsed = Date.now() - this.currentStepStartTime;
        return Math.min(1, elapsed / step.duration);
    }

    update(deltaTime, isAiming, musketRotation) {
        // Base position (hip)
        let targetPos = new THREE.Vector3(0.12, -0.18, 0.25);
        let targetRot = new THREE.Euler(0, 0, musketRotation);
        
        if (isAiming) {
            // Shouldered position
            targetPos = new THREE.Vector3(0, -0.06, 0.12);
        } else if (this.isReloading) {
            // Apply reload animation positions
            this.applyReloadAnimation(targetPos, targetRot);
        }
        
        // Smooth interpolation
        this.model.position.lerp(targetPos, 10 * deltaTime);
        this.model.rotation.x += (targetRot.x - this.model.rotation.x) * 10 * deltaTime;
        this.model.rotation.y += (targetRot.y - this.model.rotation.y) * 10 * deltaTime;
        this.model.rotation.z = musketRotation;
        
        // Update ramrod animation
        if (this.isReloading) {
            this.sights.updateRamrodAnimation(this.model, this.reloadStep, this.getStepProgress());
        } else {
            this.sights.updateRamrodAnimation(this.model, -1, 0);
        }
    }

    applyReloadAnimation(pos, rot) {
        const step = this.reloadStep;
        const progress = this.getStepProgress();
        
        switch(step) {
            case 0: // Half-cock
                pos.set(0.1, -0.12, 0.22);
                rot.x = 0.1;
                break;
            case 1: // Open pan
                pos.set(0.12, -0.08, 0.18);
                rot.x = 0.3;
                break;
            case 2: // Prime pan
                pos.set(0.08, -0.04, 0.15);
                rot.x = 0.4;
                break;
            case 3: // Close pan
                pos.set(0.1, -0.1, 0.2);
                rot.x = 0.15;
                break;
            case 4: // Cast about
                pos.set(0, -0.02, 0.1);
                rot.x = -0.6 * progress;
                break;
            case 5: // Charge barrel
                pos.set(0, 0.12, 0.05);
                rot.x = -0.9;
                break;
            case 6: // Draw rammer
                pos.set(0.1, -0.06, 0.18);
                rot.x = -0.1;
                break;
            case 7: // Ram
                pos.set(0.05, 0, 0.12);
                rot.x = -0.25;
                break;
            case 8: // Return rammer
                pos.set(0.1, -0.08, 0.2);
                rot.x = 0;
                break;
            case 9: // Full cock
                pos.set(0.12, -0.14, 0.22);
                rot.x = 0.05;
                break;
            case 10: // Shoulder arms
                pos.set(0.12, -0.18, 0.25);
                rot.x *= (1 - progress);
                break;
        }
    }

    getMuzzlePosition() {
        const muzzleLocal = new THREE.Vector3(0, 0, -0.85);
        muzzleLocal.applyMatrix4(this.model.matrixWorld);
        return muzzleLocal;
    }
}

// Player Module
class Player {
    constructor(id, startPosition, controls) {
        this.id = id;
        this.position = startPosition.clone();
        this.rotation = new THREE.Euler(0, 0, 0);
        this.musketRotation = 0;
        this.velocity = new THREE.Vector3();
        this.speed = 3.0;
        this.height = 1.7;
        this.radius = 0.3;
        
        this.controls = controls;
        this.keys = {};
        
        this.camera = null;
        this.musket = null;
        
        this.health = 100;
        this.isAiming = false;
        
        this.sights = new IronSights();
        this.ballistics = new Ballistics();
        this.projectiles = [];
        
        this.maxMusketRotation = 0.5;
        this.mapBounds = { minX: -25, maxX: 25, minZ: -25, maxZ: 25 };
        
        // Input tracking
        this.firePressed = false;
        this.reloadPressed = false;
    }

    init(scene, audioContext) {
        this.scene = scene;
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.camera.position.copy(this.position);
        this.camera.position.y = this.height;
        
        this.musket = new Musket(audioContext);
        scene.add(this.musket.model);
        
        this.updateCamera();
    }

    setKey(key, pressed) {
        this.keys[key] = pressed;
    }

    update(deltaTime, otherPlayer) {
        this.handleInput(deltaTime);
        this.applyMovement(deltaTime);
        this.checkPlayerCollision(otherPlayer);
        
        if (this.musket) {
            this.musket.update(deltaTime, this.isAiming, this.musketRotation);
        }
        
        this.updateCamera();
        
        // Update projectiles with hit detection
        this.ballistics.updateProjectiles(
            this.projectiles,
            deltaTime,
            this.scene,
            (pos, owner) => this.checkProjectileHit(pos, owner, otherPlayer)
        );
    }

    handleInput(deltaTime) {
        const c = this.controls;
        
        // Movement
        let moveForward = 0;
        let moveRight = 0;
        
        if (this.keys[c.forward]) moveForward += 1;
        if (this.keys[c.backward]) moveForward -= 1;
        if (this.keys[c.left]) moveRight -= 1;
        if (this.keys[c.right]) moveRight += 1;
        
        if (moveForward !== 0 && moveRight !== 0) {
            const len = Math.sqrt(moveForward * moveForward + moveRight * moveRight);
            moveForward /= len;
            moveRight /= len;
        }
        
        this.velocity.set(0, 0, 0);
        if (moveForward !== 0 || moveRight !== 0) {
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
            forward.y = 0;
            forward.normalize();
            
            const right = new THREE.Vector3(1, 0, 0);
            right.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
            right.y = 0;
            right.normalize();
            
            this.velocity.add(forward.multiplyScalar(moveForward * this.speed));
            this.velocity.add(right.multiplyScalar(moveRight * this.speed));
        }
        
        // Musket rotation (Q/E or U/O)
        if (this.keys[c.rotateLeft]) {
            this.musketRotation += 1.5 * deltaTime;
        }
        if (this.keys[c.rotateRight]) {
            this.musketRotation -= 1.5 * deltaTime;
        }
        this.musketRotation = Math.max(-this.maxMusketRotation, 
                                       Math.min(this.maxMusketRotation, this.musketRotation));
        
        if (!this.keys[c.rotateLeft] && !this.keys[c.rotateRight]) {
            this.musketRotation *= 0.95;
        }
        
        // Aiming
        this.isAiming = !!this.keys[c.aim];
        
        // Fire (edge detection)
        if (this.keys[c.fire] && !this.firePressed) {
            this.fire();
            this.firePressed = true;
        } else if (!this.keys[c.fire]) {
            this.firePressed = false;
        }
        
        // Reload (edge detection)
        if (this.keys[c.reload] && !this.reloadPressed) {
            this.musket.startReload();
            this.reloadPressed = true;
        } else if (!this.keys[c.reload]) {
            this.reloadPressed = false;
        }
    }

    applyMovement(deltaTime) {
        const newPos = this.position.clone();
        newPos.x += this.velocity.x * deltaTime;
        newPos.z += this.velocity.z * deltaTime;
        
        newPos.x = Math.max(this.mapBounds.minX + this.radius,
                           Math.min(this.mapBounds.maxX - this.radius, newPos.x));
        newPos.z = Math.max(this.mapBounds.minZ + this.radius,
                           Math.min(this.mapBounds.maxZ - this.radius, newPos.z));
        
        this.position.copy(newPos);
    }

    checkPlayerCollision(otherPlayer) {
        if (!otherPlayer) return;
        
        const dx = this.position.x - otherPlayer.position.x;
        const dz = this.position.z - otherPlayer.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const minDist = this.radius + otherPlayer.radius;
        
        if (dist < minDist && dist > 0) {
            const push = (minDist - dist) / dist * 0.5;
            this.position.x += dx * push;
            this.position.z += dz * push;
        }
    }

    fire() {
        if (!this.musket) return;
        
        const result = this.musket.fire();
        if (result.fired) {
            // Fire from muzzle through aligned sights (NOT camera center)
            const aimData = this.sights.calculateAimDirection(this.camera, this.musketRotation);
            const muzzlePos = this.musket.getMuzzlePosition();
            
            const projectile = this.ballistics.fire(muzzlePos, aimData.boreAxis);
            projectile.owner = this.id;
            projectile.mesh = this.ballistics.createProjectileMesh(this.scene);
            
            this.projectiles.push(projectile);
        }
    }

    checkProjectileHit(pos, owner, otherPlayer) {
        if (!otherPlayer || otherPlayer.health <= 0 || owner !== this.id) return false;
        
        const dx = pos.x - otherPlayer.position.x;
        const dz = pos.z - otherPlayer.position.z;
        const dy = pos.y - (otherPlayer.position.y + 1.0);
        const distSq = dx * dx + dy * dy + dz * dz;
        
        if (distSq < 0.16) { // Hit radius
            otherPlayer.takeDamage(50);
            return true;
        }
        return false;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
    }

    updateCamera() {
        if (!this.camera) return;
        
        this.camera.position.set(this.position.x, this.height, this.position.z);
        this.camera.rotation.copy(this.rotation);
        
        if (this.musket) {
            this.camera.add(this.musket.model);
            
            // FOV change when aiming
            const targetFOV = this.isAiming ? 45 : 75;
            this.camera.fov += (targetFOV - this.camera.fov) * 0.1;
            this.camera.updateProjectionMatrix();
        }
    }

    getStatus() {
        return {
            health: this.health,
            ammo: this.musket ? 
                (this.musket.loaded ? 'READY' : 
                 this.musket.isReloading ? 'RELOADING' : 'EMPTY') : 'UNKNOWN',
            reloadStatus: this.musket ? this.musket.getReloadStatus() : null
        };
    }

    isDead() {
        return this.health <= 0;
    }
}

// Main Game Controller
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 15, 80);
        
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.halfWidth = this.screenWidth / 2;
        
        this.audioContext = null;
        this.running = false;
        this.clock = new THREE.Clock();
        
        this.createMap();
        this.setupPlayers();
        this.setupInput();
        
        window.addEventListener('resize', () => this.onResize());
        document.getElementById('start-btn').addEventListener('click', () => this.start());
    }

    createMap() {
        // Ground with slight unevenness
        const groundGeo = new THREE.PlaneGeometry(60, 60, 32, 32);
        const positions = groundGeo.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = Math.sin(x * 0.08) * Math.cos(y * 0.08) * 0.4;
            positions.setZ(i, z);
        }
        groundGeo.computeVertexNormals();
        
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: 0x4a6741, 
            roughness: 0.9 
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Lighting
        this.scene.add(new THREE.AmbientLight(0x404040, 0.6));
        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        this.scene.add(sun);
        
        // Stone walls as obstacles
        const walls = [
            { x: -10, z: -10, w: 4, h: 2 },
            { x: 10, z: -15, w: 2, h: 4 },
            { x: -15, z: 5, w: 6, h: 1 },
            { x: 12, z: 8, w: 3, h: 3 },
            { x: 0, z: -20, w: 8, h: 1 },
            { x: -8, z: 15, w: 2, h: 5 },
            { x: 18, z: 0, w: 1, h: 6 },
            { x: -20, z: -5, w: 1, h: 4 }
        ];
        
        this.obstacles = [];
        for (const w of walls) {
            const wall = new THREE.Mesh(
                new THREE.BoxGeometry(w.w, 2.5, w.h),
                new THREE.MeshStandardMaterial({ color: 0x5a5a5a })
            );
            wall.position.set(w.x, 1.25, w.z);
            this.scene.add(wall);
            this.obstacles.push({ x: w.x, z: w.z, radius: Math.max(w.w, w.h) / 2 + 0.4 });
        }
        
        // Barrels
        for (let i = 0; i < 6; i++) {
            const x = (Math.random() - 0.5) * 35;
            const z = (Math.random() - 0.5) * 35;
            const barrel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.3, 1.2, 12),
                new THREE.MeshStandardMaterial({ color: 0x4a3728 })
            );
            barrel.position.set(x, 0.6, z);
            this.scene.add(barrel);
            this.obstacles.push({ x, z, radius: 0.5 });
        }
    }

    setupPlayers() {
        // Player 1 controls
        const p1Controls = {
            forward: 'w',
            backward: 's',
            left: 'a',
            right: 'd',
            rotateLeft: 'q',
            rotateRight: 'e',
            aim: 'x',
            fire: 'f',
            reload: 'r'
        };
        
        // Player 2 controls - Enter for fire, P for reload
        const p2Controls = {
            forward: 'i',
            backward: 'k',
            left: 'j',
            right: 'l',
            rotateLeft: 'u',
            rotateRight: 'o',
            aim: 'm',
            fire: 'enter',
            reload: 'p'
        };
        
        this.player1 = new Player(1, new THREE.Vector3(-12, 0, 0), p1Controls);
        this.player2 = new Player(2, new THREE.Vector3(12, 0, 0), p2Controls);
        this.player1.obstacles = this.obstacles;
        this.player2.obstacles = this.obstacles;
    }

    setupInput() {
        // Track which player the mouse is over for look control
        this.mouseOverPlayer = null;
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            
            // Determine which player's half the mouse is in
            if (x < this.halfWidth) {
                this.mouseOverPlayer = 1;
                if (this.player1 && this.running && !this.player1.isDead()) {
                    const sensitivity = 0.002;
                    this.player1.rotation.y -= e.movementX * sensitivity;
                }
            } else {
                this.mouseOverPlayer = 2;
                if (this.player2 && this.running && !this.player2.isDead()) {
                    const sensitivity = 0.002;
                    this.player2.rotation.y -= e.movementX * sensitivity;
                }
            }
        });
        
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            
            // Prevent browser actions
            if (key === 'f' || key === 'r' || key === 'x') {
                e.preventDefault();
            }
            
            // Player 1
            if (this.player1) {
                const c = this.player1.controls;
                if (key === c.forward) this.player1.setKey(c.forward, true);
                if (key === c.backward) this.player1.setKey(c.backward, true);
                if (key === c.left) this.player1.setKey(c.left, true);
                if (key === c.right) this.player1.setKey(c.right, true);
                if (key === c.rotateLeft) this.player1.setKey(c.rotateLeft, true);
                if (key === c.rotateRight) this.player1.setKey(c.rotateRight, true);
                if (key === c.aim) this.player1.setKey(c.aim, true);
                if (key === c.fire) this.player1.setKey(c.fire, true);
                if (key === c.reload) this.player1.setKey(c.reload, true);
            }
            
            // Player 2
            if (this.player2) {
                const c = this.player2.controls;
                if (key === c.forward) this.player2.setKey(c.forward, true);
                if (key === c.backward) this.player2.setKey(c.backward, true);
                if (key === c.left) this.player2.setKey(c.left, true);
                if (key === c.right) this.player2.setKey(c.right, true);
                if (key === c.rotateLeft) this.player2.setKey(c.rotateLeft, true);
                if (key === c.rotateRight) this.player2.setKey(c.rotateRight, true);
                if (key === c.aim) this.player2.setKey(c.aim, true);
                if (key === c.reload) this.player2.setKey(c.reload, true);
                if (e.key === 'Enter') this.player2.setKey('enter', true);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            
            if (this.player1) {
                const c = this.player1.controls;
                if (key === c.forward) this.player1.setKey(c.forward, false);
                if (key === c.backward) this.player1.setKey(c.backward, false);
                if (key === c.left) this.player1.setKey(c.left, false);
                if (key === c.right) this.player1.setKey(c.right, false);
                if (key === c.rotateLeft) this.player1.setKey(c.rotateLeft, false);
                if (key === c.rotateRight) this.player1.setKey(c.rotateRight, false);
                if (key === c.aim) this.player1.setKey(c.aim, false);
                if (key === c.fire) this.player1.setKey(c.fire, false);
                if (key === c.reload) this.player1.setKey(c.reload, false);
            }
            
            if (this.player2) {
                const c = this.player2.controls;
                if (key === c.forward) this.player2.setKey(c.forward, false);
                if (key === c.backward) this.player2.setKey(c.backward, false);
                if (key === c.left) this.player2.setKey(c.left, false);
                if (key === c.right) this.player2.setKey(c.right, false);
                if (key === c.rotateLeft) this.player2.setKey(c.rotateLeft, false);
                if (key === c.rotateRight) this.player2.setKey(c.rotateRight, false);
                if (key === c.aim) this.player2.setKey(c.aim, false);
                if (key === c.reload) this.player2.setKey(c.reload, false);
                if (e.key === 'Enter') this.player2.setKey('enter', false);
            }
        });
    }

    start() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        this.player1.init(this.scene, this.audioContext);
        this.player2.init(this.scene, this.audioContext);
        
        // Face each other
        this.player1.rotation.y = Math.PI / 2;
        this.player2.rotation.y = -Math.PI / 2;
        
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('ui-overlay').style.display = 'flex';
        
        this.running = true;
        this.animate();
    }

    onResize() {
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.halfWidth = this.screenWidth / 2;
        
        this.renderer.setSize(this.screenWidth, this.screenHeight);
        
        if (this.player1 && this.player1.camera) {
            this.player1.camera.aspect = this.halfWidth / this.screenHeight;
            this.player1.camera.updateProjectionMatrix();
        }
        if (this.player2 && this.player2.camera) {
            this.player2.camera.aspect = this.halfWidth / this.screenHeight;
            this.player2.camera.updateProjectionMatrix();
        }
    }

    animate() {
        if (!this.running) return;
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = Math.min(this.clock.getDelta(), 0.1);
        
        if (this.player1 && !this.player1.isDead()) {
            this.player1.update(deltaTime, this.player2);
        }
        if (this.player2 && !this.player2.isDead()) {
            this.player2.update(deltaTime, this.player1);
        }
        
        this.updateUI();
        this.checkWinCondition();
        this.render();
    }

    render() {
        this.renderer.setScissorTest(true);
        
        // Player 1 view (left half)
        if (this.player1 && this.player1.camera) {
            this.renderer.setViewport(0, 0, this.halfWidth, this.screenHeight);
            this.renderer.setScissor(0, 0, this.halfWidth, this.screenHeight);
            this.renderer.render(this.scene, this.player1.camera);
        }
        
        // Player 2 view (right half)
        if (this.player2 && this.player2.camera) {
            this.renderer.setViewport(this.halfWidth, 0, this.halfWidth, this.screenHeight);
            this.renderer.setScissor(this.halfWidth, 0, this.halfWidth, this.screenHeight);
            this.renderer.render(this.scene, this.player2.camera);
        }
        
        this.renderer.setScissorTest(false);
    }

    updateUI() {
        if (!this.player1 || !this.player2) return;
        
        const p1s = this.player1.getStatus();
        document.getElementById('p1-health').textContent = Math.ceil(p1s.health);
        const p1a = document.getElementById('p1-ammo');
        p1a.textContent = p1s.ammo;
        p1a.className = 'ammo' + (p1s.ammo === 'EMPTY' ? ' empty' : 
                                  p1s.ammo === 'RELOADING' ? ' reloading' : '');
        document.getElementById('p1-reload').textContent = p1s.reloadStatus ? 
            `${p1s.reloadStatus.step + 1}/${p1s.reloadStatus.totalSteps}: ${p1s.reloadStatus.name}` : '';
        
        const p2s = this.player2.getStatus();
        document.getElementById('p2-health').textContent = Math.ceil(p2s.health);
        const p2a = document.getElementById('p2-ammo');
        p2a.textContent = p2s.ammo;
        p2a.className = 'ammo' + (p2s.ammo === 'EMPTY' ? ' empty' : 
                                  p2s.ammo === 'RELOADING' ? ' reloading' : '');
        document.getElementById('p2-reload').textContent = p2s.reloadStatus ? 
            `${p2s.reloadStatus.step + 1}/${p2s.reloadStatus.totalSteps}: ${p2s.reloadStatus.name}` : '';
    }

    checkWinCondition() {
        if (this.player1.isDead() || this.player2.isDead()) {
            const winner = this.player1.isDead() ? 'Player 2' : 'Player 1';
            this.running = false;
            
            const overlay = document.createElement('div');
            overlay.id = 'winner-overlay';
            overlay.innerHTML = `
                <h2>${winner} WINS!</h2>
                <button onclick="location.reload()">DUEL AGAIN</button>
            `;
            document.body.appendChild(overlay);
            overlay.style.display = 'flex';
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});