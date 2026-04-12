/**
 * Projectile - Ballistics physics for musket balls
 * Gravity, air resistance, realistic velocity
 */

class Projectile {
    constructor(position, direction, owner) {
        this.position = position.clone();
        this.velocity = direction.clone().multiplyScalar(Projectile.MUZZLE_VELOCITY);
        this.owner = owner; // Which player fired this
        this.active = true;
        this.age = 0;
        this.maxAge = 5; // 5 seconds max flight time
        
        // Create visual mesh
        const geometry = new THREE.SphereGeometry(0.01, 8, 8);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x222222,
            shininess: 100
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        
        // Trail effect
        this.trailPositions = [];
        this.maxTrailLength = 20;
    }
    
    static MUZZLE_VELOCITY = 300; // ~300 m/s (about 1000 ft/s)
    static GRAVITY = 9.81;
    static DRAG_COEFFICIENT = 0.47; // Sphere drag
    static AIR_DENSITY = 1.225;
    static BALL_DIAMETER = 0.018; // ~.72 caliber = 18mm
    static BALL_MASS = 0.028; // 28 grams
    
    update(deltaTime, scene, environment) {
        if (!this.active) return false;
        
        this.age += deltaTime;
        if (this.age > this.maxAge) {
            this.active = false;
            return false;
        }
        
        // Store trail position
        this.trailPositions.push(this.position.clone());
        if (this.trailPositions.length > this.maxTrailLength) {
            this.trailPositions.shift();
        }
        
        // Calculate drag force
        const speed = this.velocity.length();
        const crossSectionalArea = Math.PI * Math.pow(Projectile.BALL_DIAMETER / 2, 2);
        const dragForce = 0.5 * Projectile.AIR_DENSITY * Math.pow(speed, 2) * 
                         Projectile.DRAG_COEFFICIENT * crossSectionalArea;
        
        // Apply drag (opposes velocity)
        if (speed > 0) {
            const dragAcceleration = dragForce / Projectile.BALL_MASS;
            const dragDirection = this.velocity.clone().normalize().negate();
            this.velocity.add(dragDirection.multiplyScalar(dragAcceleration * deltaTime));
        }
        
        // Apply gravity
        this.velocity.y -= Projectile.GRAVITY * deltaTime;
        
        // Update position
        const movement = this.velocity.clone().multiplyScalar(deltaTime);
        this.position.add(movement);
        this.mesh.position.copy(this.position);
        
        // Collision with ground
        if (this.position.y <= 0) {
            this.active = false;
            this.createImpactEffect(scene, this.position, 'ground');
            return false;
        }
        
        // Collision with environment objects
        if (environment) {
            for (const obstacle of environment.obstacles) {
                if (this.checkCollision(obstacle)) {
                    this.active = false;
                    this.createImpactEffect(scene, this.position, 'wood');
                    return false;
                }
            }
        }
        
        return true;
    }
    
    checkCollision(obstacle) {
        const box = new THREE.Box3().setFromObject(obstacle);
        return box.containsPoint(this.position);
    }
    
    createImpactEffect(scene, position, type) {
        // Create particle burst
        const particleCount = type === 'ground' ? 8 : 5;
        const color = type === 'ground' ? 0x8b7355 : 0x5a4a3a;
        
        for (let i = 0; i < particleCount; i++) {
            const geo = new THREE.BoxGeometry(0.02, 0.02, 0.02);
            const mat = new THREE.MeshBasicMaterial({ color: color });
            const particle = new THREE.Mesh(geo, mat);
            
            particle.position.copy(position);
            
            // Random velocity upward and outward
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2 + 1,
                (Math.random() - 0.5) * 2
            ).multiplyScalar(0.5);
            
            particle.userData.velocity = vel;
            particle.userData.life = 0.5;
            
            scene.add(particle);
            
            // Animate and remove
            const animateParticle = () => {
                particle.position.add(vel.clone().multiplyScalar(0.016));
                vel.y -= 9.81 * 0.016;
                particle.userData.life -= 0.016;
                
                if (particle.userData.life > 0 && particle.position.y > 0) {
                    requestAnimationFrame(animateParticle);
                } else {
                    scene.remove(particle);
                }
            };
            animateParticle();
        }
    }
    
    checkPlayerHit(players) {
        if (!this.active) return null;
        
        for (const player of players) {
            if (player === this.owner) continue; // Can't hit yourself
            
            const distance = this.position.distanceTo(player.position);
            if (distance < 0.3) { // Player collision radius
                this.active = false;
                return player;
            }
        }
        return null;
    }
    
    removeFromScene(scene) {
        scene.remove(this.mesh);
    }
}

/**
 * MuzzleFlash - Visual effect when firing
 */
class MuzzleFlash {
    constructor(scene, position, direction) {
        this.scene = scene;
        this.position = position.clone();
        this.direction = direction.clone();
        
        // Create flash mesh
        const geometry = new THREE.ConeGeometry(0.05, 0.3, 8);
        geometry.rotateX(-Math.PI / 2);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffffaa,
            transparent: true,
            opacity: 0.8
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.lookAt(position.clone().add(direction));
        
        scene.add(this.mesh);
        
        // Add point light for flash
        this.light = new THREE.PointLight(0xffaa00, 2, 3);
        this.light.position.copy(position);
        scene.add(this.light);
        
        this.life = 0.05;
        this.maxLife = 0.05;
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.scene.remove(this.mesh);
            this.scene.remove(this.light);
            return false;
        }
        
        const progress = this.life / this.maxLife;
        this.mesh.material.opacity = progress * 0.8;
        this.mesh.scale.setScalar(1 + (1 - progress) * 2);
        
        return true;
    }
}

/**
 * SmokeCloud - Gunpowder smoke effect
 */
class SmokeCloud {
    constructor(scene, position, windDirection = new THREE.Vector3(0, 0, 0)) {
        this.scene = scene;
        this.position = position.clone();
        this.windDirection = windDirection.clone();
        
        // Create smoke particles
        this.particles = [];
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const size = 0.1 + Math.random() * 0.15;
            const geometry = new THREE.SphereGeometry(size, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: 0xcccccc,
                transparent: true,
                opacity: 0.4
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(position);
            particle.position.x += (Math.random() - 0.5) * 0.1;
            particle.position.y += (Math.random() - 0.5) * 0.1;
            particle.position.z += (Math.random() - 0.5) * 0.1;
            
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 1,
                Math.random() * 0.5 + 0.3,
                (Math.random() - 0.5) * 1
            );
            particle.userData.life = 1.0 + Math.random() * 1.0;
            particle.userData.maxLife = particle.userData.life;
            
            scene.add(particle);
            this.particles.push(particle);
        }
    }
    
    update(deltaTime) {
        let activeParticles = 0;
        
        for (const particle of this.particles) {
            if (particle.userData.life <= 0) {
                particle.visible = false;
                continue;
            }
            
            activeParticles++;
            
            // Update position
            const vel = particle.userData.velocity;
            particle.position.add(vel.clone().multiplyScalar(deltaTime));
            
            // Apply wind
            particle.position.add(this.windDirection.clone().multiplyScalar(deltaTime * 0.5));
            
            // Expand
            const expandRate = 1 + deltaTime * 0.5;
            particle.scale.multiplyScalar(expandRate);
            
            // Fade
            particle.userData.life -= deltaTime;
            const lifeRatio = particle.userData.life / particle.userData.maxLife;
            particle.material.opacity = lifeRatio * 0.4;
        }
        
        if (activeParticles === 0) {
            this.cleanup();
            return false;
        }
        
        return true;
    }
    
    cleanup() {
        for (const particle of this.particles) {
            this.scene.remove(particle);
        }
        this.particles = [];
    }
}