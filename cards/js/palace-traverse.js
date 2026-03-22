/**
 * RhodesCards Memory Palace — Connector Traversal
 * Animated movement along connectors: elevators, bridges, ladders, portals, stairs.
 */
(function() {
    'use strict';

    const PT = {
        active: false,
        connector: null,
        progress: 0,
        duration: 0,
        startPos: null,
        endPos: null,
        curve: null,

        startTraversal(connData) {
            if (this.active) return;
            const cam = RC.PalaceRenderer.camera;
            const camPos = RC.PalaceWalker.controls.getObject().position;
            const from = connData.from_point.position || [0,0,0];
            const to = connData.to_point.position || [0,0,0];

            // Determine which end is closer
            const distFrom = camPos.distanceTo(new THREE.Vector3(from[0], from[1] + 1.6, from[2]));
            const distTo = camPos.distanceTo(new THREE.Vector3(to[0], to[1] + 1.6, to[2]));

            if (distFrom < distTo) {
                this.startPos = new THREE.Vector3(from[0], from[1] + 1.6, from[2]);
                this.endPos = new THREE.Vector3(to[0], to[1] + 1.6, to[2]);
            } else {
                this.startPos = new THREE.Vector3(to[0], to[1] + 1.6, to[2]);
                this.endPos = new THREE.Vector3(from[0], from[1] + 1.6, from[2]);
            }

            this.connector = connData;
            this.progress = 0;
            this.active = true;

            // Duration based on connector type and speed
            const dist = this.startPos.distanceTo(this.endPos);
            const speed = connData.speed || 1.0;

            switch (connData.type) {
                case 'portal':
                    this.duration = 0.5 / speed; // Instant-ish
                    break;
                case 'elevator':
                    this.duration = (dist / 3.0) / speed;
                    break;
                case 'bridge':
                case 'road':
                    // Use spline path
                    if (connData.path_points && connData.path_points.length > 0) {
                        const pts = connData.path_points.map(p => new THREE.Vector3(p[0], p[1] + 1.6, p[2]));
                        pts.unshift(this.startPos.clone());
                        pts.push(this.endPos.clone());
                        this.curve = new THREE.CatmullRomCurve3(pts);
                    } else {
                        const mid = this.startPos.clone().lerp(this.endPos, 0.5);
                        mid.y += 2;
                        this.curve = new THREE.CatmullRomCurve3([
                            this.startPos.clone(), mid, this.endPos.clone()
                        ]);
                    }
                    this.duration = (dist / 4.0) / speed;
                    break;
                case 'ladder':
                    this.duration = (dist / 2.0) / speed;
                    break;
                default: // stairs
                    this.duration = (dist / 4.0) / speed;
                    break;
            }

            // Lock walker controls during traversal
            RC.PalaceWalker.velocity.set(0, 0, 0);
        },

        update(delta) {
            if (!this.active) return;

            this.progress += delta / this.duration;
            if (this.progress >= 1.0) {
                this.progress = 1.0;
                this.active = false;
            }

            const t = this._ease(this.progress);
            const camObj = RC.PalaceWalker.controls.getObject();

            if (this.curve) {
                // Follow spline
                const pt = this.curve.getPointAt(t);
                camObj.position.copy(pt);
                // Look along curve direction
                if (t < 0.99) {
                    const lookPt = this.curve.getPointAt(Math.min(t + 0.01, 1.0));
                    // Only adjust horizontal look, not vertical tilt
                }
            } else if (this.connector.type === 'portal') {
                // Warp effect — quick zoom and teleport
                if (t < 0.5) {
                    // Zoom in at source
                    RC.PalaceRenderer.camera.fov = 75 - t * 80;
                } else {
                    // Appear at destination
                    camObj.position.copy(this.endPos);
                    RC.PalaceRenderer.camera.fov = 75 - (1.0 - t) * 80;
                }
                RC.PalaceRenderer.camera.updateProjectionMatrix();
            } else if (this.connector.type === 'elevator') {
                // Straight vertical movement
                camObj.position.lerpVectors(this.startPos, this.endPos, t);
            } else if (this.connector.type === 'ladder') {
                // Climb — hug wall position, only Y changes
                camObj.position.lerpVectors(this.startPos, this.endPos, t);
                // Slight bob for climbing feel
                camObj.position.x += Math.sin(t * Math.PI * 8) * 0.02;
            } else {
                // Stairs — step-like interpolation
                camObj.position.lerpVectors(this.startPos, this.endPos, t);
                // Step bob
                const stepPhase = (t * 10) % 1;
                camObj.position.y += Math.sin(stepPhase * Math.PI) * 0.08;
            }

            // When done, restore walker control
            if (!this.active) {
                RC.PalaceWalker.canJump = true;
                RC.PalaceWalker.velocity.set(0, 0, 0);
                this.curve = null;
                RC.PalaceRenderer.camera.fov = 75;
                RC.PalaceRenderer.camera.updateProjectionMatrix();
            }
        },

        _ease(t) {
            // Smooth ease in-out
            return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        }
    };

    RC.PalaceTraverse = PT;
})();
