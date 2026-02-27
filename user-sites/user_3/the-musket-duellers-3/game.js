/**
 * The Musket Duellers - A 2-Player Flintlock Duel FPS
 * Authentic iron sights, full reload animation states, ballistic projectiles
 */

// Game State
const GameState = {
    MENU: 0,
    PLAYING: 1,
    GAME_OVER: 2
};

const ReloadStage = {
    READY: 0,
    HALF_COCK: 1,
    PRIME_PAN: 2,
    CLOSE_FRIZZEN: 3,
    CHARGE_BARREL: 4,
    SEAT_BALL: 5,
    DRAW_RAMROD: 6,
    RAM_CHARGE: 7,
    RETURN_ROD: 8,
    FULL_COCK: 9,
    FIRED: 10
};

const STAGE_NAMES = [
    "Ready to fire",
    "Half-cock hammer",
    "Prime the pan",
    "Close frizzen",
    "Charge barrel",
    "Seat ball & patch",
    "Draw ramrod",
    "Ram charge home",
    "Return ramrod",
    "Full-cock",
    "Fired - reload needed"
];

// Configuration
const CONFIG = {
    MOVE_SPEED: 0.08,
    MOUSE_SENSITIVITY: 0.002,
    KEYBOARD_AIM_SPEED: 0.03,
    MUZZLE_VELOCITY: 120, // m/s
    GRAVITY: 9.8,
    DAMAGE: 100,
    MAX_HEALTH: 100
};

// Input State
const Input = {
    p1: { w: false, a: false, s: false, d: false, fire: false, cock: false },
    p2: { up: false, left: false, down: false, right: false, fire: false, cock: false },
    p1Mouse: { x: 0, y: 0, locked: false },
    p2Aim: { x: 0, y: 0 } // Keyboard aim offset
};

class MusketWeapon {
    constructor(scene, isPlayer2 = false) {
        this.scene = scene;
        this.isPlayer2 = isPlayer2;
        this.group = new THREE.Group();
        this.reloadStage = ReloadStage.READY;
        this.animationProgress = 0;
        this.isAnimating = false;
        this.hasRound = true;
        
        this.createMusketGeometry();
        scene.add(this.group);
        
        // Animation state
        this.hammerRotation = 0;
        this.frizzenOpen = false;
        this.ramrodExtended = false;
        this.panPrimed = false;
    }
    
    createMusketGeometry() {
        // Materials
        const woodMat = new THREE.MeshPhongMaterial({ color: 0x4a3728 });
        const steelMat = new THREE.MeshPhongMaterial({ color: 0x5a5a5a, metalness: 0.8 });
        const brassMat = new THREE.MeshPhongMaterial({ color: 0xb5a642, metalness: 0.6 });
        
        // Stock (main body)
        const stockGeo = new THREE.BoxGeometry(0.08, 0.12, 0.7);
        const stock = new THREE.Mesh(stockGeo, woodMat);
        stock.position.set(0, -0.15, 0.1);
        this.group.add(stock);
        
        // Buttplate
        const buttGeo = new THREE.BoxGeometry(0.09, 0.14, 0.02);
        const butt = new THREE.Mesh(buttGeo, steelMat);
        butt.position.set(0, -0.15, 0.46);
        this.group.add(butt);
        
        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.025, 0.022, 0.9, 16);
        const barrel = new THREE.Mesh(barrelGeo, steelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, -0.08, -0.35);
        this.group.add(barrel);
        
        // Barrel bands
        for (let i = 0; i < 3; i++) {
            const bandGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.02, 16);
            const band = new THREE.Mesh(bandGeo, brassMat);
            band.rotation.x = Math.PI / 2;
            band.position.set(0, -0.08, -0.1 - (i * 0.25));
            this.group.add(band);
        }
        
        // Front sight (blade sight at muzzle)
        const frontSightGeo = new THREE.BoxGeometry(0.008, 0.04, 0.015);
        const frontSight = new THREE.Mesh(frontSightGeo, steelMat);
        frontSight.position.set(0, 0.02, -0.82);
        this.group.add(frontSight);
        
        // Rear sight (notch sight on tang)
        const rearSightBase = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.015, 0.04),
            steelMat
        );
        rearSightBase.position.set(0, -0.01, 0.05);
        this.group.add(rearSightBase);
        
        // Rear sight notch
        const rearNotch = new THREE.Mesh(
            new THREE.BoxGeometry(0.015, 0.02, 0.02),
            steelMat
        );
        rearNotch.position.set(0, 0.005, 0.05);
        this.group.add(rearNotch);
        
        // Lock mechanism (frizzen and hammer)
        this.lockGroup = new THREE.Group();
        this.lockGroup.position.set(0.05, -0.08, 0);
        this.group.add(this.lockGroup);
        
        // Frizzen (steel cover)
        this.frizzen = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.06, 0.04),
            steelMat
        );
        this.frizzen.position.set(0, 0.03, 0);
        this.frizzenPivot = new THREE.Group();
        this.frizzenPivot.position.set(0, 0, 0.02);
        this.frizzenPivot.add(this.frizzen);
        this.lockGroup.add(this.frizzenPivot);
        
        // Pan (where powder sits)
        const pan = new THREE.Mesh(
            new THREE.BoxGeometry(0.025, 0.008, 0.025),
            brassMat
        );
        pan.position.set(0, 0, 0);
        this.lockGroup.add(pan);
        
        // Hammer (cock)
        this.hammerPivot = new THREE.Group();
        this.hammerPivot.position.set(-0.02, 0, -0.02);
        this.lockGroup.add(this.hammerPivot);
        
        const hammerHead = new THREE.Mesh(
            new THREE.BoxGeometry(0.025, 0.08, 0.04),
            steelMat
        );
        hammerHead.position.set(0.015, 0.04, 0.02);
        this.hammerPivot.add(hammerHead);
        
        // Hammer jaw
        const hammerJaw = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.03, 0.02),
            steelMat
        );
        hammerJaw.position.set(0.015, 0.075, 0.035);
        this.hammerPivot.add(hammerJaw);
        
        // Flint (held in jaw)
        const flint = new THREE.Mesh(
            new THREE.BoxGeometry(0.015, 0.02, 0.025),
            new THREE.MeshPhongMaterial({ color: 0x2a2a2a })
        );
        flint.position.set(0.015, 0.07, 0.045);
        this.hammerPivot.add(flint);
        
        // Trigger guard
        const triggerGuard = new THREE.Mesh(
            new THREE.TorusGeometry(0.04, 0.004, 8, 16, Math.PI),
            brassMat
        );
        triggerGuard.rotation.z = Math.PI;
        triggerGuard.position.set(0, -0.22, -0.05);
        this.group.add(triggerGuard);
        
        // Trigger
        this.trigger = new THREE.Mesh(
            new THREE.BoxGeometry(0.008, 0.04, 0.008),
            steelMat
        );
        this.trigger.position.set(0, -0.18, -0.05);
        this.trigger.rotation.x = -0.3;
        this.group.add(this.trigger);
        
        // Ramrod
        this.ramrodGroup = new THREE.Group();
        const ramrod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.006, 0.006, 0.8, 8),
            steelMat
        );
        ramrod.rotation.x = Math.PI / 2;
        this.ramrodGroup.add(ramrod);
        this.ramrodGroup.position.set(0, -0.18, 0);
        this.group.add(this.ramrodGroup);
        
        // Ramrod thimbles
        for (let i = 0; i < 3; i++) {
            const thimble = new THREE.Mesh(
                new THREE.CylinderGeometry(0.012, 0.012, 0.015, 8),
                steelMat
            );
            thimble.rotation.x = Math.PI / 2;
            thimble.position.set(0, -0.18, -0.05 - (i * 0.25));
            this.group.add(thimble);
        }
        
        // Initial position (aiming stance)
        this.group.position.set(0.12, -0.2, -0.3);
        this.group.rotation.y = -0.05;
    }
    
    update(dt) {
        // Smooth animation of components
        const targetHammerRot = this.reloadStage >= ReloadStage.FULL_COCK ? -0.8 : 
                                this.reloadStage >= ReloadStage.HALF_COCK ? -0.4 : 0;
        this.hammerRotation += (targetHammerRot - this.hammerRotation) * dt * 8;
        this.hammerPivot.rotation.x = this.hammerRotation;
        
        // Frizzen animation
        const targetFrizzenRot = (this.reloadStage === ReloadStage.PRIME_PAN || 
                                  this.reloadStage === ReloadStage.CLOSE_FRIZZEN) ? 0.6 : 0;
        this.frizzenPivot.rotation.x += (targetFrizzenRot - this.frizzenPivot.rotation.x) * dt * 10;
        
        // Ramrod animation
        const targetRamrodZ = this.reloadStage === ReloadStage.RAM_CHARGE ? -0.6 :
                              this.reloadStage === ReloadStage.DRAW_RAMROD ? -0.3 :
                              this.reloadStage === ReloadStage.RETURN_ROD ? -0.1 : 0;
        this.ramrodGroup.position.z += (targetRamrodZ - this.ramrodGroup.position.z) * dt * 5;
        
        // Slight sway when walking
        const time = Date.now() * 0.001;
        this.group.position.y = -0.2 + Math.sin(time * 2) * 0.005;
        this.group.rotation.z = Math.sin(time * 1.5) * 0.01;
    }
    
    advanceReload() {
        if (this.reloadStage === ReloadStage.READY) {
            // Fire!
            return 'FIRE';
        } else if (this.reloadStage < ReloadStage.FIRED) {
            this.reloadStage++;
            return STAGE_NAMES[this.reloadStage];
        }
        return null;
    }
    
    cockHammer() {
        if (this.reloadStage === ReloadStage.READY) {
            this.reloadStage = ReloadStage.HALF_COCK;
            return STAGE_NAMES[ReloadStage.HALF_COCK];
        } else if (this.reloadStage === ReloadStage.RETURN_ROD) {
            this.reloadStage = ReloadStage.FULL_COCK;
            return STAGE_NAMES[ReloadStage.FULL_COCK];
        }
        return null;
    }
    
    fire() {
        this.reloadStage = ReloadStage.FIRED;
        this.hasRound = false;
        // Visual recoil
        this.group.position.z += 0.05;
        this.group.rotation.x += 0.15;
        setTimeout(() => {
            this.group.position.z -= 0.05;
            this.group.rotation.x -= 0.15;
        }, 100);
    }
    
    reset() {
        this.reloadStage = ReloadStage.READY;
        this.hasRound = true;
    }
    
    getMuzzlePosition() {
        const pos = new THREE.Vector3(0, 0, -0.8);
        pos.applyMatrix4(this.group.matrixWorld);
        return pos;
    }
    
    getAimDirection() {
        const direction = new THREE.Vector3(0, 0.02, -1); // Slight elevation for sight alignment
        direction.applyQuaternion(this.group.getWorldQuaternion(new THREE.Quaternion()));
        return direction.normalize();
    }
}

class Projectile {
    constructor(startPos, direction, velocity) {
        this.position = startPos.clone();
        this.velocity = direction.clone().multiplyScalar(velocity);
        this.gravity = new THREE.Vector3(0, -CONFIG.GRAVITY, 0);
        this.active = true;
        this.trail = [];
        
        // Create visual
        const geometry = new THREE.SphereGeometry(0.008, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x222222 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
    }
    
    update(dt, scene) {
        if (!this.active) return;
        
        // Store trail
        this.trail.push(this.position.clone());
        if (this.trail.length > 10) this.trail.shift();
        
        // Apply gravity
        this.velocity.add(this.gravity.clone().multiplyScalar(dt));
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(dt));
        this.mesh.position.copy(this.position);
        
        // Check ground collision
        if (this.position.y < 0) {
            this.active = false;
            scene.remove(this.mesh);
        }
    }
}

class Player {
    constructor(id, scene, camera, isPlayer2 = false) {
        this.id = id;
        this.scene = scene;
        this.camera = camera;
        this.isPlayer2 = isPlayer2;
        this.health = CONFIG.MAX_HEALTH;
        this.musket = new MusketWeapon(scene, isPlayer2);
        this.projectiles = [];
        
        // Position and rotation
        this.position = isPlayer2 ? new THREE.Vector3(10, 1.6, 0) : new THREE.Vector3(-10, 1.6, 0);
        this.rotation = isPlayer2 ? new THREE.Euler(0, -Math.PI / 2, 0) : new THREE.Euler(0, Math.PI / 2, 0);
        
        // Movement
        this.velocity = new THREE.Vector3();
        
        // Create player body (for opponent to see)
        this.createBody();
        
        this.updateCamera();
    }
    
    createBody() {
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8);
        const bodyMat = new THREE.MeshPhongMaterial({ 
            color: this.isPlayer2 ? 0x1a3a5c : 0x5c1a1a 
        });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = 0.9;
        this.scene.add(this.bodyMesh);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const headMat = new THREE.MeshPhongMaterial({ color: 0xdda0a0 });
        this.headMesh = new THREE.Mesh(headGeo, headMat);
        this.headMesh.position.y = 1.95;
        this.scene.add(this.headMesh);
        
        // Tricorne hat
        const hatGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 3);
        const hatMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
        this.hatMesh = new THREE.Mesh(hatGeo, hatMat);
        this.hatMesh.position.y = 2.2;
        this.hatMesh.rotation.y = Math.PI / 6;
        this.scene.add(this.hatMesh);
    }
    
    update(dt, input, opponent) {
        // Movement
        const forward = new THREE.Vector3(0, 0, -1).applyEuler(this.rotation);
        const right = new THREE.Vector3(1, 0, 0).applyEuler(this.rotation);
        
        this.velocity.set(0, 0, 0);
        
        if (this.isPlayer2) {
            if (input.up) this.velocity.add(forward.multiplyScalar(CONFIG.MOVE_SPEED));
            if (input.down) this.velocity.add(forward.multiplyScalar(-CONFIG.MOVE_SPEED));
            if (input.left) this.velocity.add(right.multiplyScalar(-CONFIG.MOVE_SPEED));
            if (input.right) this.velocity.add(right.multiplyScalar(CONFIG.MOVE_SPEED));
            
            // Keyboard aim
            if (input.aimUp) this.rotation.x += CONFIG.KEYBOARD_AIM_SPEED;
            if (input.aimDown) this.rotation.x -= CONFIG.KEYBOARD_AIM_SPEED;
            if (input.aimLeft) this.rotation.y += CONFIG.KEYBOARD_AIM_SPEED;
            if (input.aimRight) this.rotation.y -= CONFIG.KEYBOARD_AIM_SPEED;
        } else {
            if (input.w) this.velocity.add(forward.multiplyScalar(CONFIG.MOVE_SPEED));
            if (input.s) this.velocity.add(forward.multiplyScalar(-CONFIG.MOVE_SPEED));
            if (input.a) this.velocity.add(right.multiplyScalar(-CONFIG.MOVE_SPEED));
            if (input.d) this.velocity.add(right.multiplyScalar(CONFIG.MOVE_SPEED));
        }
        
        this.position.add(this.velocity);
        
        // Boundary limits
        this.position.x = Math.max(-25, Math.min(25, this.position.x));
        this.position.z = Math.max(-15, Math.min(15, this.position.z));
        
        // Update body mesh position
        this.bodyMesh.position.x = this.position.x;
        this.bodyMesh.position.z = this.position.z;
        this.headMesh.position.x = this.position.x;
        this.headMesh.position.z = this.position.z;
        this.hatMesh.position.x = this.position.x;
        this.hatMesh.position.z = this.position.z;
        this.bodyMesh.rotation.y = this.rotation.y;
        this.headMesh.rotation.y = this.rotation.y;
        this.hatMesh.rotation.y = this.rotation.y + Math.PI / 6;
        
        // Update camera
        this.updateCamera();
        
        // Update musket position relative to camera
        this.musket.group.position.copy(this.position);
        this.musket.group.position.add(new THREE.Vector3(0.15, -0.2, -0.3).applyEuler(this.rotation));
        this.musket.group.rotation.copy(this.rotation);
        this.musket.group.rotateY(-0.05); // Slight offset for natural hold
        this.musket.update(dt);
        
        // Handle firing
        if (input.firePressed) {
            const result = this.musket.advanceReload();
            if (result === 'FIRE' && this.musket.hasRound) {
                this.fire();
            }
            input.firePressed = false;
        }
        
        // Handle cocking
        if (input.cockPressed) {
            this.musket.cockHammer();
            input.cockPressed = false;
        }
        
        // Update projectiles
        this.projectiles.forEach((p, i) => {
            p.update(dt, this.scene);
            
            // Check collision with opponent
            if (p.active && opponent) {
                const dist = p.position.distanceTo(opponent.position);
                if (dist < 0.5 && p.position.y > 0.5 && p.position.y < 2.2) {
                    // Hit!
                    p.active = false;
                    this.scene.remove(p.mesh);
                    opponent.takeDamage(CONFIG.DAMAGE);
                    this.showHitEffect(opponent.position);
                }
            }
            
            if (!p.active && p.mesh.parent) {
                this.scene.remove(p.mesh);
            }
        });
        
        // Clean up inactive projectiles
        this.projectiles = this.projectiles.filter(p => p.active);
    }
    
    fire() {
        const muzzlePos = this.musket.getMuzzlePosition();
        const aimDir = this.musket.getAimDirection();
        
        // Add slight randomness for realism
        const spread = 0.015;
        aimDir.x += (Math.random() - 0.5) * spread;
        aimDir.y += (Math.random() - 0.5) * spread;
        aimDir.normalize();
        
        const projectile = new Projectile(muzzlePos, aimDir, CONFIG.MUZZLE_VELOCITY);
        this.projectiles.push(projectile);
        this.scene.add(projectile.mesh);
        
        this.musket.fire();
        
        // Muzzle flash
        this.createMuzzleFlash(muzzlePos);
    }
    
    createMuzzleFlash(pos) {
        const flash = new THREE.PointLight(0xffaa00, 2, 8);
        flash.position.copy(pos);
        this.scene.add(flash);
        
        // Smoke
        const smokeGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const smokeMat = new THREE.MeshBasicMaterial({ 
            color: 0x888888, 
            transparent: true, 
            opacity: 0.6 
        });
        const smoke = new THREE.Mesh(smokeGeo, smokeMat);
        smoke.position.copy(pos);
        this.scene.add(smoke);
        
        // Animate and remove
        let frame = 0;
        const animate = () => {
            frame++;
            if (frame < 10) {
                flash.intensity *= 0.7;
                smoke.scale.multiplyScalar(1.1);
                smoke.material.opacity *= 0.9;
                smoke.position.y += 0.02;
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(flash);
                this.scene.remove(smoke);
            }
        };
        animate();
    }
    
    showHitEffect(pos) {
        // Blood/bloodless hit effect
        const hitGeo = new THREE.RingGeometry(0.1, 0.15, 8);
        const hitMat = new THREE.MeshBasicMaterial({ 
            color: 0x8b0000, 
            transparent: true,
            side: THREE.DoubleSide
        });
        const hit = new THREE.Mesh(hitGeo, hitMat);
        hit.position.copy(pos);
        hit.position.y = 1.5;
        hit.lookAt(this.camera.position);
        this.scene.add(hit);
        
        let frame = 0;
        const animate = () => {
            frame++;
            if (frame < 20) {
                hit.scale.multiplyScalar(1.05);
                hit.material.opacity *= 0.9;
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(hit);
            }
        };
        animate();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        
        // Update health bar
        const healthBar = document.getElementById(this.isPlayer2 ? 'p2Health' : 'p1Health');
        if (healthBar) {
            healthBar.style.width = (this.health / CONFIG.MAX_HEALTH * 100) + '%';
        }
    }
    
    updateCamera() {
        this.camera.position.copy(this.position);
        this.camera.position.y = 1.6; // Eye level
        this.camera.rotation.copy(this.rotation);
        
        // Clamp look angles
        this.camera.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.camera.rotation.x));
    }
    
    reset() {
        this.health = CONFIG.MAX_HEALTH;
        this.musket.reset();
        this.projectiles.forEach(p => {
            if (p.mesh.parent) this.scene.remove(p.mesh);
        });
        this.projectiles = [];
        
        const healthBar = document.getElementById(this.isPlayer2 ? 'p2Health' : 'p1Health');
        if (healthBar) healthBar.style.width = '100%';
    }
}

class Game {
    constructor() {
        this.state = GameState.MENU;
        this.clock = new THREE.Clock();
        
        this.setupRenderer();
        this.setupScenes();
        this.setupInput();
        
        document.getElementById('startBtn').addEventListener('click', () => this.start());
    }
    
    setupRenderer() {
        const p1Viewport = document.getElementById('p1Viewport');
        const p2Viewport = document.getElementById('p2Viewport');
        
        const width = window.innerWidth / 2;
        const height = window.innerHeight;
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.autoClear = false;
        this.renderer.shadowMap.enabled = true;
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
        
        this.p1Camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 1000);
        this.p2Camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 1000);
    }
    
    setupScenes() {
        // Create two scenes with shared environment
        this.p1Scene = new THREE.Scene();
        this.p2Scene = new THREE.Scene();
        
        // Fog for atmosphere
        this.p1Scene.fog = new THREE.Fog(0x87CEEB, 10, 60);
        this.p2Scene.fog = new THREE.Fog(0x87CEEB, 10, 60);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.p1Scene.add(ambientLight.clone());
        this.p2Scene.add(ambientLight.clone());
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        this.p1Scene.add(sunLight.clone());
        this.p2Scene.add(sunLight.clone());
        
        // Ground
        this.createGround(this.p1Scene);
        this.createGround(this.p2Scene);
        
        // Environment
        this.createEnvironment(this.p1Scene);
        this.createEnvironment(this.p2Scene);
        
        // Players
        this.p1 = new Player(1, this.p1Scene, this.p1Camera, false);
        this.p2 = new Player(2, this.p2Scene, this.p2Camera, true);
        
        // Add opponent representation to each scene
        this.p2Scene.add(this.p1.bodyMesh.clone());
        this.p2Scene.add(this.p1.headMesh.clone());
        this.p2Scene.add(this.p1.hatMesh.clone());
        
        this.p1Scene.add(this.p2.bodyMesh.clone());
        this.p1Scene.add(this.p2.headMesh.clone());
        this.p1Scene.add(this.p2.hatMesh.clone());
    }
    
    createGround(scene) {
        const groundGeo = new THREE.PlaneGeometry(100, 100, 50, 50);
        
        // Add some noise to vertices for uneven terrain
        const pos = groundGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + Math.random() * 0.2;
            pos.setZ(i, z);
        }
        groundGeo.computeVertexNormals();
        
        const groundMat = new THREE.MeshPhongMaterial({ 
            color: 0x3d5c3d,
            flatShading: true
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
    }
    
    createEnvironment(scene) {
        // Trees
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 50;
            
            // Keep clear of duel area
            if (Math.abs(x) < 20 && Math.abs(z) < 10) continue;
            
            // Trunk
            const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
            const trunkMat = new THREE.MeshPhongMaterial({ color: 0x4a3728 });
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.set(x, 1.5, z);
            scene.add(trunk);
            
            // Foliage
            const foliageGeo = new THREE.ConeGeometry(2, 5, 8);
            const foliageMat = new THREE.MeshPhongMaterial({ color: 0x2d4a2d });
            const foliage = new THREE.Mesh(foliageGeo, foliageMat);
            foliage.position.set(x, 4.5, z);
            scene.add(foliage);
        }
        
        // Rocks
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 70;
            const z = (Math.random() - 0.5) * 40;
            if (Math.abs(x) < 15 && Math.abs(z) < 8) continue;
            
            const rockGeo = new THREE.DodecahedronGeometry(Math.random() * 0.8 + 0.3);
            const rockMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
            const rock = new THREE.Mesh(rockGeo, rockMat);
            rock.position.set(x, 0.3, z);
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            scene.add(rock);
        }
    }
    
    setupInput() {
        // Player 1 - Mouse aim
        document.addEventListener('mousemove', (e) => {
            if (this.state !== GameState.PLAYING) return;
            
            if (Input.p1Mouse.locked) {
                Input.p1Mouse.x += e.movementX * CONFIG.MOUSE_SENSITIVITY;
                Input.p1Mouse.y -= e.movementY * CONFIG.MOUSE_SENSITIVITY;
                
                this.p1.rotation.y = -Input.p1Mouse.x;
                this.p1.rotation.x = Input.p1Mouse.y;
            }
        });
        
        // Lock pointer on click in P1 viewport
        document.getElementById('p1Viewport').addEventListener('click', () => {
            if (this.state === GameState.PLAYING) {
                document.getElementById('p1Viewport').requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            Input.p1Mouse.locked = document.pointerLockElement === document.getElementById('p1Viewport');
        });
        
        // Keyboard
        document.addEventListener('keydown', (e) => {
            // Player 1
            if (e.key === 'w' || e.key === 'W') Input.p1.w = true;
            if (e.key === 'a' || e.key === 'A') Input.p1.a = true;
            if (e.key === 's' || e.key === 'S') Input.p1.s = true;
            if (e.key === 'd' || e.key === 'D') Input.p1.d = true;
            if (e.key === 'r' || e.key === 'R') Input.p1.cockPressed = true;
            
            // Player 2
            if (e.key === 'ArrowUp') Input.p2.up = true;
            if (e.key === 'ArrowDown') Input.p2.down = true;
            if (e.key === 'ArrowLeft') Input.p2.left = true;
            if (e.key === 'ArrowRight') Input.p2.right = true;
            if (e.key === '8' || e.key === 'Numpad8') Input.p2.aimUp = true;
            if (e.key === '2' || e.key === 'Numpad2') Input.p2.aimDown = true;
            if (e.key === '4' || e.key === 'Numpad4') Input.p2.aimLeft = true;
            if (e.key === '6' || e.key === 'Numpad6') Input.p2.aimRight = true;
            if (e.key === '+') Input.p2.cockPressed = true;
        });
        
        document.addEventListener('keyup', (e) => {
            // Player 1
            if (e.key === 'w' || e.key === 'W') Input.p1.w = false;
            if (e.key === 'a' || e.key === 'A') Input.p1.a = false;
            if (e.key === 's' || e.key === 'S') Input.p1.s = false;
            if (e.key === 'd' || e.key === 'D') Input.p1.d = false;
            
            // Player 2
            if (e.key === 'ArrowUp') Input.p2.up = false;
            if (e.key === 'ArrowDown') Input.p2.down = false;
            if (e.key === 'ArrowLeft') Input.p2.left = false;
            if (e.key === 'ArrowRight') Input.p2.right = false;
            if (e.key === '8' || e.key === 'Numpad8') Input.p2.aimUp = false;
            if (e.key === '2' || e.key === 'Numpad2') Input.p2.aimDown = false;
            if (e.key === '4' || e.key === 'Numpad4') Input.p2.aimLeft = false;
            if (e.key === '6' || e.key === 'Numpad6') Input.p2.aimRight = false;
        });
        
        // Fire buttons
        document.addEventListener('mousedown', (e) => {
            if (this.state === GameState.PLAYING) {
                if (e.button === 0) Input.p1.firePressed = true;
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (this.state === GameState.PLAYING) {
                if (e.key === 'Enter') Input.p2.firePressed = true;
            }
        });
    }
    
    start() {
        document.getElementById('instructions').style.display = 'none';
        this.state = GameState.PLAYING;
        this.loop();
    }
    
    update() {
        const dt = Math.min(this.clock.getDelta(), 0.1);
        
        if (this.state === GameState.PLAYING) {
            this.p1.update(dt, Input.p1, this.p2);
            this.p2.update(dt, Input.p2, this.p1);
            
            // Update UI
            document.getElementById('p1Reload').textContent = STAGE_NAMES[this.p1.musket.reloadStage];
            document.getElementById('p2Reload').textContent = STAGE_NAMES[this.p2.musket.reloadStage];
            
            // Check win condition
            if (this.p1.health <= 0) {
                this.gameOver(2);
            } else if (this.p2.health <= 0) {
                this.gameOver(1);
            }
        }
    }
    
    render() {
        const width = window.innerWidth / 2;
        const height = window.innerHeight;
        
        // Player 1 view (left half)
        this.renderer.setViewport(0, 0, width, height);
        this.renderer.setScissor(0, 0, width, height);
        this.renderer.setScissorTest(true);
        this.renderer.render(this.p1Scene, this.p1Camera);
        
        // Player 2 view (right half)
        this.renderer.setViewport(width, 0, width, height);
        this.renderer.setScissor(width, 0, width, height);
        this.renderer.render(this.p2Scene, this.p2Camera);
        
        this.renderer.setScissorTest(false);
    }
    
    loop() {
        if (this.state !== GameState.GAME_OVER) {
            this.update();
            this.render();
            requestAnimationFrame(() => this.loop());
        }
    }
    
    gameOver(winner) {
        this.state = GameState.GAME_OVER;
        document.exitPointerLock();
        
        const winMsg = document.getElementById('winMessage');
        winMsg.textContent = `Player ${winner} Victorious!`;
        winMsg.style.display = 'block';
        
        setTimeout(() => {
            winMsg.style.display = 'none';
            document.getElementById('instructions').style.display = 'block';
            this.p1.reset();
            this.p2.reset();
            this.state = GameState.MENU;
        }, 3000);
    }
}

// Start game when page loads
window.addEventListener('load', () => {
    new Game();
});

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth / 2;
    const height = window.innerHeight;
    
    if (window.game && window.game.p1Camera && window.game.p2Camera) {
        window.game.p1Camera.aspect = width / height;
        window.game.p1Camera.updateProjectionMatrix();
        window.game.p2Camera.aspect = width / height;
        window.game.p2Camera.updateProjectionMatrix();
        window.game.renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

// Store game instance globally for resize handler
window.addEventListener('load', () => {
    window.game = new Game();
});
