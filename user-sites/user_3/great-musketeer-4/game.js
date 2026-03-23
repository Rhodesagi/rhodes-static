// Le Musket Quatre - Great Musketeer 4
// A 2-player same-computer FPS musket game

// Game Constants
const GAME_SETTINGS = {
    GRAVITY: 9.8,
    PLAYER_SPEED: 5,
    JUMP_FORCE: 10,
    MUSKET_TILT_SPEED: 2,
    RELOAD_TIME: 3000, // 3 seconds for full reload
    BULLET_SPEED: 100,
    BULLET_DAMAGE: 35,
    MAX_HEALTH: 100,
    AMMO_CAPACITY: 1, // Muskets are single-shot
    RESPAWN_TIME: 5000
};

// Game State
const gameState = {
    players: {
        player1: {
            health: GAME_SETTINGS.MAX_HEALTH,
            ammo: GAME_SETTINGS.AMMO_CAPACITY,
            reserveAmmo: 10,
            position: { x: -10, y: 2, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            isAiming: false,
            isReloading: false,
            reloadProgress: 0,
            musketTilt: 0,
            isGrounded: true,
            lastShot: 0,
            isDead: false,
            respawnTimer: 0
        },
        player2: {
            health: GAME_SETTINGS.MAX_HEALTH,
            ammo: GAME_SETTINGS.AMMO_CAPACITY,
            reserveAmmo: 10,
            position: { x: 10, y: 2, z: 0 },
            rotation: { x: 0, y: Math.PI, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            isAiming: false,
            isReloading: false,
            reloadProgress: 0,
            musketTilt: 0,
            isGrounded: true,
            lastShot: 0,
            isDead: false,
            respawnTimer: 0
        }
    },
    bullets: [],
    gameTime: 0,
    keysPressed: {}
};

// Three.js Scene Setup
let scene1, scene2;
let camera1, camera2;
let renderer1, renderer2;
let controls1, controls2;

// 3D Objects
let player1Mesh, player2Mesh;
let musket1Mesh, musket2Mesh;
let groundMesh;
let obstacles = [];

// Initialize the game
function initGame() {
    console.log("Initializing Le Musket Quatre...");
    
    // Create scenes
    scene1 = new THREE.Scene();
    scene2 = new THREE.Scene();
    
    scene1.background = new THREE.Color(0x87CEEB); // Sky blue
    scene2.background = new THREE.Color(0x87CEEB);
    
    // Add fog for atmosphere
    scene1.fog = new THREE.Fog(0x87CEEB, 1, 100);
    scene2.fog = new THREE.Fog(0x87CEEB, 1, 100);
    
    // Create cameras
    camera1 = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight * 2), 0.1, 1000);
    camera1.position.set(0, 2, 5);
    
    camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight * 2), 0.1, 1000);
    camera2.position.set(0, 2, 5);
    
    // Create renderers
    const canvas1 = document.getElementById('player1-canvas');
    const canvas2 = document.getElementById('player2-canvas');
    
    renderer1 = new THREE.WebGLRenderer({ canvas: canvas1, antialias: true });
    renderer1.setSize(window.innerWidth / 2, window.innerHeight);
    
    renderer2 = new THREE.WebGLRenderer({ canvas: canvas2, antialias: true });
    renderer2.setSize(window.innerWidth / 2, window.innerHeight);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene1.add(ambientLight.clone());
    scene2.add(ambientLight.clone());
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    scene1.add(directionalLight.clone());
    scene2.add(directionalLight.clone());
    
    // Create ground
    createGround();
    
    // Create players and muskets
    createPlayers();
    
    // Create obstacles/environment
    createEnvironment();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start game loop
    animate();
    
    console.log("Game initialized!");
}

function createGround() {
    // Ground geometry
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x3a7c3a,
        side: THREE.DoubleSide
    });
    
    groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    
    scene1.add(groundMesh.clone());
    scene2.add(groundMesh.clone());
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x888888);
    gridHelper.position.y = 0.01;
    scene1.add(gridHelper.clone());
    scene2.add(gridHelper.clone());
}

function createPlayers() {
    // Player 1 body (simple cylinder)
    const playerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
    const playerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    player1Mesh = new THREE.Mesh(playerGeometry, playerMaterial);
    player1Mesh.position.copy(gameState.players.player1.position);
    scene1.add(player1Mesh);
    
    // Player 2 body
    player2Mesh = new THREE.Mesh(playerGeometry, playerMaterial.clone());
    player2Mesh.material.color.setHex(0x0000ff);
    player2Mesh.position.copy(gameState.players.player2.position);
    scene2.add(player2Mesh);
    
    // Muskets
    createMusket(1);
    createMusket(2);
}

function createMusket(playerNum) {
    // Create a simple musket model
    const group = new THREE.Group();
    
    // Barrel (long cylinder)
    const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.x = 0.75;
    group.add(barrel);
    
    // Stock (box)
    const stockGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.5);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.x = -0.3;
    stock.position.y = -0.05;
    group.add(stock);
    
    // Hammer (small box)
    const hammerGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.05);
    const hammerMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const hammer = new THREE.Mesh(hammerGeometry, hammerMaterial);
    hammer.position.x = 0.1;
    hammer.position.y = 0.05;
    group.add(hammer);
    
    // Position the musket
    group.position.y = 1.5;
    group.position.z = -0.5;
    
    if (playerNum === 1) {
        musket1Mesh = group;
        player1Mesh.add(musket1Mesh);
    } else {
        musket2Mesh = group;
        player2Mesh.add(musket2Mesh);
    }
}

function createEnvironment() {
    // Add some trees and obstacles
    for (let i = 0; i < 10; i++) {
        createTree(-30 + i * 6, 0, -10 + (i % 3) * 10);
        createTree(30 - i * 6, 0, -10 + (i % 3) * 10);
    }
    
    // Add some rocks
    for (let i = 0; i < 5; i++) {
        createRock(-20 + i * 8, 0, 5);
        createRock(20 - i * 8, 0, 5);
    }
}

function createTree(x, y, z) {
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, y + 1.5, z);
    
    // Foliage (sphere)
    const foliageGeometry = new THREE.SphereGeometry(2, 8, 8);
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(x, y + 4, z);
    
    scene1.add(trunk.clone());
    scene1.add(foliage.clone());
    scene2.add(trunk.clone());
    scene2.add(foliage.clone());
    
    obstacles.push({ position: { x, y: y + 1.5, z }, radius: 1.5 });
}

function createRock(x, y, z) {
    const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
    const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, y + 1, z);
    rock.scale.set(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5);
    
    scene1.add(rock.clone());
    scene2.add(rock.clone());
    
    obstacles.push({ position: { x, y: y + 1, z }, radius: 1 });
}


function setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', (event) => {
        gameState.keysPressed[event.key.toLowerCase()] = true;
        handleKeyPress(event.key.toLowerCase(), true);
    });
    
    window.addEventListener('keyup', (event) => {
        gameState.keysPressed[event.key.toLowerCase()] = false;
        handleKeyPress(event.key.toLowerCase(), false);
    });
    
    // Window resize
    window.addEventListener('resize', onWindowResize);
}

function handleKeyPress(key, isDown) {
    // Player 1 controls
    if (key === 'x') {
        gameState.players.player1.isAiming = isDown;
        updateIronSight(1, isDown);
    }
    
    if (key === 'r' && isDown && !gameState.players.player1.isReloading && gameState.players.player1.ammo < GAME_SETTINGS.AMMO_CAPACITY) {
        startReload(1);
    }
    
    if (key === 'f' && isDown && gameState.players.player1.ammo > 0 && !gameState.players.player1.isReloading) {
        shoot(1);
    }
    
    // Player 2 controls
    if (key === 'b') {
        gameState.players.player2.isAiming = isDown;
        updateIronSight(2, isDown);
    }
    
    if (key === 'l' && isDown && !gameState.players.player2.isReloading && gameState.players.player2.ammo < GAME_SETTINGS.AMMO_CAPACITY) {
        startReload(2);
    }
    
    if (key === 'k' && isDown && gameState.players.player2.ammo > 0 && !gameState.players.player2.isReloading) {
        shoot(2);
    }
}

function updateIronSight(playerNum, show) {
    const sightElement = document.getElementById(`player${playerNum}-iron-sight`);
    const crosshairElement = document.getElementById(`player${playerNum}-crosshair`);
    
    if (show) {
        sightElement.style.display = 'block';
        crosshairElement.style.display = 'none';
    } else {
        sightElement.style.display = 'none';
        crosshairElement.style.display = 'block';
    }
}

function startReload(playerNum) {
    const player = gameState.players[`player${playerNum}`];
    
    if (player.reserveAmmo <= 0) {
        console.log(`Player ${playerNum}: No ammo in reserve!`);
        return;
    }
    
    player.isReloading = true;
    player.reloadProgress = 0;
    
    // Show reload indicator
    const indicator = document.getElementById('reload-indicator');
    const text = document.getElementById('reload-text');
    text.textContent = `PLAYER ${playerNum} RELOADING`;
    indicator.style.display = 'block';
    
    // Start reload animation
    animateReload(playerNum);
}

function animateReload(playerNum) {
    const player = gameState.players[`player${playerNum}`];
    const musketMesh = playerNum === 1 ? musket1Mesh : musket2Mesh;
    
    // Animate musket tilt for reloading motion
    const reloadInterval = setInterval(() => {
        if (!player.isReloading) {
            clearInterval(reloadInterval);
            return;
        }
        
        player.reloadProgress += 16; // ~60 FPS
        
        // Animate musket movements during reload
        const progress = player.reloadProgress / GAME_SETTINGS.RELOAD_TIME;
        
        // Stage 1: Tilt musket down
        if (progress < 0.2) {
            musketMesh.rotation.x = -progress * 5;
        }
        // Stage 2: Simulate loading (musket moves)
        else if (progress < 0.4) {
            musketMesh.position.z = -0.5 + (progress - 0.2) * 2;
        }
        // Stage 3: Tilt back up
        else if (progress < 0.6) {
            musketMesh.rotation.x = -(0.4 - (progress - 0.4)) * 5;
            musketMesh.position.z = -0.5;
        }
        // Stage 4: Prime the hammer
        else if (progress < 0.8) {
            // Simulate hammer cocking
            if (musketMesh.children[2]) {
                musketMesh.children[2].rotation.x = (progress - 0.6) * 2;
            }
        }
        // Stage 5: Ready position
        else if (progress < 1.0) {
            // Return to normal
            musketMesh.rotation.x = 0;
            if (musketMesh.children[2]) {
                musketMesh.children[2].rotation.x = 0.4;
            }
        }
        
        // Update progress bar
        const progressBar = document.getElementById('reload-progress');
        progressBar.style.width = `${progress * 100}%`;
        progressBar.style.height = '10px';
        progressBar.style.background = 'linear-gradient(to right, #ff0000, #ffff00, #00ff00)';
        progressBar.style.borderRadius = '5px';
        
        // Complete reload
        if (player.reloadProgress >= GAME_SETTINGS.RELOAD_TIME) {
            completeReload(playerNum);
            clearInterval(reloadInterval);
        }
    }, 16);
}

function completeReload(playerNum) {
    const player = gameState.players[`player${playerNum}`];
    
    player.isReloading = false;
    player.reloadProgress = 0;
    player.ammo = GAME_SETTINGS.AMMO_CAPACITY;
    player.reserveAmmo--;
    
    // Hide reload indicator
    document.getElementById('reload-indicator').style.display = 'none';
    
    // Reset musket position
    const musketMesh = playerNum === 1 ? musket1Mesh : musket2Mesh;
    musketMesh.rotation.x = 0;
    musketMesh.position.z = -0.5;
    if (musketMesh.children[2]) {
        musketMesh.children[2].rotation.x = 0;
    }
    
    // Update UI
    updatePlayerUI(playerNum);
    
    console.log(`Player ${playerNum}: Reload complete! Ammo: ${player.ammo}/${player.reserveAmmo}`);
}

