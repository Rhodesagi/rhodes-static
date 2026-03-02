/**
 * Flintlock Musket Mechanics
 * Historically accurate reload sequence for Brown Bess pattern musket
 * State machine with proper timings
 */
class FlintlockMusket {
    constructor() {
        this.state = 'ready'; // ready, fired, reloading
        this.reloadStep = 0;
        this.reloadProgress = 0;
        this.reloadTimeout = null;
        
        // Flintlock reload sequence (historically accurate for ~1750s-1800s)
        this.reloadSteps = [
            { name: 'half-cock', duration: 500, desc: 'Half-cock the hammer' },
            { name: 'bite-cartridge', duration: 800, desc: 'Bite cartridge open' },
            { name: 'prime-pan', duration: 1000, desc: 'Prime the flash pan' },
            { name: 'pour-powder', duration: 800, desc: 'Pour powder down barrel' },
            { name: 'insert-ball', duration: 700, desc: 'Insert ball and cartridge' },
            { name: 'draw-ramrod', duration: 600, desc: 'Draw ramrod' },
            { name: 'ram-cartridge', duration: 1200, desc: 'Ram cartridge home' },
            { name: 'return-ramrod', duration: 800, desc: 'Return ramrod' },
            { name: 'full-cock', duration: 500, desc: 'Full-cock and present' }
        ];
        
        this.totalReloadTime = this.reloadSteps.reduce((sum, step) => sum + step.duration, 0);
        
        // Iron sights configuration
        this.ironSightsActive = false;
        this.ironSightsFov = Math.PI / 8; // 22.5 degrees zoom
        this.baseFov = Math.PI / 3;
        
        // Ballistics
        this.muzzleVelocity = 150; // meters per second (historically accurate for musket)
        this.accuracySpread = 0.05; // radians spread at hip
        this.sightsAccuracySpread = 0.02; // radians spread with iron sights
        
        // Animation states
        this.recoilAmount = 0;
        this.swayPhase = 0;
    }
    
    fire(useIronSights) {
        if (this.state !== 'ready') {
            return { fired: false, reason: this.state === 'fired' ? 'Musket empty' : 'Reloading' };
        }
        
        this.state = 'fired';
        this.recoilAmount = 1.0;
        
        const spread = useIronSights ? this.sightsAccuracySpread : this.accuracySpread;
        const angleVariation = (Math.random() - 0.5) * spread;
        
        return {
            fired: true,
            spread: angleVariation,
            muzzleVelocity: this.muzzleVelocity,
            range: 100 // effective range in map units
        };
    }
    
    startReload(onStepComplete, onReloadComplete) {
        if (this.state === 'ready') {
            return { started: false, reason: 'Already loaded' };
        }
        if (this.state === 'reloading') {
            return { started: false, reason: 'Already reloading' };
        }
        
        this.state = 'reloading';
        this.reloadStep = 0;
        this.reloadProgress = 0;
        
        this.executeReloadStep(onStepComplete, onReloadComplete);
        
        return { started: true };
    }
    
    executeReloadStep(onStepComplete, onReloadComplete) {
        if (this.reloadStep >= this.reloadSteps.length) {
            this.state = 'ready';
            this.reloadStep = 0;
            this.reloadProgress = 0;
            if (onReloadComplete) onReloadComplete();
            return;
        }
        
        const step = this.reloadSteps[this.reloadStep];
        this.reloadProgress = (this.reloadStep / this.reloadSteps.length) * 100;
        
        if (onStepComplete) {
            onStepComplete(step.name, step.desc, this.reloadProgress);
        }
        
        this.reloadTimeout = setTimeout(() => {
            this.reloadStep++;
            this.executeReloadStep(onStepComplete, onReloadComplete);
        }, step.duration);
    }
    
    cancelReload() {
        if (this.reloadTimeout) {
            clearTimeout(this.reloadTimeout);
            this.reloadTimeout = null;
        }
        this.state = 'fired';
        this.reloadStep = 0;
        this.reloadProgress = 0;
    }
    
    toggleIronSights() {
        this.ironSightsActive = !this.ironSightsActive;
        return this.ironSightsActive;
    }
    
    getCurrentFov() {
        return this.ironSightsActive ? this.ironSightsFov : this.baseFov;
    }
    
    update(deltaTime) {
        // Update recoil recovery
        if (this.recoilAmount > 0) {
            this.recoilAmount = Math.max(0, this.recoilAmount - deltaTime * 2);
        }
        
        // Update breathing sway
        this.swayPhase += deltaTime * 2;
    }
    
    getSwayOffset() {
        if (!this.ironSightsActive) return { x: 0, y: 0 };
        
        const swayAmount = 0.005;
        return {
            x: Math.sin(this.swayPhase) * swayAmount,
            y: Math.cos(this.swayPhase * 0.7) * swayAmount
        };
    }
    
    getRecoilOffset() {
        return {
            y: -this.recoilAmount * 0.1,
            angle: this.recoilAmount * 0.1
        };
    }
    
    // Draw the musket model to canvas (first-person view)
    draw(ctx, width, height, isIronSights) {
        ctx.save();
        
        const sway = this.getSwayOffset();
        const recoil = this.getRecoilOffset();
        
        const centerX = width / 2 + sway.x * width;
        const centerY = height * 0.7 + sway.y * height + recoil.y * height;
        
        if (isIronSights) {
            // Draw iron sights view - minimal musket visible, focus on rear sight
            this.drawIronSightsView(ctx, width, height, centerX, centerY);
        } else {
            // Draw hip-fire musket view
            this.drawHipFireView(ctx, width, height, centerX, centerY);
        }
        
        ctx.restore();
    }
    
    drawIronSightsView(ctx, width, height, centerX, centerY) {
        // Rear sight (notch)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(centerX - 15, centerY - 40, 30, 20);
        ctx.fillStyle = '#000';
        ctx.fillRect(centerX - 3, centerY - 35, 6, 10); // The notch
        
        // Front sight post
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(centerX - 2, centerY - 120, 4, 60);
        ctx.fillRect(centerX - 4, centerY - 120, 8, 8); // Post top
        
        // Barrel blur (very subtle)
        const gradient = ctx.createLinearGradient(centerX - 10, centerY, centerX + 10, centerY);
        gradient.addColorStop(0, 'rgba(30, 20, 10, 0.3)');
        gradient.addColorStop(0.5, 'rgba(40, 30, 15, 0.5)');
        gradient.addColorStop(1, 'rgba(30, 20, 10, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(centerX - 8, centerY - 20, 16, 100);
        
        // Lock plate (flintlock mechanism) - barely visible
        ctx.fillStyle = 'rgba(50, 40, 30, 0.4)';
        ctx.fillRect(centerX - 25, centerY + 20, 50, 40);
    }
    
    drawHipFireView(ctx, width, height, centerX, centerY) {
        // Stock (wood)
        ctx.fillStyle = '#5c4033';
        ctx.beginPath();
        ctx.moveTo(centerX - 30, centerY + 100);
        ctx.lineTo(centerX + 30, centerY + 100);
        ctx.lineTo(centerX + 25, centerY - 20);
        ctx.lineTo(centerX - 25, centerY - 20);
        ctx.closePath();
        ctx.fill();
        
        // Stock detail
        ctx.fillStyle = '#4a3328';
        ctx.beginPath();
        ctx.moveTo(centerX - 20, centerY + 80);
        ctx.lineTo(centerX + 20, centerY + 80);
        ctx.lineTo(centerX + 18, centerY);
        ctx.lineTo(centerX - 18, centerY);
        ctx.closePath();
        ctx.fill();
        
        // Barrel (metal)
        const barrelGradient = ctx.createLinearGradient(centerX - 12, centerY, centerX + 12, centerY);
        barrelGradient.addColorStop(0, '#2a2a2a');
        barrelGradient.addColorStop(0.3, '#555');
        barrelGradient.addColorStop(0.7, '#666');
        barrelGradient.addColorStop(1, '#2a2a2a');
        ctx.fillStyle = barrelGradient;
        ctx.fillRect(centerX - 12, centerY - 120, 24, 120);
        
        // Barrel bands
        ctx.fillStyle = '#444';
        ctx.fillRect(centerX - 14, centerY - 100, 28, 4);
        ctx.fillRect(centerX - 14, centerY - 60, 28, 4);
        ctx.fillRect(centerX - 14, centerY - 20, 28, 4);
        
        // Lock plate (flintlock mechanism)
        ctx.fillStyle = '#444';
        ctx.fillRect(centerX - 30, centerY - 40, 25, 50);
        
        // Hammer (cock)
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(centerX - 35, centerY - 45);
        ctx.lineTo(centerX - 25, centerY - 35);
        ctx.lineTo(centerX - 28, centerY - 20);
        ctx.lineTo(centerX - 38, centerY - 30);
        ctx.closePath();
        ctx.fill();
        
        // Frizzen
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.moveTo(centerX - 28, centerY - 15);
        ctx.lineTo(centerX - 20, centerY - 5);
        ctx.lineTo(centerX - 25, centerY);
        ctx.lineTo(centerX - 33, centerY - 10);
        ctx.closePath();
        ctx.fill();
        
        // Flash pan
        ctx.fillStyle = '#222';
        ctx.fillRect(centerX - 32, centerY - 12, 8, 6);
        
        // Trigger guard
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX - 10, centerY + 30, 15, 0.2, Math.PI - 0.2);
        ctx.stroke();
        
        // Ramrod (if present)
        if (this.state === 'ready' || this.state === 'fired') {
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(centerX + 14, centerY - 110, 4, 100);
        }
    }
    
    getStatusText() {
        if (this.state === 'ready') return 'READY';
        if (this.state === 'fired') return 'EMPTY';
        if (this.state === 'reloading') {
            const step = this.reloadSteps[this.reloadStep];
            return step ? step.desc.toUpperCase() : 'RELOADING';
        }
        return 'UNKNOWN';
    }
}
