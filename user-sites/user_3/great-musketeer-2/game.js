// Le Musket Quatre - Great Musketeer 2
// A 2-player same-computer first-person musket shooter with iron sight aiming

// Game constants
const RELOAD_TIME = 15.0; // Total reload time in seconds
const RELOAD_STEPS = 5;
const STEP_TIMES = [1.0, 4.0, 6.0, 3.0, 1.0]; // Time for each reload step
const MUSKET_TILT_SPEED = 0.05;
const MOVEMENT_SPEED = 5.0;
const TURN_SPEED = 0.002;
const BULLET_SPEED = 100.0;
const BULLET_RANGE = 100.0;
const DAMAGE = 25;

// Game state
let scene, camera, renderer;
let player1, player2;
let bullets = [];
let keys = {};
let gameTime = 0;
let player1Reloading = false;
let player2Reloading = false;
let player1ReloadStartTime = 0;
let player2ReloadStartTime = 0;
let player1Aiming = false;
let player2Aiming = false;
let player1Health = 100;
let player2Health = 100;
let player1Tilt = 0;
let player2Tilt = 0;
let player1Ammo = 1;
let player2Ammo = 1;

// DOM elements
let p1AmmoEl, p2AmmoEl, p1StatusEl, p2StatusEl, p1HealthEl, p2HealthEl;
let reloadStepsEls = [];
let reloadTimerEl;
let aimSightEl;

// Initialize Three.js scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0); // Eye level
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // Forest green
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Create simple obstacles
    createObstacles();
    
    // Create players
    createPlayers();
    
    // Create lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Get DOM elements
    p1AmmoEl = document.getElementById('p1Ammo');
    p2AmmoEl = document.getElementById('p2Ammo');
    p1StatusEl = document.getElementById('p1Status');
    p2StatusEl = document.getElementById('p2Status');
    p1HealthEl = document.getElementById('p1Health');
    p2HealthEl = document.getElementById('p2Health');
    
    for (let i = 1; i <= RELOAD_STEPS; i++) {
        reloadStepsEls.push(document.getElementById(`step${i}`));
    }
    
    reloadTimerEl = document.getElementById('reloadTimer');
    aimSightEl = document.getElementById('aimSight');
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    // Start animation loop
    animate();
}

function createObstacles() {
    // Create some walls and obstacles
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    // Wall 1
    const wall1 = new THREE.Mesh(new THREE.BoxGeometry(20, 5, 1), wallMaterial);
    wall1.position.set(0, 2.5, -10);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    scene.add(wall1);
    
    // Wall 2
    const wall2 = new THREE.Mesh(new THREE.BoxGeometry(20, 5, 1), wallMaterial);
    wall2.position.set(0, 2.5, 10);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    scene.add(wall2);
    
    // Tree
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 5), new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
    trunk.position.set(8, 2.5, 5);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(3), new THREE.MeshLambertMaterial({ color: 0x228B22 }));
    leaves.position.set(8, 5, 5);
    leaves.castShadow = true;
    scene.add(leaves);
}

function createPlayers() {
    // Player 1 musket (simplified representation)
    const musket1Geometry = new THREE.BoxGeometry(1.5, 0.1, 0.1);
    const musket1Material = new THREE.MeshLambertMaterial({ color: 0x333333 });
    player1 = new THREE.Mesh(musket1Geometry, musket1Material);
    player1.position.set(0.5, -0.2, -1);
    player1.userData = { type: 'musket', owner: 1 };
    scene.add(player1);
    
    // Player 2 musket
    const musket2Geometry = new THREE.BoxGeometry(1.5, 0.1, 0.1);
    const musket2Material = new THREE.MeshLambertMaterial({ color: 0x666666 });
    player2 = new THREE.Mesh(musket2Geometry, musket2Material);
    player2.position.set(-0.5, -0.2, -1);
    player2.userData = { type: 'musket', owner: 2 };
    scene.add(player2);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    keys[event.code] = true;
    
    // Player 1 controls
    if (event.code === 'KeyR' && !player1Reloading && player1Ammo === 0) {
        startReload(1);
    }
    
    if (event.code === 'KeyF' && !player1Reloading && player1Ammo > 0 && !player1Aiming) {
        fireMusket(1);
    }
    
    if (event.code === 'KeyX') {
        player1Aiming = true;
        updateAimSight();
    }
    
    // Player 2 controls
    if (event.code === 'KeyB' && !player2Reloading && player2Ammo === 0) {
        startReload(2);
    }
    
    if (event.code === 'KeyN' && !player2Reloading && player2Ammo > 0 && !player2Aiming) {
        fireMusket(2);
    }
    
    if (event.code === 'KeyM') {
        player2Aiming = true;
        updateAimSight();
    }
}

function onKeyUp(event) {
    keys[event.code] = false;
    
    if (event.code === 'KeyX') {
        player1Aiming = false;
        updateAimSight();
    }
    
    if (event.code === 'KeyM') {
        player2Aiming = false;
        updateAimSight();
    }
}

function startReload(player) {
    if (player === 1) {
        player1Reloading = true;
        player1ReloadStartTime = gameTime;
        player1Ammo = 0;
        p1StatusEl.textContent = 'Reloading';
    } else {
        player2Reloading = true;
        player2ReloadStartTime = gameTime;
        player2Ammo = 0;
        p2StatusEl.textContent = 'Reloading';
    }
}

function updateReload(player) {
    const reloadStartTime = player === 1 ? player1ReloadStartTime : player2ReloadStartTime;
    const elapsed = gameTime - reloadStartTime;
    
    if (elapsed >= RELOAD_TIME) {
        // Reload complete
        if (player === 1) {
            player1Reloading = false;
            player1Ammo = 1;
            p1StatusEl.textContent = 'Ready';
        } else {
            player2Reloading = false;
            player2Ammo = 1;
            p2StatusEl.textContent = 'Ready';
        }
        
        // Hide all reload steps
        reloadStepsEls.forEach(step => {
            step.classList.remove('active');
        });
        reloadTimerEl.textContent = 'Time: 0.0s';
        return;
    }
    
    // Update reload steps UI
    let currentStep = 0;
    let accumulatedTime = 0;
    
    for (let i = 0; i < STEP_TIMES.length; i++) {
        accumulatedTime += STEP_TIMES[i];
        if (elapsed < accumulatedTime) {
            currentStep = i;
            break;
        }
    }
    
    // Show current step
    reloadStepsEls.forEach((step, index) => {
        if (index === currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    reloadTimerEl.textContent = `Time: ${elapsed.toFixed(1)}s`;
}

function fireMusket(player) {
    if (player === 1) {
        player1Ammo = 0;
        p1AmmoEl.textContent = '0';
        p1StatusEl.textContent = 'Fired';
        
        // Create bullet
        const bullet = createBullet(player);
        bullets.push(bullet);
        
        // Recoil animation
        player1.position.z += 0.1;
        setTimeout(() => {
            player1.position.z -= 0.1;
        }, 100);
    } else {
        player2Ammo = 0;
        p2AmmoEl.textContent = '0';
        p2StatusEl.textContent = 'Fired';
        
        const bullet = createBullet(player);
        bullets.push(bullet);
        
        player2.position.z += 0.1;
        setTimeout(() => {
            player2.position.z -= 0.1;
        }, 100);
    }
}

function createBullet(player) {
    const geometry = new THREE.SphereGeometry(0.05, 8, 8);
    const material = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const bullet = new THREE.Mesh(geometry, material);
    
    // Position based on player and tilt
    let startPos;
    let direction;
    
    if (player === 1) {
        startPos = new THREE.Vector3(
            player1.position.x + 0.5,
            player1.position.y,
            player1.position.z - 1
        );
        direction = new THREE.Vector3(Math.sin(player1Tilt), 0, -1).normalize();
    } else {
        startPos = new THREE.Vector3(
            player2.position.x - 0.5,
            player2.position.y,
            player2.position.z - 1
        );
        direction = new THREE.Vector3(Math.sin(player2Tilt), 0, -1).normalize();
    }
    
    bullet.position.copy(startPos);
    bullet.userData = {
        owner: player,
        direction: direction,
        distance: 0,
        startPos: startPos.clone()
    };
    
    scene.add(bullet);
    return bullet;
}

function updateBullets(delta) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.userData.distance += BULLET_SPEED * delta;
        
        // Move bullet
        const moveDistance = BULLET_SPEED * delta;
        bullet.position.add(
            bullet.userData.direction.clone().multiplyScalar(moveDistance)
        );
        
        // Check if bullet hits something
        if (bullet.userData.distance > BULLET_RANGE) {
            scene.remove(bullet);
            bullets.splice(i, 1);
            continue;
        }
        
        // Simple hit detection (would need proper raycasting for real game)
        // Check if bullet is near other player
        const targetPlayer = bullet.userData.owner === 1 ? player2 : player1;
        const distanceToTarget = bullet.position.distanceTo(
            new THREE.Vector3(targetPlayer.position.x, targetPlayer.position.y, targetPlayer.position.z)
        );
        
        if (distanceToTarget < 1.0) {
            // Hit!
            if (bullet.userData.owner === 1) {
                player2Health -= DAMAGE;
                p2HealthEl.textContent = player2Health;
                if (player2Health <= 0) {
                    p2StatusEl.textContent = 'DEAD';
                }
            } else {
                player1Health -= DAMAGE;
                p1HealthEl.textContent = player1Health;
                if (player1Health <= 0) {
                    p1StatusEl.textContent = 'DEAD';
                }
            }
            
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }
}

function updatePlayerMovement(delta) {
    // Player 1 movement (WASD)
    if (keys['KeyW']) {
        player1.position.y += MOVEMENT_SPEED * delta;
    }
    if (keys['KeyS']) {
        player1.position.y -= MOVEMENT_SPEED * delta;
    }
    if (keys['KeyA']) {
        player1.position.x -= MOVEMENT_SPEED * delta;
    }
    if (keys['KeyD']) {
        player1.position.x += MOVEMENT_SPEED * delta;
    }
    
    // Player 1 musket tilt (Q/E)
    if (keys['KeyQ']) {
        player1Tilt += MUSKET_TILT_SPEED;
        player1.rotation.z = player1Tilt;
    }
    if (keys['KeyE']) {
        player1Tilt -= MUSKET_TILT_SPEED;
        player1.rotation.z = player1Tilt;
    }
    
    // Player 2 movement (Arrow keys)
    if (keys['ArrowUp']) {
        player2.position.y += MOVEMENT_SPEED * delta;
    }
    if (keys['ArrowDown']) {
        player2.position.y -= MOVEMENT_SPEED * delta;
    }
    if (keys['ArrowLeft']) {
        player2.position.x -= MOVEMENT_SPEED * delta;
    }
    if (keys['ArrowRight']) {
        player2.position.x += MOVEMENT_SPEED * delta;
    }
    
    // Player 2 musket tilt (U/O)
    if (keys['KeyU']) {
        player2Tilt += MUSKET_TILT_SPEED;
        player2.rotation.z = player2Tilt;
    }
    if (keys['KeyO']) {
        player2Tilt -= MUSKET_TILT_SPEED;
        player2.rotation.z = player2Tilt;
    }
    
    // Constrain players to game area
    const bounds = 8;
    player1.position.x = Math.max(-bounds, Math.min(bounds, player1.position.x));
    player1.position.y = Math.max(-bounds, Math.min(bounds, player1.position.y));
    player2.position.x = Math.max(-bounds, Math.min(bounds, player2.position.x));
    player2.position.y = Math.max(-bounds, Math.min(bounds, player2.position.y));
}

function updateAimSight() {
    if (player1Aiming || player2Aiming) {
        aimSightEl.style.display = 'block';
    } else {
        aimSightEl.style.display = 'none';
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    const delta = 0.016; // Approximate 60fps delta
    
    gameTime += delta;
    
    // Update reloading if in progress
    if (player1Reloading) {
        updateReload(1);
    }
    
    if (player2Reloading) {
        updateReload(2);
    }
    
    // Update player movement
    updatePlayerMovement(delta);
    
    // Update bullets
    updateBullets(delta);
    
    // Update ammo display
    p1AmmoEl.textContent = player1Ammo;
    p2AmmoEl.textContent = player2Ammo;
    
    // Render scene
    renderer.render(scene, camera);
}

// Start the game when page loads
window.addEventListener('load', init);