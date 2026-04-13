// main.js - The Musket Duel game initialization and render loop
class MusketDuel {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.container = document.getElementById('game-container');
        this.instructions = document.getElementById('instructions');
        this.gameOverScreen = document.getElementById('game-over');
        this.winnerText = document.getElementById('winner-text');
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x4a4a5a);
        this.scene.fog = new THREE.Fog(0x4a4a5a, 5, 50);
        
        // Game state
        this.gameState = 'menu'; // menu, playing, gameover
        this.clock = new THREE.Clock();
        
        // Initialize components
        this.init();
        
        // Bind events
        this.bindEvents();
        
        // Start loop
        this.animate();
    }
    
    init() {
        // Create arena
        this.arena = new DuelArena(this.scene);
        
        // Create smoke system
        this.smokeSystem = new SmokeSystem(this.scene);
        
        // Create ballistics manager
        this.ballistics = new BallisticsManager(this.scene);
        
        // Create input manager
        this.input = new InputManager();
        
        // Create players
        this.players = [
            new Player(this.scene, 0, this.input, this.ballistics, this.smokeSystem),
            new Player(this.scene, 1, this.input, this.ballistics, this.smokeSystem)
        ];
        
        // Reset to starting positions
        this.players[0].resetPosition();
        this.players[1].resetPosition();
        
        // Resize handling
        this.onWindowResize();
    }
    
    bindEvents() {
        window.addEventListener('resize', () => this.onWindowResize());
        
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetGame();
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.instructions.style.display = 'none';
        this.gameOverScreen.classList.add('hidden');
        
        // Request pointer lock
        this.canvas.requestPointerLock();
        
        // Reset players
        this.players.forEach(p => p.resetPosition());
        this.ballistics.clear();
        this.smokeSystem.clear();
    }
    
    endGame(winnerIndex) {
        this.gameState = 'gameover';
        this.input.releasePointerLock();
        
        this.winnerText.textContent = winnerIndex === 0 ? 'PLAYER 1 VICTORIOUS' : 'PLAYER 2 VICTORIOUS';
        this.gameOverScreen.classList.remove('hidden');
    }
    
    resetGame() {
        this.gameState = 'playing';
        this.gameOverScreen.classList.add('hidden');
        this.canvas.requestPointerLock();
        
        this.players.forEach(p => p.resetPosition());
        this.ballistics.clear();
        this.smokeSystem.clear();
    }
    
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.renderer.setSize(width, height);
        
        // Update camera aspect ratios for split screen
        this.players.forEach(player => {
            player.getCamera().aspect = width / (height / 2);
            player.getCamera().updateProjectionMatrix();
        });
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Update players
        this.players.forEach(player => player.update(deltaTime));
        
        // Update ballistics
        this.ballistics.update(deltaTime, this.players);
        
        // Update smoke particles
        this.smokeSystem.update(deltaTime);
        
        // Check for winner
        if (!this.players[0].alive) {
            this.endGame(1);
        } else if (!this.players[1].alive) {
            this.endGame(0);
        }
    }
    
    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Ensure canvas dimensions are set
        if (width === 0 || height === 0) return;
        
        // Clear entire canvas first
        this.renderer.setScissorTest(false);
        this.renderer.clear();
        
        this.renderer.setScissorTest(true);
        
        // Player 1 viewport (top half)
        this.renderer.setScissor(0, height / 2, width, height / 2);
        this.renderer.setViewport(0, height / 2, width, height / 2);
        this.renderer.render(this.scene, this.players[0].getCamera());
        
        // Player 2 viewport (bottom half)
        this.renderer.setScissor(0, 0, width, height / 2);
        this.renderer.setViewport(0, 0, width, height / 2);
        this.renderer.render(this.scene, this.players[1].getCamera());
        
        this.renderer.setScissorTest(false);
        
        // Draw divider line
        this.drawDivider(width, height);
    }
    
    drawDivider(width, height) {
        // Simple CSS divider is visible, but we can enhance with canvas
        // This is optional visual polish
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        this.update(deltaTime);
        this.render();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new MusketDuel();
});
