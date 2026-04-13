/**
 * Particle system for muzzle flash and smoke effects
 * These are environmental effects, NOT HUD elements
 */

class ParticleSystem {
    constructor(scene, maxParticles = 1000) {
        this.scene = scene;
        this.maxParticles = maxParticles;
        this.particles = [];
        
        // Create particle geometry - using simple meshes for each particle
        // For a more optimized version, could use BufferGeometry with PointsMaterial
        this.particlePool = [];
        this.activeParticles = [];
        
        this.initPools();
    }
    
    initPools() {
        // Pre-create particle meshes for better performance
        for (let i = 0; i < this.maxParticles; i++) {
            const geometry = new THREE.PlaneGeometry(0.1, 0.1);
            const material = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.visible = false;
            this.scene.add(mesh);
            this.particlePool.push({
                mesh: mesh,
                active: false,
                life: 0,
                maxLife: 0,
                velocity: new THREE.Vector3(),
                type: null,
                size: 1
            });
        }
    }
    
    spawnParticle(type, position, velocity, color, size, life, opacity = 1) {
        // Find inactive particle
        const particle = this.particlePool.find(p => !p.active);
        if (!particle) return; // Pool exhausted
        
        particle.active = true;
        particle.life = life;
        particle.maxLife = life;
        particle.type = type;
        particle.size = size;
        particle.velocity.copy(velocity);
        
        // Set up mesh
        particle.mesh.position.copy(position);
        particle.mesh.scale.set(size, size, size);
        particle.mesh.material.color.setHex(color);
        particle.mesh.material.opacity = opacity;
        particle.mesh.visible = true;
        
        // Billboard - always face camera
        particle.mesh.rotation.x = 0;
        particle.mesh.rotation.y = 0;
        
        this.activeParticles.push(particle);
    }
    
    /**
     * Create muzzle flash at position
     * @param {THREE.Vector3} position - Muzzle position
     * @param {THREE.Vector3} direction - Firing direction
     */
    createMuzzleFlash(position, direction) {
        const flashColor = 0xffaa00;
        const coreColor = 0xffffff;
        
        // Core flash (bright, short)
        for (let i = 0; i < 5; i++) {
            const spread = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            );
            spread.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
            
            const velocity = direction.clone().multiplyScalar(2).add(spread);
            
            this.spawnParticle(
                'flash',
                position.clone().add(spread),
                velocity,
                Math.random() > 0.5 ? coreColor : flashColor,
                0.3 + Math.random() * 0.2,
                0.05 + Math.random() * 0.05, // Very short life
                0.9
            );
        }
        
        // Pan flash (priming powder ignition)
        for (let i = 0; i < 3; i++) {
            const spread = new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                Math.random() * 0.05,
                (Math.random() - 0.5) * 0.05
            );
            
            this.spawnParticle(
                'pan',
                position.clone().add(new THREE.Vector3(0, 0.05, 0)).add(spread),
                new THREE.Vector3(0, 0.5, 0),
                0xff5500,
                0.1 + Math.random() * 0.1,
                0.08,
                0.8
            );
        }
    }
    
    /**
     * Create smoke cloud from musket discharge
     * @param {THREE.Vector3} position - Muzzle position
     * @param {THREE.Vector3} direction - Firing direction
     */
    createSmoke(position, direction) {
        const smokeColor = 0xdddddd;
        const darkSmoke = 0x999999;
        
        // Main smoke cloud
        for (let i = 0; i < 20; i++) {
            const spread = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
            );
            
            const velocity = direction.clone().multiplyScalar(1 + Math.random() * 2);
            velocity.add(new THREE.Vector3(0, 0.5 + Math.random() * 1, 0)); // Rise up
            velocity.add(spread);
            
            const size = 0.2 + Math.random() * 0.4;
            const life = 1.0 + Math.random() * 2.0;
            const color = Math.random() > 0.3 ? smokeColor : darkSmoke;
            
            this.spawnParticle(
                'smoke',
                position.clone().add(spread.multiplyScalar(0.2)),
                velocity,
                color,
                size,
                life,
                0.6
            );
        }
        
        // White powder smoke (initial discharge)
        for (let i = 0; i < 8; i++) {
            const spread = new THREE.Vector3(
                (Math.random() - 0.5) * 0.15,
                (Math.random() - 0.5) * 0.15,
                (Math.random() - 0.5) * 0.15
            );
            
            const velocity = direction.clone().multiplyScalar(0.5);
            velocity.add(spread);
            
            this.spawnParticle(
                'powder',
                position.clone(),
                velocity,
                0xffffff,
                0.1 + Math.random() * 0.15,
                0.2,
                0.4
            );
        }
    }
    
    /**
     * Create sparks from hammer/frizzen strike
     * @param {THREE.Vector3} position - Pan position
     */
    createSparks(position) {
        for (let i = 0; i < 6; i++) {
            const spread = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.3,
                (Math.random() - 0.5) * 0.2
            );
            
            this.spawnParticle(
                'spark',
                position.clone(),
                spread,
                0xffaa00,
                0.02 + Math.random() * 0.03,
                0.1 + Math.random() * 0.1,
                1.0
            );
        }
    }
    
    /**
     * Create ground hit dust
     * @param {THREE.Vector3} position - Hit position
     */
    createDust(position) {
        for (let i = 0; i < 10; i++) {
            const spread = new THREE.Vector3(
                (Math.random() - 0.5) * 0.4,
                Math.random() * 0.5,
                (Math.random() - 0.5) * 0.4
            );
            
            this.spawnParticle(
                'dust',
                position.clone(),
                spread,
                0x8b7355,
                0.1 + Math.random() * 0.2,
                0.5 + Math.random() * 0.5,
                0.5
            );
        }
    }
    
    /**
     * Create powder pouring effect during reload
     * @param {THREE.Vector3} position - Muzzle position
     * @param {THREE.Vector3} direction - Barrel direction
     */
    createPouringPowder(position, direction) {
        for (let i = 0; i < 3; i++) {
            const spread = new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02
            );
            
            this.spawnParticle(
                'powder_fall',
                position.clone().add(spread),
                new THREE.Vector3(0, -0.5, 0),
                0xeeeeee,
                0.03 + Math.random() * 0.02,
                0.3,
                0.3
            );
        }
    }
    
    update(dt) {
        // Update all active particles
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            
            // Update life
            p.life -= dt;
            
            if (p.life <= 0) {
                // Deactivate
                p.active = false;
                p.mesh.visible = false;
                this.activeParticles.splice(i, 1);
                continue;
            }
            
            // Update position
            p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
            
            // Apply type-specific physics
            switch (p.type) {
                case 'smoke':
                    // Smoke rises and expands
                    p.velocity.y += dt * 0.5;
                    p.velocity.multiplyScalar(0.98); // Drag
                    p.mesh.scale.multiplyScalar(1 + dt * 0.5); // Expand
                    p.mesh.material.opacity = (p.life / p.maxLife) * 0.4;
                    break;
                    
                case 'flash':
                    // Flash fades quickly
                    p.mesh.material.opacity = p.life / p.maxLife;
                    p.mesh.scale.multiplyScalar(1 - dt * 2);
                    break;
                    
                case 'spark':
                    // Sparks fall with gravity
                    p.velocity.y -= dt * 9.8;
                    p.mesh.material.opacity = p.life / p.maxLife;
                    break;
                    
                case 'dust':
                    // Dust settles
                    p.velocity.y -= dt * 2;
                    p.velocity.multiplyScalar(0.9);
                    p.mesh.scale.multiplyScalar(1 + dt * 0.3);
                    p.mesh.material.opacity = (p.life / p.maxLife) * 0.5;
                    break;
                    
                case 'powder':
                case 'powder_fall':
                    p.velocity.multiplyScalar(0.95);
                    p.mesh.material.opacity = (p.life / p.maxLife) * 0.3;
                    break;
                    
                case 'pan':
                    p.mesh.material.opacity = p.life / p.maxLife;
                    break;
            }
            
            // Make particle face camera (billboard)
            p.mesh.lookAt(p.mesh.position.clone().add(new THREE.Vector3(0, 0, 1)));
        }
    }
    
    clear() {
        for (const p of this.activeParticles) {
            p.active = false;
            p.mesh.visible = false;
        }
        this.activeParticles = [];
    }
}