// Sound manager for musket game

const sounds = {};

export function loadSounds() {
    // Create audio context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    
    // Create simple sound buffers (procedural)
    sounds.fire = createGunshot(audioContext);
    sounds.reloadStep = createClick(audioContext);
    sounds.hammer = createHammer(audioContext);
    
    console.log('Sounds loaded (procedural)');
}

function createGunshot(audioContext) {
    const duration = 0.5;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Simple gunshot noise
    for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.1));
    }
    
    return buffer;
}

function createClick(audioContext) {
    const buffer = audioContext.createBuffer(1, 2205, 44100); // 0.05 sec
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.sin(i * 0.5) * Math.exp(-i / 500);
    }
    
    return buffer;
}

function createHammer(audioContext) {
    const buffer = audioContext.createBuffer(1, 4410, 44100); // 0.1 sec
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.sin(i * 0.3) * Math.exp(-i / 1000);
    }
    
    return buffer;
}

export function playSound(name, volume = 1) {
    if (!sounds[name]) return;
    
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        const source = audioContext.createBufferSource();
        source.buffer = sounds[name];
        
        const gainNode = audioContext.createGain();
        gainNode.gain.value = volume;
        
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        source.start();
    } catch (e) {
        console.warn('Failed to play sound:', e);
    }
}