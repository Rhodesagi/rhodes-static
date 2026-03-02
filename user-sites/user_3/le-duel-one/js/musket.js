/**
 * Musket State Machine - Authentic 18th Century Brown Bess reloading
 * Six distinct stages with timing based on historical drill manuals
 */

const ReloadStage = {
    READY: 'ready',
    HALF_COCK: 'half_cock',      // Pull hammer to half-cock safety
    POUR_POWDER: 'pour_powder',   // Pour powder from cartridge
    PATCH_BALL: 'patch_ball',     // Place ball and patch
    RAM: 'ram',                   // Ram home with ramrod
    PRIME: 'prime',               // Prime the pan
    FULL_COCK: 'full_cock'        // Full cock to fire
};

const Musket = {
    // Stage timings in milliseconds (historically accurate)
    STAGE_TIMINGS: {
        [ReloadStage.HALF_COCK]: 400,
        [ReloadStage.POUR_POWDER]: 600,
        [ReloadStage.PATCH_BALL]: 500,
        [ReloadStage.RAM]: 1500,      // Ramming takes longest
        [ReloadStage.PRIME]: 700,
        [ReloadStage.FULL_COCK]: 400
    },
    
    // Create a new musket instance
    create() {
        return {
            state: ReloadStage.READY,
            loaded: false,           // Has ball and powder
            primed: false,           // Pan is primed
            cocked: false,           // Hammer position
            stageProgress: 0,        // 0-1 progress in current stage
            stageStartTime: 0,       // When current stage started
            ramrodOut: false,        // Visual: ramrod extended
            panOpen: false,          // Visual: frizzen open
            animationFrame: 0        // For rendering animations
        };
    },
    
    /**
     * Start reload sequence
     */
    startReload(musket) {
        if (musket.state !== ReloadStage.READY || musket.loaded) {
            return false; // Can only reload when empty and ready
        }
        
        musket.state = ReloadStage.HALF_COCK;
        musket.stageStartTime = Date.now();
        musket.stageProgress = 0;
        musket.cocked = false;
        return true;
    },
    
    /**
     * Update musket state (call every frame)
     */
    update(musket) {
        if (musket.state === ReloadStage.READY) {
            return;
        }
        
        const now = Date.now();
        const stageTime = this.STAGE_TIMINGS[musket.state];
        const elapsed = now - musket.stageStartTime;
        musket.stageProgress = Math.min(1, elapsed / stageTime);
        
        // Update visual states based on progress within stage
        this.updateVisuals(musket);
        
        // Check if stage complete
        if (musket.stageProgress >= 1) {
            this.advanceStage(musket);
        }
    },
    
    /**
     * Update visual animation states
     */
    updateVisuals(musket) {
        const p = musket.stageProgress;
        
        switch (musket.state) {
            case ReloadStage.HALF_COCK:
                // Hammer moves to half-cock position
                break;
                
            case ReloadStage.POUR_POWDER:
                // Cartridge brought to muzzle, tilted
                break;
                
            case ReloadStage.PATCH_BALL:
                // Ball placed, patched
                break;
                
            case ReloadStage.RAM:
                // Ramrod animation - extended then retracted
                musket.ramrodOut = p < 0.8;
                break;
                
            case ReloadStage.PRIME:
                // Frizzen opens, powder poured
                musket.panOpen = p < 0.7;
                break;
                
            case ReloadStage.FULL_COCK:
                // Hammer to full cock
                break;
        }
        
        // Update animation frame for rendering
        musket.animationFrame = Math.floor(p * 8);
    },
    
    /**
     * Advance to next reload stage
     */
    advanceStage(musket) {
        switch (musket.state) {
            case ReloadStage.HALF_COCK:
                musket.cocked = false; // Safety position
                musket.state = ReloadStage.POUR_POWDER;
                break;
                
            case ReloadStage.POUR_POWDER:
                musket.state = ReloadStage.PATCH_BALL;
                break;
                
            case ReloadStage.PATCH_BALL:
                musket.loaded = true;
                musket.state = ReloadStage.RAM;
                break;
                
            case ReloadStage.RAM:
                musket.ramrodOut = false;
                musket.state = ReloadStage.PRIME;
                break;
                
            case ReloadStage.PRIME:
                musket.primed = true;
                musket.panOpen = false;
                musket.state = ReloadStage.FULL_COCK;
                break;
                
            case ReloadStage.FULL_COCK:
                musket.cocked = true;
                musket.state = ReloadStage.READY;
                break;
        }
        
        musket.stageStartTime = Date.now();
        musket.stageProgress = 0;
    },
    
    /**
     * Attempt to fire the musket
     * Returns true if shot fired, false if not ready
     */
    fire(musket) {
        // Can only fire if ready, loaded, primed, and fully cocked
        if (musket.state !== ReloadStage.READY || !musket.loaded || !musket.primed || !musket.cocked) {
            return { fired: false, reason: this.getFireFailureReason(musket) };
        }
        
        // Fire!
        musket.loaded = false;
        musket.primed = false;
        musket.cocked = false;
        
        return { fired: true };
    },
    
    /**
     * Get human-readable reason why fire failed
     */
    getFireFailureReason(musket) {
        if (musket.state !== ReloadStage.READY) {
            return 'RELOADING: ' + this.getStageName(musket.state);
        }
        if (!musket.loaded) {
            return 'NOT LOADED';
        }
        if (!musket.primed) {
            return 'PAN NOT PRIMED';
        }
        if (!musket.cocked) {
            return 'NOT COCKED';
        }
        return 'UNKNOWN';
    },
    
    /**
     * Get display name for reload stage
     */
    getStageName(stage) {
        const names = {
            [ReloadStage.READY]: 'Ready',
            [ReloadStage.HALF_COCK]: 'Half-Cock',
            [ReloadStage.POUR_POWDER]: 'Pour Powder',
            [ReloadStage.PATCH_BALL]: 'Patch Ball',
            [ReloadStage.RAM]: 'Ram Home',
            [ReloadStage.PRIME]: 'Prime Pan',
            [ReloadStage.FULL_COCK]: 'Full Cock'
        };
        return names[stage] || stage;
    },
    
    /**
     * Get reload progress (0-1) for entire sequence
     */
    getTotalProgress(musket) {
        if (musket.state === ReloadStage.READY) {
            return musket.loaded ? 1 : 0;
        }
        
        const stages = [
            ReloadStage.HALF_COCK,
            ReloadStage.POUR_POWDER,
            ReloadStage.PATCH_BALL,
            ReloadStage.RAM,
            ReloadStage.PRIME,
            ReloadStage.FULL_COCK
        ];
        
        const currentIndex = stages.indexOf(musket.state);
        const stageProgress = musket.stageProgress / stages.length;
        return (currentIndex / stages.length) + stageProgress;
    },
    
    /**
     * Get musket sway based on aiming state
     */
    getSway(aiming, time) {
        if (aiming) {
            // Much less sway when aiming down sights
            return {
                x: Math.sin(time * 0.001) * 0.5,
                y: Math.cos(time * 0.0008) * 0.3
            };
        }
        return {
            x: Math.sin(time * 0.002) * 2,
            y: Math.cos(time * 0.0015) * 1.5
        };
    }
};
