class Bullet {
    constructor(origin, direction, shooterId) {
        this.position = origin.clone();
        this.velocity = direction.clone().multiplyScalar(150); // Musket muzzle velocity ~150 m/s scaled
        this.shooterId = shooterId;
        this.life = 3.0; // Seconds
        this.active = true;
        this.gravity = 9.8;
        
        // Visual
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.008, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0x222222 })
        );
        this.mesh.position.copy(this.position);
        
        // Trail
        this.trailPositions = [this.position.clone()];
        this.maxTrailLength = 10;
    }
    
    update(dt) {
        if (!this.active) return false;
        
        // Apply gravity
        this.velocity.y -= this.gravity * dt;
        
        // Move
        this.position.add(this.velocity.clone().multiplyScalar(dt));
        this.mesh.position.copy(this.position);
        
        // Update trail
        this.trailPositions.push(this.position.clone());
        if (this.trailPositions.length > this.maxTrailLength) {
            this.trailPositions.shift();
        }
        
        // Decay
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
        }
        
        return this.active;
    }
    
    checkCollision(player) {
        if (!this.active || player.id === this.shooterId || !player.alive) return false;
        
        // Simple sphere collision
        const dx = this.position.x - player.position.x;
        const dy = this.position.y - (player.position.y + 0.9); // Center of body
        const dz = this.position.z - player.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Head shot (smaller radius, higher damage)
        const headDx = this.position.x - player.position.x;
        const headDy = this.position.y - (player.position.y + 1.75);
        const headDz = this.position.z - player.position.z;
        const headDist = Math.sqrt(headDx * headDx + headDy * headDy + headDz * headDz);
        
        if (headDist < 0.22) {
            this.active = false;
            return { hit: true, damage: 100, headshot: true };
        }
        
        if (dist < 0.35) {
            this.active = false;
            return { hit: true, damage: 60, headshot: false };
        }
        
        return { hit: false };
    }
    
    checkWallCollision(walls) {
        if (!this.active) return false;
        
        for (const wall of walls) {
            const dx = this.position.x - wall.x;
            const dy = this.position.y - wall.y;
            const dz = this.position.z - wall.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (dist < wall.radius) {
                this.active = false;
                return true;
            }
        }
        return false;
    }
    
    destroy() {
        this.active = false;
        if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
    }
}