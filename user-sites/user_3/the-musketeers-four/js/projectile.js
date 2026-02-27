/**
 * Projectile.js - Ballistic physics for musket balls
 * Not hitscan - actual projectile with velocity and gravity
 */

class Projectile {
    constructor(scene, startPos, direction, owner) {
        this.scene = scene;
        this.owner = owner;
        this.active = true;
        
        // Musket ball properties (.75 caliber = ~19mm diameter)
        this.diameter = 0.019; // meters
        this.mass = 0.035; // kg (35g musket ball)
        
        // Muzzle velocity for Brown Bess musket
        this.speed = 300; // m/s
        
        // Create visual mesh
        const geometry = new THREE.SphereGeometry(this.diameter / 2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(startPos);
        scene.add(this.mesh);
        
        // Velocity vector
        this.velocity = direction.clone().normalize().multiplyScalar(this.speed);
        
        // Trail effect
        this.trailPositions = [startPos.clone()];
        this.maxTrailLength = 10;
        
        // Lifetime
        this.lifetime = 5; // seconds
        this.age = 0;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.age += deltaTime;
        if (this.age > this.lifetime) {
            this.destroy();
            return;
        }
        
        // Apply gravity (9.81 m/s²)
        this.velocity.y -= 9.81 * deltaTime;
        
        // Update position
        const moveStep = this.velocity.clone().multiplyScalar(deltaTime);
        this.mesh.position.add(moveStep);
        
        // Update trail
        this.trailPositions.push(this.mesh.position.clone());
        if (this.trailPositions.length > this.maxTrailLength) {
            this.trailPositions.shift();
        }
        
        // Check ground collision
        if (this.mesh.position.y < 0.01) {
            this.hitGround();
        }
    }
    
    checkPlayerCollision(player) {
        if (!this.active || player === this.owner) return false;
        
        const distance = this.mesh.position.distanceTo(player.camera.position);
        // Hitbox: roughly human torso size
        if (distance < 0.4) {
            this.hitPlayer(player);
            return true;
        }
        return false;
    }
    
    hitPlayer(player) {
        this.active = false;
        this.createImpactEffect(this.mesh.position, 0xff0000);
        player.takeDamage(100); // One shot kill
        this.destroy();
    }
    
    hitGround() {
        this.active = false;
        this.createImpactEffect(this.mesh.position, 0x8B4513);
        this.destroy();
    }
    
    createImpactEffect(position, color) {
        // Simple particle effect
        const particleCount = 8;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y, position.z);
            velocities.push(
                (Math.random() - 0.5) * 5,
                Math.random() * 5,
                (Math.random() - 0.5) * 5
            );
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.05,
            transparent: true,
            opacity: 1
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        
        // Animate particles
        let age = 0;
        const animate = () => {
            age += 0.016;
            if (age > 0.5) {
                this.scene.remove(particles);
                return;
            }
            
            const pos = particles.geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                pos[i * 3] += velocities[i * 3] * 0.016;
                pos[i * 3 + 1] += velocities[i * 3 + 1] * 0.016;
                pos[i * 3 + 2] += velocities[i * 3 + 2] * 0.016;
            }
            particles.geometry.attributes.position.needsUpdate = true;
            material.opacity = 1 - (age / 0.5);
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    destroy() {
        this.active = false;
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}