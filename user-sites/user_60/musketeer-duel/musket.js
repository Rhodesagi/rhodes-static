// Flintlock musket with accurate reload sequence and iron sights
// State machine for authentic flintlock mechanics

const MusketState = {
    READY: 'READY',           // Full cock, primed, ready to fire
    HALF_COCK: 'HALF_COCK',   // Hammer at half-cock, safety engaged
    PRIMED: 'PRIMED',         // Pan primed, frizzen closed
    RAMMED: 'RAMMED',         // Ball rammed home
    PATCHED_BALL: 'PATCHED_BALL', // Ball and patch placed
    POWDER: 'POWDER',         // Main powder poured
    EMPTY: 'EMPTY'            // Fired or just loaded, needs full sequence
};

const ReloadStep = {
    [MusketState.EMPTY]: { next: MusketState.POWDER, duration: 1.2, name: 'Pouring Powder...' },
    [MusketState.POWDER]: { next: MusketState.PATCHED_BALL, duration: 0.8, name: 'Placing Ball & Patch...' },
    [MusketState.PATCHED_BALL]: { next: MusketState.RAMMED, duration: 1.5, name: 'Ramming Home...' },
    [MusketState.RAMMED]: { next: MusketState.PRIMED, duration: 0.6, name: 'Priming Pan...' },
    [MusketState.PRIMED]: { next: MusketState.HALF_COCK, duration: 0.4, name: 'Frizzen Closed...' },
    [MusketState.HALF_COCK]: { next: MusketState.READY, duration: 0.4, name: 'Full Cock...' }
};

class Musket {
    constructor(scene, camera, isPlayer2 = false) {
        this.scene = scene;
        this.camera = camera;
        this.isPlayer2 = isPlayer2;
        
        // State machine
        this.state = MusketState.READY;
        this.reloadProgress = 0;
        this.currentReloadStep = null;
        this.reloadTimer = 0;
        
        // Create the musket mesh with iron sights
        this.mesh = this.createMusketMesh();
        
        // Position relative to camera (lower right of view, pointing forward)
        // x=right, y=down, z=forward (negative z is forward in camera space)
        this.offset = new THREE.Vector3(0.15, -0.12, -0.15);
        
        // Kickback animation
        this.kickback = 0;
        this.maxKickback = 0.15;
        
        // Smoke particles
        this.smokeParticles = [];
        
        // Add to camera
        this.camera.add(this.mesh);
        this.mesh.position.copy(this.offset);
        
        // Rotate musket to point forward (barrel should point in -Z direction)
        this.mesh.rotation.y = -Math.PI / 2;
    }
    
    createMusketMesh() {
        const group = new THREE.Group();
        
        // Materials
        const woodMat = new THREE.MeshStandardMaterial({ 
            color: 0x5a3d2b, 
            roughness: 0.7,
            metalness: 0.1
        });
        const steelMat = new THREE.MeshStandardMaterial({ 
            color: 0x4a5568, 
            roughness: 0.4,
            metalness: 0.8
        });
        const brassMat = new THREE.MeshStandardMaterial({ 
            color: 0xb8a76e, 
            roughness: 0.3,
            metalness: 0.9
        });
        const darkSteelMat = new THREE.MeshStandardMaterial({
            color: 0x2d3748,
            roughness: 0.5,
            metalness: 0.7
        });
        
        // Stock (main wooden body)
        const stockGeo = new THREE.BoxGeometry(0.04, 0.08, 0.7);
        const stock = new THREE.Mesh(stockGeo, woodMat);
        stock.position.set(0.02, -0.02, 0);
        stock.rotation.x = -0.05;
        group.add(stock);
        
        // Buttplate (brass)
        const buttGeo = new THREE.BoxGeometry(0.06, 0.1, 0.02);
        const buttplate = new THREE.Mesh(buttGeo, brassMat);
        buttplate.position.set(0.02, -0.02, 0.36);
        buttplate.rotation.x = 0.1;
        group.add(buttplate);
        
        // Barrel (octagonal to round transition - simplified as cylinder)
        const barrelGeo = new THREE.CylinderGeometry(0.012, 0.014, 0.75, 8);
        const barrel = new THREE.Mesh(barrelGeo, steelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.rotation.z = 0.05;
        barrel.position.set(0.04, 0.02, -0.25);
        group.add(barrel);
        
        // Barrel bands (brass)
        for (let i = 0; i < 3; i++) {
            const bandGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.015, 8);
            const band = new THREE.Mesh(bandGeo, brassMat);
            band.rotation.x = Math.PI / 2;
            band.position.set(0.04, 0.02, -0.1 - i * 0.22);
            group.add(band);
        }
        
        // Lock mechanism (flintlock)
        const lockPlateGeo = new THREE.BoxGeometry(0.02, 0.06, 0.1);
        const lockPlate = new THREE.Mesh(lockPlateGeo, darkSteelMat);
        lockPlate.position.set(-0.01, 0, -0.15);
        lockPlate.rotation.y = 0.1;
        group.add(lockPlate);
        
        // Hammer (cock)
        const hammerGroup = new THREE.Group();
        const hammerStemGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.06, 6);
        const hammerStem = new THREE.Mesh(hammerStemGeo, darkSteelMat);
        hammerStem.rotation.z = Math.PI / 2;
        hammerStem.position.y = 0.03;
        
        const hammerHeadGeo = new THREE.BoxGeometry(0.02, 0.03, 0.01);
        const hammerHead = new THREE.Mesh(hammerHeadGeo, darkSteelMat);
        hammerHead.position.set(0.015, 0.055, 0);
        
        hammerGroup.add(hammerStem);
        hammerGroup.add(hammerHead);
        hammerGroup.position.set(-0.01, 0, -0.15);
        this.hammer = hammerGroup;
        group.add(hammerGroup);
        
        // Frizzen (flint striking steel)
        const frizzenGeo = new THREE.BoxGeometry(0.008, 0.04, 0.03);
        const frizzen = new THREE.Mesh(frizzenGeo, steelMat);
        frizzen.position.set(-0.01, 0.04, -0.12);
        frizzen.rotation.x = -0.3; // Open position by default
        this.frizzen = frizzen;
        group.add(frizzen);
        
        // Pan (powder reservoir)
        const panGeo = new THREE.BoxGeometry(0.012, 0.008, 0.02);
        const pan = new THREE.Mesh(panGeo, darkSteelMat);
        pan.position.set(-0.01, 0.035, -0.135);
        group.add(pan);
        
        // Trigger guard (brass)
        const triggerGuardGeo = new THREE.TorusGeometry(0.03, 0.003, 4, 12, Math.PI);
        const triggerGuard = new THREE.Mesh(triggerGuardGeo, brassMat);
        triggerGuard.position.set(0.02, -0.04, 0.1);
        triggerGuard.rotation.y = Math.PI / 2;
        group.add(triggerGuard);
        
        // Trigger
        const triggerGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.025, 4);
        const trigger = new THREE.Mesh(triggerGeo, darkSteelMat);
        trigger.rotation.z = Math.PI / 2;
        trigger.position.set(0.02, -0.04, 0.08);
        trigger.rotation.x = -0.3;
        group.add(trigger);
        
        // ===== IRON SIGHTS =====
        // These are 3D geometry, NOT 2D overlays - required for iron sight aiming
        
        // Rear sight (notch sight on barrel tang)
        const rearSightGroup = new THREE.Group();
        const rearSightBase = new THREE.Mesh(
            new THREE.BoxGeometry(0.01, 0.008, 0.015),
            steelMat
        );
        const rearSightLeft = new THREE.Mesh(
            new THREE.BoxGeometry(0.003, 0.012, 0.003),
            steelMat
        );
        rearSightLeft.position.set(-0.003, 0.01, 0);
        const rearSightRight = new THREE.Mesh(
            new THREE.BoxGeometry(0.003, 0.012, 0.003),
            steelMat
        );
        rearSightRight.position.set(0.003, 0.01, 0);
        rearSightGroup.add(rearSightBase);
        rearSightGroup.add(rearSightLeft);
        rearSightGroup.add(rearSightRight);
        rearSightGroup.position.set(0.04, 0.05, 0.05);
        this.rearSight = rearSightGroup;
        group.add(rearSightGroup);
        
        // Front sight (post sight at muzzle)
        const frontSightGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.02, 6);
        const frontSight = new THREE.Mesh(frontSightGeo, steelMat);
        frontSight.position.set(0.04, 0.055, -0.58);
        this.frontSight = frontSight;
        group.add(frontSight);
        
        // Ramrod (stored under barrel)
        const ramrodGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.7, 6);
        const ramrod = new THREE.Mesh(ramrodGeo, steelMat);
        ramrod.rotation.x = Math.PI / 2;
        ramrod.position.set(0.04, -0.04, -0.25);
        group.add(ramrod);
        
        // Sling swivel
        const swivelGeo = new THREE.TorusGeometry(0.008, 0.002, 4, 8);
        const swivel = new THREE.Mesh(swivelGeo, brassMat);
        swivel.position.set(0.04, -0.06, -0.35);
        group.add(swivel);
        
        // Store references for animation
        this.group = group;
        
        return group;
    }
    
    // Get current state name for UI
    getStateName() {
        if (this.state === MusketState.READY) return 'READY TO FIRE';
        if (this.state === MusketState.HALF_COCK) return 'HALF COCK (Safety)';
        if (this.state === MusketState.PRIMED) return 'PRIMED';
        if (this.state === MusketState.RAMMED) return 'RAMMED';
        if (this.state === MusketState.PATCHED_BALL) return 'BALL PLACED';
        if (this.state === MusketState.POWDER) return 'POWDER POURED';
        if (this.state === MusketState.EMPTY) return 'EMPTY - RELOAD NEEDED';
        if (this.currentReloadStep) return this.currentReloadStep.name;
        return 'UNKNOWN';
    }
    
    // Attempt to fire
    fire(ballistics, scene) {
        if (this.state !== MusketState.READY) {
            return { fired: false, reason: 'Not ready to fire - reload needed' };
        }
        
        // Flash in the pan animation
        this.createPanFlash();
        
        // Fire the ball
        const barrelTip = new THREE.Vector3(0, 0.02, -0.6);
        barrelTip.applyMatrix4(this.mesh.matrixWorld);
        
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        direction.normalize();
        
        // Add slight delay before ball exits (simulating ignition delay)
        const projectile = ballistics.fire(barrelTip, direction, this.isPlayer2 ? 2 : 1);
        
        // Kickback animation
        this.kickback = this.maxKickback;
        
        // Muzzle flash
        this.createMuzzleFlash();
        
        // Smoke
        this.createSmoke();
        
        // Set state to empty
        this.state = MusketState.EMPTY;
        
        // Cock hammer back to fired position
        this.hammer.rotation.z = -0.5;
        
        return { fired: true };
    }
    
    // Advance reload by one step
    reloadStep() {
        if (this.state === MusketState.READY) return false;
        
        const stepInfo = ReloadStep[this.state];
        if (!stepInfo) return false;
        
        // Start the reload step
        this.currentReloadStep = stepInfo;
        this.reloadTimer = 0;
        this.reloadProgress = 0;
        
        return true;
    }
    
    // Complete current reload step (called when timer finishes)
    completeReloadStep() {
        if (!this.currentReloadStep) return;
        
        const oldState = this.state;
        this.state = this.currentReloadStep.next;
        this.currentReloadStep = null;
        this.reloadProgress = 0;
        this.reloadTimer = 0;
        
        // Update visual state based on reload progress
        this.updateVisualState();
    }
    
    // Update musket position, animations, and reload progress
    update(deltaTime, ballistics) {
        // Handle kickback recovery
        if (this.kickback > 0) {
            this.kickback = Math.max(0, this.kickback - deltaTime * 2);
            const kickZ = -this.kickback * 0.2;
            this.mesh.position.z = this.offset.z + kickZ;
        } else {
            this.mesh.position.z = this.offset.z;
        }
        
        // Handle reload timer
        if (this.currentReloadStep) {
            this.reloadTimer += deltaTime;
            this.reloadProgress = this.reloadTimer / this.currentReloadStep.duration;
            
            if (this.reloadTimer >= this.currentReloadStep.duration) {
                this.completeReloadStep();
            }
        }
        
        // Update smoke particles
        this.updateSmoke(deltaTime);
    }
    
    updateVisualState() {
        // Update hammer position based on state
        switch (this.state) {
            case MusketState.READY:
                this.hammer.rotation.z = 0; // Full cock
                break;
            case MusketState.HALF_COCK:
                this.hammer.rotation.z = -0.3; // Half cock
                break;
            case MusketState.PRIMED:
            case MusketState.RAMMED:
            case MusketState.PATCHED_BALL:
            case MusketState.POWDER:
            case MusketState.EMPTY:
                this.hammer.rotation.z = -0.6; // Rest position
                break;
        }
        
        // Frizzen position
        if (this.state === MusketState.PRIMED || this.state === MusketState.READY || this.state === MusketState.HALF_COCK) {
            this.frizzen.rotation.x = -0.3; // Closed
        } else {
            this.frizzen.rotation.x = -1.2; // Open
        }
    }
    
    createMuzzleFlash() {
        // Create muzzle flash at barrel tip
        const flashGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.9
        });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        
        flash.position.set(0.04, 0.02, -0.62);
        this.mesh.add(flash);
        
        // Animate and remove
        let life = 0.1;
        const animate = () => {
            life -= 0.016;
            if (life <= 0) {
                this.mesh.remove(flash);
                return;
            }
            flash.scale.multiplyScalar(0.9);
            flash.material.opacity = life * 9;
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    createPanFlash() {
        // Small flash in the flash pan
        const panFlash = new THREE.PointLight(0xffaa00, 2, 0.3);
        panFlash.position.set(-0.01, 0.05, -0.135);
        this.mesh.add(panFlash);
        
        let life = 0.05;
        const animate = () => {
            life -= 0.016;
            if (life <= 0) {
                this.mesh.remove(panFlash);
                return;
            }
            panFlash.intensity = life * 40;
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    createSmoke() {
        // Create smoke particles at muzzle
        for (let i = 0; i < 8; i++) {
            const smoke = this.createSmokeParticle();
            this.smokeParticles.push(smoke);
            this.mesh.add(smoke);
        }
        
        // Smoke from pan too
        for (let i = 0; i < 3; i++) {
            const panSmoke = this.createSmokeParticle();
            panSmoke.position.set(-0.01 + (Math.random() - 0.5) * 0.02, 0.04, -0.135);
            panSmoke.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                1 + Math.random() * 0.5,
                (Math.random() - 0.5) * 0.5
            );
            this.smokeParticles.push(panSmoke);
            this.mesh.add(panSmoke);
        }
    }
    
    createSmokeParticle() {
        const geo = new THREE.SphereGeometry(0.02 + Math.random() * 0.02, 6, 6);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.6
        });
        const mesh = new THREE.Mesh(geo, mat);
        
        // Position at muzzle with spread
        mesh.position.set(
            0.04 + (Math.random() - 0.5) * 0.03,
            0.02 + (Math.random() - 0.5) * 0.03,
            -0.62 - Math.random() * 0.05
        );
        
        // Velocity away from barrel
        mesh.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 1,
                1 + Math.random(),
                -1 - Math.random()
            ),
            life: 2 + Math.random() * 2
        };
        
        return mesh;
    }
    
    updateSmoke(deltaTime) {
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.userData.life -= deltaTime;
            
            if (p.userData.life <= 0) {
                this.mesh.remove(p);
                this.smokeParticles.splice(i, 1);
                continue;
            }
            
            // Move smoke
            p.position.add(p.userData.velocity.clone().multiplyScalar(deltaTime));
            p.userData.velocity.x += (Math.random() - 0.5) * deltaTime;
            p.userData.velocity.z += (Math.random() - 0.5) * deltaTime;
            
            // Expand and fade
            p.scale.multiplyScalar(1 + deltaTime * 0.5);
            p.material.opacity = Math.min(1, p.userData.life * 0.3) * 0.6;
        }
    }
    
    // Check if can fire
    canFire() {
        return this.state === MusketState.READY;
    }
    
    // Get reload progress for UI (0-1)
    getReloadProgress() {
        if (!this.currentReloadStep) return this.state === MusketState.READY ? 1 : 0;
        return this.reloadProgress;
    }
    
    reset() {
        this.state = MusketState.READY;
        this.currentReloadStep = null;
        this.reloadTimer = 0;
        this.reloadProgress = 0;
        this.updateVisualState();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Musket, MusketState };
}