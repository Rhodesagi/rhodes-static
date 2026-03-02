/**
 * Main Game Loop
 * 2-player split-screen flintlock musket duel
 */
class Game {
    constructor() {
        // Canvas setup
        this.canvasP1 = document.getElementById('viewport-p1');
        this.canvasP2 = document.getElementById('viewport-p2');
        this.ctxP1 = this.canvasP1.getContext('2d');
        this.ctxP2 = this.canvasP2.getContext('2d');
        
        // Set canvas sizes
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Raycasters
        this.raycasterP1 = new Raycaster(this.canvasP1.width, this.canvasP1.height);
        this.raycasterP2 = new Raycaster(this.canvasP2.width, this.canvasP2.height);
        
        // Players
        this.player1 = new Player(3, 3, 0, '#6b9fff', CONTROLS_P1);
        this.player2 = new Player(20, 12, Math.PI, '#ff6b6b', CONTROLS_P2);
        
        // Audio context (unlocked on first interaction)
        this.audioContext = null;
        this.audioUnlocked = false;
        
        // Input handling
        this.setupInput();
        
        // Flash effect
        this.flashElement = this.createFlashElement();
        
        // Hit indicator
        this.hitIndicator = this.createHitIndicator();
        
        // Reload status display
        this.reloadStatus = document.getElementById('reload-status');
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Start loop
        requestAnimationFrame((t) => this.loop(t));
    }
    
    resize() {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight * 0.85;
        
        this.canvasP1.width = Math.floor(containerWidth / 2);
        this.canvasP1.height = Math.floor(containerHeight);
        this.canvasP2.width = Math.floor(containerWidth / 2);
        this.canvasP2.height = Math.floor(containerHeight);
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.handleKey(e.code, true);
            this.unlockAudio();
        });
        
        document.addEventListener('keyup', (e) => {
            this.handleKey(e.code, false);
        });
    }
    
    handleKey(code, pressed) {
        // Player 1
        if (Object.values(CONTROLS_P1).includes(code)) {
            this.player1.setKey(code, pressed);
        }
        
        // Player 2
        if (Object.values(CONTROLS_P2).includes(code)) {
            this.player2.setKey(code, pressed);
        }
    }
    
    unlockAudio() {
        if (this.audioUnlocked) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            this.audioUnlocked = true;
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    playSound(type) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        if (type === 'fire') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } else if (type === 'hit') {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);
        } else if (type === 'reload') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.05);
        }
    }
    
    createFlashElement() {
        const flash = document.createElement('div');
        flash.className = 'flash';
        document.body.appendChild(flash);
        return flash;
    }
    
    createHitIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'hit-indicator';
        indicator.textContent = '☠';
        document.body.appendChild(indicator);
        return indicator;
    }
    
    triggerFlash() {
        this.flashElement.classList.add('active');
        setTimeout(() => {
            this.flashElement.classList.remove('active');
        }, 100);
    }
    
    showHitIndicator() {
        this.hitIndicator.classList.add('show');
        setTimeout(() => {
            this.hitIndicator.classList.remove('show');
        }, 500);
    }
    
    updateReloadDisplay(player, isP1) {
        // Update reload status overlay if player is reloading
        if (player.musket.state === 'reloading') {
            const step = player.musket.reloadSteps[player.musket.reloadStep];
            if (step && !this.reloadStatus.classList.contains('active')) {
                this.reloadStatus.innerHTML = `
                    <div class="reload-text">${isP1 ? 'PLAYER 1' : 'PLAYER 2'} RELOADING</div>
                    <div class="reload-step">${step.desc}</div>
                    <div style="margin-top: 10px; width: 200px; height: 10px; background: #333; border-radius: 5px;">
                        <div style="width: ${player.musket.reloadProgress}%; height: 100%; background: ${isP1 ? '#6b9fff' : '#ff6b6b'}; border-radius: 5px; transition: width 0.1s;"></div>
                    </div>
                `;
                this.reloadStatus.classList.add('active');
            } else if (step) {
                // Update progress
                const progressBar = this.reloadStatus.querySelector('div > div');
                if (progressBar) {
                    progressBar.style.width = `${player.musket.reloadProgress}%`;
                }
            }
        } else {
            this.reloadStatus.classList.remove('active');
        }
    }
    
    loop(timestamp) {
        // Calculate delta time
        this.deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = timestamp;
        
        // Update players
        this.player1.update(this.deltaTime, MAP, this.player2);
        this.player2.update(this.deltaTime, MAP, this.player1);
        
        // Update FOV for raycasters based on iron sights
        this.raycasterP1.fov = this.player1.musket.getCurrentFov();
        this.raycasterP2.fov = this.player2.musket.getCurrentFov();
        
        // Render Player 1 view
        this.ctxP1.fillStyle = '#000';
        this.ctxP1.fillRect(0, 0, this.canvasP1.width, this.canvasP1.height);
        
        if (this.player1.isAlive()) {
            this.raycasterP1.renderToCanvas(this.ctxP1, this.player1, MAP);
            this.player1.musket.draw(this.ctxP1, this.canvasP1.width, this.canvasP1.height, this.player1.musket.ironSightsActive);
        } else {
            this.drawDeathScreen(this.ctxP1, this.canvasP1.width, this.canvasP1.height, 'KILLED', this.player2.color);
        }
        
        // Render Player 2 view
        this.ctxP2.fillStyle = '#000';
        this.ctxP2.fillRect(0, 0, this.canvasP2.width, this.canvasP2.height);
        
        if (this.player2.isAlive()) {
            this.raycasterP2.renderToCanvas(this.ctxP2, this.player2, MAP);
            this.player2.musket.draw(this.ctxP2, this.canvasP2.width, this.canvasP2.height, this.player2.musket.ironSightsActive);
        } else {
            this.drawDeathScreen(this.ctxP2, this.canvasP2.width, this.canvasP2.height, 'KILLED', this.player1.color);
        }
        
        // Update reload display for active player
        if (this.player1.musket.state === 'reloading') {
            this.updateReloadDisplay(this.player1, true);
        } else if (this.player2.musket.state === 'reloading') {
            this.updateReloadDisplay(this.player2, false);
        } else {
            this.reloadStatus.classList.remove('active');
        }
        
        // Continue loop
        requestAnimationFrame((t) => this.loop(t));
    }
    
    drawDeathScreen(ctx, width, height, text, killerColor) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.font = 'bold 48px Courier New';
        ctx.fillStyle = killerColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, width / 2, height / 2 - 30);
        
        ctx.font = '24px Courier New';
        ctx.fillStyle = '#888';
        ctx.fillText('Respawning...', width / 2, height / 2 + 30);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    console.log('Le Duel initialized - Flintlock musket combat');
    console.log('Player 1 (Blue): WASD move, Q/E turn, X aim, F fire, R reload');
    console.log('Player 2 (Red): Arrows move, ,/. turn, M aim, / fire, K reload');
});
