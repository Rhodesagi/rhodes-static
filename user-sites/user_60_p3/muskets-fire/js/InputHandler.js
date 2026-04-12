class InputHandler {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, dx: 0, dy: 0, locked: false };
        this.player2Mouse = { x: 0, y: 0, dx: 0, dy: 0 };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement) {
                this.mouse.dx += e.movementX;
                this.mouse.dy += e.movementY;
            }
        });
    }
    
    // Player 1 controls
    isP1Forward() { return this.keys['KeyW']; }
    isP1Backward() { return this.keys['KeyS']; }
    isP1Left() { return this.keys['KeyA']; }
    isP1Right() { return this.keys['KeyD']; }
    isP1IronSights() { return this.keys['KeyQ']; }
    isP1Fire() { return this.keys['KeyF']; }
    isP1Reload() { return this.keys['KeyR']; }
    
    getP1MouseDelta() {
        const dx = this.mouse.dx;
        const dy = this.mouse.dy;
        this.mouse.dx = 0;
        this.mouse.dy = 0;
        return { x: dx, y: dy };
    }
    
    // Player 2 controls - IJKL movement, arrows for aim adjustment
    isP2Forward() { return this.keys['KeyI']; }
    isP2Backward() { return this.keys['KeyK']; }
    isP2Left() { return this.keys['KeyJ']; }
    isP2Right() { return this.keys['KeyL']; }
    isP2IronSights() { return this.keys['KeyO']; }
    isP2Fire() { return this.keys['Semicolon']; }
    isP2Reload() { return this.keys['KeyP']; }
    
    // Arrow keys for Player 2 aiming
    getP2AimDelta() {
        let dx = 0, dy = 0;
        if (this.keys['ArrowLeft']) dx -= 3;
        if (this.keys['ArrowRight']) dx += 3;
        if (this.keys['ArrowUp']) dy -= 3;
        if (this.keys['ArrowDown']) dy += 3;
        return { x: dx, y: dy };
    }
    
    reset() {
        this.keys = {};
        this.mouse.dx = 0;
        this.mouse.dy = 0;
    }
}
