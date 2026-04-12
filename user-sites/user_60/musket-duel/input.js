// musket-duel/input.js
// Dual keyboard input for same-computer 2-player

const Input = {
  keys: {},
  
  // Player 1 key mappings
  P1: {
    FORWARD: 'KeyW',
    BACKWARD: 'KeyS',
    STRAFE_LEFT: 'KeyA',
    STRAFE_RIGHT: 'KeyD',
    TURN_LEFT: 'KeyQ',
    TURN_RIGHT: 'KeyE',
    IRON_SIGHTS: 'ShiftLeft',
    FIRE: 'Space'
  },
  
  // Player 2 key mappings
  P2: {
    FORWARD: 'ArrowUp',
    BACKWARD: 'ArrowDown',
    STRAFE_LEFT: 'ArrowLeft',
    STRAFE_RIGHT: 'ArrowRight',
    TURN_LEFT: 'Comma',
    TURN_RIGHT: 'Period',
    AIM_UP: 'Slash',
    IRON_SIGHTS: 'ControlRight',
    FIRE: 'Enter'
  },
  
  init() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      // Prevent default for game keys to stop scrolling
      if (Object.values(this.P1).includes(e.code) || 
          Object.values(this.P2).includes(e.code)) {
        e.preventDefault();
      }
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  },
  
  isPressed(code) {
    return !!this.keys[code];
  },
  
  // Get Player 1 input state
  getP1State() {
    return {
      forward: this.isPressed(this.P1.FORWARD),
      backward: this.isPressed(this.P1.BACKWARD),
      strafeLeft: this.isPressed(this.P1.STRAFE_LEFT),
      strafeRight: this.isPressed(this.P1.STRAFE_RIGHT),
      turnLeft: this.isPressed(this.P1.TURN_LEFT),
      turnRight: this.isPressed(this.P1.TURN_RIGHT),
      ironSights: this.isPressed(this.P1.IRON_SIGHTS),
      fire: this.isPressed(this.P1.FIRE)
    };
  },
  
  // Get Player 2 input state
  getP2State() {
    return {
      forward: this.isPressed(this.P2.FORWARD),
      backward: this.isPressed(this.P2.BACKWARD),
      strafeLeft: this.isPressed(this.P2.STRAFE_LEFT),
      strafeRight: this.isPressed(this.P2.STRAFE_RIGHT),
      turnLeft: this.isPressed(this.P2.TURN_LEFT),
      turnRight: this.isPressed(this.P2.TURN_RIGHT),
      aimUp: this.isPressed(this.P2.AIM_UP),
      ironSights: this.isPressed(this.P2.IRON_SIGHTS),
      fire: this.isPressed(this.P2.FIRE)
    };
  },
  
  // Check restart key
  restartPressed() {
    return this.isPressed('KeyR');
  }
};

Input.init();
