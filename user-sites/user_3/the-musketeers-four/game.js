/**
 * The Musketeers Four - Complete 2-Player Split-Screen Musket FPS
 * Iron sights only, authentic reloading, projectile ballistics
 */

// === PROJECTILE CLASS ===
class Projectile {
    constructor(scene, startPos, direction, owner) {
        this.scene = scene;
        this.owner = owner;
        this.active = true;
        this.diameter = 0.019;
        this.mass = 0.035;
        this.speed = 300;
        
        const geometry = new THREE.SphereGeometry(this.diameter / 2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(startPos);
        scene.add(this.mesh);
        
        this.velocity = direction.clone().normalize().multiplyScalar(this.speed);
        this.lifetime = 5;
        this.age = 0;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        this.age += deltaTime;
        if (this.age > this.lifetime) { this.destroy(); return; }
        
        this.velocity.y -= 9.81 * deltaTime;
        const moveStep = this.velocity.clone().multiplyScalar(deltaTime);
        this.mesh.position.add(moveStep);
        
        if (this.mesh.position.y < 0.01) this.hitGround();
    }
    
    checkPlayerCollision(player) {
        if (!this.active || player === this.owner) return false;
        const distance = this.mesh.position.distanceTo(player.camera.position);
        if (distance < 0.4) { this.hitPlayer(player); return true; }
        return false;
    }
    
    hitPlayer(player) {
        this.active = false;
        player.takeDamage(100);
        this.destroy();
    }
    
    hitGround() {
        this.active = false;
        this.destroy();
    }
    
    destroy() {
        this.active = false;
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}

// === MUSKET CLASS ===
class Musket {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.mesh = null;
        this.ramrod = null;
        this.sightTilt = 0;
        
        this.RELOAD_STATES = {
            READY: 'Ready', EMPTY: 'Empty', HALF_COCK: 'Half-cock...',
            POWDER: 'Pouring powder...', PATCH: 'Adding patch...',
            RAM: 'Ramming...', FULL_COCK: 'Full-cock...'
        };
        
        this.state = this.RELOAD_STATES.READY;
        this.loaded = true;
        this.aiming = false;
        this.reloadProgress = 0;
        this.currentReloadStage = 0;
        this.reloadStages = [
            { state: this.RELOAD_STATES.HALF_COCK, duration: 0.8 },
            { state: this.RELOAD_STATES.POWDER, duration: 1.0 },
            { state: this.RELOAD_STATES.PATCH, duration: 0.8 },
            { state: this.RELOAD_STATES.RAM, duration: 1.5 },
            { state: this.RELOAD_STATES.FULL_COCK, duration: 0.6 }
        ];
        
        this.createMusketModel();
    }
    
    createMusketModel() {
        this.mesh = new THREE.Group();
        
        const barrelGeo = new THREE.CylinderGeometry(0.015, 0.02, 1.2, 12);
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.8 });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, -0.15, -0.4);
        this.mesh.add(barrel);
        
        const stockGeo = new THREE.BoxGeometry(0.08, 0.12, 0.8);
        const stockMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.8 });
        const stock = new THREE.Mesh(stockGeo, stockMat);
        stock.position.set(0, -0.2, 0.3);
        this.mesh.add(stock);
        
        const rearSightGeo = new THREE.BoxGeometry(0.02, 0.015, 0.01);
        const sightMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        const rearSight = new THREE.Mesh(rearSightGeo, sightMat);
        rearSight.position.set(0, -0.08, 0.15);
        this.mesh.add(rearSight);
        
        const frontSightGeo = new THREE.BoxGeometry(0.008, 0.025, 0.008);
        const frontSight = new THREE.Mesh(frontSightGeo, sightMat);
        frontSight.position.set(0, -0.07, -0.95);
        this.mesh.add(frontSight);
        
        const lockGeo = new THREE.BoxGeometry(0.03, 0.08, 0.06);
        const lockMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.7, roughness: 0.5 });
        const lock = new THREE.Mesh(lockGeo, lockMat);
        lock.position.set(0.05, -0.12, 0.1);
        this.mesh.add(lock);
        
        const frizzenGeo = new THREE.BoxGeometry(0.02, 0.06, 0.03);
        this.frizzen = new THREE.Mesh(frizzenGeo, lockMat);
        this.frizzen.position.set(0.05, -0.05, 0.08);
        this.frizzen.rotation.z = -0.3;
        this.mesh.add(this.frizzen);
        
        const ramrodGeo = new THREE.CylinderGeometry(0.004, 0.004, 1.0, 8);
        const ramrodMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a });
        this.ramrod = new THREE.Mesh(ramrodGeo, ramrodMat);
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrod.position.set(0.06, -0.25, 0.2);
        this.mesh.add(this.ramrod);
        
        this.updatePosition();
        this.camera.add(this.mesh);
    }
    
    updatePosition() {
        if (this.aiming) {
            this.mesh.position.set(0, -0.08, 0.25);
            this.mesh.rotation.set(0, 0, this.sightTilt);
        } else {
            this.mesh.position.set(0.2, -0.3, 0.4);
            this.mesh.rotation.set(0.1, -0.1, this.sightTilt);
        }
    }
    
    toggleAim() { this.aiming = !this.aiming; this.updatePosition(); return this.aiming; }
    adjustSight(delta) { this.sightTilt += delta; this.sightTilt = Math.max(-0.15, Math.min(0.15, this.sightTilt)); this.updatePosition(); }
    
    fire() {
        if (!this.loaded || this.state !== this.RELOAD_STATES.READY) return null;
        
        this.frizzen.rotation.z = 0.2;
        setTimeout(() => { this.frizzen.rotation.z = -0.3; }, 100);
        
        const muzzlePos = new THREE.Vector3(0, -0.15, -1.0);
        muzzlePos.applyMatrix4(this.mesh.matrixWorld);
        
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        direction.x += (Math.random() - 0.5) * 0.02;
        direction.y += (Math.random() - 0.5) * 0.02;
        direction.normalize();
        
        this.loaded = false;
        this.state = this.RELOAD_STATES.EMPTY;
        this.createMuzzleFlash(muzzlePos);
        return { position: muzzlePos, direction: direction };
    }
    
    createMuzzleFlash(position) {
        const flashGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.9 });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.copy(position);
        this.scene.add(flash);
        
        let age = 0;
        const animate = () => {
            age += 0.016;
            if (age > 0.1) { this.scene.remove(flash); return; }
            flashMat.opacity = 0.9 * (1 - age / 0.1);
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    startReload() {
        if (this.loaded || this.state !== this.RELOAD_STATES.EMPTY) return false;
        this.currentReloadStage = 0;
        this.reloadProgress = 0;
        this.state = this.reloadStages[0].state;
        return true;
    }
    
    updateReload(deltaTime) {
        if (this.loaded || this.currentReloadStage >= this.reloadStages.length) return;
        
        const stage = this.reloadStages[this.currentReloadStage];
        this.reloadProgress += deltaTime;
        
        if (stage.state === this.RELOAD_STATES.RAM && this.ramrod) {
            const ramProgress = Math.min(this.reloadProgress / stage.duration, 1);
            if (ramProgress < 0.5) this.ramrod.position.z = 0.2 - (ramProgress * 2 * 0.8);
            else this.ramrod.position.z = -0.6 + ((ramProgress - 0.5) * 2 * 0.8);
        }
        
        if (this.reloadProgress >= stage.duration) {
            this.currentReloadStage++;
            this.reloadProgress = 0;
            if (this.currentReloadStage < this.reloadStages.length) this.state = this.reloadStages[this.currentReloadStage].state;
            else {
                this.state = this.RELOAD_STATES.READY;
                this.loaded = true;
                if (this.ramrod) this.ramrod.position.z = 0.2;
            }
        }
    }
    
    getState() {
        return { state: this.state, loaded: this.loaded, aiming: this.aiming,
            progress: this.currentReloadStage < this.reloadStages.length ? this.reloadProgress / this.reloadStages[this.currentReloadStage].duration : 1 };
    }
}

// === PLAYER CLASS ===
class Player {
    constructor(id, camera, scene, controls) {
        this.id = id;
        this.camera = camera;
        this.scene = scene;
        this.controls = controls;
        this.position = controls.startPos.clone();
        this.velocity = new THREE.Vector3();
        this.speed = 3.5;
        this.rotationSpeed = 2.0;
        this.yaw = controls.startYaw;
        this.pitch = 0;
        this.alive = true;
        this.health = 100;
        this.musket = new Musket(scene, camera);
        this.keys = {};
        this.updateCamera();
    }
    
    updateCamera() {
        this.camera.position.copy(this.position);
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
    }
    
    handleKeyDown(key) {
        this.keys[key.toLowerCase()] = true;
        if (key === this.controls.aim) return { action: 'aim', value: this.musket.toggleAim() };
        if (key === this.controls.fire) {
            const shot = this.musket.fire();
            if (shot) return { action: 'fire', shot: shot };
        }
        if (key === this.controls.reload) {
            const started = this.musket.startReload();
            if (started) return { action: 'reload' };
        }
        if (key === this.controls.sightUp) { this.musket.adjustSight(0.02); return { action: 'sightUp' }; }
        if (key === this.controls.sightDown) { this.musket.adjustSight(-0.02); return { action: 'sightDown' }; }
        return null;
    }
    
    handleKeyUp(key) { this.keys[key.toLowerCase()] = false; }
    
    update(deltaTime, otherPlayer) {
        if (!this.alive) return;
        const moveDir = new THREE.Vector3();
        if (this.keys[this.controls.forward]) moveDir.z -= 1;
        if (this.keys[this.controls.backward]) moveDir.z += 1;
        if (this.keys[this.controls.left]) moveDir.x -= 1;
        if (this.keys[this.controls.right]) moveDir.x += 1;
        
        if (moveDir.length() > 0) {
            moveDir.normalize();
            moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
            if (!this.musket.aiming) this.position.add(moveDir.multiplyScalar(this.speed * deltaTime));
        }
        
        this.musket.updateReload(deltaTime);
        this.position.x = Math.max(-19, Math.min(19, this.position.x));
        this.position.z = Math.max(-19, Math.min(19, this.position.z));
        this.updateCamera();
    }
    
    handleMouseMove(movementX, movementY, sensitivity = 0.002) {
        if (!this.alive) return;
        this.yaw -= movementX * sensitivity;
        this.pitch -= movementY * sensitivity;
        this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
        this.updateCamera();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) { this.health = 0; this.alive = false; this.die(); }
    }
    
    die() {
        this.alive = false;
        this.camera.position.y = 0.5;
        this.camera.rotation.z = Math.PI / 2;
    }
    
    getHUDState() {
        const musketState = this.musket.getState();
        return { state: musketState.state, loaded: musketState.loaded, aiming: musketState.aiming, health: this.health, alive: this.alive };
    }
}

// === GAME CLASS ===
class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.canvas = document.getElementById('game-canvas');
        this.startScreen = document.getElementById('start-screen');
        this.winnerScreen = document.getElementById('winner-screen');
        this.winnerText = document.getElementById('winner-text');
        this.renderer = null;
        this.scene = null;
        this.players = [];
        this.projectiles = [];
        this.isRunning = false;
        this.lastTime = 0;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.halfWidth = this.width / 2;
        
        this.setupRenderer();
        this.createScene();
        this.setupInputs();
        
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
        window.addEventListener('resize', () => this.onResize());
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 60);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.camera.left = -30; sunLight.shadow.camera.right = 30;
        sunLight.shadow.camera.top = 30; sunLight.shadow.camera.bottom = -30;
        this.scene.add(sunLight);
        
        const groundGeo = new THREE.PlaneGeometry(40, 40);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x3d5c3d, roughness: 0.9 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        this.createEnvironment();
        this.camera1 = new THREE.PerspectiveCamera(75, this.halfWidth / this.height, 0.1, 100);
        this.camera2 = new THREE.PerspectiveCamera(75, this.halfWidth / this.height, 0.1, 100);
    }
    
    createEnvironment() {
        const treePositions = [[-5,-8],[5,-8],[-5,8],[5,8],[0,-12],[0,12],[-12,0],[12,0],[-8,-5],[8,5],[-8,5],[8,-5]];
        treePositions.forEach(pos => this.createTree(pos[0], pos[1]));
        for (let i = -15; i <= 15; i += 10) if (Math.abs(i) > 2) this.createBarricade(i, 0);
    }
    
    createTree(x, z) {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 8), new THREE.MeshStandardMaterial({ color: 0x4a3728 }));
        trunk.position.set(x, 1, z); trunk.castShadow = true; this.scene.add(trunk);
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 8), new THREE.MeshStandardMaterial({ color: 0x2d5a2d }));
        leaves.position.set(x, 3, z); leaves.castShadow = true; this.scene.add(leaves);
    }
    
    createBarricade(x, z) {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
        crate.position.set(x, 0.5, z); crate.castShadow = true; crate.receiveShadow = true; this.scene.add(crate);
    }
    
    setupInputs() {
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            const result1 = this.players[0].handleKeyDown(e.key);
            if (result1) this.handleAction(0, result1);
            const result2 = this.players[1].handleKeyDown(e.key);
            if (result2) this.handleAction(1, result2);
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.players[0]) this.players[0].handleKeyUp(e.key);
            if (this.players[1]) this.players[1].handleKeyUp(e.key);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isRunning) return;
            const sensitivity = 0.002;
            if (e.clientX < this.halfWidth) this.players[0].handleMouseMove(e.movementX, e.movementY, sensitivity);
            else this.players[1].handleMouseMove(e.movementX, e.movementY, sensitivity);
        });
        
        this.canvas.addEventListener('click', () => { if (this.isRunning) this.canvas.requestPointerLock(); });
    }
    
    handleAction(playerIndex, action) {
        if (action.action === 'fire' && action.shot) {
            this.projectiles.push(new Projectile(this.scene, action.shot.position, action.shot.direction, this.players[playerIndex]));
        }
    }
    
    start() {
        this.startScreen.classList.add('hidden');
        this.winnerScreen.classList.add('hidden');
        
        const p1Controls = {
            forward: 'w', backward: 's', left: 'a', right: 'd',
            aim: 'x', fire: 'f', reload: 'r', sightUp: 'q', sightDown: 'e',
            startPos: new THREE.Vector3(-10, 1.7, 0), startYaw: Math.PI / 2
        };
        const p2Controls = {
            forward: 'arrowup', backward: 'arrowdown', left: 'arrowleft', right: 'arrowright',
            aim: 'enter', fire: '\\', reload: 'backspace', sightUp: 'delete', sightDown: 'pagedown',
            startPos: new THREE.Vector3(10, 1.7, 0), startYaw: -Math.PI / 2
        };
        
        this.players = [
            new Player(1, this.camera1, this.scene, p1Controls),
            new Player(2, this.camera2, this.scene, p2Controls)
        ];
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.canvas.requestPointerLock();
        requestAnimationFrame((t) => this.loop(t));
    }
    
    restart() {
        this.projectiles.forEach(p => p.destroy());
        this.projectiles = [];
        this.start();
    }
    
    loop(time) {
        if (!this.isRunning) return;
        const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;
        
        this.players[0].update(deltaTime, this.players[1]);
        this.players[1].update(deltaTime, this.players[0]);
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update(deltaTime);
            if (proj.active) {
                if (proj.checkPlayerCollision(this.players[0])) this.checkWinCondition();
                if (proj.checkPlayerCollision(this.players[1])) this.checkWinCondition();
            }
            if (!proj.active) this.projectiles.splice(i, 1);
        }
        
        this.updateHUD();
        this.render();
        requestAnimationFrame((t) => this.loop(t));
    }
    
    updateHUD() {
        const p1State = this.players[0].getHUDState();
        const p2State = this.players[1].getHUDState();
        const p1Status = document.getElementById('p1-status');
        const p2Status = document.getElementById('p2-status');
        p1Status.textContent = p1State.state;
        p1Status.className = 'status' + (p1State.aiming ? ' aiming' : '') + (!p1State.loaded ? ' reloading' : '');
        p2Status.textContent = p2State.state;
        p2Status.className = 'status' + (p2State.aiming ? ' aiming' : '') + (!p2State.loaded ? ' reloading' : '');
    }
    
    checkWinCondition() {
        const p1Alive = this.players[0].alive;
        const p2Alive = this.players[1].alive;
        if (!p1Alive || !p2Alive) {
            this.isRunning = false;
            document.exitPointerLock();
            if (p1Alive) { this.winnerText.textContent = 'PLAYER 1 WINS!'; this.winnerText.style.color = '#4a90d9'; }
            else { this.winnerText.textContent = 'PLAYER 2 WINS!'; this.winnerText.style.color = '#d94a4a'; }
            this.winnerScreen.classList.remove('hidden');
        }
    }
    
    render() {
        this.renderer.setScissorTest(true);
        this.renderer.setViewport(0, 0, this.halfWidth, this.height);
        this.renderer.setScissor(0, 0, this.halfWidth, this.height);
        this.renderer.render(this.scene, this.camera1);
        this.renderer.setViewport(this.halfWidth, 0, this.halfWidth, this.height);
        this.renderer.setScissor(this.halfWidth, 0, this.halfWidth, this.height);
        this.renderer.render(this.scene, this.camera2);
        this.renderer.setScissorTest(false);
    }
    
    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.halfWidth = this.width / 2;
        this.renderer.setSize(this.width, this.height);
        this.camera1.aspect = this.halfWidth / this.height;
        this.camera1.updateProjectionMatrix();
        this.camera2.aspect = this.halfWidth / this.height;
        this.camera2.updateProjectionMatrix();
    }
}

document.addEventListener('DOMContentLoaded', () => { window.game = new Game(); });
