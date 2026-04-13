/**
 * AudioManager - Handles game audio (synthesized, no external files)
 */

class AudioManager {
    constructor() {
        this.context = null;
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Audio not supported');
        }
    }
    
    playMuzzleFire() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.frequency.setValueAtTime(800, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.5, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.1);
    }
    
    playReloadComplete() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.frequency.setValueAtTime(400, this.context.currentTime);
        osc.frequency.setValueAtTime(600, this.context.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.2, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        
        osc.start(this.context.currentTime);
        osc.stop(this.context.currentTime + 0.1);
    }
}
