/**
 * Player Class
 * Handles movement, collision, and musket operations
 */
class Player {
    constructor(x, y, angle, color, controls) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.color = color; // For identification
        this.controls = controls;
        
        // Movement
        this.moveSpeed = 3.0;
        this.turnSpeed = 2.0;
        this.radius = 0.3;
        
        // Health
        this.alive = true;
        this.respawnTimer = 0;
        
        // Musket
        this.musket = new FlintlockMusket();
        
        // Input state
        this.keys = {};
        
        // Score
        this.kills = 0;
        this.deaths = 0;
    }
    
    setKey(key, pressed) {
        this.keys[key] = pressed;
    }
    
    update(deltaTime, map, otherPlayer) {
        if (!this.alive) {
            this.respawnTimer -= deltaTime;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }
        
        // Update musket
        this.musket.update(deltaTime);
        
        // Handle movement
        this.handleMovement(deltaTime, map);
        
        // Handle turning
        this.handleTurning(deltaTime);
        
        // Handle musket actions
        this.handleMusketActions(otherPlayer);
    }
    
    handleMovement(deltaTime, map) {
        let moveX = 0;
        let moveY = 0;
        
        if (this.keys[this.controls.forward]) {
            moveX += Math.cos(this.angle) * this.moveSpeed * deltaTime;
            moveY += Math.sin(this.angle) * this.moveSpeed * deltaTime;
        }
        if (this.keys[this.controls.backward]) {
            moveX -= Math.cos(this.angle) * this.moveSpeed * deltaTime * 0.6;
            moveY -= Math.sin(this.angle) * this.moveSpeed * deltaTime * 0.6;
        }
        if (this.keys[this.controls.strafeLeft]) {
            moveX += Math.cos(this.angle - Math.PI / 2) * this.moveSpeed * deltaTime * 0.7;
            moveY += Math.sin(this.angle - Math.PI / 2) * this.moveSpeed * deltaTime * 0.7;
        }
        if (this.keys[this.controls.strafeRight]) {
            moveX += Math.cos(this.angle + Math.PI / 2) * this.moveSpeed * deltaTime * 0.7;
            moveY += Math.sin(this.angle + Math.PI / 2) * this.moveSpeed * deltaTime * 0.7;
        }
        
        // Try to move, with collision
        this.tryMove(moveX, 0, map);
        this.tryMove(0, moveY, map);
    }
    
    tryMove(dx, dy, map) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        // Check collision with walls
        if (!map.isWall(newX - this.radius, newY) && 
            !map.isWall(newX + this.radius, newY) &&
            !map.isWall(newX, newY - this.radius) && 
            !map.isWall(newX, newY + this.radius)) {
            this.x = newX;
            this.y = newY;
        }
    }
    
    handleTurning(deltaTime) {
        if (this.keys[this.controls.turnLeft]) {
            this.angle -= this.turnSpeed * deltaTime;
        }
        if (this.keys[this.controls.turnRight]) {
            this.angle += this.turnSpeed * deltaTime;
        }
    }
    
    handleMusketActions(otherPlayer) {
        // Toggle iron sights
        if (this.keys[this.controls.aim]) {
            this.keys[this.controls.aim] = false; // One-shot
            this.musket.toggleIronSights();
        }
        
        // Fire
        if (this.keys[this.controls.fire]) {
            this.keys[this.controls.fire] = false; // One-shot
            const shot = this.musket.fire(this.musket.ironSightsActive);
            if (shot.fired) {
                this.shoot(shot, otherPlayer);
            }
        }
        
        // Reload
        if (this.keys[this.controls.reload]) {
            this.keys[this.controls.reload] = false; // One-shot
            this.musket.startReload(
                (stepName, stepDesc, progress) => {
                    // Optional: Update UI with reload progress
                },
                () => {
                    // Reload complete
                }
            );
        }
    }
    
    shoot(shot, otherPlayer) {
        // Calculate shot trajectory
        const shotAngle = this.angle + shot.spread;
        const maxRange = shot.range;
        
        // Raycast for hit detection
        const hit = this.castShot(this.x, this.y, shotAngle, maxRange, otherPlayer);
        
        if (hit && hit.player) {
            otherPlayer.takeDamage();
            this.kills++;
        }
    }
    
    castShot(startX, startY, angle, maxRange, targetPlayer) {
        // Simple raycast to check for player hit
        const stepSize = 0.1;
        let distance = 0;
        
        while (distance < maxRange) {
            distance += stepSize;
            const checkX = startX + Math.cos(angle) * distance;
            const checkY = startY + Math.sin(angle) * distance;
            
            // Check wall collision
            if (MAP.isWall(checkX, checkY)) {
                return null; // Hit wall
            }
            
            // Check player collision
            const dx = checkX - targetPlayer.x;
            const dy = checkY - targetPlayer.y;
            const distToPlayer = Math.sqrt(dx * dx + dy * dy);
            
            if (distToPlayer < targetPlayer.radius) {
                return { player: true, distance: distance };
            }
        }
        
        return null;
    }
    
    takeDamage() {
        this.alive = false;
        this.deaths++;
        this.respawnTimer = 3.0;
        this.musket.cancelReload();
    }
    
    respawn() {
        this.alive = true;
        // Random respawn position
        const respawns = [
            { x: 3, y: 3, angle: 0 },
            { x: 20, y: 3, angle: Math.PI },
            { x: 3, y: 12, angle: 0 },
            { x: 20, y: 12, angle: Math.PI }
        ];
        const spawn = respawns[Math.floor(Math.random() * respawns.length)];
        this.x = spawn.x;
        this.y = spawn.y;
        this.angle = spawn.angle;
        this.musket = new FlintlockMusket();
    }
    
    getPosition() {
        return { x: this.x, y: this.y, angle: this.angle };
    }
    
    isAlive() {
        return this.alive;
    }
}

// Control schemes
const CONTROLS_P1 = {
    forward: 'KeyW',
    backward: 'KeyS',
    strafeLeft: 'KeyA',
    strafeRight: 'KeyD',
    turnLeft: 'KeyQ',
    turnRight: 'KeyE',
    aim: 'KeyX',
    fire: 'KeyF',
    reload: 'KeyR'
};

const CONTROLS_P2 = {
    forward: 'ArrowUp',
    backward: 'ArrowDown',
    strafeLeft: 'ArrowLeft',
    strafeRight: 'ArrowRight',
    turnLeft: 'Comma',
    turnRight: 'Period',
    aim: 'KeyM',
    fire: 'Slash',
    reload: 'KeyK'
};
