// Game state and logic module

export class Game {
    constructor() {
        this.map = this.createMap();
        this.player1 = this.createPlayer(1);
        this.player2 = this.createPlayer(2);
        this.winner = null;
        this.gameTime = 0;
    }
    
    createMap() {
        // Simple maze map (0 = empty, 1-9 = wall types)
        const mapData = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 0, 1, 1, 0, 0, 1],
            [1, 0, 1, 0, 0, 0, 1, 0, 1, 1],
            [1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [1, 1, 1, 0, 1, 1, 1, 0, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];
        
        return {
            data: mapData,
            width: 10,
            height: 10,
            cellSize: 1.0
        };
    }
    
    createPlayer(playerNumber) {
        const spawnPoints = [
            { x: 1.5, y: 1.5, angle: Math.PI / 4 }, // Player 1 spawn
            { x: 8.5, y: 8.5, angle: -Math.PI / 4 }  // Player 2 spawn
        ];
        
        const spawn = spawnPoints[playerNumber - 1];
        
        return {
            playerNumber,
            x: spawn.x,
            y: spawn.y,
            angle: spawn.angle,
            health: 100,
            score: 0,
            ammo: 1, // Single shot before reload
            isReloading: false,
            reloadProgress: 0,
            reloadTime: 5.0, // 5 seconds for full reload
            reloadStage: 0, // 0-4 for reload steps
            isIronSight: false,
            ironSightFOV: Math.PI / 6, // Narrow FOV
            normalFOV: Math.PI / 3,    // Normal FOV
            moveSpeed: 2.0,
            turnSpeed: Math.PI,
            velocity: { x: 0, y: 0 },
            isMoving: false,
            canFire: true,
            fireCooldown: 0,
            hitCooldown: 0
        };
    }
    
    reset() {
        this.player1 = this.createPlayer(1);
        this.player2 = this.createPlayer(2);
        this.winner = null;
        this.gameTime = 0;
    }
    
    update(deltaTime, input) {
        this.gameTime += deltaTime;
        
        // Update players
        this.updatePlayer(this.player1, deltaTime, input.player1);
        this.updatePlayer(this.player2, deltaTime, input.player2);
        
        // Check for hits
        this.checkHits();
        
        // Update cooldowns
        this.player1.fireCooldown = Math.max(0, this.player1.fireCooldown - deltaTime);
        this.player2.fireCooldown = Math.max(0, this.player2.fireCooldown - deltaTime);
        
        this.player1.hitCooldown = Math.max(0, this.player1.hitCooldown - deltaTime);
        this.player2.hitCooldown = Math.max(0, this.player2.hitCooldown - deltaTime);
    }
    
    updatePlayer(player, deltaTime, input) {
        // Apply movement
        if (input.moveForward) {
            player.velocity.x = Math.cos(player.angle) * player.moveSpeed;
            player.velocity.y = Math.sin(player.angle) * player.moveSpeed;
            player.isMoving = true;
        } else if (input.moveBackward) {
            player.velocity.x = -Math.cos(player.angle) * player.moveSpeed;
            player.velocity.y = -Math.sin(player.angle) * player.moveSpeed;
            player.isMoving = true;
        } else {
            player.velocity.x = 0;
            player.velocity.y = 0;
            player.isMoving = false;
        }
        
        // Apply strafing
        if (input.moveLeft) {
            player.velocity.x += Math.cos(player.angle - Math.PI / 2) * player.moveSpeed;
            player.velocity.y += Math.sin(player.angle - Math.PI / 2) * player.moveSpeed;
            player.isMoving = true;
        }
        if (input.moveRight) {
            player.velocity.x += Math.cos(player.angle + Math.PI / 2) * player.moveSpeed;
            player.velocity.y += Math.sin(player.angle + Math.PI / 2) * player.moveSpeed;
            player.isMoving = true;
        }
        
        // Apply turning
        if (input.turnLeft) {
            player.angle -= player.turnSpeed * deltaTime;
        }
        if (input.turnRight) {
            player.angle += player.turnSpeed * deltaTime;
        }
        
        // Normalize angle
        player.angle = player.angle % (Math.PI * 2);
        
        // Update position with collision detection
        this.movePlayer(player, deltaTime);
        
        // Update iron sights
        player.isIronSight = input.ironSight && !player.isReloading;
        
        // Handle firing
        if (input.fire && player.canFire && player.fireCooldown <= 0 && !player.isReloading) {
            if (player.ammo > 0) {
                this.fireMusket(player);
            } else {
                // Start reload if empty
                if (!player.isReloading) {
                    player.isReloading = true;
                    player.reloadProgress = 0;
                }
            }
        }
        
        // Handle reload
        if (input.reload && player.ammo === 0 && !player.isReloading) {
            player.isReloading = true;
            player.reloadProgress = 0;
        }
        
        // Update reload progress
        if (player.isReloading) {
            // If player moves during reload, interrupt it
            if (player.isMoving) {
                player.isReloading = false;
                player.reloadProgress = 0;
            } else {
                player.reloadProgress += deltaTime;
                
                // Update reload stage based on progress
                player.reloadStage = Math.floor(player.reloadProgress / (player.reloadTime / 5));
                
                // Complete reload
                if (player.reloadProgress >= player.reloadTime) {
                    player.isReloading = false;
                    player.ammo = 1;
                    player.reloadProgress = 0;
                    player.reloadStage = 0;
                }
            }
        }
        
        // Update fire ability
        player.canFire = player.ammo > 0 && !player.isReloading;
    }
    
    movePlayer(player, deltaTime) {
        const newX = player.x + player.velocity.x * deltaTime;
        const newY = player.y + player.velocity.y * deltaTime;
        
        // Simple collision detection
        const mapX = Math.floor(newX);
        const mapY = Math.floor(newY);
        
        if (mapX >= 0 && mapX < this.map.width && 
            mapY >= 0 && mapY < this.map.height && 
            this.map.data[mapY][mapX] === 0) {
            player.x = newX;
            player.y = newY;
        } else {
            // Try moving in X only
            const mapXOnly = Math.floor(player.x + player.velocity.x * deltaTime);
            if (mapXOnly >= 0 && mapXOnly < this.map.width && 
                mapY >= 0 && mapY < this.map.height && 
                this.map.data[mapY][mapXOnly] === 0) {
                player.x = player.x + player.velocity.x * deltaTime;
            }
            
            // Try moving in Y only
            const mapYOnly = Math.floor(player.y + player.velocity.y * deltaTime);
            if (mapX >= 0 && mapX < this.map.width && 
                mapYOnly >= 0 && mapYOnly < this.map.height && 
                this.map.data[mapYOnly][mapX] === 0) {
                player.y = player.y + player.velocity.y * deltaTime;
            }
        }
    }
    
    fireMusket(player) {
        player.ammo = 0;
        player.fireCooldown = 0.5; // Half-second cooldown
        
        // Play sound via event
        const event = new CustomEvent('musketFire', {
            detail: { playerNumber: player.playerNumber }
        });
        window.dispatchEvent(event);
        
        // Calculate shot direction
        const shotAngle = player.angle;
        const shotRange = 20.0; // Maximum range
        
        // Check if shot hits other player
        const targetPlayer = player.playerNumber === 1 ? this.player2 : this.player1;
        
        // Simple line-of-sight check
        const dx = targetPlayer.x - player.x;
        const dy = targetPlayer.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= shotRange) {
            // Check angle difference (accuracy based on iron sights)
            const angleToTarget = Math.atan2(dy, dx);
            let angleDiff = Math.abs(angleToTarget - shotAngle);
            angleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
            
            // Accuracy is much better with iron sights
            const accuracy = player.isIronSight ? Math.PI / 36 : Math.PI / 12; // 5° or 15°
            
            if (angleDiff <= accuracy) {
                // Hit!
                targetPlayer.health = Math.max(0, targetPlayer.health - 25);
                player.score++;
                
                // Play hit sound
                const hitEvent = new CustomEvent('playerHit', {
                    detail: { playerNumber: targetPlayer.playerNumber }
                });
                window.dispatchEvent(hitEvent);
                
                // Hit cooldown to prevent rapid hits
                targetPlayer.hitCooldown = 0.5;
            }
        }
    }
    
    checkHits() {
        // Additional hit detection for melee or environmental damage
        // Could be expanded for grenades, traps, etc.
    }
    
    checkVictory() {
        if (this.player1.score >= 5) {
            this.winner = 1;
            return true;
        }
        if (this.player2.score >= 5) {
            this.winner = 2;
            return true;
        }
        return false;
    }
}