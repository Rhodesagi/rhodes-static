// Projectile - Ballistic musket ball with gravity and air resistance
class Projectile {
    constructor(scene, startPos, direction, velocity, ownerId) {
        this.scene = scene;
        this.ownerId = ownerId;
        this.active = true;
        
        // Ballistics for .75 cal Brown Bess musket ball
        // Mass approx 18g, diameter 18.5mm
        this.velocity = velocity; // m/s, typically 300-400 for musket
        this.gravity = 9.8; // m/s^2
        this.drag = 0.001; // Air resistance coefficient
        
        // Direction with smoothbore spread (inaccuracy)
        this.direction = direction.clone().normalize();
        
        // Add random spread for smoothbore (muskets were inaccurate)
        const spreadAngle = 0.08; // Radians, about 4.5 degrees inherent spread
        const spreadX = (Math.random() - 0.5) * spreadAngle * 2;
        const spreadY = (Math.random() - 0.5) * spreadAngle * 2;
        
        // Apply spread by rotating direction vector
        const right = new THREE.Vector3(1, 0, 0);
        const up = new THREE.Vector3(0, 1, 0);
        
        // Create rotation quaternions for spread
        right.applyAxisAngle(up, spreadX);
        this.direction.applyAxisAngle(right, spreadY);
        this.direction.applyAxisAngle(up, spreadX);
        
        // Create visual ball
        const geometry = new THREE.SphereGeometry(0.0925, 8, 8); // Scale: 18.5mm diameter
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.4
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(startPos);
        this.mesh.castShadow = true;
        
        // Trail
        this.trailPositions = [startPos.clone()];
        this.trailUpdateTimer = 0;
        
        this.scene.add(this.mesh);
        
        // Physics state
        this.position = startPos.clone();
        this.velocityVector = this.direction.clone().multiplyScalar(this.velocity);
        
        // Time tracking
        this.lifetime = 0;
        this.maxLifetime = 3.0; // Seconds before despawning
        
        // Impact tracking
        this.hasImpacted = false;
    }

    update(delta, players, environment) {
        if (!this.active || this.hasImpacted) return false;
        
        this.lifetime += delta;
        if (this.lifetime > this.maxLifetime) {
            this.destroy();
            return false;
        }
        
        // Apply drag (air resistance)
        const speed = this.velocityVector.length();
        const dragForce = this.drag * speed * speed;
        const dragDir = this.velocityVector.clone().normalize().multiplyScalar(-dragForce * delta);
        this.velocityVector.add(dragDir);
        
        // Apply gravity
        this.velocityVector.y -= this.gravity * delta;
        
        // Calculate new position
        const newPosition = this.position.clone().add(
            this.velocityVector.clone().multiplyScalar(delta)
        );
        
        // Check for hits
        for (const player of players) {
            if (player.id === this.ownerId) continue; // Can't hit self
            
            // Simple capsule collision for player
            const distToPlayer = newPosition.distanceTo(player.position);
            if (distToPlayer < 1.0) { // Player radius approx 0.5m
                player.hit(1.0, this.ownerId);
                this.createImpact(newPosition, this.velocityVector.clone().normalize());
                this.destroy();
                return true;
            }
        }
        
        // Check environment collision
        if (environment.checkCollision(newPosition, 0.1)) {
            this.createImpact(newPosition, this.velocityVector.clone().normalize());
            this.destroy();
            return true;
        }
        
        // Ground collision
        if (newPosition.y < 0) {
            newPosition.y = 0;
            this.createImpact(newPosition, new THREE.Vector3(0, 1, 0));
            this.destroy();
            return true;
        }
        
        // Update position
        this.position.copy(newPosition);
        this.mesh.position.copy(this.position);
        
        // Update trail
        this.trailUpdateTimer += delta;
        if (this.trailUpdateTimer > 0.05) {
            this.trailPositions.push(this.position.clone());
            if (this.trailPositions.length > 20) {
                this.trailPositions.shift();
            }
            this.trailUpdateTimer = 0;
        }
        
        return false;
    }

    createImpact(position, normal) {
        // Dust/impact particle
        const geo = new THREE.SphereGeometry(0.1, 6, 6);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x8B7355,
            transparent: true,
            opacity: 0.8
        });
        const impact = new THREE.Mesh(geo, mat);
        impact.position.copy(position);
        this.scene.add(impact);
        
        // Animate and remove
        const startTime = Date.now();
        const animateImpact = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed > 0.3) {
                this.scene.remove(impact);
                geo.dispose();
                mat.dispose();
                return;
            }
            impact.scale.multiplyScalar(0.95);
            impact.material.opacity = 0.8 * (1 - elapsed / 0.3);
            requestAnimationFrame(animateImpact);
        };
        animateImpact();
    }

    destroy() {
        this.active = false;
        this.hasImpacted = true;
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}

// Projectile manager
class ProjectileManager {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
    }

    spawn(startPos, direction, velocity, ownerId) {
        const proj = new Projectile(this.scene, startPos, direction, velocity, ownerId);
        this.projectiles.push(proj);
    }

    update(delta, players, environment) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(delta, players, environment);
            
            if (!proj.active) {
                this.projectiles.splice(i, 1);
            }
        }
    }
}

window.Projectile = Projectile;
window.ProjectileManager = ProjectileManager;
