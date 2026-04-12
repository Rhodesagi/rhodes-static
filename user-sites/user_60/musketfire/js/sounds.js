// MUSKETFIRE - Audio synthesis using Web Audio API
// No external assets - all sounds procedurally generated

class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.enabled = true;
        }
    }

    // Brown noise buffer for gunpowder/explosion sounds
    createBrownNoise(duration) {
        const sampleRate = this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        let lastOut = 0;
        for (let i = 0; i < data.length; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }
        return buffer;
    }

    // White noise for spark/hiss sounds
    createWhiteNoise(duration) {
        const sampleRate = this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playMusketFire() {
        if (!this.enabled) return;
        
        const t = this.ctx.currentTime;
        
        // Main explosion - brown noise with exponential decay
        const noise = this.createBrownNoise(0.5);
        const src = this.ctx.createBufferSource();
        src.buffer = noise;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 0.3);
        
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(t);
        
        // Secondary "crack" - higher frequency burst
        const crackGain = this.ctx.createGain();
        crackGain.gain.setValueAtTime(0.4, t);
        crackGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        
        const crackFilter = this.ctx.createBiquadFilter();
        crackFilter.type = 'bandpass';
        crackFilter.frequency.setValueAtTime(2000, t);
        crackFilter.Q.setValueAtTime(5, t);
        
        const crackSrc = this.ctx.createBufferSource();
        crackSrc.buffer = this.createWhiteNoise(0.1);
        crackSrc.connect(crackFilter);
        crackFilter.connect(crackGain);
        crackGain.connect(this.ctx.destination);
        crackSrc.start(t);
    }

    playRamrodHit() {
        if (!this.enabled) return;
        
        const t = this.ctx.currentTime;
        
        // Metallic "thud" when ramrod seats
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
        
        // Small noise burst for wood/metal
        const noise = this.createWhiteNoise(0.1);
        const src = this.ctx.createBufferSource();
        src.buffer = noise;
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        
        src.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        src.start(t);
    }

    playReloadClick() {
        if (!this.enabled) return;
        
        const t = this.ctx.currentTime;
        
        // Small metallic click
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, t);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.05);
    }

    playFootstep() {
        if (!this.enabled) return;
        
        const t = this.ctx.currentTime;
        
        // Soft thud for grass/dirt
        const noise = this.createBrownNoise(0.2);
        const src = this.ctx.createBufferSource();
        src.buffer = noise;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(t);
    }

    playHit() {
        if (!this.enabled) return;
        
        const t = this.ctx.currentTime;
        
        // Dull thud for bullet hit
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
    }
}

const sounds = new SoundManager();
