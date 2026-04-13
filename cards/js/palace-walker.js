/**
 * RhodesCards Memory Palace — First-person Walker
 * WASD movement, pointer lock, collision detection, gravity.
 */
(function() {
    'use strict';

    const PW = {
        controls: null,
        velocity: new THREE.Vector3(),
        direction: new THREE.Vector3(),
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        moveTurnLeft: false,
        moveTurnRight: false,
        turnSpeed: 2.5,
        canJump: true,
        playerHeight: 1.6,
        moveSpeed: 10.0,
        jumpForce: 6.0,
        gravity: -15.0,
        raycaster: new THREE.Raycaster(),
        _keyDown: null,
        _keyUp: null,
        _onLock: null,
        _onUnlock: null,

        init(camera, domElement) {
            this.camera = camera;
            // Force YXZ Euler order so rotation.y reads cleanly as yaw
            // regardless of mouselook pitch applied by PointerLockControls
            camera.rotation.order = 'YXZ';
            this.controls = new THREE.PointerLockControls(camera, domElement);

            // Click to lock pointer (desktop only — mobile uses virtual joystick)
            const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            if (!isMobileDevice) {
                domElement.addEventListener('click', () => {
                    if (RC.Palace.mode !== 'build') {
                        this.controls.lock();
                    }
                });
            }

            this._onLock = () => {
                document.getElementById('palace-crosshair').style.display = 'block';
                document.getElementById('palace-instructions').style.display = 'none';
            };
            this._onUnlock = () => {
                document.getElementById('palace-crosshair').style.display = 'none';
                if (RC.Palace.mode === 'walk') {
                    document.getElementById('palace-instructions').style.display = 'flex';
                }
            };
            this.controls.addEventListener('lock', this._onLock);
            this.controls.addEventListener('unlock', this._onUnlock);

            RC.PalaceRenderer.scene.add(this.controls.getObject());

            this._keyDown = (e) => this._onKeyDown(e);
            this._keyUp = (e) => this._onKeyUp(e);
            document.addEventListener('keydown', this._keyDown);
            document.addEventListener('keyup', this._keyUp);
        },

        _onKeyDown(e) {
            if (!this.controls) return;
            switch (e.code) {
                case 'KeyW': case 'ArrowUp':    this.moveForward = true; break;
                case 'KeyS': case 'ArrowDown':  this.moveBackward = true; break;
                case 'KeyA': case 'ArrowLeft':  this.moveLeft = true; break;
                case 'KeyD': case 'ArrowRight': this.moveRight = true; break;
                case 'KeyQ': this.moveTurnLeft = true; break;
                case 'KeyE': this.moveTurnRight = true; break;
                case 'Space':
                    if (this.canJump) {
                        this.velocity.y = this.jumpForce;
                        this.canJump = false;
                    }
                    break;
                case 'ShiftLeft': case 'ShiftRight':
                    this.moveSpeed = 20.0; // Sprint
                    break;
                case 'Escape':
                    this.controls.unlock();
                    break;
                case 'KeyF':
                    // Interact with nearest locus (moved from E to F; E is now turn-right)
                    this._interact();
                    break;
                case 'KeyB':
                    // Toggle build mode
                    RC.Palace.setMode(RC.Palace.mode === 'build' ? 'walk' : 'build');
                    break;
            }
        },

        _onKeyUp(e) {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp':    this.moveForward = false; break;
                case 'KeyS': case 'ArrowDown':  this.moveBackward = false; break;
                case 'KeyA': case 'ArrowLeft':  this.moveLeft = false; break;
                case 'KeyD': case 'ArrowRight': this.moveRight = false; break;
                case 'KeyQ': this.moveTurnLeft = false; break;
                case 'KeyE': this.moveTurnRight = false; break;
                case 'ShiftLeft': case 'ShiftRight':
                    this.moveSpeed = 10.0;
                    break;
            }
        },

        _interact() {
            // Raycast forward from camera to find loci
            this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
            const hits = this.raycaster.intersectObjects(RC.PalaceRenderer.lociMeshes, true);
            if (hits.length > 0 && hits[0].distance < 4) {
                let obj = hits[0].object;
                while (obj && !obj.userData.dbId) obj = obj.parent;
                if (obj && obj.userData.dbType === 'locus') {
                    RC.PalaceLoci.activateLocus(obj.userData.dbData);
                }
            }
            // Check connectors — raycast for portals, proximity for elevators
            const connHits = this.raycaster.intersectObjects(RC.PalaceRenderer.connectorMeshes, true);
            if (connHits.length > 0 && connHits[0].distance < 3) {
                let obj = connHits[0].object;
                while (obj && !obj.userData.dbId) obj = obj.parent;
                if (obj && obj.userData.dbType === 'connector') {
                    RC.PalaceTraverse.startTraversal(obj.userData.dbData);
                    return;
                }
            }
            // Proximity-based elevator/ladder check (transparent shafts are hard to aim at)
            const pos = this.controls.getObject().position;
            const ELEV_RANGE = 2.5;
            const seen = new Set(); // dedupe — multiple meshes share same connector
            for (const m of RC.PalaceRenderer.connectorMeshes) {
                const ct = m.userData.connectorType || (m.userData.dbData && m.userData.dbData.type);
                if (ct === 'elevator' || ct === 'ladder') {
                    const c = m.userData.dbData;
                    if (!c || seen.has(c.id)) continue;
                    seen.add(c.id);
                    // Check proximity to shaft center (uses elevatorX/Z from renderer or from_point)
                    const sx = m.userData.elevatorX != null ? m.userData.elevatorX :
                               ((c.from_point && c.from_point.position && c.from_point.position[0]) || 0);
                    const sz = m.userData.elevatorZ != null ? m.userData.elevatorZ :
                               ((c.from_point && c.from_point.position && c.from_point.position[2]) || 0);
                    if (Math.hypot(pos.x - sx, pos.z - sz) < ELEV_RANGE) {
                        RC.PalaceTraverse.startTraversal(c);
                        return;
                    }
                }
            }
        },

        update(delta) {
            if (!this.controls) return;

            // Apply Q/E keyboard yaw turn (works whether pointer is locked or not)
            if (this.moveTurnLeft)  this.controls.getObject().rotation.y += this.turnSpeed * delta;
            if (this.moveTurnRight) this.controls.getObject().rotation.y -= this.turnSpeed * delta;

            // Friction
            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;

            // Gravity
            this.velocity.y += this.gravity * delta;

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();

            if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * this.moveSpeed * delta * 10;
            if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * this.moveSpeed * delta * 10;

            // Save position before movement for wall collision rollback
            const prevPos = this.controls.getObject().position.clone();

            this.controls.moveRight(-this.velocity.x * delta);
            this.controls.moveForward(-this.velocity.z * delta);
            this.controls.getObject().position.y += this.velocity.y * delta;

            // Wall collision — cast horizontal rays and push back if too close
            this._checkWallCollision(prevPos);

            // Floor collision
            if (this.controls.getObject().position.y < this.playerHeight) {
                this.velocity.y = 0;
                this.controls.getObject().position.y = this.playerHeight;
                this.canJump = true;
            }

            // Surface collision (walk on elevated surfaces)
            this._checkSurfaceCollision();

            // Proximity highlight for loci
            this._checkLociProximity();
        },

        _checkSurfaceCollision() {
            // Cast ray down from slightly above eye to find the floor/step below us.
            // Allow step-up of up to 0.6m (normal stair riser) without jumping.
            const pos = this.controls.getObject().position;
            const rayOriginY = pos.y + 0.5;
            this.raycaster.set(new THREE.Vector3(pos.x, rayOriginY, pos.z), new THREE.Vector3(0, -1, 0));
            const hits = this.raycaster.intersectObjects(RC.PalaceRenderer.surfaceMeshes, true);
            if (hits.length === 0) return;
            const hitY = rayOriginY - hits[0].distance;           // absolute world-Y of the surface top
            const feetY = pos.y - this.playerHeight;               // where our feet currently are
            const dy = hitY - feetY;                               // + = surface is above feet (climb up), - = surface is below (drop down)
            if (dy > -0.1 && dy <= 0.65) {
                // Standing on, or short step up — snap to it
                pos.y = hitY + this.playerHeight;
                this.velocity.y = Math.max(0, this.velocity.y);
                this.canJump = true;
            }
        },

        _checkWallCollision(prevPos) {
            const pos = this.controls.getObject().position;
            const WALL_DIST = 0.45; // minimum distance from wall
            const RAY_Y = pos.y - 0.3; // chest height for ray origin
            // Only check wall-type surfaces (not floors/ceilings)
            const walls = RC.PalaceRenderer.surfaceMeshes.filter(m => {
                const s = m.userData.dbData;
                return s && s.type === 'wall';
            });
            if (walls.length === 0) return;

            // Cast 4 cardinal horizontal rays from the new position
            const dirs = [
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(-1, 0, 0),
                new THREE.Vector3(0, 0, 1),
                new THREE.Vector3(0, 0, -1),
            ];
            const origin = new THREE.Vector3(pos.x, RAY_Y, pos.z);
            for (const dir of dirs) {
                this.raycaster.set(origin, dir);
                this.raycaster.far = WALL_DIST;
                const hits = this.raycaster.intersectObjects(walls, true);
                if (hits.length > 0 && hits[0].distance < WALL_DIST) {
                    // Push back along this axis
                    const pushback = WALL_DIST - hits[0].distance;
                    pos.x -= dir.x * pushback;
                    pos.z -= dir.z * pushback;
                    // Kill velocity in the blocked direction
                    if (dir.x !== 0) this.velocity.x = 0;
                    if (dir.z !== 0) this.velocity.z = 0;
                    // Update origin for subsequent ray checks
                    origin.x = pos.x;
                    origin.z = pos.z;
                }
            }
            this.raycaster.far = Infinity; // reset
        },

        _checkLociProximity() {
            if (!RC.PalaceRenderer.lociMeshes.length) return;
            const pos = this.controls.getObject().position;
            RC.PalaceRenderer.lociMeshes.forEach(m => {
                const mPos = m.position || (m.children?.[0]?.parent?.position);
                if (!mPos) return;
                const dist = pos.distanceTo(mPos);
                if (dist < 3) {
                    if (m.material && m.material.emissiveIntensity !== undefined) {
                        m.material.emissiveIntensity = 2.5 + Math.sin(Date.now() * 0.005) * 0.5;
                    }
                } else {
                    if (m.material && m.material.emissiveIntensity !== undefined) {
                        m.material.emissiveIntensity = 1.5;
                    }
                }
            });
            // Proximity hints for elevators AND portal doors
            let hintText = '';
            const hintEl = document.getElementById('palace-elevator-hint');

            // Check elevator/connector proximity
            for (const m of RC.PalaceRenderer.connectorMeshes) {
                const ct = m.userData.connectorType || (m.userData.dbData && m.userData.dbData.type);
                if (ct === 'elevator' || ct === 'ladder') {
                    const c = m.userData.dbData;
                    if (!c) continue;
                    const sx = m.userData.elevatorX != null ? m.userData.elevatorX : 0;
                    const sz = m.userData.elevatorZ != null ? m.userData.elevatorZ : 0;
                    if (Math.hypot(pos.x - sx, pos.z - sz) < 3) {
                        hintText = 'Press <kbd>F</kbd> to use elevator';
                        break;
                    }
                }
            }

            // Check portal door loci proximity (marker_type === 'door')
            if (!hintText) {
                for (const m of RC.PalaceRenderer.lociMeshes) {
                    const d = m.userData.dbData;
                    if (!d || d.marker_type !== 'door') continue;
                    const mPos = m.position;
                    if (!mPos) continue;
                    const dist = pos.distanceTo(mPos);
                    if (dist < 4) {
                        const target = d.marker_settings && d.marker_settings.portal_target;
                        const label = d.label || (target ? 'Enter ' + target : 'Enter portal');
                        hintText = 'Press <kbd>F</kbd> — ' + label;
                        break;
                    }
                }
            }

            if (hintEl) {
                if (hintText) {
                    hintEl.innerHTML = hintText;
                    hintEl.style.display = 'block';
                } else {
                    hintEl.style.display = 'none';
                }
            }
        },

        lock() {
            if (this.controls) this.controls.lock();
        },

        unlock() {
            if (this.controls) this.controls.unlock();
        },

        dispose() {
            if (this._keyDown) document.removeEventListener('keydown', this._keyDown);
            if (this._keyUp) document.removeEventListener('keyup', this._keyUp);
            if (this.controls) {
                this.controls.removeEventListener('lock', this._onLock);
                this.controls.removeEventListener('unlock', this._onUnlock);
                this.controls.dispose();
            }
            this.controls = null;
        }
    };

    RC.PalaceWalker = PW;
})();
