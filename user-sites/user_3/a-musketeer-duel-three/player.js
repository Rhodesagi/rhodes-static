import * as THREE from 'https://esm.sh/three@0.160.0';
import { Musket } from './musket.js';

export class Player {
    constructor(id, x, z, rotation, scene) {
        this.id = id;
        this.scene = scene;
        
        // Position and rotation
        this.position = new THREE.Vector3(x, 1.6, z);
        this.rotation = rotation;
        this.velocity = new THREE.Vector3();
        
        // Health
        this.health = 100;
        this.alive = true;
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.camera.position.copy(this.position);
        this.camera.rotation.y = rotation;
        
        // Musket
        this.musket = new Musket(scene);
        this.musketRotation = 0; // Vertical rotation (pitch)
        
        // State
        this.isAiming = false;
        this.moveSpeed = 4;
        this.turnSpeed = 2;
        this.musketTurnSpeed = 1.5;
        
        // Input state
        this.keys = {};
        this.setupInput();
        
        // Collision
        this.radius = 0.5;
        
        // Update HUD
        this.updateHUD();
    }
    
    setupInput() {
        const isP1 = this.id === 1;
        
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            
            if (isP1) {
                if (['w','a','s','d','q','e','r','x','f'].includes(key)) {
                    this.keys[key] = true;
                }
            } else {
                // P2 controls
                if (['arrowup','arrowdown','arrowleft','arrowright'].includes(key)) {
                    this.keys[key] = true;
                }
                if (key === ',') this.keys['comma'] = true;
                if (key === '.') this.keys['period'] = true;
                if (key === '/') this.keys['slash'] = true;
                if (key === 'enter') this.keys['enter'] = true;
                if (e.key === 'Shift' && e.location === 2) this.keys['rshift'] = true;
            }
            
            this.handleKeyDown(e);
        });
        
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            
            if (isP1) {
                if (['w','a','s','d','q','e','r','x','f'].includes(key)) {
                    this.keys[key] = false;
                }
            } else {
                if (['arrowup','arrowdown','arrowleft','arrowright'].includes(key)) {
                    this.keys[key] = false;
                }
                if (key === ',') this.keys['comma'] = false;
                if (key === '.') this.keys['period'] = false;
                if (key === '/') this.keys['slash'] = false;
                if (key === 'enter') this.keys['enter'] = false;
                if (e.key === 'Shift' && e.location === 2) this.keys['rshift'] = false;
            }
            
            this.handleKeyUp(e);
        });
    }
    
    handleKeyDown(e) {
        const isP1 = this.id === 1;
        const key = e.key.toLowerCase();
        
        // Fire
        if ((isP1 && key === 'f') || (!isP1 && e.key === 'Enter')) {
            if (!this.musket.isReloading && this.musket.loaded) {
                this.fire();
            }
        }
        
        // Aim toggle
        if ((isP1 && key === 'x') || (!isP1 && e.key === 'Shift' && e.location === 2)) {
            this.isAiming = !this.isAiming;
        }
        
        // Reload
        if ((isP1 && key === 'r') || (!isP1 && key === '/')) {
            if (!this.musket.isReloading && !this.musket.loaded) {
                this.musket.startReload();
            }
        }
    }
    
    handleKeyUp(e) {
        // Handle any key release logic if needed
    }
    
    fire() {
        // Calculate fire direction from musket barrel
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
        direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.musketRotation);
        
        // Get barrel position
        const barrelOffset = new THREE.Vector3(0.3, -0.1, -0.5);
        barrelOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
        const firePos = this.position.clone().add(barrelOffset);
        
        // Fire!
        window.game.ballistics.spawnProjectile(firePos, direction, this.id);
        
        this.musket.fire();
        this.updateHUD();
    }
    
    update(delta, otherPlayer) {
        if (!this.alive) return;
        
        this.handleMovement(delta, otherPlayer);
        this.handleMusketTurn(delta);
        this.updateCamera();
        this.musket.update(delta, this.position, this.rotation, this.musketRotation, this.isAiming);
        this.updateHUD();
    }
    
    handleMovement(delta, otherPlayer) {
        const isP1 = this.id === 1;
        
        // Forward/back
        let moveZ = 0;
        if (isP1) {
            if (this.keys['w']) moveZ -= 1;
            if (this.keys['s']) moveZ += 1;
        } else {
            if (this.keys['arrowup']) moveZ -= 1;
            if (this.keys['arrowdown']) moveZ += 1;
        }
        
        // Strafe
        let moveX = 0;
        if (isP1) {
            if (this.keys['a']) moveX -= 1;
            if (this.keys['d']) moveX += 1;
        } else {
            if (this.keys['arrowleft']) moveX -= 1;
            if (this.keys['arrowright']) moveX += 1;
        }
        
        // Turn body
        let turn = 0;
        if (isP1) {
            // No body turn keys for P1 - use strafe
        } else {
            // P2 uses left/right to turn, not strafe
            if (this.keys['arrowleft']) turn += 1;
            if (this.keys['arrowright']) turn -= 1;
            moveX = 0; // No strafe for P2
        }
        
        // Apply rotation
        this.rotation += turn * this.turnSpeed * delta;
        
        // Calculate movement vector
        if (moveX !== 0 || moveZ !== 0) {
            const moveVector = new THREE.Vector3(moveX, 0, moveZ).normalize();
            moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
            
            const newPos = this.position.clone().add(
                moveVector.multiplyScalar(this.moveSpeed * delta)
            );
            
            // Boundary check
            if (newPos.length() < 48) {
                // Collision check with other player
                const distToOther = newPos.distanceTo(otherPlayer.position);
                if (distToOther > 1.5) {
                    this.position.copy(newPos);
                }
            }
        }
    }
    
    handleMusketTurn(delta) {
        const isP1 = this.id === 1;
        let musketTurn = 0;
        
        if (isP1) {
            if (this.keys['q']) musketTurn += 1;
            if (this.keys['e']) musketTurn -= 1;
        } else {
            if (this.keys['comma']) musketTurn += 1;
            if (this.keys['period']) musketTurn -= 1;
        }
        
        this.musketRotation += musketTurn * this.musketTurnSpeed * delta;
        
        // Clamp musket rotation
        this.musketRotation = Math.max(-Math.PI / 3, Math.min(Math.PI / 6, this.musketRotation));
    }
    
    updateCamera() {
        this.camera.position.copy(this.position);
        
        // Apply body rotation
        const q = new THREE.Quaternion();
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
        this.camera.quaternion.copy(q);
        
        // Apply musket pitch
        const q2 = new THREE.Quaternion();
        q2.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.musketRotation);
        this.camera.quaternion.multiply(q2);
        
        // Iron sight positioning
        if (this.isAiming) {
            this.camera.fov = 30;
            // Slight offset to align with iron sights
            const offset = new THREE.Vector3(0, -0.05, 0.1);
            offset.applyQuaternion(this.camera.quaternion);
            this.camera.position.add(offset);
        } else {
            this.camera.fov = 75;
        }
        
        this.camera.updateProjectionMatrix();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
        }
        this.updateHUD();
    }
    
    updateHUD() {
        const statusEl = document.getElementById(`p${this.id}-status`);
        const reloadEl = document.getElementById(`p${this.id}-reload`);
        
        if (!statusEl || !reloadEl) return;
        
        if (this.musket.isReloading) {
            statusEl.textContent = 'Reloading...';
            statusEl.style.color = '#ff8800';
            reloadEl.textContent = this.musket.getReloadStageName();
            reloadEl.className = 'reload-stage active';
        } else if (this.musket.loaded) {
            statusEl.textContent = `Ready | Health: ${this.health}`;
            statusEl.style.color = this.health > 50 ? '#4aff4a' : '#ff4a4a';
            reloadEl.textContent = '';
            reloadEl.className = 'reload-stage';
        } else {
            statusEl.textContent = `Empty | Health: ${this.health}`;
            statusEl.style.color = '#ff4a4a';
            reloadEl.textContent = 'Press Reload';
            reloadEl.className = 'reload-stage';
        }
    }
}

// Expose game reference for projectiles
window.game = window.game || {};
