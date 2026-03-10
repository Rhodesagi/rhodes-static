// Main game logic with split-screen rendering
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true 
        }, 100); });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.autoClear = false;
        
        this.scene = new THREE.Scene();
        this.world = new World(this.scene);
        
        // Create players at opposite ends
        this.player1 = new Player(this.scene, 0, -15, false);
        this.player2 = new Player(this.scene, 0, 15, true);
        
        this.input = new InputManager();
        
        this.clock = new THREE.Clock();
        this.isRunning = false;
        
        this.setupResizeHandler();
        this.setupUI();
        
        // Start on click
        document.addEventListener('click', () => this.start(), { once: true }, 100); });
    }
    
    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.updateCameraAspects();
        }, 100); });
        this.updateCameraAspects();
    }
    
    updateCameraAspects() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const aspect = (width / 2) / height;
        
        this.player1.camera.aspect = aspect;
        this.player1.camera.updateProjectionMatrix();
        
        this.player2.camera.aspect = aspect;
        this.player2.camera.updateProjectionMatrix();
    }
    
    setupUI() {
        // Create winner overlay
        const overlay = document.createElement('div');
        overlay.id = 'winner-overlay';
        overlay.className = 'hidden';
        overlay.innerHTML = `
            <h1 id="winner-text">PLAYER 1 WINS</h1>
            <button id="restart-btn">Play Again</button>
        `;
        document.body.appendChild(overlay);
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        }, 100); });
    }
    
    start() {
        document.getElementById('instructions').classList.add('hidden');
        this.isRunning = true;
        this.animate();
    }
    
    restart() {
        document.getElementById('winner-overlay').classList.add('hidden');
        
        // Reset players
        this.player1.respawn();
        this.player2.respawn();
        this.player1.position.set(0, 1.7, -15);
        this.player1.yaw = 0;
        this.player2.position.set(0, 1.7, 15);
        this.player2.yaw = Math.PI;
        
        this.isRunning = true;
    }
    
    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        // Get inputs
        const p1Input = this.input.getP1Input();
        const p2Input = this.input.getP2Input();
        
        // Update players
        const colliders = this.world.getColliders();
        this.player1.update(delta, p1Input, colliders, this.player2);
        this.player2.update(delta, p2Input, colliders, this.player1);
        
        // Reset mouse delta
        this.input.resetMouseDelta();
        
        // Check win condition
        this.checkWinCondition();
        
        // Render split screen
        this.render();
    }
    
    checkWinCondition() {
        // Check if both are dead simultaneously (rare) or track score
        // For now, just show winner when one dies
    }
    
    showWinner(winner) {
        this.isRunning = false;
        document.getElementById('winner-text').textContent = winner + ' WINS';
        document.getElementById('winner-overlay').classList.remove('hidden');
        
        // Release pointer lock
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }
    
    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.renderer.clear();
        
        // Render Player 1 (left half)
        this.renderer.setViewport(0, 0, width / 2, height);
        this.renderer.setScissor(0, 0, width / 2, height);
        this.renderer.setScissorTest(true);
        this.player1.camera.layers.enable(1); this.player1.camera.layers.enable(0); this.player1.camera.layers.disable(2); this.renderer.render(this.scene, this.player1.camera);
        
        // Render Player 2 (right half)
        this.renderer.setViewport(width / 2, 0, width / 2, height);
        this.renderer.setScissor(width / 2, 0, width / 2, height);
        this.player2.camera.layers.enable(2); this.player2.camera.layers.enable(0); this.player2.camera.layers.disable(1); this.renderer.render(this.scene, this.player2.camera);
        
        this.renderer.setScissorTest(false);
        
        // Draw split line
        this.drawSplitLine();
    }
    
    drawSplitLine() {
        const ctx = this.canvas.getContext('2d');
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // This doesn't work well with WebGL renderer
        // Using a visual element instead in CSS
    }
}

// Start game when loaded
window.addEventListener('load', () => {
    window.game = new Game();
}, 100); });
