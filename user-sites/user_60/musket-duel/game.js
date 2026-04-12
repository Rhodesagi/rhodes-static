// musket-duel/game.js
// Main game loop and state management

const Game = {
  p1: null,
  p2: null,
  running: false,
  gameOver: false,
  winner: null,
  matchScore: { p1: 0, p2: 0 },
  maxScore: 5,
  
  // Timing
  lastTime: 0,
  accumulator: 0,
  dt: 1/60, // Fixed timestep
  
  init() {
    this.resetMatch();
    this.updateUI();
    requestAnimationFrame((t) => this.loop(t));
  },
  
  resetMatch() {
    // Create players at opposite ends
    this.p1 = Player.create(1, 15, 50, '#4488ff');
    this.p2 = Player.create(2, 85, 50, '#ff4444');
    this.gameOver = false;
    this.winner = null;
    document.getElementById('victory').classList.remove('show');
  },
  
  resetRound() {
    this.p1.respawn(15, 50);
    this.p2.respawn(85, 50);
    this.gameOver = false;
    this.winner = null;
    document.getElementById('victory').classList.remove('show');
  },
  
  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const frameTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    
    // Cap frame time to avoid spiral
    const maxFrame = 0.25;
    const dt = Math.min(frameTime, maxFrame);
    
    if (!this.gameOver) {
      this.update(dt);
    } else {
      // Check for restart
      if (Input.restartPressed()) {
        if (this.matchScore.p1 >= this.maxScore || 
            this.matchScore.p2 >= this.maxScore) {
          this.matchScore = { p1: 0, p2: 0 };
        }
        this.resetMatch();
      }
    }
    
    Renderer.render(this.p1, this.p2, this.gameOver, this.winner);
    this.updateUI();
    
    requestAnimationFrame((t) => this.loop(t));
  },
  
  update(dt) {
    // Get input states
    const p1Input = Input.getP1State();
    const p2Input = Input.getP2State();
    
    // Update Player 1
    if (this.p1.alive) {
      // Movement
      let dx = 0, dz = 0;
      if (p1Input.forward) dz -= 1;
      if (p1Input.backward) dz += 1;
      if (p1Input.strafeLeft) dx -= 1;
      if (p1Input.strafeRight) dx += 1;
      
      // Convert to world space based on yaw
      const worldDx = dx * Math.cos(this.p1.yaw) + dz * Math.sin(this.p1.yaw);
      const worldDz = dz * Math.cos(this.p1.yaw) - dx * Math.sin(this.p1.yaw);
      this.p1.move(worldDx, worldDz, dt);
      
      // Turning
      let turn = 0;
      if (p1Input.turnLeft) turn -= 1;
      if (p1Input.turnRight) turn += 1;
      this.p1.turn(turn, 0, dt);
      
      // Weapon handling
      const fired = this.p1.musket.handleInput(
        p1Input.fire, 
        p1Input.ironSights
      );
      if (fired) {
        this.p1.tryFire();
      }
    }
    
    // Update Player 2
    if (this.p2.alive) {
      let dx = 0, dz = 0;
      if (p2Input.forward) dz -= 1;
      if (p2Input.backward) dz += 1;
      if (p2Input.strafeLeft) dx -= 1;
      if (p2Input.strafeRight) dx += 1;
      
      const worldDx = dx * Math.cos(this.p2.yaw) + dz * Math.sin(this.p2.yaw);
      const worldDz = dz * Math.cos(this.p2.yaw) - dx * Math.sin(this.p2.yaw);
      this.p2.move(worldDx, worldDz, dt);
      
      let turn = 0;
      if (p2Input.turnLeft) turn -= 1;
      if (p2Input.turnRight) turn += 1;
      this.p2.turn(turn, 0, dt);
      
      // Pitch adjustment for P2 with different keys
      let pitch = 0;
      if (p2Input.aimUp) pitch += 1;
      this.p2.turn(0, pitch, dt);
      
      const fired = this.p2.musket.handleInput(
        p2Input.fire, 
        p2Input.ironSights
      );
      if (fired) {
        this.p2.tryFire();
      }
    }
    
    // Update players (projectiles, etc)
    this.p1.update(dt, this.p2);
    this.p2.update(dt, this.p1);
    
    // Check for round end
    if (!this.p1.alive || !this.p2.alive) {
      if (!this.p1.alive && this.p2.alive) {
        this.winner = 2;
        this.matchScore.p2++;
      } else if (this.p1.alive && !this.p2.alive) {
        this.winner = 1;
        this.matchScore.p1++;
      } else {
        // Both died - no point
      }
      
      if (this.winner) {
        this.gameOver = true;
        this.showVictory();
        
        // Auto restart after delay if match not over
        if (this.matchScore.p1 < this.maxScore && 
            this.matchScore.p2 < this.maxScore) {
          setTimeout(() => {
            if (!Input.restartPressed()) {
              this.resetRound();
            }
          }, 3000);
        }
      }
    }
  },
  
  showVictory() {
    const victoryEl = document.getElementById('victory');
    const textEl = document.getElementById('victoryText');
    
    if (this.matchScore.p1 >= this.maxScore) {
      textEl.textContent = 'PLAYER 1 WINS THE MATCH!';
      textEl.style.color = '#4488ff';
    } else if (this.matchScore.p2 >= this.maxScore) {
      textEl.textContent = 'PLAYER 2 WINS THE MATCH!';
      textEl.style.color = '#ff4444';
    } else {
      textEl.textContent = `PLAYER ${this.winner} WINS THE ROUND!`;
      textEl.style.color = this.winner === 1 ? '#4488ff' : '#ff4444';
    }
    
    victoryEl.classList.add('show');
  },
  
  updateUI() {
    // Update scores
    document.getElementById('p1Score').textContent = this.matchScore.p1;
    document.getElementById('p2Score').textContent = this.matchScore.p2;
    
    // Update reload status
    document.getElementById('p1Reload').textContent = this.p1.musket.getStateName();
    document.getElementById('p2Reload').textContent = this.p2.musket.getStateName();
    
    // Color code based on state
    const p1Ready = this.p1.musket.state === Musket.States.READY;
    const p2Ready = this.p2.musket.state === Musket.States.READY;
    
    document.getElementById('p1Reload').style.color = p1Ready ? '#0f0' : '#fa0';
    document.getElementById('p2Reload').style.color = p2Ready ? '#0f0' : '#fa0';
    document.getElementById('p1Reload').style.background = p1Ready ? 'rgba(0,50,0,0.7)' : 'rgba(50,30,0,0.7)';
    document.getElementById('p2Reload').style.background = p2Ready ? 'rgba(0,50,0,0.7)' : 'rgba(50,30,0,0.7)';
  }
};

// Start game when page loads
window.addEventListener('load', () => Game.init());
