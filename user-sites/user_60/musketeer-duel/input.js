// Input handling for two players on same keyboard
// No mouse support - keyboard-only to avoid pointer lock conflicts

class InputManager {
    constructor() {
        this.keys = {};
        this.keysPressed = {}; // For single-trigger actions
        
        // Player 1 bindings (WASD + TFGH + QE)
        this.p1Bindings = {
            forward: 'KeyW',
            backward: 'KeyS',
            left: 'KeyA',
            right: 'KeyD',
            lookUp: 'KeyT',
            lookDown: 'KeyG',
            lookLeft: 'KeyF',
            lookRight: 'KeyH',
            fire: 'KeyQ',
            reload: 'KeyE'
        };
        
        // Player 2 bindings (Arrows + IJKL + OP)
        this.p2Bindings = {
            forward: 'ArrowUp',
            backward: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            lookUp: 'KeyI',
            lookDown: 'KeyK',
            lookLeft: 'KeyJ',
            lookRight: 'KeyL',
            fire: 'KeyO',
            reload: 'KeyP'
        };
        
        this.setupListeners();
    }
    
    setupListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (!this.keysPressed[e.code]) {
                this.keysPressed[e.code] = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keysPressed[e.code] = false;
        });
    }
    
    isDown(code) {
        return !!this.keys[code];
    }
    
    wasPressed(code) {
        if (this.keysPressed[code]) {
            this.keysPressed[code] = false; // Consume the press
            return true;
        }
        return false;
    }
    
    getPlayer1Input() {
        return {
            move: {
                x: (this.isDown(this.p1Bindings.right) ? 1 : 0) - (this.isDown(this.p1Bindings.left) ? 1 : 0),
                z: (this.isDown(this.p1Bindings.backward) ? 1 : 0) - (this.isDown(this.p1Bindings.forward) ? 1 : 0)
            },
            look: {
                x: (this.isDown(this.p1Bindings.lookRight) ? 1 : 0) - (this.isDown(this.p1Bindings.lookLeft) ? 1 : 0),
                y: (this.isDown(this.p1Bindings.lookDown) ? 1 : 0) - (this.isDown(this.p1Bindings.lookUp) ? 1 : 0)
            },
            fire: this.wasPressed(this.p1Bindings.fire),
            reload: this.wasPressed(this.p1Bindings.reload)
        };
    }
    
    getPlayer2Input() {
        return {
            move: {
                x: (this.isDown(this.p2Bindings.right) ? 1 : 0) - (this.isDown(this.p2Bindings.left) ? 1 : 0),
                z: (this.isDown(this.p2Bindings.backward) ? 1 : 0) - (this.isDown(this.p2Bindings.forward) ? 1 : 0)
            },
            look: {
                x: (this.isDown(this.p2Bindings.lookRight) ? 1 : 0) - (this.isDown(this.p2Bindings.lookLeft) ? 1 : 0),
                y: (this.isDown(this.p2Bindings.lookDown) ? 1 : 0) - (this.isDown(this.p2Bindings.lookUp) ? 1 : 0)
            },
            fire: this.wasPressed(this.p2Bindings.fire),
            reload: this.wasPressed(this.p2Bindings.reload)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputManager;
}