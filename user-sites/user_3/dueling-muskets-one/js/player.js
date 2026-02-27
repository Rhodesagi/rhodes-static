import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { FlintlockMusket, Projectile } from './weapon.js';

export class Player {
    constructor(scene, x, z, color, keys, isLeftPlayer) {
        this.scene = scene;
        this.keys = keys;
        this.isLeftPlayer = isLeftPlayer;
        
        // Position
        this.position = new THREE.Vector3(x, 1.6, z);
        this.rotation = 0; // Y-axis rotation
        this.height = 1.6;
        
        // Movement
        this.speed = 3.5; // m/s
        this.velocity = new THREE.Vector3();
        
        // Camera system - iron sights only, no HUD
        this.camera = new THREE.PerspectiveCamera(60, 0.5, 0.1, 1000);
        this.camera.position.copy(this.position);
        
        // Weapon
        this.weapon = new FlintlockMusket(scene, color);
        this.scene.add(this.weapon.mesh);
        
        // Weapon sway/turn (Q/E adjusts aim offset)
        this.weaponYaw = 0;
        this.weaponPitch = 0;
        
        // Aim state
        this.aiming = false;
        this.aimTransition = 0;
        
        // Projectiles
        this.projectiles = [];
        
        // Hit detection
        this.radius = 0.3;
        this.alive = true;
        this.respawnTimer = 0;
        
        // Movement state
        this.moving = false;
        
        // Camera recoil
        this.recoilOffset = 0;
    }
    
    update(delta, input, opponent) {
        if (!this.alive) {
            this.respawnTimer -= delta;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }
        
        // Handle input
        this.handleInput(input, delta);
        
        // Movement
        this.updateMovement(delta);
        
        // Check collision with opponent projectiles
        this.checkHits();
        
        // Update weapon
        this.weapon.update(delta, this.aiming, this.moving);
        
        // Update projectiles
        this.updateProjectiles(delta);
        
        // Update camera position and orientation
        this.updateCamera();
        
        // Update weapon position relative to camera
        this.updateWeaponPosition();
    }
    
    handleInput(input, delta) {
        // Movement vectors
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
        
        this.velocity.set(0, 0, 0);
        this.moving = false;
        
        if (input.isDown(this.keys.forward)) {
            this.velocity.add(forward);
            this.moving = true;
        }
        if (input.isDown(this.keys.backward)) {
            this.velocity.sub(forward);
            this.moving = true;
        }
        if (input.isDown(this.keys.left)) {
            this.velocity.sub(right);
            this.moving = true;
        }
        if (input.isDown(this.keys.right)) {
            this.velocity.add(right);
            this.moving = true;
        }
        
        // Normalize velocity
        if (this.velocity.length() > 0) {
            this.velocity.normalize().multiplyScalar(this.speed);
        }
        
        // Weapon turn (Q/E - adjusts aim offset without moving body)
        const turnSpeed = 1.5 * delta;
        if (input.isDown(this.keys.turnMusketLeft)) {
            this.weaponYaw += turnSpeed;
        }
        if (input.isDown(this.keys.turnMusketRight)) {
            this.weaponYaw -= turnSpeed;
        }
        
        // Clamp weapon sway
        this.weaponYaw = Math.max(-0.3, Math.min(0.3, this.weaponYaw));
        
        // Aim toggle
        if (input.isPressed(this.keys.aim)) {
            this.aiming = !this.aiming;
        }
        
        // Fire
        if (input.isPressed(this.keys.fire)) {
            this.fire();
        }
        
        // Reload
        if (input.isPressed(this.keys.reload)) {
            this.weapon.startReload();
        }
    }
    
    updateMovement(delta) {
        // Apply velocity
        this.position.add(this.velocity.clone().multiplyScalar(delta));
        
        // Keep within bounds
        this.position.x = Math.max(-45, Math.min(45, this.position.x));
        this.position.z = Math.max(-45, Math.min(45, this.position.z));
    }
    
    fire() {
        const projectileData = this.weapon.fire();
        if (!projectileData) return;
        
        // Calculate firing direction based on weapon orientation
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation + this.weaponYaw);
        direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.weaponPitch);
        
        // Add slight randomness for smoothbore inaccuracy
        const inaccuracy = 0.015; // radians
        direction.x += (Math.random() - 0.5) * inaccuracy;
        direction.y += (Math.random() - 0.5) * inaccuracy;
        direction.normalize();
        
        const projectile = new Projectile(
            projectileData.position,
            direction,
            projectileData.velocity,
            projectileData.mass
        );
        
        this.projectiles.push(projectile);
        this.scene.add(projectile.mesh);
        
        // Recoil effect
        this.recoilOffset = 0.05;
    }
    
    updateProjectiles(delta) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(delta);
            
            if (!p.active) {
                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    checkHits() {
        // This is checked externally by the game manager
    }
    
    takeHit() {
        this.alive = false;
        this.respawnTimer = 3;
        
        // Clear projectiles
        for (const p of this.projectiles) {
            this.scene.remove(p.mesh);
        }
        this.projectiles = [];
    }
    
    respawn() {
        this.alive = true;
        this.weapon.state = 'IDLE';
        this.weapon.loaded = false;
        this.weapon.primed = false;
        
        // Random respawn position
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 20;
        this.position.x = Math.cos(angle) * dist;
        this.position.z = Math.sin(angle) * dist;
    }
    
    updateCamera() {
        // Aim transition
        const targetAim = this.aiming ? 1 : 0;
        this.aimTransition += (targetAim - this.aimTransition) * 0.1;
        
        // Recoil recovery
        this.recoilOffset *= 0.9;
        
        // Camera position
        this.camera.position.copy(this.position);
        
        // Camera rotation
        this.camera.rotation.set(0, 0, 0);
        this.camera.rotateY(this.rotation);
        this.camera.rotateX(this.weaponPitch - this.recoilOffset);
        this.camera.rotateY(this.weaponYaw);
    }
    
    updateWeaponPosition() {
        // Weapon follows camera with iron sight alignment
        const basePos = this.camera.position.clone();
        
        // Position weapon in view - always visible in front of camera
        // When aiming: align sights to center of screen
        // When not aiming: hold at ready position
        const hipOffset = new THREE.Vector3(0.25, -0.25, 0.6);
        const aimOffset = new THREE.Vector3(0, -0.12, 0.45);
        
        const currentOffset = new THREE.Vector3().lerpVectors(hipOffset, aimOffset, this.aimTransition);
        currentOffset.applyQuaternion(this.camera.quaternion);
        
        this.weapon.mesh.position.copy(basePos).add(currentOffset);
        this.weapon.mesh.quaternion.copy(this.camera.quaternion);
        
        // Adjust for sight picture when aiming
        if (this.aimTransition > 0.5) {
            // Fine-tune to align rear notch with front post at center of screen
            this.weapon.mesh.rotateX(-0.015);
            this.weapon.mesh.translateY(0.015);
        }
        
        // Apply weapon yaw rotation (Q/E turning)
        this.weapon.mesh.rotateY(this.weaponYaw);
    }
    
    checkProjectileHit(projectile) {
        if (!this.alive) return false;
        
        const dist = this.position.distanceTo(projectile.position);
        if (dist < this.radius && projectile.active) {
            this.takeHit();
            projectile.active = false;
            return true;
        }
        return false;
    }
}
