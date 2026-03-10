class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
        
        this.world = new World();
        this.world.generate(this.scene);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.autoClear = false; // We handle clearing manually for split screen
        
        // Find viewport containers and append renderer
        const container = document.getElementById('container');
        container.insertBefore(this.renderer.domElement, container.firstChild);
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '1';
        
        // Players
        this.players = [];
        this.createPlayers();
        
        // Particles
        this.muzzleFlashParticles = [];
        this.smokeParticles = [];
        this.impactParticles = [];
        
        // Game state
        this.roundActive = true;
        this.winner = null;
        
        // HUD elements
        this.createScoreDisplay();
        
        // Bind methods
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
        
        window.addEventListener('resize', this.handleResize);
        
        // Start
        this.lastTime = performance.now();
        requestAnimationFrame(this.animate);
    }

    createPlayers() {
        // Player 1
        const p1 = new Player(1, this.world.getRandomSpawn());
        p1.setupInput(
            document.getElementById('p1-viewport'),
            {
                forward: 'KeyW',
                backward: 'KeyS',
                left: 'KeyA',
                right: 'KeyD',
                reload: 'KeyR',
                inspect: 'KeyT',
                fire: 'Space'
            }
        );
        this.scene.add(p1.mesh);
        this.players.push(p1);
        
        // Player 2
        const p2 = new Player(2, this.world.getRandomSpawn());
        p2.setupInput(
            document.getElementById('p2-viewport'),
            {
                forward: 'KeyI',
                backward: 'KeyK',
                left: 'KeyJ',
                right: 'KeyL',
                reload: 'KeyP',
                inspect: 'KeyO',
                fire: 'Slash'
            }
        );
        this.scene.add(p2.mesh);
        this.players.push(p2);
    }

    createScoreDisplay() {
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            border: 1px solid #c4a35a;
            padding: 10px 30px;
            font-family: 'Courier New', monospace;
            color: #c4a35a;
            font-size: 18px;
            z-index: 50;
            letter-spacing: 3px;
        `;
        this.updateScoreDisplay();
        document.body.appendChild(this.scoreDisplay);
    }

    updateScoreDisplay() {
        if (this.players.length >= 2) {
            this.scoreDisplay.textContent = `P1: ${this.players[0].score}  —  P2: ${this.players[1].score}`;
        }
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer.setSize(width, height);
        
        // Update camera aspects
        for (const player of this.players) {
            player.camera.aspect = (width / 2) / height;
            player.camera.updateProjectionMatrix();
        }
    }

    animate() {
        requestAnimationFrame(this.animate);
        
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = now;
        
        if (this.roundActive) {
            this.update(dt);
            this.render();
        }
    }

    update(dt) {
        // Update players
        for (const player of this.players) {
            player.update(dt, this.world);
        }
        
        // Update ballistics
        ballistics.update(dt);
        
        // Update particles
        for (const player of this.players) {
            player.musket.update(dt);
        }
    }

    render() {
        const width = this.renderer.domElement.width;
        const height = this.renderer.domElement.height;
        const halfWidth = Math.floor(width / 2);
        
        this.renderer.clear();
        
        // Render Player 1 (left half)
        if (this.players[0]) {
            this.renderer.setViewport(0, 0, halfWidth, height);
            this.renderer.setScissor(0, 0, halfWidth, height);
            this.renderer.setScissorTest(true);
            this.players[0].mesh.visible = false; // Hide own body
            this.players[1].mesh.visible = true;  // Show opponent
            this.renderer.render(this.scene, this.players[0].camera);
        }
        
        // Render Player 2 (right half)
        if (this.players[1]) {
            this.renderer.setViewport(halfWidth, 0, halfWidth, height);
            this.renderer.setScissor(halfWidth, 0, halfWidth, height);
            this.renderer.setScissorTest(true);
            this.players[1].mesh.visible = false; // Hide own body
            this.players[0].mesh.visible = true;  // Show opponent
            this.renderer.render(this.scene, this.players[1].camera);
        }
        
        this.renderer.setScissorTest(false);
    }

    handleHit(victim, attacker) {
        victim.takeDamage(attacker);
    }

    endRound(winner) {
        this.roundActive = false;
        this.winner = winner;
        
        // Show winner message
        const winnerMsg = document.createElement('div');
        winnerMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            border: 2px solid #c4a35a;
            padding: 40px 60px;
            font-family: 'Courier New', monospace;
            color: #c4a35a;
            font-size: 32px;
            z-index: 100;
            text-align: center;
            letter-spacing: 5px;
        `;
        winnerMsg.innerHTML = `
            <div>PLAYER ${winner.id} WINS</div>
            <div style="font-size: 14px; margin-top: 20px; letter-spacing: 2px;">
                Final Score: ${this.players[0].score} - ${this.players[1].score}
            </div>
            <div style="font-size: 12px; margin-top: 30px; color: #6a5a4a;">
                Refresh to play again
            </div>
        `;
        document.body.appendChild(winnerMsg);
        
        // Release pointer locks
        document.exitPointerLock();
    }
}

// Initialize game when DOM is ready
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});