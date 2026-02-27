// Centralized input polling for competitive same-keyboard multiplayer
// Event listeners fail for simultaneous keypresses due to OS keyboard matrix limitations

export class InputManager {
    constructor() {
        this.keys = {};
        this.prevKeys = {};
        
        // Track key states
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    // Call this at start of each frame to capture previous state
    update() {
        this.prevKeys = { ...this.keys };
    }
    
    isDown(code) {
        return !!this.keys[code];
    }
    
    // True only on the frame key is first pressed
    isPressed(code) {
        return !!this.keys[code] && !this.prevKeys[code];
    }
    
    // True only on the frame key is released
    isReleased(code) {
        return !this.keys[code] && !!this.prevKeys[code];
    }
}

// Player key mappings
export const P1_KEYS = {
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

export const P2_KEYS = {
    forward: 'KeyI',
    backward: 'KeyK',
    left: 'KeyJ',
    right: 'KeyL',
    turnMusketLeft: 'Digit7',
    turnMusketRight: 'Digit9',
    reload: 'KeyU',
    aim: 'KeyO',
    fire: 'KeyP'
};
