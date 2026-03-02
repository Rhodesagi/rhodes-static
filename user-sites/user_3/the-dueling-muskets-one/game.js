// THE DUELING MUSKETS - Main Game Engine
// Two-player split-screen first-person musket dueling

class DuelingMusketsGame {
    constructor() {
        // Game state
        this.gameActive = true;
        this.players = [];
        this.clock = new THREE.Clock();
        
        // Initialize players and scenes
        this.init();
        
        // Start game loop
        this.animate();
    }
    
    init() {
        // Player 1 setup
        const player1Canvas = document.getElementById('player1-canvas');
        const player1 = new Player(player1Canvas, 1, {
            moveForward: 'KeyW',
            moveBackward: 'KeyS',
            moveLeft: 'KeyA',
            moveRight: 'KeyD',
            turnMusketLeft: 'KeyQ',
            turnMusketRight: 'KeyE',
            aim: 'KeyX',
            fire: 'KeyF',
            reload: 'KeyR'
        });
        
        // Player 2 setup  
        const player2Canvas = document.getElementById('player2-canvas');
        const player2 = new Player(player2Canvas, 2, {
            moveForward: 'ArrowUp',
            moveBackward: 'ArrowDown',
            moveLeft: 'ArrowLeft',
            moveRight: 'ArrowRight',
            turnMusketLeft: 'KeyN',
            turnMusketRight: 'KeyM',
            aim: 'KeyK',
            fire: 'KeyJ',
            reload: 'KeyL'
        });
        
        this.players = [player1, player2];
        
        // Create simple environment for both scenes
        this.createEnvironment(player1.scene);
        this.createEnvironment(player2.scene);
        
        // Position players facing each other
        player1.position.set(-5, 0, 0);
        player2.position.set(5, 0, 0);
        player1.lookAt(new THREE.Vector3(0, 0, 0));
        player2.lookAt(new THREE.Vector3(0, 0, 0));
        
        // Set up window resize handler
        window.addEventListener('resize', () => this.onWindowResize());
        this.onWindowResize();
        
        // Key listeners for global controls (like pause)
        this.setupKeyListeners();
        
        console.log('Game initialized - Two players ready');
    }
    
    createEnvironment(scene) {
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3a5f3a,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = Math.PI / 2;
        ground.position.y = -1;
        scene.add(ground);
        
        // Simple lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        scene.add(directionalLight);
        
        // Add some trees/obstacles
        this.createTrees(scene);
        
        // Sky
        scene.background = new THREE.Color(0x87CEEB);
    }
    
    createTrees(scene) {
        const treeGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
        const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const leavesGeometry = new THREE.SphereGeometry(2, 8, 8);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        
        for (let i = 0; i < 10; i++) {
            const tree = new THREE.Mesh(treeGeometry, treeMaterial);
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            
            const x = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 40;
            
            tree.position.set(x, 2.5, z);
            leaves.position.set(x, 6, z);
            
            scene.add(tree);
            scene.add(leaves);
        }
    }
    
    onWindowResize() {
        this.players.forEach(player => player.onWindowResize());
    }
    
    setupKeyListeners() {
        // Global pause/restart
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                this.gameActive = !this.gameActive;
                console.log('Game ' + (this.gameActive ? 'resumed' : 'paused'));
            }
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (!this.gameActive) return;
        
        const delta = this.clock.getDelta();
        
        // Update each player
        this.players.forEach(player => {
            player.update(delta);
        });
        
        // Check for hits
        this.checkCollisions();
        
        // Update HUD
        this.updateHUD();
    }
    
    checkCollisions() {
        // Simple raycast from each player's musket to other player
        for (let i = 0; i < this.players.length; i++) {
            const shooter = this.players[i];
            if (!shooter.musket.justFired) continue;
            
            const target = this.players[(i + 1) % 2];
            
            // Create ray from shooter's position in direction they're aiming
            const raycaster = new THREE.Raycaster();
            const direction = new THREE.Vector3();
            shooter.camera.getWorldDirection(direction);
            
            raycaster.set(shooter.camera.position, direction);
            
            // Check if ray hits target's collision sphere
            const targetBoundingSphere = new THREE.Sphere(target.position, 1.0);
            if (raycaster.ray.intersectsSphere(targetBoundingSphere)) {
                target.takeDamage(34);
                console.log(`Player ${shooter.playerNumber} hit Player ${target.playerNumber}!`);
                
                if (target.health <= 0) {
                    this.playerWins(shooter.playerNumber);
                }
            }
            
            shooter.musket.justFired = false;
        }
    }
    
    playerWins(winningPlayerNumber) {
        this.gameActive = false;
        alert(`PLAYER ${winningPlayerNumber} WINS THE DUEL!`);
        
        // Reset after 3 seconds
        setTimeout(() => {
            this.players.forEach(player => {
                player.health = 100;
                player.position.set(player.playerNumber === 1 ? -5 : 5, 0, 0);
                player.lookAt(new THREE.Vector3(0, 0, 0));
            });
            this.gameActive = true;
        }, 3000);
    }
    
    updateHUD() {
        this.players.forEach(player => {
            const healthElem = document.getElementById(`p${player.playerNumber}-health`);
            const ammoElem = document.getElementById(`p${player.playerNumber}-ammo`);
            const reloadElem = document.getElementById(`p${player.playerNumber}-reload`);
            
            if (healthElem) {
                healthElem.style.width = `${player.health}%`;
            }
            
            if (ammoElem) {
                ammoElem.textContent = player.musket.loaded ? 'READY TO FIRE' : 'EMPTY - RELOAD REQUIRED';
                ammoElem.style.color = player.musket.loaded ? '#90ee90' : '#ff6b6b';
            }
            
            if (reloadElem) {
                reloadElem.textContent = player.musket.reloadStep > 0 ? 
                    `RELOADING: Step ${player.musket.reloadStep}/5` : '';
            }
        });
    }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new DuelingMusketsGame();
});