export class AudioManager {
    constructor() {
        this.ctx = null;
        this.sounds = {};
        this.enabled = false;
    }
    
    resume() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.enabled = true;
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    
    playSound(type) {
        if (!this.ctx || !this.enabled) return;
        
        switch (type) {
            case 'fire':
                this.playMuzzleBlast();
                break;
            case 'cock':
                this.playCock();
                break;
            case 'click':
                this.playClick();
                break;
            case 'frizzen':
                this.playFrizzen();
                break;
            case 'pour':
                this.playPour();
                break;
            case 'ball':
                this.playBall();
                break;
            case 'ram':
                this.playRam();
                break;
            case 'prime':
                this.playPrime();
                break;
            case 'shoulder':
                this.playShoulder();
                break;
        }
    }
    
    playMuzzleBlast() {
        // Powerful blast with long decay
        const t = this.ctx.currentTime;
        
        // White noise burst
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.8, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.3));
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.5);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
        
        // Sub thump
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
        
        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.8, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.3);
    }
    
    playCock() {
        // Metallic click
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(500, t);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.1);
    }
    
    playClick() {
        // Small click (misfire)
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.05);
    }
    
    playFrizzen() {
        // Springy hinge sound
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.linearRampToValueAtTime(200, t + 0.1);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.15);
    }
    
    playPour() {
        // Granular pouring sound
        const t = this.ctx.currentTime;
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
            // Sparse random noise for granular feel
            data[i] = Math.random() > 0.7 ? (Math.random() - 0.5) * 0.3 : 0;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, t);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.5);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }
    
    playBall() {
        // Cloth/wood thump
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.1);
    }
    
    playRam() {
        // Thumpy scrape
        const t = this.ctx.currentTime;
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }
    
    playPrime() {
        // Small metallic tap
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, t);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(t + 0.08);
    }
    
    playShoulder() {
        // Cloth/wood rub
        const t = this.ctx.currentTime;
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
            data[i] = (Math.random() - 0.5) * 0.1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, t);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.2);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }
}