/**
 * Ballistic Physics for .75 Caliber Musket Ball
 * Accurate muzzle velocity and trajectory calculation
 */

const Physics = {
    // Physical constants
    GRAVITY: 9.81,
    AIR_DENSITY: 1.225,

    // Brown Bess .75 cal ball properties
    BALL_DIAMETER: 0.019, // meters (0.75 inches)
    BALL_MASS: 0.035, // kg (545 grains)
    MUZZLE_VELOCITY: 270, // m/s (typical for smoothbore musket)

    // Drag coefficient for sphere
    DRAG_COEFFICIENT: 0.47,

    calculateTrajectory: function(startPos, direction, dt) {
        const ballRadius = this.BALL_DIAMETER / 2;
        const crossSectionalArea = Math.PI * ballRadius * ballRadius;

        // Initial velocity vector
        const velocity = direction.clone().normalize().multiplyScalar(this.MUZZLE_VELOCITY);

        return {
            startPosition: startPos.clone(),
            initialVelocity: velocity,
            mass: this.BALL_MASS,
            dragCoeff: this.DRAG_COEFFICIENT,
            area: crossSectionalArea,

            // Calculate position at time t
            getPositionAtTime: function(t) {
                // Numerical integration (simplified)
                const steps = Math.ceil(t / dt);
                let pos = this.startPosition.clone();
                let vel = this.initialVelocity.clone();

                for (let i = 0; i < steps; i++) {
                    const stepDt = Math.min(dt, t - i * dt);

                    // Drag force
                    const speed = vel.length();
                    const dragMagnitude = 0.5 * Physics.AIR_DENSITY * speed * speed *
                                         this.dragCoeff * this.area;
                    const dragForce = vel.clone().normalize().multiplyScalar(-dragMagnitude);

                    // Gravity force
                    const gravityForce = new THREE.Vector3(0, -this.mass * Physics.GRAVITY, 0);

                    // Net force
                    const netForce = dragForce.add(gravityForce);

                    // Acceleration
                    const acceleration = netForce.divideScalar(this.mass);

                    // Update velocity
                    vel.add(acceleration.multiplyScalar(stepDt));

                    // Update position
                    pos.add(vel.clone().multiplyScalar(stepDt));
                }

                return pos;
            },

            // Raycast for hit detection
            checkCollision: function(scene, maxDistance = 200) {
                const steps = Math.ceil(maxDistance / 0.5); // Check every 0.5m
                let prevPos = this.startPosition.clone();

                for (let i = 1; i <= steps; i++) {
                    const t = i * 0.5 / this.initialVelocity.length();
                    const currPos = this.getPositionAtTime(t);

                    // Check line segment for collision
                    const hit = this.raycastSegment(prevPos, currPos, scene);
                    if (hit) {
                        return hit;
                    }

                    prevPos = currPos;

                    // Stop if we hit ground
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

                // Collect all meshes in scene
                const meshes = [];
                scene.traverse(obj => {
                    if (obj.isMesh && !obj.userData.isBullet && !obj.userData.isFlash) {
                        meshes.push(obj);
                    }
                });

                const intersects = raycaster.intersectObjects(meshes);

                if (intersects.length > 0) {
                    return intersects[0];
                }

                return null;
            }
        };
    },

    // Calculate drop at given distance (for sight adjustment reference)
    calculateDrop: function(distance) {
        // Simplified: time of flight = distance / velocity
        const time = distance / this.MUZZLE_VELOCITY;
        // Drop = 0.5 * g * t^2
        return 0.5 * this.GRAVITY * time * time;
    },

    // Effective range data
    getRangeData: function() {
        return {
            effective: 100, // meters
            maximum: 300, // meters
            accurate: 50, // meters
            penetration: {
                wood: 0.15, // meters at 50m
                flesh: 0.3 // meters
            }
        };
    }
};