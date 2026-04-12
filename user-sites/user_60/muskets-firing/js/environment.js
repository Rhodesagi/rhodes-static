/**
 * Environment - Game world setup
 * Ground, obstacles, lighting
 */

class Environment {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.particles = [];
        
        this.createGround();
        this.createObstacles();
        this.createLighting();
        this.createSky();
    }
    
    createGround() {
        // Large ground plane
        const geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
        
        // Add some noise to vertices for natural terrain
        const pos = geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = pos.getZ(i);
            // Gentle rolling hills
            const height = Math.sin(x * 0.05) * 0.5 + Math.cos(y * 0.05) * 0.5;
            pos.setZ(i, z + height * 0.3);
        }
        geometry.computeVertexNormals();
        
        // Ground material - grassy terrain
        const material = new THREE.MeshPhongMaterial({
            color: 0x3d5c2a,
            shininess: 5,
            side: THREE.DoubleSide
        });
        
        const ground = new THREE.Mesh(geometry, material);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add some random rocks/terrain details
        for (let i = 0; i < 30; i++) {
            const rockGeo = new THREE.DodecahedronGeometry(Math.random() * 0.5 + 0.2, 0);
            const rockMat = new THREE.MeshPhongMaterial({
                color: 0x6a6a6a,
                shininess: 10
            });
            const rock = new THREE.Mesh(rockGeo, rockMat);
            
            rock.position.set(
                (Math.random() - 0.5) * 80,
                0.3,
                (Math.random() - 0.5) * 80
            );
            rock.castShadow = true;
            rock.receiveShadow = true;
            
            this.scene.add(rock);
            this.obstacles.push(rock);
        }
    }
    
    createObstacles() {
        // Wooden barricades/walls - typical battlefield cover
        const wallMaterial = new THREE.MeshPhongMaterial({
            color: 0x5a4a3a,
            shininess: 15
        });
        
        // Create several barricades
        const wallPositions = [
            { x: 10, z: -10, rot: 0.3, w: 6, h: 1.5 },
            { x: -15, z: 5, rot: -0.5, w: 4, h: 1.2 },
            { x: 5, z: 15, rot: 1.2, w: 5, h: 1.4 },
            { x: -8, z: -20, rot: 0, w: 8, h: 1.8 },
            { x: 20, z: 0, rot: 0.7, w: 5, h: 1.3 }
        ];
        
        for (const pos of wallPositions) {
            // Main wall section
            const geometry = new THREE.BoxGeometry(pos.w, pos.h, 0.5);
            const wall = new THREE.Mesh(geometry, wallMaterial);
            wall.position.set(pos.x, pos.h / 2, pos.z);
            wall.rotation.y = pos.rot;
            wall.castShadow = true;
            wall.receiveShadow = true;
            this.scene.add(wall);
            this.obstacles.push(wall);
            
            // Add some irregularities to the wall
            for (let i = 0; i < 3; i++) {
                const crateGeo = new THREE.BoxGeometry(
                    Math.random() * 0.8 + 0.5,
                    Math.random() * 0.4 + 0.3,
                    Math.random() * 0.8 + 0.5
                );
                const crate = new THREE.Mesh(crateGeo, wallMaterial);
                
                const offsetX = (Math.random() - 0.5) * pos.w;
                const offsetZ = (Math.random() - 0.5) * 0.5;
                
                crate.position.set(
                    pos.x + offsetX * Math.cos(pos.rot) - offsetZ * Math.sin(pos.rot),
                    pos.h + crateGeo.parameters.height / 2,
                    pos.z + offsetX * Math.sin(pos.rot) + offsetZ * Math.cos(pos.rot)
                );
                crate.rotation.y = pos.rot + (Math.random() - 0.5) * 0.2;
                crate.castShadow = true;
                
                this.scene.add(crate);
                this.obstacles.push(crate);
            }
        }
        
        // Add some trees for additional cover
        for (let i = 0; i < 8; i++) {
            this.createTree(
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60
            );
        }
    }
    
    createTree(x, z) {
        // Tree trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
        const trunkMat = new THREE.MeshPhongMaterial({ color: 0x4a3a2a });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, 1.5, z);
        trunk.castShadow = true;
        this.scene.add(trunk);
        this.obstacles.push(trunk);
        
        // Tree foliage (conifer-style)
        const foliageMat = new THREE.MeshPhongMaterial({ color: 0x2a4a2a });
        
        for (let i = 0; i < 3; i++) {
            const coneGeo = new THREE.ConeGeometry(1.5 - i * 0.3, 2, 8);
            const cone = new THREE.Mesh(coneGeo, foliageMat);
            cone.position.set(x, 3.5 + i * 1.2, z);
            cone.castShadow = true;
            this.scene.add(cone);
            this.obstacles.push(cone);
        }
    }
    
    createLighting() {
        // Ambient light (daylight)
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xfff5e0, 0.8);
        sunLight.position.set(50, 80, 30);
        sunLight.castShadow = true;
        sunLight.shadow.camera.left = -50;
        sunLight.shadow.camera.right = 50;
        sunLight.shadow.camera.top = 50;
        sunLight.shadow.camera.bottom = -50;
        sunLight.shadow.camera.near = 0.1;
        sunLight.shadow.camera.far = 200;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);
        
        // Hemisphere light for sky/ground gradient
        const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d5c2a, 0.4);
        this.scene.add(hemiLight);
    }
    
    createSky() {
        // Skybox using a large sphere
        const skyGeo = new THREE.SphereGeometry(100, 32, 32);
        const skyMat = new THREE.MeshBasicMaterial({
            color: 0x87ceeb,
            side: THREE.BackSide,
            fog: false
        });
        const sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(sky);
        
        // Add some clouds
        for (let i = 0; i < 10; i++) {
            const cloudGeo = new THREE.SphereGeometry(5 + Math.random() * 5, 8, 8);
            const cloudMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.4
            });
            const cloud = new THREE.Mesh(cloudGeo, cloudMat);
            
            const angle = Math.random() * Math.PI * 2;
            const height = 40 + Math.random() * 20;
            const distance = 60 + Math.random() * 30;
            
            cloud.position.set(
                Math.cos(angle) * distance,
                height,
                Math.sin(angle) * distance
            );
            
            // Make clouds elongated
            cloud.scale.set(2, 0.5, 1);
            
            this.scene.add(cloud);
        }
    }
    
    // Check if position collides with environment
    checkCollision(position, radius = 0.5) {
        // Ground collision
        if (position.y < radius) {
            return { type: 'ground', position: new THREE.Vector3(position.x, 0, position.z) };
        }
        
        // Obstacle collision
        for (const obstacle of this.obstacles) {
            const box = new THREE.Box3().setFromObject(obstacle);
            const closest = box.clampPoint(position, new THREE.Vector3());
            const distance = position.distanceTo(closest);
            
            if (distance < radius) {
                return { type: 'obstacle', position: closest, obstacle };
            }
        }
        
        return null;
    }
    
    // Resolve collision and return valid position
    resolveCollision(position, radius = 0.5) {
        const collision = this.checkCollision(position, radius);
        
        if (collision) {
            if (collision.type === 'ground') {
                position.y = radius;
            } else if (collision.type === 'obstacle') {
                const push = position.clone().sub(collision.position).normalize();
                position.copy(collision.position).add(push.multiplyScalar(radius));
            }
        }
        
        return position;
    }
}