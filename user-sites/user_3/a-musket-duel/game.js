// A MUSKET DUEL - Fixed dual-viewport rendering
class Musket {
    constructor(scene, isPlayer2 = false) {
        this.scene = scene;
        this.isPlayer2 = isPlayer2;
        this.loaded = true;
        this.reloading = false;
        this.reloadProgress = 0;
        this.tiltAngle = 0;
        this.aiming = false;
        this.reloadSteps = ["Half-cock...","Pour powder...","Patch and ball...","Ram home...","Prime pan...","Full cock...","READY"];
        this.musketGroup = new THREE.Group();
        this.createMusketModel();
        this.musketGroup.visible = false;
        scene.add(this.musketGroup);
    }
    createMusketModel() {
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8, roughness: 0.3 });
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xb5a642, metalness: 0.7, roughness: 0.4 });
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.8), woodMat);
        stock.position.set(0, -0.05, 0.3);
        this.musketGroup.add(stock);
        const butt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.05), steelMat);
        butt.position.set(0, -0.05, 0.72);
        this.musketGroup.add(butt);
        const barrelGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.0, 12);
        barrelGeo.computeVertexNormals();
        const barrel = new THREE.Mesh(barrelGeo, steelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.2);
        this.musketGroup.add(barrel);
        for(let i = 0; i < 3; i++) {
            const bandGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.04, 12);
            bandGeo.computeVertexNormals();
            const band = new THREE.Mesh(bandGeo, brassMat);
            band.rotation.x = Math.PI / 2;
            band.position.set(0, 0.02, -0.1 - i * 0.3);
            this.musketGroup.add(band);
        }
        const lock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.15), steelMat);
        lock.position.set(0.06, 0.02, 0.1);
        this.musketGroup.add(lock);
        const hammerGeo = new THREE.BoxGeometry(0.02, 0.08, 0.04);
        this.hammer = new THREE.Mesh(hammerGeo, steelMat);
        this.hammer.position.set(0.08, 0.08, 0.15);
        this.hammer.rotation.z = -0.3;
        this.musketGroup.add(this.hammer);
        this.frizzen = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.05), steelMat);
        this.frizzen.position.set(0.08, 0.06, 0.08);
        this.frizzen.rotation.z = 0.2;
        this.musketGroup.add(this.frizzen);
        const guardGeo = new THREE.TorusGeometry(0.04, 0.008, 6, 12, Math.PI);
        const guard = new THREE.Mesh(guardGeo, brassMat);
        guard.rotation.z = Math.PI / 2;
        guard.position.set(0, -0.08, 0.15);
        this.musketGroup.add(guard);
        this.trigger = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.04, 0.01), steelMat);
        this.trigger.position.set(0, -0.08, 0.12);
        this.musketGroup.add(this.trigger);
        const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.025, 0.01), steelMat);
        frontSight.position.set(0, 0.055, -0.65);
        this.musketGroup.add(frontSight);
        const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.02, 0.02), steelMat);
        rearSight.position.set(0, 0.04, -0.05);
        this.musketGroup.add(rearSight);
    }
    aim(camera) {
        this.aiming = true;
        this.musketGroup.visible = true;
        this.updatePosition(camera);
    }
    stopAim() {
        this.aiming = false;
        this.musketGroup.visible = false;
    }
    updatePosition(camera) {
        if (!this.aiming) return;
        this.musketGroup.position.copy(camera.position);
        this.musketGroup.quaternion.copy(camera.quaternion);
        const offset = new THREE.Vector3(this.isPlayer2 ? 0.15 : -0.15, -0.12, 0.25);
        offset.applyQuaternion(camera.quaternion);
        this.musketGroup.position.add(offset);
        this.musketGroup.rotateZ(this.tiltAngle);
    }
    setTilt(angle) { this.tiltAngle = Math.max(-0.4, Math.min(0.4, angle)); }
    fire(camera) {
        if (!this.loaded || this.reloading) return null;
        this.loaded = false;
        this.hammer.rotation.z = 0.1;
        const muzzlePos = new THREE.Vector3(0, 0.02, -0.7);
        muzzlePos.applyQuaternion(this.musketGroup.quaternion);
        muzzlePos.add(this.musketGroup.position);
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.tiltAngle);
        const spread = 0.015;
        direction.x += (Math.random() - 0.5) * spread;
        direction.y += (Math.random() - 0.5) * spread;
        direction.normalize();
        this.createMuzzleFlash(muzzlePos);
        return { origin: muzzlePos, direction: direction, velocity: 180, damage: 100 };
    }
    createMuzzleFlash(position) {
        const flash = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.9 }));
        flash.position.copy(position);
        this.scene.add(flash);
        const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.5 }));
        smoke.position.copy(position);
        this.scene.add(smoke);
        let opacity = 0.9;
        const fade = () => {
            opacity -= 0.1;
            flash.material.opacity = opacity;
            smoke.material.opacity = opacity * 0.5;
            smoke.scale.multiplyScalar(1.1);
            if (opacity > 0) requestAnimationFrame(fade);
            else { this.scene.remove(flash); this.scene.remove(smoke); }
        };
        fade();
    }
    startReload(onStep) {
        if (this.loaded || this.reloading) return;
        this.reloading = true;
        this.reloadProgress = 0;
        this.onReloadStep = onStep;
        if (onStep) onStep(this.reloadSteps[0]);
    }
    updateReload(deltaTime) {
        if (!this.reloading) return;
        this.reloadProgress += deltaTime;
        const stepTime = 0.75;
        const currentIdx = Math.floor(this.reloadProgress / stepTime);
        const prevIdx = Math.floor((this.reloadProgress - deltaTime) / stepTime);
        if (currentIdx !== prevIdx && currentIdx < this.reloadSteps.length) {
            if (this.onReloadStep) this.onReloadStep(this.reloadSteps[currentIdx]);
            this.animateStep(currentIdx);
        }
        if (this.reloadProgress >= stepTime * this.reloadSteps.length) {
            this.reloading = false;
            this.loaded = true;
            this.hammer.rotation.z = -0.3;
            if (this.onReloadStep) this.onReloadStep("");
        }
    }
    animateStep(step) {
        switch(step) {
            case 0: this.hammer.rotation.z = -0.15; break;
            case 4: this.frizzen.rotation.z = -0.3; setTimeout(() => this.frizzen.rotation.z = 0.2, 300); break;
            case 5: this.hammer.rotation.z = -0.3; break;
        }
    }
}

class Player {
    constructor(scene, isPlayer2 = false) {
        this.scene = scene;
        this.isPlayer2 = isPlayer2;
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.camera.position.y = 1.7;
        if (isPlayer2) {
            this.camera.position.set(0, 1.7, -15);
            this.camera.rotation.y = Math.PI;
        } else {
            this.camera.position.set(0, 1.7, 15);
        }
        this.moveSpeed = 3.5;
        this.rotationSpeed = 2.0;
        this.keys = {};
        this.musket = new Musket(scene, isPlayer2);
        this.health = 100;
        this.alive = true;
        this.respawnTimer = 0;
        this.score = 0;
        this.createMesh();
    }
    createMesh() {
        const group = new THREE.Group();
        const bodyMat = new THREE.MeshLambertMaterial({ color: this.isPlayer2 ? 0x1a3a5c : 0x5c1a1a });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.6, 8), bodyMat);
        body.position.y = 0.8;
        group.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshLambertMaterial({ color: 0xffdbac }));
        head.position.y = 1.75;
        group.add(head);
        const hatMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 3), hatMat);
        hatBrim.position.y = 2.0;
        hatBrim.rotation.y = Math.PI / 6;
        group.add(hatBrim);
        const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.2, 8), hatMat);
        hatTop.position.y = 2.15;
        group.add(hatTop);
        this.mesh = group;
        this.scene.add(group);
    }
    updateMesh() {
        if (this.mesh) {
            this.mesh.position.x = this.camera.position.x;
            this.mesh.position.z = this.camera.position.z;
            this.mesh.rotation.y = this.camera.rotation.y;
        }
    }
    die() {
        this.alive = false;
        this.mesh.visible = false;
        this.respawnTimer = 3;
    }
    respawn() {
        this.alive = true;
        this.health = 100;
        this.mesh.visible = true;
        if (this.isPlayer2) {
            this.camera.position.set((Math.random()-0.5)*10, 1.7, -15+(Math.random()-0.5)*5);
            this.camera.rotation.y = Math.PI;
        } else {
            this.camera.position.set((Math.random()-0.5)*10, 1.7, 15+(Math.random()-0.5)*5);
            this.camera.rotation.y = 0;
        }
    }
    update(deltaTime) {
        if (!this.alive) {
            this.respawnTimer -= deltaTime;
            if (this.respawnTimer <= 0) this.respawn();
            return;
        }
        const moveVec = new THREE.Vector3();
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.camera.rotation.y);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.camera.rotation.y);
        if (this.isPlayer2) {
            if (this.keys['KeyI']) moveVec.add(forward);
            if (this.keys['KeyK']) moveVec.sub(forward);
            if (this.keys['KeyJ']) moveVec.sub(right);
            if (this.keys['KeyL']) moveVec.add(right);
            if (this.keys['KeyU']) this.camera.rotation.y += this.rotationSpeed * deltaTime;
            if (this.keys['KeyO']) this.camera.rotation.y -= this.rotationSpeed * deltaTime;
        } else {
            if (this.keys['KeyW']) moveVec.add(forward);
            if (this.keys['KeyS']) moveVec.sub(forward);
            if (this.keys['KeyA']) moveVec.sub(right);
            if (this.keys['KeyD']) moveVec.add(right);
            if (this.keys['KeyQ']) this.camera.rotation.y += this.rotationSpeed * deltaTime;
            if (this.keys['KeyE']) this.camera.rotation.y -= this.rotationSpeed * deltaTime;
        }
        if (moveVec.length() > 0) {
            moveVec.normalize().multiplyScalar(this.moveSpeed * deltaTime);
            const newX = this.camera.position.x + moveVec.x;
            const newZ = this.camera.position.z + moveVec.z;
            if (Math.abs(newX) < 30 && Math.abs(newZ) < 30) {
                this.camera.position.x = newX;
                this.camera.position.z = newZ;
            }
        }
        this.musket.updatePosition(this.camera);
        this.musket.updateReload(deltaTime);
        this.updateMesh();
    }
    onKeyDown(code) { this.keys[code] = true; }
    onKeyUp(code) { this.keys[code] = false; }
}

class Bullet {
    constructor(scene, data) {
        this.scene = scene;
        this.origin = data.origin.clone();
        this.direction = data.direction.clone();
        this.velocity = data.velocity;
        this.damage = data.damage;
        this.distance = 0;
        this.maxDistance = 200;
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), new THREE.MeshBasicMaterial({ color: 0x1a1a1a }));
        this.mesh.position.copy(this.origin);
        scene.add(this.mesh);
    }
    update(deltaTime, players) {
        const moveDist = this.velocity * deltaTime;
        this.distance += moveDist;
        this.mesh.position.add(this.direction.clone().multiplyScalar(moveDist));
        for (const player of players) {
            if (!player.alive) continue;
            const dx = this.mesh.position.x - player.camera.position.x;
            const dz = this.mesh.position.z - player.camera.position.z;
            const dy = this.mesh.position.y - player.camera.position.y;
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (Math.sqrt(dx*dx + (dy-0.05)**2 + dz*dz) < 0.3) {
                return { hit: true, player: player, headshot: true };
            }
            if (dist < 0.4 && this.mesh.position.y > 0.5 && this.mesh.position.y < 1.8) {
                return { hit: true, player: player, headshot: false };
            }
        }
        if (this.distance > this.maxDistance) {
            this.destroy();
            return { hit: false, expired: true };
        }
        return { hit: false };
    }
    destroy() { this.scene.remove(this.mesh); }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
        this.createWorld();
        this.player1 = new Player(this.scene, false);
        this.player2 = new Player(this.scene, true);
        this.players = [this.player1, this.player2];
        this.bullets = [];
        this.setupInput();
        this.setupResize();
        this.clock = new THREE.Clock();
        this.animate();
    }
    setupResize() {
        const resize = () => {
            const container = document.getElementById('game-container');
            const w = container.clientWidth;
            const h = container.clientHeight;
            this.renderer.setSize(w, h);
            const halfW = w / 2;
            this.player1.camera.aspect = halfW / h;
            this.player1.camera.updateProjectionMatrix();
            this.player2.camera.aspect = halfW / h;
            this.player2.camera.updateProjectionMatrix();
        };
        resize();
        window.addEventListener('resize', resize);
    }
    createWorld() {
        const groundGeo = new THREE.PlaneGeometry(100, 100, 50, 50);
        const pos = groundGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const z = Math.sin(pos.getX(i)*0.1) * Math.cos(pos.getY(i)*0.1) * 0.5;
            pos.setZ(i, z);
        }
        groundGeo.computeVertexNormals();
        const ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ color: 0x3a5f3a }));
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);
        for (let i = -20; i <= 20; i += 10) {
            if (i === 0) continue;
            this.createPost(i, -20);
            this.createPost(i, 20);
        }
        this.createPost(-20, 0);
        this.createPost(20, 0);
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
            this.createTree(x, z);
        }
        this.scene.add(new THREE.AmbientLight(0x404040, 0.6));
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        this.scene.add(sun);
    }
    createPost(x, z) {
        const mat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2, 8), mat);
        post.position.set(x, 1, z);
        this.scene.add(post);
        const top = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), mat);
        top.position.set(x, 2.15, z);
        this.scene.add(top);
    }
    createTree(x, z) {
        const group = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 8), new THREE.MeshLambertMaterial({ color: 0x4a3728 }));
        trunk.position.y = 1.5;
        group.add(trunk);
        const leavesMat = new THREE.MeshLambertMaterial({ color: 0x2d5a2d });
        const l1 = new THREE.Mesh(new THREE.ConeGeometry(2, 4, 8), leavesMat);
        l1.position.y = 4;
        group.add(l1);
        const l2 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 8), leavesMat);
        l2.position.y = 5.5;
        group.add(l2);
        group.position.set(x, 0, z);
        this.scene.add(group);
    }
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.player1.onKeyDown(e.code);
            this.player2.onKeyDown(e.code);
            if (e.code === 'KeyX') {
                this.player1.musket.aim(this.player1.camera);
                document.getElementById('p1-reload').classList.add('active');
            }
            if (e.code === 'KeyF') this.fire(this.player1, 'p1');
            if (e.code === 'KeyR') this.reload(this.player1, 'p1-reload');
            if (e.code === 'KeyM') {
                this.player2.musket.aim(this.player2.camera);
                document.getElementById('p2-reload').classList.add('active');
            }
            if (e.code === 'Period') this.fire(this.player2, 'p2');
            if (e.code === 'Comma') this.reload(this.player2, 'p2-reload');
        });
        document.addEventListener('keyup', (e) => {
            this.player1.onKeyUp(e.code);
            this.player2.onKeyUp(e.code);
            if (e.code === 'KeyX') {
                this.player1.musket.stopAim();
                document.getElementById('p1-reload').classList.remove('active');
            }
            if (e.code === 'KeyM') {
                this.player2.musket.stopAim();
                document.getElementById('p2-reload').classList.remove('active');
            }
        });
    }
    fire(player, pId) {
        const data = player.musket.fire(player.camera);
        if (data) this.bullets.push(new Bullet(this.scene, data));
    }
    reload(player, indicatorId) {
        const indicator = document.getElementById(indicatorId);
        player.musket.startReload((step) => {
            indicator.innerHTML = step ? '<span class="reload-step">' + step + '</span>' : '';
            if (!step) indicator.classList.remove('active');
        });
    }
    animate() {
        requestAnimationFrame(() => this.animate());
        const dt = Math.min(this.clock.getDelta(), 0.1);
        this.player1.update(dt);
        this.player2.update(dt);
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            const r = b.update(dt, this.players);
            if (r.hit) {
                b.destroy();
                this.bullets.splice(i, 1);
                const target = r.player;
                const shooter = target === this.player1 ? this.player2 : this.player1;
                shooter.score++;
                document.getElementById(shooter === this.player1 ? 'p1-score' : 'p2-score').textContent = shooter.score;
                const hitEl = document.getElementById(target === this.player1 ? 'p1-hit' : 'p2-hit');
                hitEl.classList.add('active');
                setTimeout(() => hitEl.classList.remove('active'), 200);
                target.die();
                if (shooter.score >= 5) this.showWinner(shooter);
            } else if (r.expired) {
                this.bullets.splice(i, 1);
            }
        }
        const w = this.canvas.width;
        const h = this.canvas.height;
        const halfW = Math.floor(w / 2);
        this.renderer.setScissorTest(false);
        this.renderer.clear();
        this.renderer.setViewport(0, 0, halfW, h);
        this.renderer.setScissor(0, 0, halfW, h);
        this.renderer.setScissorTest(true);
        this.renderer.render(this.scene, this.player1.camera);
        this.renderer.setViewport(halfW, 0, w - halfW, h);
        this.renderer.setScissor(halfW, 0, w - halfW, h);
        this.renderer.render(this.scene, this.player2.camera);
    }
    showWinner(winner) {
        document.getElementById('winner-text').textContent = winner === this.player1 ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!';
        document.getElementById('winner-screen').style.display = 'flex';
    }
}

let game;
function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    game = new Game();
}
function resetGame() {
    document.getElementById('winner-screen').style.display = 'none';
    game.player1.score = 0;
    game.player2.score = 0;
    document.getElementById('p1-score').textContent = '0';
    document.getElementById('p2-score').textContent = '0';
    game.player1.respawn();
    game.player2.respawn();
}
