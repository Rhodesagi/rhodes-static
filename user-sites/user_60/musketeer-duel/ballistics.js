// Ballistics physics for round musket balls
// Physics-accurate for .75 caliber Brown Bess style musket

class BallisticsEngine {
    constructor() {
        // Physical constants
        this.gravity = 9.81; // m/s^2
        this.airDensity = 1.225; // kg/m^3 at sea level
        
        // Round ball properties (.75 cal Brown Bess)
        this.ballDiameter = 0.01905; // 0.75 inches in meters
        this.ballMass = 0.0145; // 14.5 grams (350 grains)
        this.ballArea = Math.PI * Math.pow(this.ballDiameter / 2, 2);
        this.dragCoefficient = 0.47; // Sphere drag coefficient (subsonic)
        
        // Muzzle velocity (typical for Brown Bess)
        this.muzzleVelocity = 450; // m/s
        
        this.projectiles = [];
    }
    
    // Calculate drag force
    calculateDrag(velocity) {
        const speed = velocity.length();
        if (speed === 0) return new THREE.Vector3(0, 0, 0);
        
        // Drag equation: F = 0.5 * rho * v^2 * Cd * A
        const dragMagnitude = 0.5 * this.airDensity * speed * speed * this.dragCoefficient * this.ballArea;
        
        // Drag opposes velocity
        const drag = velocity.clone().normalize().multiplyScalar(-dragMagnitude);
        return drag;
    }
    
    // Fire a new projectile
    fire(origin, direction, ownerId) {
        // Add randomness for smoothbore inaccuracy (Brown Bess was notoriously inaccurate)
        const spreadAngle = 0.03; // ~3 MOA spread typical for smoothbore
        
        const randomX = (Math.random() - 0.5) * spreadAngle;
        const randomY = (Math.random() - 0.5) * spreadAngle;
        
        const adjustedDirection = direction.clone();
        adjustedDirection.x += randomX;
        adjustedDirection.y += randomY;
        adjustedDirection.normalize();
        
        const velocity = adjustedDirection.multiplyScalar(this.muzzleVelocity);
        
        const projectile = {
            position: origin.clone(),
            velocity: velocity,
            owner: ownerId,
            time: 0,
            maxTime: 5.0, // 5 second lifetime max
            mass: this.ballMass,
            active: true,
            distance: 0
        };
        
        this.projectiles.push(projectile);
        return projectile;
    }
    
    // Update all projectiles with physics
    update(deltaTime) {
        const toRemove = [];
        
        for (let i = 0; i < this.projectiles.length; i++) {
            const p = this.projectiles[i];
            
            if (!p.active) {
                toRemove.push(i);
                continue;
            }
            
            p.time += deltaTime;
            
            // Check lifetime
            if (p.time >= p.maxTime) {
                p.active = false;
                toRemove.push(i);
                continue;
            }
            
            // Store old position for collision
            const oldPos = p.position.clone();
            
            // Calculate forces
            const drag = this.calculateDrag(p.velocity);
            const gravity = new THREE.Vector3(0, -this.gravity * p.mass, 0);
            
            // F = ma, so a = F/m
            const acceleration = new THREE.Vector3()
                .add(drag.divideScalar(p.mass))
                .add(gravity.divideScalar(p.mass));
            
            // Euler integration (sufficient for ballistics)
            p.velocity.add(acceleration.multiplyScalar(deltaTime));
            
            const moveDelta = p.velocity.clone().multiplyScalar(deltaTime);
            p.position.add(moveDelta);
            p.distance += moveDelta.length();
            
            // Check ground collision
            if (p.position.y < 0.05) {
                p.active = false;
                toRemove.push(i);
                this.createDustEffect(p.position);
            }
        }
        
        // Remove inactive projectiles (from end to start to preserve indices)
        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.projectiles.splice(toRemove[i], 1);
        }
    }
    
    // Check if projectile hits a player
    checkPlayerHit(projectileIndex, playerPosition, playerRadius) {
        const p = this.projectiles[projectileIndex];
        if (!p || !p.active) return false;
        
        const dist = p.position.distanceTo(playerPosition);
        if (dist < playerRadius) {
            p.active = false;
            return true;
        }
        return false;
    }
    
    // Visual effect for ground hit
    createDustEffect(position) {
        // Will be implemented in game.js using particles
        return {
            position: position,
            type: 'dust',
            duration: 1.0
        };
    }
    
    // Get projectile positions for rendering
    getProjectilePositions() {
        return this.projectiles
            .filter(p => p.active)
            .map(p => p.position);
    }
    
    // Clear all projectiles
    clear() {
        this.projectiles = [];
    }
}

// Projectile trail geometry generator
function createProjectileTrail(projectiles) {
    const positions = [];
    projectiles.forEach(p => {
        positions.push(p.position.x, p.position.y, p.position.z);
    });
    return positions;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BallisticsEngine, createProjectileTrail };
}