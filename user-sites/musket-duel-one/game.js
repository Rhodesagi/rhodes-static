// MUSKET DUEL ONE - Complete Game Implementation
// Split-screen musket FPS with iron sights and full reload animation

// Global variables
let canvas, renderer, scene, player1, player2;
let gameState, keys, lastTime;

// Wait for everything to load before starting
function initializeGame() {
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded yet, retrying...');
        setTimeout(initializeGame, 100);
        return;
    }
    
    // Check if canvas exists
    canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error('Canvas not found, retrying...');
        setTimeout(initializeGame, 100);
        return;
    }
    
    // Setup renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setScissorTest(true);
    
    // Game state
    gameState = {
        running: false,
        winner: null,
        players: [],
        projectiles: [],
        particles: []
    };
    
    // Input state
    keys = {};
    
    // Setup input handlers
    setupInputHandlers();
    
    // Setup scene
    setupScene();
    
    // Create players
    player1 = new Player(scene, false);
    player2 = new Player(scene, true);
    gameState.players.push(player1, player2);
    
    // Setup UI
    setupUI();
    
    // Setup resize handler
    window.addEventListener('resize', onResize);
    
    // Initial camera setup
    onResize();
    
    // Initial render
    render();
    
    console.log('Game initialized successfully');
}

function setupInputHandlers() {
    // Prevent browser shortcuts
    const blockedKeys = ['q', 'e', 'r', 'f', 'p', 'u', 'o', ',', '.'];
    
    window.addEventListener('keydown', (e) => {
        if (blockedKeys.includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
        keys[e.key.toLowerCase()] = true;
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
}

// Audio context for sound effects
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    switch(type) {
        case 'fire':
            // White noise burst for gunshot
            const bufferSize = audioCtx.sampleRate * 0.3;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.05));
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            const noiseGain = audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            noise.connect(noiseGain);
            noiseGain.connect(audioCtx.destination);
            noise.start();
            
            // Low thud
            osc.frequency.setValueAtTime(80, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
            break;
            
        case 'reload':
            // Mechanical click
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
            break;
            
        case 'click':
            // Empty hammer click
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.02);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.02);
            break;
            
        case 'hit':
            // Impact thud
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
            break;
    }
}

function setupUI() {
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        console.log('Attaching button handler');
        startBtn.addEventListener('click', (e) => {
            console.log('BEGIN DUEL clicked');
            e.preventDefault();
            e.stopPropagation();
            initAudio();  // Initialize audio on user gesture
            document.getElementById('instructions').style.display = 'none';
            gameState.running = true;
            lastTime = performance.now();
            requestAnimationFrame(gameLoop);
        });
    } else {
        console.error('Start button not found!');
    }
    
    // Restart button handler
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            location.reload();
        });
    }
}

function onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    if (player1) {
        player1.camera.aspect = (width / 2) / height;
        player1.camera.updateProjectionMatrix();
    }
    
    if (player2) {
        player2.camera.aspect = (width / 2) / height;
        player2.camera.updateProjectionMatrix();
    }
    
    if (renderer) {
        renderer.setSize(width, height);
    }
}

// Utility functions
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Reload state machine states
const ReloadState = {
    READY: 'READY',
    HALF_COCK: 'HALF_COCK',
    BITE_CARTRIDGE: 'BITE_CARTRIDGE',
    POUR_POWDER: 'POUR_POWDER',
    INSERT_BALL: 'INSERT_BALL',
    RAM_ROD: 'RAM_ROD',
    PRIME_PAN: 'PRIME_PAN',
    FULL_COCK: 'FULL_COCK'
};

// State durations (milliseconds)
const STATE_DURATIONS = {
    [ReloadState.HALF_COCK]: 800,
    [ReloadState.BITE_CARTRIDGE]: 1200,
    [ReloadState.POUR_POWDER]: 2000,
    [ReloadState.INSERT_BALL]: 1500,
    [ReloadState.RAM_ROD]: 4000,
    [ReloadState.PRIME_PAN]: 2000,
    [ReloadState.FULL_COCK]: 800
};

// Musket class
class Musket {
    constructor(scene, isPlayer2 = false) {
        this.scene = scene;
        this.isPlayer2 = isPlayer2;
        this.loaded = true;
        this.state = ReloadState.READY;
        this.stateTimer = 0;
        this.stateProgress = 0;
        this.primed = true;
        
        this.mesh = new THREE.Group();
        
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 });
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xb5a642, metalness: 0.7, roughness: 0.4 });
        
        // Stock
        const stockGeom = new THREE.BoxGeometry(0.08, 0.12, 0.8);
        const stock = new THREE.Mesh(stockGeom, woodMat);
        stock.position.set(0, -0.05, 0.2);
        this.mesh.add(stock);
        
        // Barrel
        const barrelGeom = new THREE.CylinderGeometry(0.025, 0.03, 1.2, 12);
        const barrel = new THREE.Mesh(barrelGeom, steelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.3);
        this.mesh.add(barrel);
        
        // Rear sight
        const rearSightGeom = new THREE.BoxGeometry(0.02, 0.04, 0.02);
        const rearSight = new THREE.Mesh(rearSightGeom, steelMat);
        rearSight.position.set(0, 0.08, 0.15);
        this.mesh.add(rearSight);
        
        // Front sight
        const frontSightGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.05, 8);
        const frontSight = new THREE.Mesh(frontSightGeom, steelMat);
        frontSight.position.set(0, 0.09, -0.8);
        this.mesh.add(frontSight);
        
        // Hammer
        const hammerGeom = new THREE.BoxGeometry(0.03, 0.08, 0.03);
        this.hammer = new THREE.Mesh(hammerGeom, steelMat);
        this.hammer.position.set(0, 0.1, 0.25);
        this.hammer.rotation.x = -0.3;
        this.mesh.add(this.hammer);
        
        // Frizzen
        const frizzenGeom = new THREE.BoxGeometry(0.04, 0.05, 0.02);
        this.frizzen = new THREE.Mesh(frizzenGeom, steelMat);
        this.frizzen.position.set(0, 0.06, 0.22);
        this.mesh.add(this.frizzen);
        
        // Flash pan
        const panGeom = new THREE.BoxGeometry(0.03, 0.01, 0.03);
        this.pan = new THREE.Mesh(panGeom, brassMat);
        this.pan.position.set(0, 0.04, 0.22);
        this.mesh.add(this.pan);
        
        // Ramrod
        const ramrodGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.9, 8);
        this.ramrod = new THREE.Mesh(ramrodGeom, steelMat);
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrod.position.set(0.06, -0.02, -0.2);
        this.mesh.add(this.ramrod);
        
        // Muzzle flash light
        this.flashLight = new THREE.PointLight(0xffaa00, 0, 10);
        this.flashLight.position.set(0, 0.02, -0.9);
        this.mesh.add(this.flashLight);
        
        // Muzzle flash sprite
        const flashGeom = new THREE.PlaneGeometry(0.5, 0.5);
        const flashMat = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00, 
            transparent: true, 
            opacity: 0,
            side: THREE.DoubleSide
        });
        this.flash = new THREE.Mesh(flashGeom, flashMat);
        this.flash.position.set(0, 0.02, -0.95);
        this.mesh.add(this.flash);
        
        scene.add(this.mesh);
    }
    
    update(dt) {
        if (this.state !== ReloadState.READY) {
            this.stateTimer += dt * 1000;
            const duration = STATE_DURATIONS[this.state];
            this.stateProgress = Math.min(this.stateTimer / duration, 1);
            this.animateReloadState();
            
            if (this.stateTimer >= duration) {
                this.advanceState();
            }
        }
        
        if (this.flash.material.opacity > 0) {
            this.flash.material.opacity -= dt * 5;
            this.flashLight.intensity = this.flash.material.opacity * 5;
        }
    }
    
    animateReloadState() {
        const p = this.stateProgress;
        
        switch (this.state) {
            case ReloadState.HALF_COCK:
                this.hammer.rotation.x = lerp(-0.3, -0.8, p);
                break;
            case ReloadState.BITE_CARTRIDGE:
                this.mesh.rotation.x = lerp(0, -0.3, Math.sin(p * Math.PI));
                break;
            case ReloadState.POUR_POWDER:
                this.mesh.rotation.x = lerp(0, -0.5, p);
                break;
            case ReloadState.INSERT_BALL:
                this.mesh.rotation.x = lerp(-0.5, 0, p);
                break;
            case ReloadState.RAM_ROD:
                const ramCycles = 3;
                const cycle = (p * ramCycles) % 1;
                this.ramrod.position.z = lerp(-0.2, -0.7, Math.sin(cycle * Math.PI));
                this.ramrod.visible = true;
                break;
            case ReloadState.PRIME_PAN:
                this.frizzen.rotation.x = lerp(0, -0.6, p);
                this.primed = true;
                break;
            case ReloadState.FULL_COCK:
                this.hammer.rotation.x = lerp(-0.8, -1.2, p);
                break;
        }
    }
    
    advanceState() {
        const stateOrder = [
            ReloadState.HALF_COCK,
            ReloadState.BITE_CARTRIDGE,
            ReloadState.POUR_POWDER,
            ReloadState.INSERT_BALL,
            ReloadState.RAM_ROD,
            ReloadState.PRIME_PAN,
            ReloadState.FULL_COCK
        ];
        
        const currentIndex = stateOrder.indexOf(this.state);
        
        // Sound effect for reload step
        playSound('reload');
        
        if (this.state === ReloadState.RAM_ROD) {
            this.ramrod.visible = false;
            this.ramrod.position.z = -0.2;
        }
        if (this.state === ReloadState.POUR_POWDER) {
            this.mesh.rotation.x = 0;
        }
        
        if (currentIndex < stateOrder.length - 1) {
            this.state = stateOrder[currentIndex + 1];
            this.stateTimer = 0;
            this.stateProgress = 0;
        } else {
            this.state = ReloadState.READY;
            this.loaded = true;
            this.stateTimer = 0;
            this.stateProgress = 0;
        }
    }
    
    startReload() {
        if (this.state === ReloadState.READY && !this.loaded) {
            this.state = ReloadState.HALF_COCK;
            this.stateTimer = 0;
            this.stateProgress = 0;
            return true;
        }
        return false;
    }
    
    fire() {
        if (this.loaded && this.state === ReloadState.READY && this.primed) {
            this.loaded = false;
            this.primed = false;
            this.flash.material.opacity = 1;
            this.flashLight.intensity = 5;
            this.hammer.rotation.x = -0.3;
            this.frizzen.rotation.x = 0;
            playSound('fire');
            return true;
        }
        playSound('click');
        return false;
    }
    
    getReloadInfo() {
        return {
            state: this.state,
            progress: this.stateProgress,
            loaded: this.loaded
        };
    }
    
    getMuzzlePosition() {
        const pos = new THREE.Vector3(0, 0.02, -0.9);
        this.mesh.updateMatrixWorld();
        pos.applyMatrix4(this.mesh.matrixWorld);
        return pos;
    }
    
    getMuzzleDirection() {
        const dir = new THREE.Vector3(0, 0, -1);
        this.mesh.updateMatrixWorld();
        dir.transformDirection(this.mesh.matrixWorld);
        return dir;
    }
}

// Projectile class
class Projectile {
    constructor(position, velocity, owner) {
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.owner = owner;
        this.life = 5;
        this.active = true;
        
        const geom = new THREE.SphereGeometry(0.015, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0x222222 });
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.position.copy(position);
    }
    
    update(dt, players, scene) {
        if (!this.active) return;
        
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return;
        }
        
        this.velocity.y -= 9.8 * dt * 0.3;
        
        const moveStep = this.velocity.clone().multiplyScalar(dt);
        const newPos = this.position.clone().add(moveStep);
        
        for (const player of players) {
            if (player === this.owner) continue;
            
            const dist = newPos.distanceTo(player.position);
            if (dist < 0.5) {
                player.takeDamage(100);
                this.active = false;
                this.createHitEffect(scene, newPos);
                playSound('hit');
                return;
            }
        }
        
        if (newPos.y < 0) {
            this.active = false;
            this.createHitEffect(scene, newPos);
            return;
        }
        
        this.position.copy(newPos);
        this.mesh.position.copy(this.position);
    }
    
    createHitEffect(scene, pos) {
        const particleCount = 8;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
            
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 3,
                (Math.random() - 0.5) * 3
            ));
        }
        
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const mat = new THREE.PointsMaterial({ 
            color: 0x8b4513, 
            size: 0.05,
            transparent: true
        });
        
        const particles = new THREE.Points(geom, mat);
        scene.add(particles);
        
        gameState.particles.push({
            mesh: particles,
            velocities,
            life: 0.5
        });
    }
}

// Player class
class Player {
    constructor(scene, isPlayer2 = false) {
        this.scene = scene;
        this.isPlayer2 = isPlayer2;
        this.position = new THREE.Vector3(
            isPlayer2 ? 15 : -15,
            1.6,
            (Math.random() - 0.5) * 10
        );
        this.rotation = new THREE.Euler(0, isPlayer2 ? Math.PI : 0, 0);
        this.health = 100;
        this.alive = true;
        
        this.velocity = new THREE.Vector3();
        this.speed = 3;
        
        this.aiming = false;
        this.aimTransition = 0;
        this.leanAngle = 0;
        
        this.swayTime = 0;
        this.breathingRate = 0.5;
        
        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
        this.camera.position.copy(this.position);
        
        this.musket = new Musket(scene, isPlayer2);
        this.updateMusketTransform();
    }
    
    update(dt, input) {
        if (!this.alive) return;
        
        this.swayTime += dt;
        
        if (input.aim) {
            this.aiming = true;
        } else {
            this.aiming = false;
        }
        
        const targetAim = this.aiming ? 1 : 0;
        this.aimTransition = lerp(this.aimTransition, targetAim, dt * 5);
        
        const moveSpeed = this.speed * (1 - this.aimTransition * 0.7);
        
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(this.rotation);
        forward.y = 0;
        forward.normalize();
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyEuler(this.rotation);
        right.y = 0;
        right.normalize();
        
        const moveDir = new THREE.Vector3();
        if (input.forward) moveDir.add(forward);
        if (input.backward) moveDir.sub(forward);
        if (input.left) moveDir.sub(right);
        if (input.right) moveDir.add(right);
        
        if (moveDir.length() > 0) {
            moveDir.normalize();
            this.position.add(moveDir.multiplyScalar(moveSpeed * dt));
        }
        
        this.position.x = clamp(this.position.x, -40, 40);
        this.position.z = clamp(this.position.z, -40, 40);
        
        const leanTarget = input.leanLeft ? -0.3 : (input.leanRight ? 0.3 : 0);
        this.leanAngle = lerp(this.leanAngle, leanTarget, dt * 10);
        
        this.updateCamera();
        this.updateMusketTransform();
        this.musket.update(dt);
        
        if (input.fire && this.musket.loaded) {
            if (this.musket.fire()) {
                this.fireProjectile();
            }
        }
        
        if (input.reload) {
            this.musket.startReload();
        }
    }
    
    updateCamera() {
        const baseFOV = 60;
        const aimFOV = 25;
        this.camera.fov = lerp(baseFOV, aimFOV, this.aimTransition);
        this.camera.updateProjectionMatrix();
        
        const breatheY = Math.sin(this.swayTime * this.breathingRate) * 0.01;
        const swayX = Math.sin(this.swayTime * 0.3) * 0.002 * (1 + this.aimTransition);
        
        this.camera.position.copy(this.position);
        this.camera.position.y += breatheY;
        
        this.camera.rotation.x = this.rotation.x;
        this.camera.rotation.y = this.rotation.y;
        this.camera.rotation.z = this.leanAngle;
        
        if (this.aimTransition > 0.1) {
            this.camera.rotation.x += swayX * this.aimTransition;
            this.camera.rotation.y += Math.sin(this.swayTime * 0.4) * 0.001 * this.aimTransition;
        }
    }
    
    updateMusketTransform() {
        this.musket.mesh.position.copy(this.camera.position);
        this.musket.mesh.rotation.copy(this.camera.rotation);
        
        const hipOffset = new THREE.Vector3(0.3, -0.3, -0.4);
        const aimOffset = new THREE.Vector3(0, -0.15, -0.6);
        
        const currentOffset = new THREE.Vector3().lerpVectors(hipOffset, aimOffset, this.aimTransition);
        currentOffset.applyEuler(this.camera.rotation);
        this.musket.mesh.position.add(currentOffset);
        
        if (this.aimTransition > 0) {
            const aimRotX = lerp(0, -0.1, this.aimTransition);
            this.musket.mesh.rotation.x += aimRotX;
        }
    }
    
    fireProjectile() {
        const muzzlePos = this.musket.getMuzzlePosition();
        const direction = this.musket.getMuzzleDirection();
        
        const accuracy = this.aiming ? 0.01 : 0.05;
        direction.x += (Math.random() - 0.5) * accuracy;
        direction.y += (Math.random() - 0.5) * accuracy;
        direction.z += (Math.random() - 0.5) * accuracy;
        direction.normalize();
        
        const velocity = direction.multiplyScalar(120);
        
        const proj = new Projectile(muzzlePos, velocity, this);
        gameState.projectiles.push(proj);
        this.scene.add(proj.mesh);
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
            checkWinCondition();
        }
    }
    
    getInput() {
        if (this.isPlayer2) {
            return {
                forward: keys['i'],
                backward: keys['k'],
                left: keys['j'],
                right: keys['l'],
                leanLeft: keys['u'],
                leanRight: keys['o'],
                aim: keys[','],
                fire: keys['.'],
                reload: keys['p']
            };
        }
        return {
            forward: keys['w'],
            backward: keys['s'],
            left: keys['a'],
            right: keys['d'],
            leanLeft: keys['q'],
            leanRight: keys['e'],
            aim: keys['x'],
            fire: keys['f'],
            reload: keys['r']
        };
    }
}

// Setup scene
function setupScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xcccccc, 20, 100);
    
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    const groundGeom = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3d5c3d });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    
    // Add cover
    for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        if (Math.abs(x) > 10) {
            createCover(x, z);
        }
    }
}

function createCover(x, z) {
    const geom = new THREE.ConeGeometry(1.5, 4, 8);
    const mat = new THREE.MeshLambertMaterial({ color: 0x2d4c2d });
    const tree = new THREE.Mesh(geom, mat);
    tree.position.set(x, 2, z);
    scene.add(tree);
    
    const trunkGeom = new THREE.CylinderGeometry(0.3, 0.4, 1, 8);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.set(x, 0.5, z);
    scene.add(trunk);
}

function checkWinCondition() {
    if (!player1.alive) {
        gameState.winner = 2;
        document.getElementById('winner-text').textContent = 'PLAYER 2 WINS';
        document.getElementById('winner').style.display = 'block';
    } else if (!player2.alive) {
        gameState.winner = 1;
        document.getElementById('winner-text').textContent = 'PLAYER 1 WINS';
        document.getElementById('winner').style.display = 'block';
    }
}

function updateUI() {
    const p1Info = player1.musket.getReloadInfo();
    document.getElementById('p1-health').style.width = player1.health + '%';
    document.getElementById('p1-ammo').textContent = p1Info.loaded ? '1/1' : '0/1';
    document.getElementById('p1-reload').style.width = (p1Info.progress * 100) + '%';
    document.getElementById('p1-reload-label').textContent = p1Info.state;
    document.getElementById('p1-aim').style.color = player1.aiming ? '#00ff00' : '#c9a227';
    
    const p2Info = player2.musket.getReloadInfo();
    document.getElementById('p2-health').style.width = player2.health + '%';
    document.getElementById('p2-ammo').textContent = p2Info.loaded ? '1/1' : '0/1';
    document.getElementById('p2-reload').style.width = (p2Info.progress * 100) + '%';
    document.getElementById('p2-reload-label').textContent = p2Info.state;
    document.getElementById('p2-aim').style.color = player2.aiming ? '#00ff00' : '#c9a227';
}

function render() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    renderer.clear(true, true, true);
    
    renderer.setViewport(0, 0, width / 2, height);
    renderer.setScissor(0, 0, width / 2, height);
    renderer.render(scene, player1.camera);
    
    renderer.clear(false, true, true);
    
    renderer.setViewport(width / 2, 0, width / 2, height);
    renderer.setScissor(width / 2, 0, width / 2, height);
    renderer.render(scene, player2.camera);
    
    renderer.setScissorTest(false);
}

function gameLoop() {
    if (!gameState.running) return;
    
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    
    player1.update(dt, player1.getInput());
    player2.update(dt, player2.getInput());
    
    gameState.projectiles = gameState.projectiles.filter(proj => {
        proj.update(dt, gameState.players, scene);
        if (!proj.active) {
            scene.remove(proj.mesh);
        }
        return proj.active;
    });
    
    gameState.particles = gameState.particles.filter(p => {
        p.life -= dt;
        if (p.life <= 0) {
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
            scene.remove(p.mesh);
            return false;
        }
        
        const positions = p.mesh.geometry.attributes.position.array;
        for (let i = 0; i < p.velocities.length; i++) {
            positions[i * 3] += p.velocities[i].x * dt;
            positions[i * 3 + 1] += p.velocities[i].y * dt;
            positions[i * 3 + 2] += p.velocities[i].z * dt;
            p.velocities[i].y -= 9.8 * dt;
        }
        p.mesh.geometry.attributes.position.needsUpdate = true;
        p.mesh.material.opacity = p.life / 0.5;
        
        return true;
    });
    
    updateUI();
    render();
    
    requestAnimationFrame(gameLoop);
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    initializeGame();
}
