// Musket.js - Historically accurate flintlock musket with granular reload states
const MUSKET_STATES = {
    EMPTY: 0,
    HALF_COCK: 1,
    PRIME_PAN: 2,
    LOAD_POWDER: 3,
    LOAD_BALL: 4,
    RAMROD: 5,
    FULL_COCK: 6,
    READY: 7,
    FIRED: 8
};

const STATE_NAMES = [
    'EMPTY - Hammer Down',
    'HALF_COCK - Safety Position',
    'PRIME PAN - Add Priming Powder',
    'LOAD POWDER - Main Charge',
    'LOAD BALL - Patch and Ball',
    'RAMROD - Seat the Charge',
    'FULL COCK - Ready to Fire',
    'READY - Awaiting Trigger',
    'FIRED - Discharged'
];

class Musket {
    constructor(scene, isPlayer2 = false) {
        this.scene = scene;
        this.state = MUSKET_STATES.EMPTY;
        this.group = new THREE.Group();
        this.isPlayer2 = isPlayer2;
        
        // Create the musket model
        this.createMusket();
        
        // Ramrod state
        this.ramrodIn = true;
        
        // For visual feedback
        this.primed = false;
        this.hasBall = false;
        this.hasPowder = false;
    }
    
    createMusket() {
        const woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a3a2a,
            roughness: 0.8
        });
        
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x5a5a5a,
            roughness: 0.4,
            metalness: 0.8
        });
        
        const darkMetalMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.5,
            metalness: 0.6
        });
        
        // Stock
        const stockGeo = new THREE.BoxGeometry(0.12, 0.2, 0.8);
        // Taper the stock
        const positions = stockGeo.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const z = positions.getZ(i);
            if (z < -0.2) {
                // Narrow at front
                positions.setX(i, positions.getX(i) * 0.7);
            }
        }
        stockGeo.computeVertexNormals();
        
        const stock = new THREE.Mesh(stockGeo, woodMaterial);
        stock.position.set(0, -0.15, 0.2);
        stock.castShadow = true;
        this.group.add(stock);
        
        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.025, 0.03, 1.0, 16);
        const barrel = new THREE.Mesh(barrelGeo, metalMaterial);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, -0.08, -0.3);
        barrel.castShadow = true;
        this.group.add(barrel);
        
        // Bore (visual - dark circle at muzzle)
        const muzzleGeo = new THREE.CircleGeometry(0.015, 12);
        const muzzleMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, -0.08, -0.8);
        this.group.add(muzzle);
        
        // Lock mechanism (flintlock)
        this.lockGroup = new THREE.Group();
        
        // Lock plate
        const lockPlateGeo = new THREE.BoxGeometry(0.06, 0.12, 0.2);
        const lockPlate = new THREE.Mesh(lockPlateGeo, darkMetalMaterial);
        lockPlate.position.set(0.07, -0.1, -0.1);
        this.lockGroup.add(lockPlate);
        
        // Hammer (cock)
        this.hammerGroup = new THREE.Group();
        const hammerGeo = new THREE.BoxGeometry(0.03, 0.12, 0.04);
        const hammer = new THREE.Mesh(hammerGeo, darkMetalMaterial);
        hammer.position.set(0, 0.06, 0);
        this.hammerGroup.add(hammer);
        this.hammerGroup.position.set(0.1, -0.06, -0.08);
        this.lockGroup.add(this.hammerGroup);
        
        // Frizzen (cover)
        this.frizzenGroup = new THREE.Group();
        const frizzenGeo = new THREE.BoxGeometry(0.04, 0.08, 0.02);
        const frizzen = new THREE.Mesh(frizzenGeo, darkMetalMaterial);
        frizzen.position.set(0, 0.04, 0);
        this.frizzenGroup.add(frizzen);
        this.frizzenGroup.position.set(0.1, -0.12, -0.12);
        this.lockGroup.add(this.frizzenGroup);
        
        // Pan (primed indicator)
        this.panGeo = new THREE.BoxGeometry(0.03, 0.005, 0.04);
        this.panMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        this.pan = new THREE.Mesh(this.panGeo, this.panMat);
        this.pan.position.set(0.1, -0.12, -0.12);
        this.lockGroup.add(this.pan);
        
        this.group.add(this.lockGroup);
        
        // Ramrod
        this.ramrodGeo = new THREE.CylinderGeometry(0.004, 0.004, 1.0, 8);
        this.ramrod = new THREE.Mesh(this.ramrodGeo, darkMetalMaterial);
        this.ramrod.rotation.x = Math.PI / 2;
        this.ramrod.position.set(0, -0.22, -0.3);
        this.group.add(this.ramrod);
        
        // Ramrod handle
        const ramrodHandleGeo = new THREE.BoxGeometry(0.015, 0.02, 0.06);
        this.ramrodHandle = new THREE.Mesh(ramrodHandleGeo, woodMaterial);
        this.ramrodHandle.position.set(0, -0.22, 0.22);
        this.group.add(this.ramrodHandle);
        
        // Buttplate
        const buttplateGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.08, 16);
        const buttplate = new THREE.Mesh(buttplateGeo, metalMaterial);
        buttplate.rotation.x = Math.PI / 2;
        buttplate.rotation.y = Math.PI / 8;
        buttplate.position.set(0, -0.18, 0.6);
        this.group.add(buttplate);
        
        // Trigger guard
        const triggerGuardGeo = new THREE.TorusGeometry(0.04, 0.005, 8, 16, Math.PI);
        const triggerGuard = new THREE.Mesh(triggerGuardGeo, darkMetalMaterial);
        triggerGuard.rotation.z = Math.PI;
        triggerGuard.position.set(0, -0.22, 0.25);
        this.group.add(triggerGuard);
        
        // Trigger
        const triggerGeo = new THREE.BoxGeometry(0.005, 0.03, 0.01);
        this.trigger = new THREE.Mesh(triggerGeo, darkMetalMaterial);
        this.trigger.position.set(0, -0.20, 0.25);
        this.trigger.rotation.x = -0.3;
        this.group.add(this.trigger);
        
        // Sights
        this.addSights(darkMetalMaterial);
        
        this.scene.add(this.group);
    }
    
    addSights(material) {
        // Rear sight (V-notch)
        const rearSightGeo = new THREE.BoxGeometry(0.02, 0.015, 0.005);
        const rearNotch = new THREE.Mesh(rearSightGeo, material);
        rearNotch.position.set(0, -0.04, 0.55);
        this.group.add(rearNotch);
        
        // Front sight (blade)
        const frontSightGeo = new THREE.BoxGeometry(0.005, 0.025, 0.003);
        const frontSight = new THREE.Mesh(frontSightGeo, material);
        frontSight.position.set(0, -0.045, -0.75);
        this.group.add(frontSight);
    }
    
    // Advance reload state
    advanceReload() {
        if (this.state === MUSKET_STATES.FIRED) {
            this.state = MUSKET_STATES.EMPTY;
        }
        
        if (this.state < MUSKET_STATES.READY) {
            this.state++;
            this.updateVisualState();
            return true;
        }
        return false;
    }
    
    // Attempt to fire
    fire() {
        if (this.state === MUSKET_STATES.READY) {
            this.state = MUSKET_STATES.FIRED;
            this.updateVisualState();
            
            // Return muzzle position and direction
            const muzzlePos = new THREE.Vector3(0, -0.08, -0.8);
            muzzlePos.applyMatrix4(this.group.matrixWorld);
            
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.group.quaternion);
            
            return { fired: true, position: muzzlePos, direction: direction };
        }
        return { fired: false };
    }
    
    updateVisualState() {
        // Hammer position
        const hammerRotations = {
            [MUSKET_STATES.EMPTY]: Math.PI / 4,
            [MUSKET_STATES.HALF_COCK]: Math.PI / 2.5,
            [MUSKET_STATES.PRIME_PAN]: Math.PI / 2.5,
            [MUSKET_STATES.LOAD_POWDER]: Math.PI / 2.5,
            [MUSKET_STATES.LOAD_BALL]: Math.PI / 2.5,
            [MUSKET_STATES.RAMROD]: Math.PI / 2.5,
            [MUSKET_STATES.FULL_COCK]: Math.PI / 1.8,
            [MUSKET_STATES.READY]: Math.PI / 1.8,
            [MUSKET_STATES.FIRED]: Math.PI / 4
        };
        
        this.hammerGroup.rotation.z = hammerRotations[this.state] || 0;
        
        // Frizzen (pan cover)
        if (this.state === MUSKET_STATES.PRIME_PAN) {
            this.frizzenGroup.rotation.x = Math.PI / 3; // Open
        } else if (this.state >= MUSKET_STATES.LOAD_POWDER && this.state <= MUSKET_STATES.FULL_COCK) {
            this.frizzenGroup.rotation.x = 0; // Closed
        } else if (this.state === MUSKET_STATES.FIRED) {
            this.frizzenGroup.rotation.x = Math.PI / 4; // Blown open
        }
        
        // Primed pan color
        if (this.state === MUSKET_STATES.PRIME_PAN) {
            this.panMat.color.setHex(0xc9a86c); // Gold - primed
        } else if (this.state === MUSKET_STATES.FIRED) {
            this.panMat.color.setHex(0x4a3a2a); // Burnt
        } else {
            this.panMat.color.setHex(0x1a1a1a); // Empty
        }
        
        // Ramrod animation during RAMROD state
        if (this.state === MUSKET_STATES.RAMROD) {
            this.animateRamrod();
        } else {
            this.ramrod.position.set(0, -0.22, -0.3);
            this.ramrod.rotation.set(Math.PI / 2, 0, 0);
            this.ramrodHandle.visible = true;
        }
        
        // Trigger animation
        if (this.state === MUSKET_STATES.FIRED) {
            this.trigger.rotation.x = 0.2; // Pulled
        } else {
            this.trigger.rotation.x = -0.3; // Forward
        }
    }
    
    animateRamrod() {
        // Show ramrod being used
        const time = Date.now() * 0.005;
        const pullOut = Math.sin(time) * 0.3 + 0.3;
        
        // Ramrod pulled out and moved to bore
        this.ramrod.position.set(0, -0.08 + pullOut * 0.3, -0.3);
        this.ramrod.rotation.set(Math.PI / 2, 0, pullOut * 0.5);
        this.ramrodHandle.visible = false;
    }
    
    update(time, deltaTime) {
        // Continuous animations
        if (this.state === MUSKET_STATES.RAMROD) {
            this.animateRamrod();
        }
    }
    
    getStateName() {
        return STATE_NAMES[this.state];
    }
    
    canFire() {
        return this.state === MUSKET_STATES.READY;
    }
    
    needsReload() {
        return this.state === MUSKET_STATES.EMPTY || this.state === MUSKET_STATES.FIRED;
    }
    
    reset() {
        this.state = MUSKET_STATES.READY;
        this.updateVisualState();
    }
    
    fullReset() {
        this.state = MUSKET_STATES.EMPTY;
        this.updateVisualState();
    }
    
    getMesh() {
        return this.group;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Musket, MUSKET_STATES };
}
