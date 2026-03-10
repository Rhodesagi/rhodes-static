// Input Manager - Handles separate controls for both players
// Uses event.code for consistent key mapping across keyboard layouts

class InputManager {
    constructor() {
        // Key states for both players
        this.keys = {};
        this.keysPressedThisFrame = {};
        
        // Player 1 controls (Left side, WASD + Mouse)
        this.p1 = {
            forward: 'KeyW',
            backward: 'KeyS',
            left: 'KeyA',
            right: 'KeyD',
            reload: 'KeyR',
            fire: 'MouseLeft',
            aim: 'MouseRight',
            mouseX: 0,
            mouseY: 0,
            mouseDeltaX: 0,
            mouseDeltaY: 0
        };
        
        // Player 2 controls (Right side, IJKL + Arrow Keys / Numpad)
        this.p2 = {
            forward: 'KeyI',
            backward: 'KeyK',
            left: 'KeyJ',
            right: 'KeyL',
            reload: 'KeyP',
            fire: 'Numpad0',  // Numpad 0
            aim: 'ShiftRight', // Right Shift
            fireAlt: 'Enter',
            aimAlt: 'NumpadEnter',
            up: 'ArrowUp',
            down: 'ArrowDown',
            leftArrow: 'ArrowLeft',
            rightArrow: 'ArrowRight',
            mouseX: 0,
            mouseY: 0,
            mouseDeltaX: 0,
            mouseDeltaY: 0
        };
        
        this.pointerLocked = false;
        this.activePlayer = null; // Which player has mouse control
        
        this.setupListeners();
    }
    
    setupListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keysPressedThisFrame[e.code] = true;
            }
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            delete this.keysPressedThisFrame[e.code];
        });
        
        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            if (this.pointerLocked) {
                // Raw mouse deltas for FPS aiming
                if (this.activePlayer === 1) {
                    this.p1.mouseDeltaX = e.movementX;
                    this.p1.mouseDeltaY = e.movementY;
                } else if (this.activePlayer === 2) {
                    this.p2.mouseDeltaX = e.movementX;
                    this.p2.mouseDeltaY = e.movementY;
                }
            } else {
                // Track mouse position for menu/UI
                this.p1.mouseX = e.clientX;
                this.p1.mouseY = e.clientY;
            }
        });
        
        // Mouse buttons
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.keys['MouseLeft'] = true;
                this.keysPressedThisFrame['MouseLeft'] = true;
            }
            if (e.button === 2) {
                this.keys['MouseRight'] = true;
                this.keysPressedThisFrame['MouseRight'] = true;
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.keys['MouseLeft'] = false;
            if (e.button === 2) this.keys['MouseRight'] = false;
        });
        
        // Prevent context menu on right click
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Pointer lock change detection
        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = !!(document.pointerLockElement || 
                                    document.mozPointerLockElement ||
                                    document.webkitPointerLockElement);
            if (!this.pointerLocked) {
                this.activePlayer = null;
            }
        });
    }
    
    requestPointerLock(element, player) {
        this.activePlayer = player;
        element.requestPointerLock = element.requestPointerLock || 
                                     element.mozRequestPointerLock ||
                                     element.webkitRequestPointerLock;
        if (element.requestPointerLock) {
            element.requestPointerLock().catch(err => {
                console.log('Pointer lock failed:', err);
            });
        }
    }
    
    exitPointerLock() {
        document.exitPointerLock = document.exitPointerLock ||
                                   document.mozExitPointerLock ||
                                   document.webkitExitPointerLock;
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
        this.pointerLocked = false;
        this.activePlayer = null;
    }
    
    update() {
        // Reset mouse deltas each frame
        this.p1.mouseDeltaX = 0;
        this.p1.mouseDeltaY = 0;
        this.p2.mouseDeltaX = 0;
        this.p2.mouseDeltaY = 0;
        
        // Clear one-shot key presses
        this.keysPressedThisFrame = {};
    }
    
    // Get movement vector for a player
    getMovement(playerNum) {
        const p = playerNum === 1 ? this.p1 : this.p2;
        const move = { x: 0, z: 0 };
        
        if (this.keys[p.forward]) move.z -= 1;
        if (this.keys[p.backward]) move.z += 1;
        if (this.keys[p.left]) move.x -= 1;
        if (this.keys[p.right]) move.x += 1;
        
        // Normalize diagonal movement
        const len = Math.sqrt(move.x * move.x + move.z * move.z);
        if (len > 0) {
            move.x /= len;
            move.z /= len;
        }
        
        return move;
    }
    
    isMoving(playerNum) {
        const move = this.getMovement(playerNum);
        return move.x !== 0 || move.z !== 0;
    }
    
    isFiring(playerNum) {
        const p = playerNum === 1 ? this.p1 : this.p2;
        if (playerNum === 1) {
            // Mouse fire for P1
            return !!this.keys[p.fire];
        } else {
            // P2 can use Numpad0 or Enter
            return !!(this.keys[p.fire] || this.keys[p.fireAlt]);
        }
    }
    
    wasFiringPressed(playerNum) {
        const p = playerNum === 1 ? this.p1 : this.p2;
        if (playerNum === 1) {
            return !!this.keysPressedThisFrame[p.fire];
        } else {
            return !!(this.keysPressedThisFrame[p.fire] || this.keysPressedThisFrame[p.fireAlt]);
        }
    }
    
    isAiming(playerNum) {
        const p = playerNum === 1 ? this.p1 : this.p2;
        if (playerNum === 1) {
            // Right mouse hold for P1
            return !!this.keys[p.aim];
        } else {
            // Right Shift or NumpadEnter for P2
            return !!(this.keys[p.aim] || this.keys[p.aimAlt]);
        }
    }
    
    isReloading(playerNum) {
        const p = playerNum === 1 ? this.p1 : this.p2;
        // Use key pressed this frame for reload (one-shot)
        return !!this.keysPressedThisFrame[p.reload];
    }
    
    getMouseDelta(playerNum) {
        if (playerNum === 1) {
            return { x: this.p1.mouseDeltaX, y: this.p1.mouseDeltaY };
        } else {
            return { x: this.p2.mouseDeltaX, y: this.p2.mouseDeltaY };
        }
    }
    
    // For Player 2 arrow key aiming (alternative to mouse)
    getArrowKeyAim(playerNum) {
        if (playerNum !== 2) return { x: 0, y: 0 };
        
        const aim = { x: 0, y: 0 };
        if (this.keys[this.p2.up]) aim.y -= 1;
        if (this.keys[this.p2.down]) aim.y += 1;
        if (this.keys[this.p2.leftArrow]) aim.x -= 1;
        if (this.keys[this.p2.rightArrow]) aim.x += 1;
        
        return aim;
    }
    
    // Check if a specific key is pressed
    isKeyPressed(code) {
        return !!this.keys[code];
    }
    
    // Check if a specific key was just pressed this frame
    wasKeyPressed(code) {
        return !!this.keysPressedThisFrame[code];
    }
}
