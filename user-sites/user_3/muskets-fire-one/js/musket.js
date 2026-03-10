// Musket state machine with authentic black powder reloading
// State chain: READY -> FIRE -> SMOKE -> RAMROD -> POWDER -> PATCH -> BALL -> PRIME -> READY

const MUSKET_STATE = {
    READY: 'ready',
    FIRING: 'firing',
    SMOKE: 'smoke',
    RAMROD_OUT: 'ramrod_out',
    RAMROD_IN: 'ramrod_in',
    POWDER_CHARGE: 'powder_charge',
    PATCH_BALL: 'patch_ball',
    SEATING: 'seating',
    PRIMING: 'priming',
    SHOULDERING: 'shouldering'
};

const RELOAD_TIMES = {
    [MUSKET_STATE.FIRING]: 200,      // Recoil/flint strike
    [MUSKET_STATE.SMOKE]: 400,       // Smoke clears
    [MUSKET_STATE.RAMROD_OUT]: 600,  // Pull ramrod
    [MUSKET_STATE.RAMROD_IN]: 400,   // Ramrod back
    [MUSKET_STATE.POWDER_CHARGE]: 500, // Pour powder
    [MUSKET_STATE.PATCH_BALL]: 400,  // Patch and ball
    [MUSKET_STATE.SEATING]: 800,     // Ram down
    [MUSKET_STATE.PRIMING]: 400,     // Prime pan
    [MUSKET_STATE.SHOULDERING]: 300  // Shoulder arms
};

class Musket {
    constructor(ownerId) {
        this.ownerId = ownerId;
        this.state = MUSKET_STATE.READY;
        this.stateTimer = 0;
        this.canFire = true;
        this.loaded = true; // Start loaded
        
        // Animation state (0-1 progress)
        this.animProgress = 0;
        this.animTarget = 0;
        
        // Visual offsets for procedural animation
        this.recoilOffset = 0;
        this.ramrodOffset = 0;
        this.musketRotation = { x: 0, y: 0, z: 0 };
        
        // Smoke particles
        this.smokeParticles = [];
    }
    
    update(deltaTime) {
        // Update animation progress
        if (this.state !== MUSKET_STATE.READY) {
            this.stateTimer -= deltaTime * 1000;
            this.animProgress = 1 - Math.max(0, this.stateTimer) / RELOAD_TIMES[this.state];
            
            if (this.stateTimer <= 0) {
                this.advanceState();
            }
        } else {
            this.animProgress = 0;
        }
        
        // Update recoil recovery
        this.recoilOffset *= 0.9;
        
        // Update ramrod animation
        this.updateRamrodAnimation();
        
        // Update smoke
        this.updateSmoke(deltaTime);
        
        // Check if ready to fire
        this.canFire = (this.state === MUSKET_STATE.READY && this.loaded);
    }
    
    advanceState() {
        const stateChain = [
            MUSKET_STATE.FIRING,
            MUSKET_STATE.SMOKE,
            MUSKET_STATE.RAMROD_OUT,
            MUSKET_STATE.POWDER_CHARGE,
            MUSKET_STATE.PATCH_BALL,
            MUSKET_STATE.SEATING,
            MUSKET_STATE.RAMROD_IN,
            MUSKET_STATE.PRIMING,
            MUSKET_STATE.SHOULDERING,
            MUSKET_STATE.READY
        ];
        
        const currentIndex = stateChain.indexOf(this.state);
        if (currentIndex >= 0 && currentIndex < stateChain.length - 1) {
            const nextState = stateChain[currentIndex + 1];
            
            // Play audio for specific states
            this.playStateAudio(nextState);
            
            this.state = nextState;
            this.stateTimer = RELOAD_TIMES[this.state];
            
            // Set loaded state
            if (this.state === MUSKET_STATE.READY) {
                this.loaded = true;
            }
        }
    }
    
    playStateAudio(state) {
        if (typeof audio === 'undefined') return;
        
        switch (state) {
            case MUSKET_STATE.RAMROD_OUT:
            case MUSKET_STATE.RAMROD_IN:
                audio.playRamrod();
                break;
            case MUSKET_STATE.POWDER_CHARGE:
                audio.playPowderPour();
                break;
            case MUSKET_STATE.PRIMING:
                audio.playPrime();
                break;
        }
    }
    
    fire() {
        if (!this.canFire || !this.loaded) {
            return false;
        }
        
        this.loaded = false;
        this.state = MUSKET_STATE.FIRING;
        this.stateTimer = RELOAD_TIMES[MUSKET_STATE.FIRING];
        this.recoilOffset = 0.15; // Recoil kick
        
        // Create smoke
        this.createSmoke();
        
        return true;
    }
    
    startReload() {
        if (this.state !== MUSKET_STATE.READY || this.loaded) {
            return false; // Can't reload if loaded or already reloading
        }
        
        this.state = MUSKET_STATE.RAMROD_OUT;
        this.stateTimer = RELOAD_TIMES[MUSKET_STATE.RAMROD_OUT];
        return true;
    }
    
    updateRamrodAnimation() {
        // Procedural ramrod movement
        switch (this.state) {
            case MUSKET_STATE.RAMROD_OUT:
                this.ramrodOffset = this.animProgress * 0.3;
                break;
            case MUSKET_STATE.SEATING:
                // Pumping motion
                this.ramrodOffset = 0.3 + Math.sin(this.animProgress * Math.PI * 4) * 0.15;
                break;
            case MUSKET_STATE.RAMROD_IN:
                this.ramrodOffset = 0.3 * (1 - this.animProgress);
                break;
            default:
                this.ramrodOffset = 0;
        }
    }
    
    createSmoke() {
        for (let i = 0; i < 15; i++) {
            this.smokeParticles.push({
                x: (Math.random() - 0.5) * 0.3,
                y: (Math.random() - 0.5) * 0.3,
                z: (Math.random() - 0.5) * 0.3,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 2,
                vz: (Math.random() - 0.5) * 2 + 3, // Forward bias
                size: Math.random() * 0.1 + 0.05,
                life: 1.0,
                decay: Math.random() * 0.5 + 0.3
            });
        }
    }
    
    updateSmoke(deltaTime) {
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.z += p.vz * deltaTime;
            p.size += deltaTime * 0.5;
            p.life -= p.decay * deltaTime;
            
            if (p.life <= 0) {
                this.smokeParticles.splice(i, 1);
            }
        }
    }
    
    // Get current reload step for UI (0-8)
    getReloadStep() {
        if (this.state === MUSKET_STATE.READY) return -1;
        if (this.state === MUSKET_STATE.FIRING || this.state === MUSKET_STATE.SMOKE) return -1;
        
        const reloadStates = [
            MUSKET_STATE.RAMROD_OUT,
            MUSKET_STATE.POWDER_CHARGE,
            MUSKET_STATE.PATCH_BALL,
            MUSKET_STATE.SEATING,
            MUSKET_STATE.RAMROD_IN,
            MUSKET_STATE.PRIMING,
            MUSKET_STATE.SHOULDERING
        ];
        
        return reloadStates.indexOf(this.state);
    }
    
    // Get reload step name for display
    getReloadStepName() {
        const names = {
            [MUSKET_STATE.RAMROD_OUT]: 'EXTRACT ROD',
            [MUSKET_STATE.POWDER_CHARGE]: 'CHARGE POWDER',
            [MUSKET_STATE.PATCH_BALL]: 'PATCH & BALL',
            [MUSKET_STATE.SEATING]: 'RAM DOWN',
            [MUSKET_STATE.RAMROD_IN]: 'REPLACE ROD',
            [MUSKET_STATE.PRIMING]: 'PRIME PAN',
            [MUSKET_STATE.SHOULDERING]: 'SHOULDER'
        };
        return names[this.state] || '';
    }
    
    // Reset to initial state
    reset() {
        this.state = MUSKET_STATE.READY;
        this.loaded = true;
        this.canFire = true;
        this.stateTimer = 0;
        this.recoilOffset = 0;
        this.ramrodOffset = 0;
        this.smokeParticles = [];
    }
}

// Export for use in other modules
window.MUSKET_STATE = MUSKET_STATE;
window.Musket = Musket;
