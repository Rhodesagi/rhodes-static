export class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, dx: 0, dy: 0, down: false, justClicked: false };
        this.mousePlayer = 1; // Which player gets mouse control
        
        this.setupKeyboardHandler();
    }
    
    setupKeyboardHandler() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Prevent default for game keys
            if ([
                'KeyW', 'KeyA', 'KeyS', 'KeyD',
                'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                'KeyI', 'KeyJ', 'KeyK', 'KeyL',
                'ShiftRight', 'Enter'
            ].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    setupMouseHandler(canvas, playerId) {
        this.mousePlayer = playerId;
        
        canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            // Calculate delta since last frame
            if (this.lastMouseX !== undefined) {
                this.mouse.dx = e.movementX || (e.clientX - this.lastMouseX);
                this.mouse.dy = e.movementY || (e.clientY - this.lastMouseY);
            }
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.down = true;
                this.mouse.justClicked = true;
            }
        });
        
        canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.down = false;
            }
        });
        
        // Pointer lock for mouse player
        canvas.addEventListener('click', () => {
            if (document.pointerLockElement !== canvas) {
                canvas.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === canvas) {
                this.pointerLocked = true;
            } else {
                this.pointerLocked = false;
            }
        });
    }
    
    update() {
        // Reset one-frame events
        this.mouse.justClicked = false;
        this.mouse.dx = 0;
        this.mouse.dy = 0;
    }
    
    // Player 1 controls (Mouse + WASD)
    getP1Movement() {
        const forward = this.keys['KeyW'] ? 1 : (this.keys['KeyS'] ? -1 : 0);
        const strafe = this.keys['KeyD'] ? 1 : (this.keys['KeyA'] ? -1 : 0);
        return { forward, strafe };
    }
    
    getP1Look() {
        return { dx: this.mouse.dx, dy: this.mouse.dy };
    }
    
    getP1Fire() {
        return this.mouse.down;
    }
    
    getP1Aim() {
        return this.mouse.down; // Right click for aim? No, use click for fire, hold for aim
    }
    
    // Player 2 controls (Arrow keys + IJKL)
    getP2Movement() {
        const forward = this.keys['ArrowUp'] ? 1 : (this.keys['ArrowDown'] ? -1 : 0);
        const strafe = this.keys['ArrowRight'] ? 1 : (this.keys['ArrowLeft'] ? -1 : 0);
        return { forward, strafe };
    }
    
    getP2Look() {
        // IJKL for looking around
        let dx = 0, dy = 0;
        if (this.keys['KeyL']) dx += 1;
        if (this.keys['KeyJ']) dx -= 1;
        if (this.keys['KeyI']) dy -= 1;
        if (this.keys['KeyK']) dy += 1;
        
        // Sensitivity scaling
        const sensitivity = 5;
        return { dx: dx * sensitivity, dy: dy * sensitivity };
    }
    
    getP2Fire() {
        return this.keys['Enter'];
    }
    
    getP2Aim() {
        return this.keys['ShiftRight'];
    }
    
    getPlayerInput(playerId) {
        if (playerId === 1) {
            return {
                movement: this.getP1Movement(),
                look: this.getP1Look(),
                fire: this.getP1Fire(),
                aim: this.getP1Aim()
            };
        } else {
            return {
                movement: this.getP2Movement(),
                look: this.getP2Look(),
                fire: this.getP2Fire(),
                aim: this.getP2Aim()
            };
        }
    }
}
