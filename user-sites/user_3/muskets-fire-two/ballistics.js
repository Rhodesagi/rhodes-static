class BallisticProjectile {
    constructor(position, velocity, owner) {
        this.position = position.clone();
        this.velocity = velocity.clone(); // m/s
        this.owner = owner;
        this.active = true;
        this.time = 0;
        this.gravity = 9.8; // m/s^2
        this.drag = 0.005; // air resistance coefficient
        this.mass = 0.02; // 20g ball
        this.diameter = 0.015; // 15mm
        
        // Create visual mesh
        const geometry = new THREE.SphereGeometry(0.008, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        
        // Trail
        this.trailPositions = [position.clone()];
        this.maxTrailLength = 20;
    }

    update(dt) {
        if (!this.active) return;
        
        this.time += dt;
        
        // Apply gravity
        this.velocity.y -= this.gravity * dt;
        
        // Apply drag (simplified)
        const speed = this.velocity.length();
        const dragForce = this.drag * speed * speed;
        const dragAcceleration = dragForce / this.mass;
        const dragVector = this.velocity.clone().normalize().multiplyScalar(-dragAcceleration * dt);
        this.velocity.add(dragVector);
        
        // Update position
        const deltaPos = this.velocity.clone().multiplyScalar(dt);
        this.position.add(deltaPos);
        this.mesh.position.copy(this.position);
        
        // Update trail
        this.trailPositions.push(this.position.clone());
        if (this.trailPositions.length > this.maxTrailLength) {
            this.trailPositions.shift();
        }
        
        // Check ground collision
        if (this.position.y <= 0) {
            this.active = false;
            this.createImpactEffect();
        }
    }

    createImpactEffect() {
        // Dust puff at impact
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.PlaneGeometry(0.05, 0.05);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0x8a7a5a, 
                transparent: true, 
                opacity: 0.6 
            });
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(this.position);
            particle.position.y = 0.01;
            particle.rotation.z = Math.random() * Math.PI;
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 2,
                    (Math.random() - 0.5) * 2
                ),
                life: 1.0
            };
            game.impactParticles.push(particle);
            game.scene.add(particle);
        }
    }

    checkCollision(player) {
        if (!this.active || player === this.owner) return false;
        
        const playerPos = player.mesh.position.clone();
        playerPos.y += 0.9; // Center of mass
        const distance = this.position.distanceTo(playerPos);
        
        if (distance < 0.4) { // Hit radius
            this.active = false;
            return true;
        }
        return false;
    }
}

class BallisticsSystem {
    constructor() {
        this.projectiles = [];
    }

    fire(position, direction, owner) {
        // Muzzle velocity ~300 m/s for musket
        const muzzleVelocity = 300 + (Math.random() * 10 - 5); // 00b15m/s black powder variance
        const velocity = direction.clone().multiplyScalar(muzzleVelocity);
        
        const projectile = new BallisticProjectile(position, velocity, owner);
        this.projectiles.push(projectile);
        game.scene.add(projectile.mesh);
        
        return projectile;
    }

    update(dt) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(dt);
            
            if (!proj.active) {
                game.scene.remove(proj.mesh);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Check player collisions
            for (const player of game.players) {
                if (proj.checkCollision(player)) {
                    game.handleHit(player, proj.owner);
                    game.scene.remove(proj.mesh);
                    this.projectiles.splice(i, 1);
                    break;
                }
            }
        }
    }

    clear() {
        for (const proj of this.projectiles) {
            game.scene.remove(proj.mesh);
        }
        this.projectiles = [];
    }
}

const ballistics = new BallisticsSystem();