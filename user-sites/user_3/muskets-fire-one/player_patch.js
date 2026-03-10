    spawnProjectile(projectileData) {
        // Create visual projectile
        const geo = new THREE.SphereGeometry(0.015, 6, 6);
        const mat = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(projectileData.origin);
        mesh.layers.set(this.viewLayer); // Only visible to owning player
        this.scene.add(mesh);
        
        // Smoke trail
        const trailGeo = new THREE.BufferGeometry();
        const trailPositions = new Float32Array(30 * 3);
        trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
        const trailMat = new THREE.LineBasicMaterial({ 
            color: 0x888888, 
            transparent: true, 
            opacity: 0.5 
        });
        const trail = new THREE.Line(trailGeo, trailMat);
        trail.frustumCulled = false;
        trail.layers.set(this.viewLayer);
        this.scene.add(trail);
        
        this.projectiles.push({
            position: projectileData.origin.clone(),
            velocity: projectileData.direction.clone().multiplyScalar(projectileData.velocity),
            damage: projectileData.damage,
            mesh: mesh,
            trail: trail,
            trailPositions: [],
            life: 3.0, // Seconds before removal
            startPos: projectileData.origin.clone()
        });
    }
