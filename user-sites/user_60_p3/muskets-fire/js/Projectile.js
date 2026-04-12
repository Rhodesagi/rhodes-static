class Projectile {
    constructor(startPos, direction, owner) {
        this.owner = owner;
        this.speed = 150; // muzzle velocity in units/sec
        this.gravity = 9.8 * 2; // scaled gravity
        this.life = 5; // seconds before removal
        this.maxDistance = 300;
        this.traveled = 0;
        
        // Create visual mesh
        const geometry = new THREE.SphereGeometry(0.02, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x444444 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(startPos);
        
        // Velocity vector
        this.velocity = direction.clone().multiplyScalar(this.speed);
        
        // Trail particles
        this.trail = [];
        this.trailTimer = 0;
        
        // Smoke particle system
        this.smokeParticles = [];
    }
    
    update(dt) {
        // Apply gravity
        this.velocity.y -= this.gravity * dt;
        
        // Move projectile
        const moveVec = this.velocity.clone().multiplyScalar(dt);
        this.mesh.position.add(moveVec);
        
        this.traveled += moveVec.length();
        this.life -= dt;
        
        // Trail effect
        this.trailTimer += dt;
        if (this.trailTimer > 0.02) {
            this.addTrailParticle();
            this.trailTimer = 0;
        }
        
        // Update smoke
        this.updateSmoke(dt);
        
        return this.life > 0 && this.traveled < this.maxDistance;
    }
    
    addTrailParticle() {
        const geometry = new THREE.SphereGeometry(0.015, 4, 4);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x888888, 
            transparent: true, 
            opacity: 0.5 
        });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(this.mesh.position);
        particle.life = 0.5;
        this.smokeParticles.push(particle);
        return particle;
    }
    
    updateSmoke(dt) {
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.life -= dt;
            p.material.opacity = p.life * 0.5;
            p.scale.multiplyScalar(1.02); // expand
            if (p.life <= 0) {
                if (p.parent) p.parent.remove(p);
                this.smokeParticles.splice(i, 1);
            }
        }
    }
    
    getPosition() {
        return this.mesh.position;
    }
    
    destroy(scene) {
        if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
        this.smokeParticles.forEach(p => {
            if (p.parent) p.parent.remove(p);
        });
    }
}

class MuzzleFlash {
    constructor(position, direction) {
        this.life = 0.1;
        this.maxLife = 0.1;
        
        // Flash geometry
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00,
            transparent: true
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        
        // Point light for flash illumination
        this.light = new THREE.PointLight(0xffaa00, 2, 10);
        this.light.position.copy(position);
    }
    
    update(dt) {
        this.life -= dt;
        const intensity = this.life / this.maxLife;
        this.mesh.material.opacity = intensity;
        this.mesh.scale.setScalar(1 + (1 - intensity) * 2);
        this.light.intensity = intensity * 2;
        return this.life > 0;
    }
    
    destroy() {
        if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
        if (this.light.parent) this.light.parent.remove(this.light);
    }
}
