/**
 * World Generation
 * Creates the arena environment with obstacles and lighting
 */

class World {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        this.boundaries = {
            minX: -20,
            maxX: 20,
            minZ: -20,
            maxZ: 20
        };
        
        this.createEnvironment();
        this.createLighting();
        this.createObstacles();
    }
    
    createEnvironment() {
        // Ground - grass terrain
        const groundGeo = new THREE.PlaneGeometry(50, 50, 32, 32);
        
        // Add some noise to vertices for uneven terrain
        const positions = groundGeo.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            // Subtle height variation
            positions[i + 2] = (Math.random() - 0.5) * 0.3;
        }
        groundGeo.computeVertexNormals();
        
        const groundMat = new THREE.MeshLambertMaterial({ 
            color: 0x3a5f3a,
            side: THREE.DoubleSide
        });
        
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.objects.push(ground);
        
        // Sky/background
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 80);
    }
    
    createLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambient);
        
        // Sun light
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        
        // Shadow settings
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 200;
        sun.shadow.camera.left = -30;
        sun.shadow.camera.right = 30;
        sun.shadow.camera.top = 30;
        sun.shadow.camera.bottom = -30;
        
        this.scene.add(sun);
        this.objects.push(sun);
    }
    
    createObstacles() {
        // Create stone walls and cover positions
        const wallMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const crateMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        // Central stone wall
        this.createWall(0, 1, -5, 8, 2, 0.5, wallMat);
        
        // Corner barriers
        this.createWall(-15, 1, -15, 4, 2, 4, wallMat);
        this.createWall(15, 1, -15, 4, 2, 4, wallMat);
        this.createWall(-15, 1, 15, 4, 2, 4, wallMat);
        this.createWall(15, 1, 15, 4, 2, 4, wallMat);
        
        // Wooden crates/barriers
        this.createCrate(-8, 0.5, 0, 1, 1, 1, crateMat);
        this.createCrate(-10, 0.5, 2, 1, 1, 1, crateMat);
        this.createCrate(8, 0.5, -3, 1, 1, 1, crateMat);
        this.createCrate(10, 0.5, -1, 1, 1, 1, crateMat);
        
        // Flanking walls
        this.createWall(-12, 1, 8, 2, 2, 6, wallMat);
        this.createWall(12, 1, -8, 2, 2, 6, wallMat);
        
        // Trees (simple cones)
        this.createTree(-18, 0, -5);
        this.createTree(18, 0, 5);
        this.createTree(-5, 0, 18);
        this.createTree(5, 0, -18);
    }
    
    createWall(x, y, z, w, h, d, material) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.objects.push(mesh);
        
        // Add to collision list
        this.addCollisionBox(x, y, z, w, h, d);
    }
    
    createCrate(x, y, z, w, h, d, material) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.objects.push(mesh);
        
        this.addCollisionBox(x, y, z, w, h, d);
    }
    
    createTree(x, y, z) {
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, y + 1, z);
        trunk.castShadow = true;
        this.scene.add(trunk);
        
        // Leaves
        const leavesGeo = new THREE.ConeGeometry(2, 4, 8);
        const leavesMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.set(x, y + 3, z);
        leaves.castShadow = true;
        this.scene.add(leaves);
        
        this.addCollisionBox(x, y + 1, z, 0.6, 2, 0.6);
    }
    
    addCollisionBox(x, y, z, w, h, d) {
        // Store for collision detection
        if (!this.collisionBoxes) this.collisionBoxes = [];
        this.collisionBoxes.push({
            x: x - w/2,
            y: y - h/2,
            z: z - d/2,
            w: w,
            h: h,
            d: d,
            maxX: x + w/2,
            maxY: y + h/2,
            maxZ: z + d/2
        });
    }
    
    checkCollision(position, radius) {
        if (!this.collisionBoxes) return false;
        
        for (const box of this.collisionBoxes) {
            // Check if position overlaps with box (with radius buffer)
            if (position.x + radius > box.x && position.x - radius < box.maxX &&
                position.y > box.y && position.y < box.maxY &&
                position.z + radius > box.z && position.z - radius < box.maxZ) {
                return true;
            }
        }
        
        // World boundary check
        if (position.x < this.boundaries.minX + radius || 
            position.x > this.boundaries.maxX - radius ||
            position.z < this.boundaries.minZ + radius ||
            position.z > this.boundaries.maxZ - radius) {
            return true;
        }
        
        return false;
    }
    
    resolveCollision(position, velocity, radius) {
        if (this.checkCollision(position, radius)) {
            // Simple collision response - stop movement
            position.x -= velocity.x * 0.1;
            position.z -= velocity.z * 0.1;
        }
    }
    
    getSpawnPoints() {
        return [
            new THREE.Vector3(-10, 0, -10),
            new THREE.Vector3(10, 0, 10),
            new THREE.Vector3(-10, 0, 10),
            new THREE.Vector3(10, 0, -10),
            new THREE.Vector3(0, 0, -15),
            new THREE.Vector3(0, 0, 15)
        ];
    }
    
    clear() {
        for (const obj of this.objects) {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        }
        this.objects = [];
        this.collisionBoxes = [];
    }
}