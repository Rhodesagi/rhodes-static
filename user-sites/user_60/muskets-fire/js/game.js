/**
 * Main Game Controller
 * Initializes systems, runs game loop, manages state
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = null;
        this.world = null;
        this.ballistics = null;
        
        this.players = [];
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedTimeStep = 1 / 60; // 60Hz physics
        
        this.isRunning = false;
        this.gameOver = false;
        
        // Muzzle flash effects
        this.muzzleFlashes = [];
        
        this.init();
    }
    
    init() {
        // Setup renderer
        this.renderer = new SplitScreenRenderer(this.canvas);
        
        // Create world
        this.world = new World(this.renderer.getScene());
        
        // Ballistics manager
        this.ballistics = new BallisticsManager(this.renderer.getScene());
        
        // Create players with their control schemes
        const p1Controls = {
            forward: 'w',
            backward: 's',
            left: 'a',
            right: 'd',
            sprint: 'shift',
            reload: 'r',
            fire: 'Mouse0',
            ironSights: 'Mouse2'
        };
        
        const p2Controls = {
            forward: 'arrowup',
            backward: 'arrowdown',
            left: 'arrowleft',
            right: 'arrowright',
            sprint: 'enter',
            reload: 'numpad0',
            fire: 'shift',
            ironSights: 'control'
        };
        
        // Spawn positions
        const spawnPoints = this.world.getSpawnPoints();
        
        // Player 1
        const p1 = new Player(1, spawnPoints[0], p1Controls);
        this.players.push(p1);
        this.renderer.addToScene(p1.musket.mesh);
        
        // Player 2
        const p2 = new Player(2, spawnPoints[1], p2Controls);
        this.players.push(p2);
        this.renderer.addToScene(p2.musket.mesh);
        
        // Setup pointer lock for both players
        this.renderer.setupPointerLockListeners(this.players);
        
        // Setup keyboard input
        this.setupInput();
        
        // Start loop
        this.isRunning = true;
        this.lastTime = performance.now() / 1000;
        requestAnimationFrame(() => this.loop());
        
        // Add click listeners for shooting
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        console.log('MUSKETS FIRE - Game initialized');
        console.log('Player 1: WASD + Mouse (Click left viewport to lock)');
        console.log('Player 2: Arrows + Numpad (Click right viewport to lock)');
    }
    
    setupInput() {
        // Keyboard handling
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            
            // Escape releases pointer lock
            if (key === 'escape') {
                document.exitPointerLock();
                return;
            }
            
            // Player 1 keys
            if (this.players[0]) {
                this.players[0].handleKeyDown(key);
            }
            
            // Player 2 keys
            if (this.players[1]) {
                this.players[1].handleKeyDown(key);
                
                // Handle numpad keys for looking
                if (e.code === 'Numpad8') {
                    this.players[1].handleKeyboardLook(false, false, true, false, 0.016);
                }
                if (e.code === 'Numpad2') {
                    this.players[1].handleKeyboardLook(false, false, false, true, 0.016);
                }
                if (e.code === 'Numpad4') {
                    this.players[1].handleKeyboardLook(true, false, false, false, 0.016);
                }
                if (e.code === 'Numpad6') {
                    this.players[1].handleKeyboardLook(false, true, false, false, 0.016);
                }
                
                // Player 2 fire (Right Shift)
                if (e.code === 'ShiftRight') {
                    this.handlePlayerFire(1);
                }
                
                // Player 2 iron sights (Right Ctrl)
                if (e.code === 'ControlRight') {
                    this.players[1].musket.toggleIronSights();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            
            if (this.players[0]) {
                this.players[0].handleKeyUp(key);
            }
            if (this.players[1]) {
                this.players[1].handleKeyUp(key);
            }
        });
        
        // Continuous keyboard look for Player 2
        const keyboardLookInterval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(keyboardLookInterval);
                return;
            }
            
            // Check held keys for Player 2 looking
            if (this.players[1]) {
                const p2 = this.players[1];
                let left = false, right = false, up = false, down = false;
                
                // Check numpad held states
                if (p2.keys['numpad4']) left = true;
                if (p2.keys['numpad6']) right = true;
                if (p2.keys['numpad8']) up = true;
                if (p2.keys['numpad2']) down = true;
                
                // Also use IJKL as alternative
                if (p2.keys['i']) up = true;
                if (p2.keys['k']) down = true;
                if (p2.keys['j']) left = true;
                if (p2.keys['l']) right = true;
                
                if (left || right || up || down) {
                    p2.handleKeyboardLook(left, right, up, down, 0.016);
                }
            }
        }, 16);
    }
    
    handleMouseDown(e) {
        // Left click
        if (e.button === 0) {
            // Determine which player based on mouse position
            const x = e.clientX;
            const halfWidth = window.innerWidth / 2;
            
            if (x < halfWidth) {
                // Player 1
                this.handlePlayerFire(0);
            } else {
                // Player 2 - requires different handling
                // Player 2 uses Right Shift for fire
            }
        }
        
        // Right click - iron sights for Player 1
        if (e.button === 2) {
            const x = e.clientX;
            const halfWidth = window.innerWidth / 2;
            
            if (x < halfWidth && this.players[0]) {
                this.players[0].musket.toggleIronSights();
            }
        }
    }
    
    handleMouseUp(e) {
        // Release iron sights on right click release for Player 1
        if (e.button === 2) {
            if (this.players[0] && this.players[0].musket.ironSightsActive) {
                this.players[0].musket.toggleIronSights();
            }
        }
    }
    
    handlePlayerFire(playerIndex) {
        const player = this.players[playerIndex];
        if (!player || !player.alive) return;
        
        const fireData = player.attemptFire();
        
        if (fireData) {
            // Create projectile
            this.ballistics.spawnProjectile(
                fireData.position,
                fireData.direction,
                fireData.velocity,
                player
            );
            
            // Muzzle flash effect
            this.createMuzzleFlash(fireData.position, fireData.direction);
            
            // Screen shake for player
            this.applyRecoil(player);
            
            console.log(`Player ${playerIndex + 1} fired!`);
        }
    }
    
    createMuzzleFlash(position, direction) {
        // Visual muzzle flash
        const flashGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 1
        });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.copy(position);
        
        this.renderer.addToScene(flash);
        
        // Smoke
        const smokeGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const smokeMat = new THREE.MeshBasicMaterial({ 
            color: 0x888888,
            transparent: true,
            opacity: 0.5
        });
        const smoke = new THREE.Mesh(smokeGeo, smokeMat);
        smoke.position.copy(position);
        smoke.position.add(direction.clone().multiplyScalar(0.2));
        
        this.renderer.addToScene(smoke);
        
        // Animate flash fade
        let life = 0;
        const flashInterval = setInterval(() => {
            life += 0.016;
            
            flashMat.opacity = Math.max(0, 1 - life * 5);
            smokeMat.opacity = Math.max(0, 0.5 - life * 2);
            
            smoke.position.add(new THREE.Vector3(0, 0.02, 0));
            smoke.scale.multiplyScalar(1.02);
            
            if (life > 0.2) {
                clearInterval(flashInterval);
                this.renderer.removeFromScene(flash);
                this.renderer.removeFromScene(smoke);
                flashGeo.dispose();
                flashMat.dispose();
                smokeGeo.dispose();
                smokeMat.dispose();
            }
        }, 16);
    }
    
    applyRecoil(player) {
        // Apply recoil rotation
        player.rotation.x += 0.05; // Kick up
        player.rotation.y += (Math.random() - 0.5) * 0.02; // Slight horizontal
    }
    
    loop() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.loop());
        
        // Time management
        const currentTime = performance.now() / 1000;
        let frameTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Prevent spiral of death
        if (frameTime > 0.25) frameTime = 0.25;
        
        this.accumulator += frameTime;
        
        // Fixed timestep physics
        while (this.accumulator >= this.fixedTimeStep) {
            this.update(this.fixedTimeStep);
            this.accumulator -= this.fixedTimeStep;
        }
        
        // Render
        this.renderer.render();
    }
    
    update(dt) {
        // Update players
        for (const player of this.players) {
            player.update(dt, this.world.boundaries);
            
            // World collision
            if (this.world.checkCollision(player.position, player.radius)) {
                // Simple push back
                const pushDir = player.position.clone().normalize();
                player.position.sub(pushDir.multiplyScalar(0.1));
            }
        }
        
        // Update ballistics
        this.ballistics.update(dt);
        
        // Check projectile collisions
        this.ballistics.checkPlayerCollisions(this.players);
        
        // Update weapon positions (attached to players)
        for (const player of this.players) {
            if (player.alive) {
                player.musket.mesh.visible = true;
                player.updateWeapon(dt);
            } else {
                player.musket.mesh.visible = false;
            }
        }
        
        // Check for game over
        this.checkWinCondition();
    }
    
    checkWinCondition() {
        // Simple deathmatch - track kills
        // For now, just respawn
    }
    
    destroy() {
        this.isRunning = false;
        
        if (this.ballistics) {
            this.ballistics.clear();
        }
        
        if (this.world) {
            this.world.clear();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    
    // Prevent context menu on right click
    document.addEventListener('contextmenu', e => e.preventDefault());
});