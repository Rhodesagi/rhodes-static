// Muskets Fire - Pseudo-3D Split-Screen Musket FPS
// Main Game Engine

import { Game } from './modules/game.js';
import { InputManager } from './modules/input.js';
import { AudioManager } from './modules/audio.js';

class MusketsFireGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.game = new Game();
        this.input = new InputManager(this);
        this.audio = new AudioManager();
        
        this.lastTime = 0;
        this.isRunning = false;
        this.currentScreen = 'title';
        
        this.setupCanvas();
        this.setupEventListeners();
        this.loadAssets();
    }
    
    setupCanvas() {
        // Set canvas to full window size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Add resize handler
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    setupEventListeners() {
        // Start button
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });
        
        // Rematch button
        document.getElementById('rematch-button').addEventListener('click', () => {
            this.startGame();
        });
        
        // Menu button
        document.getElementById('menu-button').addEventListener('click', () => {
            this.showTitleScreen();
        });
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Click sound for all buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                this.audio.playSound('click');
            });
        });
    }
    
    loadAssets() {
        // Preload audio
        this.audio.preloadSounds([
            'gunshot',
            'reload',
            'hit',
            'footstep',
            'ambient'
        ]);
        
        // Load textures (placeholder textures for now)
        this.loadTextures();
    }
    
    loadTextures() {
        // Create procedural textures
        this.textures = {
            wall1: this.createBrickTexture(),
            wall2: this.createWoodTexture(),
            floor: this.createStoneTexture(),
            ceiling: this.createPlasterTexture()
        };
    }
    
    createBrickTexture() {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Brick pattern
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, size, size);
        
        ctx.fillStyle = '#A0522D';
        for (let y = 0; y < size; y += 8) {
            for (let x = 0; x < size; x += 16) {
                ctx.fillRect(x + (y % 16 === 0 ? 0 : 8), y, 8, 4);
            }
        }
        
        return canvas;
    }
    
    createWoodTexture() {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Wood grain
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(0, 0, size, size);
        
        ctx.strokeStyle = '#4E342E';
        ctx.lineWidth = 1;
        for (let y = 0; y < size; y += 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(
                size * 0.3, y + 2,
                size * 0.7, y - 2,
                size, y
            );
            ctx.stroke();
        }
        
        return canvas;
    }
    
    createStoneTexture() {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Stone pattern
        ctx.fillStyle = '#707070';
        ctx.fillRect(0, 0, size, size);
        
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 3 + 1;
            
            ctx.fillStyle = Math.random() > 0.5 ? '#808080' : '#606060';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        return canvas;
    }
    
    createPlasterTexture() {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Plaster texture
        ctx.fillStyle = '#E8E8E8';
        ctx.fillRect(0, 0, size, size);
        
        // Add some subtle noise
        for (let y = 0; y < size; y += 2) {
            for (let x = 0; x < size; x += 2) {
                const brightness = 220 + Math.random() * 30;
                ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
                ctx.fillRect(x, y, 2, 2);
            }
        }
        
        return canvas;
    }
    
    startGame() {
        document.getElementById('title-screen').style.display = 'none';
        document.getElementById('victory-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        
        this.game.reset();
        this.isRunning = true;
        this.lastTime = performance.now();
        
        this.audio.resumeContext();
        this.audio.playAmbient();
        
        this.gameLoop();
    }
    
    showTitleScreen() {
        document.getElementById('title-screen').style.display = 'flex';
        document.getElementById('victory-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'none';
        
        this.isRunning = false;
        this.audio.stopAmbient();
    }
    
    showVictoryScreen(winner) {
        this.isRunning = false;
        this.audio.stopAmbient();
        
        document.getElementById('victory-screen').style.display = 'flex';
        document.getElementById('victory-title').textContent = 'VICTORY';
        document.getElementById('victory-text').textContent = 
            `${winner === 1 ? 'RED COAT' : 'BLUE COAT'} WINS THE DUEL!`;
        
        this.audio.playSound('victory');
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        // Update game state
        this.game.update(deltaTime, this.input);
        
        // Check for victory
        if (this.game.checkVictory()) {
            this.showVictoryScreen(this.game.winner);
            return;
        }
        
        // Render game
        this.render();
        
        // Update HUD
        this.updateHUD();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // Render split-screen views
        this.renderSplitScreen();
    }
    
    renderSplitScreen() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Player 1 view (left half)
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width / 2, height);
        ctx.clip();
        
        this.renderPlayerView(this.game.player1, 0, 0, width / 2, height);
        ctx.restore();
        
        // Player 2 view (right half)
        ctx.save();
        ctx.beginPath();
        ctx.rect(width / 2, 0, width / 2, height);
        ctx.clip();
        
        this.renderPlayerView(this.game.player2, width / 2, 0, width / 2, height);
        ctx.restore();
        
        // Draw split line
        ctx.strokeStyle = '#5d4c2a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
    }
    
    renderPlayerView(player, x, y, width, height) {
        const ctx = this.ctx;
        
        // Calculate field of view based on iron sights
        const fov = player.isIronSight ? Math.PI / 6 : Math.PI / 3; // 30° or 60°
        const halfFov = fov / 2;
        
        // Raycasting walls
        for (let ray = 0; ray < width; ray++) {
            const rayAngle = player.angle - halfFov + (ray / width) * fov;
            
            // Ray casting logic
            const hitInfo = this.castRay(player.x, player.y, rayAngle);
            
            if (hitInfo.hit) {
                // Calculate wall height
                const wallHeight = Math.min(height * 0.8, height / hitInfo.distance);
                
                // Draw wall slice
                const wallY = (height - wallHeight) / 2;
                this.drawWallSlice(ray + x, wallY, 1, wallHeight, hitInfo);
            }
        }
        
        // Draw floor and ceiling
        this.drawFloorAndCeiling(x, y, width, height);
        
        // Draw musket if aiming down sights
        if (player.isIronSight) {
            this.drawIronSight(x, y, width, height);
        }
    }
    
    castRay(x, y, angle) {
        // Simplified ray casting for demo
        const map = this.game.map;
        const stepSize = 0.1;
        let rayX = x;
        let rayY = y;
        let distance = 0;
        
        while (distance < 20) {
            rayX += Math.cos(angle) * stepSize;
            rayY += Math.sin(angle) * stepSize;
            distance += stepSize;
            
            const mapX = Math.floor(rayX);
            const mapY = Math.floor(rayY);
            
            if (mapX < 0 || mapX >= map.width || mapY < 0 || mapY >= map.height) {
                return { hit: false, distance: 20 };
            }
            
            if (map.data[mapY][mapX] > 0) {
                return {
                    hit: true,
                    distance: distance * Math.cos(angle - this.game.player1.angle), // Fish-eye correction
                    wallType: map.data[mapY][mapX],
                    hitX: rayX,
                    hitY: rayY
                };
            }
        }
        
        return { hit: false, distance: 20 };
    }
    
    drawWallSlice(x, y, width, height, hitInfo) {
        const ctx = this.ctx;
        
        // Choose texture based on wall type
        const texture = hitInfo.wallType === 1 ? this.textures.wall1 : this.textures.wall2;
        
        // Calculate texture coordinates
        const texX = Math.floor((hitInfo.hitX + hitInfo.hitY) * texture.width) % texture.width;
        
        // Draw texture slice
        ctx.drawImage(
            texture,
            texX, 0, 1, texture.height,
            x, y, width, height
        );
        
        // Add shading based on distance
        const shade = Math.max(0.3, 1 - hitInfo.distance / 10);
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - shade})`;
        ctx.fillRect(x, y, width, height);
    }
    
    drawFloorAndCeiling(x, y, width, height) {
        const ctx = this.ctx;
        
        // Draw ceiling
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x, y, width, height / 2);
        
        // Draw floor
        ctx.fillStyle = '#2a2a3e';
        ctx.fillRect(x, y + height / 2, width, height / 2);
        
        // Add some floor texture
        const floorTex = this.textures.floor;
        const pattern = ctx.createPattern(floorTex, 'repeat');
        ctx.fillStyle = pattern;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x, y + height / 2, width, height / 2);
        ctx.globalAlpha = 1.0;
    }
    
    drawIronSight(x, y, width, height) {
        const ctx = this.ctx;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // Draw iron sight reticle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        
        // Outer circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner crosshair
        ctx.beginPath();
        ctx.moveTo(centerX - 10, centerY);
        ctx.lineTo(centerX + 10, centerY);
        ctx.moveTo(centerX, centerY - 10);
        ctx.lineTo(centerX, centerY + 10);
        ctx.stroke();
        
        // Darken edges for tunnel vision effect
        const gradient = ctx.createRadialGradient(
            centerX, centerY, height * 0.3,
            centerX, centerY, height * 0.5
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
    }
    
    updateHUD() {
        // Update Player 1 HUD
        document.getElementById('health-p1').style.width = 
            `${(this.game.player1.health / 100) * 100}%`;
        document.getElementById('score-p1').textContent = this.game.player1.score;
        
        // Update Player 2 HUD
        document.getElementById('health-p2').style.width = 
            `${(this.game.player2.health / 100) * 100}%`;
        document.getElementById('score-p2').textContent = this.game.player2.score;
        
        // Update reload indicators
        this.updateReloadIndicator('p1', this.game.player1);
        this.updateReloadIndicator('p2', this.game.player2);
        
        // Update iron sight overlay
        const overlay = document.getElementById('iron-sight-overlay');
        overlay.style.opacity = this.game.player1.isIronSight || this.game.player2.isIronSight ? '1' : '0';
    }
    
    updateReloadIndicator(playerId, player) {
        const indicator = document.getElementById(`reload-${playerId}`);
        const status = document.querySelector(`#reload-${playerId}`).previousElementSibling;
        
        if (player.isReloading) {
            indicator.style.width = `${(player.reloadProgress / player.reloadTime) * 100}%`;
            status.textContent = 'RELOADING';
            
            // Show reload overlay
            document.getElementById('reload-overlay').style.display = 'block';
            
            // Update reload steps
            const steps = ['powder', 'patch', 'ball', 'ram', 'prime'];
            steps.forEach((step, index) => {
                const element = document.getElementById(`step-${step}`);
                if (index <= Math.floor(player.reloadProgress / (player.reloadTime / 5))) {
                    element.classList.add('active');
                } else {
                    element.classList.remove('active');
                }
            });
        } else {
            indicator.style.width = '0%';
            status.textContent = player.ammo > 0 ? 'READY' : 'EMPTY';
            document.getElementById('reload-overlay').style.display = 'none';
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new MusketsFireGame();
});

// Export for module use
export { MusketsFireGame };