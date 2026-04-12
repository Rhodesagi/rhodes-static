// Audio management for game sounds

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.ambientSource = null;
        this.isMuted = false;
        this.volume = 0.7;
        
        this.setupAudioContext();
        this.setupEventListeners();
    }
    
    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain node for master volume
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioContext.destination);
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }
    
    setupEventListeners() {
        // Resume audio context on user interaction
        const resumeAudio = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        };
        
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);
        
        // Listen for game events
        window.addEventListener('musketFire', () => this.playSound('gunshot'));
        window.addEventListener('playerHit', () => this.playSound('hit'));
        
        // Custom reload events would be added by the game
    }
    
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    preloadSounds(soundNames) {
        soundNames.forEach(name => {
            this.loadSound(name);
        });
    }
    
    loadSound(name) {
        // Create sound URL based on name
        let url;
        switch (name) {
            case 'gunshot':
                url = 'assets/sounds/musket.wav';
                break;
            case 'reload':
                url = 'assets/sounds/reload.wav';
                break;
            case 'hit':
                url = 'assets/sounds/hit.wav';
                break;
            case 'footstep':
                url = 'assets/sounds/footstep.wav';
                break;
            case 'ambient':
                url = 'assets/sounds/ambient.wav';
                break;
            case 'click':
                url = 'assets/sounds/click.wav';
                break;
            default:
                console.warn(`Unknown sound: ${name}`);
                return;
        }
        
        // For now, we'll create placeholder sounds programmatically
        this.createPlaceholderSound(name);
    }
    
    createPlaceholderSound(name) {
        if (!this.audioContext) return;
        
        let buffer;
        let duration = 1.0;
        let frequency = 440;
        
        switch (name) {
            case 'gunshot':
                duration = 0.5;
                frequency = 100;
                break;
            case 'reload':
                duration = 2.0;
                frequency = 220;
                break;
            case 'hit':
                duration = 0.3;
                frequency = 150;
                break;
            case 'footstep':
                duration = 0.2;
                frequency = 80;
                break;
            case 'ambient':
                duration = 10.0;
                frequency = 440;
                break;
            case 'click':
                duration = 0.1;
                frequency = 660;
                break;
        }
        
        // Create buffer
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate sound
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            let value = 0;
            
            switch (name) {
                case 'gunshot':
                    // Gunshot: sharp attack, exponential decay
                    if (t < 0.05) {
                        value = Math.sin(2 * Math.PI * frequency * t) * (1 - t / 0.05);
                    } else {
                        value = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-10 * (t - 0.05));
                    }
                    break;
                case 'reload':
                    // Reload: mechanical clicking sounds
                    value = Math.sin(2 * Math.PI * frequency * t) * 
                           (Math.sin(2 * Math.PI * 2 * t) > 0 ? 1 : 0.2) *
                           Math.exp(-0.5 * t);
                    break;
                case 'hit':
                    // Hit: short thump
                    value = Math.sin(2 * Math.PI * frequency * t) * 
                           Math.exp(-15 * t);
                    break;
                case 'footstep':
                    // Footstep: short low-frequency pulse
                    value = Math.sin(2 * Math.PI * frequency * t) * 
                           Math.exp(-20 * t);
                    break;
                case 'click':
                    // Click: very short beep
                    value = Math.sin(2 * Math.PI * frequency * t) * 
                           Math.exp(-100 * t);
                    break;
                default:
                    value = Math.sin(2 * Math.PI * frequency * t) * 
                           Math.exp(-1 * t);
            }
            
            data[i] = value * 0.5;
        }
        
        this.sounds.set(name, buffer);
    }
    
    playSound(name, volume = 1.0, pitch = 1.0) {
        if (this.isMuted || !this.audioContext) return;
        
        const buffer = this.sounds.get(name);
        if (!buffer) {
            console.warn(`Sound not loaded: ${name}`);
            return;
        }
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = buffer;
            source.playbackRate.value = pitch;
            gainNode.gain.value = volume;
            
            source.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            source.start(0);
            
            // Clean up
            source.onended = () => {
                source.disconnect();
                gainNode.disconnect();
            };
        } catch (e) {
            console.warn('Error playing sound:', e);
        }
    }
    
    playAmbient() {
        if (this.isMuted || !this.audioContext) return;
        
        // Create ambient wind/forest sound
        this.stopAmbient();
        
        const buffer = this.sounds.get('ambient');
        if (!buffer) return;
        
        try {
            this.ambientSource = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            this.ambientSource.buffer = buffer;
            gainNode.gain.value = 0.3;
            
            this.ambientSource.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            this.ambientSource.loop = true;
            this.ambientSource.start(0);
        } catch (e) {
            console.warn('Error playing ambient:', e);
        }
    }
    
    stopAmbient() {
        if (this.ambientSource) {
            try {
                this.ambientSource.stop();
                this.ambientSource.disconnect();
                this.ambientSource = null;
            } catch (e) {
                // Source might already be stopped
            }
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
        }
        return this.isMuted;
    }
}