// Dual-player input handler with anti-ghosting key spread
class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, dx: 0, dy: 0, locked: false };
        this.p2aim = { x: 0, y: 0 }; // P2 uses keys for aim
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Prevent default for game keys
            const gameKeys = ['KeyW','KeyA','KeyS','KeyD','Space','KeyQ','KeyR',
                              'KeyI','KeyJ','KeyK','KeyL','Enter','KeyU','Period',
                              'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
                              'ShiftRight','ShiftLeft'];
            if (gameKeys.includes(e.code)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse handling for P1
        document.addEventListener('mousemove', (e) => {
            if (this.mouse.locked) {
                this.mouse.dx += e.movementX;
                this.mouse.dy += e.movementY;
            }
        });
        
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.keys['MouseLeft'] = true;
        });
        
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.keys['MouseLeft'] = false;
        });
        
        // Pointer lock for P1 mouse aim
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('click', () => {
            if (!this.mouse.locked) {
                canvas.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.mouse.locked = document.pointerLockElement === canvas;
        });
    }
    
    // Player 1 input (WASD + Mouse)
    getP1Input() {
        return {
            forward: this.keys['KeyW'] || false,
            backward: this.keys['KeyS'] || false,
            left: this.keys['KeyA'] || false,
            right: this.keys['KeyD'] || false,
            sprint: this.keys['ShiftLeft'] || false,
            fire: this.keys['MouseLeft'] || false,
            reload: this.keys['KeyR'] || false,
            aim: this.keys['MouseLeft'] || false, // Hold to aim down sights
            mouseDX: this.mouse.dx,
            mouseDY: this.mouse.dy
        };
    }
    
    // Player 2 input (IJKL + Arrow Keys)
    getP2Input() {
        // Accumulate arrow key aim
        const aimSpeed = 2.0;
        if (this.keys['ArrowLeft']) this.p2aim.x -= aimSpeed;
        if (this.keys['ArrowRight']) this.p2aim.x += aimSpeed;
        if (this.keys['ArrowUp']) this.p2aim.y -= aimSpeed;
        if (this.keys['ArrowDown']) this.p2aim.y += aimSpeed;
        
        // Clamp aim
        this.p2aim.y = Math.max(-80, Math.min(80, this.p2aim.y));
        
        return {
            forward: this.keys['KeyI'] || false,
            backward: this.keys['KeyK'] || false,
            left: this.keys['KeyJ'] || false,
            right: this.keys['KeyL'] || false,
            sprint: this.keys['ShiftRight'] || false,
            fire: this.keys['Enter'] || false,
            reload: this.keys['Period'] || false,
            aim: this.keys['Enter'] || false,
            aimX: this.p2aim.x,
            aimY: this.p2aim.y
        };
    }
    
    resetMouseDelta() {
        this.mouse.dx = 0;
        this.mouse.dy = 0;
    }
}

// Gamepad support for Player 2
class GamepadManager {
    constructor() {
        this.gamepad = null;
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
            this.gamepad = e.gamepad;
        });
        window.addEventListener('gamepaddisconnected', (e) => {
            if (this.gamepad && this.gamepad.index === e.gamepad.index) {
                this.gamepad = null;
            }
        });
    }
    
    getInput() {
        if (!this.gamepad) {
            // Try to find a gamepad
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            for (let gp of gamepads) {
                if (gp) {
                    this.gamepad = gp;
                    break;
                }
            }
        }
        
        if (!this.gamepad) return null;
        
        // Poll current state
        const gp = navigator.getGamepads()[this.gamepad.index];
        if (!gp) return null;
        
        const deadzone = 0.15;
        let aimX = gp.axes[2] || gp.axes[0] || 0;
        let aimY = gp.axes[3] || gp.axes[1] || 0;
        
        if (Math.abs(aimX) < deadzone) aimX = 0;
        if (Math.abs(aimY) < deadzone) aimY = 0;
        
        return {
            aimX: aimX * 3, // Speed multiplier
            aimY: aimY * 3,
            fire: gp.buttons[0]?.pressed || gp.buttons[7]?.pressed || false,
            reload: gp.buttons[2]?.pressed || gp.buttons[3]?.pressed || false,
            forward: gp.buttons[12]?.pressed || (gp.axes[1] < -deadzone) || false,
            backward: gp.buttons[13]?.pressed || (gp.axes[1] > deadzone) || false,
            left: gp.buttons[14]?.pressed || (gp.axes[0] < -deadzone) || false,
            right: gp.buttons[15]?.pressed || (gp.axes[0] > deadzone) || false,
            sprint: gp.buttons[6]?.pressed || gp.buttons[10]?.pressed || false
        };
    }
}
