import * as THREE from 'three';

export class World {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 60);
        
        this.setupLighting();
        this.createArena();
        this.createDecorations();
        
        this.colliders = [];
        this.createColliders();
    }
    
    setupLighting() {
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(10, 20, 5);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 50;
        sunLight.shadow.camera.left = -20;
        sunLight.shadow.camera.right = 20;
        sunLight.shadow.camera.top = 20;
        sunLight.shadow.camera.bottom = -20;
        this.scene.add(sunLight);
        
        // Add subtle ground reflection
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8b7355, 0.3);
        this.scene.add(hemiLight);
    }
    
    createArena() {
        // Ground plane - dirt/grass texture approximation
        const groundGeometry = new THREE.PlaneGeometry(40, 40, 20, 20);
        
        // Add some noise to vertices for uneven ground
        const posAttribute = groundGeometry.attributes.position;
        for (let i = 0; i < posAttribute.count; i++) {
            const x = posAttribute.getX(i);
            const y = posAttribute.getY(i);
            const z = posAttribute.getZ(i);
            // Slight height variation
            const height = Math.sin(x * 0.3) * 0.1 + Math.cos(y * 0.3) * 0.1;
            posAttribute.setZ(i, z + height);
        }
        groundGeometry.computeVertexNormals();
        
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x5a4a3a,
            roughness: 0.9,
            metalness: 0.1
        });
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        
        // Add four low walls for cover
        this.createWalls();
    }
    
    createWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x6b5a4a,
            roughness: 0.8
        });
        
        const wallPositions = [
            { x: -8, z: -8, w: 4, d: 0.5, h: 1.2 },
            { x: 8, z: 8, w: 4, d: 0.5, h: 1.2 },
            { x: -8, z: 8, w: 0.5, d: 4, h: 1.2 },
            { x: 8, z: -8, w: 0.5, d: 4, h: 1.2 }
        ];
        
        this.walls = [];
        
        wallPositions.forEach(pos => {
            const geometry = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
            const wall = new THREE.Mesh(geometry, wallMaterial);
            wall.position.set(pos.x, pos.h / 2, pos.z);
            wall.castShadow = true;
            wall.receiveShadow = true;
            this.scene.add(wall);
            this.walls.push(wall);
        });
    }
    
    createDecorations() {
        // Add some trees/bushes as visual cover references
        const treePositions = [
            { x: -15, z: -15 },
            { x: 15, z: 15 },
            { x: -15, z: 15 },
            { x: 15, z: -15 }
        ];
        
        treePositions.forEach(pos => {
            this.createSimpleTree(pos.x, pos.z);
        });
    }
    
    createSimpleTree(x, z) {
        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, 1, z);
        trunk.castShadow = true;
        this.scene.add(trunk);
        
        // Foliage (low poly cone)
        const foliageGeo = new THREE.ConeGeometry(2, 4, 6);
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2d4a2d });
        const foliage = new THREE.Mesh(foliageGeo, foliageMat);
        foliage.position.set(x, 3, z);
        foliage.castShadow = true;
        this.scene.add(foliage);
    }
    
    createColliders() {
        // Wall colliders for projectile raycasts
        this.walls.forEach(wall => {
            const box = new THREE.Box3().setFromObject(wall);
            this.colliders.push({
                type: 'box',
                box: box,
                mesh: wall
            });
        });
        
        // Ground plane for reference
        this.colliders.push({
            type: 'plane',
            y: 0
        });
    }
    
    checkCollision(point) {
        // Check against all colliders
        for (const collider of this.colliders) {
            if (collider.type === 'box' && collider.box.containsPoint(point)) {
                return true;
            }
        }
        return point.y < 0;
    }
    
    checkLineCollision(start, end) {
        // Ray-box intersection for walls
        for (const collider of this.colliders) {
            if (collider.type === 'box') {
                const intersection = new THREE.Vector3();
                const hit = collider.box.containsPoint(start) || 
                           this.lineIntersectsBox(start, end, collider.box, intersection);
                if (hit) return { hit: true, point: intersection };
            }
        }
        return { hit: false };
    }
    
    lineIntersectsBox(start, end, box, outIntersection) {
        // Simple ray-box intersection
        const dir = new THREE.Vector3().subVectors(end, start).normalize();
        const ray = new THREE.Ray(start, dir);
        const result = ray.intersectBox(box, outIntersection);
        return result !== null;
    }
}