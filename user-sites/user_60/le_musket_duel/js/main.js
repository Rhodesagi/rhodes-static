import * as THREE from 'three';
import { InputManager } from './input.js';
import { World } from './world.js';
import { Player } from './player.js';
import { ProjectileManager } from './projectile.js';
import { AudioManager } from './audio.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.input = new InputManager();
        this.audio = new AudioManager();
        this.world = new World();
        this.projectiles = new ProjectileManager(this.world);
        
        // Create players with distinct key mappings
        this.player1 = new Player(1, 
            new THREE.Vector3(-8, 1.6, 0), 
            this.input.player1Keys,
            this.world,
            this.projectiles,
            this.audio
        );
        
        this.player2 = new Player(2, 
            new THREE.Vector3(8, 1.6, 0), 
            this.input.player2Keys,
            this.world,
            this.projectiles,
            this.audio
        );
        
        this.player1.setOpponent(this.player2);
        this.player2.setOpponent(this.player1);
        
        this.isRunning = false;
        this.clock = new THREE.Clock();
        
        this.setupViewportDivider();
        this.setupEventListeners();
        
        // Start render loop (but game logic waits for space)
        this.animate();
    }
    
    setupViewportDivider() {
        const divider = document.createElement('div');
        divider.className = 'viewport-divider';
        document.getElementById('ui-overlay').appendChild(divider);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isRunning) {
                this.startGame();
            }
        });
    }
    
    startGame() {
        this.isRunning = true;
        document.getElementById('instructions').classList.add('hidden');
        document.getElementById('start-text').style.display = 'none';
        
        // Resume audio context
        this.audio.resume();
        
        // Lock pointer on click for immersion
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
        });
    }
    
    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = Math.min(this.clock.getDelta(), 0.1);
        
        if (this.isRunning) {
            this.update(deltaTime);
        }
        
        this.render();
    }
    
    update(deltaTime) {
        this.input.update();
        this.player1.update(deltaTime);
        this.player2.update(deltaTime);
        this.projectiles.update(deltaTime);
        
        // Update reload status displays
        this.updateReloadDisplay(1, this.player1.musket.reloadStage);
        this.updateReloadDisplay(2, this.player2.musket.reloadStage);
    }
    
    updateReloadDisplay(playerNum, stage) {
        const statusEl = document.getElementById(`reload-status-p${playerNum}`);
        if (!statusEl) return;
        
        const stages = {
            'idle': '',
            'shouldering': 'Shouldering...',
            'half_cock': 'Half-cock...',
            'open_pan': 'Opening pan...',
            'main_powder': 'Pouring powder...',
            'ball_patch': 'Loading ball & patch...',
            'ramrod_1': 'Ramming (1/3)...',
            'ramrod_2': 'Ramming (2/3)...',
            'ramrod_3': 'Ramming (3/3)...',
            'prime_pan': 'Priming pan...',
            'close_pan': 'Closing pan...',
            'full_cock': 'Cocking...'
        };
        
        statusEl.textContent = stages[stage] || '';
    }
    
    render() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        // Clear the entire canvas first
        this.renderer.setScissorTest(false);
        this.renderer.setClearColor(0x111111, 1);
        this.renderer.clear();
        
        // Render Player 1 viewport (left half)
        this.renderer.setScissorTest(true);
        this.renderer.setScissor(0, 0, width / 2, height);
        this.renderer.setViewport(0, 0, width / 2, height);
        
        // Only render player 2's body for P1, not their weapon
        this.world.scene.add(this.player2.mesh);
        this.player2.hideWeapon();
        this.player1.showWeapon();
        
        this.renderer.render(this.world.scene, this.player1.camera);
        
        // Render Player 2 viewport (right half)
        this.renderer.setScissor(width / 2, 0, width / 2, height);
        this.renderer.setViewport(width / 2, 0, width / 2, height);
        
        // Only render player 1's body for P2, not their weapon
        this.player1.hideWeapon();
        this.player2.showWeapon();
        
        this.renderer.render(this.world.scene, this.player2.camera);
        
        // Restore both weapons for next frame update
        this.player1.showWeapon();
        this.player2.showWeapon();
    }
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});