export class InputManager {
    constructor() {
        this.keys = {};
        
        // Player 1 key mappings
        this.player1Keys = {
            forward: 'KeyW',
            backward: 'KeyS',
            left: 'KeyA',
            right: 'KeyD',
            leanLeft: 'KeyQ',
            leanRight: 'KeyE',
            ironSights: 'ShiftLeft',
            fire: 'KeyF',
            reload: 'KeyR'
        };
        
        // Player 2 key mappings
        this.player2Keys = {
            forward: 'ArrowUp',
            backward: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            leanLeft: 'KeyO',
            leanRight: 'KeyP',
            ironSights: 'Enter',
            fire: 'KeyL',
            reload: 'KeyK'
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Use window for key events to ensure capture
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.keys[e.key.toLowerCase()] = true;
            
            // Prevent default for game keys to avoid scrolling
            const gameKeys = [
                'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                'Space', 'ShiftLeft', 'ShiftRight', 'Enter',
                'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE',
                'KeyF', 'KeyR', 'KeyK', 'KeyL', 'KeyO', 'KeyP'
            ];
            if (gameKeys.includes(e.code)) {
                e.preventDefault();
            }
        }, true); // Capture phase
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keys[e.key.toLowerCase()] = false;
        }, true);
        
        // Handle visibility change to prevent stuck keys
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.keys = {};
            }
        });
    }
    
    update() {
        // Keys are updated via event listeners
    }
    
    isPressed(keyCode) {
        return this.keys[keyCode] === true;
    }
    
    wasJustPressed(keyCode) {
        // For single press detection, we'd need prev state
        // For now, this is handled per-frame in player code
        return this.keys[keyCode] === true;
    }
    
    getPlayerInput(playerKeys) {
        return {
            moveForward: this.isPressed(playerKeys.forward),
            moveBackward: this.isPressed(playerKeys.backward),
            moveLeft: this.isPressed(playerKeys.left),
            moveRight: this.isPressed(playerKeys.right),
            leanLeft: this.isPressed(playerKeys.leanLeft),
            leanRight: this.isPressed(playerKeys.leanRight),
            ironSights: this.isPressed(playerKeys.ironSights),
            fire: this.isPressed(playerKeys.fire),
            reload: this.isPressed(playerKeys.reload)
        };
    }
}