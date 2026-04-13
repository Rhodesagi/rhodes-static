import * as THREE from 'three';

class Projectile {
    constructor(startPos, direction, velocity, ownerId, world) {
        this.startPos = startPos.clone();
        this.position = startPos.clone();
        this.velocity = direction.clone().multiplyScalar(velocity);
        this.ownerId = ownerId;
        this.world = world;
        
        // Ballistics
        this.gravity = 9.8; // m/s^2
        this.drag = 0.01;
        this.damage = 100; // Musket balls were lethal
        
        // Visual
        this.mesh = this.createMesh();
        this.world.scene.add(this.mesh);
        
        // Trail
        this.trail = [];
        this.maxTrailLength = 10;
        this.trailTimer = 0;
        
        // Lifetime
        this.age = 0;
        this.maxAge = 5; // 5 seconds max
        this.active = true;
        
        // Initial velocity in m/s (historically ~400 m/s for musket)
        // Scaled down for gameplay (smaller arena)
        this.actualSpeed = velocity;
    }
    
    createMesh() {
        // Musket ball - about .69 caliber = 17.5mm diameter
        const geometry = new THREE.SphereGeometry(0.009, 4, 4);
        const material = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(this.position);
        return mesh;
    }
    
    update(deltaTime) {
        if (!this.active) return false;
        
        this.age += deltaTime;
        if (this.age > this.maxAge) {
            this.destroy();
            return false;
        }
        
        // Apply gravity
        this.velocity.y -= this.gravity * deltaTime;
        
        // Apply drag
        this.velocity.multiplyScalar(1 - this.drag * deltaTime);
        
        // Store old position for collision
        const oldPos = this.position.clone();
        
        // Move
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Update mesh
        this.mesh.position.copy(this.position);
        
        // Update trail
        this.trailTimer += deltaTime;
        if (this.trailTimer > 0.02) {
            this.trail.unshift(oldPos.clone());
            if (this.trail.length > this.maxTrailLength) {
                this.trail.pop();
            }
            this.trailTimer = 0;
        }
        
        // Check collision with ground
        if (this.position.y <= 0) {
            this.position.y = 0;
            this.destroy();
            return false;
        }
        
        // Check collision with walls
        for (const collider of this.world.colliders) {
            if (collider.type === 'box') {
                if (collider.box.containsPoint(this.position)) {
                    // Hit wall - richochet or stop
                    this.destroy();
                    return false;
                }
                
                // Line segment test for fast projectiles
                if (this.world.lineIntersectsBox(oldPos, this.position, collider.box, new THREE.Vector3())) {
                    this.destroy();
                    return false;
                }
            }
        }
        
        return true;
    }
    
    checkHit(player) {
        if (!this.active) return false;
        if (player.id === this.ownerId) return false;
        if (player.isDead) return false;
        
        // Simple sphere collision with player body
        const dx = this.position.x - player.position.x;
        const dz = this.position.z - player.position.z;
        const dy = this.position.y - player.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Hit if within 0.4m of center (roughly body hit)
        if (distance < 0.4) {
            player.takeDamage(this.damage, this.position);
            this.destroy();
            return true;
        }
        
        return false;
    }
    
    destroy() {
        this.active = false;
        if (this.mesh) {
            this.world.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}

export class ProjectileManager {
    constructor(world) {
        this.world = world;
        this.projectiles = [];
        this.players = [];
    }
    
    registerPlayer(player) {
        this.players.push(player);
    }
    
    spawn(startPos, direction, velocity, ownerId) {
        const projectile = new Projectile(startPos, direction, velocity, ownerId, this.world);
        this.projectiles.push(projectile);
    }
    
    update(deltaTime) {
        // Update all projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            const stillActive = proj.update(deltaTime);
            
            if (!stillActive) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Check hits against all players
            for (const player of this.players) {
                if (proj.checkHit(player)) {
                    break;
                }
            }
        }
    }
}