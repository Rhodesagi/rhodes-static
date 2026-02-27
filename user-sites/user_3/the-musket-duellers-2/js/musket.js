const FlintlockState = {
    READY: 'ready',
    HALF_COCK: 'half_cock',
    OPEN_FRIzzEN: 'open_frizzen',
    PRIME_PAN: 'prime_pan',
    CLOSE_FRIzzEN: 'close_frizzen',
    BITE_CARTRIDGE: 'bite_cartridge',
    POUR_POWDER: 'pour_powder',
    INSERT_BALL: 'insert_ball',
    REMOVE_RAMROD: 'remove_ramrod',
    RAM_BALL: 'ram_ball',
    RETURN_RAMROD: 'return_ramrod',
    FULL_COCK: 'full_cock',
    AIMING: 'aiming',
    FIRING: 'firing',
    RECOVERY: 'recovery'
};

class Musket {
    constructor(playerId) {
        this.playerId = playerId;
        this.state = FlintlockState.READY;
        this.stateTimer = 0;
        this.hasPowder = false;
        this.hasBall = false;
        this.isPrimed = false;
        this.hammerCocked = false;
        this.frizzenOpen = false;

        this.timings = {
            [FlintlockState.HALF_COCK]: 0.3,
            [FlintlockState.OPEN_FRIzzEN]: 0.4,
            [FlintlockState.PRIME_PAN]: 0.6,
            [FlintlockState.CLOSE_FRIzzEN]: 0.3,
            [FlintlockState.BITE_CARTRIDGE]: 0.8,
            [FlintlockState.POUR_POWDER]: 1.0,
            [FlintlockState.INSERT_BALL]: 0.7,
            [FlintlockState.REMOVE_RAMROD]: 0.5,
            [FlintlockState.RAM_BALL]: 1.5,
            [FlintlockState.RETURN_RAMROD]: 0.5,
            [FlintlockState.FULL_COCK]: 0.3,
            [FlintlockState.RECOVERY]: 0.5
        };

        this.mesh = null;
        this.hammerMesh = null;
        this.frizzenMesh = null;
    }

    setMesh(musketGroup) {
        this.mesh = musketGroup;
        this.hammerMesh = musketGroup.userData.hammer;
        this.frizzenMesh = musketGroup.userData.frizzen;
    }

    update(deltaTime) {
        if (this.state !== FlintlockState.READY &&
            this.state !== FlintlockState.AIMING &&
            this.state !== FlintlockState.FIRING) {

            this.stateTimer += deltaTime;
            const timing = this.timings[this.state] || 0.5;

            if (this.stateTimer >= timing) {
                this.advanceState();
            } else {
                this.updateAnimation(this.stateTimer / timing);
            }
        }
        this.updateVisuals();
    }

    advanceState() {
        this.stateTimer = 0;

        const stateFlow = {
            [FlintlockState.HALF_COCK]: FlintlockState.OPEN_FRIzzEN,
            [FlintlockState.OPEN_FRIzzEN]: FlintlockState.PRIME_PAN,
            [FlintlockState.PRIME_PAN]: FlintlockState.CLOSE_FRIzzEN,
            [FlintlockState.CLOSE_FRIzzEN]: FlintlockState.BITE_CARTRIDGE,
            [FlintlockState.BITE_CARTRIDGE]: FlintlockState.POUR_POWDER,
            [FlintlockState.POUR_POWDER]: FlintlockState.INSERT_BALL,
            [FlintlockState.INSERT_BALL]: FlintlockState.REMOVE_RAMROD,
            [FlintlockState.REMOVE_RAMROD]: FlintlockState.RAM_BALL,
            [FlintlockState.RAM_BALL]: FlintlockState.RETURN_RAMROD,
            [FlintlockState.RETURN_RAMROD]: FlintlockState.FULL_COCK,
            [FlintlockState.FULL_COCK]: FlintlockState.READY,
            [FlintlockState.RECOVERY]: FlintlockState.HALF_COCK
        };

        const nextState = stateFlow[this.state];
        if (nextState) {
            this.state = nextState;

            if (this.state === FlintlockState.PRIME_PAN) {
                this.isPrimed = true;
            } else if (this.state === FlintlockState.POUR_POWDER) {
                this.hasPowder = true;
            } else if (this.state === FlintlockState.INSERT_BALL) {
                this.hasBall = true;
            } else if (this.state === FlintlockState.FULL_COCK) {
                this.hammerCocked = true;
            }
        }
    }

    updateAnimation(progress) {
        switch (this.state) {
            case FlintlockState.HALF_COCK:
                if (this.hammerMesh) {
                    this.hammerMesh.rotation.x = -0.3 - (progress * 0.5);
                }
                break;
            case FlintlockState.OPEN_FRIzzEN:
                if (this.frizzenMesh) {
                    this.frizzenMesh.rotation.x = 0.5 - (progress * 1.0);
                }
                this.frizzenOpen = true;
                break;
            case FlintlockState.CLOSE_FRIzzEN:
                if (this.frizzenMesh) {
                    this.frizzenMesh.rotation.x = -0.5 + (progress * 1.0);
                }
                if (progress >= 1) this.frizzenOpen = false;
                break;
            case FlintlockState.FULL_COCK:
                if (this.hammerMesh) {
                    this.hammerMesh.rotation.x = -0.8 - (progress * 0.4);
                }
                break;
            case FlintlockState.FIRING:
                if (this.hammerMesh) {
                    this.hammerMesh.rotation.x = -1.2 + (progress * 1.0);
                }
                break;
            case FlintlockState.RECOVERY:
                if (this.hammerMesh) {
                    this.hammerMesh.rotation.x = -0.2;
                }
                if (this.frizzenMesh) {
                    this.frizzenMesh.rotation.x = 0.5;
                }
                break;
        }
    }

    updateVisuals() {
        if (this.state === FlintlockState.AIMING) {
            const sway = Math.sin(Date.now() * 0.002) * 0.001;
            if (this.mesh) {
                this.mesh.rotation.z = sway;
            }
        }
    }

    startReload() {
        if (this.state === FlintlockState.READY && !this.hammerCocked) {
            this.state = FlintlockState.HALF_COCK;
            this.stateTimer = 0;
            this.hasPowder = false;
            this.hasBall = false;
            this.isPrimed = false;
            return true;
        }
        return false;
    }

    canFire() {
        return this.state === FlintlockState.READY &&
               this.hammerCocked &&
               this.hasPowder &&
               this.hasBall &&
               this.isPrimed;
    }

    fire() {
        if (this.canFire()) {
            this.state = FlintlockState.FIRING;
            this.stateTimer = 0;

            setTimeout(() => {
                this.hasPowder = false;
                this.hasBall = false;
                this.isPrimed = false;
                this.hammerCocked = false;
                this.state = FlintlockState.RECOVERY;
                this.stateTimer = 0;
            }, 100);

            return true;
        }
        return false;
    }

    getStateDisplay() {
        const displayNames = {
            [FlintlockState.READY]: this.hammerCocked ? 'READY TO FIRE' : 'READY (Reload)',
            [FlintlockState.HALF_COCK]: 'Half Cock...',
            [FlintlockState.OPEN_FRIzzEN]: 'Opening Frizzen...',
            [FlintlockState.PRIME_PAN]: 'Priming Pan...',
            [FlintlockState.CLOSE_FRIzzEN]: 'Closing Frizzen...',
            [FlintlockState.BITE_CARTRIDGE]: 'Biting Cartridge...',
            [FlintlockState.POUR_POWDER]: 'Pouring Powder...',
            [FlintlockState.INSERT_BALL]: 'Inserting Ball...',
            [FlintlockState.REMOVE_RAMROD]: 'Removing Ramrod...',
            [FlintlockState.RAM_BALL]: 'Ramming Ball...',
            [FlintlockState.RETURN_RAMROD]: 'Returning Ramrod...',
            [FlintlockState.FULL_COCK]: 'Full Cock...',
            [FlintlockState.AIMING]: 'AIMING',
            [FlintlockState.FIRING]: 'FIRING',
            [FlintlockState.RECOVERY]: 'Recovering...'
        };
        return displayNames[this.state] || this.state;
    }

    getProgress() {
        if (this.state === FlintlockState.READY ||
            this.state === FlintlockState.AIMING ||
            this.state === FlintlockState.FIRING) {
            return 1;
        }
        const timing = this.timings[this.state] || 0.5;
        return Math.min(this.stateTimer / timing, 1);
    }
}
