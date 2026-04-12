// MUSKETFIRE - Projectile ballistics
// .58 caliber Minie ball physics
// Muzzle velocity: ~300 m/s
// Heavy drop due to subsonic ballistics and low BC

class Projectile {
    constructor(startPos, direction, owner) {
        this.position = startPos.clone();
        this.owner = owner; // Which player fired
        
        // Ballistics constants for .58cal Minie ball
        const MUZZLE_VELOCITY = 300; // m/s
        const BALL_MASS = 0.022; // kg (approx 340 grains)
        const DRAG_COEFFICIENT = 0.5; // Poor aerodynamics of round ball
        const AIR_DENSITY = 1.225; // kg/m^3 at sea level
        const BALL_AREA = 0.00017; // m^2 (cross-sectional area of .58 cal)
        
        this.velocity = direction.clone().multiplyScalar(MUZZLE_VELOCITY);
        this.dragCoeff = DRAG_COEFFICIENT;
        this.ballArea = BALL_AREA;
        this.airDensity = AIR_DENSITY;
        this.mass = BALL_MASS;
        
        this.gravity = 9.81;
        this.active = true;
        this.lifetime = 0;
        this.maxLifetime = 5.0; // 5 seconds max flight
        
        this.trail = []; // For visualization
        this.maxTrailLength = 20;
        
        // Create visual mesh
        this.createMesh();
    }
    
    createMesh() {
        const geo = new THREE.SphereGeometry(0.02, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ 
            color: this.owner === 1 ? 0x4a9 : 0xa94 
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(this.position);
    }
    
    update(dt) {
        if (!this.active) return;
        
        this.lifetime += dt;
        if (this.lifetime > this.maxLifetime) {
            this.active = false;
            return;
        }
        
        // Store trail
        this.trail.push(this.position.clone());
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Apply drag
        const speed = this.velocity.length();
        if (speed > 0) {
            const dragForce = 0.5 * this.airDensity * speed * speed * 
                             this.dragCoeff * this.ballArea;
            const dragAccel = dragForce / this.mass;
            
            const dragDirection = this.velocity.clone().normalize().multiplyScalar(-1);
            const dragVelocityChange = dragDirection.multiplyScalar(dragAccel * dt);
            this.velocity.add(dragVelocityChange);
        }
        
        // Apply gravity
        this.velocity.y -= this.gravity * dt;
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(dt));
        
        // Update mesh
        this.mesh.position.copy(this.position);
        
        // Ground collision
        if (this.position.y < 0) {
            this.active = false;
        }
    }
    
    getBallisticDrop(distance) {
        // Calculate theoretical drop at given distance
        // time = distance / speed
        // drop = 0.5 * g * t^2
        const speed = this.velocity.length();
        const time = distance / speed;
        return 0.5 * this.gravity * time * time;
    }
}

class ProjectileManager {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
    }
    
    spawnProjectile(startPos, direction, owner) {
        const proj = new Projectile(startPos, direction, owner);
        this.projectiles.push(proj);
        this.scene.add(proj.mesh);
        return proj;
    }
    
    update(dt) {
        // Update all projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(dt);
            
            if (!proj.active) {
                this.scene.remove(proj.mesh);
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    checkPlayerHits(player, playerNum) {
        // Check if any projectile hits this player
        const hitRadius = 0.5;
        
        for (const proj of this.projectiles) {
            if (!proj.active) continue;
            if (proj.owner === playerNum) continue; // Can't shoot self
            
            const dist = proj.position.distanceTo(player.position);
            if (dist < hitRadius) {
                proj.active = false;
                this.scene.remove(proj.mesh);
                return { hit: true, position: proj.position.clone() };
            }
        }
        return { hit: false };
    }
    
    clear() {
        for (const proj of this.projectiles) {
            this.scene.remove(proj.mesh);
        }
        this.projectiles = [];
    }
}
