// Ballistics.js - Historical musket ballistics with Brown Bess characteristics
class Projectile {
    constructor(position, direction, velocity, owner) {
        this.position = position.clone();
        this.direction = direction.clone().normalize();
        this.velocity = velocity; // m/s
        this.owner = owner; // Which player fired
        this.active = true;
        this.damage = 100; // One shot, one kill
        
        // Brown Bess characteristics
        this.mass = 0.035; // 35g ball
        this.drag = 0.001; // Air resistance
        this.gravity = 9.81;
        
        // 4 MOA accuracy spread (historical Brown Bess)
        const moaSpread = 0.00116; // 4 MOA in radians
        const spreadX = (Math.random() - 0.5) * moaSpread * 2;
        const spreadY = (Math.random() - 0.5) * moaSpread * 2;
        
        // Apply spread
        this.direction.x += spreadX;
        this.direction.y += spreadY;
        this.direction.normalize();
        
        // Visual representation
        this.mesh = this.createMesh();
    }
    
    createMesh() {
        const geometry = new THREE.SphereGeometry(0.008, 8, 8); // ~.69 cal ball
        const material = new THREE.MeshStandardMaterial({
            color: 0x8a7a5a,
            roughness: 0.4,
            metalness: 0.6
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(this.position);
        mesh.castShadow = false;
        return mesh;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // Save previous position for collision ray
        this.previousPosition = this.position.clone();
        
        // Apply drag
        const speed = this.velocity;
        const dragForce = this.drag * speed * speed;
        this.velocity -= dragForce * deltaTime;
        
        // Apply velocity
        const moveDist = this.velocity * deltaTime;
        this.position.add(this.direction.clone().multiplyScalar(moveDist));
        
        // Apply gravity (drops trajectory)
        this.direction.y -= (this.gravity / this.velocity) * deltaTime;
        this.direction.normalize();
        
        // Update mesh
        this.mesh.position.copy(this.position);
        
        // Deactivate if below ground or too far
        if (this.position.y < 0 || this.position.length() > 100) {
            this.active = false;
        }
    }
    
    getRay() {
        // Return ray from previous to current position for collision
        return {
            origin: this.previousPosition || this.position,
            direction: this.direction.clone()
        };
    }
}

class BallisticsManager {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
    }
    
    fire(position, direction, owner) {
        // Brown Bess muzzle velocity ~450-500 m/s
        // Using 500 m/s for gameplay
        const muzzleVelocity = 500;
        
        const projectile = new Projectile(position, direction, muzzleVelocity, owner);
        this.projectiles.push(projectile);
        this.scene.add(projectile.mesh);
        
        return projectile;
    }
    
    update(deltaTime, players) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(deltaTime);
            
            if (!p.active) {
                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Check collisions with players
            for (let player of players) {
                if (player.index === p.owner) continue; // Can't hit self
                if (!player.alive) continue;
                
                if (this.checkHit(p, player)) {
                    player.hit(p.damage);
                    p.active = false;
                    this.scene.remove(p.mesh);
                    this.projectiles.splice(i, 1);
                    break;
                }
            }
        }
    }
    
    checkHit(projectile, player) {
        // Simple sphere collision with player
        // Player roughly 0.3m radius, 1.7m tall
        const toPlayer = new THREE.Vector3().subVectors(player.position, projectile.position);
        const distance = toPlayer.length();
        
        // Check if projectile is within player bounds
        // Horizontal radius ~0.25m, height check
        if (distance < 0.4 && projectile.position.y < player.position.y + 0.2 && 
            projectile.position.y > player.position.y - 0.8) {
            return true;
        }
        
        // More precise ray-sphere check
        const ray = projectile.getRay();
        const playerCenter = player.position.clone();
        playerCenter.y -= 0.3; // Center of mass
        
        const oc = new THREE.Vector3().subVectors(ray.origin, playerCenter);
        const a = ray.direction.dot(ray.direction);
        const b = 2.0 * oc.dot(ray.direction);
        const c = oc.dot(oc) - 0.25 * 0.25; // 0.25m radius squared
        
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) return false;
        
        const sqrt = Math.sqrt(discriminant);
        const t1 = (-b - sqrt) / (2.0 * a);
        const t2 = (-b + sqrt) / (2.0 * a);
        
        // Check if intersection is within our movement this frame
        const stepDistance = projectile.velocity * 0.016; // Approximate step
        
        return (t1 > 0 && t1 < stepDistance) || (t2 > 0 && t2 < stepDistance);
    }
    
    clear() {
        for (let p of this.projectiles) {
            this.scene.remove(p.mesh);
        }
        this.projectiles = [];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Projectile, BallisticsManager };
}
