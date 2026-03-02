/**
 * Player Controller - Movement, input, and physics
 * Supports two players with independent input sets
 */

const Player = {
    // Movement constants
    MOVE_SPEED: 1.5,           // Units per frame
    ROTATION_SPEED: 0.03,      // Radians per frame
    MUSKET_ROTATION_SPEED: 0.04,
    PLAYER_RADIUS: 12,
    
    // Input keys (using key codes for scancode independence)
    KEYS: {
        P1: {
            UP: 'KeyW',
            DOWN: 'KeyS',
            LEFT: 'KeyA',
            RIGHT: 'KeyD',
            ROTATE_LEFT: 'KeyQ',
            ROTATE_RIGHT: 'KeyE',
            AIM: 'KeyX',
            FIRE: 'KeyF',
            RELOAD: 'KeyR'
        },
        P2: {
            UP: 'ArrowUp',
            DOWN: 'ArrowDown',
            LEFT: 'ArrowLeft',
            RIGHT: 'ArrowRight',
            ROTATE_LEFT: 'Numpad7',
            ROTATE_RIGHT: 'Numpad9',
            AIM: 'NumpadEnter',
            FIRE: 'NumpadAdd',
            RELOAD: 'Numpad0'
        }
    },
    
    // Track pressed keys
    pressedKeys: new Set(),
    
    /**
     * Initialize input listeners
     */
    initInput() {
        window.addEventListener('keydown', (e) => {
            this.pressedKeys.add(e.code);
        });
        
        window.addEventListener('keyup', (e) => {
            this.pressedKeys.delete(e.code);
        });
    },
    
    /**
     * Create a new player
     */
    create(x, y, angle, isPlayer2 = false) {
        return {
            x: x,
            y: y,
            angle: angle,              // Facing angle
            musketAngle: 0,            // Relative to facing
            height: 32,                // Eye height
            isPlayer2: isPlayer2,
            musket: Musket.create(),
            
            // State
            aiming: false,
            alive: true,
            health: 100,
            
            // Ballistics
            lastShotTime: 0,
            shotCooldown: 100,         // Minimum ms between shots
            
            // Animation
            bobPhase: 0,
            recoil: 0
        };
    },
    
    /**
     * Check if a key is pressed for a player
     */
    isPressed(player, action) {
        const keySet = player.isPlayer2 ? this.KEYS.P2 : this.KEYS.P1;
        return this.pressedKeys.has(keySet[action]);
    },
    
    /**
     * Update player state
     */
    update(player) {
        if (!player.alive) return;
        
        // Update musket state machine
        Musket.update(player.musket);
        
        // Handle input
        this.handleMovement(player);
        this.handleMusketRotation(player);
        this.handleActions(player);
        
        // Update animations
        this.updateAnimations(player);
    },
    
    /**
     * Handle movement input
     */
    handleMovement(player) {
        let moveX = 0;
        let moveY = 0;
        let moving = false;
        
        if (this.isPressed(player, 'UP')) {
            moveX += Math.cos(player.angle) * this.MOVE_SPEED;
            moveY += Math.sin(player.angle) * this.MOVE_SPEED;
            moving = true;
        }
        
        if (this.isPressed(player, 'DOWN')) {
            moveX -= Math.cos(player.angle) * this.MOVE_SPEED * 0.6;
            moveY -= Math.sin(player.angle) * this.MOVE_SPEED * 0.6;
            moving = true;
        }
        
        if (this.isPressed(player, 'LEFT')) {
            player.angle -= this.ROTATION_SPEED;
        }
        
        if (this.isPressed(player, 'RIGHT')) {
            player.angle += this.ROTATION_SPEED;
        }
        
        // Normalize angle
        player.angle = player.angle % (Math.PI * 2);
        if (player.angle < 0) player.angle += Math.PI * 2;
        
        // Attempt to move
        if (moving) {
            const newX = player.x + moveX;
            const newY = player.y + moveY;
            
            // Check collision independently for X and Y
            if (Raycaster.isValidPosition(newX, player.y, this.PLAYER_RADIUS)) {
                player.x = newX;
            }
            if (Raycaster.isValidPosition(player.x, newY, this.PLAYER_RADIUS)) {
                player.y = newY;
            }
            
            player.bobPhase += 0.3;
        }
    },
    
    /**
     * Handle musket rotation (Q/E or numpad 7/9)
     */
    handleMusketRotation(player) {
        // Only rotate musket when not aiming
        if (!player.aiming) {
            if (this.isPressed(player, 'ROTATE_LEFT')) {
                player.musketAngle -= this.MUSKET_ROTATION_SPEED;
            }
            if (this.isPressed(player, 'ROTATE_RIGHT')) {
                player.musketAngle += this.MUSKET_ROTATION_SPEED;
            }
        }
        
        // Clamp musket angle
        player.musketAngle = Math.max(-0.5, Math.min(0.5, player.musketAngle));
    },
    
    /**
     * Handle firing, aiming, reloading
     */
    handleActions(player) {
        const now = Date.now();
        
        // Aim (hold)
        player.aiming = this.isPressed(player, 'AIM');
        
        // Fire
        if (this.isPressed(player, 'FIRE')) {
            if (now - player.lastShotTime > player.shotCooldown) {
                const result = Musket.fire(player.musket);
                if (result.fired) {
                    this.fireShot(player);
                    player.lastShotTime = now;
                    player.recoil = 1.0;
                }
            }
        }
        
        // Reload
        if (this.isPressed(player, 'RELOAD')) {
            // Just trigger once per press would be better, but holding works for now
            if (player.musket.state === ReloadStage.READY && !player.musket.loaded) {
                Musket.startReload(player.musket);
            }
        }
    },
    
    /**
     * Fire a shot with ballistics
     */
    fireShot(player) {
        // Calculate total aim angle
        const aimAngle = player.angle + player.musketAngle;
        
        // Add musket sway
        const sway = Musket.getSway(player.aiming, Date.now());
        const finalAngle = aimAngle + (sway.x * 0.01);
        
        // Create projectile
        Game.createProjectile(
            player.x,
            player.y,
            finalAngle,
            player
        );
    },
    
    /**
     * Update animations
     */
    updateAnimations(player) {
        // Decay recoil
        player.recoil *= 0.85;
    },
    
    /**
     * Take damage
     */
    takeDamage(player, amount) {
        player.health -= amount;
        if (player.health <= 0) {
            player.alive = false;
            player.health = 0;
        }
    },
    
    /**
     * Get effective view angle (includes musket rotation)
     */
    getViewAngle(player) {
        return player.angle + player.musketAngle;
    },
    
    /**
     * Respawn player
     */
    respawn(player, x, y, angle) {
        player.x = x;
        player.y = y;
        player.angle = angle;
        player.musketAngle = 0;
        player.health = 100;
        player.alive = true;
        player.musket = Musket.create();
        player.recoil = 0;
    }
};

// Initialize input on load
Player.initInput();
