import * as THREE from 'three';
import { Game } from './game.js';

// Audio context - will be initialized on user interaction
let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
}

export function getAudioContext() {
    return audioContext;
}

// Main initialization
let game = null;

function startGame() {
    // Initialize audio on user interaction
    initAudio();
    
    // Hide start screen
    document.getElementById('start-screen').style.display = 'none';
    
    // Initialize game
    if (!game) {
        game = new Game();
        game.init();
        game.start();
    } else {
        game.restart();
    }
}

function restartGame() {
    document.getElementById('win-screen').style.display = 'none';
    if (game) {
        game.restart();
    }
}

// Event listeners
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', restartGame);

// Also allow any key/click to start if on start screen
document.addEventListener('keydown', (e) => {
    const startScreen = document.getElementById('start-screen');
    if (startScreen.style.display !== 'none') {
        startGame();
    }
});

document.addEventListener('click', (e) => {
    const startScreen = document.getElementById('start-screen');
    if (startScreen.style.display !== 'none' && e.target.id !== 'start-btn') {
        // Don't double-trigger on button click
        if (!e.target.closest('#start-btn')) {
            startGame();
        }
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (game) {
        game.onResize();
    }
});

// Export for modules
export { initAudio, game };