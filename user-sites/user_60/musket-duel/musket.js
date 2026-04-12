// musket-duel/musket.js
// Brown Bess musket with historically accurate 15-step reload sequence

const Musket = {
  // Reload states - historically accurate sequence for Brown Bess
  States: {
    READY: 'READY',
    BITE_CARTRIDGE: 'BITE_CARTRIDGE',
    PRIME_PAN: 'PRIME_PAN',
    SHUT_FRIZZEN: 'SHUT_FRIZZEN',
    POUR_BARREL: 'POUR_BARREL',
    INSERT_BALL: 'INSERT_BALL',
    INSERT_PATCH: 'INSERT_PATCH',
    RAM_1: 'RAM_1',
    RAM_2: 'RAM_2',
    RAM_3: 'RAM_3',
    RETURN_ROD: 'RETURN_ROD',
    HALF_COCK: 'HALF_COCK',
    FULL_COCK: 'FULL_COCK',
    SHOULDER: 'SHOULDER',
    PRESENT: 'PRESENT',
    AIM: 'AIM',
    FIRING: 'FIRING'
  },
  
  // Animation timings (seconds) - using delta-time
  timings: {
    [this.States.BITE_CARTRIDGE]: 0.8,
    [this.States.PRIME_PAN]: 0.6,
    [this.States.SHUT_FRIZZEN]: 0.4,
    [this.States.POUR_BARREL]: 0.7,
    [this.States.INSERT_BALL]: 0.5,
    [this.States.INSERT_PATCH]: 0.5,
    [this.States.RAM_1]: 0.8,
    [this.States.RAM_2]: 0.8,
    [this.States.RAM_3]: 0.8,
    [this.States.RETURN_ROD]: 0.6,
    [this.States.HALF_COCK]: 0.5,
    [this.States.FULL_COCK]: 0.4,
    [this.States.SHOULDER]: 0.5,
    [this.States.PRESENT]: 0.4,
    [this.States.AIM]: 0.3,
    [this.States.FIRING]: 0.2
  },
  
  // State display names
  stateNames: {
    [this.States.READY]: 'READY TO FIRE',
    [this.States.BITE_CARTRIDGE]: '1. BITE CARTRIDGE',
    [this.States.PRIME_PAN]: '2. PRIME PAN',
    [this.States.SHUT_FRIZZEN]: '3. SHUT FRIZZEN',
    [this.States.POUR_BARREL]: '4. POUR POWDER',
    [this.States.INSERT_BALL]: '5. INSERT BALL',
    [this.States.INSERT_PATCH]: '6. ADD PATCH',
    [this.States.RAM_1]: '7. RAM (1/3)',
    [this.States.RAM_2]: '8. RAM (2/3)',
    [this.States.RAM_3]: '9. RAM (3/3)',
    [this.States.RETURN_ROD]: '10. RETURN ROD',
    [this.States.HALF_COCK]: '11. HALF COCK',
    [this.States.FULL_COCK]: '12. FULL COCK',
    [this.States.SHOULDER]: '13. SHOULDER',
    [this.States.PRESENT]: '14. PRESENT ARMS',
    [this.States.AIM]: '15. AIM (IRON SIGHTS)',
    [this.States.FIRING]: 'FIRING!'
  },
  
  create() {
    return {
      state: this.States.READY,
      stateTimer: 0,
      loaded: true,
      primed: true,
      cocked: true,
      hasBall: true,
      animationProgress: 0,
      ironSightsActive: false,
      recoilAmount: 0,
      
      // Transition to next reload step
      advanceReload() {
        const stateOrder = [
          this.States.BITE_CARTRIDGE,
          this.States.PRIME_PAN,
          this.States.SHUT_FRIZZEN,
          this.States.POUR_BARREL,
          this.States.INSERT_BALL,
          this.States.INSERT_PATCH,
          this.States.RAM_1,
          this.States.RAM_2,
          this.States.RAM_3,
          this.States.RETURN_ROD,
          this.States.HALF_COCK,
          this.States.FULL_COCK,
          this.States.SHOULDER,
          this.States.PRESENT
        ];
        
        const currentIdx = stateOrder.indexOf(this.state);
        if (currentIdx >= 0 && currentIdx < stateOrder.length - 1) {
          this.state = stateOrder[currentIdx + 1];
          this.stateTimer = 0;
        } else if (this.state === this.States.PRESENT) {
          this.state = this.States.READY;
          this.loaded = true;
          this.primed = true;
          this.cocked = true;
          this.hasBall = true;
        }
      },
      
      // Start the reload sequence
      startReload() {
        if (this.state === this.States.READY) {
          this.state = this.States.BITE_CARTRIDGE;
          this.stateTimer = 0;
          this.loaded = false;
          this.primed = false;
          this.cocked = false;
          this.hasBall = false;
        }
      },
      
      // Fire the weapon
      fire() {
        if (this.state === this.States.READY && this.loaded && this.primed && this.cocked) {
          this.state = this.States.FIRING;
          this.stateTimer = 0;
          this.recoilAmount = 1.0;
          return true; // Shot fired
        }
        return false;
      },
      
      // Update with delta time
      update(dt) {
        // Handle recoil recovery
        if (this.recoilAmount > 0) {
          this.recoilAmount = Math.max(0, this.recoilAmount - dt * 2);
        }
        
        // Auto-advance through firing state
        if (this.state === this.States.FIRING) {
          this.stateTimer += dt;
          if (this.stateTimer >= 0.2) {
            this.state = this.States.BITE_CARTRIDGE;
            this.stateTimer = 0;
            this.loaded = false;
            this.primed = false;
            this.cocked = false;
            this.hasBall = false;
          }
          return;
        }
        
        // Advance reload states automatically (player just presses to continue)
        if (this.state !== this.States.READY) {
          this.stateTimer += dt;
          const maxTime = Musket.timings[this.state] || 0.5;
          this.animationProgress = this.stateTimer / maxTime;
          
          if (this.stateTimer >= maxTime) {
            // State complete, ready for next step
            this.stateTimer = maxTime;
          }
        }
      },
      
      // Handle player input for reload/fire
      handleInput(wantsToFire, wantsIronSights) {
        this.ironSightsActive = wantsIronSights;
        
        if (wantsToFire) {
          if (this.state === this.States.READY) {
            return this.fire();
          } else {
            // Advance to next reload step
            const maxTime = Musket.timings[this.state] || 0.5;
            if (this.stateTimer >= maxTime * 0.5) {
              this.advanceReload();
            }
          }
        }
        return false;
      },
      
      getStateName() {
        return Musket.stateNames[this.state] || this.state;
      },
      
      getProgress() {
        if (this.state === this.States.READY) return 1;
        const maxTime = Musket.timings[this.state] || 0.5;
        return Math.min(1, this.stateTimer / maxTime);
      }
    };
  }
};
