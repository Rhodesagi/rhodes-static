// Dueling Muskets - Two Player FPS
// Split-screen musket duel with iron sights and full reload animation

let game = null;

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    game = new Game();
    game.init();
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = null;
        this.scene = null;
        this.players = [];
        this.bullets = [];
        this.walls = [];
        this.keys = {};
        
        // Game state
        this.gameActive = false;
        this.roundTime = 0;
        
        // Mouse tracking for each player viewport
        this.mousePos = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        this.player1Mouse = { x: 0, y: 0, active: false };
        this.player2Mouse = { x: 0, y: 0, active: false };
        
        // Audio context for sound
        this.audioContext = null;
    }
    
    init() {
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true 
        });
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 50);
        
        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);
        
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(10, 20, 10);
        this.scene.add(sun);
        
        // Create arena
        this.createArena();
        
        // Create players
        const p1Start = new THREE.Vector3(-8, 0, 0);
        const p2Start = new THREE.Vector3(8, 0, 0);
        
        this.player1 = new Player(1, p1Start, 0x8B0000); // Red coat
        this.player2 = new Player(2, p2Start, 0x00008B); // Blue coat
        
        this.players.push(this.player1, this.player2);
        
        // Add player models to scene
        this.scene.add(this.player1.model);
        this.scene.add(this.player2.model);
        
        // Add muskets to scene
        this.scene.add(this.player1.musket.mesh);
        this.scene.add(this.player2.musket.mesh);
        
        // Setup input
        this.setupInput();
        
        // Start loop
        this.gameActive = true;
        this.lastTime = performance.now();
        requestAnimationFrame(() => this.loop());
    }
    
    createArena() {
        // Ground
        const groundGeo = new THREE.PlaneGeometry(40, 40);
        const groundMat = new THREE.MeshLambertMaterial({ 
            color: 0x3d5c3d,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);
        
        // Dueling field markings
        const lineGeo = new THREE.PlaneGeometry(0.2, 20);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        
        const line1 = new THREE.Mesh(lineGeo, lineMat);
        line1.rotation.x = -Math.PI / 2;
        line1.position.set(-5, 0.01, 0);
        this.scene.add(line1);
        
        const line2 = new THREE.Mesh(lineGeo, lineMat);
        line2.rotation.x = -Math.PI / 2;
        line2.position.set(5, 0.01, 0);
        this.scene.add(line2);
        
        // Center line
        const centerGeo = new THREE.PlaneGeometry(0.1, 30);
        const centerLine = new THREE.Mesh(centerGeo, lineMat);
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.set(0, 0.01, 0);
        this.scene.add(centerLine);
        
        // Barriers/walls
        this.createBarriers();
        
        // Sky
        this.scene.background = new THREE.Color(0x87CEEB);
    }
    
    createBarriers() {
        // Stone walls for cover
        const wallPositions = [
            { x: 0, z: -12, w: 4, h: 2 },
            { x: 0, z: 12, w: 4, h: 2 },
            { x: -12, z: -8, w: 2, h: 3 },
            { x: 12, z: 8, w: 2, h: 3 },
            { x: -12, z: 8, w: 2, h: 3 },
            { x: 12, z: -8, w: 2, h: 3 },
        ];
        
        const wallMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        
        for (const pos of wallPositions) {
            const geo = new THREE.BoxGeometry(pos.w, pos.h, 0.5);
            const wall = new THREE.Mesh(geo, wallMat);
            wall.position.set(pos.x, pos.h / 2, pos.z);
            this.scene.add(wall);
            
            // Add to collision array
            this.walls.push({
                x: pos.x,
                z: pos.z,
                y: pos.h / 2,
                radius: Math.max(pos.w, pos.h) / 2 + 0.3
            });
        }
        
        // Arena boundaries
        this.walls.push({ x: 0, z: -20, y: 1, radius: 1 }); // North
        this.walls.push({ x: 0, z: 20, y: 1, radius: 1 });  // South
        this.walls.push({ x: -20, z: 0, y: 1, radius: 1 }); // West
        this.walls.push({ x: 20, z: 0, y: 1, radius: 1 });  // East
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.handleKeyDown(e);
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.handleKeyUp(e);
        });
        
        // Mouse movement for looking
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Determine which viewport the mouse is in
            const height = rect.height;
            const inTopHalf = y < height / 2;
            
            if (inTopHalf) {
                // Player 1 viewport (top half when split horizontally)
                this.player1Mouse.x = x;
                this.player1Mouse.y = y;
                this.player1Mouse.active = true;
            } else {
                // Player 2 viewport
                this.player2Mouse.x = x;
                this.player2Mouse.y = y;
                this.player2Mouse.active = true;
            }
            
            // Calculate delta from last position for look
            const dx = e.movementX || 0;
            const dy = e.movementY || 0;
            
            if (inTopHalf && document.pointerLockElement === this.canvas) {
                this.player1.look(dx, dy);
            } else if (!inTopHalf && document.pointerLockElement === this.canvas) {
                this.player2.look(dx, dy);
            }
        });
        
        // Click to lock pointer for mouse look
        this.canvas.addEventListener('click', () => {
            if (document.pointerLockElement !== this.canvas) {
                this.canvas.requestPointerLock();
            }
        });
    }
    
    handleKeyDown(e) {
        // Player 1 controls
        if (this.player1 && this.player1.alive) {
            switch(e.key.toLowerCase()) {
                case 'x':
                    this.player1.aim(true);
                    break;
                case 'f':
                    this.fireShot(this.player1);
                    break;
                case 'r':
                    if (this.player1.reload()) {
                        this.showReloadIndicator(1);
                    }
                    break;
            }
        }
        
        // Player 2 controls
        if (this.player2 && this.player2.alive) {
            switch(e.key) {
                case 'Enter':
                case ' ':
                    this.player2.aim(true);
                    break;
                case '\\':
                case 'Backspace':
                    this.fireShot(this.player2);
                    break;
                case ']':
                    if (this.player2.reload()) {
                        this.showReloadIndicator(2);
                    }
                    break;
            }
        }
    }
    
    handleKeyUp(e) {
        if (this.player1) {
            switch(e.key.toLowerCase()) {
                case 'x':
                    this.player1.aim(false);
                    break;
            }
        }
        
        if (this.player2) {
            switch(e.key) {
                case 'Enter':
                case ' ':
                    this.player2.aim(false);
                    break;
            }
        }
    }
    
    showReloadIndicator(playerId) {
        const el = document.getElementById(`p${playerId}-reload`);
        if (el) {
            el.style.display = 'block';
            setTimeout(() => {
                el.style.display = 'none';
            }, 4000);
        }
    }
    
    fireShot(player) {
        const shot = player.fire();
        if (shot) {
            // Create bullet with projectile physics
            const bullet = new Bullet(shot.origin, shot.direction, player.id);
            this.bullets.push(bullet);
            this.scene.add(bullet.mesh);
            
            // Play sound
            this.playMusketSound();
            
            // Spawn smoke at muzzle
            this.spawnSmoke(shot.origin);
        }
    }
    
    playMusketSound() {
        // Simple synthesized gunshot
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.3);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
            
            gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.3);
        } catch(e) {
            console.log('Audio not available');
        }
    }
    
    spawnSmoke(pos) {
        for (let i = 0; i < 5; i++) {
            const smokeGeo = new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 6, 6);
            const smokeMat = new THREE.MeshBasicMaterial({
                color: 0x888888,
                transparent: true,
                opacity: 0.4
            });
            const smoke = new THREE.Mesh(smokeGeo, smokeMat);
            smoke.position.copy(pos);
            smoke.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.1,
                (Math.random() - 0.5) * 0.2
            ));
            this.scene.add(smoke);
            
            // Animate smoke
            let life = 0;
            const animate = () => {
                life += 0.02;
                smoke.position.y += 0.02;
                smoke.position.x += (Math.random() - 0.5) * 0.01;
                smoke.position.z += (Math.random() - 0.5) * 0.01;
                smoke.scale.setScalar(1 + life * 2);
                smoke.material.opacity = Math.max(0, 0.4 - life * 0.3);
                
                if (life < 1.5) {
                    requestAnimationFrame(animate);
                } else {
                    this.scene.remove(smoke);
                }
            };
            animate();
        }
    }
    
    update(dt) {
        this.roundTime += dt;
        
        // Update players
        for (const player of this.players) {
            const reloadStatus = player.update(dt, this.keys, this.walls);
            
            // Check for respawn
            if (!player.alive) {
                player.respawnTimer = (player.respawnTimer || 0) + dt;
                if (player.respawnTimer > 3) {
                    this.respawnPlayer(player);
                }
            }
        }
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            const active = bullet.update(dt);
            
            if (!active) {
                bullet.destroy();
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Check collisions with players
            for (const player of this.players) {
                const collision = bullet.checkCollision(player);
                if (collision.hit) {
                    player.takeDamage(collision.damage);
                    bullet.destroy();
                    this.bullets.splice(i, 1);
                    
                    // Hit effect
                    this.spawnBlood(bullet.position);
                    
                    if (!player.alive) {
                        this.onKill(bullet.shooterId === 1 ? this.player1 : this.player2, player);
                    }
                    break;
                }
            }
            
            // Check wall collisions
            bullet.checkWallCollision(this.walls);
        }
    }
    
    spawnBlood(pos) {
        const bloodGeo = new THREE.PlaneGeometry(0.3, 0.3);
        const bloodMat = new THREE.MeshBasicMaterial({
            color: 0x8B0000,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const blood = new THREE.Mesh(bloodGeo, bloodMat);
        blood.position.copy(pos);
        blood.position.y = 0.02;
        blood.rotation.x = -Math.PI / 2;
        this.scene.add(blood);
        
        // Fade out
        setTimeout(() => {
            this.scene.remove(blood);
        }, 10000);
    }
    
    onKill(killer, victim) {
        // Show kill message
        console.log(`Player ${killer.id} killed Player ${victim.id}`);
    }
    
    respawnPlayer(player) {
        const startPos = player.id === 1 
            ? new THREE.Vector3(-8, 0, 0)
            : new THREE.Vector3(8, 0, 0);
        player.reset(startPos);
        player.respawnTimer = 0;
    }
    
    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear
        this.renderer.setScissorTest(false);
        this.renderer.clear();
        
        // Player 1 viewport (top half)
        this.renderer.setViewport(0, height / 2, width, height / 2);
        this.renderer.setScissor(0, height / 2, width, height / 2);
        this.renderer.setScissorTest(true);
        
        // Hide player 1's model from their own view
        this.player1.model.visible = false;
        this.player2.model.visible = true;
        
        this.renderer.render(this.scene, this.player1.camera);
        
        // Player 2 viewport (bottom half)
        this.renderer.setViewport(0, 0, width, height / 2);
        this.renderer.setScissor(0, 0, width, height / 2);
        
        // Hide player 2's model from their own view
        this.player1.model.visible = true;
        this.player2.model.visible = false;
        
        this.renderer.render(this.scene, this.player2.camera);
        
        // Reset visibility
        this.player1.model.visible = true;
        this.player2.model.visible = true;
    }
    
    loop() {
        if (!this.gameActive) return;
        
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;
        
        this.update(dt);
        this.render();
        
        requestAnimationFrame(() => this.loop());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
}