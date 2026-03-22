/**
 * PointerLockControls - adapted from Three.js r160 for global script usage.
 * Original: three/examples/jsm/controls/PointerLockControls.js
 */
(function() {
    const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
    const _vector = new THREE.Vector3();
    const _changeEvent = { type: 'change' };
    const _lockEvent = { type: 'lock' };
    const _unlockEvent = { type: 'unlock' };
    const _PI_2 = Math.PI / 2;

    class PointerLockControls extends THREE.EventDispatcher {
        constructor(camera, domElement) {
            super();
            this.camera = camera;
            this.domElement = domElement;
            this.isLocked = false;
            this.minPolarAngle = 0;
            this.maxPolarAngle = Math.PI;
            this.pointerSpeed = 1.0;
            this._onMouseMove = this._onMouseMove.bind(this);
            this._onPointerlockChange = this._onPointerlockChange.bind(this);
            this._onPointerlockError = this._onPointerlockError.bind(this);
            this.connect();
        }

        connect() {
            this.domElement.ownerDocument.addEventListener('mousemove', this._onMouseMove);
            this.domElement.ownerDocument.addEventListener('pointerlockchange', this._onPointerlockChange);
            this.domElement.ownerDocument.addEventListener('pointerlockerror', this._onPointerlockError);
        }

        disconnect() {
            this.domElement.ownerDocument.removeEventListener('mousemove', this._onMouseMove);
            this.domElement.ownerDocument.removeEventListener('pointerlockchange', this._onPointerlockChange);
            this.domElement.ownerDocument.removeEventListener('pointerlockerror', this._onPointerlockError);
        }

        dispose() {
            this.disconnect();
        }

        getObject() {
            return this.camera;
        }

        getDirection(v) {
            return v.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
        }

        moveForward(distance) {
            const camera = this.camera;
            _vector.setFromMatrixColumn(camera.matrix, 0);
            _vector.crossVectors(camera.up, _vector);
            camera.position.addScaledVector(_vector, distance);
        }

        moveRight(distance) {
            const camera = this.camera;
            _vector.setFromMatrixColumn(camera.matrix, 0);
            camera.position.addScaledVector(_vector, distance);
        }

        lock() {
            this.domElement.requestPointerLock();
        }

        unlock() {
            this.domElement.ownerDocument.exitPointerLock();
        }

        _onMouseMove(event) {
            if (!this.isLocked) return;
            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;
            _euler.setFromQuaternion(this.camera.quaternion);
            _euler.y -= movementX * 0.002 * this.pointerSpeed;
            _euler.x -= movementY * 0.002 * this.pointerSpeed;
            _euler.x = Math.max(_PI_2 - this.maxPolarAngle, Math.min(_PI_2 - this.minPolarAngle, _euler.x));
            this.camera.quaternion.setFromEuler(_euler);
            this.dispatchEvent(_changeEvent);
        }

        _onPointerlockChange() {
            if (this.domElement.ownerDocument.pointerLockElement === this.domElement) {
                this.dispatchEvent(_lockEvent);
                this.isLocked = true;
            } else {
                this.dispatchEvent(_unlockEvent);
                this.isLocked = false;
            }
        }

        _onPointerlockError() {
            console.error('PointerLockControls: Unable to use Pointer Lock API');
        }
    }

    THREE.PointerLockControls = PointerLockControls;
})();
