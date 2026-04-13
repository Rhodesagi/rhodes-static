/**
 * Flintlock Musket class
 * Authentic 8-stage reloading sequence with proper state machine
 * No magazines, no automatic reloading - manual step-by-step
 */

class Musket {
    constructor(scene, playerId) {
        this.scene = scene;
        this.playerId = playerId;
        
        // Flintlock state machine
        this.reloadStages = [
            'fired',        // 0: Just fired, need to reload
            'half_cock',    // 1: Safety position, can prime
            'bite_cartridge', // 2: Open powder cartridge with teeth
            'pour_powder',  // 3: Pour powder down barrel
            'load_ball',    // 4: Insert patched ball
            'ramrod_down',  // 5: Seat the charge (tamp down)
            'ramrod_up',    // 6: Remove ramrod
            'prime_pan',    // 7: Pour priming powder in flash pan
            'full_cock'     // 8: Ready to fire
        ];
        
        this.currentStageIndex = 8; // Start ready to fire
        this.currentStage = 'full_cock';
        this.targetStage = null;
        
        // Animation state
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionTime = 0;
        this.totalTransitionTime = 0;
        
        // Recoil
        this.recoilActive = false;
        this.recoilProgress = 0;
        
        // Aiming
        this.isAiming = false;
        this.aimProgress = 0;
        this.aimTime = 0;
        
        // Movement restriction during certain stages
        this.canMove = true;
        
        // Build the 3D model
        this.group = new THREE.Group();
        this.buildModel();
        
        // Animation system reference
        this.animations = new Animations();
        
        // Current pose
        this.currentPose = this.animations.reloadKeyframes['idle'];
    }
    
    buildModel() {
        // Wood material for stock
        const woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x5c4033,
            roughness: 0.7,
            metalness: 0.1
        });
        
        // Steel material for metal parts
        const steelMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.4,
            metalness: 0.8
        });
        
        // Dark steel for barrel
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.3,
            metalness: 0.7
        });
        
        // Brass for trigger guard
        const brassMaterial = new THREE.MeshStandardMaterial({
            color: 0xb5a642,
            roughness: 0.3,
            metalness: 0.9
        });
        
        // 1. Stock (main wooden body)
        const stockGeo = new THREE.BoxGeometry(0.08, 0.12, 0.8);
        // Taper the stock using geometry manipulation
        const stockPositions = stockGeo.attributes.position;
        for (let i = 0; i < stockPositions.count; i++) {
            const z = stockPositions.getZ(i);
            if (z < 0) { // Butt end
                const factor = 1.0 + (0 - z) * 0.5;
                stockPositions.setX(i, stockPositions.getX(i) * factor);
            }
        }
        stockGeo.computeVertexNormals();
        this.stock = new THREE.Mesh(stockGeo, woodMaterial);
        this.stock.position.set(0, 0, 0);
        this.group.add(this.stock);
        
        // 2. Barrel (octagonal to round)
        const barrelGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8);
        barrelGeo.rotateX(Math.PI / 2);
        this.barrel = new THREE.Mesh(barrelGeo, barrelMaterial);
        this.barrel.position.set(0, 0.06, 0.7);
        this.group.add(this.barrel);
        
        // 3. Barrel bands (3 rings holding barrel to stock)
        for (let i = 0; i < 3; i++) {
            const bandGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.04, 8);
            bandGeo.rotateX(Math.PI / 2);
            const band = new THREE.Mesh(bandGeo, brassMaterial);
            band.position.set(0, 0.06, 0.4 + i * 0.3);
            this.group.add(band);
        }
        
        // 4. Breech area (where barrel meets lock)
        const breechGeo = new THREE.BoxGeometry(0.04, 0.08, 0.1);
        this.breech = new THREE.Mesh(breechGeo, steelMaterial);
        this.breech.position.set(0, 0.08, 0.25);
        this.group.add(this.breech);
        
        // 5. Lock mechanism plate
        const lockPlateGeo = new THREE.BoxGeometry(0.02, 0.12, 0.15);
        this.lockPlate = new THREE.Mesh(lockPlateGeo, steelMaterial);
        this.lockPlate.position.set(0.04, 0.08, 0.22);
        this.group.add(this.lockPlate);
        
        // 6. Hammer (frizzen)
        this.hammerGroup = new THREE.Group();
        const hammerShaftGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6);
        const hammerShaft = new THREE.Mesh(hammerShaftGeo, steelMaterial);
        hammerShaft.position.set(0, 0.04, 0);
        this.hammerGroup.add(hammerShaft);
        
        const hammerHeadGeo = new THREE.BoxGeometry(0.02, 0.03, 0.04);
        const hammerHead = new THREE.Mesh(hammerHeadGeo, steelMaterial);
        hammerHead.position.set(0.02, 0.08, -0.02);
        this.hammerGroup.add(hammerHead);
        
        this.hammerGroup.position.set(0.05, 0.12, 0.18);
        this.group.add(this.hammerGroup);
        
        // 7. Flash pan
        const panGeo = new THREE.BoxGeometry(0.03, 0.005, 0.04);
        this.pan = new THREE.Mesh(panGeo, brassMaterial);
        this.pan.position.set(0.03, 0.07, 0.22);
        this.group.add(this.pan);
        
        // 8. Frizzen cover (over the pan)
        this.frizzenGroup = new THREE.Group();
        const frizzenGeo = new THREE.BoxGeometry(0.02, 0.04, 0.06);
        const frizzen = new THREE.Mesh(frizzenGeo, steelMaterial);
        frizzen.position.set(0, 0, 0);
        this.frizzenGroup.add(frizzen);
        this.frizzenGroup.position.set(0.03, 0.11, 0.22);
        this.group.add(this.frizzenGroup);
        
        // 9. Trigger guard
        const triggerGuardGeo = new THREE.TorusGeometry(0.04, 0.005, 4, 12, Math.PI);
        triggerGuardGeo.rotateZ(Math.PI / 2);
        this.triggerGuard = new THREE.Mesh(triggerGuardGeo, brassMaterial);
        this.triggerGuard.position.set(0, 0.02, 0.15);
        this.group.add(this.triggerGuard);
        
        // 10. Trigger
        const triggerGeo = new THREE.BoxGeometry(0.005, 0.03, 0.015);
        this.trigger = new THREE.Mesh(triggerGeo, steelMaterial);
        this.trigger.position.set(0, 0.02, 0.13);
        this.group.add(this.trigger);
        
        // 11. Butt plate
        const buttPlateGeo = new THREE.BoxGeometry(0.1, 0.15, 0.02);
        this.buttPlate = new THREE.Mesh(buttPlateGeo, brassMaterial);
        this.buttPlate.position.set(0, 0.01, -0.4);
        this.group.add(this.buttPlate);
        
        // 12. Ramrod (stored under barrel)
        this.ramrodGroup = new THREE.Group();
        const ramrodGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.9, 6);
        ramrodGeo.rotateX(Math.PI / 2);
        const ramrod = new THREE.Mesh(ramrodGeo, steelMaterial);
        this.ramrodGroup.add(ramrod);
        
        // Ramrod thimble (end piece)
        const thimbleGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.02, 6);
        thimbleGeo.rotateX(Math.PI / 2);
        const thimble = new THREE.Mesh(thimbleGeo, brassMaterial);
        thimble.position.set(0, 0, 0.45);
        this.ramrodGroup.add(thimble);
        
        this.ramrodGroup.position.set(0, -0.02, 0.5);
        this.group.add(this.ramrodGroup);
        
        // 13. Sights
        // Rear sight (notch sight near lock)
        const rearSightGeo = new THREE.BoxGeometry(0.01, 0.02, 0.005);
        const rearSight = new THREE.Mesh(rearSightGeo, steelMaterial);
        rearSight.position.set(0, 0.11, 0.15);
        this.group.add(rearSight);
        
        // Rear sight notch (actual aperture)
        const notchGeo = new THREE.BoxGeometry(0.002, 0.008, 0.006);
        const notch = new THREE.Mesh(notchGeo, new THREE.MeshBasicMaterial({ color: 0x000000 }));
        notch.position.set(0, 0.11, 0.15);
        this.group.add(notch);
        
        // Front sight (post sight at muzzle)
        const frontSightGeo = new THREE.BoxGeometry(0.006, 0.03, 0.003);
        const frontSight = new THREE.Mesh(frontSightGeo, steelMaterial);
        frontSight.position.set(0, 0.09, 1.2);
        this.group.add(frontSight);
        
        // Muzzle position for firing
        this.muzzlePosition = new THREE.Vector3(0, 0.06, 1.25);
        
        // Set initial scale
        this.group.scale.set(0.5, 0.5, 0.5);
    }
    
    /**
     * Attempt to fire the musket
     * Returns true if shot fired
     */
    fire() {
        if (this.currentStage !== 'full_cock') {
            // Can't fire - not cocked
            return false;
        }
        
        if (this.isAiming && this.aimProgress < 0.8) {
            // Must be mostly aimed
            return false;
        }
        
        // Fire!
        this.currentStage = 'fired';
        this.currentStageIndex = 0;
        this.recoilActive = true;
        this.recoilProgress = 0;
        this.isAiming = false;
        this.aimProgress = 0;
        
        // Animate hammer falling
        this.setHammerPosition(0);
        
        return true;
    }
    
    /**
     * Advance to next stage of reloading
     * Returns true if advanced, false if already at end or transitioning
     */
    advanceReload() {
        if (this.isTransitioning) return false;
        if (this.currentStageIndex >= this.reloadStages.length - 1) return false;
        if (this.recoilActive) return false;
        
        // Start transition
        this.isTransitioning = true;
        this.transitionProgress = 0;
        this.targetStage = this.reloadStages[this.currentStageIndex + 1];
        this.totalTransitionTime = this.animations.getStageTiming(this.targetStage);
        this.transitionTime = 0;
        
        return true;
    }
    
    /**
     * Toggle aiming down sights
     */
    toggleAim() {
        if (this.currentStage !== 'full_cock') return false; // Can only aim when ready
        if (this.recoilActive) return false;
        
        this.isAiming = !this.isAiming;
        return true;
    }
    
    /**
     * Set aiming state directly
     */
    setAiming(aiming) {
        if (this.currentStage !== 'full_cock') {
            this.isAiming = false;
            return;
        }
        this.isAiming = aiming;
    }
    
    /**
     * Get muzzle position in world space
     */
    getMuzzlePosition(parentMatrix) {
        const pos = this.muzzlePosition.clone();
        pos.applyMatrix4(parentMatrix);
        return pos;
    }
    
    /**
     * Get firing direction
     */
    getFireDirection(parentRotation) {
        const dir = new THREE.Vector3(0, 0, 1);
        dir.applyEuler(parentRotation);
        return dir;
    }
    
    /**
     * Update musket animation and state
     */
    update(dt, moveSpeed, time, cameraRotation) {
        // Handle recoil
        if (this.recoilActive) {
            this.recoilProgress += dt * 4; // Recovery speed
            if (this.recoilProgress >= 1) {
                this.recoilActive = false;
                this.recoilProgress = 0;
            }
        }
        
        // Handle transition between stages
        if (this.isTransitioning) {
            this.transitionTime += dt;
            this.transitionProgress = this.transitionTime / this.totalTransitionTime;
            
            if (this.transitionProgress >= 1) {
                // Transition complete
                this.currentStageIndex++;
                this.currentStage = this.targetStage;
                this.isTransitioning = false;
                this.transitionProgress = 0;
                this.transitionTime = 0;
                this.targetStage = null;
                
                // Update hammer position based on stage
                if (this.currentStage === 'half_cock') {
                    this.setHammerPosition(0.5);
                } else if (this.currentStage === 'full_cock') {
                    this.setHammerPosition(1);
                }
                
                // Check if ramrod should be out
                this.updateRamrod();
            }
        }
        
        // Handle aiming progress
        const targetAimProgress = this.isAiming ? 1 : 0;
        const aimSpeed = this.isAiming ? 2.0 : 4.0; // Faster to lower
        this.aimProgress += (targetAimProgress - this.aimProgress) * dt * aimSpeed;
        
        if (this.isAiming) {
            this.aimTime += dt;
        } else {
            this.aimTime = 0;
        }
        
        // Get current pose
        let pose;
        
        if (this.recoilActive) {
            pose = this.animations.getRecoilPose(this.recoilProgress);
        } else if (this.isTransitioning) {
            pose = this.animations.interpolatePose(
                this.currentStage,
                this.targetStage,
                this.transitionProgress
            );
        } else if (this.aimProgress > 0.01) {
            const aimPose = this.animations.reloadKeyframes['aiming'];
            const idlePose = this.animations.reloadKeyframes[this.currentStage] || 
                             this.animations.reloadKeyframes['idle'];
            
            // Blend between idle and aiming
            const t = this.aimProgress;
            pose = this.lerpPoses(idlePose, aimPose, t);
        } else {
            pose = this.animations.reloadKeyframes[this.currentStage] || 
                   this.animations.reloadKeyframes['idle'];
        }
        
        // Add movement sway
        const sway = this.animations.getMovementSway(moveSpeed, time);
        pose.musketRot.x += sway.x;
        pose.musketRot.y += sway.y;
        pose.musketPos.y += sway.y;
        
        // Add aim sway when aiming
        if (this.aimProgress > 0.5) {
            const aimSway = this.animations.getAimSway(this.aimTime, time);
            pose.musketRot.x += aimSway.x;
            pose.musketRot.y += aimSway.y;
        }
        
        // Apply pose to group
        this.applyPose(pose);
        
        // Update ramrod visibility and position
        this.updateRamrod();
        
        this.currentPose = pose;
    }
    
    lerpPoses(a, b, t) {
        return {
            musketRot: {
                x: a.musketRot.x + (b.musketRot.x - a.musketRot.x) * t,
                y: a.musketRot.y + (b.musketRot.y - a.musketRot.y) * t,
                z: a.musketRot.z + (b.musketRot.z - a.musketRot.z) * t
            },
            musketPos: {
                x: a.musketPos.x + (b.musketPos.x - a.musketPos.x) * t,
                y: a.musketPos.y + (b.musketPos.y - a.musketPos.y) * t,
                z: a.musketPos.z + (b.musketPos.z - a.musketPos.z) * t
            },
            leftHand: {
                x: a.leftHand.x + (b.leftHand.x - a.leftHand.x) * t,
                y: a.leftHand.y + (b.leftHand.y - a.leftHand.y) * t,
                z: a.leftHand.z + (b.leftHand.z - a.leftHand.z) * t
            },
            rightHand: {
                x: a.rightHand.x + (b.rightHand.x - a.rightHand.x) * t,
                y: a.rightHand.y + (b.rightHand.y - a.rightHand.y) * t,
                z: a.rightHand.z + (b.rightHand.z - a.rightHand.z) * t
            },
            ramrodOut: b.ramrodOut,
            ramrodDepth: a.ramrodDepth !== undefined && b.ramrodDepth !== undefined 
                ? a.ramrodDepth + (b.ramrodDepth - a.ramrodDepth) * t 
                : (b.ramrodDepth || 0),
            hammerPos: a.hammerPos + (b.hammerPos - a.hammerPos) * t
        };
    }
    
    applyPose(pose) {
        this.group.rotation.x = pose.musketRot.x;
        this.group.rotation.y = pose.musketRot.y;
        this.group.rotation.z = pose.musketRot.z;
        
        this.group.position.x = pose.musketPos.x;
        this.group.position.y = pose.musketPos.y;
        this.group.position.z = pose.musketPos.z;
    }
    
    setHammerPosition(position) {
        // position: 0 = down (fired), 0.5 = half-cock, 1 = full-cock
        // Rotate hammer around its pivot
        const baseAngle = Math.PI / 4; // 45 degrees forward
        const angle = baseAngle - (position * Math.PI / 2);
        this.hammerGroup.rotation.x = angle;
    }
    
    updateRamrod() {
        // Show/hide ramrod based on stage
        const showRamrod = this.currentStage === 'ramrod_down' || 
                          this.currentStage === 'ramrod_up' ||
                          (this.isTransitioning && 
                           (this.targetStage === 'ramrod_down' || 
                            this.targetStage === 'ramrod_up'));
        
        if (showRamrod) {
            this.ramrodGroup.visible = true;
            // Ramrod is extended when out
            const depth = this.currentPose && this.currentPose.ramrodDepth || 0;
            this.ramrodGroup.position.z = 0.5 + depth * 0.4;
        } else {
            this.ramrodGroup.visible = false;
        }
    }
    
    /**
     * Get current stage name
     */
    getStage() {
        return this.currentStage;
    }
    
    /**
     * Check if musket is ready to fire
     */
    isReadyToFire() {
        return this.currentStage === 'full_cock' && !this.recoilActive;
    }
    
    /**
     * Get reload progress as string for display (debug)
     */
    getReloadStatus() {
        const stages = {
            'fired': 'FIRED - Press E/ENTER to reload',
            'half_cock': 'HALF COCK - Safety position',
            'bite_cartridge': 'BITE - Open powder cartridge',
            'pour_powder': 'POUR - Powder down barrel',
            'load_ball': 'LOAD - Ball and patch',
            'ramrod_down': 'RAMROD - Seat the charge',
            'ramrod_up': 'WITHDRAW - Remove ramrod',
            'prime_pan': 'PRIME - Pan powder',
            'full_cock': 'FULL COCK - Ready to aim'
        };
        return stages[this.currentStage] || this.currentStage;
    }
    
    /**
     * Get FOV for aiming
     */
    getAimFOV(baseFOV) {
        return baseFOV - (this.aimProgress * (baseFOV - 25)); // Zoom to 25°
    }
    
    /**
     * Reset to ready state (for new round)
     */
    reset() {
        this.currentStageIndex = 8;
        this.currentStage = 'full_cock';
        this.targetStage = null;
        this.isTransitioning = false;
        this.recoilActive = false;
        this.isAiming = false;
        this.aimProgress = 0;
        this.setHammerPosition(1);
    }
}