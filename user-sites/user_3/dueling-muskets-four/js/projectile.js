import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// Projectile system - separated to avoid circular dependencies

export class Projectile {
    constructor(scene, position, velocity, owner) {
        this.scene = scene;
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.owner = owner;
        this.gravity = 9.8;
        this.life = 5.0;
        this.active = true;
        
        // Visual
        const geo = new THREE.SphereGeometry(0.03, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0x333333 });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(this.position);
        scene.add(this.mesh);
        
        // Trail
        this.trail = [];
        this.lastTrailTime = 0;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.destroy();
            return;
        }
        
        // Apply gravity
        this.velocity.y -= this.gravity * deltaTime * 0.1;
        
        // Move
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.mesh.position.copy(this.position);
        
        // Trail
        this.lastTrailTime += deltaTime;
        if (this.lastTrailTime > 0.05) {
            this.trail.push(this.position.clone());
            if (this.trail.length > 10) this.trail.shift();
            this.lastTrailTime = 0;
        }
        
        // Ground collision
        if (this.position.y <= 0) {
            this.destroy();
            return;
        }
        
        // Player collision check
        if (window.gameState && window.gameState.players) {
            for (const player of window.gameState.players) {
                if (player.id === this.owner) continue;
                
                const dist = this.position.distanceTo(player.position);
                if (dist < 1.5) {
                    player.hit();
                    this.destroy();
                    this.createHitEffect(this.position);
                    return;
                }
            }
        }
        
        // Wall collision
        if (window.gameState && window.gameState.walls) {
            for (const wall of window.gameState.walls) {
                const box = new THREE.Box3().setFromObject(wall);
                if (box.containsPoint(this.position)) {
                    this.destroy();
                    this.createHitEffect(this.position);
                    return;
                }
            }
        }
    }
    
    destroy() {
        this.active = false;
        this.scene.remove(this.mesh);
    }
    
    createHitEffect(position) {
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const geo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
            const mat = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(position);
            mesh.position.x += (Math.random() - 0.5) * 0.3;
            mesh.position.y += (Math.random() - 0.5) * 0.3;
            mesh.position.z += (Math.random() - 0.5) * 0.3;
            this.scene.add(mesh);
            
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
            
            let life = 0.5;
            const animate = () => {
                life -= 0.016;
                if (life <= 0) {
                    this.scene.remove(mesh);
                    return;
                }
                mesh.position.add(vel.clone().multiplyScalar(0.016));
                vel.y -= 0.05;
                mesh.scale.setScalar(life * 2);
                requestAnimationFrame(animate);
            };
            animate();
        }
    }
}

export function createMuzzleFlash(scene, position) {
    const flashGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const flashMat = new THREE.MeshBasicMaterial({ 
        color: 0xffffaa,
        transparent: true,
        opacity: 0.8
    });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(position);
    scene.add(flash);
    
    let flashLife = 0.1;
    const animateFlash = () => {
        flashLife -= 0.016;
        if (flashLife <= 0) {
            scene.remove(flash);
            return;
        }
        flash.scale.setScalar(1 + (0.1 - flashLife) * 10);
        flash.material.opacity = flashLife * 8;
        requestAnimationFrame(animateFlash);
    };
    animateFlash();
}
