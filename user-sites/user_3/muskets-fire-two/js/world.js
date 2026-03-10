// World Class - Environment, terrain, and visual elements

class World {
    constructor(scene) {
        this.scene = scene;
        this.bounds = { minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
        this.obstacles = [];
        
        this.buildTerrain();
        this.buildEnvironment();
        this.buildLighting();
    }
    
    buildTerrain() {
        // Ground plane with slight texture variation
        const groundGeo = new THREE.PlaneGeometry(50, 50, 32, 32);
        
        // Add some height variation
        const positions = groundGeo.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 1];
            // Subtle rolling hills
            positions[i + 2] = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.3;
        }
        groundGeo.computeVertexNormals();
        
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: 0x3d5c3d,
            roughness: 0.9,
            metalness: 0.0
        });
        
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        
        // Grass patches
        for (let i = 0; i < 200; i++) {
            const x = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 40;
            const grass = this.createGrassPatch();
            grass.position.set(x, 0, z);
            this.scene.add(grass);
        }
    }
    
    createGrassPatch() {
        const group = new THREE.Group();
        
        const bladeGeo = new THREE.ConeGeometry(0.02, 0.15, 3);
        const bladeMat = new THREE.MeshStandardMaterial({ 
            color: 0x4a7c4a,
            roughness: 1.0
        });
        
        for (let i = 0; i < 5; i++) {
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.position.set(
                (Math.random() - 0.5) * 0.1,
                0.075,
                (Math.random() - 0.5) * 0.1
            );
            blade.rotation.x = (Math.random() - 0.5) * 0.3;
            blade.rotation.z = (Math.random() - 0.5) * 0.3;
            blade.castShadow = true;
            group.add(blade);
        }
        
        return group;
    }
    
    buildEnvironment() {
        // Trees
        const treePositions = [
            { x: -15, z: -15 }, { x: 15, z: -15 },
            { x: -15, z: 15 }, { x: 15, z: 15 },
            { x: -8, z: -12 }, { x: 8, z: 12 },
            { x: -12, z: 5 }, { x: 12, z: -5 },
            { x: 0, z: -18 }, { x: -5, z: 18 }
        ];
        
        for (const pos of treePositions) {
            const tree = this.createTree();
            tree.position.set(pos.x, 0, pos.z);
            this.scene.add(tree);
            
            // Add as obstacle
            this.obstacles.push({
                position: new THREE.Vector3(pos.x, 0, pos.z),
                radius: 1.0
            });
        }
        
        // Rock formations
        const rockPositions = [
            { x: -10, z: -5 }, { x: 10, z: 8 },
            { x: -5, z: 10 }, { x: 5, z: -10 }
        ];
        
        for (const pos of rockPositions) {
            const rock = this.createRock();
            rock.position.set(pos.x, 0, pos.z);
            this.scene.add(rock);
            
            this.obstacles.push({
                position: new THREE.Vector3(pos.x, 0, pos.z),
                radius: 0.8
            });
        }
        
        // Low stone walls for cover
        this.createStoneWall(-10, 0, 10, 0);
        this.createStoneWall(0, -10, 0, 10);
        
        // Fog for atmosphere
        this.scene.fog = new THREE.Fog(0xc0c8d0, 10, 50);
        this.scene.background = new THREE.Color(0xc0c8d0);
    }
    
    createTree() {
        const group = new THREE.Group();
        
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        group.add(trunk);
        
        // Leaves (multiple cones for fuller look)
        const leavesMat = new THREE.MeshStandardMaterial({ 
            color: 0x2d4a2d,
            roughness: 0.8
        });
        
        const levels = 3;
        for (let i = 0; i < levels; i++) {
            const size = 1.5 - i * 0.3;
            const y = 2.5 + i * 0.8;
            const leavesGeo = new THREE.ConeGeometry(size, 1.5, 6);
            const leaves = new THREE.Mesh(leavesGeo, leavesMat);
            leaves.position.y = y;
            leaves.castShadow = true;
            group.add(leaves);
        }
        
        return group;
    }
    
    createRock() {
        const group = new THREE.Group();
        
        const rockMat = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            roughness: 0.9
        });
        
        const numRocks = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numRocks; i++) {
            const size = 0.3 + Math.random() * 0.4;
            const rockGeo = new THREE.DodecahedronGeometry(size, 0);
            const rock = new THREE.Mesh(rockGeo, rockMat);
            
            rock.position.set(
                (Math.random() - 0.5) * 0.8,
                size * 0.4,
                (Math.random() - 0.5) * 0.8
            );
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rock.castShadow = true;
            rock.receiveShadow = true;
            group.add(rock);
        }
        
        return group;
    }
    
    createStoneWall(x1, z1, x2, z2) {
        const wallLength = Math.sqrt((x2-x1)**2 + (z2-z1)**2);
        const numStones = Math.floor(wallLength / 0.6);
        const dx = (x2 - x1) / numStones;
        const dz = (z2 - z1) / numStones;
        
        const stoneMat = new THREE.MeshStandardMaterial({ 
            color: 0x7a7a7a,
            roughness: 0.95
        });
        
        for (let i = 0; i <= numStones; i++) {
            const x = x1 + dx * i;
            const z = z1 + dz * i;
            
            const stoneGeo = new THREE.BoxGeometry(0.5, 0.4 + Math.random() * 0.2, 0.3);
            const stone = new THREE.Mesh(stoneGeo, stoneMat);
            stone.position.set(x, 0.2, z);
            stone.rotation.y = Math.random() * 0.2;
            stone.castShadow = true;
            stone.receiveShadow = true;
            this.scene.add(stone);
            
            this.obstacles.push({
                position: new THREE.Vector3(x, 0, z),
                radius: 0.4
            });
        }
    }
    
    buildLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404050, 0.5);
        this.scene.add(ambient);
        
        // Directional light (sun)
        const sun = new THREE.DirectionalLight(0xfff0e0, 0.8);
        sun.position.set(10, 20, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 50;
        sun.shadow.camera.left = -25;
        sun.shadow.camera.right = 25;
        sun.shadow.camera.top = 25;
        sun.shadow.camera.bottom = -25;
        this.scene.add(sun);
        
        // Hemisphere light for sky/ground color
        const hemi = new THREE.HemisphereLight(0x87ceeb, 0x3d5c3d, 0.3);
        this.scene.add(hemi);
    }
    
    checkCollision(position, radius) {
        // Check world bounds
        if (position.x < this.bounds.minX || position.x > this.bounds.maxX ||
            position.z < this.bounds.minZ || position.z > this.bounds.maxZ) {
            return true;
        }
        
        // Check obstacles
        for (const obstacle of this.obstacles) {
            const dist = position.distanceTo(obstacle.position);
            if (dist < radius + obstacle.radius) {
                return true;
            }
        }
        
        return false;
    }
    
    getSpawnPositions() {
        return [
            new THREE.Vector3(-12, 0, -12),
            new THREE.Vector3(12, 0, 12)
        ];
    }
}