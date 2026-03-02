// Player class - handles movement and musket interaction

import { Musket } from './musket.js';

export class Player {
    constructor(camera, scene, playerNum) {
        this.camera = camera;
        this.scene = scene;
        this.playerNum = playerNum;
        
        // Movement
        this.position = camera.position.clone();
        this.yaw = 0;
        this.pitch = 0;
        this.velocity = new THREE.Vector3();
        this.speed = 5;
        this.grounded = true;
        
        // Musket
        this.musket = new Musket(scene, camera, playerNum);
        
        // Input mapping
        this.keyMap = this.getKeyMap();
        
        // Bullet pool
        this.bullets = [];
        this.bulletGeometry = new THREE.SphereGeometry(0.05);
        this.bulletMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        
        // Raycaster for hit detection
        this.raycaster = new THREE.Raycaster();
    }
    
    getKeyMap() {
        if (this.playerNum === 1) {
            return {
                forward: 'w',
                backward: 's',
                left: 'a',
                right: 'd',
                turnLeft: 'q',
                turnRight: 'e',
                reload: 'r',
                aim: 'x',
                fire: 'f'
            };
        } else {
            return {
                forward: 'arrowup',
                backward: 'arrowdown',
                left: 'arrowleft',
                right: 'arrowright',
                turnLeft: 'i',
                turnRight: 'k',
                reload: 'l',
                aim: 'm',
                fire: 'n'
            };
        }
    }
    
    update(keys, deltaTime) {
        // Movement
        this.handleMovement(keys, deltaTime);
        
        // Update musket
        this.musket.update(keys, deltaTime);
        
        // Handle firing
        if (keys[this.keyMap.fire] && !this.fireCooldown) {
            if (this.musket.fire()) {
                this.shootBullet();
                this.fireCooldown = true;
                setTimeout(() => { this.fireCooldown = false; }, 1000); // 1 sec cooldown
            }
        }
        
        // Update bullets
        this.updateBullets(deltaTime);
        
        // Update camera position
        this.camera.position.copy(this.position);
    }
    
    handleMovement(keys, deltaTime) {
        const moveVector = new THREE.Vector3();
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);
        
        // Apply movement based on camera orientation
        forward.applyQuaternion(this.camera.quaternion);
        right.applyQuaternion(this.camera.quaternion);
        forward.y = 0;
        right.y = 0;
        forward.normalize();
        right.normalize();
        
        if (keys[this.keyMap.forward]) {
            moveVector.add(forward);
        }
        if (keys[this.keyMap.backward]) {
            moveVector.sub(forward);
        }
        if (keys[this.keyMap.left]) {
            moveVector.sub(right);
        }
        if (keys[this.keyMap.right]) {
            moveVector.add(right);
        }
        
        // Normalize diagonal movement
        if (moveVector.length() > 0) {
            moveVector.normalize().multiplyScalar(this.speed * deltaTime);
            this.position.add(moveVector);
        }
        
        // Simple boundary
        this.position.x = THREE.MathUtils.clamp(this.position.x, -45, 45);
        this.position.z = THREE.MathUtils.clamp(this.position.z, -45, 45);
    }
    
    shootBullet() {
        const bullet = new THREE.Mesh(this.bulletGeometry, this.bulletMaterial);
        
        // Start at musket barrel end
        const barrelEnd = new THREE.Vector3(1.5, 0, 0);
        this.musket.group.localToWorld(barrelEnd);
        bullet.position.copy(barrelEnd);
        
        // Direction
        const direction = this.musket.getSightDirection();
        bullet.userData.velocity = direction.multiplyScalar(50);
        bullet.userData.player = this.playerNum;
        
        this.scene.add(bullet);
        this.bullets.push(bullet);
        
        // Remove after 3 seconds
        setTimeout(() => {
            const index = this.bullets.indexOf(bullet);
            if (index > -1) {
                this.scene.remove(bullet);
                this.bullets.splice(index, 1);
            }
        }, 3000);
    }
    
    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.position.add(bullet.userData.velocity.clone().multiplyScalar(deltaTime));
            
            // Simple collision with other player
            // In a real game, you'd check against all players
            // For now, just remove bullets that go too far
            if (bullet.position.length() > 100) {
                this.scene.remove(bullet);
                this.bullets.splice(i, 1);
            }
        }
    }
    
    takeDamage() {
        // Handle hit
        console.log(`Player ${this.playerNum} hit!`);
        // Could add health system
    }
}