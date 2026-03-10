class Player {
    constructor(id, spawnPosition) {
        this.id = id;
        this.position = spawnPosition.clone();
        this.rotation = { x: 0, y: 0 };
        this.velocity = new THREE.Vector3();
        this.speed = 4.0;
        this.height = 1.7;
        this.radius = 0.4;
        
        this.score = 0;
        this.alive = true;
        this.respawnTimer = 0;
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(20, 1, 0.1, 1000);
        this.camera.position.copy(this.position);
        this.camera.position.y += this.height - 0.1;
        
        // Visual mesh
        this.mesh = this.createPlayerMesh();
        this.mesh.visible = false;
        
        // Weapon
        this.musket = new Musket();
        this.musket.equip(this);
        
        // Input
        this.keys = {};
        this.mouseSensitivity = 0.002;
        this.isPointerLocked = false;
        this.isActive = false;
        
        // P1: Pointer lock, P2: Gamepad API
        this.usePointerLock = (id === 1);
        this.useGamepad = (id === 2);
        this.gamepadIndex = null;
        
        // Footstep timer
        this.footstepTimer = 0;
        this.lastPosition = this.position.clone();
    }

    createPlayerMesh() {
        const group = new THREE.Group();
        
        const bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.6, 8);
        const bodyMat = new THREE.MeshLambertMaterial({ 
            color: this.id === 1 ? 0x4a3c5a : 0x5a4a3a 
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.8;
        body.castShadow = true;
        group.add(body);
        
        const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.y = 1.7;
        head.castShadow = true;
        group.add(head);
        
        const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
        const leftArm = new THREE.Mesh(armGeo, bodyMat);
        leftArm.position.set(-0.35, 1.3, 0.2);
        leftArm.rotation.x = -0.5;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeo, bodyMat);
        rightArm.position.set(0.35, 1.3, 0.2);
        rightArm.rotation.x = -0.5;
        group.add(rightArm);
        
        const weaponGeo = new THREE.BoxGeometry(0.05, 0.05, 0.8);
        const weaponMat = new THREE.MeshLambertMaterial({ color: 0x3a3020 });
        const weapon = new THREE.Mesh(weaponGeo, weaponMat);
        weapon.position.set(0.2, 1.2, 0.4);
        weapon.rotation.y = -0.3;
        group.add(weapon);
        
        return group;
    }

    setupInput(element, keyMap) {
        this.element = element;
        this.keyMap = keyMap;
        
        if (this.usePointerLock) {
            this.setupPointerLockInput(element);
        } else if (this.useGamepad) {
            this.setupGamepadInput(element);
        }
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyDown(e.code);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Gamepad connection
        window.addEventListener('gamepadconnected', (e) => {
            if (this.useGamepad && this.gamepadIndex === null) {
                this.gamepadIndex = e.gamepad.index;
                this.isActive = true;
                this.updateOverlay();
                audio.init();
            }
        });
    }
    
    setupPointerLockInput(element) {
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked && document.pointerLockElement === element) {
                this.rotation.y -= e.movementX * this.mouseSensitivity;
                this.rotation.x -= e.movementY * this.mouseSensitivity;
                this.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.rotation.x));
            }
        });
        
        element.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                element.requestPointerLock();
            } else {
                this.fire();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = (document.pointerLockElement === this.element);
            this.isActive = this.isPointerLocked;
            this.updateOverlay();
            if (this.isPointerLocked) audio.init();
        });
    }
    
    setupGamepadInput(element) {
        // P2: Click to check for already-connected gamepads
        element.addEventListener('click', () => {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] && this.gamepadIndex === null) {
                    this.gamepadIndex = gamepads[i].index;
                    this.isActive = true;
                    this.updateOverlay();
                    audio.init();
                    break;
                }
            }
        });
    }
    
    updateOverlay() {
        const overlay = this.element.querySelector('.activation-overlay');
        if (overlay) {
            if (this.isActive || this.isPointerLocked) {
                overlay.classList.add('hidden');
            } else {
                overlay.classList.remove('hidden');
                if (this.useGamepad) {
                    overlay.textContent = 'CONNECT GAMEPAD + CLICK';
                }
            }
        }
    }

    handleKeyDown(code) {
        if (!this.alive || !this.isActive) return;
        if (code === this.keyMap.reload) this.musket.startReload();
        if (code === this.keyMap.inspect) this.musket.inspect();
        if (code === this.keyMap.fire) this.fire();
    }

    fire() {
        if (!this.alive || !this.isActive) return;
        this.musket.fire();
    }

    update(dt, world) {
        if (!this.alive) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) this.respawn(world);
            return;
        }
        
        // Handle gamepad input for P2
        if (this.useGamepad && this.gamepadIndex !== null) {
            this.handleGamepadInput(dt);
        }
        
        // Movement
        const moveSpeed = this.speed * dt;
        const moveVector = new THREE.Vector3();
        
        if (this.keys[this.keyMap.forward]) moveVector.z -= 1;
        if (this.keys[this.keyMap.backward]) moveVector.z += 1;
        if (this.keys[this.keyMap.left]) moveVector.x -= 1;
        if (this.keys[this.keyMap.right]) moveVector.x += 1;
        
        if (moveVector.length() > 0) {
            moveVector.normalize().multiplyScalar(moveSpeed);
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
            const right = new THREE.Vector3(1, 0, 0);
            right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
            const worldMove = new THREE.Vector3()
                .addScaledVector(forward, -moveVector.z)
                .addScaledVector(right, moveVector.x);
            this.position = world.resolveCollision(this.position, worldMove, this.radius);
            
            const distanceMoved = this.position.distanceTo(this.lastPosition);
            this.footstepTimer += distanceMoved;
            if (this.footstepTimer > 2.0) {
                audio.playFootstep();
                this.footstepTimer = 0;
            }
            this.lastPosition.copy(this.position);
        }
        
        this.camera.position.x = this.position.x;
        this.camera.position.z = this.position.z;
        this.camera.position.y = this.position.y + this.height - 0.1;
        
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.rotation.y;
        this.camera.rotation.x = this.rotation.x;
        
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation.y;
        
        this.musket.update(dt);
    }
    
    handleGamepadInput(dt) {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gamepad = gamepads[this.gamepadIndex];
        
        if (!gamepad) {
            this.gamepadIndex = null;
            this.isActive = false;
            this.updateOverlay();
            return;
        }
        
        const sensitivity = 2.0 * dt;
        const deadzone = 0.15;
        
        // Right stick for aiming
        const aimX = gamepad.axes[2] || 0;
        const aimY = gamepad.axes[3] || 0;
        
        if (Math.abs(aimX) > deadzone) {
            this.rotation.y -= aimX * sensitivity;
        }
        if (Math.abs(aimY) > deadzone) {
            this.rotation.x -= aimY * sensitivity;
            this.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.rotation.x));
        }
        
        // Left stick for movement
        const moveX = gamepad.axes[0] || 0;
        const moveY = gamepad.axes[1] || 0;
        
        this.keys[this.keyMap.forward] = moveY < -deadzone;
        this.keys[this.keyMap.backward] = moveY > deadzone;
        this.keys[this.keyMap.left] = moveX < -deadzone;
        this.keys[this.keyMap.right] = moveX > deadzone;
        
        // Right trigger or A button to fire
        if (gamepad.buttons[7]?.pressed || gamepad.buttons[0]?.pressed) {
            if (!this.firePressed) {
                this.fire();
                this.firePressed = true;
            }
        } else {
            this.firePressed = false;
        }
        
        // B button to reload
        if (gamepad.buttons[1]?.pressed) {
            if (!this.reloadPressed) {
                this.musket.startReload();
                this.reloadPressed = true;
            }
        } else {
            this.reloadPressed = false;
        }
        
        // X button to inspect
        if (gamepad.buttons[2]?.pressed) {
            if (!this.inspectPressed) {
                this.musket.inspect();
                this.inspectPressed = true;
            }
        } else {
            this.inspectPressed = false;
        }
    }

    takeDamage(attacker) {
        if (!this.alive) return;
        this.alive = false;
        audio.playHit();
        if (attacker && attacker !== this) {
            attacker.score++;
            game.updateScoreDisplay();
            if (attacker.score >= 5) game.endRound(attacker);
        }
        this.respawnTimer = 3.0;
        this.mesh.visible = false;
        this.musket.mesh.visible = false;
    }

    respawn(world) {
        this.alive = true;
        this.position = world.getRandomSpawn();
        this.rotation.x = 0;
        this.rotation.y = Math.random() * Math.PI * 2;
        this.velocity.set(0, 0, 0);
        this.mesh.visible = true;
        this.musket.mesh.visible = true;
        this.musket.reloadAnimation.reset();
        this.musket.loaded = false;
        this.musket.primed = false;
        this.musket.cocked = false;
        this.musket.state = 'ready';
    }

    getAimDirection() {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        return direction;
    }

    getEyePosition() {
        return this.camera.position.clone();
    }
}
