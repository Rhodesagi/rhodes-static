// THE DUELING MUSKETS - Three.js FPS Game
// 2-player same-computer musket duel with realistic reloading

// Game constants
const GAME = {
    WIDTH: window.innerWidth,
    HEIGHT: window.innerHeight,
    ASPECT: window.innerWidth / window.innerHeight,
    MOVEMENT_SPEED: 0.2,
    TURN_SPEED: 0.03,
    MUSKET_TILT_SPEED: 0.05,
    GRAVITY: 0.02,
    BULLET_SPEED: 2.5,
    BULLET_LIFETIME: 200, // frames
    RELOAD_TIME: 3000, // ms for full reload sequence
    RESPAWN_TIME: 3000, // ms
    WIN_SCORE: 10,
    PLAYER_HEALTH: 100,
    DAMAGE_PER_SHOT: 34,
    ARENA_SIZE: 50
};

// Game state
let scene, camera, renderer, controls;
let players = [];
let bullets = [];
let keys = {};
let clock = new THREE.Clock();
let gameRunning = true;
let scores = [0, 0]; // Player 1, Player 2
let currentPlayerIndex = 0; // Which player's reload UI to show (0 for P1, 1 for P2)
let reloadStates = [{step: 0, progress: 0, isReloading: false}, {step: 0, progress: 0, isReloading: false}];
let aimStates = [false, false];
let ironSightElement, reloadTextElement, reloadFillElement, reloadStepsElement;
let score1Element, score2Element, hitMarkerElement, deathScreenElement, winnerScreenElement;

// Reload steps with descriptions and times
const RELOAD_STEPS = [
    {name: "Prime pan", time: 800},
    {name: "Load powder", time: 1000},
    {name: "Ram ball", time: 1200},
    {name: "Ready", time: 0}
];

class Player {
    constructor(id, color, startPosition, controls) {
        this.id = id;
        this.color = color;
        this.position = new THREE.Vector3(startPosition.x, 1.5, startPosition.z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = 0;
        this.health = GAME.PLAYER_HEALTH;
        this.isAlive = true;
        this.respawnTimer = 0;
        
        // Musket properties
        this.musketAngle = 0; // Tilt angle
        this.musketRecoil = 0;
        this.isLoaded = true;
        this.isAiming = false;
        
        // Controls mapping
        this.controls = controls;
        
        // Create visual representation
        this.createMesh();
        
        // Create musket mesh
        this.createMusket();
    }
    
    createMesh() {
        // Player body (cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({color: this.color});
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.copy(this.position);
        scene.add(this.body);
        
        // Player head (sphere)
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const headMaterial = new THREE.MeshPhongMaterial({color: this.color});
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.set(0, 0.9, 0);
        this.body.add(this.head);
    }
    
    createMusket() {
        // Musket group
        this.musket = new THREE.Group();
        
        // Musket barrel (long box)
        const barrelGeometry = new THREE.BoxGeometry(1.5, 0.05, 0.05);
        const barrelMaterial = new THREE.MeshPhongMaterial({color: 0x333333});
        this.barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        this.barrel.position.set(0.75, 0, 0);
        this.musket.add(this.barrel);
        
        // Musket stock (shorter box)
        const stockGeometry = new THREE.BoxGeometry(0.8, 0.08, 0.1);
        const stockMaterial = new THREE.MeshPhongMaterial({color: 0x8B4513});
        this.stock = new THREE.Mesh(stockGeometry, stockMaterial);
        this.stock.position.set(-0.4, -0.02, 0);
        this.musket.add(this.stock);
        
        // Hammer (for flintlock)
        const hammerGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.05);
        const hammerMaterial = new THREE.MeshPhongMaterial({color: 0x666666});
        this.hammer = new THREE.Mesh(hammerGeometry, hammerMaterial);
        this.hammer.position.set(0.2, 0.05, 0);
        this.musket.add(this.hammer);
        
        // Position musket relative to player
        this.musket.position.set(0.3, 0.5, 0.3);
        this.musket.rotation.y = Math.PI / 4; // Angle it outward
        
        this.body.add(this.musket);
    }
    
    update(delta) {
        if (!this.isAlive) {
            this.respawnTimer -= delta * 1000;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }
        
        // Apply gravity
        this.velocity.y -= GAME.GRAVITY;
        
        // Movement
        let moveX = 0, moveZ = 0;
        
        if (this.controls.moveForward && keys[this.controls.moveForward]) moveZ -= 1;
        if (this.controls.moveBackward && keys[this.controls.moveBackward]) moveZ += 1;
        if (this.controls.moveLeft && keys[this.controls.moveLeft]) moveX -= 1;
        if (this.controls.moveRight && keys[this.controls.moveRight]) moveX += 1;
        
        // Normalize diagonal movement
        if (moveX !== 0 && moveZ !== 0) {
            moveX *= 0.7071;
            moveZ *= 0.7071;
        }
        
        // Calculate movement vector based on rotation
        const moveVector = new THREE.Vector3(moveX, 0, moveZ);
        moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
        moveVector.multiplyScalar(GAME.MOVEMENT_SPEED);
        
        this.velocity.x = moveVector.x;
        this.velocity.z = moveVector.z;
        
        // Apply velocity
        this.position.x += this.velocity.x;
        this.position.z += this.velocity.z;
        
        // Keep within arena bounds
        this.position.x = THREE.MathUtils.clamp(this.position.x, -GAME.ARENA_SIZE/2, GAME.ARENA_SIZE/2);
        this.position.z = THREE.MathUtils.clamp(this.position.z, -GAME.ARENA_SIZE/2, GAME.ARENA_SIZE/2);
        
        // Update body position
        this.body.position.copy(this.position);
        this.body.rotation.y = this.rotation;
        
        // Handle musket tilt
        let tiltChange = 0;
        if (keys[this.controls.tiltLeft]) tiltChange -= GAME.MUSKET_TILT_SPEED;
        if (keys[this.controls.tiltRight]) tiltChange += GAME.MUSKET_TILT_SPEED;
        
        this.musketAngle = THREE.MathUtils.clamp(this.musketAngle + tiltChange, -Math.PI/6, Math.PI/6);
        
        // Apply recoil recovery
        if (this.musketRecoil > 0) {
            this.musketRecoil -= delta * 10;
            if (this.musketRecoil < 0) this.musketRecoil = 0;
        }
        
        // Update musket rotation (tilt + recoil)
        this.musket.rotation.x = this.musketAngle + this.musketRecoil;
        
        // Update aiming state
        if (this.controls.aim && keys[this.controls.aim]) {
            this.isAiming = true;
        } else {
            this.isAiming = false;
        }
        
        // Update UI for current player
        if (players[currentPlayerIndex] === this) {
            updateReloadUI();
            updateIronSight();
        }
    }
    
    fire() {
        if (!this.isAlive || !this.isLoaded || reloadStates[this.id].isReloading) return false;
        
        // Create bullet from musket barrel end
        const bulletDirection = new THREE.Vector3(1, 0, 0);
        bulletDirection.applyQuaternion(this.body.quaternion);
        bulletDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.musketAngle);
        
        const barrelEnd = new THREE.Vector3(0.3, 0.5, 0.3);
        barrelEnd.applyQuaternion(this.body.quaternion);
        barrelEnd.add(this.position);
        
        bullets.push(new Bullet(
            barrelEnd,
            bulletDirection,
            this.id
        ));
        
        // Apply recoil
        this.musketRecoil = 0.3;
        
        // Musket is now unloaded
        this.isLoaded = false;
        
        // Show hit marker for shooter (visual feedback)
        if (players[currentPlayerIndex] === this) {
            showHitMarker();
        }
        
        return true;
    }
    
    startReload() {
        if (!this.isAlive || this.isLoaded || reloadStates[this.id].isReloading) return;
        
        reloadStates[this.id] = {
            step: 0,
            progress: 0,
            isReloading: true,
            startTime: Date.now(),
            stepStartTime: Date.now()
        };
    }
    
    updateReload(delta) {
        const state = reloadStates[this.id];
        if (!state.isReloading) return;
        
        const now = Date.now();
        const elapsed = now - state.stepStartTime;
        const stepTime = RELOAD_STEPS[state.step].time;
        
        if (stepTime > 0) {
            state.progress = Math.min(elapsed / stepTime, 1);
            
            if (elapsed >= stepTime) {
                // Move to next step
                state.step++;
                state.stepStartTime = now;
                state.progress = 0;
                
                if (state.step >= RELOAD_STEPS.length - 1) {
                    // Reload complete
                    state.isReloading = false;
                    this.isLoaded = true;
                }
            }
        }
    }
    
    takeDamage(amount, attackerId) {
        this.health -= amount;
        
        if (this.health <= 0 && this.isAlive) {
            this.die();
            // Award point to attacker
            if (attackerId >= 0 && attackerId < scores.length) {
                scores[attackerId]++;
                updateScoreUI();
                
                if (scores[attackerId] >= GAME.WIN_SCORE) {
                    endGame(attackerId);
                }
            }
        }
    }
    
    die() {
        this.isAlive = false;
        this.respawnTimer = GAME.RESPAWN_TIME;
        
        // Hide player
        this.body.visible = false;
        
        // Show death screen if this is the current player
        if (players[currentPlayerIndex] === this) {
            showDeathScreen();
        }
    }
    
    respawn() {
        this.isAlive = true;
        this.health = GAME.PLAYER_HEALTH;
        
        // Reset position (opposite side of arena)
        this.position.x = (this.id === 0 ? -15 : 15);
        this.position.z = 0;
        this.position.y = 1.5;
        
        // Reset velocity
        this.velocity.set(0, 0, 0);
        
        // Reset musket
        this.isLoaded = true;
        this.musketAngle = 0;
        this.musketRecoil = 0;
        
        // Make visible
        this.body.visible = true;
        this.body.position.copy(this.position);
        
        // Hide death screen if this is the current player
        if (players[currentPlayerIndex] === this) {
            hideDeathScreen();
        }
    }
}

class Bullet {
    constructor(position, direction, shooterId) {
        this.position = position.clone();
        this.direction = direction.clone().normalize();
        this.velocity = this.direction.multiplyScalar(GAME.BULLET_SPEED);
        this.shooterId = shooterId;
        this.lifetime = GAME.BULLET_LIFETIME;
        
        // Create visual
        const geometry = new THREE.SphereGeometry(0.05, 4, 4);
        const material = new THREE.MeshBasicMaterial({color: 0xFFFF00});
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        scene.add(this.mesh);
    }
    
    update() {
        this.position.add(this.velocity);
        this.mesh.position.copy(this.position);
        
        this.lifetime--;
        
        // Check collision with players
        for (let player of players) {
            if (player.isAlive && player.id !== this.shooterId) {
                const distance = this.position.distanceTo(player.position);
                if (distance < 0.5) {
                    player.takeDamage(GAME.DAMAGE_PER_SHOT, this.shooterId);
                    this.destroy();
                    return false;
                }
            }
        }
        
        // Check arena bounds
        if (Math.abs(this.position.x) > GAME.ARENA_SIZE/2 || 
            Math.abs(this.position.z) > GAME.ARENA_SIZE/2 ||
            this.lifetime <= 0) {
            this.destroy();
            return false;
        }
        
        return true;
    }
    
    destroy() {
        scene.remove(this.mesh);
    }
}

// Initialize game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, GAME.ASPECT, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    const canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({canvas, antialias: true});
    renderer.setSize(GAME.WIDTH, GAME.HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Create arena
    createArena();
    
    // Create players
    players.push(new Player(0, 0xFF4444, {x: -15, z: 0}, {
        moveForward: 'KeyW',
        moveBackward: 'KeyS',
        moveLeft: 'KeyA',
        moveRight: 'KeyD',
        tiltLeft: 'KeyQ',
        tiltRight: 'KeyE',
        reload: 'KeyR',
        aim: 'KeyX',
        fire: 'KeyF'
    }));
    
    players.push(new Player(1, 0x4444FF, {x: 15, z: 0}, {
        moveForward: 'ArrowUp',
        moveBackward: 'ArrowDown',
        moveLeft: 'ArrowLeft',
        moveRight: 'ArrowRight',
        tiltLeft: 'KeyU',
        tiltRight: 'KeyO',
        reload: 'KeyI',
        aim: 'KeyM',
        fire: 'KeyN'
    }));
    
    // Get UI elements
    ironSightElement = document.getElementById('ironSight');
    reloadTextElement = document.getElementById('reloadText');
    reloadFillElement = document.getElementById('reloadFill');
    reloadStepsElement = document.getElementById('reloadSteps');
    score1Element = document.getElementById('score1');
    score2Element = document.getElementById('score2');
    hitMarkerElement = document.getElementById('hitMarker');
    deathScreenElement = document.getElementById('deathScreen');
    winnerScreenElement = document.getElementById('winnerScreen');
    
    // Set up event listeners
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
    
    // Add click to switch player view
    document.addEventListener('click', switchPlayerView);
    
    // Start game loop
    animate();
}

function createArena() {
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(GAME.ARENA_SIZE, GAME.ARENA_SIZE);
    const groundMaterial = new THREE.MeshPhongMaterial({color: 0x3A7D3A});
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Boundary walls
    const wallMaterial = new THREE.MeshPhongMaterial({color: 0x8B7355});
    
    // North wall
    const northWall = new THREE.Mesh(
        new THREE.BoxGeometry(GAME.ARENA_SIZE, 3, 0.5),
        wallMaterial
    );
    northWall.position.set(0, 1.5, -GAME.ARENA_SIZE/2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);
    
    // South wall
    const southWall = northWall.clone();
    southWall.position.set(0, 1.5, GAME.ARENA_SIZE/2);
    scene.add(southWall);
    
    // East wall
    const eastWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 3, GAME.ARENA_SIZE),
        wallMaterial
    );
    eastWall.position.set(GAME.ARENA_SIZE/2, 1.5, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);
    
    // West wall
    const westWall = eastWall.clone();
    westWall.position.set(-GAME.ARENA_SIZE/2, 1.5, 0);
    scene.add(westWall);
    
    // Obstacles
    const obstacleMaterial = new THREE.MeshPhongMaterial({color: 0x7A6C5D});
    
    // Center obstacle
    const centerObstacle = new THREE.Mesh(
        new THREE.BoxGeometry(5, 2, 5),
        obstacleMaterial
    );
    centerObstacle.position.set(0, 1, 0);
    centerObstacle.castShadow = true;
    centerObstacle.receiveShadow = true;
    scene.add(centerObstacle);
    
    // Side obstacles
    for (let i = 0; i < 4; i++) {
        const obstacle = new THREE.Mesh(
            new THREE.BoxGeometry(3, 1.5, 3),
            obstacleMaterial
        );
        const angle = (i / 4) * Math.PI * 2;
        const radius = 12;
        obstacle.position.set(
            Math.cos(angle) * radius,
            0.75,
            Math.sin(angle) * radius
        );
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
        scene.add(obstacle);
    }
}

function updateReloadUI() {
    const state = reloadStates[currentPlayerIndex];
    const player = players[currentPlayerIndex];
    
    if (state.isReloading) {
        const step = RELOAD_STEPS[state.step];
        reloadTextElement.textContent = `Reloading: ${step.name}`;
        reloadFillElement.style.width = `${state.progress * 100}%`;
        reloadStepsElement.textContent = `Step ${state.step + 1}/${RELOAD_STEPS.length}`;
    } else if (player.isLoaded) {
        reloadTextElement.textContent = 'Ready to fire';
        reloadFillElement.style.width = '100%';
        reloadStepsElement.textContent = 'Musket loaded';
    } else {
        reloadTextElement.textContent = 'Not loaded - Press R to reload';
        reloadFillElement.style.width = '0%';
        reloadStepsElement.textContent = 'Need to reload';
    }
}

function updateIronSight() {
    const player = players[currentPlayerIndex];
    if (player.isAiming && player.isAlive) {
        ironSightElement.style.opacity = '1';
    } else {
        ironSightElement.style.opacity = '0';
    }
}

function updateScoreUI() {
    score1Element.textContent = scores[0];
    score2Element.textContent = scores[1];
}

function showHitMarker() {
    hitMarkerElement.style.opacity = '1';
    setTimeout(() => {
        hitMarkerElement.style.opacity = '0';
    }, 300);
}

function showDeathScreen() {
    deathScreenElement.style.display = 'flex';
}

function hideDeathScreen() {
    deathScreenElement.style.display = 'none';
}

function endGame(winnerId) {
    gameRunning = false;
    winnerScreenElement.textContent = `PLAYER ${winnerId + 1} WINS!`;
    winnerScreenElement.style.display = 'flex';
    
    setTimeout(() => {
        location.reload();
    }, 5000);
}

function switchPlayerView() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    updateReloadUI();
    updateIronSight();
}

// Event handlers
function onKeyDown(event) {
    keys[event.code] = true;
    
    // Handle reload for both players
    if (event.code === 'KeyR' && players[0].isAlive && !players[0].isLoaded && !reloadStates[0].isReloading) {
        players[0].startReload();
    }
    if (event.code === 'KeyI' && players[1].isAlive && !players[1].isLoaded && !reloadStates[1].isReloading) {
        players[1].startReload();
    }
    
    // Handle firing
    if (event.code === 'KeyF') {
        players[0].fire();
    }
    if (event.code === 'KeyN') {
        players[1].fire();
    }
}

function onKeyUp(event) {
    keys[event.code] = false;
}

function onWindowResize() {
    GAME.WIDTH = window.innerWidth;
    GAME.HEIGHT = window.innerHeight;
    GAME.ASPECT = GAME.WIDTH / GAME.HEIGHT;
    
    camera.aspect = GAME.ASPECT;
    camera.updateProjectionMatrix();
    renderer.setSize(GAME.WIDTH, GAME.HEIGHT);
}

// Game loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Update players
    for (let player of players) {
        player.update(delta);
        player.updateReload(delta);
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (!bullets[i].update()) {
            bullets.splice(i, 1);
        }
    }
    
    // Update camera to follow current player
    if (players[currentPlayerIndex].isAlive) {
        const player = players[currentPlayerIndex];
        const offset = new THREE.Vector3(0, 3, -5);
        
        if (player.isAiming) {
            // First-person view when aiming
            camera.position.copy(player.position);
            camera.position.y += 1.6; // Eye height
            camera.rotation.copy(player.body.rotation);
            camera.rotation.x += player.musketAngle;
            
            // Move camera forward slightly (through musket)
            const forward = new THREE.Vector3(0, 0, -0.2);
            forward.applyQuaternion(camera.quaternion);
            camera.position.add(forward);
        } else {
            // Third-person view
            offset.applyQuaternion(player.body.quaternion);
            camera.position.copy(player.position).add(offset);
            camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
        }
    }
    
    renderer.render(scene, camera);
}

// Start the game when page loads
window.addEventListener('DOMContentLoaded', init);