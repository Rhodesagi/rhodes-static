// Main game setup for split-screen musket duel
console.log('Loading The Dueling Muskets...');

// Global variables - attach to window for other scripts
window.scene1 = window.scene2 = null;
window.camera1 = window.camera2 = null;
window.renderer = null;
window.controls1 = window.controls2 = null;
window.clock = new THREE.Clock();
window.player1 = window.player2 = null;
window.muskets = [];

// Initialize the game
function init() {
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.autoClear = false; // We'll clear manually for split-screen
    document.body.appendChild(renderer.domElement);

    // Create scenes
    scene1 = new THREE.Scene();
    scene2 = new THREE.Scene();
    
    scene1.background = new THREE.Color(0x87CEEB); // Sky blue
    scene2.background = new THREE.Color(0x87CEEB);

    // Create cameras (first-person)
    camera1 = new THREE.PerspectiveCamera(75, window.innerWidth / 2 / window.innerHeight, 0.1, 1000);
    camera1.position.set(0, 1.7, 5);
    
    camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / 2 / window.innerHeight, 0.1, 1000);
    camera2.position.set(10, 1.7, 5);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene1.add(ambientLight);
    scene2.add(ambientLight.clone());
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    scene1.add(directionalLight);
    scene2.add(directionalLight.clone());

    // Create ground
    createGround(scene1);
    createGround(scene2);

    // Create simple environment
    createEnvironment(scene1);
    createEnvironment(scene2);

    // Create players (visible as muskets)
    player1 = createMusket(scene1, camera1, 0x8B4513);
    player2 = createMusket(scene2, camera2, 0x2F4F4F);
    
    muskets.push(player1);
    muskets.push(player2);

    // Set up controls
    if (typeof initControls === 'function') initControls();
    
    // Initialize reload system
    if (typeof initReloadSystem === 'function') setTimeout(initReloadSystem, 500);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
}

function createGround(scene) {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3a5f0b });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
}

function createEnvironment(scene) {
    // Add some trees or obstacles
    const treeGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
    const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const leavesGeometry = new THREE.SphereGeometry(2, 8, 6);
    const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    
    for (let i = 0; i < 10; i++) {
        const tree = new THREE.Mesh(treeGeometry, treeMaterial);
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        
        tree.position.set(x, 2.5, z);
        leaves.position.set(x, 6, z);
        
        scene.add(tree);
        scene.add(leaves);
    }
}

function createMusket(scene, camera, color) {
    // Create a simple musket model attached to camera
    const musketGroup = new THREE.Group();
    
    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: color });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.3, -0.2, -0.5);
    
    // Stock
    const stockGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.8);
    const stockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(-0.7, -0.2, -0.5);
    
    // Trigger guard
    const guardGeometry = new THREE.TorusGeometry(0.08, 0.02, 8, 12, Math.PI);
    const guardMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const guard = new THREE.Mesh(guardGeometry, guardMaterial);
    guard.rotation.z = Math.PI / 2;
    guard.position.set(-0.3, -0.25, -0.5);
    
    musketGroup.add(barrel);
    musketGroup.add(stock);
    musketGroup.add(guard);
    
    // Attach to camera
    camera.add(musketGroup);
    musketGroup.position.set(0.5, -0.3, -1);
    
    return {
        group: musketGroup,
        camera: camera,
        isAiming: false,
        isLoaded: false,
        powder: 100,
        ball: 1,
        primed: false,
        reloading: false
    };
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera1.aspect = (width / 2) / height;
    camera1.updateProjectionMatrix();
    
    camera2.aspect = (width / 2) / height;
    camera2.updateProjectionMatrix();
    
    renderer.setSize(width, height);
}

// Global animation function
window.animate = function() {
    requestAnimationFrame(window.animate);
    
    const delta = clock.getDelta();
    
    // Update controls if they exist
    if (controls1) controls1.update(delta);
    if (controls2) controls2.update(delta);
    
    // Clear the whole screen
    renderer.clear();
    
    // Set viewport for player 1 (left half)
    renderer.setViewport(0, 0, window.innerWidth / 2, window.innerHeight);
    renderer.setScissor(0, 0, window.innerWidth / 2, window.innerHeight);
    renderer.setScissorTest(true);
    renderer.render(scene1, camera1);
    
    // Set viewport for player 2 (right half)
    renderer.setViewport(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
    renderer.setScissor(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
    renderer.setScissorTest(true);
    renderer.render(scene2, camera2);
}

// Start the game when page loads
window.addEventListener('DOMContentLoaded', init);