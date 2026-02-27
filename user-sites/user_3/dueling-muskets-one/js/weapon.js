import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';

// Flintlock musket mechanics - authentic 7-step loading drill
// Brown Bess / Charleville pattern - .69-.75 caliber, 300-400 m/s muzzle velocity

export const WeaponState = {
    IDLE: 'IDLE',
    HALF_COCK: 'HALF_COCK',
    PRIME: 'PRIME',
    SHUT: 'SHUT',
    CAST_ABOUT: 'CAST_ABOUT',
    RAM: 'RAM',
    FULL_COCK: 'FULL_COCK',
    READY: 'READY',
    AIMING: 'AIMING',
    FIRING: 'FIRING'
};

export class FlintlockMusket {
    constructor(scene, color) {
        this.scene = scene;
        this.state = WeaponState.IDLE;
        this.stateTimer = 0;
        this.loaded = false;
        this.primed = false;
        this.hasBall = false;
        this.panPrimed = false;
        
        // Ballistics constants
        this.muzzleVelocity = 350; // m/s
        this.ballMass = 0.032; // kg (69 cal lead ball)
        this.ballDiameter = 0.0175; // m
        
        // Weapon geometry
        this.mesh = this.createMusketMesh(color);
        this.sights = this.createSights();
        this.hammer = this.createHammer();
        this.frizzen = this.createFrizzen();
        this.pan = this.createPan();
        
        this.mesh.add(this.sights);
        this.mesh.add(this.hammer);
        this.mesh.add(this.frizzen);
        this.mesh.add(this.pan);
        
        // Animation state
        this.swayAmount = 0;
        this.breathingPhase = 0;
        this.recoilPhase = 0;
        
        // Muzzle position for projectile spawn
        this.muzzleOffset = new THREE.Vector3(0, 0.05, 1.4);
    }
    
    createMusketMesh(color) {
        const group = new THREE.Group();
        
        // Stock (wood) - scaled up for visibility
        const stockGeo = new THREE.BoxGeometry(0.12, 0.18, 1.8);
        const stockMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const stock = new THREE.Mesh(stockGeo, stockMat);
        stock.position.z = -0.2;
        stock.castShadow = true;
        group.add(stock);
        
        // Barrel (iron) - scaled up for visibility
        const barrelGeo = new THREE.CylinderGeometry(0.04, 0.05, 2.0, 16);
        const barrelMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.y = 0.1;
        barrel.position.z = 0.5;
        barrel.castShadow = true;
        group.add(barrel);
        
        // Buttplate
        const buttGeo = new THREE.BoxGeometry(0.09, 0.14, 0.05);
        const buttMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const butt = new THREE.Mesh(buttGeo, buttMat);
        butt.position.z = -0.82;
        group.add(butt);
        
        // Trigger guard
        const guardGeo = new THREE.TorusGeometry(0.04, 0.005, 8, 16, Math.PI);
        const guardMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const guard = new THREE.Mesh(guardGeo, guardMat);
        guard.rotation.z = Math.PI / 2;
        guard.position.y = -0.02;
        guard.position.z = -0.05;
        group.add(guard);
        
        return group;
    }
    
    createSights() {
        const group = new THREE.Group();
        
        // Rear sight (notch)
        const rearGeo = new THREE.BoxGeometry(0.02, 0.015, 0.01);
        const rearMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const rear = new THREE.Mesh(rearGeo, rearMat);
        rear.position.set(0, 0.12, -0.3);
        group.add(rear);
        
        // Front sight (post)
        const frontGeo = new THREE.BoxGeometry(0.008, 0.025, 0.008);
        const frontMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const front = new THREE.Mesh(frontGeo, frontMat);
        front.position.set(0, 0.14, 1.1);
        group.add(front);
        
        return group;
    }
    
    createHammer() {
        const group = new THREE.Group();
        
        // Cock/hammer
        const hammerGeo = new THREE.BoxGeometry(0.03, 0.08, 0.02);
        const hammerMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const hammer = new THREE.Mesh(hammerGeo, hammerMat);
        hammer.position.set(0, 0.08, -0.35);
        
        // Jaws holding flint
        const jawGeo = new THREE.BoxGeometry(0.025, 0.03, 0.02);
        const jaw = new THREE.Mesh(jawGeo, hammerMat);
        jaw.position.set(0, 0.04, 0);
        hammer.add(jaw);
        
        group.add(hammer);
        this.hammerMesh = hammer;
        this.hammerPivot = group;
        
        return group;
    }
    
    createFrizzen() {
        const group = new THREE.Group();
        
        // Frizzen (steel cover that opens to expose pan)
        const frizzenGeo = new THREE.BoxGeometry(0.04, 0.06, 0.01);
        const frizzenMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const frizzen = new THREE.Mesh(frizzenGeo, frizzenMat);
        frizzen.position.set(0, 0.06, -0.25);
        frizzen.rotation.x = -0.3;
        
        group.add(frizzen);
        this.frizzenMesh = frizzen;
        
        return group;
    }
    
    createPan() {
        // Flash pan for priming powder
        const panGeo = new THREE.BoxGeometry(0.025, 0.005, 0.03);
        const panMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const pan = new THREE.Mesh(panGeo, panMat);
        pan.position.set(0, 0.08, -0.25);
        
        return pan;
    }
    
    // The 7-step authentic loading drill
    startReload() {
        if (this.state !== WeaponState.IDLE && this.state !== WeaponState.READY) {
            return false; // Cannot reload while in other states
        }
        if (this.loaded && this.primed) {
            return false; // Already loaded
        }
        
        this.state = WeaponState.HALF_COCK;
        this.stateTimer = 0;
        return true;
    }
    
    update(delta, aiming, moving) {
        this.stateTimer += delta;
        this.breathingPhase += delta * 1.5;
        
        // Handle reload sequence with authentic timing
        const STEP_TIME = 0.6; // seconds per step
        
        switch (this.state) {
            case WeaponState.HALF_COCK:
                // Pull hammer to half-cock (safety) position
                this.hammerMesh.rotation.x = THREE.MathUtils.lerp(this.hammerMesh.rotation.x, 0.3, delta * 5);
                if (this.stateTimer > STEP_TIME * 0.5) {
                    this.state = WeaponState.PRIME;
                    this.stateTimer = 0;
                }
                break;
                
            case WeaponState.PRIME:
                // Open frizzen, prime pan with fine powder
                this.frizzenMesh.rotation.x = THREE.MathUtils.lerp(this.frizzenMesh.rotation.x, -1.2, delta * 5);
                if (this.stateTimer > STEP_TIME * 0.3) {
                    this.panPrimed = true;
                }
                if (this.stateTimer > STEP_TIME) {
                    this.state = WeaponState.SHUT;
                    this.stateTimer = 0;
                }
                break;
                
            case WeaponState.SHUT:
                // Close frizzen
                this.frizzenMesh.rotation.x = THREE.MathUtils.lerp(this.frizzenMesh.rotation.x, -0.3, delta * 5);
                if (this.stateTimer > STEP_TIME * 0.5) {
                    this.state = WeaponState.CAST_ABOUT;
                    this.stateTimer = 0;
                }
                break;
                
            case WeaponState.CAST_ABOUT:
                // Rotate musket to vertical for loading
                // Visual: musket rotates up
                if (this.stateTimer > STEP_TIME * 0.5) {
                    this.state = WeaponState.RAM;
                    this.stateTimer = 0;
                }
                break;
                
            case WeaponState.RAM:
                // Pour powder, insert ball, ram home
                // This takes the longest - 3x normal step
                if (this.stateTimer > STEP_TIME * 3) {
                    this.loaded = true;
                    this.hasBall = true;
                    this.state = WeaponState.FULL_COCK;
                    this.stateTimer = 0;
                }
                break;
                
            case WeaponState.FULL_COCK:
                // Pull hammer to full-cock (firing) position
                this.hammerMesh.rotation.x = THREE.MathUtils.lerp(this.hammerMesh.rotation.x, 0, delta * 5);
                if (this.stateTimer > STEP_TIME * 0.5) {
                    this.primed = true;
                    this.state = WeaponState.READY;
                    this.stateTimer = 0;
                }
                break;
                
            case WeaponState.READY:
            case WeaponState.IDLE:
                // Default hammer position
                if (this.primed) {
                    this.hammerMesh.rotation.x = THREE.MathUtils.lerp(this.hammerMesh.rotation.x, 0, delta * 5);
                } else {
                    this.hammerMesh.rotation.x = THREE.MathUtils.lerp(this.hammerMesh.rotation.x, 0.6, delta * 5);
                }
                break;
                
            case WeaponState.FIRING:
                // Hammer falls
                this.hammerMesh.rotation.x = THREE.MathUtils.lerp(this.hammerMesh.rotation.x, 0.8, delta * 20);
                this.recoilPhase += delta * 10;
                if (this.stateTimer > 0.1) {
                    this.state = WeaponState.IDLE;
                    this.loaded = false;
                    this.primed = false;
                    this.panPrimed = false;
                    this.hasBall = false;
                    this.stateTimer = 0;
                    this.recoilPhase = 0;
                }
                break;
        }
        
        // Apply animations
        this.updateVisuals(delta, aiming, moving);
    }
    
    updateVisuals(delta, aiming, moving) {
        // Breathing sway
        const breatheY = Math.sin(this.breathingPhase) * 0.002;
        const breatheX = Math.cos(this.breathingPhase * 0.7) * 0.001;
        
        // Movement bob
        let bobY = 0;
        if (moving) {
            bobY = Math.sin(this.breathingPhase * 2) * 0.005;
        }
        
        // Recoil
        let recoilZ = 0;
        let recoilRot = 0;
        if (this.recoilPhase > 0) {
            const recoilCurve = Math.sin(this.recoilPhase) * Math.exp(-this.recoilPhase);
            recoilZ = -recoilCurve * 0.3;
            recoilRot = -recoilCurve * 0.2;
        }
        
        // Aim breathing (reduced when aiming)
        const aimFactor = aiming ? 0.3 : 1.0;
        
        this.mesh.position.y = 0.1 + breatheY * aimFactor + bobY + recoilZ;
        this.mesh.position.x = breatheX * aimFactor;
        this.mesh.rotation.z = recoilRot;
        
        // Cast about animation during reload
        if (this.state === WeaponState.CAST_ABOUT || this.state === WeaponState.RAM) {
            const castProgress = Math.min(1, this.stateTimer / 0.3);
            const castAngle = Math.sin(castProgress * Math.PI) * (-Math.PI / 3);
            this.mesh.rotation.x = castAngle;
        } else {
            this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0, delta * 5);
        }
    }
    
    canFire() {
        return this.state === WeaponState.READY && this.loaded && this.primed;
    }
    
    fire() {
        if (!this.canFire()) {
            return null;
        }
        
        this.state = WeaponState.FIRING;
        this.stateTimer = 0;
        
        // Return projectile data
        const muzzlePos = this.muzzleOffset.clone();
        muzzlePos.applyMatrix4(this.mesh.matrixWorld);
        
        return {
            position: muzzlePos,
            velocity: this.muzzleVelocity,
            mass: this.ballMass,
            diameter: this.ballDiameter
        };
    }
    
    getReloadProgress() {
        const states = [
            WeaponState.HALF_COCK,
            WeaponState.PRIME,
            WeaponState.SHUT,
            WeaponState.CAST_ABOUT,
            WeaponState.RAM,
            WeaponState.FULL_COCK
        ];
        
        if (!states.includes(this.state)) {
            return this.state === WeaponState.READY ? 1 : 0;
        }
        
        const stepIndex = states.indexOf(this.state);
        return stepIndex / states.length;
    }
}

export class Projectile {
    constructor(position, direction, velocity, mass) {
        this.position = position.clone();
        this.velocity = direction.clone().multiplyScalar(velocity);
        this.mass = mass;
        this.gravity = 9.81;
        this.active = true;
        this.distance = 0;
        
        // Visual
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.008, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x222222 })
        );
        this.mesh.position.copy(this.position);
    }
    
    update(delta) {
        if (!this.active) return;
        
        // Apply gravity
        this.velocity.y -= this.gravity * delta;
        
        // Move
        const move = this.velocity.clone().multiplyScalar(delta);
        this.position.add(move);
        this.distance += move.length();
        
        this.mesh.position.copy(this.position);
        
        // Deactivate after 5 seconds or if too far
        if (this.distance > 500 || this.position.y < -10) {
            this.active = false;
        }
    }
}
