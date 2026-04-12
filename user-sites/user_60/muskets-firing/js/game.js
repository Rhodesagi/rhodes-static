/**
 * Game - Main game loop and split-screen rendering
 */

class Game {
    constructor() {
        this.input = new InputManager();
        this.scene = new THREE.Scene();
        this.environment = new Environment(this.scene);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Create viewports
        const container = document.getElementById('game-container');
        const p1Viewport = document.getElementById('p1-viewport');
        const p2Viewport = document.getElementById('p2-viewport');
        
        // The canvas goes in container, we use viewport masking
        this.canvas = this.renderer.domElement;
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        container.appendChild(this.canvas);
        
        // Create players
        this.player1 = new Player(this.scene, true, new THREE.Vector3(-10, 0, 0));
        this.player2 = new Player(this.scene, false, new THREE.Vector3(10, 0, 0));
        this.players = [this.player1, this.player2];
        
        // Set initial camera orientations (face each other)
        this.player1.rotation.y = 0;
        this.player2.rotation.y = Math.PI;
        
        // Projectiles and effects
        this.projectiles = [];
        this.effects = [];
        
        // Game state
        this.isRunning = false;
        this.clock = new THREE.Clock();
        
        // UI elements
        this.p1Score = 0;
        this.p2Score = 0;
        
        // Setup resize handler
        window.addEventListener('resize', () => this.onResize());
        this.onResize();
        
        // Bind start button
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        
        // Start the loop (but don't update until game starts)
        this.animate();
    }
    
    start() {
        document.getElementById('instructions').classList.add('hidden');
        this.isRunning = true;
        
        // Request pointer lock for player 1 mouse control
        this.input.requestPointerLock(document.body);
        
        // Ensure players are facing each other
        this.player1.rotation.y = Math.PI; // Face +Z
        this.player2.rotation.y = 0; // Face -Z
    }
    
    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.renderer.setSize(width, height);
        
        // Each player gets half the width
        const halfWidth = width / 2;
        this.player1.setAspectRatio(halfWidth / height);
        this.player2.setAspectRatio(halfWidth / height);
    }
    
    update() {
        if (!this.isRunning) return;
        
        const deltaTime = this.clock.getDelta();
        
        // Get input for both players
        const p1Input = this.input.getPlayer1Input();
        const p2Input = this.input.getPlayer2Input();
        
        // Update players
        const p1Projectile = this.player1.update(deltaTime, p1Input, this.environment, this.player2);
        const p2Projectile = this.player2.update(deltaTime, p2Input, this.environment, this.player1);
        
        // Add projectiles if fired
        if (p1Projectile) {
            this.projectiles.push(p1Projectile);
            this.scene.add(p1Projectile.mesh);
            
            // Add effects
            const muzzlePos = this.player1.musket.getMuzzlePosition();
            const muzzleDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player1.camera.quaternion);
            this.effects.push(new MuzzleFlash(this.scene, muzzlePos, muzzleDir));
            this.effects.push(new SmokeCloud(this.scene, muzzlePos));
        }
        
        if (p2Projectile) {
            this.projectiles.push(p2Projectile);
            this.scene.add(p2Projectile.mesh);
            
            const muzzlePos = this.player2.musket.getMuzzlePosition();
            const muzzleDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player2.camera.quaternion);
            this.effects.push(new MuzzleFlash(this.scene, muzzlePos, muzzleDir));
            this.effects.push(new SmokeCloud(this.scene, muzzlePos));
        }
        
        this.input.resetMouseDelta();
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const stillActive = projectile.update(deltaTime, this.scene, this.environment);
            
            if (stillActive) {
                // Check for player hits
                const hitPlayer = projectile.checkPlayerHit(this.players);
                if (hitPlayer) {
                    projectile.active = false;
                    hitPlayer.takeDamage(100, projectile.position); // One shot kill
                    
                    // Update score
                    if (hitPlayer === this.player2) {
                        this.p1Score++;
                    } else {
                        this.p2Score++;
                    }
                }
            } else {
                this.projectiles.splice(i, 1);
                projectile.removeFromScene(this.scene);
            }
        }
        
        // Update effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            const stillActive = effect.update(deltaTime);
            
            if (!stillActive) {
                this.effects.splice(i, 1);
            }
        }
        
        // Ensure minimum distance between players (prevent spawn camping)
        const playerDistance = this.player1.position.distanceTo(this.player2.position);
        if (playerDistance < 5) {
            // Push players apart
            const push = this.player2.position.clone().sub(this.player1.position).normalize();
            const midPoint = this.player1.position.clone().add(this.player2.position).multiplyScalar(0.5);
            
            this.player1.position.copy(midPoint).sub(push.multiplyScalar(2.5));
            this.player2.position.copy(midPoint).add(push.multiplyScalar(2.5));
        }
    }
    
    render() {
        const width = this.renderer.domElement.width;
        const height = this.renderer.domElement.height;
        const halfWidth = Math.floor(width / 2);
        
        // Clear the entire canvas
        this.renderer.setScissorTest(false);
        this.renderer.clear();
        
        // Render Player 1 view (left half)
        this.renderer.setViewport(0, 0, halfWidth, height);
        this.renderer.setScissor(0, 0, halfWidth, height);
        this.renderer.setScissorTest(true);
        this.renderer.render(this.scene, this.player1.getCamera());
        
        // Render Player 2 view (right half)
        this.renderer.setViewport(halfWidth, 0, halfWidth, height);
        this.renderer.setScissor(halfWidth, 0, halfWidth, height);
        this.renderer.setScissorTest(true);
        this.renderer.render(this.scene, this.player2.getCamera());
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.update();
        this.render();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});