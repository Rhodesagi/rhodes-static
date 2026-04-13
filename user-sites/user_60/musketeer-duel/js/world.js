/**
 * World/Environment for the duel
 * Simple terrain, obstacles, and atmosphere
 */

class World {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        
        this.createTerrain();
        this.createSky();
        this.createObstacles();
        this.createMarkings();
    }
    
    createTerrain() {
        // Ground plane with slight unevenness
        const geometry = new THREE.PlaneGeometry(200, 200, 100, 100);
        geometry.rotateX(-Math.PI / 2);
        
        // Add some unevenness to terrain
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            
            // Gentle rolling hills
            const height = Math.sin(x * 0.05) * 0.5 + 
                          Math.cos(z * 0.05) * 0.5 +
                          Math.sin(x * 0.2) * 0.1 +
                          Math.cos(z * 0.15) * 0.1;
            
            positions.setY(i, height);
        }
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x5d7a3f,
            roughness: 0.9,
            metalness: 0.0
        });
        
        this.ground = new THREE.Mesh(geometry, material);
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        
        // Add some grass blades (instanced)
        this.addGrass();
    }
    
    addGrass() {
        const grassGeo = new THREE.ConeGeometry(0.02, 0.15, 3);
        grassGeo.translate(0, 0.075, 0);
        const grassMat = new THREE.MeshStandardMaterial({
            color: 0x6b8c42,
            roughness: 0.9
        });
        
        const instances = 1000;
        const grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, instances);
        
        const dummy = new THREE.Object3D();
        for (let i = 0; i < instances; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            const y = this.getHeightAt(x, z);
            
            dummy.position.set(x, y, z);
            dummy.rotation.y = Math.random() * Math.PI * 2;
            dummy.scale.set(
                0.5 + Math.random() * 0.5,
                0.5 + Math.random() * 1.0,
                0.5 + Math.random() * 0.5
            );
            dummy.updateMatrix();
            grassMesh.setMatrixAt(i, dummy.matrix);
        }
        
        grassMesh.receiveShadow = true;
        this.scene.add(grassMesh);
    }
    
    createSky() {
        // Simple sky dome
        const skyGeo = new THREE.SphereGeometry(500, 32, 32);
        const skyMat = new THREE.MeshBasicMaterial({
            color: 0x87ceeb,
            side: THREE.BackSide,
            fog: false
        });
        this.sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(this.sky);
        
        // Lighting
        const ambient = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambient);
        
        const sun = new THREE.DirectionalLight(0xfffaed, 0.8);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        sun.shadow.camera.left = -100;
        sun.shadow.camera.right = 100;
        sun.shadow.camera.top = 100;
        sun.shadow.camera.bottom = -100;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        this.scene.add(sun);
        
        // Fog for atmosphere (soft distance fade)
        this.scene.fog = new THREE.Fog(0x87ceeb, 30, 120);
    }
    
    createObstacles() {
        // Some hay bales for cover
        const hayMat = new THREE.MeshStandardMaterial({
            color: 0xd4a574,
            roughness: 1.0
        });
        
        const baleGeo = new THREE.BoxGeometry(1.8, 1.0, 0.9);
        
        // Place bales strategically
        const balePositions = [
            { x: -5, z: 5, y: 0 },
            { x: -3, z: -4, y: 0 },
            { x: 4, z: 6, y: 0 },
            { x: 6, z: -5, y: 0 },
            { x: 0, z: 10, y: 0 },
            { x: 0, z: -10, y: 0 }
        ];
        
        for (const pos of balePositions) {
            const bale = new THREE.Mesh(baleGeo, hayMat);
            pos.y = this.getHeightAt(pos.x, pos.z) + 0.5;
            bale.position.set(pos.x, pos.y, pos.z);
            bale.rotation.y = Math.random() * Math.PI * 2;
            bale.castShadow = true;
            bale.receiveShadow = true;
            this.scene.add(bale);
            this.objects.push(bale);
        }
        
        // Wooden fence segments
        const fencePostGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6);
        const fenceRailGeo = new THREE.BoxGeometry(0.1, 0.08, 2.0);
        const fenceMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
        
        // Create fence rows
        for (let x = -15; x <= 15; x += 3) {
            // Left side fence
            const post1 = new THREE.Mesh(fencePostGeo, fenceMat);
            post1.position.set(x, this.getHeightAt(x, -20) + 0.75, -20);
            this.scene.add(post1);
            
            if (x < 15) {
                const rail1 = new THREE.Mesh(fenceRailGeo, fenceMat);
                rail1.position.set(x + 1.5, this.getHeightAt(x + 1.5, -20) + 1.0, -20);
                rail1.rotation.y = 0.1;
                this.scene.add(rail1);
                
                const rail2 = new THREE.Mesh(fenceRailGeo, fenceMat);
                rail2.position.set(x + 1.5, this.getHeightAt(x + 1.5, -20) + 0.5, -20);
                rail2.rotation.y = -0.05;
                this.scene.add(rail2);
            }
            
            // Right side fence
            const post2 = new THREE.Mesh(fencePostGeo, fenceMat);
            post2.position.set(x, this.getHeightAt(x, 20) + 0.75, 20);
            this.scene.add(post2);
        }
    }
    
    createMarkings() {
        // Distance markers (actual 3D objects, not HUD)
        const markerGeo = new THREE.BoxGeometry(0.3, 1.5, 0.1);
        const markerMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        
        // Create canvas texture for distance text
        function createDistanceTexture(distance) {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 256, 128);
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 60px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText(`${distance}m`, 128, 80);
            
            const texture = new THREE.CanvasTexture(canvas);
            return texture;
        }
        
        // Place markers at 10m intervals
        for (let dist = 10; dist <= 50; dist += 10) {
            // Player 1 side
            const marker1 = new THREE.Mesh(markerGeo, markerMat);
            marker1.position.set(-dist, this.getHeightAt(-dist, 0) + 0.75, 0);
            this.scene.add(marker1);
            
            // Sign
            const signGeo = new THREE.PlaneGeometry(0.8, 0.4);
            const signMat = new THREE.MeshBasicMaterial({
                map: createDistanceTexture(dist),
                transparent: true
            });
            const sign1 = new THREE.Mesh(signGeo, signMat);
            sign1.position.set(-dist, this.getHeightAt(-dist, 0) + 1.3, 0.06);
            this.scene.add(sign1);
            
            // Player 2 side
            const marker2 = new THREE.Mesh(markerGeo, markerMat);
            marker2.position.set(dist, this.getHeightAt(dist, 0) + 0.75, 0);
            this.scene.add(marker2);
            
            const sign2 = new THREE.Mesh(signGeo, signMat);
            sign2.position.set(dist, this.getHeightAt(dist, 0) + 1.3, 0.06);
            this.scene.add(sign2);
        }
        
        // Center line marker (dueling ground center)
        const centerPostGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
        const centerPostMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        
        for (let i = -20; i <= 20; i += 10) {
            const post = new THREE.Mesh(centerPostGeo, centerPostMat);
            post.position.set(0, this.getHeightAt(0, i) + 0.5, i);
            this.scene.add(post);
        }
    }
    
    /**
     * Get ground height at x,z position
     */
    getHeightAt(x, z) {
        // Calculate the same sine wave as in terrain generation
        const height = Math.sin(x * 0.05) * 0.5 + 
                      Math.cos(z * 0.05) * 0.5 +
                      Math.sin(x * 0.2) * 0.1 +
                      Math.cos(z * 0.15) * 0.1;
        return Math.max(height, 0);
    }
}