/**
 * Iron Sights Module - Mathematical alignment of front blade and rear notch
 * Authentic Brown Bess sights:
 * - Rear sight: V-notch, ~2mm wide
 * - Front sight: blade, ~2mm wide
 * - Sight radius: ~30 inches (0.76m)
 */

class IronSights {
    constructor() {
        this.SIGHT_RADIUS = 0.76; // meters (30 inches)
        this.REAR_NOTCH_WIDTH = 0.002; // 2mm
        this.FRONT_BLADE_WIDTH = 0.002; // 2mm
        this.FRONT_SIGHT_HEIGHT = 0.015; // Height above bore
        
        // Sight picture geometry
        this.sightGeometry = null;
        this.sightMaterial = null;
    }

    /**
     * Calculate accurate aim direction accounting for sight alignment
     * @param {THREE.Camera} camera - Player camera
     * @param {number} musketRotation - Current Q/E rotation in radians
     * @returns {THREE.Vector3} True aim direction
     */
    calculateAimDirection(camera, musketRotation = 0) {
        // Get camera direction
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        
        // Apply musket rotation (wrist roll around barrel axis)
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(camera.quaternion);
        
        const rotationQuat = new THREE.Quaternion().setFromAxisAngle(
            direction, 
            musketRotation
        );
        
        // Small offset for sight height (bullet exits below sight line)
        const up = new THREE.Vector3(0, 1, 0);
        up.applyQuaternion(camera.quaternion);
        
        // True bore axis is slightly below sight line
        const boreOffset = up.clone().multiplyScalar(-0.015); // Bore 1.5cm below sights
        
        return {
            direction: direction,
            boreAxis: direction.clone().add(boreOffset.clone().multiplyScalar(0.01)).normalize(),
            right: right,
            up: up
        };
    }

    /**
     * Create visual iron sights for the weapon model
     */
    createSightGeometry() {
        const group = new THREE.Group();
        
        // Rear sight (V-notch)
        const rearSight = new THREE.Group();
        
        // Left post
        const leftPost = new THREE.Mesh(
            new THREE.BoxGeometry(0.001, 0.008, 0.002),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 })
        );
        leftPost.position.set(-0.001, 0.004, 0);
        
        // Right post
        const rightPost = new THREE.Mesh(
            new THREE.BoxGeometry(0.001, 0.008, 0.002),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 })
        );
        rightPost.position.set(0.001, 0.004, 0);
        
        rearSight.add(leftPost);
        rearSight.add(rightPost);
        rearSight.position.set(0, 0, 0.15); // Near the lock
        group.add(rearSight);
        
        // Front sight (blade with post)
        const frontSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.002, 0.015, 0.001),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 })
        );
        frontSight.position.set(0, 0.0075, -this.SIGHT_RADIUS + 0.05);
        group.add(frontSight);
        
        return group;
    }

    /**
     * Get sight picture for aiming feedback
     * Returns how well aligned the sights are
     */
    getSightAlignment(camera, targetPoint) {
        const aimData = this.calculateAimDirection(camera);
        const toTarget = targetPoint.clone().sub(camera.position).normalize();
        
        // Calculate angular error
        const error = aimData.direction.angleTo(toTarget);
        const errorDegrees = error * (180 / Math.PI);
        
        // Calculate windage (horizontal) and elevation (vertical) errors
        const right = aimData.right;
        const up = aimData.up;
        
        const windage = toTarget.clone().dot(right);
        const elevation = toTarget.clone().dot(up);
        
        return {
            totalError: errorDegrees,
            windage: windage,
            elevation: elevation,
            aligned: errorDegrees < 0.5 // Within 0.5 degrees
        };
    }

    /**
     * Create the 3D weapon model with proper sight geometry
     */
    createMusketModel() {
        const musket = new THREE.Group();
        
        // Main barrel (octagonal to round)
        const barrelGeometry = new THREE.CylinderGeometry(0.012, 0.015, 1.2, 8);
        const woodMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a3728,
            roughness: 0.7,
            metalness: 0.1
        });
        const metalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.4,
            metalness: 0.9
        });
        
        // Barrel
        const barrel = new THREE.Mesh(barrelGeometry, metalMaterial);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.3;
        musket.add(barrel);
        
        // Breech (thicker part near lock)
        const breech = new THREE.Mesh(
            new THREE.CylinderGeometry(0.018, 0.018, 0.15, 8),
            metalMaterial
        );
        breech.rotation.x = Math.PI / 2;
        breech.position.z = 0.35;
        musket.add(breech);
        
        // Stock (wood)
        const stock = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.08, 0.8),
            woodMaterial
        );
        stock.position.set(0, -0.06, 0.3);
        musket.add(stock);
        
        // Butt plate
        const buttPlate = new THREE.Mesh(
            new THREE.BoxGeometry(0.035, 0.12, 0.02),
            metalMaterial
        );
        buttPlate.position.set(0, -0.04, 0.72);
        musket.add(buttPlate);
        
        // Lock mechanism (frizzen and hammer)
        const lock = new THREE.Mesh(
            new THREE.BoxGeometry(0.025, 0.06, 0.08),
            metalMaterial
        );
        lock.position.set(0.02, 0.02, 0.25);
        musket.add(lock);
        
        // Trigger guard
        const triggerGuard = new THREE.Mesh(
            new THREE.TorusGeometry(0.02, 0.003, 4, 8, Math.PI),
            metalMaterial
        );
        triggerGuard.rotation.z = Math.PI;
        triggerGuard.position.set(0, -0.08, 0.1);
        musket.add(triggerGuard);
        
        // Trigger
        const trigger = new THREE.Mesh(
            new THREE.CylinderGeometry(0.002, 0.002, 0.025),
            metalMaterial
        );
        trigger.rotation.x = Math.PI / 2;
        trigger.position.set(0, -0.07, 0.08);
        musket.add(trigger);
        
        // Ramrod pipes
        for (let i = 0; i < 3; i++) {
            const pipe = new THREE.Mesh(
                new THREE.CylinderGeometry(0.004, 0.004, 0.02, 6),
                metalMaterial
            );
            pipe.rotation.x = Math.PI / 2;
            pipe.position.set(0.02, -0.1, -0.2 + i * 0.25);
            musket.add(pipe);
        }
        
        // Add sights
        const sights = this.createSightGeometry();
        musket.add(sights);
        
        // Ramrod (stored under barrel)
        const ramrod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.003, 0.003, 0.9, 6),
            metalMaterial
        );
        ramrod.rotation.x = Math.PI / 2;
        ramrod.position.set(0.02, -0.1, -0.1);
        ramrod.name = 'ramrod';
        musket.add(ramrod);
        
        return musket;
    }

    /**
     * Update ramrod position during reload animation
     */
    updateRamrod(musket, step, progress) {
        const ramrod = musket.getObjectByName('ramrod');
        if (!ramrod) return;
        
        // Steps 7-9: Draw rammer, ram, return rammer
        if (step === 7) {
            // Drawing rammer
            ramrod.position.x = 0.02 + progress * 0.1;
            ramrod.rotation.z = progress * 0.3;
        } else if (step === 8) {
            // Ramming - rod inserted in barrel
            ramrod.position.x = 0;
            ramrod.rotation.z = 0;
            ramrod.position.z = -0.1 - progress * 0.3;
        } else if (step === 9) {
            // Returning rammer
            ramrod.position.x = progress * 0.02;
            ramrod.rotation.z = (1 - progress) * 0.3;
            ramrod.position.z = -0.4 + progress * 0.3;
        } else {
            // Stored position
            ramrod.position.set(0.02, -0.1, -0.1);
            ramrod.rotation.z = 0;
        }
    }
}