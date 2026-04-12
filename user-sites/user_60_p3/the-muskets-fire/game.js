// ============================================
// THE MUSKETS FIRE - 2-Player Split-Screen FPS
// Iron sight aiming, procedural reloading, physics ballistics
// ============================================

// Global game state
const Game = {
    renderer: null,
    scene: null,
    canvas: null,
    isRunning: false,
    players: [],
    projectiles: [],
    lastTime: 0,
    audioContext: null,
    keyState: {},
    gamepadIndex: null,
    globalDeltaTime: 0.016
};

// ============================================
// MUSKET CLASS - Procedural Model + Animation
// ============================================
class Musket {
    constructor(scene, isPlayer2) {
        this.scene = scene;
        this.isPlayer2 = isPlayer2;
        this.root = new THREE.Group();
        
        // Animation state
        this.state = 'idle'; // idle, aiming, reloading, firing
        this.reloadProgress = 0;
        this.reloadStage = 0;
        this.reloadTime = 0;
        this.isLoaded = true;
        this.isPrimed = true;
        
        // Animation bones (skeletal hierarchy)
        this.bones = {};
        
        // Materials
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        const metalMat = new THREE.MeshStandardMaterial({ 
            color: 0x444444, 
            roughness: 0.7, 
            metalness: 0.8 
        });
        const brassMat = new THREE.MeshStandardMaterial({ 
            color: 0xb5a642, 
            roughness: 0.4, 
            metalness: 0.9 
        });
        const darkMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        
        // Main stock (wood)
        const stockGeo = new THREE.BoxGeometry(0.12, 0.08, 0.8);
        this.stock = new THREE.Mesh(stockGeo, woodMat);
        this.stock.position.set(0, -0.05, -0.2);
        this.root.add(this.stock);
        
        // Barrel group (for animation)
        this.barrelGroup = new THREE.Group();
        this.barrelGroup.position.set(0, 0.02, 0.3);
        this.root.add(this.barrelGroup);
        
        // Main barrel (metal)
        const barrelGeo = new THREE.CylinderGeometry(0.03, 0.035, 1.2, 16);
        this.barrel = new THREE.Mesh(barrelGeo, metalMat);
        this.barrel.rotation.x = Math.PI / 2;
        this.barrelGroup.add(this.barrel);
        
        // Front sight (iron blade)
        const frontSightGeo = new THREE.BoxGeometry(0.02, 0.06, 0.01);
        this.frontSight = new THREE.Mesh(frontSightGeo, darkMat);
        this.frontSight.position.set(0, 0.05, 0.55);
        this.barrelGroup.add(this.frontSight);
        
        // Rear sight (notch) - positioned for iron sight alignment
        const rearSightBaseGeo = new THREE.BoxGeometry(0.04, 0.03, 0.02);
        this.rearSightBase = new THREE.Mesh(rearSightBaseGeo, darkMat);
        this.rearSightBase.position.set(0, 0.04, -0.55);
        this.barrelGroup.add(this.rearSightBase);
        
        // Hammer (cock mechanism) - animated
        this.hammerGroup = new THREE.Group();
        this.hammerGroup.position.set(0, 0.05, -0.45);
        this.root.add(this.hammerGroup);
        
        const hammerGeo = new THREE.BoxGeometry(0.03, 0.08, 0.05);
        this.hammer = new THREE.Mesh(hammerGeo, darkMat);
        this.hammer.position.set(0, 0.03, -0.02);
        this.hammerGroup.add(this.hammer);
        
        // Frizzen (pan cover) - animated
        this.frizzenGroup = new THREE.Group();
        this.frizzenGroup.position.set(0, 0.05, -0.38);
        this.root.add(this.frizzenGroup);
        
        const frizzenGeo = new THREE.BoxGeometry(0.05, 0.06, 0.02);
        this.frizzen = new THREE.Mesh(frizzenGeo, metalMat);
        this.frizzenGroup.add(this.frizzen);
        
        // Pan (powder holder)
        const panGeo = new THREE.BoxGeometry(0.04, 0.01, 0.04);
        this.pan = new THREE.Mesh(panGeo, darkMat);
        this.pan.position.set(0, 0.045, -0.38);
        this.root.add(this.pan);
        
        // Flash pan powder (visible when primed)
        const powderGeo = new THREE.BoxGeometry(0.03, 0.005, 0.03);
        this.powder = new THREE.Mesh(powderGeo, brassMat);
        this.powder.position.set(0, 0.048, -0.38);
        this.powder.visible = true;
        this.root.add(this.powder);
        
        // Trigger guard
        const triggerGuardGeo = new THREE.TorusGeometry(0.04, 0.005, 8, 16, Math.PI);
        this.triggerGuard = new THREE.Mesh(triggerGuardGeo, darkMat);
        this.triggerGuard.position.set(0, -0.02, 0);
        this.triggerGuard.rotation.z = Math.PI;
        this.root.add(this.triggerGuard);
        
        // Trigger - animated
        this.trigger = new THREE.Mesh(
            new THREE.BoxGeometry(0.01, 0.04, 0.01),
            darkMat
        );
        this.trigger.position.set(0, -0.02, 0.02);
        this.trigger.rotation.x = 0.3;
        this.root.add(this.trigger);
        
        // Ramrod (for animation during reload)
        this.ramrodGroup = new THREE.Group();
        this.ramrodGroup.position.set(0.06, -0.02, 0);
        this.root.add(this.ramrodGroup);
        
        const ramrodGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.9, 8);
        this.ramrod = new THREE.Mesh(ramrodGeo, darkMat);
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrodGroup.add(this.ramrod);
        
        // Muzzle position (for ballistics)
        this.muzzlePosition = new THREE.Vector3(0, 0.02, 0.9);
        
        // Sight alignment position (rear sight notch)
        this.rearSightPosition = new THREE.Vector3(0, 0.055, -0.25);
        this.frontSightPosition = new THREE.Vector3(0, 0.08, 0.25);
        
        // Animation targets
        this.animTargets = {
            hammerRotation: 0,
            frizzenRotation: 0,
            triggerRotation: 0,
            ramrodPosition: 0,
            barrelWobble: 0
        };
        
        this.scene.add(this.root);
        
        // Reload stages with timing (accurate musket reloading)
        this.reloadStages = [
            { name: 'halfcock', duration: 0.3, action: () => this.halfCock() },
            { name: 'openpan', duration: 0.3, action: () => this.openPan() },
            { name: 'pourpowder', duration: 0.8, action: () => this.pourPowder() },
            { name: 'closepan', duration: 0.3, action: () => this.closePan() },
            { name: 'fullcock', duration: 0.4, action: () => this.fullCock() },
            { name: 'aim', duration: 0.5, action: () => this.readyAim() }
        ];
        this.totalReloadTime = this.reloadStages.reduce((a, s) => a + s.duration, 0);
    }
    
    update(deltaTime) {
        // Smooth animation interpolation
        const lerpFactor = 1 - Math.pow(0.1, deltaTime * 10);
        
        this.hammerGroup.rotation.x = THREE.MathUtils.lerp(
            this.hammerGroup.rotation.x, 
            this.animTargets.hammerRotation, 
            lerpFactor
        );
        this.frizzenGroup.rotation.x = THREE.MathUtils.lerp(
            this.frizzenGroup.rotation.x, 
            this.animTargets.frizzenRotation, 
            lerpFactor
        );
        this.trigger.rotation.x = THREE.MathUtils.lerp(
            this.trigger.rotation.x, 
            0.3 + this.animTargets.triggerRotation, 
            lerpFactor
        );
        
        // Ramrod animation during reload
        if (this.state === 'reloading' && this.reloadStage === 2) {
            // Pour powder / ram phase - ramrod extends and retracts
            const ramProgress = (this.reloadTime % 0.8) / 0.8;
            this.animTargets.ramrodPosition = Math.sin(ramProgress * Math.PI) * 0.3;
        } else {
            this.animTargets.ramrodPosition = THREE.MathUtils.lerp(
                this.ramrodGroup.position.z, 
                0, 
                lerpFactor
            );
        }
        this.ramrodGroup.position.z = this.animTargets.ramrodPosition;
        
        // Reload state machine
        if (this.state === 'reloading') {
            this.updateReload(deltaTime);
        }
        
        // Firing animation
        if (this.state === 'firing') {
            this.updateFireAnim(deltaTime);
        }
        
        // Breathing/idle animation
        if (this.state === 'idle' || this.state === 'aiming') {
            const time = Date.now() * 0.001;
            this.root.position.y = Math.sin(time * 1.5) * 0.002;
        }
    }
    
    updateReload(deltaTime) {
        this.reloadTime += deltaTime;
        
        // Find current stage
        let accumulated = 0;
        for (let i = 0; i < this.reloadStages.length; i++) {
            if (this.reloadTime >= accumulated && this.reloadTime < accumulated + this.reloadStages[i].duration) {
                if (this.reloadStage !== i) {
                    this.reloadStage = i;
                    this.reloadStages[i].action();
                }
                break;
            }
            accumulated += this.reloadStages[i].duration;
        }
        
        // Check completion
        if (this.reloadTime >= this.totalReloadTime) {
            this.finishReload();
        }
        
        this.reloadProgress = this.reloadTime / this.totalReloadTime;
    }
    
    updateFireAnim(deltaTime) {
        // Recoil kick
        this.animTargets.barrelWobble = THREE.MathUtils.lerp(this.animTargets.barrelWobble, 0, deltaTime * 5);
        this.barrelGroup.position.z = 0.3 + Math.sin(this.animTargets.barrelWobble * Math.PI) * -0.05;
        
        if (this.animTargets.barrelWobble < 0.01) {
            this.state = 'idle';
            this.barrelGroup.position.z = 0.3;
        }
    }
    
    // Animation actions
    halfCock() {
        this.animTargets.hammerRotation = 0.3; // Half cock
        this.isPrimed = false;
    }
    
    openPan() {
        this.animTargets.frizzenRotation = 0.8; // Open pan
    }
    
    pourPowder() {
        // Ramrod moves - visual only
        this.powder.visible = true;
    }
    
    closePan() {
        this.animTargets.frizzenRotation = 0; // Close pan
    }
    
    fullCock() {
        this.animTargets.hammerRotation = 0.6; // Full cock
    }
    
    readyAim() {
        this.isLoaded = true;
        this.isPrimed = true;
    }
    
    startReload() {
        if (!this.isLoaded || this.state === 'reloading') return false;
        this.state = 'reloading';
        this.reloadTime = 0;
        this.reloadStage = 0;
        this.isLoaded = false;
        this.isPrimed = false;
        return true;
    }
    
    finishReload() {
        this.state = 'idle';
        this.reloadProgress = 1;
    }
    
    fire() {
        if (!this.isLoaded || !this.isPrimed || this.state !== 'idle') {
            return false;
        }
        
        this.state = 'firing';
        this.isLoaded = false;
        this.isPrimed = false;
        this.animTargets.hammerRotation = 0; // Hammer falls
        this.animTargets.triggerRotation = 0.3; // Trigger pulled
        this.animTargets.barrelWobble = 1; // Start recoil
        
        // Flash pan powder disappears
        this.powder.visible = false;
        
        // Reset trigger after short delay
        setTimeout(() => {
            this.animTargets.triggerRotation = 0;
        }, 100);
        
        return true;
    }
    
    setAiming(aiming) {
        if (this.state === 'reloading') return;
        this.state = aiming ? 'aiming' : 'idle';
    }
    
    getMuzzlePosition() {
        const pos = this.muzzlePosition.clone();
        pos.applyMatrix4(this.root.matrixWorld);
        return pos;
    }
    
    getAimDirection() {
        // Calculate direction from rear sight through front sight
        const rear = this.rearSightPosition.clone().applyMatrix4(this.root.matrixWorld);
        const front = this.frontSightPosition.clone().applyMatrix4(this.root.matrixWorld);
        return front.sub(rear).normalize();
    }
    
    setPosition(x, y, z) {
        this.root.position.set(x, y, z);
    }
    
    setRotation(yaw, pitch) {
        this.root.rotation.y = yaw;
        this.root.rotation.x = pitch;
    }
    
    reset() {
        this.state = 'idle';
        this.isLoaded = true;
        this.isPrimed = true;
        this.reloadProgress = 0;
        this.reloadStage = 0;
        this.reloadTime = 0;
        this.powder.visible = true;
        this.animTargets.hammerRotation = 0;
        this.animTargets.frizzenRotation = 0;
    }
}

// ============================================
// PLAYER CLASS
// ============================================
class Player {
    constructor(scene, isPlayer2, inputHandler) {
        this.scene = scene;
        this.isPlayer2 = isPlayer2;
        this.input = inputHandler;
        
        // Position/rotation
        this.position = new THREE.Vector3(
            isPlayer2 ? 10 : -10, 
            1.6, 
            isPlayer2 ? 10 : -10
        );
        this.yaw = isPlayer2 ? -Math.PI * 0.75 : Math.PI * 0.25;
        this.pitch = 0;
        
        // Movement
        this.velocity = new THREE.Vector3();
        this.speed = 3.5;
        
        // Health
        this.health = 100;
        this.isDead = false;
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
        this.camera.position.copy(this.position);
        
        // Weapon
        this.musket = new Musket(scene, isPlayer2);
        
        // Visual representation (other player sees this)
        this.mesh = this.createPlayerMesh();
        this.scene.add(this.mesh);
        
        // Bob animation
        this.bobTime = 0;
        this.isMoving = false;
        
        // Input state
        this.reloadPressed = false;
        this.firePressed = false;
    }
    
    createPlayerMesh() {
        const group = new THREE.Group();
        
        // Body
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.7, 8);
        const bodyMat = new THREE.MeshLambertMaterial({ 
            color: this.isPlayer2 ? 0x4a3728 : 0x2f4f4f 
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.85;
        group.add(body);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const headMat = new THREE.MeshLambertMaterial({ color: 0xdeb887 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.85;
        group.add(head);
        
        // Tricorne hat
        const hatBrimGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 12);
        const hatMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
        hatBrim.position.y = 2.05;
        
        // Hat crown
        const hatCrownGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.25, 8);
        const hatCrown = new THREE.Mesh(hatCrownGeo, hatMat);
        hatCrown.position.y = 2.2;
        
        group.add(hatBrim);
        group.add(hatCrown);
        
        group.position.copy(this.position);
        return group;
    }
    
    update(deltaTime, otherPlayer, worldBounds) {
        if (this.isDead) return;
        
        this.handleInput(deltaTime);
        this.updateMovement(deltaTime, worldBounds);
        this.updateCamera();
        this.musket.update(deltaTime);
        
        // Update visual mesh position
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.yaw;
        
        // Update musket position relative to camera
        const musketOffset = new THREE.Vector3(0.15, -0.1, 0.4);
        musketOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        musketOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);
        
        this.musket.setPosition(
            this.camera.position.x + musketOffset.x,
            this.camera.position.y + musketOffset.y,
            this.camera.position.z + musketOffset.z
        );
        this.musket.setRotation(this.yaw, this.pitch);
    }
    
    handleInput(deltaTime) {
        // Get input from handler
        const input = this.input.getInput(this.isPlayer2, deltaTime);
        
        // Rotation (aim)
        this.yaw -= input.lookX * (this.isPlayer2 ? 2.5 : 0.002);
        this.pitch -= input.lookY * (this.isPlayer2 ? 2.5 : 0.002);
        this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
        
        // Movement
        const moveSpeed = this.speed * deltaTime;
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        
        this.isMoving = false;
        if (input.forward) {
            this.position.addScaledVector(forward, moveSpeed);
            this.isMoving = true;
        }
        if (input.backward) {
            this.position.addScaledVector(forward, -moveSpeed);
            this.isMoving = true;
        }
        if (input.left) {
            this.position.addScaledVector(right, -moveSpeed);
            this.isMoving = true;
        }
        if (input.right) {
            this.position.addScaledVector(right, moveSpeed);
            this.isMoving = true;
        }
        
        // Head bob
        if (this.isMoving) {
            this.bobTime += deltaTime * 8;
        } else {
            this.bobTime *= 0.9;
        }
        
        // Actions
        if (input.reload && !this.reloadPressed) {
            this.musket.startReload();
        }
        this.reloadPressed = input.reload;
        
        if (input.aim) {
            this.musket.setAiming(true);
        } else {
            this.musket.setAiming(false);
        }
        
        if (input.fire && !this.firePressed) {
            if (this.musket.fire()) {
                this.fireProjectile();
            }
        }
        this.firePressed = input.fire;
    }
    
    updateMovement(deltaTime, worldBounds) {
        // Simple wall collision
        const margin = 1.0;
        this.position.x = Math.max(worldBounds.minX + margin, Math.min(worldBounds.maxX - margin, this.position.x));
        this.position.z = Math.max(worldBounds.minZ + margin, Math.min(worldBounds.maxZ - margin, this.position.z));
    }
    
    updateCamera() {
        this.camera.position.copy(this.position);
        
        // Add head bob
        const bobOffset = Math.sin(this.bobTime) * 0.03;
        this.camera.position.y += bobOffset;
        
        // Apply rotation
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
    }
    
    fireProjectile() {
        const muzzlePos = this.musket.getMuzzlePosition();
        const aimDir = this.musket.getAimDirection();
        
        // Add velocity inheritance
        const velocity = aimDir.clone().multiplyScalar(150); // Musket velocity ~150 m/s
        velocity.add(this.velocity.clone().multiplyScalar(0.5)); // Inherit some player velocity
        
        // Add slight randomness for musket inaccuracy
        const spread = 0.02;
        velocity.x += (Math.random() - 0.5) * spread;
        velocity.y += (Math.random() - 0.5) * spread;
        velocity.z += (Math.random() - 0.5) * spread;
        
        Game.projectiles.push(new Projectile(
            this.scene,
            muzzlePos,
            velocity,
            this.isPlayer2
        ));
        
        // Muzzle flash particle
        createMuzzleFlash(muzzlePos);
        
        // Audio
        playGunshot();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.isDead = true;
        this.health = 0;
        this.mesh.visible = false;
    }
    
    respawn() {
        this.isDead = false;
        this.health = 100;
        this.mesh.visible = true;
        this.position.set(
            this.isPlayer2 ? 10 : -10, 
            1.6, 
            this.isPlayer2 ? 10 : -10
        );
        this.musket.reset();
    }
}

// ============================================
// PROJECTILE CLASS - Physics Ballistics
// ============================================
class Projectile {
    constructor(scene, position, velocity, isPlayer2) {
        this.scene = scene;
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.isPlayer2 = isPlayer2; // Who fired it
        this.active = true;
        this.gravity = 9.8;
        this.life = 5; // 5 seconds max life
        
        // Visual
        const geo = new THREE.SphereGeometry(0.015, 6, 6);
        const mat = new THREE.MeshBasicMaterial({ color: 0x444444 });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(position);
        this.scene.add(this.mesh);
        
        // Trail
        this.trailPositions = [];
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.destroy();
            return;
        }
        
        // Apply gravity
        this.velocity.y -= this.gravity * deltaTime;
        
        // Update position
        this.position.addScaledVector(this.velocity, deltaTime);
        this.mesh.position.copy(this.position);
        
        // Trail
        this.trailPositions.push(this.position.clone());
        if (this.trailPositions.length > 20) {
            this.trailPositions.shift();
        }
        
        // Check collision with players
        for (const player of Game.players) {
            if (player.isPlayer2 === this.isPlayer2) continue; // Don't hit shooter
            if (player.isDead) continue;
            
            const dist = this.position.distanceTo(player.position);
            if (dist < 0.5) { // Hit!
                player.takeDamage(50);
                this.destroy();
                createBloodSpatter(this.position);
                return;
            }
        }
        
        // Ground collision
        if (this.position.y < 0) {
            this.destroy();
        }
    }
    
    destroy() {
        this.active = false;
        this.scene.remove(this.mesh);
    }
}

// ============================================
// INPUT HANDLER
// ============================================
class InputHandler {
    constructor() {
        this.keyState = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseLocked = false;
        this.gamepadIndex = null;
        
        // Bind keyboard
        window.addEventListener('keydown', (e) => {
            this.keyState[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keyState[e.code] = false;
        });
        
        // Bind mouse
        document.addEventListener('mousemove', (e) => {
            if (this.mouseLocked) {
                this.mouseX += e.movementX;
                this.mouseY += e.movementY;
            }
        });
        
        // Pointer lock
        const canvas = document.getElementById('gameCanvas');
        document.addEventListener('pointerlockchange', () => {
            this.mouseLocked = document.pointerLockElement === canvas;
        });
        
        // Gamepad detection
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepadIndex = e.gamepad.index;
            document.getElementById('gamepadWarning').style.display = 'none';
        });
        window.addEventListener('gamepaddisconnected', (e) => {
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
            }
        });
    }
    
    lockPointer() {
        const canvas = document.getElementById('gameCanvas');
        canvas.requestPointerLock();
    }
    
    getInput(isPlayer2, deltaTime) {
        if (!isPlayer2) {
            // Player 1 - Keyboard + Mouse
            const input = {
                forward: this.keyState['KeyW'] || this.keyState['ArrowUp'],
                backward: this.keyState['KeyS'] || this.keyState['ArrowDown'],
                left: this.keyState['KeyA'] || this.keyState['ArrowLeft'],
                right: this.keyState['KeyD'] || this.keyState['ArrowRight'],
                lookX: this.mouseX,
                lookY: this.mouseY,
                fire: this.mouseLocked && (this.keyState['Mouse0'] || this.keyState['MouseLeft']),
                reload: !!this.keyState['KeyR'],
                aim: !!this.keyState['KeyE']
            };
            
            // Reset mouse delta
            this.mouseX = 0;
            this.mouseY = 0;
            
            return input;
        } else {
            // Player 2 - Gamepad
            const gamepad = this.gamepadIndex !== null ? navigator.getGamepads()[this.gamepadIndex] : null;
            
            if (!gamepad) {
                return { forward: false, backward: false, left: false, right: false, 
                        lookX: 0, lookY: 0, fire: false, reload: false, aim: false };
            }
            
            const deadzone = 0.15;
            let lookX = gamepad.axes[2] || 0;
            let lookY = gamepad.axes[3] || 0;
            let moveX = gamepad.axes[0] || 0;
            let moveY = gamepad.axes[1] || 0;
            
            if (Math.abs(lookX) < deadzone) lookX = 0;
            if (Math.abs(lookY) < deadzone) lookY = 0;
            if (Math.abs(moveX) < deadzone) moveX = 0;
            if (Math.abs(moveY) < deadzone) moveY = 0;
            
            return {
                forward: moveY < -deadzone,
                backward: moveY > deadzone,
                left: moveX < -deadzone,
                right: moveX > deadzone,
                lookX: lookX * deltaTime * 2,
                lookY: lookY * deltaTime * 2,
                fire: gamepad.buttons[7]?.pressed || false, // R2/RT
                reload: gamepad.buttons[2]?.pressed || false, // X/Square
                aim: gamepad.buttons[6]?.pressed || false // L2/LT
            };
        }
    }
}

// ============================================
// PARTICLE EFFECTS
// ============================================
function createMuzzleFlash(position) {
    const geo = new THREE.SphereGeometry(0.15, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ 
        color: 0xffaa00,
        transparent: true,
        opacity: 0.8
    });
    const flash = new THREE.Mesh(geo, mat);
    flash.position.copy(position);
    Game.scene.add(flash);
    
    // Animate and remove
    let life = 0.1;
    function animate() {
        life -= 0.016;
        flash.scale.multiplyScalar(0.9);
        if (life <= 0) {
            Game.scene.remove(flash);
        } else {
            requestAnimationFrame(animate);
        }
    }
    animate();
}

function createBloodSpatter(position) {
    for (let i = 0; i < 8; i++) {
        const geo = new THREE.BoxGeometry(0.03, 0.03, 0.03);
        const mat = new THREE.MeshBasicMaterial({ color: 0x8b0000 });
        const particle = new THREE.Mesh(geo, mat);
        particle.position.copy(position);
        particle.position.x += (Math.random() - 0.5) * 0.3;
        particle.position.y += (Math.random() - 0.5) * 0.3;
        particle.position.z += (Math.random() - 0.5) * 0.3;
        Game.scene.add(particle);
        
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            Math.random() * 3,
            (Math.random() - 0.5) * 3
        );
        
        let life = 0.5;
        function animate() {
            life -= 0.016;
            velocity.y -= 9.8 * 0.016;
            particle.position.addScaledVector(velocity, 0.016);
            if (particle.position.y < 0) particle.position.y = 0;
            
            if (life <= 0) {
                Game.scene.remove(particle);
            } else {
                requestAnimationFrame(animate);
            }
        }
        animate();
    }
}

// ============================================
// AUDIO SYSTEM
// ============================================
function initAudio() {
    Game.audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playGunshot() {
    if (!Game.audioContext) return;
    
    if (Game.audioContext.state === 'suspended') {
        Game.audioContext.resume();
    }
    
    const oscillator = Game.audioContext.createOscillator();
    const gainNode = Game.audioContext.createGain();
    const filter = Game.audioContext.createBiquadFilter();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, Game.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, Game.audioContext.currentTime + 0.3);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, Game.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, Game.audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.5, Game.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, Game.audioContext.currentTime + 0.3);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(Game.audioContext.destination);
    
    oscillator.start(Game.audioContext.currentTime);
    oscillator.stop(Game.audioContext.currentTime + 0.3);
}

// ============================================
// WORLD/LEVEL
// ============================================
function createWorld(scene) {
    // Ground
    const groundGeo = new THREE.PlaneGeometry(100, 100, 20, 20);
    const groundMat = new THREE.MeshLambertMaterial({ 
        color: 0x3d5c3d,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    
    // Add some terrain variation
    const vertices = ground.geometry.attributes.position.array;
    for (let i = 2; i < vertices.length; i += 3) {
        vertices[i] = Math.random() * 0.3;
    }
    ground.geometry.attributes.position.needsUpdate = true;
    ground.geometry.computeVertexNormals();
    
    // Walls/Obstacles
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    
    // Create some stone walls
    for (let i = 0; i < 8; i++) {
        const wallGeo = new THREE.BoxGeometry(
            2 + Math.random() * 4,
            1.5 + Math.random() * 1,
            0.5 + Math.random() * 0.5
        );
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(
            (Math.random() - 0.5) * 60,
            wallGeo.parameters.height / 2,
            (Math.random() - 0.5) * 60
        );
        wall.rotation.y = Math.random() * Math.PI;
        scene.add(wall);
    }
    
    // Trees
    for (let i = 0; i < 15; i++) {
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 6);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        
        const leavesGeo = new THREE.ConeGeometry(1.5, 3, 8);
        const leavesMat = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.y = 2.5;
        
        const tree = new THREE.Group();
        tree.add(trunk);
        tree.add(leaves);
        tree.position.set(
            (Math.random() - 0.5) * 80,
            0,
            (Math.random() - 0.5) * 80
        );
        scene.add(tree);
    }
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(50, 100, 50);
    scene.add(sunLight);
    
    return {
        minX: -50, maxX: 50,
        minZ: -50, maxZ: 50
    };
}

// ============================================
// MAIN GAME LOOP
// ============================================
function initGame() {
    // Setup canvas
    Game.canvas = document.getElementById('gameCanvas');
    
    // Setup renderer
    Game.renderer = new THREE.WebGLRenderer({ 
        canvas: Game.canvas,
        antialias: true
    });
    Game.renderer.setSize(window.innerWidth, window.innerHeight);
    Game.renderer.setClearColor(0x87CEEB);
    
    // Setup scene
    Game.scene = new THREE.Scene();
    Game.scene.fog = new THREE.Fog(0x87CEEB, 20, 150);
    
    // Create world
    const worldBounds = createWorld(Game.scene);
    
    // Setup input
    const inputHandler = new InputHandler();
    
    // Create players
    Game.players = [
        new Player(Game.scene, false, inputHandler),
        new Player(Game.scene, true, inputHandler)
    ];
    
    // Audio
    initAudio();
    
    // Start button handler
    document.getElementById('startButton').addEventListener('click', () => {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameUI').style.display = 'block';
        inputHandler.lockPointer();
        Game.isRunning = true;
        Game.lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    });
    
    // Window resize
    window.addEventListener('resize', () => {
        Game.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // UI update interval
    setInterval(updateUI, 100);
}

function gameLoop(currentTime) {
    if (!Game.isRunning) return;
    
    const currentTimeSec = currentTime / 1000;
    Game.globalDeltaTime = Math.min(currentTimeSec - Game.lastTime, 0.1);
    Game.lastTime = currentTimeSec;
    
    // Update players
    const worldBounds = { minX: -50, maxX: 50, minZ: -50, maxZ: 50 };
    for (const player of Game.players) {
        const otherPlayer = Game.players.find(p => p !== player);
        player.update(Game.globalDeltaTime, otherPlayer, worldBounds);
    }
    
    // Update projectiles
    for (let i = Game.projectiles.length - 1; i >= 0; i--) {
        Game.projectiles[i].update(Game.globalDeltaTime);
        if (!Game.projectiles[i].active) {
            Game.projectiles.splice(i, 1);
        }
    }
    
    // Check respawn
    for (const player of Game.players) {
        if (player.isDead && player.respawnTimer === undefined) {
            player.respawnTimer = 3;
        }
        if (player.respawnTimer > 0) {
            player.respawnTimer -= Game.globalDeltaTime;
            if (player.respawnTimer <= 0) {
                player.respawn();
                player.respawnTimer = undefined;
            }
        }
    }
    
    // Render split screen
    renderSplitScreen();
    
    requestAnimationFrame(gameLoop);
}

function renderSplitScreen() {
    const width = Game.canvas.width || window.innerWidth;
    const height = Game.canvas.height || window.innerHeight;
    const halfHeight = Math.floor(height / 2);
    
    // Update camera aspect ratios for split screen
    Game.players[0].camera.aspect = width / halfHeight;
    Game.players[0].camera.updateProjectionMatrix();
    Game.players[1].camera.aspect = width / halfHeight;
    Game.players[1].camera.updateProjectionMatrix();
    
    Game.renderer.setScissorTest(true);
    Game.renderer.setClearColor(0x87CEEB);
    
    // Player 1 viewport (top half)
    Game.renderer.setViewport(0, halfHeight, width, halfHeight);
    Game.renderer.setScissor(0, halfHeight, width, halfHeight);
    Game.renderer.clear();
    Game.renderer.render(Game.scene, Game.players[0].camera);
    
    // Player 2 viewport (bottom half)
    Game.renderer.setViewport(0, 0, width, halfHeight);
    Game.renderer.setScissor(0, 0, width, halfHeight);
    Game.renderer.clear();
    Game.renderer.render(Game.scene, Game.players[1].camera);
    
    Game.renderer.setScissorTest(false);
}

function updateUI() {
    if (!Game.isRunning) return;
    
    // Health bars
    document.getElementById('p1HealthFill').style.width = Game.players[0].health + '%';
    document.getElementById('p2HealthFill').style.width = Game.players[1].health + '%';
    
    // Reload bars
    const p1Reload = Game.players[0].musket;
    const p2Reload = Game.players[1].musket;
    
    document.getElementById('p1ReloadProgress').style.width = 
        (p1Reload.state === 'reloading' ? p1Reload.reloadProgress * 100 : 
         p1Reload.isLoaded ? 100 : 0) + '%';
    document.getElementById('p2ReloadProgress').style.width = 
        (p2Reload.state === 'reloading' ? p2Reload.reloadProgress * 100 : 
         p2Reload.isLoaded ? 100 : 0) + '%';
    
    // Weapon status
    const p1Status = p1Reload.state === 'reloading' ? 'RELOADING...' :
                     p1Reload.isLoaded ? 'READY' : 'EMPTY';
    const p2Status = p2Reload.state === 'reloading' ? 'RELOADING...' :
                     p2Reload.isLoaded ? 'READY' : 'EMPTY';
    
    document.getElementById('p1Weapon').textContent = p1Status;
    document.getElementById('p2Weapon').textContent = p2Status;
}

// Initialize when page loads
window.addEventListener('load', initGame);
