class Player {
    constructor(id, startPos, startRot) {
        this.id = id;
        this.position = startPos.clone();
        this.rotation = startRot;
        this.height = 1.6;
        this.radius = 0.3;
        this.speed = 3.5;
        
        this.camera = new THREE.PerspectiveCamera(75, 2, 0.1, 1000);
        this.camera.position.copy(this.position);
        this.camera.position.y = this.height;
        
        this.musket = new Musket();
        this.musketMesh = this.musket.createMesh();
        
        this.mesh = this.createPlayerMesh();
        
        this.alive = true;
        this.respawnTimer = 0;
        
        this.muzzleOffset = new THREE.Vector3(0, 0.05, -0.7);
    }
    
    createPlayerMesh() {
        const group = new THREE.Group();
        
        const bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.4, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: this.id === 1 ? 0x8b4513 : 0x2f4f4f 
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.7;
        group.add(body);
        
        const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.y = 1.55;
        group.add(head);
        
        const hatGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 8);
        const hatMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        const hat = new THREE.Mesh(hatGeo, hatMat);
        hat.position.y = 1.75;
        group.add(hat);
        
        const brimGeo = new THREE.ConeGeometry(0.5, 0.1, 3);
        const brim = new THREE.Mesh(brimGeo, hatMat);
        brim.position.y = 1.7;
        brim.rotation.y = Math.PI;
        brim.scale.z = 0.3;
        group.add(brim);
        
        const visibleMusket = this.musket.createMesh();
        visibleMusket.scale.set(0.8, 0.8, 0.8);
        visibleMusket.position.set(0.25, 1.0, 0.2);
        visibleMusket.rotation.z = -0.3;
        visibleMusket.rotation.x = -0.2;
        group.add(visibleMusket);
        
        this.visualMesh = group;
        return group;
    }
    
    update(deltaTime, inputState, otherPlayer) {
        if (!this.alive) {
            this.respawnTimer -= deltaTime;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }
        
        const moveSpeed = this.speed * deltaTime;
        const moveDir = new THREE.Vector3();
        
        if (inputState.moveForward) moveDir.z -= 1;
        if (inputState.moveBackward) moveDir.z += 1;
        if (inputState.moveLeft) moveDir.x -= 1;
        if (inputState.moveRight) moveDir.x += 1;
        
        if (moveDir.length() > 0) {
            moveDir.normalize();
            moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
            
            const newPos = this.position.clone().add(moveDir.multiplyScalar(moveSpeed));
            if (!this.checkCollision(newPos, otherPlayer)) {
                this.position.copy(newPos);
            }
        }
        
        this.camera.position.x = this.position.x;
        this.camera.position.z = this.position.z;
        this.camera.rotation.y = this.rotation + this.musket.musketAngle;
        
        this.musket.update(deltaTime, inputState);
        
        this.visualMesh.position.copy(this.position);
        this.visualMesh.rotation.y = this.rotation;
    }
    
    checkCollision(newPos, otherPlayer) {
        if (Math.abs(newPos.x) > 18 || Math.abs(newPos.z) > 18) {
            return true;
        }
        
        if (otherPlayer && otherPlayer.alive) {
            const dist = newPos.distanceTo(otherPlayer.position);
            if (dist < this.radius + otherPlayer.radius) {
                return true;
            }
        }
        
        return false;
    }
    
    getMuzzlePosition() {
        const offset = this.muzzleOffset.clone();
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation + this.musket.musketAngle);
        return this.position.clone().add(offset).add(new THREE.Vector3(0, this.height - 0.1, 0));
    }
    
    getAimDirection() {
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation + this.musket.musketAngle);
        dir.y = -0.02;
        dir.normalize();
        return dir;
    }
    
    takeDamage() {
        this.alive = false;
        this.respawnTimer = 3;
        this.visualMesh.visible = false;
    }
    
    respawn() {
        this.alive = true;
        this.visualMesh.visible = true;
        
        const angle = Math.random() * Math.PI * 2;
        const dist = 10 + Math.random() * 8;
        this.position.x = Math.cos(angle) * dist;
        this.position.z = Math.sin(angle) * dist;
        this.rotation = Math.atan2(-this.position.z, -this.position.x);
        
        this.musket.state = ReloadState.EMPTY;
        this.musket.loaded = false;
        this.musket.primed = false;
        this.musket.cocked = false;
    }
    
    addMusketToCamera(scene) {
        this.musketMesh.position.set(0.15, -0.3, -0.5);
        this.camera.add(this.musketMesh);
    }
}
