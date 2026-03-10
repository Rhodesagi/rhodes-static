// Ballistics System - Physics-based projectile simulation

class Projectile {
    constructor(startPos, direction, velocity, gravity = 9.8) {
        this.position = startPos.clone();
        this.velocity = direction.clone().multiplyScalar(velocity);
        this.gravity = gravity;
        this.active = true;
        this.trail = [];
        this.maxTrailLength = 20;
        this.birthTime = Date.now();
        this.lifetime = 5000; // 5 seconds max
        
        // Musket ball properties
        this.mass = 0.02; // kg
        this.drag = 0.001;
        this.damage = 100;
    }
    
    update(deltaTime) {
        if (!this.active) return false;
        
        // Check lifetime
        if (Date.now() - this.birthTime > this.lifetime) {
            this.active = false;
            return false;
        }
        
        // Store trail
        this.trail.push(this.position.clone());
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Apply gravity
        this.velocity.y -= this.gravity * deltaTime;
        
        // Apply drag
        this.velocity.multiplyScalar(1 - this.drag * deltaTime);
        
        // Update position
        const deltaPos = this.velocity.clone().multiplyScalar(deltaTime);
        this.position.add(deltaPos);
        
        // Check if hit ground
        if (this.position.y < 0) {
            this.active = false;
            return false;
        }
        
        return true;
    }
    
    checkCollision(targetPos, targetRadius) {
        if (!this.active) return false;
        
        const dist = this.position.distanceTo(targetPos);
        return dist < targetRadius;
    }
}

class BallisticsManager {
    constructor(scene) {
        this.projectiles = [];
        this.scene = scene;
        this.projectileMeshes = [];
        this.trailMeshes = [];
        
        // Reusable geometry/material
        this.ballGeometry = new THREE.SphereGeometry(0.015, 8, 8);
        this.ballMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        this.trailMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffaa00, 
            transparent: true, 
            opacity: 0.6 
        });
    }
    
    fire(startPos, direction, muzzleVelocity = 150) {
        // Musket muzzle velocity typically 150-200 m/s
        const projectile = new Projectile(startPos, direction, muzzleVelocity);
        this.projectiles.push(projectile);
        
        // Create visual mesh
        const mesh = new THREE.Mesh(this.ballGeometry, this.ballMaterial);
        mesh.position.copy(startPos);
        this.scene.add(mesh);
        this.projectileMeshes.push(mesh);
        
        // Create trail
        const trailGeometry = new THREE.BufferGeometry();
        const trailLine = new THREE.Line(trailGeometry, this.trailMaterial);
        this.scene.add(trailLine);
        this.trailMeshes.push(trailLine);
        
        return projectile;
    }
    
    update(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            const mesh = this.projectileMeshes[i];
            const trail = this.trailMeshes[i];
            
            if (!proj.update(deltaTime)) {
                // Remove inactive projectile
                this.scene.remove(mesh);
                this.scene.remove(trail);
                this.projectiles.splice(i, 1);
                this.projectileMeshes.splice(i, 1);
                this.trailMeshes.splice(i, 1);
                continue;
            }
            
            // Update mesh position
            mesh.position.copy(proj.position);
            
            // Update trail
            if (proj.trail.length > 1) {
                const positions = new Float32Array(proj.trail.length * 3);
                for (let j = 0; j < proj.trail.length; j++) {
                    positions[j * 3] = proj.trail[j].x;
                    positions[j * 3 + 1] = proj.trail[j].y;
                    positions[j * 3 + 2] = proj.trail[j].z;
                }
                trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            }
        }
    }
    
    checkPlayerHits(players) {
        const hits = [];
        
        for (const proj of this.projectiles) {
            if (!proj.active) continue;
            
            for (const player of players) {
                if (proj.checkCollision(player.position, 0.3)) {
                    hits.push({
                        projectile: proj,
                        player: player,
                        damage: proj.damage
                    });
                    proj.active = false;
                    break;
                }
            }
        }
        
        return hits;
    }
    
    clear() {
        for (const mesh of this.projectileMeshes) {
            this.scene.remove(mesh);
        }
        for (const trail of this.trailMeshes) {
            this.scene.remove(trail);
        }
        this.projectiles = [];
        this.projectileMeshes = [];
        this.trailMeshes = [];
    }
}