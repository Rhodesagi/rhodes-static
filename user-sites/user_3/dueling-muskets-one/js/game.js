import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { InputManager, P1_KEYS, P2_KEYS } from './input.js';
import { Player } from './player.js';
import { SplitScreenRenderer } from './renderer.js';

class Game {
    constructor() {
        this.setupRenderer();
        this.setupScene();
        this.setupPlayers();
        this.setupInput();
        this.setupEnvironment();
        
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    setupRenderer() {
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas, 
            antialias: true,
            alpha: false
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 200;
        sunLight.shadow.camera.left = -50;
        sunLight.shadow.camera.right = 50;
        sunLight.shadow.camera.top = 50;
        sunLight.shadow.camera.bottom = -50;
        this.scene.add(sunLight);
    }
    
    setupPlayers() {
        // Player 1 - starts on left side, faces right
        this.player1 = new Player(
            this.scene,
            -20, 0, // Position
            0x4ecdc4, // Color
            P1_KEYS,
            true
        );
        this.player1.rotation = Math.PI / 2; // Face +X
        
        // Player 2 - starts on right side, faces left
        this.player2 = new Player(
            this.scene,
            20, 0, // Position
            0xff6b6b, // Color
            P2_KEYS,
            false
        );
        this.player2.rotation = -Math.PI / 2; // Face -X
        
        // Setup split-screen renderer
        this.splitRenderer = new SplitScreenRenderer(
            this.renderer,
            this.player1,
            this.player2
        );
    }
    
    setupInput() {
        this.input = new InputManager();
    }
    
    setupEnvironment() {
        // Ground
        const groundGeo = new THREE.PlaneGeometry(200, 200, 40, 40);
        
        // Create uneven terrain
        const positions = groundGeo.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const height = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 +
                          Math.sin(x * 0.3) * Math.sin(y * 0.2) * 0.2;
            positions.setZ(i, height);
        }
        groundGeo.computeVertexNormals();
        
        const groundMat = new THREE.MeshLambertMaterial({ 
            color: 0x3d5c3d,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add some trees/rocks for cover
        this.addScenery();
        
        // Boundary markers
        this.addBoundaries();
    }
    
    addScenery() {
        // Trees
        const treePositions = [
            [-30, -30], [-25, 15], [15, -25], [30, 20],
            [-10, -40], [10, 35], [-35, 5], [35, -10],
            [0, -15], [-15, 25], [20, -5]
        ];
        
        for (const [x, z] of treePositions) {
            this.createTree(x, z);
        }
        
        // Rocks
        const rockPositions = [
            [-15, -10], [18, 12], [-28, 25], [25, -28]
        ];
        
        for (const [x, z] of rockPositions) {
            this.createRock(x, z);
        }
    }
    
    createTree(x, z) {
        const group = new THREE.Group();
        
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3c2a });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        group.add(trunk);
        
        // Leaves (multiple spheres for irregular shape)
        const leavesMat = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        
        for (let i = 0; i < 5; i++) {
            const size = 1.2 + Math.random() * 0.8;
            const leavesGeo = new THREE.SphereGeometry(size, 8, 6);
            const leaves = new THREE.Mesh(leavesGeo, leavesMat);
            leaves.position.y = 3 + Math.random() * 1.5;
            leaves.position.x = (Math.random() - 0.5) * 1.5;
            leaves.position.z = (Math.random() - 0.5) * 1.5;
            leaves.castShadow = true;
            group.add(leaves);
        }
        
        group.position.set(x, 0, z);
        this.scene.add(group);
    }
    
    createRock(x, z) {
        const size = 1.5 + Math.random();
        const rockGeo = new THREE.DodecahedronGeometry(size, 0);
        const rockMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(x, size * 0.4, z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        rock.receiveShadow = true;
        this.scene.add(rock);
    }
    
    addBoundaries() {
        // Add fence posts at edges
        for (let i = -40; i <= 40; i += 10) {
            this.createFencePost(i, -50);
            this.createFencePost(i, 50);
            this.createFencePost(-50, i);
            this.createFencePost(50, i);
        }
    }
    
    createFencePost(x, z) {
        const postGeo = new THREE.BoxGeometry(0.3, 2, 0.3);
        const postMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(x, 1, z);
        this.scene.add(post);
    }
    
    update(delta) {
        // Update input polling
        this.input.update();
        
        // Update players
        this.player1.update(delta, this.input, this.player2);
        this.player2.update(delta, this.input, this.player1);
        
        // Check projectile hits
        this.checkCollisions();
    }
    
    checkCollisions() {
        // P1 projectiles vs P2
        for (const p of this.player1.projectiles) {
            if (this.player2.checkProjectileHit(p)) {
                this.onHit(this.player1, this.player2);
            }
        }
        
        // P2 projectiles vs P1
        for (const p of this.player2.projectiles) {
            if (this.player1.checkProjectileHit(p)) {
                this.onHit(this.player2, this.player1);
            }
        }
    }
    
    onHit(shooter, target) {
        // Could add score tracking, kill feed, etc.
        console.log(`Hit! ${shooter === this.player1 ? 'P1' : 'P2'} hit ${target === this.player1 ? 'P1' : 'P2'}`);
    }
    
    render() {
        this.splitRenderer.render(this.scene);
    }
    
    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());
        
        const currentTime = performance.now();
        const delta = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = currentTime;
        
        this.update(delta);
        this.render();
    }
}

// Start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
