// Input management for two-player split-screen controls

export class InputManager {
    constructor(game) {
        this.game = game;
        
        // Player 1 controls (WASD + Mouse)
        this.player1 = {
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false,
            turnLeft: false,
            turnRight: false,
            fire: false,
            ironSight: false,
            reload: false,
            mouseX: 0,
            mouseY: 0,
            mouseDeltaX: 0,
            mouseDeltaY: 0
        };
        
        // Player 2 controls (Arrow Keys + Right Ctrl/Shift/Alt)
        this.player2 = {
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false,
            turnLeft: false,
            turnRight: false,
            fire: false,
            ironSight: false,
            reload: false
        };
        
        // Gamepad support
        this.gamepads = [];
        this.gamepadIndex = null;
        
        this.setupEventListeners();
        this.setupGamepadPolling();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse events
        const canvas = this.game.canvas;
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        
        // Lock pointer for better mouse control
        canvas.addEventListener('click', () => {
            if (document.pointerLockElement !== canvas) {
                canvas.requestPointerLock();
            }
        });
    }
    
    setupGamepadPolling() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
            this.gamepads[e.gamepad.index] = e.gamepad;
            this.gamepadIndex = e.gamepad.index;
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad disconnected:', e.gamepad.id);
            this.gamepads[e.gamepad.index] = null;
            this.gamepadIndex = null;
        });
        
        // Poll gamepad state every frame
        this.pollGamepads();
    }
    
    pollGamepads() {
        const gamepads = navigator.getGamepads();
        if (!gamepads) return;
        
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (!gamepad) continue;
            
            // Use first connected gamepad for Player 2
            if (i === 0) {
                this.updateGamepadControls(gamepad);
            }
        }
        
        // Continue polling
        requestAnimationFrame(() => this.pollGamepads());
    }
    
    updateGamepadControls(gamepad) {
        // Map gamepad buttons/axes to Player 2 controls
        // Left stick for movement
        const deadZone = 0.2;
        
        // Move forward/backward (Left stick Y)
        if (gamepad.axes[1] < -deadZone) {
            this.player2.moveForward = true;
            this.player2.moveBackward = false;
        } else if (gamepad.axes[1] > deadZone) {
            this.player2.moveForward = false;
            this.player2.moveBackward = true;
        } else {
            this.player2.moveForward = false;
            this.player2.moveBackward = false;
        }
        
        // Move left/right (Left stick X)
        if (gamepad.axes[0] < -deadZone) {
            this.player2.moveLeft = true;
            this.player2.moveRight = false;
        } else if (gamepad.axes[0] > deadZone) {
            this.player2.moveLeft = false;
            this.player2.moveRight = true;
        } else {
            this.player2.moveLeft = false;
            this.player2.moveRight = false;
        }
        
        // Turn left/right (Right stick X)
        if (gamepad.axes[2] < -deadZone) {
            this.player2.turnLeft = true;
            this.player2.turnRight = false;
        } else if (gamepad.axes[2] > deadZone) {
            this.player2.turnLeft = false;
            this.player2.turnRight = true;
        } else {
            this.player2.turnLeft = false;
            this.player2.turnRight = false;
        }
        
        // Fire (Right trigger or A button)
        this.player2.fire = gamepad.buttons[7].value > 0.5 || gamepad.buttons[0].pressed;
        
        // Iron sight (Left trigger or X button)
        this.player2.ironSight = gamepad.buttons[6].value > 0.5 || gamepad.buttons[2].pressed;
        
        // Reload (B button)
        this.player2.reload = gamepad.buttons[1].pressed;
    }
    
    handleKeyDown(e) {
        // Player 1 controls (WASD + R)
        switch (e.key.toLowerCase()) {
            case 'w':
                this.player1.moveForward = true;
                break;
            case 's':
                this.player1.moveBackward = true;
                break;
            case 'a':
                this.player1.moveLeft = true;
                break;
            case 'd':
                this.player1.moveRight = true;
                break;
            case 'r':
                this.player1.reload = true;
                break;
        }
        
        // Player 2 controls (Arrow Keys + Numpad 0)
        switch (e.key) {
            case 'ArrowUp':
                this.player2.moveForward = true;
                break;
            case 'ArrowDown':
                this.player2.moveBackward = true;
                break;
            case 'ArrowLeft':
                this.player2.moveLeft = true;
                break;
            case 'ArrowRight':
                this.player2.moveRight = true;
                break;
            case 'Shift':
                if (e.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
                    this.player2.fire = true;
                }
                break;
            case 'Control':
                if (e.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
                    this.player2.turnLeft = true;
                }
                break;
            case 'Alt':
                if (e.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
                    this.player2.ironSight = true;
                }
                break;
            case 'Insert': // Numpad 0 alternative
            case '0':
                if (e.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) {
                    this.player2.reload = true;
                }
                break;
        }
        
        // Prevent default for game keys
        if (['w', 'a', 's', 'd', 'r', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift', 'Control', 'Alt', 'Insert', '0'].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
    }
    
    handleKeyUp(e) {
        // Player 1 controls
        switch (e.key.toLowerCase()) {
            case 'w':
                this.player1.moveForward = false;
                break;
            case 's':
                this.player1.moveBackward = false;
                break;
            case 'a':
                this.player1.moveLeft = false;
                break;
            case 'd':
                this.player1.moveRight = false;
                break;
            case 'r':
                this.player1.reload = false;
                break;
        }
        
        // Player 2 controls
        switch (e.key) {
            case 'ArrowUp':
                this.player2.moveForward = false;
                break;
            case 'ArrowDown':
                this.player2.moveBackward = false;
                break;
            case 'ArrowLeft':
                this.player2.moveLeft = false;
                break;
            case 'ArrowRight':
                this.player2.moveRight = false;
                break;
            case 'Shift':
                if (e.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
                    this.player2.fire = false;
                }
                break;
            case 'Control':
                if (e.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
                    this.player2.turnLeft = false;
                }
                break;
            case 'Alt':
                if (e.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
                    this.player2.ironSight = false;
                }
                break;
            case 'Insert':
            case '0':
                if (e.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) {
                    this.player2.reload = false;
                }
                break;
        }
    }
    
    handleMouseDown(e) {
        const canvas = this.game.canvas;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        // Determine which half of the screen was clicked
        if (x < canvas.width / 2) {
            // Left half - Player 1
            if (e.button === 0) { // Left click
                this.player1.fire = true;
            } else if (e.button === 2) { // Right click
                this.player1.ironSight = true;
            }
        } else {
            // Right half - Player 2
            if (e.button === 0) { // Left click
                this.player2.fire = true;
            } else if (e.button === 2) { // Right click
                this.player2.ironSight = true;
            }
        }
    }
    
    handleMouseUp(e) {
        if (e.button === 0) { // Left click
            this.player1.fire = false;
            this.player2.fire = false;
        } else if (e.button === 2) { // Right click
            this.player1.ironSight = false;
            this.player2.ironSight = false;
        }
    }
    
    handleMouseMove(e) {
        const canvas = this.game.canvas;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Store mouse position
        this.player1.mouseX = x;
        this.player1.mouseY = y;
        
        // Calculate mouse delta for turning
        if (document.pointerLockElement === canvas) {
            this.player1.mouseDeltaX = e.movementX;
            this.player1.mouseDeltaY = e.movementY;
            
            // Use mouse movement for Player 1 turning
            const sensitivity = 0.002;
            this.player1.turnLeft = this.player1.mouseDeltaX < 0;
            this.player1.turnRight = this.player1.mouseDeltaX > 0;
            
            // Reset delta for next frame
            this.player1.mouseDeltaX = 0;
            this.player1.mouseDeltaY = 0;
        } else {
            // Use mouse position relative to screen half for Player 1 turning
            if (x < canvas.width / 2) {
                const relativeX = x / (canvas.width / 2);
                if (relativeX < 0.3) {
                    this.player1.turnLeft = true;
                    this.player1.turnRight = false;
                } else if (relativeX > 0.7) {
                    this.player1.turnLeft = false;
                    this.player1.turnRight = true;
                } else {
                    this.player1.turnLeft = false;
                    this.player1.turnRight = false;
                }
            }
        }
    }
    
    handleMouseLeave() {
        this.player1.turnLeft = false;
        this.player1.turnRight = false;
    }
    
    // Get input state for specific player
    getPlayerInput(playerNumber) {
        return playerNumber === 1 ? this.player1 : this.player2;
    }
}