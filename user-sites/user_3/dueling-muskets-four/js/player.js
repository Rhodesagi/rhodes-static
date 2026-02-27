/**
 * Player class - handles input, movement, and player state
 */

class Player {
    constructor(id, startPosition, inputMap) {
        this.id = id;
        this.position = startPosition.clone();
        this.rotation = new THREE.Euler(0, id === 1 ? 0 : Math.PI, 0);
        this.velocity = new THREE.Vector3();
        
        // Movement constants
        this.moveSpeed = 0.08;
        this.turnSpeed = 0.03;
        this.friction = 0.85;
        
        // Input mapping
        this.input = inputMap;
        this.keys = {};
        
        // Musket
        this.musket = new Musket();
        this.musketMesh = this.musket.createModel();
        
        // Projectiles
        this.projectiles = [];
        
        // State
        this.health = 100;
        this.alive = true;
        this.respawnTimer = 0;
        this.score = 0;
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, 2, 0.1, 1000);
        this.updateCamera();
        
        // Screen element
        this.screenElement = document.getElementById(id === 1 ? 'top-screen' : 'bottom-screen');
        
        // Blood overlay
        this.bloodOverlay = document.createElement('div');
        this.bloodOverlay.className = 'blood-overlay';
        this.screenElement.appendChild(this.bloodOverlay);
        
        // Score display
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.className = 'score-display';
        this.scoreDisplay.textContent = '0';
        this.screenElement.appendChild(this.scoreDisplay);
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.handleKeyDown(e.key.toLowerCase());
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.handleKeyUp(e.key.toLowerCase());
        });
    }
    
    handleKeyDown(key) {
        // Fire
        if (key === this.input.fire) {
            this.fire();
        }
        
        // Reload
        if (key === this.input.reload) {
            this.musket.startReload();
        }
        
        // Aim
        if (key === this.input.aim) {
            this.musket.toggleAim(true);
        }
    }
    
    handleKeyUp(key) {
        // Stop aiming
        if (key === this.input.aim) {
            this.musket.toggleAim(false);
        }
    }
    
    update() {
        if (!this.alive) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }
        
        this.handleMovement();
        this.updateMusket();
        this.updateProjectiles();
        this.updateCamera();
        this.updateReloadUI();
    }
    
    handleMovement() {
        const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.rotation);
        const right = new THREE.Vector3(1, 0, 0).applyEuler(this.rotation);
        
        let moveInput = new THREE.Vector3();
        
        // Forward/Back
        if (this.keys[this.input.forward]) {
            moveInput.add(forward);
        }
        if (this.keys[this.input.backward]) {
            moveInput.sub(forward);
        }
        
        // Strafe
        if (this.keys[this.input.left]) {
            moveInput.sub(right);
        }
        if (this.keys[this.input.right]) {
            moveInput.add(right);
        }
        
        // Turn musket (rotate view)
        if (this.keys[this.input.turnLeft]) {
            this.rotation.y += this.turnSpeed;
        }
        if (this.keys[this.input.turnRight]) {
            this.rotation.y -= this.turnSpeed;
        }
        
        // Apply movement
        if (moveInput.length() > 0) {
            moveInput.normalize().multiplyScalar(this.moveSpeed);
            this.velocity.add(moveInput);
        }
        
        // Apply friction
        this.velocity.multiplyScalar(this.friction);
        
        // Update position
        this.position.add(this.velocity);
        
        // Boundary constraints (arena size: 50x50)
        this.position.x = Math.max(-24, Math.min(24, this.position.x));
        this.position.z = Math.max(-24, Math.min(24, this.position.z));
    }
    
    updateMusket() {
        // Update reload state
        if (this.musket.reloading) {
            this.musket.updateReload();
        }
        
        // Position musket model relative to camera
        const offset = this.musket.getAimOffset();
        const camDirection = new THREE.Vector3(0, 0, -1).applyEuler(this.rotation);
        const camRight = new THREE.Vector3(1, 0, 0).applyEuler(this.rotation);
        const camUp = new THREE.Vector3(0, 1, 0);
        
        this.musketMesh.position.copy(this.position)
            .add(camDirection.multiplyScalar(offset.z))
            .add(camRight.multiplyScalar(offset.x))
            .add(camUp.multiplyScalar(offset.y));
        
        this.musketMesh.rotation.copy(this.rotation);
    }
    
    fire() {
        const direction = new THREE.Vector3(0, 0, -1).applyEuler(this.rotation);
        
        // Add slight random spread (smoothbore inaccuracy)
        const spread = 0.02;
        direction.x += (Math.random() - 0.5) * spread;
        direction.y += (Math.random() - 0.5) * spread;
        direction.normalize();
        
        const projectile = this.musket.fire(this.position, direction);
        
        if (projectile) {
            this.projectiles.push(projectile);
            
            // Screen flash effect
            this.screenElement.classList.add('flash');
            setTimeout(() => {
                this.screenElement.classList.remove('flash');
            }, 100);
        }
    }
    
    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            // Apply gravity
            proj.velocity.add(proj.gravity);
            
            // Move projectile
            proj.mesh.position.add(proj.velocity);
            
            // Remove if too old or out of bounds
            const age = Date.now() - proj.created;
            if (age > 5000 || proj.mesh.position.y < -5) {
                // Remove from scene
                if (proj.mesh.parent) {
                    proj.mesh.parent.remove(proj.mesh);
                }
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    updateCamera() {
        // Position camera at head height
        this.camera.position.copy(this.position);
        this.camera.position.y += 1.6; // eye level
        
        // Set rotation
        this.camera.rotation.copy(this.rotation);
    }
    
    updateReloadUI() {
        const indicator = document.getElementById(
            this.id === 1 ? 'reload-indicator-p1' : 'reload-indicator-p2'
        );
        
        if (this.musket.reloading) {
            indicator.style.display = 'block';
            
            // Update progress bar
            let bar = indicator.querySelector('.reload-bar');
            let text = indicator.querySelector('.reload-text');
            
            if (!bar) {
                bar = document.createElement('div');
                bar.className = 'reload-bar';
                indicator.appendChild(bar);
                
                text = document.createElement('div');
                text.className = 'reload-text';
                indicator.appendChild(text);
            }
            
            bar.style.width = this.musket.reloadProgress + '%';
            text.textContent = this.reloadStages[this.musket.currentStage]?.name || 'Reloading...';
        } else {
            indicator.style.display = 'none';
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        // Show blood overlay
        this.bloodOverlay.style.opacity = '1';
        setTimeout(() => {
            this.bloodOverlay.style.opacity = '0';
        }, 300);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.alive = false;
        this.respawnTimer = 120; // 2 seconds at 60fps
        
        // Hide player
        this.musketMesh.visible = false;
    }
    
    respawn() {
        this.alive = true;
        this.health = 100;
        
        // Random respawn position
        const angle = Math.random() * Math.PI * 2;
        const distance = 15 + Math.random() * 5;
        this.position.set(
            Math.cos(angle) * distance,
            0,
            Math.sin(angle) * distance
        );
        
        // Face center
        this.rotation.y = Math.atan2(-this.position.z, -this.position.x);
        
        // Show player
        this.musketMesh.visible = true;
        
        // Reset musket
        this.musket.loaded = true;
        this.musket.reloading = false;
    }
    
    addScore() {
        this.score++;
        this.scoreDisplay.textContent = this.score;
        
        // Visual feedback
        this.scoreDisplay.style.transform = 'scale(1.5)';
        setTimeout(() => {
            this.scoreDisplay.style.transform = 'scale(1)';
        }, 200);
    }
    
    get reloadStages() {
        return this.musket.reloadStages;
    }
}
