const RELOAD_STEPS = {
    IDLE: 0,
    CHARGE_PAN: 1,
    POUR_POWDER: 2,
    PATCH_BALL: 3,
    RAMROD: 4,
    PRIME: 5,
    COCK: 6,
    READY: 7
};

const STEP_NAMES = [
    'Ready',
    'Charge Pan',
    'Pour Powder',
    'Patch Ball',
    'Ramrod',
    'Prime',
    'Cock',
    'Ready'
];

const STEP_DURATIONS = [0, 800, 600, 400, 1200, 500, 400, 0];

class Musket {
    constructor() {
        this.state = RELOAD_STEPS.READY;
        this.loaded = true;
        this.primed = true;
        this.cocked = true;
        this.reloadTimer = 0;
        this.reloadProgress = 0;
        this.currentStep = 0;
        this.aiming = false;
        this.aimProgress = 0;
        this.recoil = 0;
        this.musketTilt = 0;
        this.flashTimer = 0;
    }

    fire() {
        if (!this.loaded || !this.primed || !this.cocked || this.state !== RELOAD_STEPS.READY) {
            return false;
        }
        
        this.loaded = false;
        this.primed = false;
        this.cocked = false;
        this.recoil = 1.0;
        this.flashTimer = 100;
        this.state = RELOAD_STEPS.IDLE;
        return true;
    }

    startReload() {
        if (this.state !== RELOAD_STEPS.IDLE && this.state !== RELOAD_STEPS.READY) return;
        if (this.loaded && this.primed && this.cocked) return;
        
        this.state = RELOAD_STEPS.CHARGE_PAN;
        this.currentStep = 1;
        this.reloadTimer = STEP_DURATIONS[1];
        this.reloadProgress = 0;
    }

    update(dt) {
        // Update recoil
        if (this.recoil > 0) {
            this.recoil = Math.max(0, this.recoil - dt * 0.003);
        }
        
        // Update flash
        if (this.flashTimer > 0) {
            this.flashTimer = Math.max(0, this.flashTimer - dt);
        }

        // Update aiming
        const aimSpeed = dt * 0.003;
        if (this.aiming && this.aimProgress < 1) {
            this.aimProgress = Math.min(1, this.aimProgress + aimSpeed);
        } else if (!this.aiming && this.aimProgress > 0) {
            this.aimProgress = Math.max(0, this.aimProgress - aimSpeed);
        }

        // Update reload
        if (this.state > RELOAD_STEPS.IDLE && this.state < RELOAD_STEPS.READY) {
            this.reloadProgress += dt;
            
            if (this.reloadProgress >= this.reloadTimer) {
                this.advanceReloadStep();
            }
        }
    }

    advanceReloadStep() {
        switch (this.state) {
            case RELOAD_STEPS.CHARGE_PAN:
                this.state = RELOAD_STEPS.POUR_POWDER;
                break;
            case RELOAD_STEPS.POUR_POWDER:
                this.state = RELOAD_STEPS.PATCH_BALL;
                break;
            case RELOAD_STEPS.PATCH_BALL:
                this.state = RELOAD_STEPS.RAMROD;
                break;
            case RELOAD_STEPS.RAMROD:
                this.state = RELOAD_STEPS.PRIME;
                this.loaded = true;
                break;
            case RELOAD_STEPS.PRIME:
                this.state = RELOAD_STEPS.COCK;
                this.primed = true;
                break;
            case RELOAD_STEPS.COCK:
                this.state = RELOAD_STEPS.READY;
                this.cocked = true;
                break;
        }
        
        this.currentStep = this.state;
        this.reloadProgress = 0;
        this.reloadTimer = STEP_DURATIONS[this.state] || 0;
    }

    setAiming(aiming) {
        this.aiming = aiming;
    }

    tiltMusket(direction) {
        this.musketTilt = Math.max(-15, Math.min(15, this.musketTilt + direction * 2));
    }

    getFOV() {
        const baseFOV = 60;
        const aimFOV = 25;
        return baseFOV - (baseFOV - aimFOV) * this.aimProgress;
    }

    getStepName() {
        return STEP_NAMES[this.currentStep] || '';
    }

    getReloadPercent() {
        if (this.state === RELOAD_STEPS.READY || this.state === RELOAD_STEPS.IDLE) return 0;
        return (this.reloadProgress / this.reloadTimer) * 100;
    }
}