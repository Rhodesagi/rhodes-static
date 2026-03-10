// Web Audio API for gunshot sounds

class AudioController {
    constructor() {
        this.ctx = null;
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    // Generate musket fire sound procedurally
    playMusketFire() {
        if (!this.initialized || !this.ctx) {
            this.init();
            if (!this.ctx) return;
        }
        
        // Resume context if suspended (browser policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        
        const now = this.ctx.currentTime;
        
        // 1. Sharp crack (white noise burst)
        const crackBuffer = this.createNoiseBuffer(0.1);
        const crackSource = this.ctx.createBufferSource();
        crackSource.buffer = crackBuffer;
        
        const crackGain = this.ctx.createGain();
        crackGain.gain.setValueAtTime(0.8, now);
        crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        // Bandpass for crack frequency
        const crackFilter = this.ctx.createBiquadFilter();
        crackFilter.type = 'bandpass';
        crackFilter.frequency.value = 3000;
        crackFilter.Q.value = 1;
        
        crackSource.connect(crackFilter);
        crackFilter.connect(crackGain);
        crackGain.connect(this.ctx.destination);
        crackSource.start(now);
        
        // 2. Low thump (subsonic bass)
        const thumpOsc = this.ctx.createOscillator();
        thumpOsc.type = 'sine';
        thumpOsc.frequency.setValueAtTime(80, now);
        thumpOsc.frequency.exponentialRampToValueAtTime(20, now + 0.2);
        
        const thumpGain = this.ctx.createGain();
        thumpGain.gain.setValueAtTime(1.0, now);
        thumpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        thumpOsc.connect(thumpGain);
        thumpGain.connect(this.ctx.destination);
        thumpOsc.start(now);
        thumpOsc.stop(now + 0.3);
        
        // 3. Echo/reverb tail
        const echoDelay = this.ctx.createDelay();
        echoDelay.delayTime.value = 0.15;
        
        const echoGain = this.ctx.createGain();
        echoGain.gain.value = 0.3;
        
        crackGain.connect(echoDelay);
        echoDelay.connect(echoGain);
        echoGain.connect(this.ctx.destination);
    }
    
    // Generate ramrod sound
    playRamrod() {
        if (!this.initialized || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        
        // Metallic sliding sound
        const noiseBuffer = this.createNoiseBuffer(0.3);
        const source = this.ctx.createBufferSource();
        source.buffer = noiseBuffer;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(now);
    }
    
    // Generate powder pour sound
    playPowderPour() {
        if (!this.initialized || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        
        // Granular noise
        const noiseBuffer = this.createNoiseBuffer(0.5);
        const source = this.ctx.createBufferSource();
        source.buffer = noiseBuffer;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 5000;
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(now);
    }
    
    // Generate priming sound
    playPrime() {
        if (!this.initialized || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        
        // Metallic click
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
    }
    
    createNoiseBuffer(duration) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
}

// Create global audio controller
const audio = new AudioController();
