/**
 * Musketeer Duel - Main Game Engine
 * 2-player split-screen first-person musket dueling game
 */

class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.canvas1 = document.getElementById('canvas1');
        this.canvas2 = document.getElementById('canvas2');
        this.startScreen = document.getElementById('start-screen');
        this.startBtn = document.getElementById('start-btn');
        
        this.isRunning = false;
        this.lastTime = 0;
        
        // Create renderers
        this.renderer1 = new THREE.WebGLRenderer({ canvas: this.canvas1, antialias: true });
        this.renderer2 = new THREE.WebGLRenderer({ canvas: this.canvas2, antialias: true });
        
        this.renderer1.setSize(window.innerWidth / 2, window.innerHeight);
        this.renderer1.setPixelRatio(window.devicePixelRatio);
        this.renderer1.shadowMap.enabled = true;
        this.renderer1.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.renderer2.setSize(window.innerWidth / 2, window.innerHeight);
        this.renderer2.setPixelRatio(window.devicePixelRatio);
        this.renderer2.shadowMap.enabled = true;
        this.renderer2.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Create scenes
        this.scene = new THREE.Scene();
        
        // Create world
        this.world = new World(this.scene);
        
        // Create players
        const p1Spawn = new THREE.Vector3(-15, 1.7, 0);
        const p1Rot = new THREE.Euler(0, Math.PI / 2, 0);
        this.player1 = new Player(this.scene, 1, p1Spawn, p1Rot);
        
        const p2Spawn = new THREE.Vector3(15, 1.7, 0);
        const p2Rot = new THREE.Euler(0, -Math.PI / 2, 0);
        this.player2 = new Player(this.scene, 2, p2Spawn, p2Rot);
        
        this.players = [this.player1, this.player2];
        
        // Create particle systems
        this.particles = new ParticleSystem(this.scene);
        
        // Create projectile system
        this.projectiles = new Projectile(this.scene, this.particles);
        
        // Initialize input
        Input.init();
        
        // Event listeners
        this.startBtn.addEventListener('click', () => this.start());
        window.addEventListener('resize', () => this.onResize());
        
        // Prevent context menu
        document.addEventListener('contextmenu', e => e.preventDefault());
        
        // Detect mouse position for player switching
        document.addEventListener('mousemove', (e) => {
            const halfWidth = window.innerWidth / 2;
            Input.mouse.activePlayer = e.clientX < halfWidth ? 1 : 2;
        });
        
        // Render one frame for display
        this.render();
    }
    
    start() {
        this.isRunning = true;
        this.startScreen.style.display = 'none';
        document.body.classList.add('game-active');
        
        // Request pointer lock for immersive control
        this.canvas1.requestPointerLock = this.canvas1.requestPointerLock || 
                                          this.canvas1.mozRequestPointerLock;
        if (this.canvas1.requestPointerLock) {
            this.canvas1.addEventListener('click', () => {
                this.canvas1.requestPointerLock();
            });
        }
        
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        this.update(dt);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(dt) {
        // Update input
        Input.update();
        
        // Update particles
        this.particles.update(dt);
        
        // Update projectiles
        this.projectiles.update(dt, this.players, this.world);
        
        // Update players
        this.player1.update(dt, Input, this.particles, this.projectiles, this.player2);
        this.player2.update(dt, Input, this.particles, this.projectiles, this.player1);
        
        // Update player 2 camera (each player has their own view)
        // Player 1 camera is already updated in player.update()
        // But we need separate rendering for each
    }
    
    render() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const halfWidth = width / 2;
        
        // Player 1 view (left half)
        this.renderer1.setViewport(0, 0, halfWidth, height);
        this.renderer1.setScissor(0, 0, halfWidth, height);
        this.renderer1.setScissorTest(true);
        
        // Set player 1 camera aspect ratio
        this.player1.camera.aspect = halfWidth / height;
        this.player1.camera.fov = this.player1.getFOV();
        this.player1.camera.updateProjectionMatrix();
        
        this.renderer1.render(this.scene, this.player1.camera);
        
        // Player 2 view (right half)
        this.renderer2.setViewport(0, 0, halfWidth, height);
        this.renderer2.setScissor(0, 0, halfWidth, height);
        this.renderer2.setScissorTest(true);
        
        // Set player 2 camera aspect ratio
        this.player2.camera.aspect = halfWidth / height;
        this.player2.camera.fov = this.player2.getFOV();
        this.player2.camera.updateProjectionMatrix();
        
        // Render player 2's view
        // We need to temporarily hide player 2's weapon from their own view
        this.player2.musket.group.visible = false;
        this.renderer2.render(this.scene, this.player2.camera);
        this.player2.musket.group.visible = true;
        
        // Also hide player 1's weapon from their own view
        // (already done by not rendering it in first person)
    }
    
    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const halfWidth = width / 2;
        
        this.renderer1.setSize(halfWidth, height);
        this.renderer2.setSize(halfWidth, height);
        
        this.player1.camera.aspect = halfWidth / height;
        this.player2.camera.aspect = halfWidth / height;
    }
}

// Initialize game when DOM is ready
window.addEventListener('load', () => {
    window.game = new Game();
});