// MUSKETFIRE - Main game loop
// 2-player split-screen musket duel

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.overlay = document.getElementById('damageOverlay');
        this.reloadStatus = document.getElementById('reloadStatus');
        this.started = false;
        this.gameOver = false;
        
        // Score
        this.p1Score = 0;
        this.p2Score = 0;
        this.scoreToWin = 5;
        
        // Setup Three.js
        this.scene = new THREE.Scene();
        
        // World
        this.world = new World(this.scene);
        
        // Spawn players on opposite sides
        this.player1 = new Player(
            this.scene, 1, 
            new THREE.Vector3(-25, 0, 0)
        );
        
        this.player2 = new Player(
            this.scene, 2,
            new THREE.Vector3(25, 0, 0)
        );
        
        // Projectiles
        this.projectileManager = new ProjectileManager(this.scene);
        
        // Renderer
        this.renderer = new SplitScreenRenderer(
            this.canvas, this.scene, 
            this.player1, this.player2
        );
        
        // Canvas context for overlays
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.style.position = 'absolute';
        this.overlayCanvas.style.top = '0';
        this.overlayCanvas.style.left = '0';
        this.overlayCanvas.style.width = '100%';
        this.overlayCanvas.style.height = '100%';
        this.overlayCanvas.style.pointerEvents = 'none';
        this.overlayCanvas.style.zIndex = '50';
        document.body.appendChild(this.overlayCanvas);
        this.overlayCtx = this.overlayCanvas.getContext('2d');
        
        this.resizeOverlay();
        window.addEventListener('resize', () => this.resizeOverlay());
        
        // Bind game loop
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);
        
        // Bind to start button
        document.getElementById('startButton').addEventListener('click', () => {
            this.start();
        });
    }
    
    resizeOverlay() {
        this.overlayCanvas.width = window.innerWidth;
        this.overlayCanvas.height = window.innerHeight;
    }
    
    start() {
        // Hide start screen
        document.getElementById('startScreen').style.display = 'none';
        
        // Init audio
        sounds.init();
        
        // Request pointer lock
        this.canvas.requestPointerLock();
        
        // Start loop
        this.started = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
    }
    
    gameLoop(time) {
        if (!this.started || this.gameOver) return;
        
        const dt = Math.min((time - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = time;
        
        // Update players
        this.player1.update(dt, this.world, input);
        this.player2.update(dt, this.world, input);
        
        // Handle firing
        this.handleFiring();
        
        // Update projectiles
        this.projectileManager.update(dt);
        
        // Check hits
        this.checkHits();
        
        // Check win condition
        this.checkWin();
        
        // Render
        this.renderer.render();
        
        // Render overlays
        this.renderer.renderOverlay(
            this.overlayCtx,
            this.player1.getDamageFlash(),
            this.player2.getDamageFlash()
        );
        
        // Update reload status display
        this.updateReloadDisplay();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    handleFiring() {
        // P1 fire
        if (input.isP1FirePressed()) {
            if (this.player1.fire(input)) {
                // Spawn projectile
                const startPos = this.player1.getMuzzlePosition();
                const direction = this.player1.getAimDirection();
                // Add slight randomness for musket inaccuracy
                const spread = 0.02; // ~2 MOA for smoothbore
                direction.x += (Math.random() - 0.5) * spread;
                direction.y += (Math.random() - 0.5) * spread;
                direction.z += (Math.random() - 0.5) * spread;
                direction.normalize();
                
                this.projectileManager.spawnProjectile(
                    startPos, direction, 1
                );
            }
            input.setP1FirePressed(false); // Reset for semi-auto feel
        }
        
        // P2 fire
        if (input.isP2FirePressed()) {
            if (this.player2.fire(input)) {
                const startPos = this.player2.getMuzzlePosition();
                const direction = this.player2.getAimDirection();
                const spread = 0.02;
                direction.x += (Math.random() - 0.5) * spread;
                direction.y += (Math.random() - 0.5) * spread;
                direction.z += (Math.random() - 0.5) * spread;
                direction.normalize();
                
                this.projectileManager.spawnProjectile(
                    startPos, direction, 2
                );
            }
        }
    }
    
    checkHits() {
        // P1 check if hit
        const p1Hit = this.projectileManager.checkPlayerHits(this.player1, 1);
        if (p1Hit.hit) {
            this.player1.takeDamage(100); // One shot kill
        }
        
        // P2 check if hit
        const p2Hit = this.projectileManager.checkPlayerHits(this.player2, 2);
        if (p2Hit.hit) {
            this.player2.takeDamage(100);
        }
        
        // Check if players died this frame and award scores
        if (this.player1.dead && this.player1.respawnTimer === 3.0) {
            this.p2Score++;
        }
        if (this.player2.dead && this.player2.respawnTimer === 3.0) {
            this.p1Score++;
        }
    }
    
    checkWin() {
        if (this.p1Score >= this.scoreToWin) {
            this.endGame(1);
        } else if (this.p2Score >= this.scoreToWin) {
            this.endGame(2);
        }
    }
    
    endGame(winner) {
        this.gameOver = true;
        
        // Show end screen
        const startScreen = document.getElementById('startScreen');
        startScreen.style.display = 'flex';
        startScreen.innerHTML = `
            <h1 style="color: ${winner === 1 ? '#4a9' : '#a94'}">PLAYER ${winner} WINS!</h1>
            <p style="color: #888; font-size: 24px;">${this.p1Score} - ${this.p2Score}</p>
            <button id="restartButton" style="padding: 15px 40px; font-size: 20px; background: #333; color: #c9a227; border: 2px solid #c9a227; cursor: pointer; font-family: Courier New; margin-top: 20px;">PLAY AGAIN</button>
        `;
        
        document.getElementById('restartButton').addEventListener('click', () => {
            location.reload();
        });
        
        // Exit pointer lock
        document.exitPointerLock();
    }
    
    updateReloadDisplay() {
        const p1Status = this.player1.getReloadStatus();
        const p2Status = this.player2.getReloadStatus();
        
        let statusText = '';
        
        if (!this.player1.dead && !this.player2.dead) {
            if (p1Status.state !== RELOAD_PHASES.READY) {
                statusText += `P1: ${p1Status.name} `;
                const bar = '█'.repeat(Math.floor(p1Status.progress * 10)) + 
                           '░'.repeat(10 - Math.floor(p1Status.progress * 10));
                statusText += `[${bar}] `;
            }
            
            if (p2Status.state !== RELOAD_PHASES.READY) {
                statusText += `| P2: ${p2Status.name} `;
                const bar = '█'.repeat(Math.floor(p2Status.progress * 10)) + 
                           '░'.repeat(10 - Math.floor(p2Status.progress * 10));
                statusText += `[${bar}]`;
            }
        }
        
        this.reloadStatus.textContent = statusText;
    }
}

// Initialize game when DOM ready
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});
