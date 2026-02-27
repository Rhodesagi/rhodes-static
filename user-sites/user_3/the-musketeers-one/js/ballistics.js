/**
 * Ballistics System - Projectile physics with gravity drop
 */

class BallisticProjectile {
    constructor(startPos, velocity, owner) {
        this.position = startPos.clone();
        this.velocity = velocity.clone();
        this.owner = owner;
        this.alive = true;
        this.time = 0;
        this.mass = 0.015;
        this.diameter = 0.019;
        this.dragCoeff = 0.47;
        this.mesh = this.createMesh();
    }
    
    createMesh() {
        const geometry = new THREE.SphereGeometry(0.008, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x444444 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(this.position);
        return mesh;
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        this.time += deltaTime;
        this.velocity.y -= 9.81 * deltaTime;
        const speed = this.velocity.length();
        const dragMagnitude = 0.5 * 1.225 * speed * speed * this.dragCoeff * (Math.PI * this.diameter * this.diameter / 4);
        const dragForce = this.velocity.clone().normalize().multiplyScalar(-dragMagnitude / this.mass * deltaTime * 0.01);
        this.velocity.add(dragForce);
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.mesh.position.copy(this.position);
        if (this.position.y <= 0) {
            this.alive = false;
        }
        if (this.time > 3.0) this.alive = false;
    }
}

class BallisticsManager {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
    }
    
    fire(startPos, direction, muzzleVelocity, owner) {
        const dispersion = 0.02;
        const dispX = (Math.random() - 0.5) * dispersion;
        const dispY = (Math.random() - 0.5) * dispersion;
        const dispersedDir = direction.clone();
        dispersedDir.x += dispX;
        dispersedDir.y += dispY;
        dispersedDir.normalize();
        const velocity = dispersedDir.multiplyScalar(muzzleVelocity);
        const projectile = new BallisticProjectile(startPos, velocity, owner);
        this.projectiles.push(projectile);
        this.scene.add(projectile.mesh);
        return projectile;
    }
    
    update(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(deltaTime);
            if (!proj.alive) {
                this.scene.remove(proj.mesh);
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    checkHits(players) {
        for (const proj of this.projectiles) {
            if (!proj.alive) continue;
            for (const player of players) {
                if (player === proj.owner) continue;
                const dist = proj.position.distanceTo(player.position);
                if (dist < 0.4) {
                    player.takeDamage(100);
                    proj.alive = false;
                    break;
                }
            }
        }
    }
}
