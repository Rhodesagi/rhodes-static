// Environment - Terrain, obstacles, and visual effects
class Environment {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.smokeParticles = [];
        this.init();
    }

    init() {
        // Ground - uneven terrain with noise
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
        
        // Add unevenness to ground
        const positions = groundGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            // Gentle rolling hills
            const height = Math.sin(x * 0.05) * 2 + Math.cos(y * 0.03) * 1.5 + Math.random() * 0.3;
            positions[i + 2] = height;
        }
        groundGeometry.computeVertexNormals();
        
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3d2817,
            roughness: 0.9,
            metalness: 0.1
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        // Trees (simple brown cylinders with green cones)
        this.createTrees();
        
        // Rocks (grey polyhedrons)
        this.createRocks();
        
        // Barrels/crates for cover
        this.createCover();
        
        // Fog for atmosphere
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 80);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);
    }

    createTrees() {
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            // Keep clear area in middle for spawn
            if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
            
            const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.set(x, 2, z);
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            
            const leavesGeo = new THREE.ConeGeometry(3, 6, 8);
            const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
            const leaves = new THREE.Mesh(leavesGeo, leavesMat);
            leaves.position.set(x, 6, z);
            leaves.castShadow = true;
            
            this.scene.add(trunk);
            this.scene.add(leaves);
            
            // Collision bounds
            this.obstacles.push({
                position: new THREE.Vector3(x, 0, z),
                radius: 1.5,
                height: 8
            });
        }
    }

    createRocks() {
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
            
            const size = 1 + Math.random() * 2;
            const rockGeo = new THREE.DodecahedronGeometry(size, 0);
            const rockMat = new THREE.MeshStandardMaterial({ 
                color: 0x808080,
                roughness: 0.8
            });
            const rock = new THREE.Mesh(rockGeo, rockMat);
            rock.position.set(x, size * 0.6, z);
            rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            rock.castShadow = true;
            rock.receiveShadow = true;
            
            this.scene.add(rock);
            
            this.obstacles.push({
                position: new THREE.Vector3(x, 0, z),
                radius: size,
                height: size * 2
            });
        }
    }

    createCover() {
        // Wooden crates/barrels for tactical cover
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
            
            const barrelGeo = new THREE.CylinderGeometry(0.8, 0.8, 2, 12);
            const barrelMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const barrel = new THREE.Mesh(barrelGeo, barrelMat);
            barrel.position.set(x, 1, z);
            barrel.castShadow = true;
            barrel.receiveShadow = true;
            
            // Metal bands
            const bandGeo = new THREE.CylinderGeometry(0.82, 0.82, 0.1, 12);
            const bandMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const band1 = new THREE.Mesh(bandGeo, bandMat);
            band1.position.set(x, 0.3, z);
            const band2 = new THREE.Mesh(bandGeo, bandMat);
            band2.position.set(x, 1.7, z);
            
            this.scene.add(barrel);
            this.scene.add(band1);
            this.scene.add(band2);
            
            this.obstacles.push({
                position: new THREE.Vector3(x, 0, z),
                radius: 0.8,
                height: 2
            });
        }
    }

    createMuzzleSmoke(position, direction) {
        // Create smoke particles
        for (let i = 0; i < 15; i++) {
            const particle = {
                mesh: null,
                velocity: new THREE.Vector3(
                    direction.x * 2 + (Math.random() - 0.5) * 3,
                    2 + Math.random() * 2,
                    direction.z * 2 + (Math.random() - 0.5) * 3
                ),
                life: 1.0 + Math.random() * 1.5,
                maxLife: 1.0 + Math.random() * 1.5,
                size: 0.5 + Math.random() * 0.5
            };
            
            const geo = new THREE.SphereGeometry(particle.size, 6, 6);
            const mat = new THREE.MeshBasicMaterial({
                color: 0xaaaaaa,
                transparent: true,
                opacity: 0.6
            });
            particle.mesh = new THREE.Mesh(geo, mat);
            particle.mesh.position.copy(position);
            particle.mesh.position.x += (Math.random() - 0.5) * 0.5;
            particle.mesh.position.y += (Math.random() - 0.5) * 0.5;
            particle.mesh.position.z += (Math.random() - 0.5) * 0.5;
            
            this.scene.add(particle.mesh);
            this.smokeParticles.push(particle);
        }
    }

    update(delta) {
        // Update smoke particles
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.life -= delta;
            
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.smokeParticles.splice(i, 1);
                continue;
            }
            
            // Move and fade
            p.mesh.position.addScaledVector(p.velocity, delta);
            p.mesh.material.opacity = (p.life / p.maxLife) * 0.6;
            p.mesh.scale.multiplyScalar(1.01); // Expand slightly
            p.velocity.y += delta * 2; // Rise
        }
    }

    checkCollision(position, radius = 0.5) {
        // Check against obstacles and boundaries
        if (position.x < -99 || position.x > 99 || position.z < -99 || position.z > 99) {
            return true;
        }
        
        for (const obs of this.obstacles) {
            const dx = position.x - obs.position.x;
            const dz = position.z - obs.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < (radius + obs.radius)) {
                return true;
            }
        }
        return false;
    }

    resolveCollision(position, radius = 0.5) {
        // Simple collision resolution - push away from obstacle
        for (const obs of this.obstacles) {
            const dx = position.x - obs.position.x;
            const dz = position.z - obs.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const minDist = radius + obs.radius;
            
            if (dist < minDist && dist > 0) {
                const push = (minDist - dist) / dist;
                position.x += dx * push;
                position.z += dz * push;
            }
        }
        
        // World bounds
        position.x = Math.max(-99, Math.min(99, position.x));
        position.z = Math.max(-99, Math.min(99, position.z));
        
        return position;
    }
}

// Expose to global scope for other modules
window.Environment = Environment;
