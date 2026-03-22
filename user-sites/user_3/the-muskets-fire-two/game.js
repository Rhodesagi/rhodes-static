// The Muskets Fire Two - Two Player FPS Duel
// Iron sights only. Manual reload. One shot kills.

const CONFIG = {
    MOVE_SPEED: 8,
    LOOK_SPEED: 0.002,
    GRAVITY: 9.8,
    MUZZLE_VELOCITY: 200, // m/s (realistic for musket)
    BULLET_DROP: true,
    RELOAD_TIME: 20000, // 20 seconds for full reload
    RELOAD_STAGES: 8,
    FOV_HIP: 80,
    FOV_AIM: 25,
    MAP_SIZE: 100
};

let gameState = {
    started: false,
    round: 1,
    maxRounds: 5,
    p1Score: 0,
    p2Score: 0,
    paused: false
};

// Scene setup
const scenes = [];
const cameras = [];
const renderers = [];
const players = [];
const bullets = [];

// Input state
const keys = {};

// Player class
class Player {
    constructor(id, color, startPos) {
        this.id = id;
        this.color = color;
        this.position = startPos.clone();
        this.rotation = { x: 0, y: id === 1 ? 0 : Math.PI };
        this.velocity = new THREE.Vector3();
        this.health = 100;
        this.maxHealth = 100;
        this.alive = true;
        
        // Musket state
        this.hasFired = false;
        this.isReloading = false;
        this.reloadProgress = 0;
        this.reloadStage = 0;
        this.aiming = false;
        this.musketRaised = 0; // 0 = hip, 1 = shouldered
        
        // Visual recoil
        this.recoil = 0;
        this.recoilRecovery = 0;
        
        this.createCamera();
        this.createMusket();
    }
    
    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.FOV_HIP, 
            (window.innerWidth / 2) / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.copy(this.position);
    }
    
    createMusket() {
        // Create musket mesh
        this.musketGroup = new THREE.Group();
        
        // Main barrel (octagonal for historical accuracy)
        const barrelGeom = new THREE.CylinderGeometry(0.03, 0.04, 1.4, 8);
        const barrelMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            metalness: 0.7,
            roughness: 0.3
        });
        const barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.5;
        this.musketGroup.add(barrel);
        
        // Stock
        const stockGeom = new THREE.BoxGeometry(0.08, 0.12, 0.8);
        const stockMat = new THREE.MeshStandardMaterial({ 
            color: 0x4a3728,
            roughness: 0.8 
        });
        const stock = new THREE.Mesh(stockGeom, stockMat);
        stock.position.z = -0.2;
        stock.position.y = -0.05;
        this.musketGroup.add(stock);
        
        // Buttplate
        const buttGeom = new THREE.BoxGeometry(0.09, 0.13, 0.05);
        const buttMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });
        const butt = new THREE.Mesh(buttGeom, buttMat);
        butt.position.z = -0.62;
        butt.position.y = -0.05;
        this.musketGroup.add(butt);
        
        // Lock mechanism (flintlock)
        const lockGeom = new THREE.BoxGeometry(0.06, 0.08, 0.15);
        const lockMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6 });
        const lock = new THREE.Mesh(lockGeom, lockMat);
        lock.position.set(0.06, 0.02, 0.3);
        this.musketGroup.add(lock);
        
        // Frizzen (hammer)
        const hammerGeom = new THREE.ConeGeometry(0.02, 0.08, 4);
        const hammer = new THREE.Mesh(hammerGeom, lockMat);
        hammer.rotation.z = Math.PI / 4;
        hammer.position.set(0.08, 0.08, 0.32);
        this.musketGroup.add(hammer);
        
        // Trigger guard
        const guardGeom = new THREE.TorusGeometry(0.04, 0.005, 4, 8, Math.PI);
        const guard = new THREE.Mesh(guardGeom, buttMat);
        guard.rotation.x = Math.PI / 2;
        guard.position.set(0, -0.08, -0.05);
        this.musketGroup.add(guard);
        
        // Trigger
        const triggerGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.02, 4);
        const trigger = new THREE.Mesh(triggerGeom, new THREE.MeshStandardMaterial({ color: 0x111111 }));
        trigger.rotation.x = Math.PI / 2;
        trigger.position.set(0, -0.06, -0.05);
        this.musketGroup.add(trigger);
        
        // Front sight (post)
        const frontSightGeom = new THREE.BoxGeometry(0.005, 0.04, 0.005);
        const sightMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const frontSight = new THREE.Mesh(frontSightGeom, sightMat);
        frontSight.position.set(0, 0.08, 1.15);
        this.musketGroup.add(frontSight);
        
        // Rear sight (notch in breech)
        const rearSightGeom = new THREE.BoxGeometry(0.02, 0.005, 0.01);
        const rearSight = new THREE.Mesh(rearSightGeom, sightMat);
        rearSight.position.set(0, 0.02, 0.25);
        this.musketGroup.add(rearSight);
        
        // Ramrod (under barrel)
        const rodGeom = new THREE.CylinderGeometry(0.004, 0.004, 1.3, 8);
        const rodMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
        this.ramrod = new THREE.Mesh(rodGeom, rodMat);
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrod.position.set(0, -0.08, 0.5);
        this.musketGroup.add(this.ramrod);
        
        // Position musket in "hip fire" stance
        this.musketGroup.position.set(0.3, -0.4, 0.5);
        this.musketGroup.rotation.set(0.2, -0.3, 0);
        
        // Muzzle flash point
        this.muzzleFlash = new THREE.PointLight(0xffaa00, 0, 10);
        this.muzzleFlash.position.set(0, 0, 1.2);
        this.musketGroup.add(this.muzzleFlash);
    }
    
    update(dt) {
        if (!this.alive) return;
        
        // Movement
        const moveSpeed = this.aiming ? CONFIG.MOVE_SPEED * 0.3 : CONFIG.MOVE_SPEED;
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(
            new THREE.Vector3(0, 1, 0), 
            this.rotation.y
        );
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(
            new THREE.Vector3(0, 1, 0), 
            this.rotation.y
        );
        
        const moveVec = new THREE.Vector3();
        
        if (this.id === 1) {
            if (keys['w'] || keys['W']) moveVec.add(forward);
            if (keys['s'] || keys['S']) moveVec.sub(forward);
            if (keys['a'] || keys['A']) moveVec.sub(right);
            if (keys['d'] || keys['D']) moveVec.add(right);
        } else {
            if (keys['ArrowUp']) moveVec.add(forward);
            if (keys['ArrowDown']) moveVec.sub(forward);
            if (keys['ArrowLeft']) moveVec.sub(right);
            if (keys['ArrowRight']) moveVec.add(right);
        }
        
        if (moveVec.length() > 0) {
            moveVec.normalize().multiplyScalar(moveSpeed * dt);
            const newPos = this.position.clone().add(moveVec);
            
            // Simple boundary check
            if (newPos.x > -CONFIG.MAP_SIZE/2 && newPos.x < CONFIG.MAP_SIZE/2 &&
                newPos.z > -CONFIG.MAP_SIZE/2 && newPos.z < CONFIG.MAP_SIZE/2) {
                this.position.copy(newPos);
            }
        }
        
        // Mouse look (disabled - using keyboard rotation)
        // Aiming
        const aimInput = this.id === 1 ? keys['Shift'] : keys['Enter'];
        if (aimInput && !this.isReloading) {
            this.aiming = true;
            this.musketRaised = Math.min(this.musketRaised + dt * 3, 1);
        } else {
            this.aiming = false;
            this.musketRaised = Math.max(this.musketRaised - dt * 3, 0);
        }
        
        // Rotate with Q/E (P1) or ,/./ (P2)
        if (this.id === 1) {
            if (keys['q'] || keys['Q']) this.rotation.y += 1.5 * dt;
            if (keys['e'] || keys['E']) this.rotation.y -= 1.5 * dt;
        } else {
            if (keys[','] || keys['<']) this.rotation.y += 1.5 * dt;
            if (keys['.'] || keys['>']) this.rotation.y -= 1.5 * dt;
        }
        
        // Update musket position based on aim state
        const hipPos = new THREE.Vector3(0.3, -0.4, 0.5);
        const aimPos = new THREE.Vector3(0.12, -0.15, 0.3);
        const hipRot = new THREE.Euler(0.2, -0.3, 0);
        const aimRot = new THREE.Euler(0, 0, 0);
        
        this.musketGroup.position.lerpVectors(hipPos, aimPos, this.musketRaised);
        this.musketGroup.rotation.x = THREE.MathUtils.lerp(hipRot.x, aimRot.x, this.musketRaised);
        this.musketGroup.rotation.y = THREE.MathUtils.lerp(hipRot.y, aimRot.y, this.musketRaised);
        this.musketGroup.rotation.z = THREE.MathUtils.lerp(hipRot.z, aimRot.z, this.musketRaised);
        
        // Update camera FOV for aiming
        const targetFOV = this.aiming ? CONFIG.FOV_AIM : CONFIG.FOV_HIP;
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, dt * 5);
        this.camera.updateProjectionMatrix();
        
        // Recoil recovery
        if (this.recoil > 0) {
            this.recoil = Math.max(0, this.recoil - dt * 3);
            this.camera.rotation.x = this.recoil * 0.3;
        }
        
        // Reloading
        if (this.isReloading) {
            this.reloadProgress += dt;
            const stageDuration = CONFIG.RELOAD_TIME / CONFIG.RELOAD_STAGES;
            this.reloadStage = Math.min(
                Math.floor(this.reloadProgress / stageDuration),
                CONFIG.RELOAD_STAGES
            );
            
            // Animate ramrod during stages 3-5 (seating the ball)
            if (this.reloadStage >= 3 && this.reloadStage <= 5) {
                const rodProgress = (this.reloadProgress - stageDuration * 3) / (stageDuration * 2);
                // Ramrod moves in and out
                const rodZ = 0.5 - Math.sin(rodProgress * Math.PI) * 0.6;
                this.ramrod.position.z = rodZ;
                this.ramrod.visible = true;
            } else if (this.reloadStage > 5) {
                this.ramrod.visible = false; // Ramrod returned to storage
            } else if (this.reloadStage < 3) {
                this.ramrod.visible = true;
                this.ramrod.position.z = 0.5; // At storage position
            }
            
            if (this.reloadProgress >= CONFIG.RELOAD_TIME) {
                this.finishReload();
            }
            
            this.updateReloadUI();
        }
        
        // Update camera position
        const eyeHeight = 1.7;
        this.camera.position.set(
            this.position.x,
            this.position.y + eyeHeight,
            this.position.z
        );
        this.camera.rotation.y = this.rotation.y;
        
        // Update musket position relative to camera
        this.musketGroup.position.applyEuler(this.camera.rotation);
        this.musketGroup.rotation.y = this.camera.rotation.y;
        this.camera.add(this.musketGroup);
        
        // Decrease muzzle flash
        this.muzzleFlash.intensity *= 0.8;
        if (this.muzzleFlash.intensity < 0.1) {
            this.muzzleFlash.intensity = 0;
        }
    }
    
    fire() {
        if (!this.alive || this.hasFired || this.isReloading) return false;
        
        this.hasFired = true;
        this.recoil = 1.0;
        this.muzzleFlash.intensity = 5;
        
        // Create bullet
        const bulletStart = new THREE.Vector3(0, 0, 1.2);
        bulletStart.applyMatrix4(this.musketGroup.matrixWorld);
        
        const bulletDir = new THREE.Vector3(0, 0, 1);
        bulletDir.applyEuler(this.camera.rotation);
        
        // Add some spread if not fully aimed
        const spread = this.aiming ? 0.01 : 0.05;
        bulletDir.x += (Math.random() - 0.5) * spread;
        bulletDir.y += (Math.random() - 0.5) * spread;
        bulletDir.normalize();
        
        const bullet = new Bullet(bulletStart, bulletDir, this.id);
        bullets.push(bullet);
        
        this.updateAmmoUI();
        return true;
    }
    
    startReload() {
        if (!this.alive || !this.hasFired || this.isReloading) return;
        
        this.isReloading = true;
        this.reloadProgress = 0;
        this.reloadStage = 0;
        this.ramrod.visible = true;
        
        document.getElementById(`p${this.id}-reload`).style.display = 'block';
    }
    
    finishReload() {
        this.isReloading = false;
        this.hasFired = false;
        this.reloadProgress = 0;
        this.reloadStage = 0;
        this.ramrod.visible = true;
        this.ramrod.position.z = 0.5;
        
        document.getElementById(`p${this.id}-reload`).style.display = 'none';
        this.updateAmmoUI();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthUI();
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.alive = false;
        this.health = 0;
        this.updateHealthUI();
        checkRoundEnd();
    }
    
    respawn(position) {
        this.alive = true;
        this.health = this.maxHealth;
        this.position.copy(position);
        this.hasFired = false;
        this.isReloading = false;
        this.rotation.y = this.id === 1 ? 0 : Math.PI;
        this.updateHealthUI();
        this.updateAmmoUI();
    }
    
    updateHealthUI() {
        const healthBar = document.getElementById(`p${this.id}-health`);
        const pct = (this.health / this.maxHealth) * 100;
        healthBar.style.width = pct + '%';
        healthBar.style.background = pct > 50 ? '#4a9' : pct > 25 ? '#aa4' : '#a44';
    }
    
    updateAmmoUI() {
        const ammo = this.hasFired ? '0' : '1';
        document.getElementById(`p${this.id}-ammo`).textContent = `${ammo} / 1`;
    }
    
    updateReloadUI() {
        const pct = (this.reloadProgress / CONFIG.RELOAD_TIME) * 100;
        document.getElementById(`p${this.id}-reload-bar`).style.width = pct + '%';
        
        const stageNames = [
            'Half-cock...',
            'Open pan...',
            'Prime pan...',
            'Tear cartridge...',
            'Charge barrel...',
            'Seat ball & patch...',
            'Remove ramrod...',
            'Full-cock...'
        ];
        document.getElementById(`p${this.id}-reload-text`).textContent = 
            stageNames[this.reloadStage] || 'Ready...';
    }
}

// Bullet class with ballistics
class Bullet {
    constructor(position, direction, ownerId) {
        this.position = position.clone();
        this.direction = direction.clone();
        this.ownerId = ownerId;
        this.velocity = direction.clone().multiplyScalar(CONFIG.MUZZLE_VELOCITY);
        this.active = true;
        this.lifeTime = 0;
        this.maxLife = 3; // seconds
        
        // Visual
        const geom = new THREE.SphereGeometry(0.015, 4, 4);
        const mat = new THREE.MeshBasicMaterial({ color: 0x444444 });
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.position.copy(position);
        
        // Add to both scenes
        scenes.forEach(scene => scene.add(this.mesh.clone()));
    }
    
    update(dt) {
        if (!this.active) return;
        
        this.lifeTime += dt;
        
        // Apply gravity
        if (CONFIG.BULLET_DROP) {
            this.velocity.y -= CONFIG.GRAVITY * dt;
        }
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(dt));
        this.mesh.position.copy(this.position);
        
        // Check collision with players
        players.forEach(player => {
            if (player.id !== this.ownerId && player.alive) {
                const dist = this.position.distanceTo(player.camera.position);
                if (dist < 0.5) {
                    player.takeDamage(100);
                    this.active = false;
                    
                    // Award point
                    if (player.id === 2) gameState.p1Score++;
                    else gameState.p2Score++;
                }
            }
        });
        
        // Ground collision
        if (this.position.y < 0) {
            this.active = false;
        }
        
        // Max range
        if (this.lifeTime > this.maxLife) {
            this.active = false;
        }
        
        // Boundary check
        if (Math.abs(this.position.x) > CONFIG.MAP_SIZE/2 || 
            Math.abs(this.position.z) > CONFIG.MAP_SIZE/2) {
            this.active = false;
        }
    }
    
    destroy() {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}

// Create world
function createWorld(scene) {
    // Ground - snowy field
    const groundGeom = new THREE.PlaneGeometry(CONFIG.MAP_SIZE, CONFIG.MAP_SIZE, 50, 50);
    
    // Add some noise to vertices for terrain
    const posAttribute = groundGeom.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
        const z = posAttribute.getZ(i);
        posAttribute.setZ(i, z + Math.random() * 0.5);
    }
    groundGeom.computeVertexNormals();
    
    const groundMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Trees - pine forest
    for (let i = 0; i < 30; i++) {
        const x = (Math.random() - 0.5) * CONFIG.MAP_SIZE * 0.8;
        const z = (Math.random() - 0.5) * CONFIG.MAP_SIZE * 0.8;
        
        // Don't spawn too close to starting positions
        if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
        if (Math.abs(x) < 10 && Math.abs(z - 40) < 10) continue;
        
        createTree(scene, x, z);
    }
    
    // Rocks and stumps for cover
    for (let i = 0; i < 15; i++) {
        const x = (Math.random() - 0.5) * CONFIG.MAP_SIZE * 0.6;
        const z = (Math.random() - 0.5) * CONFIG.MAP_SIZE * 0.6;
        createRock(scene, x, z);
    }
    
    // Fog for atmosphere
    scene.fog = new THREE.Fog(0xcccccc, 10, 80);
    
    // Lighting
    const ambient = new THREE.AmbientLight(0x666666, 0.6);
    scene.add(ambient);
    
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    scene.add(sun);
    
    // Snow particles
    const snowGeom = new THREE.BufferGeometry();
    const snowCount = 1000;
    const positions = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 100;
    }
    snowGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const snowMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        opacity: 0.8
    });
    const snow = new THREE.Points(snowGeom, snowMat);
    scene.add(snow);
    
    return { snow: snow };
}

function createTree(scene, x, z) {
    const group = new THREE.Group();
    
    // Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.3, 0.5, 2, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 1;
    group.add(trunk);
    
    // Pine layers
    const green = 0x1a3d1a;
    for (let i = 0; i < 4; i++) {
        const coneGeom = new THREE.ConeGeometry(2 - i * 0.4, 2, 6);
        const coneMat = new THREE.MeshStandardMaterial({ color: green, roughness: 0.8 });
        const cone = new THREE.Mesh(coneGeom, coneMat);
        cone.position.y = 2.5 + i * 1.2;
        group.add(cone);
    }
    
    // Snow on branches
    const snowGeom = new THREE.ConeGeometry(2.1, 0.5, 6);
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    for (let i = 0; i < 3; i++) {
        const snow = new THREE.Mesh(snowGeom, snowMat);
        snow.position.y = 3.2 + i * 1.2;
        group.add(snow);
    }
    
    group.position.set(x, 0, z);
    
    // Random scale and rotation
    const scale = 0.8 + Math.random() * 0.4;
    group.scale.set(scale, scale, scale);
    group.rotation.y = Math.random() * Math.PI * 2;
    
    scene.add(group);
}

function createRock(scene, x, z) {
    const size = 0.5 + Math.random() * 1;
    const geom = new THREE.DodecahedronGeometry(size, 0);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0x666666,
        roughness: 0.9 
    });
    const rock = new THREE.Mesh(geom, mat);
    rock.position.set(x, size * 0.3, z);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
}

// Initialize game
function init() {
    // Create two scenes (one for each viewport)
    for (let i = 0; i < 2; i++) {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb); // Sky blue
        
        const world = createWorld(scene);
        scenes.push(scene);
        
        // Create renderer for this viewport
        const container = document.getElementById(i === 0 ? 'p1-view' : 'p2-view');
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);
        renderers.push(renderer);
    }
    
    // Create players
    const p1 = new Player(1, 0x4a90d9, new THREE.Vector3(-20, 0, 0));
    const p2 = new Player(2, 0xd94a4a, new THREE.Vector3(20, 0, 0));
    players.push(p1, p2);
    
    cameras.push(p1.camera, p2.camera);
    
    // Setup input
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        
        // Fire
        if (e.key === 'f' || e.key === 'F') {
            p1.fire();
        }
        if (e.key === '/') {
            p2.fire();
        }
        
        // Reload
        if (e.key === 'r' || e.key === 'R') {
            p1.startReload();
        }
        if (e.key === '.') {
            p2.startReload();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    // Window resize
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    const p1View = document.getElementById('p1-view');
    const p2View = document.getElementById('p2-view');
    
    players[0].camera.aspect = p1View.clientWidth / p1View.clientHeight;
    players[0].camera.updateProjectionMatrix();
    renderers[0].setSize(p1View.clientWidth, p1View.clientHeight);
    
    players[1].camera.aspect = p2View.clientWidth / p2View.clientHeight;
    players[1].camera.updateProjectionMatrix();
    renderers[1].setSize(p2View.clientWidth, p2View.clientHeight);
}

// Game loop
let lastTime = 0;
function animate(time) {
    requestAnimationFrame(animate);
    
    if (!gameState.started || gameState.paused) return;
    
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    
    // Update players
    players.forEach(p => p.update(dt));
    
    // Update bullets
    bullets.forEach((b, i) => {
        b.update(dt);
        if (!b.active) {
            b.destroy();
            bullets.splice(i, 1);
        }
    });
    
    // Animate snow
    scenes.forEach(scene => {
        const snow = scene.getObjectByProperty('type', 'Points');
        if (snow) {
            const positions = snow.geometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] -= 0.5 * dt;
                if (positions[i] < 0) positions[i] = 50;
            }
            snow.geometry.attributes.position.needsUpdate = true;
        }
    });
    
    // Render
    renderers[0].render(scenes[0], players[0].camera);
    renderers[1].render(scenes[1], players[1].camera);
}

function checkRoundEnd() {
    const alivePlayers = players.filter(p => p.alive);
    
    if (alivePlayers.length === 1) {
        const winner = alivePlayers[0];
        showWinner(winner.id);
    } else if (alivePlayers.length === 0) {
        showWinner(0); // Draw
    }
}

function showWinner(winnerId) {
    gameState.paused = true;
    
    const overlay = document.getElementById('winner-overlay');
    const text = document.getElementById('winner-text');
    
    if (winnerId === 0) {
        text.textContent = 'Mutual Destruction';
    } else {
        text.textContent = `Player ${winnerId} Wins Round!`;
        text.style.color = winnerId === 1 ? '#4a90d9' : '#d94a4a';
    }
    
    overlay.style.display = 'flex';
    
    // Update round counters
    document.getElementById('p1-rounds').textContent = 
        `Round ${gameState.round} - P1: ${gameState.p1Score} P2: ${gameState.p2Score}`;
    document.getElementById('p2-rounds').textContent = 
        `Round ${gameState.round} - P1: ${gameState.p1Score} P2: ${gameState.p2Score}`;
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    gameState.started = true;
    gameState.paused = false;
    lastTime = performance.now();
    animate(lastTime);
}

function resetGame() {
    gameState.round++;
    gameState.paused = false;
    document.getElementById('winner-overlay').style.display = 'none';
    
    // Check for match winner
    if (gameState.p1Score >= 3 || gameState.p2Score >= 3 || gameState.round > gameState.maxRounds) {
        endMatch();
        return;
    }
    
    // Reset players
    players[0].respawn(new THREE.Vector3(-20, 0, 0));
    players[1].respawn(new THREE.Vector3(20, 0, 0));
    
    // Clear bullets
    bullets.forEach(b => b.destroy());
    bullets.length = 0;
    
    // Update UI
    document.getElementById('p1-rounds').textContent = 
        `Round ${gameState.round} - P1: ${gameState.p1Score} P2: ${gameState.p2Score}`;
    document.getElementById('p2-rounds').textContent = 
        `Round ${gameState.round} - P1: ${gameState.p1Score} P2: ${gameState.p2Score}`;
    
    lastTime = performance.now();
}

function endMatch() {
    const overlay = document.getElementById('winner-overlay');
    const text = document.getElementById('winner-text');
    const button = overlay.querySelector('button');
    
    let winner;
    if (gameState.p1Score > gameState.p2Score) winner = 1;
    else if (gameState.p2Score > gameState.p1Score) winner = 2;
    else winner = 0;
    
    if (winner === 0) {
        text.textContent = 'Match Tied!';
    } else {
        text.textContent = `Player ${winner} Wins the Match!`;
        text.style.color = winner === 1 ? '#4a90d9' : '#d94a4a';
    }
    
    button.textContent = 'Play Again';
    button.onclick = () => location.reload();
    
    overlay.style.display = 'flex';
}

// Initialize
init();