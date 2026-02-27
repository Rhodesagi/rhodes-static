/**
 * A Musket Duel IV - Main Game
 * Two-player local multiplayer musket combat
 */

class Game {
    constructor() {
        this.scene = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        this.player1 = null;
        this.player2 = null;
        
        this.p1Status = null;
        this.p2Status = null;
        this.p1Flash = null;
        this.p2Flash = null;
        this.p1Muzzle = null;
        this.p2Muzzle = null;
        
        this.projectiles = [];
        this.smokeParticles = [];
        
        this.audioContext = null;
        
        this.init();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 80);
        
        // Lighting
        const ambient = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambient);
        
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        this.scene.add(sun);
        
        // Ground
        this.createGround();
        
        // Environment
        this.createEnvironment();
        
        // Players
        this.player1 = new Player(1, new THREE.Vector3(-10, 0, 0), 0);
        this.player2 = new Player(2, new THREE.Vector3(10, 0, 0), Math.PI);
        
        this.scene.add(this.player1.mesh);
        this.scene.add(this.player2.mesh);
        
        // Cameras in scene (for rendering to split screen)
        this.scene.add(this.player1.camera);
        this.scene.add(this.player2.camera);
        
        // Add muskets to cameras
        this.player1.addMusketToCamera(this.scene);
        this.player2.addMusketToCamera(this.scene);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.autoClear = false;
        
        // Setup DOM
        this.setupDOM();
        
        // Resize handler
        window.addEventListener('resize', () => this.onResize());
        
        // Setup musket callbacks
        this.player1.musket.onFire = () => this.onFire(this.player1, this.player2);
        this.player2.musket.onFire = () => this.onFire(this.player2, this.player1);
        
        this.player1.musket.onStateChange = (text) => this.updateStatus(1, text);
        this.player2.musket.onStateChange = (text) => this.updateStatus(2, text);
        
        // Start button
        document.getElementById('start-btn').addEventListener('click', () => {
            document.getElementById('start-screen').classList.add('hidden');
            this.initAudio();
            this.animate();
        });
    }
    
    setupDOM() {
        const p1View = document.getElementById('p1-view');
        const p2View = document.getElementById('p2-view');
        
        p1View.appendChild(this.renderer.domElement);
        
        // Create status displays
        this.p1Status = document.createElement('div');
        this.p1Status.className = 'reload-status';
        this.p1Status.textContent = 'EMPTY - Press reload to start';
        p1View.appendChild(this.p1Status);
        
        this.p2Status = document.createElement('div');
        this.p2Status.className = 'reload-status';
        this.p2Status.textContent = 'EMPTY - Press reload to start';
        p2View.appendChild(this.p2Status);
        
        // Hit flashes
        this.p1Flash = document.createElement('div');
        this.p1Flash.className = 'hit-flash';
        p1View.appendChild(this.p1Flash);
        
        this.p2Flash = document.createElement('div');
        this.p2Flash.className = 'hit-flash';
        p2View.appendChild(this.p2Flash);
        
        // Muzzle flashes
        this.p1Muzzle = document.createElement('div');
        this.p1Muzzle.className = 'muzzle-flash';
        p1View.appendChild(this.p1Muzzle);
        
        this.p2Muzzle = document.createElement('div');
        this.p2Muzzle.className = 'muzzle-flash';
        p2View.appendChild(this.p2Muzzle);
    }
    
    createGround() {
        // Grass terrain
        const groundGeo = new THREE.PlaneGeometry(100, 100, 50, 50);
        
        // Add some noise to vertices for uneven terrain
        const pos = groundGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const height = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 +
                          Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.2;
            pos.setZ(i, height);
        }
        groundGeo.computeVertexNormals();
        
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: 0x3a5f3a,
            roughness: 0.9
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);
    }
    
    createEnvironment() {
        // Trees
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 15 + Math.random() * 30;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            this.createTree(x, z);
        }
        
        // Rocks
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 60;
            const z = (Math.random() - 0.5) * 60;
            this.createRock(x, z);
        }
        
        // Fencing
        for (let i = 0; i < 40; i++) {
            const angle = (i / 40) * Math.PI * 2;
            const x = Math.cos(angle) * 19;
            const z = Math.sin(angle) * 19;
            this.createFencePost(x, z, angle + Math.PI / 2);
        }
    }
    
    createTree(x, z) {
        const group = new THREE.Group();
        
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1;
        group.add(trunk);
        
        // Foliage (multiple layers)
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2d5a2d });
        
        for (let i = 0; i < 3; i++) {
            const size = 1.5 - i * 0.3;
            const y = 2.5 + i * 0.8;
            const foliageGeo = new THREE.ConeGeometry(size, 1.5, 6);
            const foliage = new THREE.Mesh(foliageGeo, foliageMat);
            foliage.position.y = y;
            group.add(foliage);
        }
        
        group.position.set(x, 0, z);
        const scale = 0.8 + Math.random() * 0.4;
        group.scale.set(scale, scale, scale);
        this.scene.add(group);
    }
    
    createRock(x, z) {
        const rockGeo = new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5, 0);
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(x, 0.3, z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        this.scene.add(rock);
    }
    
    createFencePost(x, z, rot) {
        const postGeo = new THREE.BoxGeometry(0.1, 1.2, 0.1);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(x, 0.6, z);
        post.rotation.y = rot;
        this.scene.add(post);
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    playShootSound() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const noise = this.audioContext.createBufferSource();
        
        // Create noise buffer
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;
        
        // Mix
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        noise.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        noise.start();
        
        // Oscillator for boom
        osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.8, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
    }
    
    onFire(shooter, target) {
        // Play sound
        this.playShootSound();
        
        // Muzzle flash effect
        const flash = shooter.id === 1 ? this.p1Muzzle : this.p2Muzzle;
        flash.classList.add('active');
        setTimeout(() => flash.classList.remove('active'), 100);
        
        // Create smoke
        this.createSmoke(shooter.getMuzzlePosition());
        
        // Raycast for hit
        const origin = shooter.getMuzzlePosition();
        const direction = shooter.getAimDirection();
        
        // Simple ray-sphere intersection with target
        const hit = this.checkHit(origin, direction, target);
        
        if (hit && target.alive) {
            target.takeDamage();
            
            // Hit flash
            const targetFlash = target.id === 1 ? this.p1Flash : this.p2Flash;
            targetFlash.classList.add('active');
            setTimeout(() => targetFlash.classList.remove('active'), 200);
            
            // Score notification (console for now)
            console.log(`Player ${shooter.id} hit Player ${target.id}!`);
        }
        
        // Add projectile trail
        this.projectiles.push({
            origin: origin.clone(),
            direction: direction.clone(),
            distance: 0,
            maxDistance: 100,
            life: 0.5
        });
    }
    
    checkHit(origin, direction, target) {
        // Ray-sphere intersection
        const toTarget = target.position.clone().sub(origin);
        toTarget.y = 0; // Flatten toXZ plane for simpler check
        
        const proj = toTarget.dot(direction);
        if (proj < 0) return false;
        
        const closest = origin.clone().add(direction.clone().multiplyScalar(proj));
        const dist = closest.distanceTo(target.position);
        
        // Also check height for headshot potential
        const heightDiff = Math.abs(origin.y - target.height);
        const verticalSpread = Math.random() * 0.3; // Musket inaccuracy
        
        return dist < 0.5 && Math.random() > 0.1; // 90% hit chance if aimed well
    }
    
    createSmoke(pos) {
        for (let i = 0; i < 10; i++) {
            const smoke = {
                mesh: this.createSmokeParticle(),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    1 + Math.random() * 2,
                    (Math.random() - 0.5) * 2
                ),
                life: 2.0 + Math.random()
            };
            smoke.mesh.position.copy(pos);
            this.scene.add(smoke.mesh);
            this.smokeParticles.push(smoke);
        }
    }
    
    createSmokeParticle() {
        const geo = new THREE.SphereGeometry(0.1 + Math.random() * 0.2, 6, 6);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.6
        });
        return new THREE.Mesh(geo, mat);
    }
    
    updateStatus(playerId, text) {
        if (playerId === 1) {
            this.p1Status.textContent = text;
        } else {
            this.p2Status.textContent = text;
        }
    }
    
    updateProjectiles(deltaTime) {
        // Visual projectile trails
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.life -= deltaTime;
            p.distance += 50 * deltaTime;
            
            if (p.life <= 0 || p.distance > p.maxDistance) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    updateSmoke(deltaTime) {
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const s = this.smokeParticles[i];
            s.life -= deltaTime;
            
            s.mesh.position.add(s.velocity.clone().multiplyScalar(deltaTime));
            s.mesh.scale.multiplyScalar(1.02);
            s.mesh.material.opacity = s.life * 0.3;
            
            if (s.life <= 0) {
                this.scene.remove(s.mesh);
                this.smokeParticles.splice(i, 1);
            }
        }
    }
    
    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.renderer.setSize(width, height);
        
        this.player1.camera.aspect = width / (height / 2);
        this.player1.camera.updateProjectionMatrix();
        
        this.player2.camera.aspect = width / (height / 2);
        this.player2.camera.updateProjectionMatrix();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = Math.min(this.clock.getDelta(), 0.1);
        
        // Get input
        const p1Input = input.getP1State();
        const p2Input = input.getP2State();
        
        // Update players
        this.player1.update(deltaTime, p1Input, this.player2);
        this.player2.update(deltaTime, p2Input, this.player1);
        
        // Update effects
        this.updateProjectiles(deltaTime);
        this.updateSmoke(deltaTime);
        
        // Render split screen
        const width = window.innerWidth;
        const height = window.innerHeight;
        const halfHeight = height / 2;
        
        this.renderer.setViewport(0, halfHeight, width, halfHeight);
        this.renderer.setScissor(0, halfHeight, width, halfHeight);
        this.renderer.setScissorTest(true);
        this.renderer.render(this.scene, this.player1.camera);
        
        this.renderer.setViewport(0, 0, width, halfHeight);
        this.renderer.setScissor(0, 0, width, halfHeight);
        this.renderer.render(this.scene, this.player2.camera);
        
        this.renderer.setScissorTest(false);
    }
}

// Start game when loaded
window.addEventListener('load', () => {
    new Game();
});
