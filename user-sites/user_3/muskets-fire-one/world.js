// World generation - simple dueling arena with cover
class World {
    constructor(scene) {
        this.scene = scene;
        this.colliders = [];
        this.createArena();
    }
    
    createArena() {
        // Ground
        const groundGeo = new THREE.PlaneGeometry(60, 60, 32, 32);
        
        // Create grassy texture via canvas
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base grass color
        ctx.fillStyle = '#2d4a1c';
        ctx.fillRect(0, 0, 512, 512);
        
        // Add noise
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const shade = Math.random() > 0.5 ? '#3d5a2c' : '#1d3a0c';
            ctx.fillStyle = shade;
            ctx.fillRect(x, y, 2, 2);
        }
        
        const groundTexture = new THREE.CanvasTexture(canvas);
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(4, 4);
        
        const groundMat = new THREE.MeshLambertMaterial({ map: groundTexture });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Sky - simple gradient
        const skyGeo = new THREE.SphereGeometry(200, 32, 32);
        const skyCanvas = document.createElement('canvas');
        skyCanvas.width = 256;
        skyCanvas.height = 256;
        const skyCtx = skyCanvas.getContext('2d');
        const grad = skyCtx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#4a6fa5');
        grad.addColorStop(0.5, '#87ceeb');
        grad.addColorStop(1, '#e0f6ff');
        skyCtx.fillStyle = grad;
        skyCtx.fillRect(0, 0, 256, 256);
        const skyTexture = new THREE.CanvasTexture(skyCanvas);
        const skyMat = new THREE.MeshBasicMaterial({ 
            map: skyTexture, 
            side: THREE.BackSide 
        });
        const sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(sky);
        
        // Lighting
        const ambient = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambient);
        
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        this.scene.add(sun);
        
        // Create cover objects
        this.createWalls();
        this.createBarriers();
        this.createTrees();
    }
    
    createWalls() {
        const stoneMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        
        // Outer walls (ruined)
        const wallPositions = [
            { x: -20, z: 0, w: 2, h: 3, d: 20, rot: 0 },
            { x: 20, z: 0, w: 2, h: 3, d: 20, rot: 0 },
            { x: 0, z: -20, w: 20, h: 3, d: 2, rot: 0 },
            { x: 0, z: 20, w: 20, h: 3, d: 2, rot: 0 }
        ];
        
        for (const pos of wallPositions) {
            const geo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
            const wall = new THREE.Mesh(geo, stoneMat);
            wall.position.set(pos.x, pos.h / 2, pos.z);
            wall.rotation.y = pos.rot;
            this.scene.add(wall);
            
            this.colliders.push({
                type: 'box',
                min: new THREE.Vector3(
                    pos.x - pos.w / 2,
                    0,
                    pos.z - pos.d / 2
                ),
                max: new THREE.Vector3(
                    pos.x + pos.w / 2,
                    pos.h,
                    pos.z + pos.d / 2
                )
            });
        }
    }
    
    createBarriers() {
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        
        // Wooden barricades
        const barriers = [
            { x: -8, z: -8, w: 4, h: 1.2, d: 0.3, rot: 0.3 },
            { x: 8, z: -8, w: 4, h: 1.2, d: 0.3, rot: -0.3 },
            { x: -8, z: 8, w: 4, h: 1.2, d: 0.3, rot: -0.3 },
            { x: 8, z: 8, w: 4, h: 1.2, d: 0.3, rot: 0.3 },
            { x: 0, z: 0, w: 3, h: 0.8, d: 3, rot: 0.78 }
        ];
        
        for (const b of barriers) {
            const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
            const barrier = new THREE.Mesh(geo, woodMat);
            barrier.position.set(b.x, b.h / 2, b.z);
            barrier.rotation.y = b.rot;
            this.scene.add(barrier);
            
            this.colliders.push({
                type: 'box',
                min: new THREE.Vector3(
                    b.x - b.w / 2,
                    0,
                    b.z - b.d / 2
                ),
                max: new THREE.Vector3(
                    b.x + b.w / 2,
                    b.h,
                    b.z + b.d / 2
                )
            });
        }
        
        // Crates
        const crateMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        const cratePositions = [
            { x: -12, z: 0 }, { x: -13, z: 1 }, { x: 12, z: 0 }, { x: 13, z: -1 },
            { x: 0, z: -12 }, { x: 1, z: -13 }, { x: 0, z: 12 }, { x: -1, z: 13 }
        ];
        
        for (const pos of cratePositions) {
            const size = 0.8 + Math.random() * 0.4;
            const geo = new THREE.BoxGeometry(size, size, size);
            const crate = new THREE.Mesh(geo, crateMat);
            crate.position.set(pos.x, size / 2, pos.z);
            crate.rotation.y = Math.random() * Math.PI;
            this.scene.add(crate);
            
            this.colliders.push({
                type: 'box',
                min: new THREE.Vector3(
                    pos.x - size / 2,
                    0,
                    pos.z - size / 2
                ),
                max: new THREE.Vector3(
                    pos.x + size / 2,
                    size,
                    pos.z + size / 2
                )
            });
        }
    }
    
    createTrees() {
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        const leafMat = new THREE.MeshLambertMaterial({ color: 0x1a4a1a });
        
        const treePositions = [
            { x: -15, z: -15 }, { x: -18, z: 10 }, { x: 16, z: -12 },
            { x: 15, z: 15 }, { x: -10, z: 18 }, { x: 12, z: 16 }
        ];
        
        for (const pos of treePositions) {
            // Trunk
            const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.set(pos.x, 1.5, pos.z);
            this.scene.add(trunk);
            
            // Leaves (cone layers)
            for (let i = 0; i < 3; i++) {
                const leafGeo = new THREE.ConeGeometry(2 - i * 0.4, 2, 8);
                const leaves = new THREE.Mesh(leafGeo, leafMat);
                leaves.position.set(pos.x, 3 + i * 1.2, pos.z);
                this.scene.add(leaves);
            }
            
            this.colliders.push({
                type: 'cylinder',
                x: pos.x,
                z: pos.z,
                y: 0,
                radius: 0.5,
                height: 6
            });
        }
    }
    
    getColliders() {
        return this.colliders;
    }
}
