import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { Player } from './player.js';
import { Projectile, createMuzzleFlash } from './projectile.js';

// Audio context for sound effects
let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

export function playShootSound() {
    if (!audioContext) return;
    
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.3);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.5, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.5);
}

export function playReloadSound(step) {
    if (!audioContext) return;
    
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = step === 'ram' ? 'square' : 'sine';
    const freq = step === 'powder' ? 400 : step === 'ball' ? 300 : step === 'ram' ? 200 : 600;
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    
    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.15);
}

// Game state
const gameState = {
    isRunning: false,
    players: [],
    projectiles: [],
    walls: [],
    audioContext: null,
    scene: null,
    renderer: null
};

window.gameState = gameState;

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
gameState.scene = scene;

// Ground
const groundGeometry = new THREE.PlaneGeometry(200, 200);
const groundMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x3a5a3a,
    side: THREE.DoubleSide
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Grid pattern on ground for depth perception
const gridHelper = new THREE.GridHelper(200, 40, 0x2a4a2a, 0x2a4a2a);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

// Dueling arena barriers
function createBarrier(x, z, w, d) {
    const geo = new THREE.BoxGeometry(w, 2, d);
    const mat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 1, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
}

// Create arena - stone walls
const walls = [
    createBarrier(0, -30, 60, 2),   // North wall
    createBarrier(0, 30, 60, 2),    // South wall  
    createBarrier(-30, 0, 2, 60),   // West wall
    createBarrier(30, 0, 2, 60),    // East wall
];

// Obstacles
const obstacles = [
    createBarrier(-15, -15, 4, 4),
    createBarrier(15, 15, 4, 4),
    createBarrier(-15, 15, 4, 4),
    createBarrier(15, -15, 4, 4),
    createBarrier(0, 0, 3, 8),
];

gameState.walls = walls.concat(obstacles);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(50, 100, 50);
sunLight.castShadow = true;
sunLight.shadow.camera.left = -50;
sunLight.shadow.camera.right = 50;
sunLight.shadow.camera.top = 50;
sunLight.shadow.camera.bottom = -50;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setScissorTest(true);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
gameState.renderer = renderer;

document.getElementById('gameContainer').appendChild(renderer.domElement);

// Input handling
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;
});

// Player 1 input mapping
const p1Input = {
    forward: () => keys['w'],
    backward: () => keys['s'],
    left: () => keys['a'],
    right: () => keys['d'],
    tiltLeft: () => keys['q'],
    tiltRight: () => keys['e'],
    aim: () => keys['x'],
    fire: () => keys['f'],
    reload: () => keys['r']
};

// Player 2 input mapping (Arrow keys + U/O/M/Enter/P)
const p2Input = {
    forward: () => keys['arrowup'],
    backward: () => keys['arrowdown'],
    left: () => keys['arrowleft'],
    right: () => keys['arrowright'],
    tiltLeft: () => keys['u'],
    tiltRight: () => keys['o'],
    aim: () => keys['m'],
    fire: () => keys['enter'],
    reload: () => keys['p']
};

// Create players
const player1 = new Player(scene, 1, -20, 0, 0, 0x4a9eff, p1Input);
const player2 = new Player(scene, 2, 20, 0, Math.PI, 0xff6b4a, p2Input);

gameState.players = [player1, player2];

// Export spawn function for musket to use
export function spawnProjectile(position, direction, velocity, owner) {
    const proj = new Projectile(scene, position, direction.clone().multiplyScalar(velocity), owner);
    gameState.projectiles.push(proj);
    
    createMuzzleFlash(scene, position);
    playShootSound();
}

// Render function with proper split-screen
function render() {
    const width = renderer.domElement.width;
    const height = renderer.domElement.height;
    
    // Player 1 (top half)
    const p1Height = Math.floor(height / 2);
    renderer.setScissor(0, height - p1Height, width, p1Height);
    renderer.setViewport(0, height - p1Height, width, p1Height);
    player1.camera.aspect = width / p1Height;
    player1.camera.updateProjectionMatrix();
    renderer.render(scene, player1.camera);
    
    // Player 2 (bottom half)
    const p2Height = Math.floor(height / 2);
    renderer.setScissor(0, 0, width, p2Height);
    renderer.setViewport(0, 0, width, p2Height);
    player2.camera.aspect = width / p2Height;
    player2.camera.updateProjectionMatrix();
    renderer.render(scene, player2.camera);
}

// Main game loop
let lastTime = 0;

function gameLoop(currentTime) {
    if (!gameState.isRunning) return;
    
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    
    // Update players
    player1.update(deltaTime);
    player2.update(deltaTime);
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const proj = gameState.projectiles[i];
        proj.update(deltaTime);
        if (!proj.active) {
            gameState.projectiles.splice(i, 1);
        }
    }
    
    // Render both views
    render();
    
    requestAnimationFrame(gameLoop);
}

// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start game
document.getElementById('startBtn').addEventListener('click', () => {
    initAudio();
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    gameState.isRunning = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
});
