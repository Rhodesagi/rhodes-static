/**
 * Ballistics System - Realistic Musket Projectile Physics
 * Minié ball: .58 caliber, ~500 grain (32g), muzzle velocity ~300 m/s
 * Significant drop and slower velocity than modern rounds
 */

class Projectile {
    constructor(position, velocity, owner) {
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.owner = owner;
        this.mass = 0.032; // kg (500 grains)
        this.caliber = 0.0147; // meters (0.58 inches)
        this.dragCoeff = 0.47; // sphere drag coefficient
        this.airDensity = 1.225; // kg/m³ at sea level
        this.crossSectionalArea = Math.PI * Math.pow(this.caliber / 2, 2);
        
        this.lifetime = 0;
        this.maxLifetime = 10; // seconds
        this.active = true;
        
        // Create visual mesh
        this.geometry = new THREE.SphereGeometry(0.007, 8, 8);
        this.material = new THREE.MeshBasicMaterial({ color: 0x222222 });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(this.position);
        
        // Trail effect
        this.trailPositions = [position.clone()];
        this.maxTrailLength = 20;
    }
    
    update(dt) {
        if (!this.active) return;
        
        this.lifetime += dt;
        
        if (this.lifetime > this.maxLifetime) {
            this.active = false;
            return;
        }
        
        // Calculate drag force
        const speed = this.velocity.length();
        const dragMagnitude = 0.5 * this.airDensity * Math.pow(speed, 2) * this.dragCoeff * this.crossSectionalArea;
        const dragForce = this.velocity.clone().normalize().multiplyScalar(-dragMagnitude);
        
        // Calculate acceleration (drag/mass + gravity)
        const acceleration = dragForce.divideScalar(this.mass);
        acceleration.y -= 9.81; // gravity
        
        // Velocity Verlet integration
        const oldVelocity = this.velocity.clone();
        this.velocity.add(acceleration.multiplyScalar(dt));
        const avgVelocity = oldVelocity.add(this.velocity).multiplyScalar(0.5);
        
        // Update position
        const deltaPos = avgVelocity.multiplyScalar(dt);
        this.position.add(deltaPos);
        
        // Update mesh
        this.mesh.position.copy(this.position);
        
        // Update trail
        this.trailPositions.push(this.position.clone());
        if (this.trailPositions.length > this.maxTrailLength) {
            this.trailPositions.shift();
        }
        
        // Ground collision
        if (this.position.y < 0.01) {
            this.active = false;
            this.position.y = 0.01;
        }
    }
    
    checkCollision(targetPosition, targetRadius) {
        if (!this.active) return false;
        
        const distance = this.position.distanceTo(targetPosition);
        return distance < (targetRadius + this.caliber / 2);
    }
    
    destroy(scene) {
        if (this.mesh && scene) {
            scene.remove(this.mesh);
            this.geometry.dispose();
            this.material.dispose();
        }
        this.active = false;
    }
}

class BallisticsManager {
    constructor(scene) {
        this.projectiles = [];
        this.scene = scene;
    }
    
    spawnProjectile(position, direction, muzzleVelocity, owner) {
        const velocity = direction.clone().multiplyScalar(muzzleVelocity);
        const projectile = new Projectile(position, velocity, owner);
        this.projectiles.push(projectile);
        this.scene.add(projectile.mesh);
        return projectile;
    }
    
    update(dt) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(dt);
            
            if (!proj.active) {
                proj.destroy(this.scene);
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    checkPlayerCollisions(players) {
        for (const proj of this.projectiles) {
            if (!proj.active) continue;
            
            for (const player of players) {
                if (player === proj.owner) continue; // Don't hit self
                
                // Simple sphere collision around player center
                if (proj.checkCollision(player.position, 0.3)) {
                    proj.active = false;
                    player.takeDamage(100); // One shot kill
                    
                    // Create hit effect
                    this.createHitEffect(proj.position);
                    break;
                }
            }
        }
    }
    
    createHitEffect(position) {
        // Create blood puff
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x8B0000,
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        this.scene.add(mesh);
        
        // Fade out
        setTimeout(() => {
            this.scene.remove(mesh);
            geometry.dispose();
            material.dispose();
        }, 500);
    }
    
    clear() {
        for (const proj of this.projectiles) {
            proj.destroy(this.scene);
        }
        this.projectiles = [];
    }
}