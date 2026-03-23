// Le Musket Quatre - Two Player First Person Musket Game
// Game initialization and core variables

console.log('Le Musket Quatre loading...');

// Global game state
const game = {
    players: [
        {
            id: 0,
            name: 'Player 1',
            health: 100,
            ammo: 0,
            reloading: false,
            reloadStep: 0,
            aiming: false,
            position: { x: -10, y: 1, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            musketTilt: 0,
            velocity: { x: 0, y: 0, z: 0 },
            onGround: true,
            controls: {
                up: 'KeyW',
                down: 'KeyS',
                left: 'KeyA',
                right: 'KeyD',
                tiltLeft: 'KeyQ',
                tiltRight: 'KeyE',
                reload: 'KeyR',
                fire: 'KeyF',
                aim: 'KeyX'
            }
        },
        {
            id: 1,
            name: 'Player 2',
            health: 100,
            ammo: 0,
            reloading: false,
            reloadStep: 0,
            aiming: false,
            position: { x: 10, y: 1, z: 0 },
            rotation: { x: 0, y: Math.PI, z: 0 },
            musketTilt: 0,
            velocity: { x: 0, y: 0, z: 0 },
            onGround: true,
            controls: {
                up: 'ArrowUp',
                down: 'ArrowDown',
                left: 'ArrowLeft',
                right: 'ArrowRight',
                tiltLeft: 'Numpad4',
                tiltRight: 'Numpad6',
                reload: 'Numpad0',
                fire: 'NumpadDecimal',
                aim: 'Numpad5'
            }
        }
    ],
    bullets: [],
    environments: [],
    gameTime: 0,
    deltaTime: 0,
    lastTime: 0
};

// Three.js scenes, cameras, renderers for each player
const scenes = [];
const cameras = [];
const renderers = [];
const canvasElements = [];

// Initialize Three.js for both players
function initThreeJS() {
    for (let i = 0; i < 2; i++) {
        const canvasId = `player${i+1}Canvas`;
        const canvas = document.getElementById(canvasId);
        canvasElements.push(canvas);
        
        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB); // Sky blue
        scenes.push(scene);
        
        // Camera
        const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        camera.position.set(0, 1.7, 0); // Eye height
        cameras.push(camera);
        
        // Renderer
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderers.push(renderer);
    }
}

// Create game environment
function createEnvironment() {
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x3a7c3a });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    
    scenes.forEach(scene => scene.add(ground.clone()));
    
    // Simple trees/obstacles
    const treeGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
    const treeMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    const leavesGeometry = new THREE.SphereGeometry(2, 8, 8);
    const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });
    
    for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        const radius = 15 + Math.random() * 10;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        const treeTrunk = new THREE.Mesh(treeGeometry, treeMaterial);
        treeTrunk.position.set(x, 2.5, z);
        
        const treeLeaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        treeLeaves.position.set(x, 5, z);
        
        scenes.forEach(scene => {
            scene.add(treeTrunk.clone());
            scene.add(treeLeaves.clone());
        });
    }
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    
    scenes.forEach(scene => {
        scene.add(ambientLight.clone());
        scene.add(directionalLight.clone());
    });
}

// Create musket models
function createMuskets() {
    // Simple musket model
    const musketGroup = new THREE.Group();
    
    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
    const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.z = -0.6;
    musketGroup.add(barrel);
    
    // Stock
    const stockGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.8);
    const stockMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.z = 0.4;
    stock.position.y = -0.05;
    musketGroup.add(stock);
    
    // Hammer
    const hammerGeometry = new THREE.BoxGeometry(0.08, 0.05, 0.1);
    const hammerMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    const hammer = new THREE.Mesh(hammerGeometry, hammerMaterial);
    hammer.position.z = -0.2;
    hammer.position.y = 0.05;
    musketGroup.add(hammer);
    
    // Iron sight (simple)
    const sightGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.05);
    const sightMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
    const sight = new THREE.Mesh(sightGeometry, sightMaterial);
    sight.position.z = -1.1;
    sight.position.y = 0.05;
    musketGroup.add(sight);
    
    musketGroup.position.set(0.3, -0.2, -0.5);
    
    return musketGroup;
}

// Input handling
const keys = {};

function setupInput() {
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        
        // Handle aim toggle for both players
        if (e.code === game.players[0].controls.aim) {
            game.players[0].aiming = !game.players[0].aiming;
            updateIronSight(0);
        }
        if (e.code === game.players[1].controls.aim) {
            game.players[1].aiming = !game.players[1].aiming;
            updateIronSight(1);
        }
        
        // Handle fire
        if (e.code === game.players[0].controls.fire && !game.players[0].reloading && game.players[0].ammo > 0) {
            fireMusket(0);
        }
        if (e.code === game.players[1].controls.fire && !game.players[1].reloading && game.players[1].ammo > 0) {
            fireMusket(1);
        }
        
        // Handle reload start
        if (e.code === game.players[0].controls.reload && !game.players[0].reloading) {
            startReload(0);
        }
        if (e.code === game.players[1].controls.reload && !game.players[1].reloading) {
            startReload(1);
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
}

// Update iron sight display
function updateIronSight(playerId) {
    const sight = document.getElementById('ironSight');
    if (game.players[playerId].aiming) {
        sight.style.display = 'block';
    } else {
        // Only hide if neither player is aiming
        if (!game.players[0].aiming && !game.players[1].aiming) {
            sight.style.display = 'none';
        }
    }
}

// Start reload process
function startReload(playerId) {
    const player = game.players[playerId];
    player.reloading = true;
    player.reloadStep = 0;
    player.ammo = 0;
    
    // Show reload indicator
    const indicator = document.getElementById('reloadIndicator');
    indicator.style.display = 'block';
    
    updateReloadUI(playerId);
    updatePlayerStatus(playerId, 'Reloading...');
}

// Update reload UI
function updateReloadUI(playerId) {
    const player = game.players[playerId];
    
    // Reset all steps
    for (let i = 1; i <= 5; i++) {
        const step = document.getElementById(`step${i}`);
        step.classList.remove('active');
    }
    
    // Highlight current step
    if (player.reloadStep > 0 && player.reloadStep <= 5) {
        const currentStep = document.getElementById(`step${player.reloadStep}`);
        currentStep.classList.add('active');
    }
}

// Update player status display
function updatePlayerStatus(playerId, status) {
    const statusElement = document.getElementById(`p${playerId+1}Status`);
    statusElement.textContent = status;
}

// Fire musket
function fireMusket(playerId) {
    const player = game.players[playerId];
    
    if (player.ammo <= 0 || player.reloading) return;
    
    player.ammo--;
    updateAmmoDisplay(playerId);
    
    // Create bullet
    const bullet = {
        playerId: playerId,
        position: { ...player.position },
        direction: {
            x: Math.sin(player.rotation.y) * Math.cos(player.rotation.x),
            y: -Math.sin(player.rotation.x),
            z: Math.cos(player.rotation.y) * Math.cos(player.rotation.x)
        },
        velocity: 50,
        life: 3.0
    };
    
    // Adjust for musket tilt
    bullet.direction.y += player.musketTilt * 0.1;
    
    game.bullets.push(bullet);
    
    // Recoil effect
    player.rotation.x += 0.05;
    
    updatePlayerStatus(playerId, 'Fired!');
    setTimeout(() => {
        if (!player.reloading) {
            updatePlayerStatus(playerId, 'Ready');
        }
    }, 500);
    
    // Muzzle flash effect (simplified)
    console.log(`Player ${playerId+1} fired!`);
}

// Update ammo display
function updateAmmoDisplay(playerId) {
    const ammoElement = document.getElementById(`p${playerId+1}Ammo`);
    ammoElement.textContent = game.players[playerId].ammo;
}

// Update health display
function updateHealthDisplay(playerId) {
    const healthElement = document.getElementById(`p${playerId+1}Health`);
    healthElement.textContent = game.players[playerId].health;
}

// Game update loop
function updateGame(deltaTime) {
    game.gameTime += deltaTime;
    game.deltaTime = deltaTime;
    
    // Update both players
    for (let i = 0; i < 2; i++) {
        updatePlayer(i, deltaTime);
    }
    
    // Update bullets
    updateBullets(deltaTime);
    
    // Update reload process
    updateReloadProcess(deltaTime);
    
    // Update HUD
    updateHUD();
}

// Update player movement and controls
function updatePlayer(playerId, deltaTime) {
    const player = game.players[playerId];
    const controls = player.controls;
    
    // Movement
    let moveX = 0;
    let moveZ = 0;
    
    if (keys[controls.up]) moveZ -= 1;
    if (keys[controls.down]) moveZ += 1;
    if (keys[controls.left]) moveX -= 1;
    if (keys[controls.right]) moveX += 1;
    
    // Normalize diagonal movement
    if (moveX !== 0 && moveZ !== 0) {
        const invSqrt = 1 / Math.sqrt(moveX * moveX + moveZ * moveZ);
        moveX *= invSqrt;
        moveZ *= invSqrt;
    }
    
    // Apply movement based on rotation
    const speed = 5.0;
    player.velocity.x = moveX * speed;
    player.velocity.z = moveZ * speed;
    
    // Apply velocity
    player.position.x += player.velocity.x * deltaTime;
    player.position.z += player.velocity.z * deltaTime;
    
    // Keep within bounds
    const bound = 25;
    player.position.x = Math.max(-bound, Math.min(bound, player.position.x));
    player.position.z = Math.max(-bound, Math.min(bound, player.position.z));
    
    // Musket tilt
    if (keys[controls.tiltLeft]) {
        player.musketTilt = Math.max(-0.5, player.musketTilt - 2.0 * deltaTime);
    }
    if (keys[controls.tiltRight]) {
        player.musketTilt = Math.min(0.5, player.musketTilt + 2.0 * deltaTime);
    }
    
    // Update camera position and rotation
    updateCamera(playerId);
}

// Update camera based on player state
function updateCamera(playerId) {
    const player = game.players[playerId];
    const camera = cameras[playerId];
    
    // Camera follows player position
    camera.position.x = player.position.x;
    camera.position.y = player.position.y + 1.7; // Eye height
    camera.position.z = player.position.z;
    
    // Apply rotation
    camera.rotation.x = player.rotation.x;
    camera.rotation.y = player.rotation.y;
    camera.rotation.z = player.rotation.z;
    
    // Apply musket tilt to camera when aiming
    if (player.aiming) {
        camera.rotation.z = player.musketTilt;
    }
}

// Update bullets
function updateBullets(deltaTime) {
    for (let i = game.bullets.length - 1; i >= 0; i--) {
        const bullet = game.bullets[i];
        
        // Move bullet
        bullet.position.x += bullet.direction.x * bullet.velocity * deltaTime;
        bullet.position.y += bullet.direction.y * bullet.velocity * deltaTime;
        bullet.position.z += bullet.direction.z * bullet.velocity * deltaTime;
        
        // Reduce life
        bullet.life -= deltaTime;
        
        // Check collision with other player
        const targetPlayerId = bullet.playerId === 0 ? 1 : 0;
        const target = game.players[targetPlayerId];
        
        const dx = bullet.position.x - target.position.x;
        const dy = bullet.position.y - (target.position.y + 1.7); // Aim at chest height
        const dz = bullet.position.z - target.position.z;
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (distance < 1.0) {
            // Hit!
            target.health -= 25;
            updateHealthDisplay(targetPlayerId);
            
            // Remove bullet
            game.bullets.splice(i, 1);
            
            // Check for death
            if (target.health <= 0) {
                target.health = 0;
                updatePlayerStatus(targetPlayerId, 'DEAD');
                alert(`${target.name} has been defeated!`);
            }
            
            continue;
        }
        
        // Remove dead bullets
        if (bullet.life <= 0) {
            game.bullets.splice(i, 1);
        }
    }
}

// Update reload process
function updateReloadProcess(deltaTime) {
    for (let i = 0; i < 2; i++) {
        const player = game.players[i];
        
        if (player.reloading) {
            // Each step takes 1 second
            const stepDuration = 1.0;
            const progress = (game.gameTime % stepDuration) / stepDuration;
            
            // Advance to next step every second
            const stepIndex = Math.floor(game.gameTime / stepDuration) % 5;
            if (stepIndex !== player.reloadStep) {
                player.reloadStep = stepIndex + 1;
                updateReloadUI(i);
                
                // On final step, finish reload
                if (player.reloadStep === 5) {
                    player.reloading = false;
                    player.ammo = 1;
                    updateAmmoDisplay(i);
                    updatePlayerStatus(i, 'Ready');
                    
                    // Hide reload indicator
                    document.getElementById('reloadIndicator').style.display = 'none';
                }
            }
        }
    }
}

// Update HUD
function updateHUD() {
    for (let i = 0; i < 2; i++) {
        updateAmmoDisplay(i);
        updateHealthDisplay(i);
    }
}

// Animation loop
function animate(time) {
    requestAnimationFrame(animate);
    
    // Calculate delta time
    if (game.lastTime === 0) game.lastTime = time;
    const deltaTime = (time - game.lastTime) / 1000;
    game.lastTime = time;
    
    // Update game logic
    updateGame(deltaTime);
    
    // Render both scenes
    for (let i = 0; i < 2; i++) {
        // Add musket to scene if aiming
        // (In a full implementation, you'd manage musket visibility)
        
        renderers[i].render(scenes[i], cameras[i]);
    }
}

// Initialize everything
function init() {
    console.log('Initializing Le Musket Quatre...');
    
    // Initialize Three.js
    initThreeJS();
    
    // Create environment
    createEnvironment();
    
    // Setup input
    setupInput();
    
    // Start animation loop
    animate(0);
    
    // Initial HUD update
    updateHUD();
    
    console.log('Game initialized!');
}

// Start game when page loads
window.addEventListener('load', init);
window.addEventListener('resize', () => {
    for (let i = 0; i < 2; i++) {
        const canvas = canvasElements[i];
        const camera = cameras[i];
        const renderer = renderers[i];
        
        if (canvas && camera && renderer) {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        }
    }
});