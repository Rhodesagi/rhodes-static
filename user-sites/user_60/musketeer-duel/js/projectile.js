/**
 * Projectile physics system for musket balls
 * Uses ballistic trajectory with gravity, NOT hitscan
 */

class Projectile {
    constructor(scene, particleSystem) {
        this.scene = scene;
        this.particleSystem = particleSystem;
        this.balls = [];
        
        // Musket ball properties
        this.ballDiameter = 0.018; // 18mm ~ .69 caliber (Brown Bess)
        this.ballMass = 0.035; // 35 grams
        
        // Pre-create geometries
        this.ballGeometry = new THREE.SphereGeometry(this.ballDiameter / 2, 8, 8);
        this.ballMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            metalness: 0.8,
            roughness: 0.4
        });
    }
    
    /**
     * Fire a musket ball
     * @param {THREE.Vector3} position - Muzzle position
     * @param {THREE.Vector3} direction - Firing direction (normalized)
     * @param {number} muzzleVelocity - Initial velocity in m/s (scaled to game)
     * @param {number} playerId - Firing player
     */
    fire(position, direction, muzzleVelocity = 450, playerId = 0) {
        // Scale velocity for game world (1 unit = 1 meter roughly)
        // Real musket velocity ~450 m/s, but scaled down for arena size
        const gameVelocity = muzzleVelocity * 0.3; // Scale to arena
        
        // Create ball mesh
        const mesh = new THREE.Mesh(this.ballGeometry, this.ballMaterial.clone());
        mesh.position.copy(position);
        mesh.castShadow = true;
        this.scene.add(mesh);
        
        // Add slight random spread (muskets weren't accurate)
        const spreadAngle = 0.02; // ~1 degree spread
        const spreadX = (Math.random() - 0.5) * spreadAngle;
        const spreadY = (Math.random() - 0.5) * spreadAngle;
        
        const velocity = direction.clone().multiplyScalar(gameVelocity);
        velocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadX);
        velocity.applyAxisAngle(new THREE.Vector3(1, 0, 0), spreadY);
        
        // Trail effect
        const trail = [];
        
        this.balls.push({
            mesh: mesh,
            velocity: velocity,
            position: position.clone(),
            startPosition: position.clone(),
            life: 5.0, // Max 5 seconds
            active: true,
            playerId: playerId,
            trail: trail,
            gravity: 9.81, // m/s^2
            drag: 0.995, // Air resistance
            bounces: 0,
            maxBounces: 2
        });
        
        // Effects
        this.particleSystem.createMuzzleFlash(position, direction);
        this.particleSystem.createSmoke(position, direction);
        this.particleSystem.createSparks(
            position.clone().add(direction.clone().multiplyScalar(-0.1))
        );
        
        return true;
    }
    
    /**
     * Update all projectile physics
     * @param {number} dt - Delta time in seconds
     * @param {Array} players - Array of player objects for collision
     * @param {World} world - World for terrain collision
     */
    update(dt, players, world) {
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];
            
            if (!ball.active) {
                this.removeBall(i);
                continue;
            }
            
            // Physics integration (Euler)
            ball.life -= dt;
            
            // Apply gravity
            ball.velocity.y -= ball.gravity * dt * 0.3; // Scale gravity to match world
            
            // Apply air drag
            ball.velocity.multiplyScalar(ball.drag);
            
            // Update position
            ball.position.add(ball.velocity.clone().multiplyScalar(dt));
            ball.mesh.position.copy(ball.position);
            
            // Update trail
            if (Math.random() > 0.7) {
                ball.trail.push(ball.position.clone());
                if (ball.trail.length > 20) ball.trail.shift();
            }
            
            // Terrain collision
            const groundHeight = world.getHeightAt(ball.position.x, ball.position.z);
            if (ball.position.y <= groundHeight) {
                ball.position.y = groundHeight;
                ball.mesh.position.copy(ball.position);
                
                if (ball.bounces < ball.maxBounces && ball.velocity.length() > 5) {
                    // Bounce
                    ball.velocity.y *= -0.5;
                    ball.velocity.x *= 0.6;
                    ball.velocity.z *= 0.6;
                    ball.bounces++;
                    this.particleSystem.createDust(ball.position);
                } else {
                    // Stop
                    ball.active = false;
                    this.particleSystem.createDust(ball.position);
                }
            }
            
            // Player collision
            for (const player of players) {
                if (player.id === ball.playerId) continue; // Don't hit self
                
                const dist = ball.position.distanceTo(player.position);
                if (dist < 0.4) { // Player radius ~0.4m
                    // Hit!
                    player.onHit(ball);
                    ball.active = false;
                    this.particleSystem.createDust(ball.position);
                    break;
                }
            }
            
            // Out of bounds
            if (ball.life <= 0 || Math.abs(ball.position.x) > 100 || Math.abs(ball.position.z) > 100) {
                ball.active = false;
            }
            
            if (!ball.active) {
                this.removeBall(i);
            }
        }
    }
    
    removeBall(index) {
        const ball = this.balls[index];
        this.scene.remove(ball.mesh);
        ball.mesh.geometry.dispose();
        ball.mesh.material.dispose();
        this.balls.splice(index, 1);
    }
    
    clear() {
        for (let i = this.balls.length - 1; i >= 0; i--) {
            this.removeBall(i);
        }
    }
    
    /**
     * Calculate trajectory for aim assist (internal use only)
     * Shows where shot will go with current aim
     */
    calculateTrajectory(startPos, velocity, steps = 20) {
        const points = [startPos.clone()];
        const vel = velocity.clone();
        let pos = startPos.clone();
        const dt = 0.05;
        
        for (let i = 0; i < steps; i++) {
            vel.y -= 9.81 * dt * 0.3;
            vel.multiplyScalar(0.995);
            pos.add(vel.clone().multiplyScalar(dt));
            points.push(pos.clone());
            
            if (pos.y < 0) break;
        }
        
        return points;
    }
}