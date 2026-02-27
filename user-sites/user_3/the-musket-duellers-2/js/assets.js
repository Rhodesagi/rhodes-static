/**
 * Procedural Asset Generation - No External Dependencies
 * Generates musket geometry, environment, and materials programmatically
 */

const AssetGenerator = {
    materials: {},
    geometries: {},

    init: function() {
        this.createMaterials();
    },

    createMaterials: function() {
        // Wood stock material
        this.materials.wood = new THREE.MeshStandardMaterial({
            color: 0x5C4033,
            roughness: 0.8,
            metalness: 0.1
        });

        // Steel barrel material
        this.materials.steel = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.3,
            metalness: 0.9
        });

        // Brass furniture
        this.materials.brass = new THREE.MeshStandardMaterial({
            color: 0xB5A642,
            roughness: 0.4,
            metalness: 0.8
        });

        // Flint material
        this.materials.flint = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.9,
            metalness: 0.0
        });

        // Ground material
        this.materials.ground = new THREE.MeshStandardMaterial({
            color: 0x3d4c3d,
            roughness: 0.9,
            metalness: 0.0
        });

        // Sky material
        this.materials.sky = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide
        });
    },

    createMusket: function() {
        const musketGroup = new THREE.Group();

        // Main barrel (octagonal to round transition)
        const barrelGeo = new THREE.CylinderGeometry(0.04, 0.035, 1.4, 16);
        barrelGeo.rotateX(-Math.PI / 2);
        const barrel = new THREE.Mesh(barrelGeo, this.materials.steel);
        barrel.position.z = -0.3;
        musketGroup.add(barrel);

        // Breech area
        const breechGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.3, 16);
        breechGeo.rotateX(-Math.PI / 2);
        const breech = new THREE.Mesh(breechGeo, this.materials.steel);
        breech.position.z = 0.35;
        musketGroup.add(breech);

        // Stock (main body)
        const stockGeo = new THREE.BoxGeometry(0.12, 0.15, 1.0);
        // Deform stock to look more realistic
        const stockPositions = stockGeo.attributes.position;
        for (let i = 0; i < stockPositions.count; i++) {
            const z = stockPositions.getZ(i);
            const y = stockPositions.getY(i);
            // Taper toward front
            if (z < 0) {
                const factor = Math.abs(z) * 0.3;
                stockPositions.setX(i, stockPositions.getX(i) * (1 - factor));
                stockPositions.setY(i, y * (1 - factor * 0.5));
            }
            // Butt swell
            if (z > 0.3) {
                stockPositions.setX(i, stockPositions.getX(i) * 1.2);
            }
        }
        stockGeo.computeVertexNormals();
        const stock = new THREE.Mesh(stockGeo, this.materials.wood);
        stock.position.set(0, -0.05, 0.4);
        musketGroup.add(stock);

        // Lock plate (side mechanism)
        const lockGeo = new THREE.BoxGeometry(0.02, 0.12, 0.25);
        const lockPlate = new THREE.Mesh(lockGeo, this.materials.steel);
        lockPlate.position.set(0.07, 0.02, 0.3);
        musketGroup.add(lockPlate);

        // Hammer (cock)
        const hammerGeo = new THREE.BoxGeometry(0.03, 0.15, 0.08);
        this.hammer = new THREE.Mesh(hammerGeo, this.materials.steel);
        this.hammer.position.set(0.08, 0.1, 0.15);
        this.hammer.geometry.translate(0, 0.075, 0);
        this.hammer.rotation.x = -0.3; // Half-cock position
        musketGroup.add(this.hammer);

        // Frizzen (steel striking plate)
        const frizzenGeo = new THREE.BoxGeometry(0.02, 0.08, 0.08);
        this.frizzen = new THREE.Mesh(frizzenGeo, this.materials.steel);
        this.frizzen.position.set(0.08, 0.05, 0.38);
        this.frizzen.rotation.x = 0.5; // Closed position
        musketGroup.add(this.frizzen);

        // Pan (powder holder)
        const panGeo = new THREE.BoxGeometry(0.04, 0.02, 0.04);
        const pan = new THREE.Mesh(panGeo, this.materials.steel);
        pan.position.set(0.08, 0.05, 0.38);
        musketGroup.add(pan);

        // Front sight (blade type)
        const frontSightGeo = new THREE.BoxGeometry(0.02, 0.06, 0.01);
        frontSightGeo.translate(0, 0.03, 0);
        const frontSight = new THREE.Mesh(frontSightGeo, this.materials.brass);
        frontSight.position.set(0, 0.02, -0.95);
        musketGroup.add(frontSight);

        // Rear sight (notch type - authentic to period)
        const rearSightBaseGeo = new THREE.BoxGeometry(0.08, 0.04, 0.02);
        const rearSightBase = new THREE.Mesh(rearSightBaseGeo, this.materials.brass);
        rearSightBase.position.set(0, 0.02, -0.15);
        musketGroup.add(rearSightBase);

        // Rear sight notch (U-shaped)
        const rearSightNotchGeo = new THREE.BoxGeometry(0.02, 0.03, 0.02);
        const rearSightNotch = new THREE.Mesh(rearSightNotchGeo, this.materials.brass);
        rearSightNotch.position.set(0, 0.055, -0.15);
        musketGroup.add(rearSightNotch);

        // Trigger guard
        const triggerGuardGeo = new THREE.TorusGeometry(0.04, 0.005, 8, 16, Math.PI);
        triggerGuardGeo.rotateZ(Math.PI / 2);
        const triggerGuard = new THREE.Mesh(triggerGuardGeo, this.materials.brass);
        triggerGuard.position.set(0, -0.08, 0.55);
        musketGroup.add(triggerGuard);

        // Trigger
        const triggerGeo = new THREE.BoxGeometry(0.01, 0.03, 0.01);
        const trigger = new THREE.Mesh(triggerGeo, this.materials.steel);
        trigger.position.set(0, -0.06, 0.55);
        musketGroup.add(trigger);

        // Butt plate
        const buttPlateGeo = new THREE.BoxGeometry(0.13, 0.16, 0.02);
        const buttPlate = new THREE.Mesh(buttPlateGeo, this.materials.brass);
        buttPlate.position.set(0, -0.05, 0.91);
        musketGroup.add(buttPlate);

        // Ramrod (stored under barrel)
        const ramrodGeo = new THREE.CylinderGeometry(0.008, 0.008, 1.2, 8);
        ramrodGeo.rotateX(-Math.PI / 2);
        const ramrod = new THREE.Mesh(ramrodGeo, this.materials.steel);
        ramrod.position.set(0.06, -0.08, -0.2);
        musketGroup.add(ramrod);

        musketGroup.userData = {
            hammer: this.hammer,
            frizzen: this.frizzen
        };

        return musketGroup;
    },

    createEnvironment: function() {
        const envGroup = new THREE.Group();

        // Ground plane
        const groundGeo = new THREE.PlaneGeometry(200, 200, 50, 50);
        // Add some terrain variation
        const positions = groundGeo.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            // Gentle rolling hills
            const height = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.5 +
                          Math.sin(x * 0.2) * Math.sin(y * 0.15) * 0.2;
            positions.setZ(i, height);
        }
        groundGeo.computeVertexNormals();

        const ground = new THREE.Mesh(groundGeo, this.materials.ground);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        envGroup.add(ground);

        // Sky dome
        const skyGeo = new THREE.SphereGeometry(100, 32, 32);
        const sky = new THREE.Mesh(skyGeo, this.materials.sky);
        envGroup.add(sky);

        // Add some trees (procedural)
        for (let i = 0; i < 20; i++) {
            const tree = this.createTree();
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * 40;
            tree.position.set(
                Math.cos(angle) * distance,
                -1,
                Math.sin(angle) * distance
            );
            envGroup.add(tree);
        }

        // Dueling markers (barrels)
        const barrelPositions = [
            { x: -8, z: -8 }, { x: 8, z: -8 },
            { x: -8, z: 8 }, { x: 8, z: 8 }
        ];

        barrelPositions.forEach(pos => {
            const barrel = this.createBarrel();
            barrel.position.set(pos.x, -0.5, pos.z);
            envGroup.add(barrel);
        });

        return envGroup;
    },

    createTree: function() {
        const treeGroup = new THREE.Group();

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: 0x4a3728,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.5;
        treeGroup.add(trunk);

        // Foliage (multiple layers)
        const foliageMat = new THREE.MeshStandardMaterial({
            color: 0x2d5a27,
            roughness: 0.8
        });

        for (let i = 0; i < 3; i++) {
            const size = 2.5 - i * 0.5;
            const foliageGeo = new THREE.ConeGeometry(size, 2, 8);
            const foliage = new THREE.Mesh(foliageGeo, foliageMat);
            foliage.position.y = 3 + i * 1.2;
            treeGroup.add(foliage);
        }

        return treeGroup;
    },

    createBarrel: function() {
        const barrelGroup = new THREE.Group();

        const barrelGeo = new THREE.CylinderGeometry(0.4, 0.45, 1.2, 12);
        const barrelMat = new THREE.MeshStandardMaterial({
            color: 0x4a3728,
            roughness: 0.7
        });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.y = 0.6;
        barrelGroup.add(barrel);

        // Metal bands
        for (let i = 0; i < 3; i++) {
            const bandGeo = new THREE.TorusGeometry(0.42, 0.02, 8, 16);
            const band = new THREE.Mesh(bandGeo, this.materials.steel);
            band.rotation.x = Math.PI / 2;
            band.position.y = 0.2 + i * 0.4;
            barrelGroup.add(band);
        }

        return barrelGroup;
    },

    createBullet: function() {
        const bulletGeo = new THREE.SphereGeometry(0.015, 8, 8);
        const bulletMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.4,
            metalness: 0.9
        });
        return new THREE.Mesh(bulletGeo, bulletMat);
    },

    createMuzzleFlash: function() {
        const flashGroup = new THREE.Group();

        // Core flash
        const coreGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        flashGroup.add(core);

        // Outer flash
        const outerGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const outerMat = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.5
        });
        const outer = new THREE.Mesh(outerGeo, outerMat);
        flashGroup.add(outer);

        // Smoke particles
        for (let i = 0; i < 8; i++) {
            const smokeGeo = new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 6, 6);
            const smokeMat = new THREE.MeshBasicMaterial({
                color: 0x666666,
                transparent: true,
                opacity: 0.4
            });
            const smoke = new THREE.Mesh(smokeGeo, smokeMat);
            smoke.position.set(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.3
            );
            smoke.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    Math.random() * 0.1,
                    0.2 + Math.random() * 0.2
                ),
                life: 1.0
            };
            flashGroup.add(smoke);
        }

        flashGroup.userData = { life: 0.1, core: core, outer: outer };
        return flashGroup;
    }
};