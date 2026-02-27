import * as THREE from 'https://esm.sh/three@0.160.0';
import { Player } from './player.js';
import { Musket } from './musket.js';
import { Ballistics } from './ballistics.js';

// Audio context for sound effects
let audioContext = null;

export function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

export function playSound(type) {
    if (!audioContext) return;
    
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    switch(type) {
        case 'fire':
            osc.frequency.setValueAtTime(150, audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.3);
            gain.gain.setValueAtTime(0.5, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.start();
            osc.stop(audioContext.currentTime + 0.3);
            break;
        case 'reload':
            osc.frequency.setValueAtTime(200, audioContext.currentTime);
            osc.frequency.linearRampToValueAtTime(300, audioContext.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.start();
            osc.stop(audioContext.currentTime + 0.1);
            break;
        case 'hit':
            osc.frequency.setValueAtTime(80, audioContext.currentTime);
            gain.gain.setValueAtTime(0.4, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.start();
            osc.stop(audioContext.currentTime + 0.5);
            break;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setScissorTest(true);
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);
        
        // Arena setup
        this.createArena();
        
        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);
        
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        this.scene.add(sun);
        
        // Players
        this.player1 = new Player(1, -10, 0, 0, this.scene);
        this.player2 = new Player(2, 10, 0, Math.PI, this.scene);
        
        this.ballistics = new Ballistics(this.scene);
        
        this.gameOver = false;
        this.winner = null;
        
        window.addEventListener('resize', () => this.onResize());
        
        // Prevent default on game keys
        window.addEventListener('keydown', (e) => {
            const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'];
            if (gameKeys.includes(e.key) || e.key === '/' || e.key === ',' || e.key === '.') {
                e.preventDefault();
            }
        });
    }
    
    createArena() {
        // Ground
        const groundGeo = new THREE.PlaneGeometry(100, 100);
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: 0x3d5c3d,
            roughness: 0.9 
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Dueling field markers
        for (let i = -40; i <= 40; i += 20) {
            for (let j = -40; j <= 40; j += 20) {
                if (Math.abs(i) < 5 && Math.abs(j) < 5) continue;
                const stone = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 0.5, 1),
                    new THREE.MeshStandardMaterial({ color: 0x666666 })
                );
                stone.position.set(i, 0.25, j);
                this.scene.add(stone);
            }
        }
        
        // Boundary markers
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const x = Math.cos(angle) * 45;
            const z = Math.sin(angle) * 45;
            const post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 3),
                new THREE.MeshStandardMaterial({ color: 0x4a3728 })
            );
            post.position.set(x, 1.5, z);
            this.scene.add(post);
        }
    }
    
    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    update(delta) {
        if (this.gameOver) return;
        
        this.player1.update(delta, this.player2);
        this.player2.update(delta, this.player1);
        this.ballistics.update(delta, [this.player1, this.player2]);
        
        // Check win condition
        if (this.player1.health <= 0) {
            this.endGame(2);
        } else if (this.player2.health <= 0) {
            this.endGame(1);
        }
    }
    
    endGame(winner) {
        this.gameOver = true;
        this.winner = winner;
        document.getElementById('center-message').innerHTML = 
            `Player ${winner} Victorious!<br><small>Press F5 to duel again</small>`;
        document.getElementById('center-message').style.display = 'block';
    }
    
    render() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const halfHeight = height / 2;
        
        this.renderer.setViewport(0, halfHeight, width, halfHeight);
        this.renderer.setScissor(0, halfHeight, width, halfHeight);
        this.player1.camera.aspect = width / halfHeight;
        this.player1.camera.updateProjectionMatrix();
        this.renderer.render(this.scene, this.player1.camera);
        
        this.renderer.setViewport(0, 0, width, halfHeight);
        this.renderer.setScissor(0, 0, width, halfHeight);
        this.player2.camera.aspect = width / halfHeight;
        this.player2.camera.updateProjectionMatrix();
        this.renderer.render(this.scene, this.player2.camera);
    }
    
    start() {
        let lastTime = performance.now();
        const loop = () => {
            const currentTime = performance.now();
            const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
            lastTime = currentTime;
            
            this.update(delta);
            this.render();
            requestAnimationFrame(loop);
        };
        loop();
    }
}

// Start the game
document.getElementById('start-btn').addEventListener('click', () => {
    initAudio();
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('instructions').style.display = 'block';
    document.getElementById('p1-hud').style.display = 'block';
    document.getElementById('p2-hud').style.display = 'block';
    
    const game = new Game();
    game.start();
});
