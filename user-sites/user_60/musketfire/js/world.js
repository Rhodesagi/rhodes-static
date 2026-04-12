// MUSKETFIRE - World geometry and arena

class World {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.groundSize = 100;
        this.createWorld();
    }

    createWorld() {
        // Ground - grass/dirt
        const groundGeo = new THREE.PlaneGeometry(this.groundSize, this.groundSize, 32, 32);
        
        // Add some noise to ground
        const pos = groundGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5;
            pos.setZ(i, z);
        }
        groundGeo.computeVertexNormals();
        
        const groundMat = new THREE.MeshLambertMaterial({ 
            color: 0x2d4a2d,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Simple trees/rocks as cover
        this.createObstacles();
        
        // Boundaries
        this.createBoundaries();
        
        // Sky - fog
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 80);
        this.scene.background = new THREE.Color(0x87CEEB);
    }

    createObstacles() {
        // Create some tree stumps and rocks for cover
        const positions = [
            { x: -20, z: -20 },
            { x: 20, z: -20 },
            { x: -20, z: 20 },
            { x: 20, z: 20 },
            { x: 0, z: -30 },
            { x: 0, z: 30 },
            { x: -35, z: 0 },
            { x: 35, z: 0 }
        ];

        positions.forEach(pos => {
            // Tree stump
            const stumpGeo = new THREE.CylinderGeometry(1.5, 2, 3, 8);
            const stumpMat = new THREE.MeshLambertMaterial({ color: 0x4a3c2d });
            const stump = new THREE.Mesh(stumpGeo, stumpMat);
            stump.position.set(pos.x, 1.5, pos.z);
            stump.castShadow = true;
            stump.receiveShadow = true;
            this.scene.add(stump);
            
            this.obstacles.push({
                type: 'stump',
                mesh: stump,
                radius: 2,
                height: 3
            });

            // Maybe add a rock nearby
            if (Math.random() > 0.3) {
                const rockGeo = new THREE.DodecahedronGeometry(1 + Math.random());
                const rockMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
                const rock = new THREE.Mesh(rockGeo, rockMat);
                rock.position.set(
                    pos.x + (Math.random() - 0.5) * 6,
                    0.5,
                    pos.z + (Math.random() - 0.5) * 6
                );
                rock.castShadow = true;
                rock.receiveShadow = true;
                this.scene.add(rock);
                
                this.obstacles.push({
                    type: 'rock',
                    mesh: rock,
                    radius: 1.5,
                    height: 2
                });
            }
        });

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 150;
        sunLight.shadow.camera.left = -60;
        sunLight.shadow.camera.right = 60;
        sunLight.shadow.camera.top = 60;
        sunLight.shadow.camera.bottom = -60;
        this.scene.add(sunLight);
    }

    createBoundaries() {
        // Invisible walls at edges
        this.boundaries = {
            minX: -this.groundSize / 2 + 5,
            maxX: this.groundSize / 2 - 5,
            minZ: -this.groundSize / 2 + 5,
            maxZ: this.groundSize / 2 - 5
        };
    }

    // Check collision with obstacles
    checkCollision(position, radius) {
        // Check boundaries
        if (position.x < this.boundaries.minX + radius || 
            position.x > this.boundaries.maxX - radius) return true;
        if (position.z < this.boundaries.minZ + radius || 
            position.z > this.boundaries.maxZ - radius) return true;

        // Check obstacles
        for (const obs of this.obstacles) {
            const dx = position.x - obs.mesh.position.x;
            const dz = position.z - obs.mesh.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < obs.radius + radius) return true;
        }
        return false;
    }

    // Get collision normal for sliding
    getCollisionNormal(position, radius) {
        for (const obs of this.obstacles) {
            const dx = position.x - obs.mesh.position.x;
            const dz = position.z - obs.mesh.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < obs.radius + radius) {
                return { x: dx / dist, z: dz / dist };
            }
        }
        return null;
    }

    getHeightAt(x, z) {
        // Simple ground height function matching the sine wave used
        return Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;
    }
}
