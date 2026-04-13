/**
 * Animation system for musket reloading and movement
 * Handles hand positions, musket rotations, and transitions
 */

class Animations {
    constructor() {
        // Keyframe data for each reload stage
        this.reloadKeyframes = {
            'idle': {
                musketRot: { x: 0, y: 0, z: 0 },
                musketPos: { x: 0.3, y: -0.2, z: 0.5 },
                leftHand: { x: 0.1, y: -0.1, z: 0.3 },
                rightHand: { x: -0.1, y: -0.2, z: 0.4 },
                ramrodOut: false,
                hammerPos: 0 // 0 = down, 0.5 = half-cock, 1 = full-cock
            },
            
            'half_cock': {
                musketRot: { x: 0, y: 0.1, z: 0 },
                musketPos: { x: 0.3, y: -0.1, z: 0.4 },
                leftHand: { x: 0.15, y: -0.15, z: 0.35 },
                rightHand: { x: -0.05, y: -0.15, z: 0.35 },
                ramrodOut: false,
                hammerPos: 0.5
            },
            
            'bite_cartridge': {
                musketRot: { x: -0.3, y: 0, z: 0 },
                musketPos: { x: 0.25, y: 0.1, z: 0.3 },
                leftHand: { x: 0.2, y: 0, z: 0.2 }, // Hand near mouth
                rightHand: { x: -0.1, y: -0.1, z: 0.3 },
                ramrodOut: false,
                hammerPos: 0.5
            },
            
            'pour_powder': {
                musketRot: { x: -0.8, y: 0, z: 0 }, // Tilt up
                musketPos: { x: 0.2, y: 0.2, z: 0.2 },
                leftHand: { x: 0.25, y: 0.15, z: 0.15 }, // Pouring motion
                rightHand: { x: 0, y: 0.05, z: 0.25 },
                ramrodOut: false,
                hammerPos: 0.5
            },
            
            'load_ball': {
                musketRot: { x: -0.5, y: 0, z: 0 },
                musketPos: { x: 0.25, y: 0.1, z: 0.25 },
                leftHand: { x: 0.3, y: 0.1, z: 0.2 }, // Placing ball
                rightHand: { x: -0.05, y: 0, z: 0.25 },
                ramrodOut: false,
                hammerPos: 0.5
            },
            
            'ramrod_down': {
                musketRot: { x: -0.3, y: 0, z: 0 },
                musketPos: { x: 0.25, y: -0.05, z: 0.3 },
                leftHand: { x: 0.35, y: 0, z: 0.35 }, // Ramrod pushing
                rightHand: { x: -0.1, y: -0.15, z: 0.35 },
                ramrodOut: true,
                ramrodDepth: 0.8, // Ramrod inserted deep
                hammerPos: 0.5
            },
            
            'ramrod_up': {
                musketRot: { x: -0.2, y: 0, z: 0 },
                musketPos: { x: 0.28, y: -0.1, z: 0.35 },
                leftHand: { x: 0.3, y: -0.1, z: 0.4 }, // Withdrawing ramrod
                rightHand: { x: -0.08, y: -0.18, z: 0.4 },
                ramrodOut: true,
                ramrodDepth: 0.2, // Ramrod partially out
                hammerPos: 0.5
            },
            
            'prime_pan': {
                musketRot: { x: 0, y: 0.2, z: 0 },
                musketPos: { x: 0.3, y: -0.15, z: 0.4 },
                leftHand: { x: 0.2, y: -0.2, z: 0.35 }, // Pouring priming powder
                rightHand: { x: -0.1, y: -0.25, z: 0.4 },
                ramrodOut: false,
                hammerPos: 0.5
            },
            
            'full_cock': {
                musketRot: { x: 0, y: 0.1, z: 0 },
                musketPos: { x: 0.3, y: -0.2, z: 0.45 },
                leftHand: { x: 0.12, y: -0.15, z: 0.38 },
                rightHand: { x: -0.08, y: -0.22, z: 0.42 },
                ramrodOut: false,
                hammerPos: 1 // Full cock
            },
            
            'aiming': {
                musketRot: { x: 0, y: 0, z: 0 },
                musketPos: { x: 0, y: -0.15, z: 0.3 },
                leftHand: { x: 0, y: -0.1, z: 0.25 },
                rightHand: { x: -0.15, y: -0.2, z: 0.35 },
                ramrodOut: false,
                hammerPos: 1
            },
            
            'fired': {
                musketRot: { x: -0.1, y: 0, z: 0 },
                musketPos: { x: 0.35, y: -0.15, z: 0.45 },
                leftHand: { x: 0.15, y: -0.1, z: 0.4 },
                rightHand: { x: -0.05, y: -0.2, z: 0.45 },
                ramrodOut: false,
                hammerPos: 0 // Hammer falls
            }
        };
        
        // Stage timings (seconds)
        this.stageTimings = {
            'half_cock': 0.3,
            'bite_cartridge': 0.5,
            'pour_powder': 0.6,
            'load_ball': 0.4,
            'ramrod_down': 0.8,
            'ramrod_up': 0.4,
            'prime_pan': 0.5,
            'full_cock': 0.3,
            'aiming': 0.2
        };
    }
    
    /**
     * Get interpolated pose between two stages
     * @param {string} fromStage - Starting stage
     * @param {string} toStage - Target stage
     * @param {number} progress - 0.0 to 1.0
     */
    interpolatePose(fromStage, toStage, progress) {
        const from = this.reloadKeyframes[fromStage] || this.reloadKeyframes['idle'];
        const to = this.reloadKeyframes[toStage] || this.reloadKeyframes['idle'];
        
        const eased = this.easeInOutCubic(progress);
        
        return {
            musketRot: {
                x: from.musketRot.x + (to.musketRot.x - from.musketRot.x) * eased,
                y: from.musketRot.y + (to.musketRot.y - from.musketRot.y) * eased,
                z: from.musketRot.z + (to.musketRot.z - from.musketRot.z) * eased
            },
            musketPos: {
                x: from.musketPos.x + (to.musketPos.x - from.musketPos.x) * eased,
                y: from.musketPos.y + (to.musketPos.y - from.musketPos.y) * eased,
                z: from.musketPos.z + (to.musketPos.z - from.musketPos.z) * eased
            },
            leftHand: {
                x: from.leftHand.x + (to.leftHand.x - from.leftHand.x) * eased,
                y: from.leftHand.y + (to.leftHand.y - from.leftHand.y) * eased,
                z: from.leftHand.z + (to.leftHand.z - from.leftHand.z) * eased
            },
            rightHand: {
                x: from.rightHand.x + (to.rightHand.x - from.rightHand.x) * eased,
                y: from.rightHand.y + (to.rightHand.y - from.rightHand.y) * eased,
                z: from.rightHand.z + (to.rightHand.z - from.rightHand.z) * eased
            },
            ramrodOut: to.ramrodOut,
            ramrodDepth: from.ramrodDepth !== undefined 
                ? from.ramrodDepth + (to.ramrodDepth - from.ramrodDepth) * eased 
                : to.ramrodDepth,
            hammerPos: from.hammerPos + (to.hammerPos - from.hammerPos) * eased
        };
    }
    
    /**
     * Get recoil pose after firing
     * @param {number} recoilProgress - 0.0 to 1.0 (recovery)
     */
    getRecoilPose(recoilProgress) {
        const kick = Math.sin(recoilProgress * Math.PI) * 0.15;
        const recovery = 1 - recoilProgress;
        
        return {
            musketRot: { x: -kick, y: 0, z: 0 },
            musketPos: { 
                x: 0.3, 
                y: -0.2 + kick * 0.1, 
                z: 0.5 - kick * 0.2 
            },
            leftHand: { x: 0.1, y: -0.1 + kick * 0.05, z: 0.3 - kick * 0.1 },
            rightHand: { x: -0.1, y: -0.2 + kick * 0.05, z: 0.4 - kick * 0.15 },
            ramrodOut: false,
            hammerPos: 0
        };
    }
    
    /**
     * Get sway from player movement
     * @param {number} moveSpeed - Current movement speed
     * @param {number} time - Current time for periodic sway
     */
    getMovementSway(moveSpeed, time) {
        const breath = Math.sin(time * 2) * 0.005; // Breathing
        const walk = Math.sin(time * 8) * 0.01 * Math.min(moveSpeed, 1); // Walking bob
        const sway = Math.sin(time * 3) * 0.003 * Math.min(moveSpeed, 1); // Side sway
        
        return {
            x: breath + sway,
            y: walk,
            z: breath * 0.5
        };
    }
    
    /**
     * Get aim sway for iron sights (increases with fatigue)
     * @param {number} aimTime - How long aiming (seconds)
     * @param {number} time - Current time
     */
    getAimSway(aimTime, time) {
        const fatigue = Math.min(aimTime * 0.1, 0.02); // Increases over time
        const heartRate = Math.sin(time * 1.5) * (0.002 + fatigue); // Heartbeat effect
        const micro = (Math.random() - 0.5) * fatigue * 0.5; // Micro tremors
        
        return {
            x: heartRate + micro,
            y: heartRate * 0.7 + micro
        };
    }
    
    /**
     * Get timing for a specific stage
     */
    getStageTiming(stage) {
        return this.stageTimings[stage] || 0.5;
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
}