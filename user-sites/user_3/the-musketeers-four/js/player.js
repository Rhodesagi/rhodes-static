/**
 * Player.js - Player controller with input handling
 * Supports two players on same keyboard with separate control zones
 */

class Player {
    constructor(id, camera, scene, controls) {
        this.id = id;
        this.camera = camera;
        this.scene = scene;
        this.controls = controls;
        
        // Movement
        this.position = controls.startPos.clone();
        this.velocity = new THREE.Vector3();
        this.speed = 3.5; // m/s
        this.rotationSpeed = 2.0;
        
        // Looking
        this.yaw = controls.startYaw;
        this.pitch = 0;
        
        // Health
        this.alive = true;
        this.health = 100;
        
        // Musket
        this.musket = new Musket(scene, camera);
        
        // Input state
        this.keys = {};
        
        // Update camera initial position
        this.updateCamera();
    }
    
    updateCamera() {
        this.camera.position.copy(this.position);
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
    }
    
    handleKeyDown(key) {
        this.keys[key.toLowerCase()] = true;
        
        // Action keys (on press, not hold)
        if (key === this.controls.aim) {
            return { action: 'aim', value: this.musket.toggleAim() };
        }
        if (key === this.controls.fire) {
            const shot = this.musket.fire();
            if (shot) {
                return { action: 'fire', shot: shot };
            }
        }
        if (key === this.controls.reload) {
            const started = this.musket.startReload();
            if (started) {
                return { action: 'reload' };
            }
        }
        if (key === this.controls.sightUp) {
            this.musket.adjustSight(0.02);
            return { action: 'sightUp' };
        }
        if (key === this.controls.sightDown) {
            this.musket.adjustSight(-0.02);
            return { action: 'sightDown' };
        }
        
        return null;
    }
    
    handleKeyUp(key) {
        this.keys[key.toLowerCase()] = false;
    }
    
    update(deltaTime, otherPlayer) {
        if (!this.alive) return;
        
        // Movement
        const moveDir = new THREE.Vector3();
        
        if (this.keys[this.controls.forward]) moveDir.z -= 1;
        if (this.keys[this.controls.backward]) moveDir.z += 1;
        if (this.keys[this.controls.left]) moveDir.x -= 1;
        if (this.keys[this.controls.right]) moveDir.x += 1;
        
        if (moveDir.length() > 0) {
            moveDir.normalize();
            
            // Apply rotation to movement
            moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
            
            // Cannot move while aiming (historical accuracy)
            if (!this.musket.aiming) {
                this.position.add(moveDir.multiplyScalar(this.speed * deltaTime));
            }
        }
        
        // Mouse look (handled by pointer lock)
        
        // Update musket reload
        this.musket.updateReload(deltaTime);
        
        // Boundary check
        this.position.x = Math.max(-19, Math.min(19, this.position.x));
        this.position.z = Math.max(-19, Math.min(19, this.position.z));
        
        this.updateCamera();
    }
    
    handleMouseMove(movementX, movementY, sensitivity = 0.002) {
        if (!this.alive) return;
        
        this.yaw -= movementX * sensitivity;
        this.pitch -= movementY * sensitivity;
        
        // Clamp pitch
        this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
        
        this.updateCamera();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
            this.die();
        }
    }
    
    die() {
        this.alive = false;
        // Death animation - camera falls
        this.camera.position.y = 0.5;
        this.camera.rotation.z = Math.PI / 2;
    }
    
    respawn(position, yaw) {
        this.alive = true;
        this.health = 100;
        this.position.copy(position);
        this.yaw = yaw;
        this.pitch = 0;
        this.velocity.set(0, 0, 0);
        this.camera.rotation.z = 0;
        this.musket = new Musket(this.scene, this.camera);
        this.updateCamera();
    }
    
    getHUDState() {
        const musketState = this.musket.getState();
        return {
            state: musketState.state,
            loaded: musketState.loaded,
            aiming: musketState.aiming,
            health: this.health,
            alive: this.alive
        };
    }
}

// Control schemes for both players
const PLAYER_CONTROLS = {
    p1: {
        forward: 'w',
        backward: 's',
        left: 'a',
        right: 'd',
        aim: 'x',
        fire: 'f',
        reload: 'r',
        sightUp: 'q',
        sightDown: 'e',
        startPos: new THREE.Vector3(-10, 1.7, 0),
        startYaw: Math.PI / 2
    },
    p2: {
        forward: 'arrowup',
        backward: 'arrowdown',
        left: 'arrowleft',
        right: 'arrowright',
        aim: 'enter',
        fire: '\\',
        reload: 'backspace',
        sightUp: 'delete',
        sightDown: 'pagedown',
        startPos: new THREE.Vector3(10, 1.7, 0),
        startYaw: -Math.PI / 2
    }
};