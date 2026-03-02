// THE DUELING MUSKETS - Two Player First Person Shooter
// Main game file

import { Musket } from './musket.js';
import { Player } from './player.js';
import { loadSounds } from './sounds.js';

// Global variables
let player1, player2;
let scene1, scene2, camera1, camera2, renderer1, renderer2;
let clock = new THREE.Clock();
let deltaTime = 0;

// Input state
const keys = {};

// Initialize game
function init() {
    // Create scenes
    scene1 = new THREE.Scene();
    scene2 = new THREE.Scene();
    
    // Create cameras (perspective)
    camera1 = new THREE.PerspectiveCamera(75, window.innerWidth / 2 / window.innerHeight, 0.1, 1000);
    camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / 2 / window.innerHeight, 0.1, 1000);
    
    // Position cameras (players start opposite each other)
    camera1.position.set(0, 1.7, 5);
    camera2.position.set(0, 1.7, -5);
    camera1.lookAt(0, 1.7, 0);
    camera2.lookAt(0, 1.7, 0);
    
    // Create renderers (split screen)
    const canvas1 = document.getElementById('player1Canvas');
    const canvas2 = document.getElementById('player2Canvas');
    
    renderer1 = new THREE.WebGLRenderer({ canvas: canvas1, antialias: true });
    renderer1.setSize(window.innerWidth / 2, window.innerHeight);
    renderer1.setClearColor(0x87CEEB); // sky blue
    
    renderer2 = new THREE.WebGLRenderer({ canvas: canvas2, antialias: true });
    renderer2.setSize(window.innerWidth / 2, window.innerHeight);
    renderer2.setClearColor(0x87CEEB);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene1.add(ambientLight);
    scene2.add(ambientLight.clone());
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene1.add(directionalLight);
    scene2.add(directionalLight.clone());
    
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3a7c3a });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene1.add(ground);
    scene2.add(ground.clone());
    
    // Add some trees/obstacles
    createEnvironment(scene1);
    createEnvironment(scene2);
    
    // Create players
    player1 = new Player(camera1, scene1, 1);
    player2 = new Player(camera2, scene2, 2);
    
    // Load sounds
    loadSounds();
    
    // Event listeners
    window.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        // Prevent default for game keys
        if (['w','a','s','d','q','e','r','x','f','arrowup','arrowdown','arrowleft','arrowright','i','k','l','m','n'].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
    
    window.addEventListener('resize', onWindowResize);
    
    // Start game loop
    animate();
}

function createEnvironment(scene) {
    // Simple trees
    const treeTrunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3);
    const treeTrunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const treeTopGeometry = new THREE.ConeGeometry(2, 4);
    const treeTopMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5a27 });
    
    for (let i = 0; i < 10; i++) {
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        if (Math.abs(x) < 10 && Math.abs(z) < 10) continue; // avoid spawn area
        
        const trunk = new THREE.Mesh(treeTrunkGeometry, treeTrunkMaterial);
        trunk.position.set(x, 1.5, z);
        scene.add(trunk);
        
        const top = new THREE.Mesh(treeTopGeometry, treeTopMaterial);
        top.position.set(x, 4, z);
        scene.add(top);
    }
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
    requestAnimationFrame(animate);
    deltaTime = clock.getDelta();
    
    // Update players
    player1.update(keys, deltaTime);
    player2.update(keys, deltaTime);
    
    // Render
    renderer1.render(scene1, camera1);
    renderer2.render(scene2, camera2);
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', init);