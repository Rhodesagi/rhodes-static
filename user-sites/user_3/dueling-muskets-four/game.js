// Dueling Muskets - Complete 2-Player FPS Game
// Iron sights only, full reloading simulation

const Game = {
    players: [],
    bullets: [],
    scene: null,
    arenaSize: 50,
    killsToWin: 3,
    started: false,
    
    // Reloading stages with realistic timing
    ReloadStages: [
        { name: 'Half-cocking hammer...', duration: 300 },
        { name: 'Biting cartridge...', duration: 400 },
        { name: 'Priming the pan...', duration: 500 },
        { name: 'Closing frizzen...', duration: 300 },
        { name: 'Charging barrel...', duration: 500 },
        { name: 'Inserting ball & patch...', duration: 600 },
        { name: 'Drawing rammer...', duration: 400 },
        { name: 'Ramming charge...', duration: 1200 },
        { name: 'Returning rammer...', duration: 400 },
        { name: 'Full-cock - READY', duration: 300 }
    ]
};

class Musket {
    constructor(player) {
        this.player = player;
        this.loaded = true;
        this.cocked = true;
        this.reloading = false;
        this.reloadStage = 0;
        this.reloadTimer = 0;
        this.aiming = false;
        this.tilt = 0;
        
        // Create 3D model
        this.mesh = this.createModel();
        this.flash = this.createMuzzleFlash();
    }
    
    createModel() {
        const group = new THREE.Group();
        
        // Stock (wood)
        const stockGeo = new THREE.BoxGeometry(0.08, 0.12, 0.8);
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        const stock = new THREE.Mesh(stockGeo, woodMat);
        stock.position.z = 0.2;
        stock.position.y = -0.06;
        group.add(stock);
        
        // Barrel (metal)
        const barrelGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.9, 12);
        const metalMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            metalness: 0.8,
            roughness: 0.3
        });
        const barrel = new THREE.Mesh(barrelGeo, metalMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.25;
        barrel.position.y = 0.05;
        group.add(barrel);
        
        // Barrel bands
        for(let i = 0; i < 3; i++) {
            const band = new THREE.Mesh(
                new THREE.CylinderGeometry(0.032, 0.032, 0.04, 8),
                metalMat
            );
            band.rotation.x = Math.PI / 2;
            band.position.z = -0.1 - (i * 0.25);
            band.position.y = 0.05;
            group.add(band);
        }
        
        // Lock plate and hammer
        const lockGeo = new THREE.BoxGeometry(0.06, 0.08, 0.12);
        const lock = new THREE.Mesh(lockGeo, metalMat);
        lock.position.set(0.05, 0.05, 0.15);
        group.add(lock);
        
        // Hammer
        this.hammer = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.08, 0.05),
            metalMat
        );
        this.hammer.position.set(0.06, 0.12, 0.12);
        this.hammer.rotation.z = -0.3;
        group.add(this.hammer);
        
        // Frizzen
        this.frizzen = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.06, 0.08),
            metalMat
        );
        this.frizzen.position.set(0.05, 0.08, 0.18);
        this.frizzen.rotation.x = 0;
        group.add(this.frizzen);
        
        // Trigger guard
        const guardGeo = new THREE.TorusGeometry(0.04, 0.008, 6, 12, Math.PI);
        const guard = new THREE.Mesh(guardGeo, metalMat);
        guard.position.set(0, -0.02, 0.35);
        guard.rotation.z = Math.PI / 2;
        group.add(guard);
        
        // Trigger
        const trigger = new THREE.Mesh(
            new THREE.CylinderGeometry(0.005, 0.005, 0.04),
            metalMat
        );
        trigger.rotation.z = Math.PI / 2;
        trigger.position.set(0, -0.01, 0.35);
        group.add(trigger);
        
        // Ramrod (under barrel)
        this.ramrod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.008, 0.7, 6),
            new THREE.MeshLambertMaterial({ color: 0x3d2817 })
        );
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrod.position.set(0, -0.04, -0.2);
        group.add(this.ramrod);
        
        // Rear sight (notch)
        const sightGeo = new THREE.BoxGeometry(0.02, 0.03, 0.02);
        const sight = new THREE.Mesh(sightGeo, metalMat);
        sight.position.set(0, 0.12, -0.5);
        group.add(sight);
        
        // Front sight post
        const frontSight = new THREE.Mesh(
            new THREE.BoxGeometry(0.015, 0.04, 0.015),
            metalMat
        );
        frontSight.position.set(0, 0.12, -0.7);
        group.add(frontSight);
        
        return group;
    }
    
    createMuzzleFlash() {
        const flash = new THREE.PointLight(0xffaa00, 0, 8);
        flash.position.set(0, 0.05, -0.7);
        this.mesh.add(flash);
        
        const sprite = new THREE.Mesh(
            new THREE.PlaneGeometry(0.3, 0.3),
            new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0
            })
        );
        sprite.position.set(0, 0.05, -0.75);
        sprite.lookAt(0, 0, -1);
        this.mesh.add(sprite);
        
        return { light: flash, sprite: sprite };
    }
    
    update(dt, time) {
        // Handle reloading
        if (this.reloading) {
            this.reloadTimer += dt * 1000;
            const stage = Game.ReloadStages[this.reloadStage];
            
            if (this.reloadTimer >= stage.duration) {
                this.reloadStage++;
                this.reloadTimer = 0;
                
                // Animate rammer during stage 7-9
                if (this.reloadStage === 7) {
                    this.animateRammerOut();
                } else if (this.reloadStage === 9) {
                    this.animateRammerIn();
                }
                
                // Hammer animation
                if (this.reloadStage === 1) {
                    this.hammer.rotation.z = -0.1; // Half cock
                } else if (this.reloadStage === 10) {
                    this.hammer.rotation.z = -0.6; // Full cock
                }
                
                // Frizzen animation
                if (this.reloadStage === 3) {
                    this.frizzen.rotation.x = 0.5; // Open
                } else if (this.reloadStage === 4) {
                    this.frizzen.rotation.x = 0; // Closed
                }
                
                if (this.reloadStage >= Game.ReloadStages.length) {
                    this.reloading = false;
                    this.reloadStage = 0;
                    this.loaded = true;
                    this.cocked = true;
                }
            }
        }
        
        // Muzzle flash fade
        if (this.flash.sprite.material.opacity > 0) {
            this.flash.sprite.material.opacity -= dt * 10;
            this.flash.light.intensity = this.flash.sprite.material.opacity * 5;
        }
        
        // Position musket relative to camera
        this.updatePosition();
    }
    
    animateRammerOut() {
        this.ramrod.position.y = 0.02;
        this.ramrod.position.z = 0.1;
        this.ramrod.rotation.x = Math.PI / 2 - 0.3;
    }
    
    animateRammerIn() {
        this.ramrod.position.set(0, -0.04, -0.2);
        this.ramrod.rotation.x = Math.PI / 2;
    }
    
    updatePosition() {
        if (this.aiming) {
            // Iron sights position - aligned with camera center
            this.mesh.position.set(0, -0.06, 0.15);
            this.mesh.rotation.set(0, 0, this.tilt);
        } else {
            // Hip position
            this.mesh.position.set(0.12, -0.12, 0.25);
            this.mesh.rotation.set(0.1, 0.15, this.tilt - 0.05);
        }
    }
    
    aim(active) {
        this.aiming = active;
    }
    
    tiltMusket(direction) {
        this.tilt += direction * 0.02;
        this.tilt = Math.max(-0.3, Math.min(0.3, this.tilt));
    }
    
    fire() {
        if (!this.loaded || !this.cocked || this.reloading) {
            if (!this.loaded) this.player.setStatus('Click! Barrel empty', 'reloading');
            else if (!this.cocked) this.player.setStatus('Click! Hammer down', 'reloading');
            return false;
        }
        
        // Fire!
        this.loaded = false;
        this.cocked = false;
        this.hammer.rotation.z = 0; // Hammer falls
        
        // Muzzle flash
        this.flash.sprite.material.opacity = 1;
        this.flash.light.intensity = 5;
        
        // Recoil animation
        this.player.applyRecoil();
        
        this.player.setStatus('FIRED - RELOAD REQUIRED', 'reloading');
        return true;
    }
    
    startReload() {
        if (this.reloading || this.loaded) {
            if (this.loaded) this.player.setStatus('Already loaded', 'ready');
            return;
        }
        
        this.reloading = true;
        this.reloadStage = 0;
        this.reloadTimer = 0;
    }
    
    getReloadStatus() {
        if (!this.reloading) return this.loaded ? 'Ready to fire' : 'Empty - Press Reload';
        return Game.ReloadStages[this.reloadStage].name;
    }
}

class Player {
    constructor(id, canvas, keys) {
        this.id = id;
        this.canvas = canvas;
        this.keys = keys;
        this.health = 100;
        this.kills = 0;
        this.deaths = 0;
        
        // Position
        this.position = new THREE.Vector3(
            id === 1 ? -10 : 10,
            1.6,
            id === 1 ? 0 : 0
        );
        this.rotation = new THREE.Euler(0, id === 1 ? 0 : Math.PI, 0);
        this.velocity = new THREE.Vector3();
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, 2, 0.1, 1000);
        this.camera.position.copy(this.position);
        this.camera.rotation.copy(this.rotation);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.autoClear = false;
        
        // Weapon - attached to camera
        this.musket = new Musket(this);
        this.camera.add(this.musket.mesh);
        
        // Input state
        this.input = { 
            forward: false, back: false, left: false, right: false,
            tiltLeft: false, tiltRight: false, aim: false
        };
        this.recoil = 0;
        
        // Respawn timer
        this.dead = false;
        this.respawnTimer = 0;
    }
    
    applyRecoil() {
        this.recoil = 0.15;
        this.rotation.x += 0.1;
    }
    
    setStatus(text, type) {
        const el = document.getElementById(`p${this.id}Status`);
        el.textContent = text;
        el.className = 'status ' + type;
    }
    
    takeDamage(amount, fromPlayer) {
        this.health -= amount;
        document.getElementById(`p${this.id}Health`).textContent = `Health: ${Math.max(0, this.health)}`;
        
        if (this.health <= 0 && !this.dead) {
            this.die(fromPlayer);
        }
    }
    
    die(killer) {
        this.dead = true;
        this.deaths++;
        killer.kills++;
        
        document.getElementById(`p${killer.id}Hud`).innerHTML += 
            `<div style="color:#6f6">KILL!</div>`;
        
        setTimeout(() => this.respawn(), 2000);
        
        if (killer.kills >= Game.killsToWin) {
            endGame(killer);
        }
    }
    
    respawn() {
        this.dead = false;
        this.health = 100;
        this.position.set(
            this.id === 1 ? -10 : 10,
            1.6,
            (Math.random() - 0.5) * 20
        );
        this.rotation.set(0, this.id === 1 ? 0 : Math.PI, 0);
        this.velocity.set(0, 0, 0);
        this.musket.loaded = true;
        this.musket.cocked = true;
        this.musket.reloading = false;
        this.musket.hammer.rotation.z = -0.6;
        
        document.getElementById(`p${this.id}Health`).textContent = 'Health: 100';
        this.setStatus('Respawned - Ready', 'ready');
        document.getElementById(`p${this.id}Ammo`).textContent = 'Round in barrel: Yes';
    }
    
    update(dt) {
        if (this.dead) return;
        
        // Movement
        const speed = 4;
        const move = new THREE.Vector3();
        
        if (this.input.forward) move.z -= 1;
        if (this.input.back) move.z += 1;
        if (this.input.left) move.x -= 1;
        if (this.input.right) move.x += 1;
        
        move.normalize().multiplyScalar(speed * dt);
        move.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
        
        this.position.add(move);
        
        // Arena bounds
        this.position.x = Math.max(-Game.arenaSize/2 + 1, Math.min(Game.arenaSize/2 - 1, this.position.x));
        this.position.z = Math.max(-Game.arenaSize/2 + 1, Math.min(Game.arenaSize/2 - 1, this.position.z));
        
        // Mouse look (simplified to arrow key style)
        if (this.input.tiltLeft) this.rotation.y += 2 * dt;
        if (this.input.tiltRight) this.rotation.y -= 2 * dt;
        
        // Recoil recovery
        if (this.recoil > 0) {
            this.recoil -= dt * 2;
            this.rotation.x -= dt * 2;
        }
        
        // Update camera
        this.camera.position.copy(this.position);
        this.camera.rotation.copy(this.rotation);
        
        // Update musket
        this.musket.aim(this.input.aim);
        if (this.input.tiltLeft) this.musket.tiltMusket(-1);
        if (this.input.tiltRight) this.musket.tiltMusket(1);
        this.musket.update(dt);
        
        // Update HUD
        document.getElementById(`p${this.id}Ammo`).textContent = 
            `Round: ${this.musket.loaded ? 'Ready' : 'Empty'}`;
        if (!this.musket.reloading && !this.musket.loaded) {
            this.setStatus('PRESS RELOAD', 'reloading');
        } else if (this.musket.reloading) {
            this.setStatus(this.musket.getReloadStatus(), 'reloading');
        } else if (this.musket.loaded && this.musket.cocked) {
            this.setStatus('Ready to fire' + (this.input.aim ? ' [IRON SIGHTS]' : ''), 'ready');
        }
    }
    
    render() {
        // Add camera to scene so attached musket gets rendered
        Game.scene.add(this.camera);
        this.camera.updateMatrixWorld();
        
        // Render everything
        this.renderer.clear();
        this.renderer.render(Game.scene, this.camera);
        
        // Remove camera from scene (don't leave it there for other players)
        Game.scene.remove(this.camera);
    }
}

class Bullet {
    constructor(position, direction, owner) {
        this.position = position.clone();
        this.velocity = direction.clone().multiplyScalar(80);
        this.owner = owner;
        this.life = 2;
        this.gravity = -9.8;
        
        // Visual
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.015, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0x222222 })
        );
        this.mesh.position.copy(this.position);
        Game.scene.add(this.mesh);
        
        // Trail
        this.trail = [];
    }
    
    update(dt) {
        this.life -= dt;
        
        // Apply gravity
        this.velocity.y += this.gravity * dt;
        
        // Move
        this.position.add(this.velocity.clone().multiplyScalar(dt));
        this.mesh.position.copy(this.position);
        
        // Trail
        this.trail.push(this.position.clone());
        if (this.trail.length > 10) this.trail.shift();
        
        // Check collisions with players
        for (let player of Game.players) {
            if (player === this.owner || player.dead) continue;
            
            const dist = this.position.distanceTo(player.position);
            if (dist < 0.5) {
                player.takeDamage(50, this.owner);
                return false; // Destroy bullet
            }
        }
        
        // Ground collision
        if (this.position.y < 0) return false;
        
        return this.life > 0;
    }
    
    destroy() {
        Game.scene.remove(this.mesh);
    }
}

function createArena() {
    const scene = new THREE.Scene();
    scene.background = null; // Use sky dome instead
    scene.fog = new THREE.Fog(0x87CEEB, 20, 90);
    
    // Ground with texture-like appearance
    const groundGeo = new THREE.PlaneGeometry(Game.arenaSize, Game.arenaSize, 20, 20);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x5a8c69 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Grass patches/details
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x4a7c59 });
    for (let i = 0; i < 50; i++) {
        const patch = new THREE.Mesh(
            new THREE.ConeGeometry(0.1 + Math.random() * 0.1, 0.2, 4),
            grassMat
        );
        patch.position.set(
            (Math.random() - 0.5) * Game.arenaSize,
            0.1,
            (Math.random() - 0.5) * Game.arenaSize
        );
        scene.add(patch);
    }
    
    // Stone walls - strategic cover
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
    const wallPositions = [
        { x: 0, z: 8, ry: 0 },
        { x: 0, z: -8, ry: 0 },
        { x: 8, z: 0, ry: Math.PI/2 },
        { x: -8, z: 0, ry: Math.PI/2 },
        { x: 6, z: 6, ry: Math.PI/4 },
        { x: -6, z: -6, ry: Math.PI/4 }
    ];
    
    wallPositions.forEach(pos => {
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.8, 0.6),
            wallMat
        );
        wall.position.set(pos.x, 0.9, pos.z);
        wall.rotation.y = pos.ry;
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);
    });
    
    // Barrels for additional cover
    const barrelMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        const radius = 15 + Math.random() * 5;
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.35, 0.9, 8),
            barrelMat
        );
        barrel.position.set(
            Math.cos(angle) * radius,
            0.45,
            Math.sin(angle) * radius
        );
        barrel.castShadow = true;
        scene.add(barrel);
    }
    
    // Boundary markers (fences)
    const fenceMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
    for (let i = 0; i < 20; i++) {
        const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 1.2, 0.15),
            fenceMat
        );
        const angle = (i / 20) * Math.PI * 2;
        post.position.set(
            Math.cos(angle) * (Game.arenaSize/2 - 0.5),
            0.6,
            Math.sin(angle) * (Game.arenaSize/2 - 0.5)
        );
        scene.add(post);
    }
    
    // Sky dome
    const skyGeo = new THREE.SphereGeometry(80, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide,
        fog: false
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
    
    // Clouds
    const cloudMat = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.6 
    });
    for (let i = 0; i < 15; i++) {
        const cloud = new THREE.Mesh(
            new THREE.SphereGeometry(3 + Math.random() * 3, 8, 8),
            cloudMat
        );
        cloud.position.set(
            (Math.random() - 0.5) * 100,
            25 + Math.random() * 15,
            (Math.random() - 0.5) * 100
        );
        cloud.scale.x = 2 + Math.random();
        scene.add(cloud);
    }
    
    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    
    const sun = new THREE.DirectionalLight(0xfffaee, 0.9);
    sun.position.set(30, 80, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    scene.add(sun);
    
    return scene;
}

function init() {
    // Create shared scene
    Game.scene = createArena();
    
    // Create players
    const p1 = new Player(1, document.getElementById('canvas1'), {
        forward: 'w', back: 's', left: 'a', right: 'd',
        tiltLeft: 'q', tiltRight: 'e', aim: 'x', fire: 'f', reload: 'r'
    });
    
    const p2 = new Player(2, document.getElementById('canvas2'), {
        forward: 'i', back: 'k', left: 'j', right: 'l',
        tiltLeft: 'u', tiltRight: 'o', aim: 'm', fire: 'n', reload: 'b'
    });
    
    Game.players = [p1, p2];
    
    // Input handling
    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));
    
    // Handle resize
    window.addEventListener('resize', onResize);
    onResize();
}

function handleKey(e, pressed) {
    if (!Game.started) return;
    
    const key = e.key.toLowerCase();
    
    for (let player of Game.players) {
        const k = player.keys;
        if (key === k.forward) player.input.forward = pressed;
        if (key === k.back) player.input.back = pressed;
        if (key === k.left) player.input.left = pressed;
        if (key === k.right) player.input.right = pressed;
        if (key === k.tiltLeft) player.input.tiltLeft = pressed;
        if (key === k.tiltRight) player.input.tiltRight = pressed;
        if (key === k.aim) player.input.aim = pressed;
        
        if (pressed && key === k.fire) {
            if (player.musket.fire()) {
                // Spawn bullet
                const direction = new THREE.Vector3(0, 0, -1);
                direction.applyEuler(player.camera.rotation);
                
                const spawnPos = player.position.clone();
                spawnPos.y += 0.1;
                spawnPos.add(direction.clone().multiplyScalar(0.5));
                
                Game.bullets.push(new Bullet(spawnPos, direction, player));
            }
        }
        
        if (pressed && key === k.reload) {
            player.musket.startReload();
        }
    }
}

function onResize() {
    const container = document.getElementById('gameContainer');
    const views = document.querySelectorAll('.playerView');
    
    views.forEach((view, i) => {
        const canvas = view.querySelector('canvas');
        const player = Game.players[i];
        if (player) {
            player.renderer.setSize(view.clientWidth, view.clientHeight);
            player.camera.aspect = view.clientWidth / view.clientHeight;
            player.camera.updateProjectionMatrix();
        }
    });
}

function startGame() {
    document.getElementById('instructions').style.display = 'none';
    Game.started = true;
    
    if (Game.players.length === 0) {
        init();
    }
    
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    document.getElementById('winner').style.display = 'none';
    Game.players.forEach(p => {
        p.kills = 0;
        p.deaths = 0;
        p.health = 100;
        p.respawn();
    });
    Game.started = true;
}

function endGame(winner) {
    Game.started = false;
    document.getElementById('winnerText').textContent = `PLAYER ${winner.id} WINS!`;
    document.getElementById('winnerText').style.color = winner.id === 1 ? '#6af' : '#f66';
    document.getElementById('winner').style.display = 'block';
}

let lastTime = 0;
function gameLoop(time) {
    if (!Game.started) return;
    
    const dt = Math.min((time - lastTime) / 1000, 0.1) || 0.016;
    lastTime = time;
    
    // Update players
    Game.players.forEach(p => p.update(dt));
    
    // Update bullets
    Game.bullets = Game.bullets.filter(b => {
        const alive = b.update(dt);
        if (!alive) b.destroy();
        return alive;
    });
    
    // Render
    Game.players.forEach(p => p.render());
    
    requestAnimationFrame(gameLoop);
}

// Auto-init on load
window.onload = init;
