// SmokeSystem.js - Volumetric smoke particles for musket discharge
class SmokeParticle {
    constructor(position, velocity, size, lifetime) {
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.initialSize = size;
        this.size = size;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.opacity = 1.0;
        this.active = true;
        
        // Wind drift
        this.windX = 0.5 + Math.random() * 0.5;
        this.windZ = (Math.random() - 0.5) * 0.3;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.lifetime -= deltaTime;
        
        if (this.lifetime <= 0) {
            this.active = false;
            return;
        }
        
        // Movement with wind and buoyancy
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.position.y += 0.5 * deltaTime; // Rise
        this.position.x += this.windX * deltaTime;
        this.position.z += this.windZ * deltaTime;
        
        // Expand
        const age = 1 - (this.lifetime / this.maxLifetime);
        this.size = this.initialSize * (1 + age * 4);
        
        // Fade
        this.opacity = Math.min(1.0, this.lifetime / 2.0) * 0.6;
    }
}

class SmokeSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.maxParticles = 800;
        
        // Create particle geometry (instanced) - sphere for consistent view from all angles
        this.geometry = new THREE.SphereGeometry(1, 8, 8);
        
        // Create a soft smoke texture procedurally
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(200, 200, 200, 1)');
        gradient.addColorStop(0.5, 'rgba(150, 150, 150, 0.5)');
        gradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        
        this.material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        // Use instanced mesh for performance
        this.instancedMesh = new THREE.InstancedMesh(this.geometry, this.material, this.maxParticles);
        this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.instancedMesh);
        
        this.dummy = new THREE.Object3D();
    }
    
    emitFromMuzzle(position, direction, count = 15) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift(); // Remove oldest
            }
            
            // Spread in cone
            const spread = 0.3;
            const velocity = new THREE.Vector3(
                direction.x + (Math.random() - 0.5) * spread,
                direction.y + (Math.random() - 0.5) * spread,
                direction.z + (Math.random() - 0.5) * spread
            ).normalize().multiplyScalar(2 + Math.random() * 3);
            
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            );
            
            const particle = new SmokeParticle(
                position.clone().add(offset),
                velocity,
                0.3 + Math.random() * 0.3,
                3.0 + Math.random() * 2.0
            );
            
            this.particles.push(particle);
        }
    }
    
    emitFromPan(position, count = 5) {
        // Smaller pan flash smoke
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift();
            }
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 1,
                1 + Math.random(),
                (Math.random() - 0.5) * 1
            );
            
            const particle = new SmokeParticle(
                position.clone(),
                velocity,
                0.15 + Math.random() * 0.15,
                1.5 + Math.random()
            );
            
            this.particles.push(particle);
        }
    }
    
    update(deltaTime) {
        let activeCount = 0;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(deltaTime);
            
            if (p.active && activeCount < this.maxParticles) {
                // Spherical smoke - no billboarding needed
                this.dummy.position.copy(p.position);
                this.dummy.scale.set(p.size, p.size, p.size);
                this.dummy.rotation.set(0, 0, 0); // No rotation - sphere looks same from all angles
                this.dummy.updateMatrix();
                
                this.instancedMesh.setMatrixAt(activeCount, this.dummy.matrix);
                
                activeCount++;
            }
        }
        
        // Hide unused instances
        for (let i = activeCount; i < this.maxParticles; i++) {
            this.dummy.position.set(0, -1000, 0); // Hide below ground
            this.dummy.updateMatrix();
            this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
        }
        
        this.instancedMesh.count = activeCount;
        this.instancedMesh.instanceMatrix.needsUpdate = true;
    }
    
    clear() {
        this.particles = [];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmokeSystem;
}
