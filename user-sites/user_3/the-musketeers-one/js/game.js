class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 60);
        this.isRunning = false;
        this.clock = new THREE.Clock();
        this.ballistics = new BallisticsManager(this.scene);
        this.player1 = new Player(this, false);
        this.player2 = new Player(this, true);
        this.players = [this.player1, this.player2];
        this.renderer = new SplitScreenRenderer(this.canvas, this.player1, this.player2);
        this.buildArena();
        this.setupLighting();
        this.scores = { p1: 0, p2: 0 };
        document.getElementById('startBtn').addEventListener('click', () => this.start());
    }
    
    buildArena() {
        const groundGeometry = new THREE.PlaneGeometry(60, 60, 32, 32);
        const positions = groundGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const height = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5;
            positions.setZ(i, height);
        }
        groundGeometry.computeVertexNormals();
        const ground = new THREE.Mesh(groundGeometry, new THREE.MeshLambertMaterial({ color: 0x4A6741, side: THREE.DoubleSide }));
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);
        this.createTree(-8, -8); this.createTree(8, -6); this.createTree(-6, 8); this.createTree(7, 7);
        this.createTree(-10, 0); this.createTree(10, 2); this.createTree(0, -10); this.createTree(0, 10);
        this.createRock(-4, -4); this.createRock(4, 4); this.createRock(-5, 5);
        this.createBoundary();
        for (let i = 0; i < 50; i++) this.createGrassTuft((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40);
    }
    
    createTree(x, z) {
        const treeGroup = new THREE.Group();
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4A3728 });
        const foliageMat = new THREE.MeshLambertMaterial({ color: 0x2D5016 });
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 3, 8), trunkMat);
        trunk.position.y = 1.5;
        treeGroup.add(trunk);
        treeGroup.add(new THREE.Mesh(new THREE.ConeGeometry(2.5, 2, 8), foliageMat)).position.y = 3;
        treeGroup.add(new THREE.Mesh(new THREE.ConeGeometry(2, 1.8, 8), foliageMat)).position.y = 4;
        treeGroup.add(new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.5, 8), foliageMat)).position.y = 5;
        treeGroup.position.set(x, 0, z);
        this.scene.add(treeGroup);
        treeGroup.userData = { isSolid: true, radius: 1 };
    }
    
    createRock(x, z) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(Math.random() * 0.5 + 0.8, 0), new THREE.MeshLambertMaterial({ color: 0x666666 }));
        rock.position.set(x, 0.5, z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        this.scene.add(rock);
        rock.userData = { isSolid: true, radius: 0.8 };
    }
    
    createBoundary() {
        const wallMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        for (let x = -15; x <= 15; x += 3) { this.createWallSegment(x, -15, wallMat); this.createWallSegment(x, 15, wallMat); }
        for (let z = -12; z <= 12; z += 3) { this.createWallSegment(-15, z, wallMat); this.createWallSegment(15, z, wallMat); }
    }
    
    createWallSegment(x, z, material) {
        if (Math.random() > 0.7) return;
        const wall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.5), material);
        wall.position.set(x, 0.5, z);
        wall.rotation.y = Math.random() * 0.3;
        this.scene.add(wall);
    }
    
    createGrassTuft(x, z) {
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 4), new THREE.MeshLambertMaterial({ color: 0x5A7D52 }));
        tuft.position.set(x, 0.15, z);
        this.scene.add(tuft);
    }
    
    setupLighting() {
        this.scene.add(new THREE.AmbientLight(0x404040, 0.6));
        const sun = new THREE.DirectionalLight(0xFFF8DC, 0.8);
        sun.position.set(50, 100, 50);
        this.scene.add(sun);
        this.scene.add(new THREE.HemisphereLight(0x87CEEB, 0x4A6741, 0.4));
    }
    
    start() {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('ui').style.display = 'block';
        document.getElementById('vignette').style.display = 'block';
        this.isRunning = true;
        this.loop();
    }
    
    loop() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this.loop());
        const deltaTime = this.clock.getDelta();
        this.player1.update(deltaTime);
        this.player2.update(deltaTime);
        this.ballistics.update(deltaTime);
        this.ballistics.checkHits(this.players);
        this.checkCollisions();
        this.renderer.render(this.scene);
    }
    
    checkCollisions() {
        this.scene.traverse((obj) => {
            if (obj.userData.isSolid) {
                for (const player of this.players) {
                    if (!player.alive) continue;
                    const dx = player.position.x - obj.position.x;
                    const dz = player.position.z - obj.position.z;
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    const minDist = obj.userData.radius + 0.3;
                    if (dist < minDist) {
                        const pushX = (dx / dist) * (minDist - dist);
                        const pushZ = (dz / dist) * (minDist - dist);
                        player.position.x += pushX;
                        player.position.z += pushZ;
                    }
                }
            }
        });
        const dx = this.player1.position.x - this.player2.position.x;
        const dz = this.player1.position.z - this.player2.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const minPlayerDist = 0.8;
        if (dist < minPlayerDist && dist > 0) {
            const pushX = (dx / dist) * (minPlayerDist - dist) * 0.5;
            const pushZ = (dz / dist) * (minPlayerDist - dist) * 0.5;
            this.player1.position.x += pushX;
            this.player1.position.z += pushZ;
            this.player2.position.x -= pushX;
            this.player2.position.z -= pushZ;
        }
    }
    
    onPlayerDeath(deadPlayer) {
        const winner = deadPlayer === this.player1 ? this.player2 : this.player1;
        if (deadPlayer === this.player1) this.scores.p2++; else this.scores.p1++;
        this.showKillMessage(winner);
        setTimeout(() => { this.player1.respawn(); this.player2.respawn(); }, 3000);
    }
    
    showKillMessage(winner) {
        const msg = document.createElement('div');
        msg.textContent = winner.isPlayer2 ? 'PLAYER 2 SCORES!' : 'PLAYER 1 SCORES!';
        msg.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #CD853F; font-size: 36px; font-weight: bold; text-shadow: 3px 3px 0 #000; z-index: 300; pointer-events: none;';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    }
}

window.addEventListener('load', () => { window.game = new Game(); });
