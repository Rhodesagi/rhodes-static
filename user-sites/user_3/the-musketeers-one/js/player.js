class Player {
    constructor(game, isPlayer2) {
        this.game = game;
        this.isPlayer2 = isPlayer2;
        this.alive = true;
        this.health = 100;
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler(0, 0, 0);
        this.musketRotation = 0;
        this.velocity = new THREE.Vector3();
        this.speed = 2.5;
        this.height = 1.7;
        this.isAiming = false;
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.01, 100);
        this.musket = new Musket(game.scene, isPlayer2);
        this.musket.addToCamera(this.camera);
        this.hipFireOffset = new THREE.Vector3(0.2, -0.15, -0.4);
        this.ironSightOffset = new THREE.Vector3(0, -0.02, -0.15);
        this.respawn();
        this.keys = {};
        this.setupInput();
    }
    
    respawn() {
        if (this.isPlayer2) {
            this.position.set(5, this.height, 0);
            this.rotation.y = Math.PI;
        } else {
            this.position.set(-5, this.height, 0);
            this.rotation.y = 0;
        }
        this.health = 100;
        this.alive = true;
        this.musket.loaded = true;
        this.musket.reloadState = ReloadState.READY;
    }
    
    setupInput() {
        if (this.isPlayer2) {
            this.keyMap = { forward: 'ArrowUp', back: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', turnLeft: 'u', turnRight: 'o', aim: 'm', fire: '.', reload: ',' };
        } else {
            this.keyMap = { forward: 'w', back: 's', left: 'a', right: 'd', turnLeft: 'q', turnRight: 'e', aim: 'x', fire: 'f', reload: 'r' };
        }
        document.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; this.keys[e.code] = true; });
        document.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; this.keys[e.code] = false; });
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        this.handleInput(deltaTime);
        this.updateMovement(deltaTime);
        this.updateCamera();
        this.musket.update(deltaTime);
    }
    
    handleInput(deltaTime) {
        const moveSpeed = this.speed * deltaTime;
        const moveDir = new THREE.Vector3();
        if (this.keys[this.keyMap.forward]) moveDir.z -= 1;
        if (this.keys[this.keyMap.back]) moveDir.z += 1;
        if (this.keys[this.keyMap.left]) moveDir.x -= 1;
        if (this.keys[this.keyMap.right]) moveDir.x += 1;
        moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
        if (moveDir.length() > 0) {
            moveDir.normalize().multiplyScalar(moveSpeed);
            this.velocity.x = moveDir.x;
            this.velocity.z = moveDir.z;
        } else {
            this.velocity.x *= 0.8;
            this.velocity.z *= 0.8;
        }
        const turnSpeed = 1.5 * deltaTime;
        if (this.keys[this.keyMap.turnLeft]) this.musketRotation += turnSpeed;
        if (this.keys[this.keyMap.turnRight]) this.musketRotation -= turnSpeed;
        this.musketRotation = Math.max(-0.3, Math.min(0.3, this.musketRotation));
        if (this.keys[this.keyMap.aim]) { if (!this.isAiming) this.isAiming = true; }
        else { if (this.isAiming) { this.isAiming = false; this.musketRotation = 0; } }
        if (this.keys[this.keyMap.fire]) {
            if (!this.fireKeyHeld) this.fire();
            this.fireKeyHeld = true;
        } else this.fireKeyHeld = false;
        if (this.keys[this.keyMap.reload]) {
            if (!this.reloadKeyHeld) this.startReload();
            this.reloadKeyHeld = true;
        } else this.reloadKeyHeld = false;
    }
    
    updateMovement(deltaTime) {
        this.position.x += this.velocity.x;
        this.position.z += this.velocity.z;
        const limit = 15;
        this.position.x = Math.max(-limit, Math.min(limit, this.position.x));
        this.position.z = Math.max(-limit, Math.min(limit, this.position.z));
    }
    
    updateCamera() {
        this.camera.position.copy(this.position);
        this.camera.rotation.x = this.rotation.x;
        this.camera.rotation.y = this.rotation.y;
        this.camera.rotation.z = this.rotation.z;
        if (this.isAiming) {
            const targetPos = this.ironSightOffset.clone();
            this.musket.musketGroup.position.lerp(targetPos, 0.1);
            this.musket.musketGroup.rotation.y = this.musketRotation;
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 50, 0.1);
        } else {
            const targetPos = this.hipFireOffset.clone();
            this.musket.musketGroup.position.lerp(targetPos, 0.1);
            this.musket.musketGroup.rotation.y = THREE.MathUtils.lerp(this.musket.musketGroup.rotation.y, 0, 0.1);
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 75, 0.1);
        }
        this.camera.updateProjectionMatrix();
    }
    
    fire() {
        if (this.musket.canFire()) {
            const muzzleOffset = new THREE.Vector3(0, 0.03, -0.4);
            muzzleOffset.applyQuaternion(this.camera.quaternion);
            muzzleOffset.add(this.camera.position);
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.camera.quaternion);
            const windage = new THREE.Vector3(1, 0, 0);
            windage.applyQuaternion(this.camera.quaternion);
            windage.multiplyScalar(Math.sin(this.musketRotation) * 0.1);
            direction.add(windage);
            direction.normalize();
            this.game.ballistics.fire(muzzleOffset, direction, 400, this);
            this.musket.fire();
            this.camera.position.add(direction.clone().multiplyScalar(0.05));
        }
    }
    
    startReload() { this.musket.startReload(); }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) this.die();
    }
    
    die() {
        this.alive = false;
        this.game.onPlayerDeath(this);
    }
}
