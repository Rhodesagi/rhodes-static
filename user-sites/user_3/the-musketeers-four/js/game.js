/**
 * Game.js - Main game engine with split-screen rendering
 * Two players, one computer, iron sights only
 */

class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.canvas = document.getElementById('game-canvas');
        this.startScreen = document.getElementById('start-screen');
        this.winnerScreen = document.getElementById('winner-screen');
        this.winnerText = document.getElementById('winner-text');
        
        this.renderer = null;
        this.scene = null;
        this.players = [];
        this.projectiles = [];
        
        this.isRunning = false;
        this.lastTime = 0;
        
        // Viewport dimensions
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.halfWidth = this.width / 2;
        
        this.setupRenderer();
        this.createScene();
        this.setupInputs();
        
        // Start button
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
        
        window.addEventListener('resize', () => this.onResize());
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true 
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 60);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.camera.left = -30;
        sunLight.shadow.camera.right = 30;
        sunLight.shadow.camera.top = 30;
        sunLight.shadow.camera.bottom = -30;
        this.scene.add(sunLight);
        
        // Ground
        const groundGeo = new THREE.PlaneGeometry(40, 40);
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: 0x3d5c3d,
            roughness: 0.9
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add some trees/barriers for cover
        this.createEnvironment();
        
        // Cameras for both players
        this.camera1 = new THREE.PerspectiveCamera(75, this.halfWidth / this.height, 0.1, 100);
        this.camera2 = new THREE.PerspectiveCamera(75, this.halfWidth / this.height, 0.1, 100);
    }
    
    createEnvironment() {
        // Simple trees as obstacles
        const treePositions = [
            [-5, -8], [5, -8], [-5, 8], [5, 8],
            [0, -12], [0, 12], [-12, 0], [12, 0],
            [-8, -5], [8, 5], [-8, 5], [8, -5]
        ];
        
        treePositions.forEach(pos => {
            this.createTree(pos[0], pos[1]);
        });
        
        // Barricades
        for (let i = -15; i <= 15; i += 10) {
            if (Math.abs(i) > 2) {
                this.createBarricade(i, 0);
            }
        }
    }
    
    createTree(x, z) {
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, 1, z);
        trunk.castShadow = true;
        this.scene.add(trunk);
        
        const leavesGeo = new THREE.ConeGeometry(1.5, 3, 8);
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2d5a2d });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.set(x, 3, z);
        leaves.castShadow = true;
        this.scene.add(leaves);
    }
    
    createBarricade(x, z) {
        const crateGeo = new THREE.BoxGeometry(1.5, 1, 1);
        const crateMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const crate = new THREE.Mesh(crateGeo, crateMat);
        crate.position.set(x, 0.5, z);
        crate.castShadow = true;
        crate.receiveShadow = true;
        this.scene.add(crate);
    }
    
    setupInputs() {
        this.activePlayer = 0; // For mouse control switching
        
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            
            // Player 1
            const result1 = this.players[0].handleKeyDown(e.key);
            if (result1) this.handleAction(0, result1);
            
            // Player 2
            const result2 = this.players[1].handleKeyDown(e.key);
            if (result2) this.handleAction(1, result2);
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.players[0]) this.players[0].handleKeyUp(e.key);
            if (this.players[1]) this.players[1].handleKeyUp(e.key);
        });
        
        // Mouse movement - split screen based on x position
        document.addEventListener('mousemove', (e) => {
            if (!this.isRunning) return;
            
            const sensitivity = 0.002;
            
            // Left half controls Player 1, Right half controls Player 2
            if (e.clientX < this.halfWidth) {
                this.players[0].handleMouseMove(e.movementX, e.movementY, sensitivity);
            } else {
                this.players[1].handleMouseMove(e.movementX, e.movementY, sensitivity);
            }
        });
        
        // Pointer lock on click
        this.canvas.addEventListener('click', () => {
            if (this.isRunning) {
                this.canvas.requestPointerLock();
            }
        });
    }
    
    handleAction(playerIndex, action) {
        if (action.action === 'fire' && action.shot) {
            const projectile = new Projectile(
                this.scene,
                action.shot.position,
                action.shot.direction,
                this.players[playerIndex]
            );
            this.projectiles.push(projectile);
        }
    }
    
    start() {
        this.startScreen.classList.add('hidden');
        this.winnerScreen.classList.add('hidden');
        
        // Create players
        this.players = [
            new Player(1, this.camera1, this.scene, PLAYER_CONTROLS.p1),
            new Player(2, this.camera2, this.scene, PLAYER_CONTROLS.p2)
        ];
        
        this.isRunning = true;
        this.lastTime = performance.now();
        
        // Request pointer lock
        this.canvas.requestPointerLock();
        
        // Start loop
        requestAnimationFrame((t) => this.loop(t));
    }
    
    restart() {
        // Clear projectiles
        this.projectiles.forEach(p => p.destroy());
        this.projectiles = [];
        
        this.start();
    }
    
    loop(time) {
        if (!this.isRunning) return;
        
        const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;
        
        // Update players
        this.players[0].update(deltaTime, this.players[1]);
        this.players[1].update(deltaTime, this.players[0]);
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(deltaTime);
            
            // Check collisions
            if (proj.active) {
                if (proj.checkPlayerCollision(this.players[0])) {
                    this.checkWinCondition();
                }
                if (proj.checkPlayerCollision(this.players[1])) {
                    this.checkWinCondition();
                }
            }
            
            if (!proj.active) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update HUD
        this.updateHUD();
        
        // Render split screen
        this.render();
        
        requestAnimationFrame((t) => this.loop(t));
    }
    
    updateHUD() {
        const p1State = this.players[0].getHUDState();
        const p2State = this.players[1].getHUDState();
        
        const p1Status = document.getElementById('p1-status');
        const p2Status = document.getElementById('p2-status');
        
        p1Status.textContent = p1State.state;
        p1Status.className = 'status' + (p1State.aiming ? ' aiming' : '') + 
                             (!p1State.loaded ? ' reloading' : '');
        
        p2Status.textContent = p2State.state;
        p2Status.className = 'status' + (p2State.aiming ? ' aiming' : '') + 
                             (!p2State.loaded ? ' reloading' : '');
    }
    
    checkWinCondition() {
        const p1Alive = this.players[0].alive;
        const p2Alive = this.players[1].alive;
        
        if (!p1Alive || !p2Alive) {
            this.isRunning = false;
            document.exitPointerLock();
            
            if (p1Alive) {
                this.winnerText.textContent = 'PLAYER 1 WINS!';
                this.winnerText.style.color = '#4a90d9';
            } else {
                this.winnerText.textContent = 'PLAYER 2 WINS!';
                this.winnerText.style.color = '#d94a4a';
            }
            
            this.winnerScreen.classList.remove('hidden');
        }
    }
    
    render() {
        this.renderer.setScissorTest(true);
        
        // Player 1 viewport (left half)
        this.renderer.setViewport(0, 0, this.halfWidth, this.height);
        this.renderer.setScissor(0, 0, this.halfWidth, this.height);
        this.renderer.render(this.scene, this.camera1);
        
        // Player 2 viewport (right half)
        this.renderer.setViewport(this.halfWidth, 0, this.halfWidth, this.height);
        this.renderer.setScissor(this.halfWidth, 0, this.halfWidth, this.height);
        this.renderer.render(this.scene, this.camera2);
        
        this.renderer.setScissorTest(false);
    }
    
    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.halfWidth = this.width / 2;
        
        this.renderer.setSize(this.width, this.height);
        
        this.camera1.aspect = this.halfWidth / this.height;
        this.camera1.updateProjectionMatrix();
        
        this.camera2.aspect = this.halfWidth / this.height;
        this.camera2.updateProjectionMatrix();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});