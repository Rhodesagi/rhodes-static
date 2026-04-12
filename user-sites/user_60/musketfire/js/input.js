// MUSKETFIRE - Dual player input handling
// P1: WASD + Mouse
// P2: Arrow Keys + Numpad

class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, deltaX: 0, deltaY: 0, locked: false };
        
        // P2 numpad aim state
        this.p2Aim = { x: 0, y: 0 }; // Normalized -1 to 1
        this.p2AimSpeed = 2.0; // Mouse sensitivity equivalent
        
        this.setupListeners();
    }

    setupListeners() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Prevent default for game keys
            if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
                 'Numpad8','Numpad4','Numpad6','Numpad2','Numpad0','NumpadEnter',
                 'Enter','Space'].includes(e.code)) {
                e.preventDefault();
            }
            
            // P2 numpad aiming
            this.handleP2AimKeys(e.code, true);
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.handleP2AimKeys(e.code, false);
        });

        // Mouse for P1
        document.addEventListener('mousemove', (e) => {
            if (this.mouse.locked) {
                this.mouse.deltaX += e.movementX;
                this.mouse.deltaY += e.movementY;
            }
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        // Pointer lock for P1 mouse
        const canvas = document.getElementById('gameCanvas');
        document.addEventListener('pointerlockchange', () => {
            this.mouse.locked = document.pointerLockElement === canvas;
        });

        // Click to request pointer lock
        canvas.addEventListener('click', () => {
            if (!this.mouse.locked && game && game.started) {
                canvas.requestPointerLock();
            }
        });
    }

    handleP2AimKeys(code, pressed) {
        // Numpad 8/4/6/2 for aim
        const aimSpeed = pressed ? 1 : 0;
        
        switch(code) {
            case 'Numpad8': // Up
            case 'ArrowUp': // Also allow arrows for aim if numpad not available
                this.p2Aim.y = -aimSpeed;
                break;
            case 'Numpad2': // Down
            case 'ArrowDown':
                this.p2Aim.y = aimSpeed;
                break;
            case 'Numpad4': // Left
            case 'ArrowLeft':
                this.p2Aim.x = -aimSpeed;
                break;
            case 'Numpad6': // Right
            case 'ArrowRight':
                this.p2Aim.x = aimSpeed;
                break;
        }
    }

    // P1: WASD
    getP1Movement() {
        const move = { x: 0, z: 0 };
        if (this.keys['KeyW']) move.z -= 1;
        if (this.keys['KeyS']) move.z += 1;
        if (this.keys['KeyA']) move.x -= 1;
        if (this.keys['KeyD']) move.x += 1;
        
        // Normalize
        const len = Math.sqrt(move.x * move.x + move.z * move.z);
        if (len > 0) {
            move.x /= len;
            move.z /= len;
        }
        return move;
    }

    // P2: Arrow keys
    getP2Movement() {
        const move = { x: 0, z: 0 };
        if (this.keys['ArrowUp']) move.z -= 1;
        if (this.keys['ArrowDown']) move.z += 1;
        if (this.keys['ArrowLeft']) move.x -= 1;
        if (this.keys['ArrowRight']) move.x += 1;
        
        const len = Math.sqrt(move.x * move.x + move.z * move.z);
        if (len > 0) {
            move.x /= len;
            move.z /= len;
        }
        return move;
    }

    // P1 mouse delta
    getP1MouseDelta() {
        const delta = { x: this.mouse.deltaX, y: this.mouse.deltaY };
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        return delta;
    }

    // P2 keyboard aim (returns delta)
    getP2MouseDelta(dt) {
        // Convert held keys to continuous delta
        const delta = { 
            x: this.p2Aim.x * this.p2AimSpeed * dt * 100, 
            y: this.p2Aim.y * this.p2AimSpeed * dt * 100 
        };
        return delta;
    }

    // P1 fire (mouse left)
    isP1FirePressed() {
        // Check for mouse button via click tracking
        return this.keys['MouseLeft'] || false;
    }

    setP1FirePressed(pressed) {
        this.keys['MouseLeft'] = pressed;
    }

    // P2 fire (numpad 0)
    isP2FirePressed() {
        return this.keys['Numpad0'] || this.keys['Space'] || false;
    }

    // P1 aim down sights (right click)
    isP1AimPressed() {
        return this.keys['MouseRight'] || false;
    }

    setP1AimPressed(pressed) {
        this.keys['MouseRight'] = pressed;
    }

    // P2 aim down sights (numpad enter)
    isP2AimPressed() {
        return this.keys['NumpadEnter'] || this.keys['Enter'] || false;
    }

    // Mouse button tracking
    setupMouseButtonTracking() {
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.keys['MouseLeft'] = true;
            if (e.button === 2) this.keys['MouseRight'] = true;
        });
        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.keys['MouseLeft'] = false;
            if (e.button === 2) this.keys['MouseRight'] = false;
        });
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
}

// Track mouse buttons
const input = new InputManager();
document.addEventListener('DOMContentLoaded', () => {
    input.setupMouseButtonTracking();
});
