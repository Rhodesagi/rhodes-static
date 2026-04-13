// Player.js - Player controller with camera, musket, and state
class Player {
    constructor(scene, index, inputManager, ballistics, smokeSystem) {
        this.scene = scene;
        this.index = index;
        this.input = inputManager;
        this.ballistics = ballistics;
        this.smokeSystem = smokeSystem;
        
        // Player identity
        this.playerId = index === 0 ? 'player1' : 'player2';
        
        // Position and rotation
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.velocity = new THREE.Vector3();
        
        // Camera
        const initialAspect = window.innerWidth / (window.innerHeight / 2) || 1;
        this.camera = new THREE.PerspectiveCamera(75, initialAspect, 0.1, 100);
        this.camera.rotation.order = 'YXZ';
        
        // Movement limits
        this.moveSpeed = 2.0;
        this.turnSpeed = 1.0;
        
        // State
        this.alive = true;
        this.health = 100;
        
        // Create musket
        this.musket = new Musket(scene, index === 1);
        
        // Iron sights
        this.ironSights = new IronSights();
        this.camera.add(this.ironSights.getMesh());
        
        // Attach musket to camera (first person view)
        this.musket.getMesh().position.set(0.15, -0.2, -0.5);
        this.musket.getMesh().rotation.y = -0.1;
        this.camera.add(this.musket.getMesh());
        
        // Recoil state
        this.recoil = 0;
        this.swayTime = 0;
        
        // Pan flash light
        this.panLight = new THREE.PointLight(0xffaa00, 0, 3);
        this.panLight.position.set(0.1, -0.1, -0.2);
        this.camera.add(this.panLight);
        
        // Muzzle flash
        this.muzzleLight = new THREE.PointLight(0xffddaa, 0, 5);
        this.muzzleLight.position.set(0, -0.08, -0.8);
        this.camera.add(this.muzzleLight);
        
        // Aiming state
        this.aimStability = 0;
        
        // Create opponent model (visible to other player)
        this.createOpponentModel();
        
        this.resetPosition();
    }
    
    resetPosition() {
        // Set starting positions based on index
        if (this.index === 0) {
            this.position.set(0, 1.6, -7.5);
            this.rotation.set(0, Math.PI, 0); // Face toward +Z to see Player 2
        } else {
            this.position.set(0, 1.6, 7.5);
            this.rotation.set(0, 0, 0); // Face toward -Z to see Player 1
        }
        
        this.camera.position.copy(this.position);
        this.camera.rotation.x = this.rotation.x;
        this.camera.rotation.y = this.rotation.y;
        this.camera.rotation.z = this.rotation.z;
        
        this.alive = true;
        this.health = 100;
        this.musket.fullReset();
    }
    
    update(deltaTime) {
        if (!this.alive) return;
        
        this.swayTime += deltaTime;
        
        // Handle input
        this.handleMovement(deltaTime);
        this.handleAiming(deltaTime);
        this.handleActions();
        
        // Update musket visuals
        this.musket.update(this.swayTime, deltaTime);
        
        // Update iron sights
        const hammerState = this.musket.state <= 1 ? 0 : 
                           this.musket.state <= 5 ? 1 : 2;
        this.ironSights.update(true, hammerState);
        
        // Apply breathing sway to camera
        const swayX = Math.sin(this.swayTime * 0.8) * 0.001;
        const swayY = Math.cos(this.swayTime * 0.6) * 0.0015;
        
        // Apply recoil recovery
        if (this.recoil > 0) {
            this.recoil = Math.max(0, this.recoil - deltaTime * 3);
            this.camera.rotation.x += this.recoil * 0.5;
        }
        
        // Apply to camera position
        this.camera.position.x = this.position.x + swayX;
        this.camera.position.z = this.position.z + swayY * 0.5;
        this.camera.position.y = this.position.y + swayY;
        
        // Keep camera rotation updated
        this.camera.rotation.x = THREE.MathUtils.clamp(
            this.camera.rotation.x, -Math.PI / 2, Math.PI / 2
        );
        
        // Update flash lights
        if (this.panLight.intensity > 0) {
            this.panLight.intensity -= deltaTime * 10;
        }
        if (this.muzzleLight.intensity > 0) {
            this.muzzleLight.intensity -= deltaTime * 15;
        }
        
        // Update musket position based on state (breathing animation)
        this.musket.getMesh().position.y = -0.2 + Math.sin(this.swayTime * 0.7) * 0.005;
        
        // Update opponent model position
        this.updateOpponentModel();
    }
    
    handleMovement(deltaTime) {
        const move = this.input.getMovement(this.playerId);
        
        if (move.forward !== 0 || move.right !== 0) {
            // Calculate movement relative to camera direction
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(this.camera.quaternion);
            forward.y = 0;
            forward.normalize();
            
            const right = new THREE.Vector3(1, 0, 0);
            right.applyQuaternion(this.camera.quaternion);
            right.y = 0;
            right.normalize();
            
            const moveDir = new THREE.Vector3()
                .addScaledVector(forward, move.forward)
                .addScaledVector(right, move.right);
            
            if (moveDir.length() > 0) {
                moveDir.normalize();
                this.position.addScaledVector(moveDir, this.moveSpeed * deltaTime);
            }
        }
        
        // Constrain to arena
        this.position.x = THREE.MathUtils.clamp(this.position.x, -20, 20);
        this.position.z = THREE.MathUtils.clamp(this.position.z, -15, 15);
        this.position.y = 1.6; // Keep on ground
    }
    
    handleAiming(deltaTime) {
        const aim = this.input.getAimDelta(this.playerId);
        
        // Alternative controls for Player 2
        if (this.index === 1) {
            const altAim = this.input.getP2AltControls();
            aim.x += altAim.x;
            aim.y += altAim.y;
        }
        
        // Apply rotation
        this.camera.rotation.y -= aim.x;
        this.camera.rotation.x -= aim.y;
        
        // Clamp vertical look
        this.camera.rotation.x = THREE.MathUtils.clamp(
            this.camera.rotation.x, -Math.PI / 2, Math.PI / 2
        );
        
        // Update rotation tracking
        this.rotation.copy(this.camera.rotation);
    }
    
    handleActions() {
        // Reload - advance state machine
        if (this.input.isJustPressed(this.playerId, 'reload')) {
            this.musket.advanceReload();
        }
        
        // Fire
        if (this.input.isJustPressed(this.playerId, 'fire')) {
            this.fire();
        }
    }
    
    fire() {
        const result = this.musket.fire();
        
        if (result.fired) {
            // Flash effects
            this.panLight.intensity = 5;
            this.muzzleLight.intensity = 8;
            
            // Recoil
            this.recoil = 0.3;
            
            // Smoke
            const muzzleWorldPos = new THREE.Vector3(0, -0.08, -0.8);
            muzzleWorldPos.applyMatrix4(this.camera.matrixWorld);
            
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.camera.quaternion);
            
            this.smokeSystem.emitFromMuzzle(muzzleWorldPos, direction, 20);
            
            // Pan smoke
            const panPos = new THREE.Vector3(0.1, -0.12, -0.2);
            panPos.applyMatrix4(this.camera.matrixWorld);
            this.smokeSystem.emitFromPan(panPos, 5);
            
            // Fire ballistics
            this.ballistics.fire(muzzleWorldPos, direction, this.index);
        }
    }
    
    hit(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.alive = false;
        }
    }
    
    getCamera() {
        return this.camera;
    }
    
    getStateName() {
        return this.musket.getStateName();
    }
    
    get isReady() {
        return this.musket.canFire();
    }
    
    createOpponentModel() {
        // Simple soldier model visible to the opponent
        this.opponentGroup = new THREE.Group();
        
        // Material - 18th century military uniform colors
        const uniformMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B0000, // Dark red coat
            roughness: 0.7
        });
        
        const pantsMaterial = new THREE.MeshStandardMaterial({
            color: 0xDDDDDD, // White/light breeches
            roughness: 0.6
        });
        
        const skinMaterial = new THREE.MeshStandardMaterial({
            color: 0xE8C39E,
            roughness: 0.5
        });
        
        const hatMaterial = new THREE.MeshStandardMaterial({
            color: 0x2F2F2F, // Dark tricorn
            roughness: 0.8
        });
        
        // Body
        const bodyGeo = new THREE.BoxGeometry(0.35, 0.6, 0.2);
        const body = new THREE.Mesh(bodyGeo, uniformMaterial);
        body.position.y = 0.9;
        body.castShadow = true;
        this.opponentGroup.add(body);
        
        // Head
        const headGeo = new THREE.BoxGeometry(0.18, 0.22, 0.18);
        const head = new THREE.Mesh(headGeo, skinMaterial);
        head.position.y = 1.35;
        head.castShadow = true;
        this.opponentGroup.add(head);
        
        // Tricorn hat
        const hatBrimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 8);
        const hatBrim = new THREE.Mesh(hatBrimGeo, hatMaterial);
        hatBrim.position.y = 1.48;
        hatBrim.scale.z = 0.6;
        hatBrim.castShadow = true;
        this.opponentGroup.add(hatBrim);
        
        const hatCrownGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.12, 8);
        const hatCrown = new THREE.Mesh(hatCrownGeo, hatMaterial);
        hatCrown.position.y = 1.52;
        hatCrown.castShadow = true;
        this.opponentGroup.add(hatCrown);
        
        // Legs/pants
        const legGeo = new THREE.BoxGeometry(0.12, 0.7, 0.12);
        
        const leftLeg = new THREE.Mesh(legGeo, pantsMaterial);
        leftLeg.position.set(-0.1, 0.35, 0);
        leftLeg.castShadow = true;
        this.opponentGroup.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeo, pantsMaterial);
        rightLeg.position.set(0.1, 0.35, 0);
        rightLeg.castShadow = true;
        this.opponentGroup.add(rightLeg);
        
        // Musket (simplified)
        const musketStockGeo = new THREE.BoxGeometry(0.06, 0.08, 0.7);
        const musketStock = new THREE.Mesh(musketStockGeo, new THREE.MeshStandardMaterial({color: 0x4a3a2a}));
        musketStock.position.set(0.15, 0.9, 0.3);
        musketStock.rotation.x = -0.2;
        this.opponentGroup.add(musketStock);
        
        const musketBarrelGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.6, 8);
        const musketBarrel = new THREE.Mesh(musketBarrelGeo, new THREE.MeshStandardMaterial({color: 0x2a2a2a, metalness: 0.6}));
        musketBarrel.rotation.x = Math.PI / 2 - 0.2;
        musketBarrel.position.set(0.15, 1.05, 0.5);
        this.opponentGroup.add(musketBarrel);
        
        // Add to scene
        this.scene.add(this.opponentGroup);
    }
    
    updateOpponentModel() {
        // Update opponent model position to match this player
        if (this.opponentGroup && this.alive) {
            this.opponentGroup.position.copy(this.position);
            this.opponentGroup.rotation.y = this.rotation.y;
            this.opponentGroup.visible = true;
        } else if (this.opponentGroup) {
            this.opponentGroup.visible = false;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}
