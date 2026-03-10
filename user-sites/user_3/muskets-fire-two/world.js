class World {
    constructor() {
        this.terrain = null;
        this.obstacles = [];
        this.spawnPoints = [
            new THREE.Vector3(-15, 0, -15),
            new THREE.Vector3(15, 0, 15),
            new THREE.Vector3(-15, 0, 15),
            new THREE.Vector3(15, 0, -15),
            new THREE.Vector3(0, 0, -20),
            new THREE.Vector3(0, 0, 20)
        ];
    }

    generate(scene) {
        this.createTerrain(scene);
        this.createWalls(scene);
        this.createBarriers(scene);
        this.createVegetation(scene);
        this.createLighting(scene);
    }

    createTerrain(scene) {
        // Ground plane
        const groundGeo = new THREE.PlaneGeometry(60, 60, 32, 32);
        
        // Add some height variation
        const positions = groundGeo.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            // Gentle rolling hills
            const height = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 +
                          Math.sin(x * 0.3) * Math.sin(y * 0.2) * 0.2;
            positions.setZ(i, height);
        }
        groundGeo.computeVertexNormals();
        
        const groundMat = new THREE.MeshLambertMaterial({ 
            color: 0x3a4a3a,
            side: THREE.DoubleSide
        });
        this.terrain = new THREE.Mesh(groundGeo, groundMat);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        scene.add(this.terrain);
        
        // Add ground detail - grass patches
        for (let i = 0; i < 200; i++) {
            const x = (Math.random() - 0.5) * 50;
            const z = (Math.random() - 0.5) * 50;
            const grassGeo = new THREE.PlaneGeometry(0.1 + Math.random() * 0.2, 0.2 + Math.random() * 0.3);
            const grassMat = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(0.25 + Math.random() * 0.1, 0.6, 0.3 + Math.random() * 0.2),
                side: THREE.DoubleSide
            });
            const grass = new THREE.Mesh(grassGeo, grassMat);
            grass.position.set(x, 0.15, z);
            grass.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
            grass.rotation.z = Math.random() * Math.PI;
            scene.add(grass);
        }
    }

    createWalls(scene) {
        const wallMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
        
        // Stone walls at arena boundaries
        const wallPositions = [
            { x: 0, z: -30, w: 60, h: 2, d: 1, r: 0 },
            { x: 0, z: 30, w: 60, h: 2, d: 1, r: 0 },
            { x: -30, z: 0, w: 1, h: 2, d: 60, r: 0 },
            { x: 30, z: 0, w: 1, h: 2, d: 60, r: 0 }
        ];
        
        for (const pos of wallPositions) {
            const wallGeo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
            const wall = new THREE.Mesh(wallGeo, wallMat);
            wall.position.set(pos.x, pos.h / 2, pos.z);
            wall.castShadow = true;
            wall.receiveShadow = true;
            scene.add(wall);
            this.obstacles.push(wall);
        }
    }

    createBarriers(scene) {
        const barrierMat = new THREE.MeshLambertMaterial({ color: 0x4a3c2a });
        
        // Wooden barriers for cover
        const barrierConfigs = [
            { x: -10, z: -10, w: 4, h: 1.2, d: 0.3, r: 0.5 },
            { x: 10, z: 10, w: 4, h: 1.2, d: 0.3, r: 0.5 },
            { x: -10, z: 10, w: 4, h: 1.2, d: 0.3, r: -0.5 },
            { x: 10, z: -10, w: 4, h: 1.2, d: 0.3, r: -0.5 },
            { x: 0, z: -15, w: 6, h: 1, d: 0.3, r: 0 },
            { x: 0, z: 15, w: 6, h: 1, d: 0.3, r: 0 },
            { x: -15, z: 0, w: 0.3, h: 1, d: 6, r: 0 },
            { x: 15, z: 0, w: 0.3, h: 1, d: 6, r: 0 }
        ];
        
        for (const config of barrierConfigs) {
            const barrierGeo = new THREE.BoxGeometry(config.w, config.h, config.d);
            const barrier = new THREE.Mesh(barrierGeo, barrierMat);
            barrier.position.set(config.x, config.h / 2, config.z);
            barrier.rotation.y = config.r;
            barrier.castShadow = true;
            barrier.receiveShadow = true;
            scene.add(barrier);
            this.obstacles.push(barrier);
            
            // Add some visual detail - sandbags
            if (Math.random() > 0.5) {
                for (let i = 0; i < 3; i++) {
                    const bagGeo = new THREE.BoxGeometry(0.5, 0.3, 0.3);
                    const bagMat = new THREE.MeshLambertMaterial({ color: 0x8a7a5a });
                    const bag = new THREE.Mesh(bagGeo, bagMat);
                    bag.position.set(
                        config.x + (Math.random() - 0.5) * config.w * 0.8,
                        0.15,
                        config.z + (Math.random() - 0.5) * config.d * 0.8
                    );
                    scene.add(bag);
                }
            }
        }
    }

    createVegetation(scene) {
        // Trees
        const treePositions = [
            { x: -20, z: -20 },
            { x: 20, z: 20 },
            { x: -22, z: 18 },
            { x: 22, z: -18 }
        ];
        
        for (const pos of treePositions) {
            this.createTree(scene, pos.x, pos.z);
        }
    }

    createTree(scene, x, z) {
        const treeGroup = new THREE.Group();
        
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3c2a });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Foliage
        const foliageGeo = new THREE.ConeGeometry(2, 4, 8);
        const foliageMat = new THREE.MeshLambertMaterial({ color: 0x2a4a2a });
        const foliage = new THREE.Mesh(foliageGeo, foliageMat);
        foliage.position.y = 4;
        foliage.castShadow = true;
        treeGroup.add(foliage);
        
        // Second layer
        const foliage2Geo = new THREE.ConeGeometry(1.5, 3, 8);
        const foliage2 = new THREE.Mesh(foliage2Geo, foliageMat);
        foliage2.position.y = 5.5;
        foliage2.castShadow = true;
        treeGroup.add(foliage2);
        
        treeGroup.position.set(x, 0, z);
        scene.add(treeGroup);
        this.obstacles.push(treeGroup);
    }

    createLighting(scene) {
        // Ambient
        const ambient = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambient);
        
        // Directional sun
        const sun = new THREE.DirectionalLight(0xfffaee, 0.8);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 200;
        sun.shadow.camera.left = -50;
        sun.shadow.camera.right = 50;
        sun.shadow.camera.top = 50;
        sun.shadow.camera.bottom = -50;
        scene.add(sun);
        
        // Fill light
        const fill = new THREE.DirectionalLight(0x8888cc, 0.2);
        fill.position.set(-50, 30, -50);
        scene.add(fill);
    }

    getRandomSpawn() {
        const idx = Math.floor(Math.random() * this.spawnPoints.length);
        return this.spawnPoints[idx].clone();
    }

    checkCollision(position, radius = 0.5) {
        // Check boundary
        if (Math.abs(position.x) > 28 || Math.abs(position.z) > 28) {
            return true;
        }
        
        // Check obstacles
        for (const obstacle of this.obstacles) {
            const box = new THREE.Box3().setFromObject(obstacle);
            const expanded = box.expandByScalar(radius);
            if (expanded.containsPoint(position)) {
                return true;
            }
        }
        
        return false;
    }

    resolveCollision(position, velocity, radius = 0.5) {
        const newPos = position.clone().add(velocity);
        
        if (this.checkCollision(newPos, radius)) {
            // Try X only
            const xOnly = position.clone();
            xOnly.x += velocity.x;
            if (!this.checkCollision(xOnly, radius)) {
                return xOnly;
            }
            
            // Try Z only
            const zOnly = position.clone();
            zOnly.z += velocity.z;
            if (!this.checkCollision(zOnly, radius)) {
                return zOnly;
            }
            
            return position;
        }
        
        return newPos;
    }
}