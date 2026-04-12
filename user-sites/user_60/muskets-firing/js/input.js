/**
 * InputManager - Handles keyboard input for both players
 * Distinct key mappings to avoid ghosting/conflicts
 */

class InputManager {
    constructor() {
        this.keys = {};
        this.p1Keys = {
            forward: 'KeyW',
            backward: 'KeyS',
            left: 'KeyA',
            right: 'KeyD',
            aim: 'KeyQ',
            fire: 'KeyE',
            reload: 'KeyR'
        };
        this.p2Keys = {
            forward: 'ArrowUp',
            backward: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            aim: 'KeyO',
            fire: 'KeyP',
            reload: 'BracketLeft'
        };
        
        this.p1Mouse = { x: 0, y: 0, active: false };
        this.p2Mouse = { x: 0, y: 0, active: false };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Pointer lock for mouse control
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement) {
                this.p1Mouse.active = true;
            } else {
                this.p1Mouse.active = false;
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.p1Mouse.active) {
                this.p1Mouse.x += e.movementX;
                this.p1Mouse.y += e.movementY;
            }
            // Player 2 uses alternative control (keyboard for look, or second mouse if available)
            // For simplicity, P2 uses keyboard for rotation in this implementation
        });
    }
    
    isPressed(keyCode) {
        return !!this.keys[keyCode];
    }
    
    getPlayer1Input() {
        return {
            moveForward: this.isPressed(this.p1Keys.forward),
            moveBackward: this.isPressed(this.p1Keys.backward),
            moveLeft: this.isPressed(this.p1Keys.left),
            moveRight: this.isPressed(this.p1Keys.right),
            aim: this.isPressed(this.p1Keys.aim),
            fire: this.isPressed(this.p1Keys.fire),
            reload: this.isPressed(this.p1Keys.reload),
            mouseDeltaX: this.p1Mouse.x,
            mouseDeltaY: this.p1Mouse.y
        };
    }
    
    getPlayer2Input() {
        return {
            moveForward: this.isPressed(this.p2Keys.forward),
            moveBackward: this.isPressed(this.p2Keys.backward),
            moveLeft: this.isPressed(this.p2Keys.left),
            moveRight: this.isPressed(this.p2Keys.right),
            aim: this.isPressed(this.p2Keys.aim),
            fire: this.isPressed(this.p2Keys.fire),
            reload: this.isPressed(this.p2Keys.reload),
            // P2 uses arrow keys for rotation too when not moving
            lookLeft: this.isPressed('ArrowLeft'),
            lookRight: this.isPressed('ArrowRight'),
            lookUp: this.isPressed('ArrowUp'),
            lookDown: this.isPressed('ArrowDown')
        };
    }
    
    resetMouseDelta() {
        this.p1Mouse.x = 0;
        this.p1Mouse.y = 0;
    }
    
    requestPointerLock(element) {
        if (element && element.requestPointerLock) {
            element.requestPointerLock();
        }
    }
}