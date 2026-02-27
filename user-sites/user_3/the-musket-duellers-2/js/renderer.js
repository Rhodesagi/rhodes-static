/**
 * Split-Screen Renderer
 * Handles dual viewport rendering for two players
 */

class SplitScreenRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        // Main WebGL renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Viewport dimensions (each player gets 50% width)
        this.viewportWidth = this.width / 2;
        this.viewportHeight = this.height;

        // Lighting
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sunLight.position.set(50, 100, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.add(this.ambientLight);
        this.scene.add(this.sunLight);

        // Add environment
        AssetGenerator.init();
        this.environment = AssetGenerator.createEnvironment();
        this.scene.add(this.environment);

        // Bullet trails array
        this.bulletTrails = [];

        // Muzzle flashes array
        this.muzzleFlashes = [];

        // Bind resize
        window.addEventListener('resize', this.onResize.bind(this));
    }

    onResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.viewportWidth = this.width / 2;
        this.viewportHeight = this.height;
        this.renderer.setSize(this.width, this.height);
    }

    addPlayerMusket(playerId, musketMesh) {
        // Add musket to scene, positioned relative to player
        this.scene.add(musketMesh);
        return musketMesh;
    }

    updateMusketPosition(musketMesh, player) {
        // Position musket in player's view (first person)
        const offset = new THREE.Vector3(0.1, -0.15, 0.3);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);

        musketMesh.position.copy(player.position).add(offset);

        // Rotate musket to match player look
        musketMesh.rotation.set(
            player.rotation.x,
            player.rotation.y,
            0
        );

        // Additional iron sight alignment offset
        musketMesh.rotateY(-0.02); // Slight right offset for sight picture
    }

    render(player1, player2) {
        // Clear renderer
        this.renderer.setScissorTest(false);
        this.renderer.clear();

        // Render Player 1 viewport (left half)
        this.renderer.setScissorTest(true);
        this.renderer.setScissor(0, 0, this.viewportWidth, this.viewportHeight);
        this.renderer.setViewport(0, 0, this.viewportWidth, this.viewportHeight);
        this.renderer.render(this.scene, player1.camera);

        // Render Player 2 viewport (right half)
        this.renderer.setScissor(this.viewportWidth, 0, this.viewportWidth, this.viewportHeight);
        this.renderer.setViewport(this.viewportWidth, 0, this.viewportWidth, this.viewportHeight);
        this.renderer.render(this.scene, player2.camera);

        // Update bullet trails
        this.updateBulletTrails();

        // Update muzzle flashes
        this.updateMuzzleFlashes();
    }

    addBulletTrail(start, end) {
        // Create trail geometry
        const direction = end.clone().sub(start);
        const length = direction.length();
        direction.normalize();

        const trailGeo = new THREE.CylinderGeometry(0.005, 0.005, length, 4);
        trailGeo.rotateX(-Math.PI / 2);
        trailGeo.translate(0, 0, -length / 2);

        const trailMat = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });

        const trail = new THREE.Mesh(trailGeo, trailMat);
        trail.position.copy(start);
        trail.lookAt(end);
        trail.userData = { life: 0.1 };

        this.scene.add(trail);
        this.bulletTrails.push(trail);
    }

    updateBulletTrails() {
        for (let i = this.bulletTrails.length - 1; i >= 0; i--) {
            const trail = this.bulletTrails[i];
            trail.userData.life -= 0.016; // Approx 60fps
            trail.material.opacity = trail.userData.life * 8;

            if (trail.userData.life <= 0) {
                this.scene.remove(trail);
                trail.geometry.dispose();
                trail.material.dispose();
                this.bulletTrails.splice(i, 1);
            }
        }
    }

    addMuzzleFlash(position, direction) {
        const flash = AssetGenerator.createMuzzleFlash();
        flash.position.copy(position);
        flash.lookAt(position.clone().add(direction));
        this.scene.add(flash);
        this.muzzleFlashes.push(flash);
    }

    updateMuzzleFlashes() {
        for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
            const flash = this.muzzleFlashes[i];
            flash.userData.life -= 0.016;

            // Fade out
            const opacity = flash.userData.life * 10;
            if (flash.userData.core) {
                flash.userData.core.material.opacity = opacity;
            }
            if (flash.userData.outer) {
                flash.userData.outer.material.opacity = opacity * 0.5;
            }

            // Update smoke particles
            flash.children.forEach(child => {
                if (child.userData && child.userData.velocity) {
                    child.position.add(child.userData.velocity);
                    child.userData.velocity.y += 0.001; // Rise
                    child.userData.life -= 0.01;
                    child.material.opacity = child.userData.life * 0.4;
                }
            });

            if (flash.userData.life <= 0) {
                this.scene.remove(flash);
                // Clean up children
                flash.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                this.muzzleFlashes.splice(i, 1);
            }
        }
    }

    createHitEffect(position) {
        // Impact dust
        for (let i = 0; i < 5; i++) {
            const dustGeo = new THREE.SphereGeometry(0.02 + Math.random() * 0.03, 6, 6);
            const dustMat = new THREE.MeshBasicMaterial({
                color: 0x8B7355,
                transparent: true,
                opacity: 0.6
            });
            const dust = new THREE.Mesh(dustGeo, dustMat);
            dust.position.copy(position);
            dust.position.x += (Math.random() - 0.5) * 0.1;
            dust.position.y += (Math.random() - 0.5) * 0.1;
            dust.position.z += (Math.random() - 0.5) * 0.1;

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                Math.random() * 0.1,
                (Math.random() - 0.5) * 0.1
            );

            dust.userData = {
                velocity: velocity,
                life: 0.5
            };

            this.scene.add(dust);
            this.muzzleFlashes.push(dust); // Reuse update system
        }
    }

    clear() {
        // Clean up bullet trails
        this.bulletTrails.forEach(trail => {
            this.scene.remove(trail);
            trail.geometry.dispose();
            trail.material.dispose();
        });
        this.bulletTrails = [];

        // Clean up muzzle flashes
        this.muzzleFlashes.forEach(flash => {
            this.scene.remove(flash);
            flash.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
        this.muzzleFlashes = [];
    }
}