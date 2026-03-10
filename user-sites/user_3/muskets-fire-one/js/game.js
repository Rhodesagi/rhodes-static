// Main game controller

class Game {
    constructor() {
        this.running = false;
        this.paused = false;
        this.lastTime = 0;
        
        // Scoring
        this.scores = { p1: 0, p2: 0 };
        this.winScore = 5;
        this.winner = null;
        
        // Players
        this.player1 = null;
        this.player2 = null;
        
        // Renderer
        this.renderer = null;
        
        // UI elements
        this.ui = {
            startScreen: document.getElementById('start-screen'),
            scoreDisplay: document.getElementById('score-display'),
            scoreP1: document.getElementById('score-p1'),
            scoreP2: document.getElementById('score-p2'),
            timer: document.getElementById('round-timer'),
            startBtn: document.getElementById('start-btn')
        };
        
        // Reload indicators
        this.reloadIndicators = {
            p1: this.createReloadIndicator('viewport-p1'),
            p2: this.createReloadIndicator('viewport-p2')
        };
        
        // Bind methods
        this.loop = this.loop.bind(this);
        
        // Setup start button
        this.ui.startBtn.addEventListener('click', () => this.start());
        
        // Global access for callbacks
        window.game = this;
    }
    
    createReloadIndicator(viewportId) {
        const viewport = document.getElementById(viewportId);
        const indicator = document.createElement('div');
        indicator.className = 'reload-indicator';
        indicator.style.display = 'none';
        
        for (let i = 0; i < 7; i++) {
            const step = document.createElement('div');
            step.className = 'reload-step';
            step.id = `${viewportId}-step-${i}`;
            indicator.appendChild(step);
        }
        
        const text = document.createElement('div');
        text.className = 'reload-text';
        text.style.marginTop = '5px';
        indicator.appendChild(text);
        
        viewport.appendChild(indicator);
        
        return { element: indicator, text: text };
    }
    
    init() {
        // Create renderer
        this.renderer = new Renderer('game-container');
        
        // Create players
        this.player1 = new Player(1, new THREE.Vector3(-20, 0, 0), 0x4a6a9a);
        this.player2 = new Player(2, new THREE.Vector3(20, 0, 0), 0x9a4a4a);
        
        // Add player meshes to scene
        this.renderer.addPlayerMesh(this.player1.mesh);
        this.renderer.addPlayerMesh(this.player2.mesh);
        
        // Set initial rotations to face each other
        this.player1.rotation.yaw = 0;
        this.player2.rotation.yaw = Math.PI;
    }
    
    start() {
        if (!this.renderer) {
            this.init();
        }
        
        this.running = true;
        this.paused = false;
        this.scores = { p1: 0, p2: 0 };
        this.winner = null;
        
        // Reset players
        this.player1.position.set(-20, 0, 0);
        this.player1.rotation.yaw = 0;
        this.player1.health = 100;
        this.player1.alive = true;
        this.player1.mesh.visible = true;
        this.player1.musket.reset();
        
        this.player2.position.set(20, 0, 0);
        this.player2.rotation.yaw = Math.PI;
        this.player2.health = 100;
        this.player2.alive = true;
        this.player2.mesh.visible = true;
        this.player2.musket.reset();
        
        // Clear projectiles
        physics.clear();
        
        // Update UI
        this.ui.startScreen.classList.add('hidden');
        this.ui.scoreDisplay.style.display = 'flex';
        this.updateScoreDisplay();
        
        // Start loop
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
    }
    
    loop(currentTime) {
        if (!this.running) return;
        
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        if (!this.paused) {
            this.update(deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame(this.loop);
    }
    
    update(deltaTime) {
        // Get inputs
        const p1Input = input.getP1Input();
        const p2Input = input.getP2Input();
        
        // Update players
        this.player1.update(deltaTime, p1Input);
        this.player2.update(deltaTime, p2Input);
        
        // Update physics
        physics.update(deltaTime, [this.player1, this.player2], { x: 50, z: 50 });
        
        // Update UI
        this.updateReloadUI();
        
        // Check win condition
        if (this.winner) {
            this.showWinScreen();
        }
    }
    
    render() {
        // Update cameras
        this.renderer.updateCameras(this.player1, this.player2);
        
        // Update projectiles
        this.renderer.updateProjectiles(physics.getProjectiles());
        
        // Render
        this.renderer.render();
    }
    
    updateReloadUI() {
        this.updatePlayerReloadUI(this.player1, 'viewport-p1', this.reloadIndicators.p1);
        this.updatePlayerReloadUI(this.player2, 'viewport-p2', this.reloadIndicators.p2);
    }
    
    updatePlayerReloadUI(player, viewportId, indicator) {
        const status = player.getReloadStatus();
        
        if (status.step >= 0) {
            indicator.element.style.display = 'block';
            indicator.text.textContent = status.stepName;
            
            // Update step indicators
            for (let i = 0; i < 7; i++) {
                const stepEl = document.getElementById(`${viewportId}-step-${i}`);
                if (stepEl) {
                    stepEl.className = 'reload-step';
                    if (i < status.step) {
                        stepEl.classList.add('complete');
                    } else if (i === status.step) {
                        stepEl.classList.add('active');
                    }
                }
            }
        } else {
            indicator.element.style.display = 'none';
        }
        
        // Show loaded indicator
        if (status.loaded) {
            indicator.element.style.display = 'block';
            indicator.text.textContent = 'READY';
            indicator.text.style.color = '#4a8a4a';
        }
    }
    
    onKill(killerId, victimId) {
        if (killerId === 1) {
            this.scores.p1++;
        } else if (killerId === 2) {
            this.scores.p2++;
        }
        
        this.updateScoreDisplay();
        
        // Check win
        if (this.scores.p1 >= this.winScore) {
            this.winner = 1;
        } else if (this.scores.p2 >= this.winScore) {
            this.winner = 2;
        }
    }
    
    updateScoreDisplay() {
        this.ui.scoreP1.textContent = `P1: ${this.scores.p1}`;
        this.ui.scoreP2.textContent = `P2: ${this.scores.p2}`;
    }
    
    showWinScreen() {
        this.paused = true;
        
        const winnerName = this.winner === 1 ? 'PLAYER 1' : 'PLAYER 2';
        
        const winDiv = document.createElement('div');
        winDiv.id = 'win-screen';
        winDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                padding: 40px 60px;
                border: 2px solid #5a4a30;
                text-align: center;
                z-index: 200;
            ">
                <h2 style="font-size: 36px; margin-bottom: 20px; color: #${this.winner === 1 ? '4a6a9a' : '9a4a4a'};">
                    ${winnerName} WINS!
                </h2>
                <p style="margin-bottom: 20px;">Final Score: ${this.scores.p1} - ${this.scores.p2}</p>
                <button id="restart-btn" style="
                    padding: 15px 40px;
                    font-size: 18px;
                    font-family: 'Courier New', monospace;
                    background: #3a2a15;
                    color: #d4c4a8;
                    border: 2px solid #5a4a30;
                    cursor: pointer;
                ">PLAY AGAIN</button>
            </div>
        `;
        
        document.body.appendChild(winDiv);
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            winDiv.remove();
            this.start();
        });
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
