class AudioSystem {
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

    // Brown noise generator for explosions
    createBrownNoise() {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }
        return buffer;
    }

    // White noise for mechanical clicks
    createWhiteNoise(duration) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playMusketFire() {
        if (!this.enabled) return;
        
        const t = this.ctx.currentTime;
        
        // Main explosion - brown noise with rapid decay
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createBrownNoise();
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(800, t);
        noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 0.5);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1.5, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(t);
        
        // Sub-bass thump for black powder concussion
        const subOsc = this.ctx.createOscillator();
        subOsc.type = "sine";
        subOsc.frequency.setValueAtTime(40, t);
        subOsc.frequency.exponentialRampToValueAtTime(20, t + 0.5);
        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(2.0, t);
        subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(t);
        subOsc.stop(t + 0.6);
        
        // Low frequency thump
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(1.0, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
    }

    playDryClick() {
        if (!this.enabled) return;
        
        const t = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createWhiteNoise(0.05);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t);
    }

    playPowderPour() {
        if (!this.enabled) return;
        
        const t = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createWhiteNoise(0.8);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t);
    }

    playRamRod() {
        if (!this.enabled) return;
        
        const t = this.ctx.currentTime;
        // Down stroke
        const noise1 = this.ctx.createBufferSource();
        noise1.buffer = this.createWhiteNoise(0.15);
        const gain1 = this.ctx.createGain();
        gain1.gain.setValueAtTime(0.2, t);
        gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        noise1.connect(gain1);
        gain1.connect(this.ctx.destination);
        noise1.start(t);
        
        // Up stroke
        const noise2 = this.ctx.createBufferSource();
        noise2.buffer = this.createWhiteNoise(0.1);
        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0.15, t + 0.25);
        gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        noise2.connect(gain2);
        gain2.connect(this.ctx.destination);
        noise2.start(t + 0.25);
    }

    playCockFlint() {
        if (!this.enabled) return;
        
        const t = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createWhiteNoise(0.08);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 3000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t);
    }

    playPanHiss() {
        if (!this.enabled) return;
        
        const t = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createWhiteNoise(0.3);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 5;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t);
    }

    playFootstep() {
        if (!this.enabled) return;
        
        const t = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createWhiteNoise(0.1);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t);
    }

    playHit() {
        if (!this.enabled) return;
        
        const t = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createWhiteNoise(0.2);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 600;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t);
    }
}

const audio = new AudioSystem();