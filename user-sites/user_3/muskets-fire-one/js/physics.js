// Physics engine for projectile ballistics
// Realistic black powder musket ballistics

class PhysicsEngine {
    constructor() {
        this.projectiles = [];
        this.gravity = 9.81; // m/s^2
        this.timeScale = 1.0;
        
        // Historical Brown Bess musket specs
        this.musket = {
            muzzleVelocity: 150, // m/s (reduced from 180 for gameplay)
            ballDiameter: 0.018, // 18mm (~.69 cal)
            ballMass: 0.035, // 35g
            maxRange: 200 // meters
        };
    }
    
    // Create a new projectile
    fireProjectile(origin, direction, owner) {
        const projectile = {
            id: Math.random().toString(36).substr(2, 9),
            owner: owner,
            position: origin.clone(),
            velocity: direction.clone().multiplyScalar(this.musket.muzzleVelocity),
            mass: this.musket.ballMass,
            diameter: this.musket.ballDiameter,
            birthTime: performance.now(),
            active: true,
            trail: []
        };
        
        // Store initial position for trail
        projectile.trail.push(origin.clone());
        
        this.projectiles.push(projectile);
        return projectile;
    }
    
    // Update all projectiles
    update(deltaTime, players, bounds) {
        const dt = deltaTime * this.timeScale;
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            if (!proj.active) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Apply gravity
            proj.velocity.y -= this.gravity * dt;
            
            // Update position
            const deltaPos = proj.velocity.clone().multiplyScalar(dt);
            proj.position.add(deltaPos);
            
            // Add to trail every few frames
            if (proj.trail.length < 20) {
                proj.trail.push(proj.position.clone());
            }
            
            // Check collisions with players
            for (const player of players) {
                if (player.id === proj.owner) continue; // Can't hit self
                
                if (this.checkCollision(proj, player)) {
                    player.takeDamage(100, proj.owner);
                    proj.active = false;
                    break;
                }
            }
            
            // Check bounds and ground collision
            if (proj.position.y < 0 || 
                Math.abs(proj.position.x) > bounds.x ||
                Math.abs(proj.position.z) > bounds.z) {
                proj.active = false;
            }
            
            // Age check - projectiles expire after 5 seconds
            if (performance.now() - proj.birthTime > 5000) {
                proj.active = false;
            }
        }
    }
    
    // Check collision between projectile and player
    checkCollision(projectile, player) {
        const hitRadius = 0.5; // Player collision radius
        const dx = projectile.position.x - player.position.x;
        const dy = projectile.position.y - (player.position.y + 1.0); // Center mass
        const dz = projectile.position.z - player.position.z;
        
        const distSq = dx * dx + dy * dy + dz * dz;
        return distSq < hitRadius * hitRadius;
    }
    
    // Get active projectiles for rendering
    getProjectiles() {
        return this.projectiles.filter(p => p.active);
    }
    
    // Clear all projectiles
    clear() {
        this.projectiles = [];
    }
    
    // Predict trajectory for aiming (visual aid disabled - iron sights only)
    predictTrajectory(origin, direction, steps = 50) {
        const points = [];
        let pos = origin.clone();
        let vel = direction.clone().multiplyScalar(this.musket.muzzleVelocity);
        const dt = 0.02;
        
        for (let i = 0; i < steps; i++) {
            vel.y -= this.gravity * dt;
            pos.add(vel.clone().multiplyScalar(dt));
            points.push(pos.clone());
            
            if (pos.y < 0) break;
        }
        
        return points;
    }
}

// Create global physics engine
const physics = new PhysicsEngine();
