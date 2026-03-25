// Player class for musket duel

export class Player {
    constructor(id, x, y, angle, moveSpeed = 0.05) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.angle = angle; // In radians
        this.moveSpeed = moveSpeed;
        this.rotateSpeed = 0.04;
        
        // Game stats
        this.health = 100;
        this.maxHealth = 100;
        this.score = 0;
        
        // State
        this.isMoving = false;
        this.isReloading = false;
        this.isAiming = false;
        this.steadyAim = false; // Holding breath for steady aim
        
        // Input mappings
        this.keyMap = id === 1 ? {
            up: 'w',
            down: 's',
            left: 'a',
            right: 'd',
            reload: 'r',
            steady: 'shift'
        } : {
            up: 'arrowup',
            down: 'arrowdown',
            left: 'arrowleft',
            right: 'arrowright',
            reload: 'enter',
            steady: 'control'
        };
    }
    
    reset() {
        this.health = this.maxHealth;
        this.score = 0;
        this.isMoving = false;
        this.isReloading = false;
        this.isAiming = false;
        this.steadyAim = false;
        
        // Reset position based on player ID
        if (this.id === 1) {
            this.x = 3.5;
            this.y = 3.5;
            this.angle = Math.PI * 0.25;
        } else {
            this.x = 6.5;
            this.y = 6.5;
            this.angle = Math.PI * 1.75;
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }
    
    update(deltaTime, keys, mouse, map) {
        // Check if reloading (prevents movement)
        if (this.isReloading) {
            this.isMoving = false;
            return;
        }
        
        // Handle rotation based on mouse position
        this.handleAiming(mouse);
        
        // Handle movement
        this.handleMovement(deltaTime, keys, map);
        
        // Handle steady aim (holding breath)
        this.steadyAim = keys[this.keyMap.steady] || false;
        
        // Check for reload start
        if (keys[this.keyMap.reload]) {
            this.isReloading = true;
            // Key will be cleared by musket class
        }
    }
    
    handleAiming(mouse) {
        // Convert mouse position to angle change
        // Player 1 uses top half of screen, Player 2 uses bottom half
        const screenHalfHeight = window.innerHeight / 2;
        
        if (this.id === 1) {
            // Player 1: aim based on mouse position in top half
            const mouseY = Math.max(0, Math.min(mouse.y, screenHalfHeight));
            const normalizedY = (mouseY / screenHalfHeight) * 2 - 1; // -1 to 1
            
            // Horizontal aiming (left/right)
            const mouseX = mouse.x;
            const normalizedX = (mouseX / window.innerWidth) * 2 - 1;
            
            // Apply rotation (slower vertical aim for realism)
            this.angle += normalizedX * this.rotateSpeed * 0.5;
            // Vertical aim affects "pitch" but we're doing 2.5D, so just adjust angle slightly
            this.angle += normalizedY * this.rotateSpeed * 0.1;
        } else {
            // Player 2: aim based on mouse position in bottom half
            const mouseY = Math.max(screenHalfHeight, Math.min(mouse.y, window.innerHeight));
            const normalizedY = ((mouseY - screenHalfHeight) / screenHalfHeight) * 2 - 1;
            
            const mouseX = mouse.x;
            const normalizedX = (mouseX / window.innerWidth) * 2 - 1;
            
            this.angle += normalizedX * this.rotateSpeed * 0.5;
            this.angle += normalizedY * this.rotateSpeed * 0.1;
        }
        
        // Normalize angle to 0-2π
        this.angle = this.angle % (Math.PI * 2);
        if (this.angle < 0) this.angle += Math.PI * 2;
    }
    
    handleMovement(deltaTime, keys, map) {
        let moveX = 0;
        let moveY = 0;
        this.isMoving = false;
        
        // Forward/backward
        if (keys[this.keyMap.up]) {
            moveX += Math.cos(this.angle) * this.moveSpeed * deltaTime * 60;
            moveY += Math.sin(this.angle) * this.moveSpeed * deltaTime * 60;
            this.isMoving = true;
        }
        if (keys[this.keyMap.down]) {
            moveX -= Math.cos(this.angle) * this.moveSpeed * deltaTime * 60;
            moveY -= Math.sin(this.angle) * this.moveSpeed * deltaTime * 60;
            this.isMoving = true;
        }
        
        // Strafe left/right
        if (keys[this.keyMap.left]) {
            moveX += Math.cos(this.angle - Math.PI/2) * this.moveSpeed * deltaTime * 60 * 0.7;
            moveY += Math.sin(this.angle - Math.PI/2) * this.moveSpeed * deltaTime * 60 * 0.7;
            this.isMoving = true;
        }
        if (keys[this.keyMap.right]) {
            moveX += Math.cos(this.angle + Math.PI/2) * this.moveSpeed * deltaTime * 60 * 0.7;
            moveY += Math.sin(this.angle + Math.PI/2) * this.moveSpeed * deltaTime * 60 * 0.7;
            this.isMoving = true;
        }
        
        // Check collision with walls
        if (moveX !== 0 || moveY !== 0) {
            const newX = this.x + moveX;
            const newY = this.y + moveY;
            
            // Simple collision detection
            if (!map.isWall(Math.floor(newX), Math.floor(this.y))) {
                this.x = newX;
            }
            if (!map.isWall(Math.floor(this.x), Math.floor(newY))) {
                this.y = newY;
            }
            
            // Also check diagonal
            if (map.isWall(Math.floor(newX), Math.floor(newY))) {
                // Try x-only or y-only
                if (!map.isWall(Math.floor(newX), Math.floor(this.y))) {
                    this.x = newX;
                } else if (!map.isWall(Math.floor(this.x), Math.floor(newY))) {
                    this.y = newY;
                }
            }
        }
    }
    
    getScreenPosition(isPlayer1Viewport = true) {
        // For rendering from this player's perspective
        return {
            x: this.x,
            y: this.y,
            angle: this.angle
        };
    }
}