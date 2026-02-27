class Player {
    constructor(id, startPos, startRot) {
        this.id = id;
        this.position = startPos.clone();
        this.rotation = startRot.clone();
        this.health = 100;
        this.isAlive = true;
        this.musket = new Musket(id);
        this.moveSpeed = 3.0;
        this.sprintSpeed = 5.0;
        this.currentSpeed = this.moveSpeed;
        this.velocity = new THREE.Vector3();
        this.lookSensitivity = 0.002;
        this.maxPitch = Math.PI / 2 - 0.1;
        this.minPitch = -Math.PI / 2 + 0.1;
        this.sightOffset = new THREE.Vector3(0, 0.05, 0.15);
        this.keys = {};
        this.mouseDelta = { x: 0, y: 0 };
        this.gamepadIndex = -1;
        this.camera = new THREE.PerspectiveCamera(60, 0.5, 0.1, 1000);
        this.rightStick = { x: 0, y: 0 };
        this.flashElement = null;
        this.updateCamera();
    }

    setFlashElement(element) {
        this.flashElement = element;
    }

    setupInput(element) {
        if (this.id === 1) {
            this.setupKeyboardMouse(element);
        } else {
            this.setupGamepad();
            this.setupKeyboardFallback();
        }
    }

    setupKeyboardMouse(element) {
        element.addEventListener('click', () => {
            element.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === element) {
                document.addEventListener('mousemove', this.onMouseMove.bind(this));
            } else {
                document.removeEventListener('mousemove', this.onMouseMove.bind(this));
            }
        });

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyR') {
                this.musket.startReload();
            }
            if (e.code === 'ShiftLeft') {
                this.currentSpeed = this.sprintSpeed;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'ShiftLeft') {
                this.currentSpeed = this.moveSpeed;
            }
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0 && document.pointerLockElement === element) {
                this.attemptFire();
            }
        });
    }

    setupGamepad() {
        window.addEventListener('gamepadconnected', (e) => {
            if (this.gamepadIndex === -1) {
                this.gamepadIndex = e.gamepad.index;
                console.log('Gamepad connected for P' + this.id);
            }
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = -1;
            }
        });
    }

    setupKeyboardFallback() {
        window.addEventListener('keydown', (e) => {
            if (['Numpad0', 'NumpadDecimal', 'Numpad4', 'Numpad6',
                 'Numpad8', 'Numpad2', 'Numpad5',
                 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                this.keys[e.code] = true;
            }
            if (e.code === 'NumpadDecimal' || e.code === 'Period') {
                this.musket.startReload();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (['Numpad0', 'NumpadDecimal', 'Numpad4', 'Numpad6',
                 'Numpad8', 'Numpad2', 'Numpad5',
                 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                this.keys[e.code] = false;
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Numpad0' || e.code === 'Enter') {
                this.attemptFire();
            }
        });
    }

    onMouseMove(e) {
        this.mouseDelta.x += e.movementX;
        this.mouseDelta.y += e.movementY;
    }

    update(deltaTime, scene, otherPlayer) {
        if (!this.isAlive) return;
        this.musket.update(deltaTime);
        this.handleInput(deltaTime);
        this.applyMovement(deltaTime, otherPlayer);
        this.updateCamera();
    }

    handleInput(deltaTime) {
        if (this.id === 2 && this.gamepadIndex !== -1) {
            const gamepad = navigator.getGamepads()[this.gamepadIndex];
            if (gamepad) {
                const deadzone = 0.15;
                const lookX = Math.abs(gamepad.axes[2]) > deadzone ? gamepad.axes[2] : 0;
                const lookY = Math.abs(gamepad.axes[3]) > deadzone ? gamepad.axes[3] : 0;
                this.rotation.y -= lookX * 2.0 * deltaTime;
                this.rotation.x -= lookY * 2.0 * deltaTime;

                if (gamepad.buttons[7].pressed) {
                    this.attemptFire();
                }
                if (gamepad.buttons[0].pressed) {
                    this.musket.startReload();
                }

                const moveX = Math.abs(gamepad.axes[0]) > deadzone ? gamepad.axes[0] : 0;
                const moveY = Math.abs(gamepad.axes[1]) > deadzone ? gamepad.axes[1] : 0;
                this.rightStick.x = moveX;
                this.rightStick.y = moveY;
            }
        }

        if (this.id === 1 || (this.id === 2 && this.gamepadIndex === -1)) {
            if (this.id === 1) {
                this.rotation.y -= this.mouseDelta.x * this.lookSensitivity;
                this.rotation.x -= this.mouseDelta.y * this.lookSensitivity;
                this.mouseDelta.x = 0;
                this.mouseDelta.y = 0;
            } else {
                if (this.keys['Numpad4'] || this.keys['ArrowLeft']) {
                    this.rotation.y += 1.5 * deltaTime;
                }
                if (this.keys['Numpad6'] || this.keys['ArrowRight']) {
                    this.rotation.y -= 1.5 * deltaTime;
                }
                if (this.keys['Numpad8'] || this.keys['ArrowUp']) {
                    this.rotation.x -= 1.5 * deltaTime;
                }
                if (this.keys['Numpad2'] || this.keys['ArrowDown']) {
                    this.rotation.x += 1.5 * deltaTime;
                }
            }
        }

        this.rotation.x = Math.max(this.minPitch, Math.min(this.maxPitch, this.rotation.x));
    }

    applyMovement(deltaTime, otherPlayer) {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
        const right = new THREE.Vector3(1, 0, 0);
        right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);

        let moveVec = new THREE.Vector3();

        if (this.id === 1) {
            if (this.keys['KeyW']) moveVec.add(forward);
            if (this.keys['KeyS']) moveVec.sub(forward);
            if (this.keys['KeyA']) moveVec.sub(right);
            if (this.keys['KeyD']) moveVec.add(right);
        } else {
            if (this.gamepadIndex !== -1) {
                moveVec.add(forward.clone().multiplyScalar(-this.rightStick.y));
                moveVec.add(right.clone().multiplyScalar(this.rightStick.x));
            } else {
                if (this.keys['ArrowUp']) moveVec.add(forward);
                if (this.keys['ArrowDown']) moveVec.sub(forward);
                if (this.keys['ArrowLeft']) moveVec.sub(right);
                if (this.keys['ArrowRight']) moveVec.add(right);
            }
        }

        if (moveVec.length() > 0) {
            moveVec.normalize().multiplyScalar(this.currentSpeed * deltaTime);
            const newPos = this.position.clone().add(moveVec);
            if (otherPlayer && newPos.distanceTo(otherPlayer.position) > 1.5) {
                this.position.add(moveVec);
            } else if (!otherPlayer) {
                this.position.add(moveVec);
            }
        }

        this.position.x = Math.max(-50, Math.min(50, this.position.x));
        this.position.z = Math.max(-50, Math.min(50, this.position.z));
    }

    updateCamera() {
        const offset = this.sightOffset.clone();
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
        this.camera.position.copy(this.position).add(offset);
        const lookDir = new THREE.Vector3(0, 0, -1);
        lookDir.applyEuler(new THREE.Euler(this.rotation.x, this.rotation.y, 0, 'YXZ'));
        this.camera.lookAt(this.camera.position.clone().add(lookDir));
    }

    attemptFire() {
        if (this.musket.canFire()) {
            this.fire();
            return true;
        }
        return false;
    }

    fire() {
        this.musket.fire();

        if (this.flashElement) {
            this.flashElement.classList.add('active');
            setTimeout(() => {
                this.flashElement.classList.remove('active');
            }, 100);
        }

        const muzzleOffset = new THREE.Vector3(0, 0.02, -0.95);
        muzzleOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
        const muzzlePos = this.position.clone().add(muzzleOffset);

        const fireDir = new THREE.Vector3(0, 0, -1);
        fireDir.applyEuler(new THREE.Euler(this.rotation.x, this.rotation.y, 0, 'YXZ'));

        return {
            origin: muzzlePos,
            direction: fireDir,
            player: this
        };
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
        }
        return !this.isAlive;
    }

    reset(startPos, startRot) {
        this.position.copy(startPos);
        this.rotation.copy(startRot);
        this.health = 100;
        this.isAlive = true;
        this.musket = new Musket(this.id);
        this.velocity.set(0, 0, 0);
        this.updateCamera();
    }
}
