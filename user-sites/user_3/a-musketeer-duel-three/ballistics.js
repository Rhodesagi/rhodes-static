import * as THREE from 'https://esm.sh/three@0.160.0';
import { playSound } from './game.js';

export class Ballistics {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
        
        // Projectile geometry and material (reused)
        this.ballGeo = new THREE.SphereGeometry(0.03, 8, 8);
        this.ballMat = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            metalness: 0.9,
            roughness: 0.2
        });
        
        // Smoke particle system
        this.particles = [];
        this.smokeGeo = new THREE.PlaneGeometry(0.3, 0.3);
        this.smokeMat = new THREE.MeshBasicMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
    }
    
    spawnProjectile(position, direction, ownerId) {
        const ball = new THREE.Mesh(this.ballGeo, this.ballMat);
        ball.position.copy(position);
        this.scene.add(ball);
        
        // Muzzle velocity ~450 m/s scaled to game units
        const velocity = direction.clone().multiplyScalar(80);
        
        this.projectiles.push({
            mesh: ball,
            velocity: velocity,
            ownerId: ownerId,
            lifetime: 3.0,
            gravity: 9.8
        });
        
        // Muzzle flash particles
        this.spawnMuzzleFlash(position, direction);
    }
    
    spawnMuzzleFlash(position, direction) {
        for (let i = 0; i < 8; i++) {
            const particle = new THREE.Mesh(
                new THREE.PlaneGeometry(0.1, 0.1),
                new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 1, 0.5),
                    transparent: true,
                    opacity: 1,
                    side: THREE.DoubleSide
                })
            );
            
            particle.position.copy(position);
            particle.position.x += (Math.random() - 0.5) * 0.1;
            particle.position.y += (Math.random() - 0.5) * 0.1;
            particle.position.z += (Math.random() - 0.5) * 0.1;
            
            const spread = 0.3;
            const vel = direction.clone().multiplyScalar(5);
            vel.x += (Math.random() - 0.5) * spread;
            vel.y += (Math.random() - 0.5) * spread;
            vel.z += (Math.random() - 0.5) * spread;
            
            this.particles.push({
                mesh: particle,
                velocity: vel,
                lifetime: 0.2 + Math.random() * 0.2,
                drag: 0.95
            });
            
            this.scene.add(particle);
        }
        
        // Smoke
        for (let i = 0; i < 5; i++) {
            const smoke = new THREE.Mesh(this.smokeGeo, this.smokeMat.clone());
            smoke.position.copy(position);
            smoke.position.x += (Math.random() - 0.5) * 0.2;
            smoke.position.y += Math.random() * 0.1;
            smoke.position.z += (Math.random() - 0.5) * 0.2;
            smoke.rotation.z = Math.random() * Math.PI;
            
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                1 + Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
            
            this.particles.push({
                mesh: smoke,
                velocity: vel,
                lifetime: 1.0 + Math.random() * 1.0,
                drag: 0.98,
                grow: true
            });
            
            this.scene.add(smoke);
        }
    }
    
    spawnHitEffect(position) {
        for (let i = 0; i < 6; i++) {
            const spark = new THREE.Mesh(
                new THREE.PlaneGeometry(0.05, 0.05),
                new THREE.MeshBasicMaterial({
                    color: 0xffaa00,
                    transparent: true,
                    side: THREE.DoubleSide
                })
            );
            
            spark.position.copy(position);
            
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
            
            this.particles.push({
                mesh: spark,
                velocity: vel,
                lifetime: 0.3,
                drag: 0.9,
                gravity: 15
            });
            
            this.scene.add(spark);
        }
    }
    
    update(delta, players) {
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            // Apply gravity
            proj.velocity.y -= proj.gravity * delta;
            
            // Move
            const moveStep = proj.velocity.clone().multiplyScalar(delta);
            proj.mesh.position.add(moveStep);
            
            // Rotate to face velocity
            proj.mesh.lookAt(proj.mesh.position.clone().add(proj.velocity));
            
            // Lifetime
            proj.lifetime -= delta;
            
            // Collision with ground
            if (proj.mesh.position.y <= 0) {
                this.removeProjectile(i);
                continue;
            }
            
            // Collision with players
            for (const player of players) {
                if (player.id === proj.ownerId || !player.alive) continue;
                
                const dist = proj.mesh.position.distanceTo(player.position);
                if (dist < player.radius + 0.1) {
                    // Hit!
                    const damage = 34 + Math.random() * 33; // 34-67 damage
                    player.takeDamage(Math.floor(damage));
                    this.spawnHitEffect(proj.mesh.position);
                    playSound('hit');
                    this.removeProjectile(i);
                    break;
                }
            }
            
            // Remove if expired
            if (proj.lifetime <= 0 && this.projectiles[i]) {
                this.removeProjectile(i);
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const part = this.particles[i];
            
            // Move
            part.mesh.position.add(part.velocity.clone().multiplyScalar(delta));
            
            // Apply drag
            if (part.drag) {
                part.velocity.multiplyScalar(part.drag);
            }
            
            // Apply gravity
            if (part.gravity) {
                part.velocity.y -= part.gravity * delta;
            }
            
            // Grow smoke
            if (part.grow) {
                const scale = 1 + (1 - part.lifetime) * 2;
                part.mesh.scale.setScalar(scale);
            }
            
            // Face camera (billboard)
            part.mesh.rotation.z += delta * 2;
            
            // Fade
            part.lifetime -= delta;
            if (part.mesh.material.opacity) {
                part.mesh.material.opacity = part.lifetime * 0.6;
            }
            
            // Remove
            if (part.lifetime <= 0) {
                this.scene.remove(part.mesh);
                this.particles.splice(i, 1);
            }
        }
    }
    
    removeProjectile(index) {
        const proj = this.projectiles[index];
        this.scene.remove(proj.mesh);
        this.projectiles.splice(index, 1);
    }
}
