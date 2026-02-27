class InputHandler {
    constructor() {
        this.keys = {};
        this.keysPressed = {};
        
        this.p1 = {
            forward: 'KeyW',
            backward: 'KeyS',
            left: 'KeyA',
            right: 'KeyD',
            turnMusketLeft: 'KeyQ',
            turnMusketRight: 'KeyE',
            reload: 'KeyR',
            aim: 'KeyX',
            fire: 'KeyF'
        };
        
        this.p2 = {
            forward: 'KeyI',
            backward: 'KeyK',
            left: 'KeyJ',
            right: 'KeyL',
            turnMusketLeft: 'KeyU',
            turnMusketRight: 'KeyO',
            reload: 'KeyP',
            aim: 'KeyN',
            fire: 'KeyM'
        };
        
        this.setupListeners();
    }
    
    setupListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.keysPressed[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    isDown(code) {
        return !!this.keys[code];
    }
    
    wasPressed(code) {
        if (this.keysPressed[code]) {
            this.keysPressed[code] = false;
            return true;
        }
        return false;
    }
    
    getP1State() {
        return {
            moveForward: this.isDown(this.p1.forward),
            moveBackward: this.isDown(this.p1.backward),
            moveLeft: this.isDown(this.p1.left),
            moveRight: this.isDown(this.p1.right),
            turnMusketLeft: this.isDown(this.p1.turnMusketLeft),
            turnMusketRight: this.isDown(this.p1.turnMusketRight),
            reloadPressed: this.wasPressed(this.p1.reload),
            reloadHeld: this.isDown(this.p1.reload),
            aim: this.isDown(this.p1.aim),
            firePressed: this.wasPressed(this.p1.fire)
        };
    }
    
    getP2State() {
        return {
            moveForward: this.isDown(this.p2.forward),
            moveBackward: this.isDown(this.p2.backward),
            moveLeft: this.isDown(this.p2.left),
            moveRight: this.isDown(this.p2.right),
            turnMusketLeft: this.isDown(this.p2.turnMusketLeft),
            turnMusketRight: this.isDown(this.p2.turnMusketRight),
            reloadPressed: this.wasPressed(this.p2.reload),
            reloadHeld: this.isDown(this.p2.reload),
            aim: this.isDown(this.p2.aim),
            firePressed: this.wasPressed(this.p2.fire)
        };
    }
}

const input = new InputHandler();
