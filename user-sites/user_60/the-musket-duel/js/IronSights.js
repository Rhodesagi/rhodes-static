// IronSights.js - Mechanical iron sight alignment for musket
class IronSights {
    constructor() {
        this.group = new THREE.Group();
        this.createSights();
    }
    
    createSights() {
        // Rear sight - V-notch type (traditional Brown Bess style)
        const rearSightShape = new THREE.Shape();
        rearSightShape.moveTo(-0.015, 0);
        rearSightShape.lineTo(-0.01, 0.012);
        rearSightShape.lineTo(0.01, 0.012);
        rearSightShape.lineTo(0.015, 0);
        rearSightShape.lineTo(0.01, -0.008);
        rearSightShape.lineTo(-0.01, -0.008);
        rearSightShape.lineTo(-0.015, 0);
        
        const rearGeometry = new THREE.ExtrudeGeometry(rearSightShape, {
            depth: 0.003,
            bevelEnabled: false
        });
        
        const sightMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.6,
            metalness: 0.3
        });
        
        this.rearSight = new THREE.Mesh(rearGeometry, sightMaterial);
        this.rearSight.position.set(0, -0.08, -0.12); // Position in front of eye
        this.group.add(this.rearSight);
        
        // Front sight - blade/post type
        const frontGeometry = new THREE.BoxGeometry(0.006, 0.04, 0.003);
        this.frontSight = new THREE.Mesh(frontGeometry, sightMaterial);
        this.frontSight.position.set(0, -0.08, -0.55); // Position near muzzle
        this.group.add(this.frontSight);
        
        // Barrel top reference line (visual only)
        const barrelLineGeo = new THREE.BoxGeometry(0.008, 0.002, 0.5);
        const barrelLine = new THREE.Mesh(barrelLineGeo, sightMaterial);
        barrelLine.position.set(0, -0.10, -0.35);
        this.group.add(barrelLine);
        
        // Create sight picture overlay (black bars for focus effect)
        // This simulates the depth of field effect when focusing on front sight
        this.blurOverlay = this.createBlurOverlay();
        
        // Hammer visible in periphery (serves as cocking indicator)
        this.createHammerIndicator();
    }
    
    createBlurOverlay() {
        // Vignette effect when aiming - subtle darkening at edges
        const overlayGeo = new THREE.RingGeometry(0.02, 0.15, 32);
        const overlayMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.0, // Default off, shows when focusing
            side: THREE.DoubleSide
        });
        const overlay = new THREE.Mesh(overlayGeo, overlayMat);
        overlay.position.z = -0.11;
        this.group.add(overlay);
        return overlay;
    }
    
    createHammerIndicator() {
        // Visual indicator of hammer position in peripheral vision
        const hammerGeo = new THREE.BoxGeometry(0.04, 0.08, 0.02);
        const hammerMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.4,
            metalness: 0.5
        });
        
        this.hammer = new THREE.Mesh(hammerGeo, hammerMat);
        this.hammer.position.set(0.08, 0.05, -0.12);
        this.group.add(this.hammer);
    }
    
    update(aiming, hammerState) {
        // Position sights based on aim
        // When properly aligned, front sight is centered in rear sight notch
        
        // Update hammer rotation based on state
        // 0 = down (fired), 1 = half-cock, 2 = full-cock
        const rotations = [Math.PI / 4, Math.PI / 2.5, Math.PI / 1.8];
        this.hammer.rotation.z = rotations[hammerState] || 0;
        
        // Slight sway for breathing/stance
        const time = Date.now() * 0.001;
        const swayX = Math.sin(time * 0.8) * 0.0005;
        const swayY = Math.cos(time * 0.6) * 0.0008;
        
        this.group.position.x = swayX;
        this.group.position.y = swayY;
    }
    
    getSightAlignment() {
        // Return sight alignment quality based on camera
        // Could be used for accuracy calculations
        return {
            rearPosition: this.rearSight.position.clone(),
            frontPosition: this.frontSight.position.clone()
        };
    }
    
    getMesh() {
        return this.group;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = IronSights;
}
