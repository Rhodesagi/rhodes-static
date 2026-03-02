// Player class - handles movement, camera, controls for each player

class Player {
    constructor(canvas, playerNumber, keyBindings) {
        this.canvas = canvas;
        this.playerNumber = playerNumber;
        this.keyBindings = keyBindings;
        
        // Player state
        this.health = 100;
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.velocity = new THREE.Vector3();
        this.moveSpeed = 5.0;
        this.lookSpeed = 0.002;
        
        // Camera and scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 1.6, 0); // Eye height
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.shadowMap.enabled = true;
        
        // Musket
        this.musket = new Musket(this.scene, this.camera, playerNumber);
        
        // Control state
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.isAiming = false;
        this.originalFOV = 75;
        this.aimFOV = 45;
        
        // Set up controls
        this.setupControls();
        
        // Lock pointer for mouse look (optional)
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
        });
        
        console.log(`Player ${playerNumber} initialized`);
    }
    
    setupControls() {
        // Keyboard
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // Mouse movement for looking
        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        
        // Pointer lock change
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === this.canvas) {
                console.log(`Pointer locked to Player ${this.playerNumber}`);
            }
        });
    }
    
    onKeyDown(event) {
        this.keys[event.code] = true;
        
        // Handle specific actions
        if (event.code === this.keyBindings.aim) {
            this.startAiming();
        }
        
        if (event.code === this.keyBindings.fire) {
            this.fire();
        }
        
        if (event.code === this.keyBindings.reload) {
            this.startReload();
        }
    }
    
    onKeyUp(event) {
        this.keys[event.code] = false;
        
        if (event.code === this.keyBindings.aim) {
            this.stopAiming();
        }
    }
    
    onMouseMove(event) {
        if (document.pointerLockElement !== this.canvas) return;
        
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        
        // Update rotation
        this.rotation.y -= movementX * this.lookSpeed;
        this.rotation.x -= movementY * this.lookSpeed;
        
        // Clamp vertical look
        this.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.rotation.x));
    }
    
    startAiming() {
        if (!this.isAiming && this.musket.loaded) {
            this.isAiming = true;
            this.camera.fov = this.aimFOV;
            this.camera.updateProjectionMatrix();
            this.musket.setAiming(true);
        }
    }
    
    stopAiming() {
        if (this.isAiming) {
            this.isAiming = false;
            this.camera.fov = this.originalFOV;
            this.camera.updateProjectionMatrix();
            this.musket.setAiming(false);
        }
    }
    
    fire() {
        if (this.musket.loaded && !this.musket.isReloading) {
            this.musket.fire();
            // Recoil effect
            this.camera.position.y -= 0.1;
            setTimeout(() => {
                this.camera.position.y += 0.1;
            }, 100);
        }
    }
    
    startReload() {
        if (!this.musket.loaded && !this.musket.isReloading) {
            this.musket.startReload();
        }
    }
    
    update(delta) {
        // Apply movement based on keys
        this.velocity.set(0, 0, 0);
        
        if (this.keys[this.keyBindings.moveForward]) {
            this.velocity.z -= 1;
        }
        if (this.keys[this.keyBindings.moveBackward]) {
            this.velocity.z += 1;
        }
        if (this.keys[this.keyBindings.moveLeft]) {
            this.velocity.x -= 1;
        }
        if (this.keys[this.keyBindings.moveRight]) {
            this.velocity.x += 1;
        }
        
        // Normalize diagonal movement
        if (this.velocity.length() > 0) {
            this.velocity.normalize();
        }
        
        // Apply rotation to velocity
        const rotatedVelocity = this.velocity.clone();
        rotatedVelocity.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
        
        // Update position with bounds checking
        const newPosition = this.position.clone().add(rotatedVelocity.multiplyScalar(this.moveSpeed * delta));
        
        // Simple boundary check (keep within dueling ground)
        if (newPosition.length() < 20) {
            this.position.copy(newPosition);
        }
        
        // Update camera position and rotation
        this.camera.position.copy(this.position);
        this.camera.rotation.copy(this.rotation);
        
        // Update musket (handles turning with Q/E)
        this.musket.update(delta, this.keys);
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    lookAt(target) {
        const direction = new THREE.Vector3().subVectors(target, this.position).normalize();
        this.rotation.y = Math.atan2(direction.x, direction.z);
        this.rotation.x = -Math.asin(direction.y);
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        console.log(`Player ${this.playerNumber} took ${amount} damage, health: ${this.health}`);
        
        // Visual feedback
        this.camera.position.x += (Math.random() - 0.5) * 0.3;
        this.camera.position.y += (Math.random() - 0.5) * 0.3;
        setTimeout(() => {
            this.camera.position.x -= (Math.random() - 0.5) * 0.3;
            this.camera.position.y -= (Math.random() - 0.5) * 0.3;
        }, 100);
    }
    
    onWindowResize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }
}