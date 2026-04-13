/**
 * Input handling for 2-player local game
 * Player 1: WASD, Q (aim), E (reload), F (fire)
 * Player 2: Arrows, RShift (aim), Enter (reload), RCtrl (fire)
 */

const Input = {
    // Player 1 key states
    p1: {
        w: false, a: false, s: false, d: false,
        q: false, e: false, f: false,
        lookLeft: false, lookRight: false, lookUp: false, lookDown: false,
        mouseX: 0, mouseY: 0
    },
    
    // Player 2 key states  
    p2: {
        up: false, down: false, left: false, right: false,
        aim: false, reload: false, fire: false,
        lookLeft: false, lookRight: false, lookUp: false, lookDown: false,
        mouseX: 0, mouseY: 0
    },
    
    // Mouse state
    mouse: {
        x: 0, y: 0,
        lastX: 0, lastY: 0,
        deltaX: 0, deltaY: 0,
        locked: false,
        activePlayer: 1 // Which viewport has mouse focus
    },
    
    // Key press detection (single trigger)
    justPressed: {
        p1: { q: false, e: false, f: false },
        p2: { aim: false, reload: false, fire: false }
    },
    
    // Mouse look sensitivity
    sensitivity: 0.002,
    
    init() {
        this.setupKeyboard();
        this.setupMouse();
        this.setupTouch();
    },
    
    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
    },
    
    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        
        // Player 1 controls
        switch(key) {
            case 'w': this.p1.w = true; break;
            case 'a': this.p1.a = true; this.p1.lookLeft = true; break;
            case 's': this.p1.s = true; break;
            case 'd': this.p1.d = true; this.p1.lookRight = true; break;
            case 'q': 
                if (!this.p1.q) this.justPressed.p1.q = true;
                this.p1.q = true; 
                break;
            case 'e': 
                if (!this.p1.e) this.justPressed.p1.e = true;
                this.p1.e = true; 
                break;
            case 'f': 
                if (!this.p1.f) this.justPressed.p1.f = true;
                this.p1.f = true; 
                break;
        }
        
        // Player 2 controls
        switch(e.key) {
            case 'ArrowUp': this.p2.up = true; e.preventDefault(); break;
            case 'ArrowDown': this.p2.down = true; e.preventDefault(); break;
            case 'ArrowLeft': 
                this.p2.left = true; 
                this.p2.lookLeft = true;
                e.preventDefault(); 
                break;
            case 'ArrowRight': 
                this.p2.right = true; 
                this.p2.lookRight = true;
                e.preventDefault(); 
                break;
            case 'Shift': 
                if (e.location === 2) { // Right shift
                    if (!this.p2.aim) this.justPressed.p2.aim = true;
                    this.p2.aim = true;
                }
                break;
            case 'Enter': 
                if (!this.p2.reload) this.justPressed.p2.reload = true;
                this.p2.reload = true; 
                break;
            case 'Control': 
                if (e.location === 2) { // Right control
                    if (!this.p2.fire) this.justPressed.p2.fire = true;
                    this.p2.fire = true;
                }
                break;
        }
        
        // Numpad look for Player 2
        switch(key) {
            case '4': this.p2.lookLeft = true; break;
            case '6': this.p2.lookRight = true; break;
            case '8': this.p2.lookUp = true; break;
            case '2': this.p2.lookDown = true; break;
            case '5': 
                if (!this.p2.fire) this.justPressed.p2.fire = true;
                this.p2.fire = true;
                break;
            case '0':
                if (!this.p2.reload) this.justPressed.p2.reload = true;
                this.p2.reload = true;
                break;
            case '.':
                if (!this.p2.aim) this.justPressed.p2.aim = true;
                this.p2.aim = true;
                break;
        }
    },
    
    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        
        // Player 1
        switch(key) {
            case 'w': this.p1.w = false; break;
            case 'a': this.p1.a = false; this.p1.lookLeft = false; break;
            case 's': this.p1.s = false; break;
            case 'd': this.p1.d = false; this.p1.lookRight = false; break;
            case 'q': this.p1.q = false; this.justPressed.p1.q = false; break;
            case 'e': this.p1.e = false; this.justPressed.p1.e = false; break;
            case 'f': this.p1.f = false; this.justPressed.p1.f = false; break;
        }
        
        // Player 2
        switch(e.key) {
            case 'ArrowUp': this.p2.up = false; break;
            case 'ArrowDown': this.p2.down = false; break;
            case 'ArrowLeft': this.p2.left = false; this.p2.lookLeft = false; break;
            case 'ArrowRight': this.p2.right = false; this.p2.lookRight = false; break;
            case 'Shift': 
                if (e.location === 2) {
                    this.p2.aim = false;
                    this.justPressed.p2.aim = false;
                }
                break;
            case 'Enter': this.p2.reload = false; this.justPressed.p2.reload = false; break;
            case 'Control': 
                if (e.location === 2) {
                    this.p2.fire = false;
                    this.justPressed.p2.fire = false;
                }
                break;
        }
        
        // Numpad
        switch(key) {
            case '4': this.p2.lookLeft = false; break;
            case '6': this.p2.lookRight = false; break;
            case '8': this.p2.lookUp = false; break;
            case '2': this.p2.lookDown = false; break;
            case '5': this.p2.fire = false; this.justPressed.p2.fire = false; break;
            case '0': this.p2.reload = false; this.justPressed.p2.reload = false; break;
            case '.': this.p2.aim = false; this.justPressed.p2.aim = false; break;
        }
    },
    
    setupMouse() {
        document.addEventListener('mousemove', (e) => {
            if (this.mouse.locked) {
                this.mouse.deltaX += e.movementX;
                this.mouse.deltaY += e.movementY;
            } else {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            }
        });
        
        // Determine which player gets mouse input based on position
        document.addEventListener('mousedown', (e) => {
            if (this.mouse.locked) return;
            
            const halfWidth = window.innerWidth / 2;
            if (e.clientX < halfWidth) {
                this.mouse.activePlayer = 1;
            } else {
                this.mouse.activePlayer = 2;
            }
        });
    },
    
    setupTouch() {
        // Touch support for mobile (limited 2-player on mobile though)
        let touch1, touch2;
        
        document.addEventListener('touchstart', (e) => {
            for (let touch of e.changedTouches) {
                const halfWidth = window.innerWidth / 2;
                if (touch.clientX < halfWidth) {
                    touch1 = touch;
                    this.mouse.activePlayer = 1;
                } else {
                    touch2 = touch;
                    this.mouse.activePlayer = 2;
                }
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    },
    
    lockPointer() {
        const canvas = document.body;
        canvas.requestPointerLock = canvas.requestPointerLock || 
                                   canvas.mozRequestPointerLock ||
                                   canvas.webkitRequestPointerLock;
        if (canvas.requestPointerLock) {
            canvas.requestPointerLock();
            this.mouse.locked = true;
        }
    },
    
    unlockPointer() {
        document.exitPointerLock = document.exitPointerLock ||
                                   document.mozExitPointerLock ||
                                   document.webkitExitPointerLock;
        if (document.exitPointerLock) {
            document.exitPointerLock();
            this.mouse.locked = false;
        }
    },
    
    // Get mouse delta and reset
    getMouseDelta(player) {
        if (player === this.mouse.activePlayer && this.mouse.locked) {
            const dx = this.mouse.deltaX * this.sensitivity;
            const dy = this.mouse.deltaY * this.sensitivity;
            this.mouse.deltaX = 0;
            this.mouse.deltaY = 0;
            return { x: dx, y: dy };
        }
        return { x: 0, y: 0 };
    },
    
    // Check if key was just pressed (single trigger)
    isJustPressed(player, action) {
        const result = this.justPressed[player][action];
        this.justPressed[player][action] = false;
        return result;
    },
    
    // Get movement vector for player
    getMovementVector(player) {
        if (player === 1) {
            const x = (this.p1.d ? 1 : 0) - (this.p1.a ? 1 : 0);
            const z = (this.p1.s ? 1 : 0) - (this.p1.w ? 1 : 0);
            return { x, z };
        } else {
            const x = (this.p2.right ? 1 : 0) - (this.p2.left ? 1 : 0);
            const z = (this.p2.down ? 1 : 0) - (this.p2.up ? 1 : 0);
            return { x, z };
        }
    },
    
    // Get look input (keyboard or mouse)
    getLookInput(player) {
        if (player === 1) {
            // Keyboard look for player 1 as fallback
            let x = 0, y = 0;
            if (this.p1.lookLeft) x -= 1;
            if (this.p1.lookRight) x += 1;
            
            // Add mouse if active
            if (this.mouse.activePlayer === 1) {
                const mouseDelta = this.getMouseDelta(1);
                x += mouseDelta.x * 50; // Scale up to match keyboard speed
                y += mouseDelta.y * 50;
            }
            
            return { x, y };
        } else {
            // Keyboard look for player 2
            let x = 0, y = 0;
            if (this.p2.lookLeft) x -= 1;
            if (this.p2.lookRight) x += 1;
            if (this.p2.lookUp) y -= 1;
            if (this.p2.lookDown) y += 1;
            
            // Add mouse if active
            if (this.mouse.activePlayer === 2) {
                const mouseDelta = this.getMouseDelta(2);
                x += mouseDelta.x * 50;
                y += mouseDelta.y * 50;
            }
            
            return { x, y };
        }
    },
    
    // Update called each frame to handle continuous inputs
    update() {
        // Mouse delta accumulates, we need to apply it each frame
        // but the get functions reset it
    }
};