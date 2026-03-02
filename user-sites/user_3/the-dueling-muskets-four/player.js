class Player {
    constructor(id, x, z, rotationY) {
        this.id = id;
        this.speed = 5;
        this.turnSpeed = 3;
        this.tiltAngle = 0; // musket up/down tilt
        this.maxTilt = Math.PI / 6; // 30 degrees
        this.isAiming = false;
        this.isReloading = false;
        this.health = 100;
        
        // Visual representation (simple cylinder for now)
        const geometry = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8);
        const material = new THREE.MeshLambertMaterial({ 
            color: id === 1 ? 0x0066ff : 0xff3300 
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, 0.9, z);
        this.mesh.rotation.y = rotationY;
        
        // Movement vectors
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3(0, 0, -1);
        
        // Input state
        this.keys = {};
        
        // Bind controls
        this.setupControls();
    }
    
    setupControls() {
        // Key mappings
        if (this.id === 1) {
            this.keyMap = {
                'forward': 'KeyW',
                'backward': 'KeyS',
                'turnLeft': 'KeyA',
                'turnRight': 'KeyD',
                'tiltUp': 'KeyQ',
                'tiltDown': 'KeyE',
                'aim': 'KeyX',
                'fire': 'KeyF',
                'reload': 'KeyR'
            };
        } else {
            this.keyMap = {
                'forward': 'ArrowUp',
                'backward': 'ArrowDown',
                'turnLeft': 'ArrowLeft',
                'turnRight': 'ArrowRight',
                'tiltUp': 'KeyI',
                'tiltDown': 'KeyK',
                'aim': 'KeyM',
                'fire': 'Period',
                'reload': 'KeyL'
            };
        }
    }
    
    update(deltaTime) {
        this.handleInput(deltaTime);
        this.updatePosition(deltaTime);
        this.updateStatus();
    }
    
    handleInput(deltaTime) {
        // Forward/backward movement
        const forward = this.keys[this.keyMap.forward] ? 1 : 0;
        const backward = this.keys[this.keyMap.backward] ? -1 : 0;
        const moveForward = (forward + backward) * this.speed * deltaTime;
        
        this.direction.set(0, 0, -1).applyQuaternion(this.mesh.quaternion);
        this.velocity.copy(this.direction.multiplyScalar(moveForward));
        
        // Turning left/right
        const turnLeft = this.keys[this.keyMap.turnLeft] ? -1 : 0;
        const turnRight = this.keys[this.keyMap.turnRight] ? 1 : 0;
        const rotate = (turnLeft + turnRight) * this.turnSpeed * deltaTime;
        this.mesh.rotation.y += rotate;
        
        // Musket tilt (Q/E for player1, I/K for player2)
        const tiltUp = this.keys[this.keyMap.tiltUp] ? 1 : 0;
        const tiltDown = this.keys[this.keyMap.tiltDown] ? -1 : 0;
        this.tiltAngle += (tiltUp + tiltDown) * deltaTime;
        this.tiltAngle = THREE.MathUtils.clamp(this.tiltAngle, -this.maxTilt, this.maxTilt);
        
        // Aiming
        this.isAiming = this.keys[this.keyMap.aim] || false;
        
        // Fire and reload handled via controls.js (single trigger)
    }
    
    updatePosition(deltaTime) {
        this.mesh.position.add(this.velocity);
        // Keep above terrain
        const groundY = -1; // simplified terrain height at origin
        if (this.mesh.position.y < groundY + 0.9) {
            this.mesh.position.y = groundY + 0.9;
        }
    }
    
    updateStatus() {
        const statusEl = document.getElementById(`p${this.id}-status`);
        if (!statusEl) return;
        let text = 'Ready';
        if (this.isAiming) text = 'Aiming';
        if (this.isReloading) text = 'Reloading...';
        statusEl.textContent = text;
    }
}

// Global key state
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Make keys accessible to Player instances
Player.prototype.keys = keys;