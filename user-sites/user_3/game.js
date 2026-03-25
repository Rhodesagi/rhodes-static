// MUSKETS FIRE 3 - Core Game Engine
// Pseudo-3D Raycasting Two-Player Musket Duel

import { Player } from './player.js';
import { Musket } from './musket.js';
import { Map } from './map.js';
import { renderSplitScreen, drawIronSights, updateHUD, showWinnerScreen } from './ui.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.running = false;
        this.gameOver = false;
        this.winner = null;
        
        // Players
        this.player1 = new Player(1, 3.5, 3.5, Math.PI * 0.25, 0.66);
        this.player2 = new Player(2, 6.5, 6.5, Math.PI * 1.75, 0.66);
        
        // Muskets
        this.musket1 = new Musket(this.player1);
        this.musket2 = new Musket(this.player2);
        
        // Game map
        this.map = new Map();
        
        // Input state
        this.keys = {};
        this.mouse = { x: 0, y: 0, buttons: {} };
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Viewport dimensions (split screen)
        this.screenWidth = 0;
        this.screenHeight = 0;
        this.halfHeight = 0;
        
        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        
        this.init();
    }
    
    init() {
        // Set up event listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.handleMouseUp);
        window.addEventListener('resize', this.handleResize);
        
        // Initial resize
        this.handleResize();
        
        // Start button listener
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restart-button').addEventListener('click', () => {
            this.restartGame();
        });
        
        console.log('Game initialized. Awaiting start command.');
    }
    
    startGame() {
        if (this.running) return;
        
        // Hide title screen, show HUD
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('winner-display').classList.add('hidden');
        
        // Reset game state
        this.gameOver = false;
        this.winner = null;
        
        // Reset players
        this.player1.reset();
        this.player2.reset();
        
        // Reset muskets
        this.musket1.reset();
        this.musket2.reset();
        
        // Start game loop
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
        
        console.log('Game started!');
    }
    
    restartGame() {
        this.startGame();
    }
    
    handleResize() {
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.halfHeight = Math.floor(this.screenHeight / 2);
        
        this.canvas.width = this.screenWidth;
        this.canvas.height = this.screenHeight;
        
        console.log(`Resized to ${this.screenWidth}x${this.screenHeight}, half height: ${this.halfHeight}`);
    }
    
    handleKeyDown(e) {
        this.keys[e.key.toLowerCase()] = true;
        
        // Prevent default for game keys
        const gameKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'r', 'enter', 'shift', 'control'];
        if (gameKeys.includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
    }
    
    handleMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }
    
    handleMouseDown(e) {
        this.mouse.buttons[e.button] = true;
        if (e.button === 0) { // Left click
            e.preventDefault();
        }
    }
    
    handleMouseUp(e) {
        this.mouse.buttons[e.button] = false;
    }
    
    update(deltaTime) {
        // Update players
        this.player1.update(deltaTime, this.keys, this.mouse, this.map);
        this.player2.update(deltaTime, this.keys, this.mouse, this.map);
        
        // Update muskets
        this.musket1.update(deltaTime, this.keys, this.mouse.buttons[0] || false);
        this.musket2.update(deltaTime, this.keys, this.mouse.buttons[0] || false);
        
        // Check for hits
        this.checkHits();
        
        // Update HUD
        updateHUD(this.player1, this.player2, this.musket1, this.musket2);
        
        // Check for winner
        if (this.player1.health <= 0) {
            this.gameOver = true;
            this.winner = this.player2;
        } else if (this.player2.health <= 0) {
            this.gameOver = true;
            this.winner = this.player1;
        }
        
        if (this.gameOver && this.winner) {
            showWinnerScreen(this.winner);
            this.running = false;
        }
    }
    
    checkHits() {
        // Check if player1's bullet hits player2
        if (this.musket1.bulletActive) {
            const dx = this.musket1.bulletX - this.player2.x;
            const dy = this.musket1.bulletY - this.player2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.5) { // Hit detection radius
                this.player2.takeDamage(34);
                this.musket1.bulletActive = false;
                console.log('Player 2 hit!');
            }
        }
        
        // Check if player2's bullet hits player1
        if (this.musket2.bulletActive) {
            const dx = this.musket2.bulletX - this.player1.x;
            const dy = this.musket2.bulletY - this.player1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.5) { // Hit detection radius
                this.player1.takeDamage(34);
                this.musket2.bulletActive = false;
                console.log('Player 1 hit!');
            }
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
        
        // Render split-screen views
        renderSplitScreen(this.ctx, this.player1, this.player2, this.map, 
                         this.screenWidth, this.halfHeight);
        
        // Draw iron sights
        drawIronSights(this.ctx, this.screenWidth, this.halfHeight, 
                      this.musket1.isAiming, this.musket2.isAiming);
    }
    
    gameLoop(currentTime) {
        this.deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        if (this.deltaTime > 0.1) this.deltaTime = 0.1; // Cap delta time
        
        if (this.running) {
            this.update(this.deltaTime);
            this.render();
        }
        
        requestAnimationFrame(this.gameLoop);
    }
}

// Start the game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});