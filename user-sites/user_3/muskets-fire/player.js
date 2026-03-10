class Player {
    constructor(id, scene, camera, isTopPlayer) {
        this.id = id;
        this.scene = scene;
        this.camera = camera;
        this.isTopPlayer = isTopPlayer;
        
        // Position
        this.position = new THREE.Vector3(
            id === 1 ? -5 : 5,
            1.7,
            id === 1 ? 0 : 0
        );
        this.rotation = new THREE.Euler(0, id === 1 ? 0 : Math.PI, 0);
        this.velocity = new THREE.Vector3();
        
        // Movement settings
        this.moveSpeed = 3.5;
        this.mouseSensitivity = 0.002;
        this.keyboardTurnSpeed = 2.2;
        
        // Health
        this.maxHealth = 100;
        this.health = 100;
        this.alive = true;
        this.respawnTimer = 0;
        
        // Input state
        this.keys = {};
        this.yaw = id === 1 ? 0 : Math.PI;
        this.pitch = 0;
        
        // Weapon
        this.musket = new Musket(scene, camera);
        
        // Collision
        this.radius = 0.4;
        this.height = 1.7;
        
        // Create visible body
        this.createBody();
    }
    
    createBody() {
        this.bodyGroup = new THREE.Group();
        
        const teamColor = this.id === 1 ? 0x3366ff : 0xff6633;
        const uniformColor = this.id === 1 ? 0x2244cc : 0xcc4422;
        
        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 12, 12),
            new THREE.MeshStandardMaterial({ color: teamColor })
        );
        head.position.y = 1.7;
        this.bodyGroup.add(head);
        
        // Torso
        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.45, 0.7, 0.25),
            new THREE.MeshStandardMaterial({ color: uniformColor })
        );
        torso.position.y = 1.1;
        this.bodyGroup.add(torso);
        
        // Backpack
        const pack = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.4, 0.15),
            new THREE.MeshStandardMaterial({ color: 0x3d2817 })
        );
        pack.position.set(0, 1.1, 0.2);
        this.bodyGroup.add(pack);
        
        // Visible musket
        const musketGroup = new THREE.Group();
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        barrel.rotation.x = Math.PI / 2;
        musketGroup.add(barrel);
        
        const stock = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.08, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x4a3728 })
        );
        stock.position.set(0, -0.05, 0.2);
        musketGroup.add(stock);
        
        musketGroup.position.set(0.25, 1.3, 0.2);
        this.bodyGroup.add(musketGroup);
        this.visibleMusket = musketGroup;
        
        this.bodyGroup.visible = false;
        this.scene.add(this.bodyGroup);
    }
    
    setKey(key, pressed) {
        this.keys[key] = pressed;
    }
    
    updateMouse(dx, dy) {
        this.yaw -= dx * this.mouseSensitivity;
        this.pitch -= dy * this.mouseSensitivity;
        this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
    }
    
    update(delta, walls, otherPlayer) {
        if (!this.alive) {
            this.respawnTimer -= delta;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return { ammoStatus: 'DEAD', reloadStatus: `Respawn in ${Math.ceil(this.respawnTimer)}...` };
        }
        
        // Handle movement
        this.handleMovement(delta, walls);
        
        // Handle aiming
        this.handleAiming(delta);
        
        // Update camera
        this.camera.position.copy(this.position);
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
        
        // Update body visual
        this.updateBodyVisual();
        
        // Update musket
        this.musket.update(delta);
        
        // Handle reload
        const reloadStatus = this.musket.updateReload(delta);
        
        // Handle firing
        let bulletData = null;
        if (this.keys['fire']) {
            bulletData = this.musket.fire(this.position, this.yaw, this.pitch);
            this.keys['fire'] = false;
        }
        
        // Handle reload input
        if (this.keys['reload']) {
            this.musket.startReload();
            this.keys['reload'] = false;
        }
        
        // Handle aim toggle
        this.musket.setAiming(this.keys['aim'] || false);
        
        return {
            bullet: bulletData,
            reloadStatus: reloadStatus,
            ammoStatus: this.musket.getAmmoStatus()
        };
    }
    
    handleMovement(delta, walls) {
        const forward = new THREE.Vector3(
            -Math.sin(this.yaw),
            0,
            -Math.cos(this.yaw)
        );
        const right = new THREE.Vector3(
            Math.cos(this.yaw),
            0,
            -Math.sin(this.yaw)
        );
        
        let moveDir = new THREE.Vector3();
        
        if (this.id === 1) {
            // P1: WASD
            if (this.keys['w']) moveDir.add(forward);
            if (this.keys['s']) moveDir.sub(forward);
            if (this.keys['a']) moveDir.sub(right);
            if (this.keys['d']) moveDir.add(right);
        } else {
            // P2: Arrow keys + Gamepad
            if (this.keys['ArrowUp']) moveDir.add(forward);
            if (this.keys['ArrowDown']) moveDir.sub(forward);
            if (this.keys['ArrowLeft']) moveDir.sub(right);
            if (this.keys['ArrowRight']) moveDir.add(right);
            
            // Gamepad analog movement
            if (this.keys['gp_moveX'] || this.keys['gp_moveY']) {
                moveDir.add(forward.clone().multiplyScalar(-(this.keys['gp_moveY'] || 0)));
                moveDir.add(right.clone().multiplyScalar(this.keys['gp_moveX'] || 0));
            }
        }
        
        if (moveDir.length() > 0) {
            moveDir.normalize();
            const newPos = this.position.clone().add(
                moveDir.multiplyScalar(this.moveSpeed * delta)
            );
            
            if (!this.checkWallCollision(newPos, walls)) {
                this.position.copy(newPos);
            }
        }
        
        // Bounds
        this.position.x = Math.max(-14, Math.min(14, this.position.x));
        this.position.z = Math.max(-14, Math.min(14, this.position.z));
    }
    
    handleAiming(delta) {
        if (this.id === 2) {
            // Keyboard aiming (fallback)
            if (this.keys['turnLeft']) this.yaw += this.keyboardTurnSpeed * delta;
            if (this.keys['turnRight']) this.yaw -= this.keyboardTurnSpeed * delta;
            if (this.keys['lookUp']) this.pitch += this.keyboardTurnSpeed * delta;
            if (this.keys['lookDown']) this.pitch -= this.keyboardTurnSpeed * delta;
            
            this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
        }
    }
    
    updateBodyVisual() {
        this.bodyGroup.position.copy(this.position);
        this.bodyGroup.rotation.y = this.yaw;
        this.visibleMusket.rotation.x = this.pitch;
        this.bodyGroup.visible = false;
    }
    
    checkWallCollision(pos, walls) {
        const playerBox = new THREE.Box3(
            new THREE.Vector3(pos.x - this.radius, pos.y - this.height + 0.5, pos.z - this.radius),
            new THREE.Vector3(pos.x + this.radius, pos.y + 0.5, pos.z + this.radius)
        );
        
        for (const wall of walls) {
            const wallBox = new THREE.Box3().setFromObject(wall);
            if (playerBox.intersectsBox(wallBox)) {
                return true;
            }
        }
        return false;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }
    
    die() {
        this.alive = false;
        this.respawnTimer = 3;
        this.bodyGroup.visible = true;
        this.bodyGroup.rotation.z = Math.PI / 2;
    }
    
    respawn() {
        this.alive = true;
        this.health = this.maxHealth;
        this.position.set(
            this.id === 1 ? -5 : 5,
            1.7,
            (Math.random() - 0.5) * 10
        );
        this.yaw = this.id === 1 ? 0 : Math.PI;
        this.pitch = 0;
        this.bodyGroup.visible = false;
        this.bodyGroup.rotation.z = 0;
        
        this.camera.remove(this.musket.group);
        this.musket = new Musket(this.scene, this.camera);
    }
    
    getHealthPercent() {
        return (this.health / this.maxHealth) * 100;
    }
}
