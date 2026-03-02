// Main game module - coordinates split-screen, game state, loop

let scene, camera1, camera2, renderer1, renderer2;
let player1, player2;
let terrain;
let muskets = [];
let bullets = [];
let gameOver = false;

const PLAYER_HEIGHT = 1.7;
const GRAVITY = -9.8;
const BULLET_SPEED = 50;

function init() {
    // Create a single scene shared by both players
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a3c1a, 10, 50);
    
    // Lighting
    const ambient = new THREE.AmbientLight(0x404040);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(10, 20, 5);
    scene.add(directional);
    
    // Create terrain
    terrain = createTerrain();
    scene.add(terrain);
    
    // Create players
    player1 = new Player(1, -10, 0, 0);
    player2 = new Player(2, 10, 0, Math.PI);
    scene.add(player1.mesh);
    scene.add(player2.mesh);
    
    // Initialize cameras and renderers for split-screen
    initRenderers();
    
    // Create muskets
    const musket1 = new Musket(player1);
    const musket2 = new Musket(player2);
    muskets.push(musket1, musket2);
    scene.add(musket1.group);
    scene.add(musket2.group);
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    
    // Start game loop
    animate();
}

function initRenderers() {
    const width = window.innerWidth / 2;
    const height = window.innerHeight;
    
    // Player 1 camera (left half)
    camera1 = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera1.position.set(0, PLAYER_HEIGHT, 0);
    
    // Player 2 camera (right half)
    camera2 = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera2.position.set(0, PLAYER_HEIGHT, 0);
    
    // Renderer for left half
    const canvas1 = document.getElementById('player1-canvas');
    renderer1 = new THREE.WebGLRenderer({ canvas: canvas1, antialias: true });
    renderer1.setSize(width, height);
    renderer1.setPixelRatio(window.devicePixelRatio);
    
    // Renderer for right half
    const canvas2 = document.getElementById('player2-canvas');
    renderer2 = new THREE.WebGLRenderer({ canvas: canvas2, antialias: true });
    renderer2.setSize(width, height);
    renderer2.setPixelRatio(window.devicePixelRatio);
}

function onWindowResize() {
    const width = window.innerWidth / 2;
    const height = window.innerHeight;
    
    camera1.aspect = width / height;
    camera1.updateProjectionMatrix();
    camera2.aspect = width / height;
    camera2.updateProjectionMatrix();
    
    renderer1.setSize(width, height);
    renderer2.setSize(width, height);
}

function animate() {
    if (gameOver) return;
    requestAnimationFrame(animate);
    
    const deltaTime = 0.016; // approximate
    
    // Update players
    player1.update(deltaTime);
    player2.update(deltaTime);
    
    // Update muskets
    muskets.forEach(m => m.update(deltaTime));
    
    // Update bullets
    bullets.forEach((b, idx) => {
        b.position.add(b.velocity.clone().multiplyScalar(deltaTime));
        b.velocity.y += GRAVITY * deltaTime;
        
        // Check collision with terrain or players
        if (b.position.y < 0) {
            scene.remove(b);
            bullets.splice(idx, 1);
        }
    });
    
    // Update cameras to follow players
    camera1.position.copy(player1.mesh.position);
    camera1.position.y += PLAYER_HEIGHT;
    camera1.rotation.copy(player1.mesh.rotation);
    
    camera2.position.copy(player2.mesh.position);
    camera2.position.y += PLAYER_HEIGHT;
    camera2.rotation.copy(player2.mesh.rotation);
    
    // Render each view
    renderer1.render(scene, camera1);
    renderer2.render(scene, camera2);
}

function fireBullet(player, musket) {
    const bullet = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffaa00 })
    );
    
    // Position at musket muzzle
    const muzzle = musket.getMuzzlePosition();
    bullet.position.copy(muzzle);
    
    // Direction based on player aim
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(player.mesh.quaternion);
    direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), musket.tiltAngle);
    direction.normalize();
    
    bullet.velocity = direction.multiplyScalar(BULLET_SPEED);
    scene.add(bullet);
    bullets.push(bullet);
    
    // Check hit
    setTimeout(() => checkHit(bullet, player.id === 1 ? player2 : player1), 50);
}

function checkHit(bullet, targetPlayer) {
    const distance = bullet.position.distanceTo(targetPlayer.mesh.position);
    if (distance < 1.0) {
        endGame(targetPlayer.id === 1 ? 2 : 1);
    }
}

function endGame(winner) {
    gameOver = true;
    document.getElementById('winner-text').textContent = `Player ${winner} wins!`;
    document.getElementById('game-over').classList.remove('hidden');
}

function resetGame() {
    // Reload page for simplicity
    location.reload();
}

// Initialize when page loads
window.addEventListener('load', init);