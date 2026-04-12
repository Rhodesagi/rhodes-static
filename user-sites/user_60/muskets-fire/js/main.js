import * as THREE from 'three';
import { Player } from './player.js';
import { InputManager } from './input.js';
import { World } from './world.js';
import { AudioManager } from './audio.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.autoClear = false;
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
        
        this.world = new World(this.scene);
        this.audio = new AudioManager();
        this.input = new InputManager();
        
        this.players = [];
        this.isRunning = false;
        this.clock = new THREE.Clock();
        
        this.setupPlayers();
        this.setupLighting();
        this.setupEventListeners();
        this.showStartScreen();
        
        this.resize();
    }
    
    setupPlayers() {
        // Player 1 - Top half, WASD + Mouse
        const p1 = new Player({
            id: 1,
            position: new THREE.Vector3(-10, 1.6, 0),
            color: 0x3366ff,
            inputConfig: 'mouse',
            scene: this.scene,
            audio: this.audio
        });
        
        // Player 2 - Bottom half, Arrow keys + IJKL
        const p2 = new Player({
            id: 2,
            position: new THREE.Vector3(10, 1.6, 0),
            color: 0xff3333,
            inputConfig: 'keyboard',
            scene: this.scene,
            audio: this.audio
        });
        
        this.players = [p1, p2];
    }
    
    setupLighting() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);
        
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        this.scene.add(sun);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        
        const centerMsg = document.getElementById('center-message');
        centerMsg.addEventListener('click', () => this.start());
        
        // Prevent context menu
        document.addEventListener('contextmenu', e => e.preventDefault());
    }
    
    showStartScreen() {
        const msg = document.getElementById('center-message');
        const text = document.getElementById('message-text');
        text.textContent = 'MUSKETS FIRE';
        msg.classList.remove('hidden');
        
        // Setup input handlers
        this.input.setupMouseHandler(this.canvas, 1);
        this.input.setupKeyboardHandler();
    }
    
    start() {
        document.getElementById('center-message').classList.add('hidden');
        this.isRunning = true;
        this.audio.init();
        this.loop();
    }
    
    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer.setSize(width, height);
        
        this.players.forEach(player => {
            player.camera.aspect = width / (height / 2);
            player.camera.updateProjectionMatrix();
        });
    }
    
    update(delta) {
        // Update input
        this.input.update();
        
        // Update players
        this.players.forEach(player => {
            player.update(delta, this.input, this.players);
        });
        
        // Update UI
        this.updateUI();
    }
    
    updateUI() {
        this.players.forEach(player => {
            const healthEl = document.getElementById(`p${player.id}-health`);
            const reloadEl = document.getElementById(`p${player.id}-reload-status`);
            
            if (healthEl) {
                healthEl.style.width = `${player.health}%`;
            }
            
            if (reloadEl && player.musket) {
                const stage = player.musket.getReloadStageName();
                reloadEl.textContent = stage || '';
            }
        });
    }
    
    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear entire canvas
        this.renderer.setScissorTest(false);
        this.renderer.clear();
        
        // Player 1 viewport - Top half
        this.renderer.setScissorTest(true);
        this.renderer.setScissor(0, height / 2, width, height / 2);
        this.renderer.setViewport(0, height / 2, width, height / 2);
        this.renderer.render(this.scene, this.players[0].camera);
        
        // Player 2 viewport - Bottom half  
        this.renderer.setScissor(0, 0, width, height / 2);
        this.renderer.setViewport(0, 0, width, height / 2);
        this.renderer.render(this.scene, this.players[1].camera);
    }
    
    loop() {
        if (!this.isRunning) return;
        
        const delta = this.clock.getDelta();
        this.update(delta);
        this.render();
        
        requestAnimationFrame(() => this.loop());
    }
}

new Game();
