// Musket class with realistic reload mechanics and iron sight aiming

export class Musket {
    constructor(player) {
        this.player = player;
        
        // Musket states
        this.loaded = true; // Starts loaded
        this.isAiming = false;
        this.isFiring = false;
        this.reloadState = 0; // 0 = not reloading, 1-6 = reload stages
        this.reloadTimer = 0;
        this.reloadStageTimes = [0, 1.0, 1.5, 2.0, 1.5, 1.0, 1.0]; // Times for each stage in seconds
        
        // Reload stage names
        this.reloadStageNames = [
            "Not Reloading",
            "Half-Cock Hammer",
            "Pour Powder",
            "Insert Ball",
            "Ram Down Ball",
            "Return Ramrod",
            "Prime Pan & Full-Cock"
        ];
        
        // Bullet physics
        this.bulletActive = false;
        this.bulletX = 0;
        this.bulletY = 0;
        this.bulletAngle = 0;
        this.bulletSpeed = 0.5;
        this.bulletDistance = 0;
        this.maxBulletDistance = 20;
        
        // Audio
        this.shotSound = document.getElementById('sound-shot');
        this.reloadStepSound = document.getElementById('sound-reload-step');
        this.hitSound = document.getElementById('sound-hit');
        
        // Iron sight parameters
        this.ironSightZoom = 0.7; // FOV zoom when aiming
        this.aimSteadiness = 1.0; // 1.0 = normal, lower = steadier with breath hold
    }
    
    reset() {
        this.loaded = true;
        this.isAiming = false;
        this.isFiring = false;
        this.reloadState = 0;
        this.reloadTimer = 0;
        this.bulletActive = false;
        this.bulletDistance = 0;
    }
    
    update(deltaTime, keys, mouseDown) {
        // Update reload timer if reloading
        if (this.reloadState > 0) {
            this.reloadTimer -= deltaTime;
            
            if (this.reloadTimer <= 0) {
                this.reloadState++;
                
                if (this.reloadState > 6) {
                    // Reload complete
                    this.reloadState = 0;
                    this.loaded = true;
                    this.player.isReloading = false;
                    
                    // Play reload complete sound if available
                    if (this.reloadStepSound) {
                        this.reloadStepSound.currentTime = 0;
                        this.reloadStepSound.play().catch(e => console.log('Audio error:', e));
                    }
                } else {
                    // Move to next stage
                    this.reloadTimer = this.reloadStageTimes[this.reloadState];
                    
                    // Play reload step sound
                    if (this.reloadStepSound) {
                        this.reloadStepSound.currentTime = 0;
                        this.reloadStepSound.play().catch(e => console.log('Audio error:', e));
                    }
                }
            }
            
            // Cannot aim or fire while reloading
            this.isAiming = false;
            return;
        }
        
        // Handle aiming (mouse down)
        this.isAiming = mouseDown;
        
        // Handle firing (mouse down while loaded and not reloading)
        if (mouseDown && this.loaded && !this.isFiring && this.reloadState === 0) {
            this.fire();
        }
        
        // Handle reload start
        const reloadKey = this.player.id === 1 ? 'r' : 'enter';
        if (keys[reloadKey] && !this.loaded && this.reloadState === 0) {
            this.startReload();
            // Clear the key so it doesn't keep triggering
            keys[reloadKey] = false;
        }
        
        // Update bullet if active
        if (this.bulletActive) {
            this.bulletX += Math.cos(this.bulletAngle) * this.bulletSpeed * deltaTime * 60;
            this.bulletY += Math.sin(this.bulletAngle) * this.bulletSpeed * deltaTime * 60;
            this.bulletDistance += this.bulletSpeed * deltaTime * 60;
            
            if (this.bulletDistance > this.maxBulletDistance) {
                this.bulletActive = false;
            }
        }
    }
    
    startReload() {
        if (this.loaded || this.reloadState > 0) return;
        
        this.player.isReloading = true;
        this.reloadState = 1;
        this.reloadTimer = this.reloadStageTimes[1];
        
        console.log(`Player ${this.player.id} started reloading: ${this.reloadStageNames[1]}`);
        
        if (this.reloadStepSound) {
            this.reloadStepSound.currentTime = 0;
            this.reloadStepSound.play().catch(e => console.log('Audio error:', e));
        }
    }
    
    fire() {
        if (!this.loaded || this.reloadState > 0) return;
        
        this.isFiring = true;
        this.loaded = false;
        
        // Set bullet trajectory
        this.bulletAngle = this.player.angle;
        this.bulletX = this.player.x;
        this.bulletY = this.player.y;
        this.bulletDistance = 0;
        this.bulletActive = true;
        
        // Add some inaccuracy based on movement and aiming
        let inaccuracy = 0.02; // Base inaccuracy in radians
        
        if (this.player.isMoving) {
            inaccuracy += 0.05;
        }
        
        if (!this.isAiming) {
            inaccuracy += 0.08;
        }
        
        if (this.player.steadyAim) {
            inaccuracy *= 0.3; // Much more accurate when holding breath
        }
        
        // Apply random inaccuracy
        this.bulletAngle += (Math.random() - 0.5) * inaccuracy;
        
        // Play shot sound
        if (this.shotSound) {
            this.shotSound.currentTime = 0;
            this.shotSound.play().catch(e => console.log('Audio error:', e));
        }
        
        console.log(`Player ${this.player.id} fired!`);
        
        // Reset firing state after a frame
        setTimeout(() => {
            this.isFiring = false;
        }, 100);
    }
    
    getReloadProgress() {
        if (this.reloadState === 0) return 0;
        
        const totalTime = this.reloadStageTimes.slice(1, this.reloadState + 1).reduce((a, b) => a + b, 0);
        const elapsed = totalTime - this.reloadTimer;
        const totalReloadTime = this.reloadStageTimes.slice(1).reduce((a, b) => a + b, 0);
        
        return Math.min(elapsed / totalReloadTime, 1);
    }
    
    getReloadStageName() {
        return this.reloadStageNames[this.reloadState] || "Ready";
    }
    
    getAmmoStatus() {
        if (this.loaded) return "LOADED";
        if (this.reloadState > 0) return "RELOADING";
        return "EMPTY";
    }
    
    getIronSightOffset() {
        // Calculate where iron sights should be drawn based on aiming state
        if (!this.isAiming) {
            return { x: 0, y: 0, scale: 1.0 };
        }
        
        // When aiming, sights are centered but with slight sway
        let swayX = 0;
        let swayY = 0;
        
        if (this.player.isMoving) {
            swayX = Math.sin(Date.now() / 100) * 3;
            swayY = Math.cos(Date.now() / 120) * 2;
        }
        
        if (this.player.steadyAim) {
            swayX *= 0.2;
            swayY *= 0.2;
        }
        
        return {
            x: swayX,
            y: swayY,
            scale: this.ironSightZoom
        };
    }
    
    drawIronSights(ctx, viewportX, viewportY, viewportWidth, viewportHeight) {
        if (!this.isAiming) return;
        
        const centerX = viewportX + viewportWidth / 2;
        const centerY = viewportY + viewportHeight / 2;
        
        const offset = this.getIronSightOffset();
        
        // Set styles
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(212, 175, 55, 0.3)';
        
        // Draw rear sight (notch)
        ctx.beginPath();
        ctx.moveTo(centerX - 15 + offset.x, centerY - 8 + offset.y);
        ctx.lineTo(centerX + 15 + offset.x, centerY - 8 + offset.y);
        ctx.lineTo(centerX + 12 + offset.x, centerY - 4 + offset.y);
        ctx.lineTo(centerX - 12 + offset.x, centerY - 4 + offset.y);
        ctx.closePath();
        ctx.stroke();
        
        // Draw front sight (post)
        ctx.beginPath();
        ctx.moveTo(centerX - 2 + offset.x, centerY + 10 + offset.y);
        ctx.lineTo(centerX + 2 + offset.x, centerY + 10 + offset.y);
        ctx.lineTo(centerX + 1 + offset.x, centerY - 2 + offset.y);
        ctx.lineTo(centerX - 1 + offset.x, centerY - 2 + offset.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw subtle aiming point
        ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
        ctx.beginPath();
        ctx.arc(centerX + offset.x, centerY + offset.y, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}