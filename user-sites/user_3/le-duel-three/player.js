class Player {
    constructor(x, y, angle, keys, color) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.keys = keys;
        this.color = color;
        this.musket = new Musket();
        
        this.moveSpeed = 0.03;
        this.rotSpeed = 0.002;
        this.radius = 0.3;
        
        this.keyState = {};
        this.alive = true;
        this.respawnTimer = 0;
    }

    setKey(key, pressed) {
        this.keyState[key] = pressed;
    }

    update(dt, otherPlayer) {
        if (!this.alive) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }

        this.musket.update(dt);

        // Movement
        let moveX = 0;
        let moveY = 0;

        if (this.keyState[this.keys.forward]) {
            moveX += Math.cos(this.angle) * this.moveSpeed * dt;
            moveY += Math.sin(this.angle) * this.moveSpeed * dt;
        }
        if (this.keyState[this.keys.backward]) {
            moveX -= Math.cos(this.angle) * this.moveSpeed * dt * 0.6;
            moveY -= Math.sin(this.angle) * this.moveSpeed * dt * 0.6;
        }
        if (this.keyState[this.keys.left]) {
            moveX += Math.cos(this.angle - Math.PI/2) * this.moveSpeed * dt;
            moveY += Math.sin(this.angle - Math.PI/2) * this.moveSpeed * dt;
        }
        if (this.keyState[this.keys.right]) {
            moveX += Math.cos(this.angle + Math.PI/2) * this.moveSpeed * dt;
            moveY += Math.sin(this.angle + Math.PI/2) * this.moveSpeed * dt;
        }

        // Collision detection with walls
        this.tryMove(moveX, 0);
        this.tryMove(0, moveY);

        // Musket tilt
        if (this.keyState[this.keys.tiltLeft]) {
            this.musket.tiltMusket(-1);
        }
        if (this.keyState[this.keys.tiltRight]) {
            this.musket.tiltMusket(1);
        }

        // Aiming
        this.musket.setAiming(this.keyState[this.keys.aim]);

        // Actions
        if (this.keyState[this.keys.fire]) {
            this.tryFire(otherPlayer);
        }
        if (this.keyState[this.keys.reload]) {
            this.musket.startReload();
        }
    }

    tryMove(dx, dy) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        if (!MAP.isWall(newX + (dx > 0 ? this.radius : -this.radius), this.y) &&
            !MAP.isWall(newX, this.y)) {
            this.x = newX;
        }
        
        if (!MAP.isWall(this.x, newY + (dy > 0 ? this.radius : -this.radius)) &&
            !MAP.isWall(this.x, newY)) {
            this.y = newY;
        }
    }

    tryFire(target) {
        if (this.musket.fire()) {
            // Check hit
            const fov = this.musket.getFOV() * Math.PI / 180;
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const targetAngle = Math.atan2(dy, dx);
            
            let angleDiff = targetAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // Check if target is in view and within aim tolerance
            if (Math.abs(angleDiff) < fov/2 && dist < 20) {
                // Raycast to verify line of sight
                if (this.checkLineOfSight(target.x, target.y)) {
                    // Accuracy based on aim state and tilt
                    const aimBonus = this.musket.aimProgress * 0.5;
                    const tiltPenalty = Math.abs(this.musket.musketTilt) / 30;
                    const accuracy = 0.3 + aimBonus - tiltPenalty;
                    
                    if (Math.random() < accuracy) {
                        target.hit();
                    }
                }
            }
        }
    }

    checkLineOfSight(tx, ty) {
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const steps = Math.floor(dist * 2);
        
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const cx = this.x + dx * t;
            const cy = this.y + dy * t;
            if (MAP.isWall(cx, cy)) return false;
        }
        return true;
    }

    hit() {
        this.alive = false;
        this.respawnTimer = 3000;
    }

    respawn() {
        this.alive = true;
        this.musket = new Musket();
        // Random respawn
        const spawns = [
            {x: 2.5, y: 2.5, angle: 0},
            {x: 21.5, y: 2.5, angle: Math.PI},
            {x: 2.5, y: 21.5, angle: 0},
            {x: 21.5, y: 21.5, angle: Math.PI}
        ];
        const spawn = spawns[Math.floor(Math.random() * spawns.length)];
        this.x = spawn.x;
        this.y = spawn.y;
        this.angle = spawn.angle;
    }
}