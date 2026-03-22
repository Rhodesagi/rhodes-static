// THE MUSKETS FIRE THREE - 2 Player Local Multiplayer Musket FPS
// Iron sight aiming only, full reloading animation

const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 10, 100);

// Camera setup for split screen
const p1Camera = new THREE.PerspectiveCamera(75, window.innerWidth / 2 / window.innerHeight, 0.1, 1000);
const p2Camera = new THREE.PerspectiveCamera(75, window.innerWidth / 2 / window.innerHeight, 0.1, 1000);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(50, 100, 50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

// Arena - forest battlefield
const groundGeometry = new THREE.PlaneGeometry(200, 200);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x3d5c3d });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Trees and cover
function createTree(x, z) {
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 4, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 2, z);
    trunk.castShadow = true;
    
    const leavesGeo = new THREE.ConeGeometry(3, 8, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1a4a1a });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.set(x, 7, z);
    leaves.castShadow = true;
    
    scene.add(trunk);
    scene.add(leaves);
    
    return { x, z, radius: 1.5, type: 'tree' };
}

const obstacles = [];
for (let i = 0; i < 30; i++) {
    const x = (Math.random() - 0.5) * 180;
    const z = (Math.random() - 0.5) * 180;
    if (Math.abs(x) > 15 || Math.abs(z) > 15) {
        obstacles.push(createTree(x, z));
    }
}

// Rocks
function createRock(x, z) {
    const rockGeo = new THREE.DodecahedronGeometry(2 + Math.random() * 2);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(x, 1, z);
    rock.scale.y = 0.6;
    rock.castShadow = true;
    scene.add(rock);
    return { x, z, radius: 2.5, type: 'rock' };
}

for (let i = 0; i < 15; i++) {
    const x = (Math.random() - 0.5) * 180;
    const z = (Math.random() - 0.5) * 180;
    if (Math.abs(x) > 10 || Math.abs(z) > 10) {
        obstacles.push(createRock(x, z));
    }
}

// Musket model builder
function createMusket() {
    const musketGroup = new THREE.Group();
    
    // Stock
    const stockGeo = new THREE.BoxGeometry(0.15, 0.12, 1.2);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const stock = new THREE.Mesh(stockGeo, woodMat);
    stock.position.set(0, -0.1, 0.3);
    musketGroup.add(stock);
    
    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.025, 0.03, 1.4, 12);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
    const barrel = new THREE.Mesh(barrelGeo, metalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.05, 0.5);
    musketGroup.add(barrel);
    
    // Barrel bands
    for (let i = 0; i < 3; i++) {
        const bandGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.04, 12);
        const band = new THREE.Mesh(bandGeo, metalMat);
        band.rotation.x = Math.PI / 2;
        band.position.set(0, 0.05, 0.1 + i * 0.5);
        musketGroup.add(band);
    }
    
    // Flintlock mechanism
    const lockGeo = new THREE.BoxGeometry(0.08, 0.12, 0.15);
    const lock = new THREE.Mesh(lockGeo, metalMat);
    lock.position.set(0.1, 0.05, 0.15);
    musketGroup.add(lock);
    
    // Hammer
    const hammerGeo = new THREE.BoxGeometry(0.03, 0.08, 0.05);
    const hammer = new THREE.Mesh(hammerGeo, metalMat);
    hammer.position.set(0.08, 0.15, 0.12);
    musketGroup.add(hammer);
    
    // Pan
    const panGeo = new THREE.BoxGeometry(0.04, 0.02, 0.06);
    const pan = new THREE.Mesh(panGeo, metalMat);
    pan.position.set(0.08, 0.02, 0.18);
    musketGroup.add(pan);
    
    // Trigger guard
    const guardGeo = new THREE.TorusGeometry(0.04, 0.008, 4, 12, Math.PI);
    const guard = new THREE.Mesh(guardGeo, metalMat);
    guard.position.set(0, -0.05, 0.25);
    guard.rotation.z = Math.PI;
    musketGroup.add(guard);
    
    // Trigger
    const triggerGeo = new THREE.BoxGeometry(0.008, 0.04, 0.02);
    const trigger = new THREE.Mesh(triggerGeo, metalMat);
    trigger.position.set(0, -0.03, 0.25);
    trigger.rotation.x = 0.3;
    musketGroup.add(trigger);
    
    // Ramrod (stored under barrel)
    const ramrodGeo = new THREE.CylinderGeometry(0.008, 0.008, 1.2, 6);
    const ramrod = new THREE.Mesh(ramrodGeo, metalMat);
    ramrod.rotation.x = Math.PI / 2;
    ramrod.position.set(0, -0.08, 0.5);
    musketGroup.add(ramrod);
    
    // Front sight
    const sightGeo = new THREE.BoxGeometry(0.015, 0.04, 0.01);
    const sight = new THREE.Mesh(sightGeo, metalMat);
    sight.position.set(0, 0.1, 1.15);
    musketGroup.add(sight);
    
    // Rear sight (V notch)
    const rearSightGeo = new THREE.BoxGeometry(0.03, 0.03, 0.01);
    const rearSight = new THREE.Mesh(rearSightGeo, metalMat);
    rearSight.position.set(0, 0.08, 0.2);
    musketGroup.add(rearSight);
    
    return musketGroup;
}

// Animated reloading components
function createAnimatedMusket() {
    const musket = createMusket();
    
    // Create separate hand and powder horn for animations
    const handGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const handMat = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
    const hand = new THREE.Mesh(handGeo, handMat);
    hand.visible = false;
    musket.add(hand);
    
    // Powder horn
    const hornGeo = new THREE.ConeGeometry(0.05, 0.2, 8);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
    const horn = new THREE.Mesh(hornGeo, hornMat);
    horn.rotation.z = -Math.PI / 2;
    horn.visible = false;
    hand.add(horn);
    
    // Ball
    const ballGeo = new THREE.SphereGeometry(0.018, 8, 8);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9 });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.visible = false;
    hand.add(ball);
    
    // Extracted ramrod for animation
    const ramrodGeo = new THREE.CylinderGeometry(0.008, 0.008, 1.2, 6);
    const ramrodMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
    const ramrodActive = new THREE.Mesh(ramrodGeo, ramrodMat);
    ramrodActive.visible = false;
    musket.add(ramrodActive);
    
    return { musket, hand, horn, ball, ramrodActive };
}

// Player class
class Player {
    constructor(id, x, z, color) {
        this.id = id;
        this.position = new THREE.Vector3(x, 1.6, z);
        this.rotation = id === 1 ? 0 : Math.PI;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 8;
        this.turnSpeed = 2.5;
        this.height = 1.6;
        
        // Weapon state
        this.loaded = true;
        this.reloading = false;
        this.reloadStage = 0;
        this.reloadTimer = 0;
        
        // Iron sights
        this.aiming = false;
        this.aimTime = 0;
        
        // Recoil
        this.recoil = 0;
        
        // Create camera holder
        this.cameraHolder = new THREE.Object3D();
        this.cameraHolder.position.copy(this.position);
        scene.add(this.cameraHolder);
        
        // Create musket viewmodel
        const animated = createAnimatedMusket();
        this.musket = animated.musket;
        this.hand = animated.hand;
        this.horn = animated.horn;
        this.ball = animated.ball;
        this.ramrodActive = animated.ramrodActive;
        
        // Position musket in view
        this.musket.position.set(0.2, -0.3, -0.5);
        this.musket.rotation.y = -0.1;
        
        // Muzzle flash light
        this.muzzleLight = new THREE.PointLight(0xffaa00, 0, 8);
        this.muzzleLight.position.set(0, 0.05, 1.2);
        this.musket.add(this.muzzleLight);
        
        // Smoke particles
        this.smokeParticles = [];
        
        this.cameraHolder.add(this.musket);
        
        // Update camera
        this.updateCamera();
    }
    
    updateCamera() {
        const camera = this.id === 1 ? p1Camera : p2Camera;
        
        // Position camera at head height
        camera.position.copy(this.position);
        camera.position.y = this.height;
        
        // Apply recoil
        const recoilPitch = this.recoil * 0.3;
        
        // Iron sight or hip position
        if (this.aiming) {
            const aimProgress = Math.min(this.aimTime * 3, 1);
            const eased = 1 - Math.pow(1 - aimProgress, 3);
            
            // Move musket to eye level for iron sights
            this.musket.position.x = 0 + (0.15 - 0) * eased;
            this.musket.position.y = -0.15 + (0.05 - (-0.15)) * eased;
            this.musket.position.z = -0.3 + (-0.1 - (-0.3)) * eased;
            this.musket.rotation.y = -0.1 + (0 - (-0.1)) * eased;
            this.musket.rotation.z = 0 + (-0.05 - 0) * eased;
            
            // Camera looks down sights
            camera.rotation.order = 'YXZ';
            camera.rotation.y = this.rotation;
            camera.rotation.x = recoilPitch - 0.02; // Slight downward angle for sight picture
        } else {
            const aimProgress = Math.max(0, 1 - this.aimTime * 4);
            const eased = 1 - Math.pow(1 - aimProgress, 3);
            
            // Return to hip
            this.musket.position.x = 0.15 + (0.2 - 0.15) * eased;
            this.musket.position.y = -0.15 + (-0.3 - (-0.15)) * eased;
            this.musket.position.z = -0.1 + (-0.5 - (-0.1)) * eased;
            this.musket.rotation.y = 0 + (-0.1 - 0) * eased;
            this.musket.rotation.z = -0.05 + (0 - (-0.05)) * eased;
            
            camera.rotation.order = 'YXZ';
            camera.rotation.y = this.rotation;
            camera.rotation.x = recoilPitch;
        }
        
        this.cameraHolder.rotation.y = this.rotation;
        
        // Recoil recovery
        this.recoil = Math.max(0, this.recoil - 0.08);
        
        // Aim timing
        if (this.aiming) {
            this.aimTime += 0.016;
        } else {
            this.aimTime = Math.max(0, this.aimTime - 0.033);
        }
    }
    
    move(dx, dz, dt) {
        if (this.reloading) return; // Can't move while reloading
        
        const forward = new THREE.Vector3(Math.sin(this.rotation), 0, Math.cos(this.rotation));
        const right = new THREE.Vector3(Math.cos(this.rotation), 0, -Math.sin(this.rotation));
        
        const moveVec = new THREE.Vector3()
            .addScaledVector(forward, dz)
            .addScaledVector(right, dx)
            .normalize()
            .multiplyScalar(this.speed * dt);
        
        const newPos = this.position.clone().add(moveVec);
        
        // Collision with obstacles
        let canMove = true;
        for (const obs of obstacles) {
            const dist = Math.sqrt((newPos.x - obs.x) ** 2 + (newPos.z - obs.z) ** 2);
            if (dist < obs.radius + 0.5) {
                canMove = false;
                break;
            }
        }
        
        // Boundary check
        if (Math.abs(newPos.x) > 95 || Math.abs(newPos.z) > 95) {
            canMove = false;
        }
        
        // Player collision
        const otherPlayer = this.id === 1 ? player2 : player1;
        const playerDist = newPos.distanceTo(otherPlayer.position);
        if (playerDist < 1.5) canMove = false;
        
        if (canMove) {
            this.position.copy(newPos);
            this.cameraHolder.position.copy(this.position);
        }
    }
    
    turn(amount, dt) {
        if (this.reloading) return;
        this.rotation += amount * this.turnSpeed * dt;
    }
    
    fire() {
        if (!this.loaded || this.reloading) return;
        
        this.loaded = false;
        this.recoil = 1.0;
        
        // Muzzle flash
        this.muzzleLight.intensity = 5;
        setTimeout(() => { this.muzzleLight.intensity = 0; }, 50);
        
        // Smoke
        this.createSmoke();
        
        // Raycast from barrel
        const camera = this.id === 1 ? p1Camera : p2Camera;
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        
        // Add slight random spread when not aiming
        if (!this.aiming) {
            direction.x += (Math.random() - 0.5) * 0.05;
            direction.y += (Math.random() - 0.5) * 0.05;
            direction.z += (Math.random() - 0.5) * 0.05;
            direction.normalize();
        }
        
        const raycaster = new THREE.Raycaster(camera.position, direction);
        
        // Check hit on other player
        const otherPlayer = this.id === 1 ? player2 : player1;
        const hitDist = camera.position.distanceTo(otherPlayer.position);
        
        // Simple hit detection - check if looking at other player within reasonable arc
        const toOther = otherPlayer.position.clone().sub(camera.position).normalize();
        const angle = direction.angleTo(toOther);
        
        if (angle < 0.05 && hitDist < 50) {
            // Hit! Damage based on distance
            const damage = Math.max(25, 80 - hitDist * 0.8);
            otherPlayer.takeDamage(damage);
            
            // Blood spray effect
            this.createBlood(otherPlayer.position);
        }
        
        this.updateAmmoUI();
    }
    
    createSmoke() {
        for (let i = 0; i < 8; i++) {
            const smoke = document.createElement('div');
            smoke.style.position = 'absolute';
            smoke.style.width = '20px';
            smoke.style.height = '20px';
            smoke.style.background = 'radial-gradient(circle, rgba(200,200,200,0.8) 0%, transparent 70%)';
            smoke.style.borderRadius = '50%';
            smoke.style.pointerEvents = 'none';
            document.getElementById('ui').appendChild(smoke);
            
            // Project 3D position to 2D
            const muzzlePos = new THREE.Vector3(0, 0.05, 1.2);
            muzzlePos.applyMatrix4(this.musket.matrixWorld);
            
            const screenPos = muzzlePos.clone();
            const camera = this.id === 1 ? p1Camera : p2Camera;
            screenPos.project(camera);
            
            const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
            
            smoke.style.left = x + 'px';
            smoke.style.top = y + 'px';
            
            // Animate
            const vx = (Math.random() - 0.5) * 2;
            const vy = -1 - Math.random();
            let opacity = 1;
            let scale = 1;
            
            const animate = () => {
                const currentX = parseFloat(smoke.style.left);
                const currentY = parseFloat(smoke.style.top);
                smoke.style.left = (currentX + vx) + 'px';
                smoke.style.top = (currentY + vy) + 'px';
                opacity -= 0.02;
                scale += 0.05;
                smoke.style.opacity = opacity;
                smoke.style.transform = `scale(${scale})`;
                
                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    smoke.remove();
                }
            };
            requestAnimationFrame(animate);
        }
    }
    
    createBlood(position) {
        for (let i = 0; i < 5; i++) {
            const blood = document.createElement('div');
            blood.style.position = 'absolute';
            blood.style.width = '8px';
            blood.style.height = '8px';
            blood.style.background = '#8B0000';
            blood.style.borderRadius = '50%';
            blood.style.pointerEvents = 'none';
            document.getElementById('ui').appendChild(blood);
            
            const screenPos = position.clone();
            const camera = this.id === 1 ? p1Camera : p2Camera;
            screenPos.project(camera);
            
            const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
            
            blood.style.left = x + 'px';
            blood.style.top = y + 'px';
            
            const vx = (Math.random() - 0.5) * 5;
            const vy = (Math.random() - 0.5) * 5 - 2;
            let opacity = 1;
            
            const animate = () => {
                const currentX = parseFloat(blood.style.left);
                const currentY = parseFloat(blood.style.top);
                blood.style.left = (currentX + vx) + 'px';
                blood.style.top = (currentY + vy) + 'px';
                opacity -= 0.03;
                blood.style.opacity = opacity;
                
                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    blood.remove();
                }
            };
            requestAnimationFrame(animate);
        }
    }
    
    startReload() {
        if (this.loaded || this.reloading) return;
        this.reloading = true;
        this.reloadStage = 0;
        this.reloadTimer = 0;
        this.updateAmmoUI();
    }
    
    updateReload(dt) {
        if (!this.reloading) return;
        
        const stages = [
            { name: 'HALF-COCK...', duration: 0.5, anim: 'halfcock' },
            { name: 'POWDER...', duration: 0.8, anim: 'powder' },
            { name: 'PATCH & BALL...', duration: 1.0, anim: 'ball' },
            { name: 'RAMMING...', duration: 1.2, anim: 'ram' },
            { name: 'RETURN ROD...', duration: 0.5, anim: 'return' },
            { name: 'PRIMING...', duration: 0.7, anim: 'prime' },
            { name: 'FULL COCK...', duration: 0.4, anim: 'cock' },
            { name: 'SHOULDER...', duration: 0.3, anim: 'shoulder' }
        ];
        
        this.reloadTimer += dt;
        
        let accumulated = 0;
        for (let i = 0; i < stages.length; i++) {
            if (this.reloadTimer < accumulated + stages[i].duration) {
                if (this.reloadStage !== i) {
                    this.reloadStage = i;
                    this.updateAmmoUI();
                }
                this.animateReloadStage(stages[i].anim, (this.reloadTimer - accumulated) / stages[i].duration);
                break;
            }
            accumulated += stages[i].duration;
        }
        
        if (this.reloadTimer >= stages.reduce((a, s) => a + s.duration, 0)) {
            this.reloading = false;
            this.loaded = true;
            this.reloadStage = 0;
            this.resetMusketPosition();
            this.updateAmmoUI();
        }
    }
    
    animateReloadStage(stage, progress) {
        switch(stage) {
            case 'halfcock':
                // Hammer goes to half-cock position
                this.musket.children[4].rotation.x = progress * 0.3; // Hammer
                break;
            case 'powder':
                // Hand brings powder horn to barrel
                this.hand.visible = true;
                this.horn.visible = true;
                this.horn.position.set(0.1, 0.1, 0);
                this.hand.position.set(
                    0.1 + (0.3 - 0.1) * progress,
                    0.2 + (-0.1 - 0.2) * progress,
                    0.3 + (0.8 - 0.3) * progress
                );
                this.hand.rotation.z = progress * 0.5;
                break;
            case 'ball':
                // Switch to ball
                this.horn.visible = false;
                this.ball.visible = true;
                this.hand.position.set(0.3, -0.1, 0.8);
                // Drop ball into barrel
                this.ball.position.set(0, 0, progress * 0.1);
                break;
            case 'ram':
                // Extract ramrod and ram
                this.hand.visible = false;
                this.ramrodActive.visible = true;
                this.ramrodActive.position.set(0, -0.05, 0.5 + Math.sin(progress * Math.PI) * 0.3);
                this.ramrodActive.rotation.x = Math.PI / 2 + Math.sin(progress * Math.PI * 2) * 0.1;
                break;
            case 'return':
                // Return ramrod
                this.ramrodActive.position.set(0, -0.08, 0.5);
                this.ramrodActive.rotation.x = Math.PI / 2;
                this.ramrodActive.visible = progress > 0.5 ? false : true;
                break;
            case 'prime':
                // Prime the pan
                this.ramrodActive.visible = false;
                this.hand.visible = true;
                this.ball.visible = false;
                this.horn.visible = true;
                this.horn.position.set(0.05, 0, 0);
                this.hand.position.set(
                    0.2 - progress * 0.1,
                    0,
                    0.3 + progress * 0.1
                );
                break;
            case 'cock':
                // Full cock
                this.hand.visible = false;
                this.musket.children[4].rotation.x = 0.3 + progress * 0.3; // Hammer back
                break;
            case 'shoulder':
                // Shoulder arms
                this.musket.children[4].rotation.x = 0.6 - progress * 0.6; // Hammer reset
                break;
        }
    }
    
    resetMusketPosition() {
        this.hand.visible = false;
        this.horn.visible = false;
        this.ball.visible = false;
        this.ramrodActive.visible = false;
        this.musket.children[4].rotation.x = 0; // Hammer
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.updateHealthUI();
        
        // Screen blood effect
        const woundFx = document.getElementById('wound-fx');
        woundFx.style.opacity = 0.8;
        setTimeout(() => { woundFx.style.opacity = 0; }, 300);
        
        if (this.health <= 0) {
            endRound(this.id === 1 ? 2 : 1);
        }
    }
    
    updateHealthUI() {
        const healthEl = document.getElementById(`p${this.id}-health`);
        healthEl.style.width = `${(this.health / this.maxHealth) * 100}%`;
    }
    
    updateAmmoUI() {
        const ammoEl = document.getElementById(`p${this.id}-ammo`);
        const stageEl = document.getElementById(`p${this.id}-reload`);
        
        if (this.reloading) {
            const stages = ['HALF-COCK...', 'POWDER...', 'PATCH & BALL...', 'RAMMING...', 
                          'RETURN ROD...', 'PRIMING...', 'FULL COCK...', 'SHOULDER...'];
            ammoEl.textContent = 'RELOADING';
            ammoEl.style.color = '#ff8';
            stageEl.textContent = stages[this.reloadStage] || '';
            stageEl.classList.add('active');
        } else if (this.loaded) {
            ammoEl.textContent = 'READY TO FIRE';
            ammoEl.style.color = '#4a9';
            stageEl.classList.remove('active');
        } else {
            ammoEl.textContent = 'EMPTY - PRESS RELOAD';
            ammoEl.style.color = '#a44';
            stageEl.classList.remove('active');
        }
    }
    
    setAiming(aiming) {
        this.aiming = aiming;
    }
}

// Create players
const player1 = new Player(1, -10, 0, 0x4a9);
const player2 = new Player(2, 10, 0, 0xa49);

// Input handling
const keys = {};
const mouse = { x: 0, y: 0, locked: false };

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    // Player 1 reload
    if (e.code === 'KeyR') player1.startReload();
    
    // Player 2 controls
    if (e.code === 'Numpad0') player2.fire();
    if (e.code === 'Numpad1') player2.startReload();
    if (e.code === 'Numpad5') player2.setAiming(true);
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.code === 'Numpad5') player2.setAiming(false);
});

// Mouse for Player 1
window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) {
        player1.turn(-e.movementX * 0.002, 1);
    }
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) player1.fire(); // Left click fire
    if (e.button === 2) player1.setAiming(true); // Right click aim
    
    if (!mouse.locked && e.button === 0) {
        canvas.requestPointerLock();
        mouse.locked = true;
    }
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 2) player1.setAiming(false);
});

// Prevent context menu
window.addEventListener('contextmenu', (e) => e.preventDefault());

// Game loop
let lastTime = 0;
let gameActive = false;

function update(dt) {
    if (!gameActive) return;
    
    // Player 1 movement (WASD)
    let dx1 = 0, dz1 = 0;
    if (keys['KeyW']) dz1 += 1;
    if (keys['KeyS']) dz1 -= 1;
    if (keys['KeyA']) dx1 -= 1;
    if (keys['KeyD']) dx1 += 1;
    if (dx1 !== 0 || dz1 !== 0) player1.move(dx1, dz1, dt);
    
    // Player 2 movement (Arrow keys)
    let dx2 = 0, dz2 = 0;
    if (keys['ArrowUp']) dz2 += 1;
    if (keys['ArrowDown']) dz2 -= 1;
    if (keys['ArrowLeft']) dx2 -= 1;
    if (keys['ArrowRight']) dx2 += 1;
    if (dx2 !== 0 || dz2 !== 0) player2.move(dx2, dz2, dt);
    
    // Player 2 turning (Numpad 4/6)
    if (keys['Numpad4']) player2.turn(1, dt);
    if (keys['Numpad6']) player2.turn(-1, dt);
    
    // Update reloads
    player1.updateReload(dt);
    player2.updateReload(dt);
    
    // Update cameras
    player1.updateCamera();
    player2.updateCamera();
}

function render() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Player 1 view (left half)
    renderer.setViewport(0, 0, width / 2, height);
    renderer.setScissor(0, 0, width / 2, height);
    renderer.setScissorTest(true);
    renderer.render(scene, p1Camera);
    
    // Player 2 view (right half)
    renderer.setViewport(width / 2, 0, width / 2, height);
    renderer.setScissor(width / 2, 0, width / 2, height);
    renderer.setScissorTest(true);
    renderer.render(scene, p2Camera);
    
    // Center divider
    renderer.setScissorTest(false);
}

function loop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    
    update(dt);
    render();
    
    requestAnimationFrame(loop);
}

// Countdown and start
document.getElementById('p1-ammo').textContent = 'WAIT...';
document.getElementById('p2-ammo').textContent = 'WAIT...';

let count = 3;
const countEl = document.getElementById('countdown');
const countInterval = setInterval(() => {
    count--;
    if (count > 0) {
        countEl.textContent = count;
    } else if (count === 0) {
        countEl.textContent = 'FIRE!';
    } else {
        clearInterval(countInterval);
        countEl.style.display = 'none';
        gameActive = true;
        player1.updateAmmoUI();
        player2.updateAmmoUI();
    }
}, 1000);

function endRound(winner) {
    gameActive = false;
    const victoryEl = document.getElementById('victory');
    victoryEl.textContent = `PLAYER ${winner} WINS!`;
    victoryEl.style.display = 'block';
    victoryEl.style.color = winner === 1 ? '#4a9' : '#a49';
    
    setTimeout(() => {
        location.reload();
    }, 3000);
}

// Handle resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    p1Camera.aspect = (window.innerWidth / 2) / window.innerHeight;
    p1Camera.updateProjectionMatrix();
    p2Camera.aspect = (window.innerWidth / 2) / window.innerHeight;
    p2Camera.updateProjectionMatrix();
});

// Start
requestAnimationFrame(loop);
