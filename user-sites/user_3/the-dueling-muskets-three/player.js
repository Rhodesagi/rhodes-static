class Player {
    constructor(id, startPosition, controls) {
        this.id = id;
        this.position = startPosition.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.health = 100;
        this.maxHealth = 100;
        this.isAlive = true;
        this.controls = controls; // { moveForward, moveBackward, moveLeft, moveRight, turnMusketLeft, turnMusketRight, aim, fire, reload }
        
        // Movement
        this.speed = 5.0;
        this.turnSpeed = 0.05;
        
        // Musket
        this.musket = new Musket(this);
        this.musketRotation = 0; // Horizontal rotation angle
        this.maxMusketRotation = Math.PI / 3; // 60 degrees left/right
        
        // Aiming
        this.isAiming = false;
        this.aimZoom = 1.5;
        this.normalFov = 75;
        this.aimFov = 55;
        
        // State
        this.reloading = false;
        this.reloadProgress = 0;
        this.reloadSteps = 6;
        this.reloadStepTime = 0.5; // seconds per step
        this.reloadTimer = 0;
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(this.normalFov, 1, 0.1, 1000);
        this.camera.position.set(this.position.x, 1.6, this.position.z);
        this.camera.lookAt(new THREE.Vector3(this.position.x, 1.6, this.position.z + 1));
        
        // Input state
        this.keys = {};
        
        // Add iron sight DOM element
        this.ironSight = document.createElement('div');
        this.ironSight.className = 'iron-sight';
        this.ironSight.innerHTML = `
            <div class="vertical"></div>
            <div class="horizontal"></div>
            <div class="dot"></div>
        `;
        document.getElementById(`${id}-view`).appendChild(this.ironSight);
    }
    
    update(deltaTime) {
        if (!this.isAlive) return;
        
        // Process input
        this.processMovement(deltaTime);
        this.processMusketRotation(deltaTime);
        this.processAiming();
        this.processReload(deltaTime);
        this.processFiring();
        
        // Update camera position
        this.camera.position.set(this.position.x, 1.6, this.position.z);
        
        // Update musket
        this.musket.update(deltaTime, this);
        
        // Update HUD
        this.updateHUD();
    }
    
    processMovement(deltaTime) {
        const move = new THREE.Vector3(0, 0, 0);
        
        if (this.keys[this.controls.moveForward]) move.z -= 1;
        if (this.keys[this.controls.moveBackward]) move.z += 1;
        if (this.keys[this.controls.moveLeft]) move.x -= 1;
        if (this.keys[this.controls.moveRight]) move.x += 1;
        
        move.normalize().multiplyScalar(this.speed * deltaTime);
        
        // Simple collision with world bounds
        const newX = this.position.x + move.x;
        const newZ = this.position.z + move.z;
        const bounds = 10;
        
        if (Math.abs(newX) < bounds) this.position.x = newX;
        if (Math.abs(newZ) < bounds) this.position.z = newZ;
    }
    
    processMusketRotation(deltaTime) {
        if (this.keys[this.controls.turnMusketLeft]) {
            this.musketRotation += this.turnSpeed * deltaTime * 60;
        }
        if (this.keys[this.controls.turnMusketRight]) {
            this.musketRotation -= this.turnSpeed * deltaTime * 60;
        }
        
        // Clamp rotation
        this.musketRotation = THREE.MathUtils.clamp(
            this.musketRotation,
            -this.maxMusketRotation,
            this.maxMusketRotation
        );
    }
    
    processAiming() {
        if (this.keys[this.controls.aim] && !this.reloading) {
            this.isAiming = true;
            this.camera.fov = this.aimFov;
            this.ironSight.classList.add('aiming');
        } else {
            this.isAiming = false;
            this.camera.fov = this.normalFov;
            this.ironSight.classList.remove('aiming');
        }
        this.camera.updateProjectionMatrix();
    }
    
    processReload(deltaTime) {
        if (this.keys[this.controls.reload] && !this.reloading && !this.musket.isLoaded) {
            this.startReload();
        }
        
        if (this.reloading) {
            this.reloadTimer += deltaTime;
            if (this.reloadTimer >= this.reloadStepTime) {
                this.reloadTimer = 0;
                this.reloadProgress++;
                
                // Update reload status HUD
                const steps = ['Powder', 'Ball', 'Ram', 'Prime', 'Cock', 'Ready'];
                const hud = document.getElementById(`${this.id}-reload`);
                if (hud) hud.textContent = `Reloading: ${steps[Math.min(this.reloadProgress, steps.length-1)]}`;
                
                if (this.reloadProgress >= this.reloadSteps) {
                    this.finishReload();
                }
            }
        }
    }
    
    processFiring() {
        if (this.keys[this.controls.fire] && !this.reloading && this.musket.isLoaded) {
            this.musket.fire();
            // Fire sound and visual effect would be triggered by musket.fire()
        }
    }
    
    startReload() {
        this.reloading = true;
        this.reloadProgress = 0;
        this.reloadTimer = 0;
        this.musket.startReload();
        
        const hud = document.getElementById(`${this.id}-reload`);
        if (hud) hud.textContent = 'Reloading: Powder';
    }
    
    finishReload() {
        this.reloading = false;
        this.musket.finishReload();
        
        const hud = document.getElementById(`${this.id}-reload`);
        if (hud) hud.textContent = '[R] to reload';
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
            // Trigger game over
            if (typeof gameOver !== 'undefined') {
                gameOver(this.id === 'p1' ? 'Player 2' : 'Player 1');
            }
        }
    }
    
    updateHUD() {
        // Health bar
        const healthBar = document.getElementById(`${this.id}-health-bar`);
        if (healthBar) {
            healthBar.style.width = `${(this.health / this.maxHealth) * 100}%`;
        }
        
        // Ammo status
        const ammo = document.getElementById(`${this.id}-ammo`);
        if (ammo) {
            ammo.textContent = this.musket.isLoaded ? 'LOADED' : 'EMPTY';
            ammo.style.color = this.musket.isLoaded ? '#00ff00' : '#ff0000';
        }
    }
    
    // Input handlers
    handleKeyDown(event) {
        this.keys[event.key.toLowerCase()] = true;
    }
    
    handleKeyUp(event) {
        this.keys[event.key.toLowerCase()] = false;
    }
}