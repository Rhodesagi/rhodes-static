class Bullet {
    constructor(scene, startPos, direction, velocity, playerId) {
        this.scene = scene;
        this.playerId = playerId;
        this.damage = 75;
        this.active = true;
        
        // Physics - realistic musket ball
        this.position = startPos.clone();
        this.lastPosition = startPos.clone();
        
        // Ballistic trajectory: v0 in direction
        this.velocity = direction.clone().multiplyScalar(velocity);
        
        // Musket ball properties (.69 caliber = ~17.5mm, ~30g lead ball)
        this.gravity = 9.81;
        this.dragCoefficient = 0.47; // Sphere
        this.crossSection = Math.PI * 0.0087 * 0.0087; // m^2
        this.airDensity = 1.225; // kg/m^3 at sea level
        this.mass = 0.03; // kg
        
        this.time = 0;
        this.maxLife = 3.0; // Seconds
        
        // Visual
        const geometry = new THREE.SphereGeometry(0.008, 6, 6);
        const material = new THREE.MeshBasicMaterial({ color: 0x222222 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        scene.add(this.mesh);
        
        // Trail positions for visualization
        this.trail = [];
        this.trailTimer = 0;
    }
    
    update(delta) {
        if (!this.active) return false;
        
        this.time += delta;
        if (this.time > this.maxLife) {
            this.destroy();
            return false;
        }
        
        // Store last position for continuous collision
        this.lastPosition.copy(this.position);
        
        // Calculate drag force: Fd = 0.5 * p * v^2 * Cd * A
        const speed = this.velocity.length();
        if (speed > 0) {
            const dragMagnitude = 0.5 * this.airDensity * speed * speed * this.dragCoefficient * this.crossSection;
            const dragForce = this.velocity.clone().normalize().multiplyScalar(-dragMagnitude);
            
            // a = F/m
            const acceleration = dragForce.divideScalar(this.mass);
            acceleration.y -= this.gravity; // Add gravity
            
            // Integrate: v = v0 + at
            this.velocity.add(acceleration.multiplyScalar(delta));
        } else {
            this.velocity.y -= this.gravity * delta;
        }
        
        // Integrate position: p = p0 + vt
        this.position.add(this.velocity.clone().multiplyScalar(delta));
        this.mesh.position.copy(this.position);
        
        // Rotate ball to face velocity
        if (speed > 1) {
            this.mesh.lookAt(this.position.clone().add(this.velocity));
        }
        
        // Ground collision
        if (this.position.y < 0) {
            this.destroy();
            return false;
        }
        
        // Trail
        this.trailTimer += delta;
        if (this.trailTimer > 0.03) {
            this.trail.push(this.position.clone());
            if (this.trail.length > 15) this.trail.shift();
            this.trailTimer = 0;
        }
        
        return true;
    }
    
    // Continuous collision detection using ray-segment test
    checkCollision(player) {
        if (!this.active || player.id === this.playerId || !player.alive) return false;
        
        const playerPos = player.position.clone();
        const hitRadius = 0.45;
        
        // Ray from last position to current position
        const rayOrigin = this.lastPosition.clone();
        const rayDir = this.position.clone().sub(this.lastPosition);
        const rayLength = rayDir.length();
        rayDir.normalize();
        
        // Sphere intersection test
        const toSphere = playerPos.clone().sub(rayOrigin);
        const projection = toSphere.dot(rayDir);
        
        if (projection < 0 || projection > rayLength) return false;
        
        const closestPoint = rayOrigin.clone().add(rayDir.multiplyScalar(projection));
        const distToCenter = closestPoint.distanceTo(playerPos);
        
        if (distToCenter < hitRadius) {
            this.active = false;
            this.destroy();
            return true;
        }
        
        return false;
    }
    
    checkWallCollision(walls) {
        if (!this.active) return false;
        
        // Ray from last position to current
        const rayOrigin = this.lastPosition.clone();
        const rayDir = this.position.clone().sub(this.lastPosition);
        const rayLength = rayDir.length();
        rayDir.normalize();
        
        for (const wall of walls) {
            const box = new THREE.Box3().setFromObject(wall);
            
            // Check if current position is inside box
            if (box.containsPoint(this.position)) {
                this.active = false;
                this.destroy();
                return true;
            }
            
            // Ray-box intersection
            if (this.rayIntersectsBox(rayOrigin, rayDir, rayLength, box)) {
                this.active = false;
                this.destroy();
                return true;
            }
        }
        return false;
    }
    
    rayIntersectsBox(origin, dir, maxDist, box) {
        let tmin = 0;
        let tmax = maxDist;
        
        for (let i = 0; i < 3; i++) {
            const invD = 1 / dir.getComponent(i);
            const t1 = (box.min.getComponent(i) - origin.getComponent(i)) * invD;
            const t2 = (box.max.getComponent(i) - origin.getComponent(i)) * invD;
            
            const tnear = Math.min(t1, t2);
            const tfar = Math.max(t1, t2);
            
            tmin = Math.max(tmin, tnear);
            tmax = Math.min(tmax, tfar);
            
            if (tmin > tmax) return false;
        }
        
        return tmin <= maxDist && tmin >= 0;
    }
    
    destroy() {
        this.active = false;
        this.scene.remove(this.mesh);
    }
}
