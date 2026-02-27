/**
 * Ballistics Module - Simulates .69 caliber Brown Bess musket ball
 * Muzzle velocity: ~1000-1100 fps (304-335 m/s)
 * Ball weight: ~545 grains (35 grams)
 * Drop: ~4 feet at 100 yards
 */

class Ballistics {
    constructor() {
        // Physical constants
        this.GRAVITY = 9.81; // m/s²
        this.MUZZLE_VELOCITY = 320; // m/s (average)
        this.BALL_DIAMETER = 0.0175; // meters (0.69 cal)
        this.BALL_MASS = 0.035; // kg
        
        // Air resistance coefficient (simplified)
        this.DRAG_COEFFICIENT = 0.47; // sphere
        this.AIR_DENSITY = 1.225; // kg/m³ at sea level
        this.CROSS_SECTIONAL_AREA = Math.PI * Math.pow(this.BALL_DIAMETER / 2, 2);
    }

    /**
     * Calculate projectile trajectory with gravity and air resistance
     * @param {THREE.Vector3} origin - Starting position
     * @param {THREE.Vector3} direction - Normalized direction vector
     * @param {number} deltaTime - Time step in seconds
     * @returns {Object} New position and velocity
     */
    calculateTrajectory(origin, direction, velocity, deltaTime) {
        // Apply drag force
        const speed = velocity.length();
        const dragForce = 0.5 * this.AIR_DENSITY * Math.pow(speed, 2) * 
                         this.DRAG_COEFFICIENT * this.CROSS_SECTIONAL_AREA;
        const dragAcceleration = dragForce / this.BALL_MASS;
        
        // Drag opposes velocity
        const dragDirection = velocity.clone().normalize().negate();
        const dragVector = dragDirection.multiplyScalar(dragAcceleration * deltaTime);
        
        // Gravity
        const gravityVector = new THREE.Vector3(0, -this.GRAVITY * deltaTime, 0);
        
        // Update velocity
        const newVelocity = velocity.clone().add(dragVector).add(gravityVector);
        
        // Update position
        const displacement = velocity.clone().multiplyScalar(deltaTime);
        const newPosition = origin.clone().add(displacement);
        
        return {
            position: newPosition,
            velocity: newVelocity
        };
    }

    /**
     * Fire a musket ball with initial velocity based on aim direction
     */
    fire(origin, aimDirection) {
        const velocity = aimDirection.clone().multiplyScalar(this.MUZZLE_VELOCITY);
        return {
            origin: origin.clone(),
            position: origin.clone(),
            velocity: velocity,
            startTime: Date.now(),
            active: true
        };
    }

    /**
     * Update all active projectiles
     */
    updateProjectiles(projectiles, deltaTime, scene, onHit) {
        const toRemove = [];
        
        for (let i = 0; i < projectiles.length; i++) {
            const proj = projectiles[i];
            if (!proj.active) continue;

            // Update trajectory
            const result = this.calculateTrajectory(
                proj.position, 
                proj.velocity.clone().normalize(), 
                proj.velocity, 
                deltaTime
            );
            
            proj.position.copy(result.position);
            proj.velocity.copy(result.velocity);

            // Check for ground collision
            if (proj.position.y < 0.05) {
                proj.active = false;
                toRemove.push(i);
                this.createImpactEffect(proj.position, scene);
                continue;
            }

            // Check for wall collisions (simple bounds)
            if (Math.abs(proj.position.x) > 50 || Math.abs(proj.position.z) > 50) {
                proj.active = false;
                toRemove.push(i);
                continue;
            }

            // Check for player hits
            if (onHit) {
                const hit = onHit(proj.position);
                if (hit) {
                    proj.active = false;
                    toRemove.push(i);
                    this.createBloodEffect(proj.position, scene);
                }
            }

            // Update visual
            if (proj.mesh) {
                proj.mesh.position.copy(proj.position);
            }
        }

        // Remove inactive projectiles (reverse order to preserve indices)
        for (let i = toRemove.length - 1; i >= 0; i--) {
            const idx = toRemove[i];
            if (projectiles[idx].mesh) {
                scene.remove(projectiles[idx].mesh);
            }
            projectiles.splice(idx, 1);
        }
    }

    createProjectileMesh(scene) {
        const geometry = new THREE.SphereGeometry(this.BALL_DIAMETER / 2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.9 
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        return mesh;
    }

    createImpactEffect(position, scene) {
        // Create dust particles
        for (let i = 0; i < 5; i++) {
            const particle = new THREE.Mesh(
                new THREE.BoxGeometry(0.02, 0.02, 0.02),
                new THREE.MeshBasicMaterial({ color: 0x8a7a6a })
            );
            particle.position.copy(position);
            particle.position.y = 0.01;
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
            scene.add(particle);
            
            // Animate and remove
            const animate = () => {
                particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.016));
                particle.userData.velocity.y -= 0.05;
                particle.scale.multiplyScalar(0.95);
                if (particle.scale.x < 0.01) {
                    scene.remove(particle);
                } else {
                    requestAnimationFrame(animate);
                }
            };
            animate();
        }
    }

    createBloodEffect(position, scene) {
        // Create blood splatter
        for (let i = 0; i < 8; i++) {
            const particle = new THREE.Mesh(
                new THREE.BoxGeometry(0.03, 0.03, 0.03),
                new THREE.MeshBasicMaterial({ color: 0x8a1010 })
            );
            particle.position.copy(position);
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 2,
                (Math.random() - 0.5) * 3
            );
            scene.add(particle);
            
            const animate = () => {
                particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.016));
                particle.userData.velocity.y -= 0.08;
                if (particle.position.y < 0) {
                    scene.remove(particle);
                } else {
                    requestAnimationFrame(animate);
                }
            };
            animate();
        }
    }
}