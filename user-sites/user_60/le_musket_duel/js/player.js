import * as THREE from 'three';
import { Musket } from './musket.js';

export class Player {
    constructor(id, startPosition, inputManager, keyMap, world, projectileManager, audioManager) {
        this.id = id;
        this.input = inputManager;
        this.keyMap = keyMap;
        this.world = world;
        this.projectiles = projectileManager;
        this.audio = audioManager;
        
        // Health
        this.maxHealth = 100;
        this.health = 100;
        this.isDead = false;
        
        // Movement settings
        this.moveSpeed = 4.0;
        this.sprintSpeed = 6.0;
        this.currentSpeed = this.moveSpeed;
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(60, 0.5, 0.1, 1000);
        this.camera.position.copy(startPosition);
        
        // Player body mesh (visible to opponent)
        this.createBodyMesh(startPosition);
        
        // State
        this.position = startPosition.clone();
        this.rotation = new THREE.Euler(0, id === 1 ? Math.PI / 2 : -Math.PI / 2, 0);
        
        // Initial camera rotation
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.rotation.y + Math.PI;
        this.camera.rotation.x = 0;
        this.camera.rotation.z = 0;
        this.velocity = new THREE.Vector3();
        
        // Lean
        this.leanAmount = 0;
        this.maxLean = 0.3;
        this.leanSpeed = 2.0;
        
        // Iron sights
        this.inIronSights = false;
        this.ironSightsTransition = 0;
        this.ironSightsSpeed = 4.0;
        
        // Normal and iron sights camera positions (relative to body)
        this.normalCameraHeight = 1.6;
        this.ironSightsOffset = new THREE.Vector3(0.15, -0.05, 0.25);
        
        // Create musket
        this.musket = new Musket(this.id, this.camera, this.world, this.projectiles, this.audio);
        
        // Input state tracking
        this.prevFirePressed = false;
        this.prevReloadPressed = false;
        
        // Head bob
        this.headBobTime = 0;
        this.headBobAmount = 0.03;
        
        // Respawn timer
        this.respawnTimer = 0;
        
        this.opponent = null;
    }
    
    createBodyMesh(position) {
        // Simple cylinder body
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.7, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: this.id === 1 ? 0x4a4a6a : 0x6a4a4a,
            roughness: 0.7
        });
        this.mesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.mesh.position.copy(position);
        this.mesh.position.y = 0.85;
        this.mesh.castShadow = true;
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xe0c0a0 });
        this.headMesh = new THREE.Mesh(headGeo, headMat);
        this.headMesh.position.y = 0.95;
        this.mesh.add(this.headMesh);
        
        this.world.scene.add(this.mesh);
    }
    
    setOpponent(opponent) {
        this.opponent = opponent;
    }
    
    update(deltaTime) {
        if (this.isDead) {
            this.respawnTimer -= deltaTime;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }
        
        this.handleInput(deltaTime);
        this.updateMovement(deltaTime);
        this.updateCamera(deltaTime);
        this.musket.update(deltaTime);
        
        // Update body mesh position
        this.mesh.position.x = this.position.x;
        this.mesh.position.z = this.position.z;
        this.mesh.rotation.y = this.rotation.y;
    }
    
    handleInput(deltaTime) {
        const input = this.getInput();
        
        // Movement vector
        const moveDir = new THREE.Vector3(0, 0, 0);
        
        if (input.moveForward) moveDir.z -= 1;
        if (input.moveBackward) moveDir.z += 1;
        if (input.moveLeft) moveDir.x -= 1;
        if (input.moveRight) moveDir.x += 1;
        
        // Normalize and rotate to camera direction
        if (moveDir.length() > 0) {
            moveDir.normalize();
            moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
            this.velocity.x = moveDir.x * this.currentSpeed;
            this.velocity.z = moveDir.z * this.currentSpeed;
            this.headBobTime += deltaTime * 10;
        } else {
            this.velocity.x *= 0.8;
            this.velocity.z *= 0.8;
            this.headBobTime = 0;
        }
        
        // Leaning
        const targetLean = (input.leanLeft ? -1 : 0) + (input.leanRight ? 1 : 0);
        this.leanAmount += (targetLean * this.maxLean - this.leanAmount) * this.leanSpeed * deltaTime;
        
        // Iron sights
        const targetIronSights = input.ironSights ? 1 : 0;
        this.ironSightsTransition += (targetIronSights - this.ironSightsTransition) * this.ironSightsSpeed * deltaTime;
        this.inIronSights = this.ironSightsTransition > 0.5;
        
        // Update musket iron sights
        this.musket.setIronSights(this.inIronSights);
        
        // Firing - detect rising edge
        if (input.fire && !this.prevFirePressed) {
            this.musket.fire();
        }
        this.prevFirePressed = input.fire;
        
        // Reload - detect rising edge
        if (input.reload && !this.prevReloadPressed) {
            this.musket.startReload();
        }
        this.prevReloadPressed = input.reload;
        
        // Look at opponent (auto-aim the body rotation toward enemy)
        if (this.opponent) {
            const dirToOpponent = new THREE.Vector3()
                .subVectors(this.opponent.position, this.position)
                .normalize();
            const targetAngle = Math.atan2(dirToOpponent.x, dirToOpponent.z) + Math.PI;
            
            // Smooth rotation toward opponent
            let angleDiff = targetAngle - this.rotation.y;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.rotation.y += angleDiff * 2.0 * deltaTime;
        }
    }
    
    getInput() {
        return {
            moveForward: this.input.isPressed(this.keyMap.forward),
            moveBackward: this.input.isPressed(this.keyMap.backward),
            moveLeft: this.input.isPressed(this.keyMap.left),
            moveRight: this.input.isPressed(this.keyMap.right),
            leanLeft: this.input.isPressed(this.keyMap.leanLeft),
            leanRight: this.input.isPressed(this.keyMap.leanRight),
            ironSights: this.input.isPressed(this.keyMap.ironSights),
            fire: this.input.isPressed(this.keyMap.fire),
            reload: this.input.isPressed(this.keyMap.reload)
        };
    }
    
    updateMovement(deltaTime) {
        // Apply velocity
        const newPos = this.position.clone();
        newPos.x += this.velocity.x * deltaTime;
        newPos.z += this.velocity.z * deltaTime;
        
        // Simple boundary check
        newPos.x = Math.max(-18, Math.min(18, newPos.x));
        newPos.z = Math.max(-18, Math.min(18, newPos.z));
        
        // Simple collision with walls
        for (const wall of this.world.walls || []) {
            const wallBox = new THREE.Box3().setFromObject(wall);
            const playerBox = new THREE.Box3(
                new THREE.Vector3(newPos.x - 0.3, 0, newPos.z - 0.3),
                new THREE.Vector3(newPos.x + 0.3, 1.7, newPos.z + 0.3)
            );
            
            if (wallBox.intersectsBox(playerBox)) {
                // Push out
                newPos.x = this.position.x;
                newPos.z = this.position.z;
            }
        }
        
        this.position.copy(newPos);
    }
    
    updateCamera(deltaTime) {
        // Base camera position
        const cameraPos = this.position.clone();
        cameraPos.y = this.normalCameraHeight;
        
        // Head bob when moving
        if (this.velocity.length() > 0.1) {
            cameraPos.y += Math.sin(this.headBobTime) * this.headBobAmount;
        }
        
        // Apply lean (move camera sideways and rotate)
        const leanOffset = new THREE.Vector3(this.leanAmount, 0, 0);
        leanOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
        cameraPos.add(leanOffset);
        
        // Iron sights transition
        if (this.ironSightsTransition > 0.01) {
            const sightOffset = this.ironSightsOffset.clone();
            sightOffset.multiplyScalar(this.ironSightsTransition);
            sightOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
            cameraPos.add(sightOffset);
        }
        
        this.camera.position.copy(cameraPos);
        
        // Camera rotation with lean
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.rotation.y + Math.PI;
        this.camera.rotation.x = 0;
        this.camera.rotation.z = -this.leanAmount * 0.5 * (this.inIronSights ? 0 : 1);
    }
    
    hideWeapon() {
        this.musket.hide();
    }
    
    showWeapon() {
        this.musket.show();
    }
    
    takeDamage(amount, hitPoint) {
        if (this.isDead) return;
        
        this.health -= amount;
        
        // Flash effect
        this.flashScreen();
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    flashScreen() {
        // Create flash element for this player's viewport
        const flashId = `hit-flash-p${this.id}`;
        let flash = document.getElementById(flashId);
        
        if (!flash) {
            flash = document.createElement('div');
            flash.id = flashId;
            flash.className = 'hit-flash' + (this.id === 2 ? ' right' : '');
            document.getElementById('ui-overlay').appendChild(flash);
        }
        
        flash.classList.add('active');
        setTimeout(() => flash.classList.remove('active'), 100);
    }
    
    die() {
        this.isDead = true;
        this.respawnTimer = 3;
        this.health = 0;
        console.log(`Player ${this.id} died!`);
    }
    
    respawn() {
        this.isDead = false;
        this.health = this.maxHealth;
        
        // Reset position
        if (this.id === 1) {
            this.position.set(-8, 1.6, 0);
        } else {
            this.position.set(8, 1.6, 0);
        }
        
        this.rotation.y = this.id === 1 ? Math.PI / 2 : -Math.PI / 2;
        this.velocity.set(0, 0, 0);
        
        // Reset musket
        this.musket.reset();
    }
    
    reset() {
        this.respawn();
    }
}