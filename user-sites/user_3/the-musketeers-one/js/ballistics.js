/**
 * Ballistics System - Projectile physics with gravity drop
 * No hitscan - real ballistic projectiles
 */

class BallisticProjectile {
    constructor(startPos, velocity, owner) {
        this.position = startPos.clone();
        this.velocity = velocity.clone();
        this.owner = owner;
        this.alive = true;
        this.time = 0;
        
        // Musket ball properties (approx .75 cal Brown Bess)
        this.mass = 0.015; // kg (about 230 grains)
        this.diameter = 0.019; // meters (~.75 cal)
        this.dragCoeff = 0.47; // sphere drag
        
        // Create visual
        this.mesh = this.createMesh();
    }
    
    createMesh() {
        const geometry = new THREE.SphereGeometry(0.008, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x444444,
            roughness: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(this.position);
        return mesh;
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        
        this.time += deltaTime;
        
        // Apply gravity (9.81 m/s²)
        this.velocity.y -= 9.81 * deltaTime;
        
        // Apply drag (simplified)
        const speed = this.velocity.length();
        const dragMagnitude = 0.5 * 1.225 * speed * speed * this.dragCoeff * (Math.PI * this.diameter * this.diameter / 4);
        const dragForce = this.velocity.clone().normalize().multiplyScalar(-dragMagnitude / this.mass * deltaTime * 0.01);
        this.velocity.add(dragForce);
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.mesh.position.copy(this.position);
        
        // Check ground collision
        if (this.position.y <= 0) {
            this.alive = false;
            this.createImpactEffect();
        }
        
        // Max range check (100 meters)
        if (this.time > 3.0) {
            this.alive = false;
        }
    }
    
    createImpactEffect() {
        // Simple impact dust
        const geometry = new THREE.RingGeometry(0.02, 0.05, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x8B7355, 
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const effect = new THREE.Mesh(geometry, material);
        effect.position.copy(this.position);
        effect.position.y = 0.01;
        effect.rotation.x = -Math.PI / 2;
        
        // Add to scene and fade out
        this.owner.game.scene.add(effect);
        
        let opacity = 0.6;
        const fadeInterval = setInterval(() => {
            opacity -= 0.05;
            material.opacity = opacity;
            if (opacity <= 0) {
                clearInterval(fadeInterval);
                this.owner.game.scene.remove(effect);
            }
        }, 50);
    }
}

class BallisticsManager {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
    }
    
    fire(startPos, direction, muzzleVelocity, owner) {
        // Add slight random dispersion (muskets are not precision weapons)
        const dispersion = 0.02; // radians
        const dispX = (Math.random() - 0.5) * dispersion;
        const dispY = (Math.random() - 0.5) * dispersion;
        
        const dispersedDir = direction.clone();
        dispersedDir.x += dispX;
        dispersedDir.y += dispY;
        dispersedDir.normalize();
        
        const velocity = dispersedDir.multiplyScalar(muzzleVelocity);
        const projectile = new BallisticProjectile(startPos, velocity, owner);
        
        this.projectiles.push(projectile);
        this.scene.add(projectile.mesh);
        
        return projectile;
    }
    
    update(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(deltaTime);
            
            if (!proj.alive) {
                this.scene.remove(proj.mesh);
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    checkHits(players) {
        for (const proj of this.projectiles) {
            if (!proj.alive) continue;
            
            for (const player of players) {
                if (player === proj.owner) continue;
                
                // Simple hit detection
                const dist = proj.position.distanceTo(player.position);
                if (dist < 0.4) { // Hit radius
                    player.takeDamage(100); // One shot kill
                    proj.alive = false;
                    this.createBloodEffect(proj.position);
                    break;
                }
            }
        }
    }
    
    createBloodEffect(pos) {
        const particleCount = 8;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
            velocities.push({
                x: (Math.random() - 0.5) * 3,
                y: Math.random() * 2,
                z: (Math.random() - 0.5) * 3
            });
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x8B0000,
            size: 0.1,
            transparent: true
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        
        let time = 0;
        const updateParticles = () => {
            time += 0.05;
            const posAttr = particles.geometry.attributes.position;
            
            for (let i = 0; i < particleCount; i++) {
                posAttr.array[i * 3] += velocities[i].x * 0.02;
                posAttr.array[i * 3 + 1] += velocities[i].y * 0.02 - 0.05;
                posAttr.array[i * 3 + 2] += velocities[i].z * 0.02;
            }
            posAttr.needsUpdate = true;
            material.opacity = 1 - time;
            
            if (time < 1) {
                requestAnimationFrame(updateParticles);
            } else {
                this.scene.remove(particles);
            }
        };
        updateParticles();
    }
}