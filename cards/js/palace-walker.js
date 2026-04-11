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
            this.controls = new THREE.PointerLockControls(camera, domElement);

            // Click to lock pointer
            domElement.addEventListener('click', () => {
                if (RC.Palace.mode !== 'build') {
                    this.controls.lock();
                }
            });

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
            // Check connectors too (elevators, portals)
            const connHits = this.raycaster.intersectObjects(RC.PalaceRenderer.connectorMeshes, true);
            if (connHits.length > 0 && connHits[0].distance < 3) {
                let obj = connHits[0].object;
                while (obj && !obj.userData.dbId) obj = obj.parent;
                if (obj && obj.userData.dbType === 'connector') {
                    RC.PalaceTraverse.startTraversal(obj.userData.dbData);
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

            this.controls.moveRight(-this.velocity.x * delta);
            this.controls.moveForward(-this.velocity.z * delta);
            this.controls.getObject().position.y += this.velocity.y * delta;

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

        _checkLociProximity() {
            if (!RC.PalaceRenderer.lociMeshes.length) return;
            const pos = this.controls.getObject().position;
            RC.PalaceRenderer.lociMeshes.forEach(m => {
                const mPos = m.position || (m.children?.[0]?.parent?.position);
                if (!mPos) return;
                const dist = pos.distanceTo(mPos);
                // Highlight when close
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
