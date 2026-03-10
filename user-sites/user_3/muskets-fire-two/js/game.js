// Game Main - Split-screen musket duel

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.winnerText = document.getElementById('winnerText');
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        
        this.isRunning = false;
        this.gameOver = false;
        
        // Three.js setup
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.autoClear = false; // We'll handle clearing manually
        
        // Scene shared between both players
        this.scene = new THREE.Scene();
        
        // Input manager
        this.input = new InputManager();
        
        // World
        this.world = new World(this.scene);
        
        // Ballistics
        this.ballistics = new BallisticsManager(this.scene);
        
        // Players
        const spawnPos = this.world.getSpawnPositions();
        this.player1 = new Player(this.scene, this.input, 1, spawnPos[0]);
        this.player2 = new Player(this.scene, this.input, 2, spawnPos[1]);
        this.player1.onFire = (pos, dir) => this.fireProjectile(pos, dir);
        this.player2.onFire = (pos, dir) => this.fireProjectile(pos, dir);
        
        this.players = [this.player1, this.player2];
        
        // Handle window resize
        window.addEventListener('resize', () => this.onResize());
        
        // Button listeners
        this.startBtn.addEventListener('click', () => this.start());
        this.restartBtn.addEventListener('click', () => this.restart());
        
        // Setup split-screen viewports
        this.setupViewports();
        
        // Initial render
        this.onResize();
        
        // Render initial frame to show something
        this.render();
    }
    
    setupViewports() {
        // Player 1 gets left half
        this.player1.camera.viewport = { x: 0, y: 0, width: 0.5, height: 1 };
        
        // Player 2 gets right half
        this.player2.camera.viewport = { x: 0.5, y: 0, width: 0.5, height: 1 };
    }
    
    start() {
        this.startScreen.style.display = 'none';
        this.isRunning = true;
        this.gameOver = false;
        
        // Request pointer lock for Player 1 initially
        this.input.requestPointerLock(this.canvas, 1);
        
        // Start game loop
        this.lastTime = performance.now();
        requestAnimationFrame(() => this.loop());
    }
    
    restart() {
        this.gameOverScreen.style.display = 'none';
        this.gameOver = false;
        
        // Reset players
        const spawnPos = this.world.getSpawnPositions();
        this.player1.respawn(spawnPos[0]);
        this.player2.respawn(spawnPos[1]);
        
        // Clear projectiles
        this.ballistics.clear();
        
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(() => this.loop());
    }
    
    fireProjectile(position, direction) {
        this.ballistics.fire(position, direction, 160);
        
        // Muzzle flash particle effect
        this.createMuzzleFlash(position, direction);
    }
    
    createMuzzleFlash(position, direction) {
        // Brief point light at muzzle
        const light = new THREE.PointLight(0xffaa00, 3, 5);
        light.position.copy(position);
        this.scene.add(light);
        
        // Smoke particle
        const smokeGeo = new THREE.SphereGeometry(0.1, 6, 6);
        const smokeMat = new THREE.MeshBasicMaterial({ 
            color: 0x888888, 
            transparent: true, 
            opacity: 0.6 
        });
        const smoke = new THREE.Mesh(smokeGeo, smokeMat);
        smoke.position.copy(position);
        this.scene.add(smoke);
        
        // Animate smoke
        let smokeTime = 0;
        const animateSmoke = () => {
            smokeTime += 0.05;
            smoke.scale.multiplyScalar(1.02);
            smoke.material.opacity = Math.max(0, 0.6 - smokeTime);
            smoke.position.add(direction.clone().multiplyScalar(0.02));
            
            if (smokeTime < 1) {
                requestAnimationFrame(animateSmoke);
            } else {
                this.scene.remove(smoke);
            }
        };
        animateSmoke();
        
        // Remove light after short delay
        setTimeout(() => {
            this.scene.remove(light);
        }, 50);
    }
    
    loop() {
        if (!this.isRunning) return;
        
        const now = performance.now();
        const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = now;
        
        // Update input
        this.input.update();
        
        // Handle pointer lock toggle (Tab to switch players)
        if (this.input.wasKeyPressed('Tab')) {
            const newPlayer = this.input.activePlayer === 1 ? 2 : 1;
            this.input.exitPointerLock();
            setTimeout(() => {
                this.input.requestPointerLock(this.canvas, newPlayer);
            }, 100);
        }
        
        // Update game
        this.update(deltaTime);
        
        // Render
        this.render();
        
        requestAnimationFrame(() => this.loop());
    }
    
    update(deltaTime) {
        // Update players
        this.player1.update(deltaTime, this.world.bounds);
        this.player2.update(deltaTime, this.world.bounds);
        
        // Update ballistics
        this.ballistics.update(deltaTime);
        
        // Check hits
        const hits = this.ballistics.checkPlayerHits(this.players);
        for (const hit of hits) {
            hit.player.takeDamage(hit.damage);
        }
        
        // Check game over
        if (!this.gameOver) {
            if (!this.player1.alive) {
                this.endGame(2);
            } else if (!this.player2.alive) {
                this.endGame(1);
            }
        }
    }
    
    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear the entire canvas
        this.renderer.setScissorTest(false);
        this.renderer.clear();
        
        // Render Player 1 (left half)
        this.renderer.setScissorTest(true);
        this.renderer.setScissor(0, 0, width / 2, height);
        this.renderer.setViewport(0, 0, width / 2, height);
        this.renderer.render(this.scene, this.player1.camera);
        
        // Render Player 2 (right half)
        this.renderer.setScissor(width / 2, 0, width / 2, height);
        this.renderer.setViewport(width / 2, 0, width / 2, height);
        this.renderer.render(this.scene, this.player2.camera);
        
        // Draw split line
        this.drawSplitLine(width, height);
    }
    
    drawSplitLine(width, height) {
        // Use 2D canvas context to draw a divider line
        const ctx = this.canvas.getContext('2d');
        ctx.save();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.restore();
    }
    
    endGame(winnerNum) {
        this.gameOver = true;
        this.isRunning = false;
        this.winnerText.textContent = `PLAYER ${winnerNum} WINS!`;
        this.gameOverScreen.style.display = 'flex';
        this.input.exitPointerLock();
    }
    
    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Update camera aspect ratios
        this.player1.camera.aspect = (width / 2) / height;
        this.player1.camera.updateProjectionMatrix();
        
        this.player2.camera.aspect = (width / 2) / height;
        this.player2.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
