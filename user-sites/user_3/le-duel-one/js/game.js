/**
 * Game Controller - Main loop, projectiles, scoring
 */

const Game = {
    // Canvas
    canvas: document.getElementById('gameCanvas'),
    instructions: document.getElementById('instructions'),
    
    // Game state
    running: false,
    lastTime: 0,
    
    // Players
    player1: null,
    player2: null,
    
    // Projectiles
    projectiles: [],
    
    // Game settings
    MUSKET_BALL_SPEED: 8,      // Units per frame
    MUSKET_BALL_DAMAGE: 100,   // One shot kill
    MUSKET_BALL_DROP: 0.02,    // Gravity effect per frame
    
    /**
     * Initialize game
     */
    init() {
        // Hide instructions on click
        this.instructions.addEventListener('click', () => {
            this.start();
        });
        
        // Initialize renderer
        Renderer.init(this.canvas);
        
        // Create players at opposite corners
        this.player1 = Player.create(
            100, 100,           // Position
            Math.PI / 4,        // Facing
            false               // Not player 2
        );
        
        this.player2 = Player.create(
            900, 900,           // Position (opposite corner)
            Math.PI * 1.25,     // Facing toward P1
            true                // Is player 2
        );
        
        // Request fullscreen
        document.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        }, { once: true });
    },
    
    /**
     * Start game
     */
    start() {
        this.instructions.classList.add('hidden');
        this.canvas.style.display = 'block';
        this.running = true;
        this.lastTime = performance.now();
        
        // Start loop
        requestAnimationFrame((t) => this.loop(t));
    },
    
    /**
     * Main game loop
     */
    loop(timestamp) {
        if (!this.running) return;
        
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Update
        this.update();
        
        // Render
        Renderer.render(this.player1, this.player2);
        
        requestAnimationFrame((t) => this.loop(t));
    },
    
    /**
     * Update game state
     */
    update() {
        // Update players
        Player.update(this.player1);
        Player.update(this.player2);
        
        // Update projectiles
        this.updateProjectiles();
        
        // Check win condition
        this.checkWinCondition();
    },
    
    /**
     * Create a projectile (musket ball)
     */
    createProjectile(x, y, angle, owner) {
        // Add some randomness based on movement and sway
        const sway = Musket.getSway(owner.aiming, Date.now());
        const finalAngle = angle + (Math.random() - 0.5) * 0.02 + (sway.x * 0.005);
        
        // Calculate initial velocity with drop simulation
        const speed = this.MUSKET_BALL_SPEED;
        const vx = Math.cos(finalAngle) * speed;
        const vy = Math.sin(finalAngle) * speed;
        
        this.projectiles.push({
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            vz: 2,              // Initial vertical velocity (ballistic arc)
            owner: owner,
            active: true,
            distance: 0
        });
    },
    
    /**
     * Update all projectiles
     */
    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            
            if (!p.active) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Move
            p.x += p.vx;
            p.y += p.vy;
            p.vz -= this.MUSKET_BALL_DROP; // Gravity
            p.distance += Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            
            // Check wall collision
            if (!Raycaster.isValidPosition(p.x, p.y, 2)) {
                p.active = false;
                continue;
            }
            
            // Check player collisions
            this.checkProjectileHits(p);
            
            // Remove if too far
            if (p.distance > 1000 || p.vz < -10) {
                p.active = false;
            }
        }
    },
    
    /**
     * Check if projectile hits any player
     */
    checkProjectileHits(projectile) {
        const targets = [this.player1, this.player2];
        
        for (const target of targets) {
            if (target === projectile.owner) continue;
            if (!target.alive) continue;
            
            const dx = target.x - projectile.x;
            const dy = target.y - projectile.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < Player.PLAYER_RADIUS + 5) {
                // Hit!
                Player.takeDamage(target, this.MUSKET_BALL_DAMAGE);
                projectile.active = false;
                
                // Visual feedback could go here
                break;
            }
        }
    },
    
    /**
     * Check win condition and respawn
     */
    checkWinCondition() {
        const p1Dead = !this.player1.alive;
        const p2Dead = !this.player2.alive;
        
        if (p1Dead && p2Dead) {
            // Mutual kill - respawn both after delay
            setTimeout(() => {
                Player.respawn(this.player1, 100, 100, Math.PI / 4);
                Player.respawn(this.player2, 900, 900, Math.PI * 1.25);
            }, 2000);
        } else if (p1Dead) {
            // P2 wins
            setTimeout(() => {
                Player.respawn(this.player1, 100, 100, Math.PI / 4);
            }, 2000);
        } else if (p2Dead) {
            // P1 wins
            setTimeout(() => {
                Player.respawn(this.player2, 900, 900, Math.PI * 1.25);
            }, 2000);
        }
    },
    
    /**
     * Reset game
     */
    reset() {
        Player.respawn(this.player1, 100, 100, Math.PI / 4);
        Player.respawn(this.player2, 900, 900, Math.PI * 1.25);
        this.projectiles = [];
    }
};

// Initialize on load
window.addEventListener('load', () => {
    Game.init();
});
