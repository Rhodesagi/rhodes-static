const Physics = {
    GRAVITY: 9.81,
    AIR_DENSITY: 1.225,
    BALL_DIAMETER: 0.019,
    BALL_MASS: 0.035,
    MUZZLE_VELOCITY: 270,
    DRAG_COEFFICIENT: 0.47,

    calculateTrajectory: function(startPos, direction, dt) {
        const ballRadius = this.BALL_DIAMETER / 2;
        const crossSectionalArea = Math.PI * ballRadius * ballRadius;
        const velocity = direction.clone().normalize().multiplyScalar(this.MUZZLE_VELOCITY);

        return {
            startPosition: startPos.clone(),
            initialVelocity: velocity,
            mass: this.BALL_MASS,
            dragCoeff: this.DRAG_COEFFICIENT,
            area: crossSectionalArea,

            getPositionAtTime: function(t) {
                const steps = Math.ceil(t / dt);
                let pos = this.startPosition.clone();
                let vel = this.initialVelocity.clone();

                for (let i = 0; i < steps; i++) {
                    const stepDt = Math.min(dt, t - i * dt);
                    const speed = vel.length();
                    const dragMagnitude = 0.5 * Physics.AIR_DENSITY * speed * speed *
                                         this.dragCoeff * this.area;
                    const dragForce = vel.clone().normalize().multiplyScalar(-dragMagnitude);
                    const gravityForce = new THREE.Vector3(0, -this.mass * Physics.GRAVITY, 0);
                    const netForce = dragForce.add(gravityForce);
                    const acceleration = netForce.divideScalar(this.mass);
                    vel.add(acceleration.multiplyScalar(stepDt));
                    pos.add(vel.clone().multiplyScalar(stepDt));
                }
                return pos;
            },

            checkCollision: function(scene, maxDistance) {
                maxDistance = maxDistance || 200;
                const steps = Math.ceil(maxDistance / 0.5);
                let prevPos = this.startPosition.clone();

                for (let i = 1; i <= steps; i++) {
                    const t = i * 0.5 / this.initialVelocity.length();
                    const currPos = this.getPositionAtTime(t);
                    const hit = this.raycastSegment(prevPos, currPos, scene);
                    if (hit) return hit;
                    prevPos = currPos;
                    if (currPos.y < -1) {
                        return { point: currPos, normal: new THREE.Vector3(0, 1, 0), object: null };
                    }
                }
                return null;
            },

            raycastSegment: function(start, end, scene) {
                const direction = end.clone().sub(start).normalize();
                const distance = start.distanceTo(end);
                const raycaster = new THREE.Raycaster(start, direction, 0, distance);
                const meshes = [];
                scene.traverse(obj => {
                    if (obj.isMesh && !obj.userData.isBullet && !obj.userData.isFlash) {
                        meshes.push(obj);
                    }
                });
                const intersects = raycaster.intersectObjects(meshes);
                if (intersects.length > 0) return intersects[0];
                return null;
            }
        };
    },

    calculateDrop: function(distance) {
        const time = distance / this.MUZZLE_VELOCITY;
        return 0.5 * this.GRAVITY * time * time;
    },

    getRangeData: function() {
        return {
            effective: 100,
            maximum: 300,
            accurate: 50,
            penetration: { wood: 0.15, flesh: 0.3 }
        };
    }
};
