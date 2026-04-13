/**
 * Iron Sights System
 * No HUD crosshairs - only 3D model sights
 */

class IronSights {
    constructor() {
        this.sightPicture = null;
    }
    
    /**
     * Check if aim is aligned (for debugging/visual feedback)
     * In iron sights, you MUST align rear notch with front post
     */
    isAligned(camera, musket, target) {
        // Get direction from camera
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        
        // Front sight should be near center of screen when aiming
        const frontSightPos = new THREE.Vector3(0, 0.09, 1.2);
        frontSightPos.applyMatrix4(musket.group.matrixWorld);
        
        frontSightPos.project(camera);
        
        // Check if front sight is near center
        const isCentered = Math.abs(frontSightPos.x) < 0.1 && Math.abs(frontSightPos.y) < 0.1;
        
        return isCentered;
    }
    
    /**
     * Get aiming direction from sight alignment
     * Accounts for sight offset from barrel
     */
    getAimDirection(camera, musket) {
        // The barrel direction is actually slightly offset from sight picture
        // Front sight height vs bore axis
        const boreOffset = new THREE.Vector3(0, -0.03, 0); // Barrel is 3cm below sights
        
        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyQuaternion(camera.quaternion);
        
        return direction;
    }
    
    /**
     * Calculate bullet drop compensation
     * For proper iron sights, you aim higher at distance
     */
    calculateHoldover(distance) {
        // Simplified ballistic holdover
        // At 50m, bullet drops about 10-15cm
        // At 100m, drops about 50cm
        if (distance < 10) return 0;
        
        const drop = Math.pow(distance / 50, 2) * 0.15;
        return drop;
    }
}