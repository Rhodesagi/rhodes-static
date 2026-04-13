/**
 * Simple Musket - Guaranteed visible
 */
class Musket {
    constructor(scene, isPlayer1, onReloadComplete = null) {
        this.scene = scene;
        this.isPlayer1 = isPlayer1;
        this.isLoaded = true;
        this.isReloading = false;
        this.onReloadComplete = onReloadComplete;
        this.animationSystem = new AnimationSystem();
        
        // Build simple visible musket
        this.mesh = new THREE.Group();
        
        // BRIGHT COLORS
        const woodMat = new THREE.MeshBasicMaterial({ color: 0xff6600 }); // Orange wood
        const metalMat = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Cyan metal
        
        // Stock - simple box
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 1.5), woodMat);
        stock.position.set(0, -0.2, 0.5);
        this.mesh.add(stock);
        
        // Barrel - cylinder
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8), metalMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.1, -0.4);
        this.mesh.add(barrel);
        
        // Hammer - small box
        const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), metalMat);
        hammer.position.set(0.1, 0.25, 0.2);
        this.mesh.add(hammer);
        
        // Position
        this.mesh.position.set(0.4, -0.4, -0.8);
        
        console.log("SIMPLE MUSKET CREATED with", this.mesh.children.length, "parts");
    }
    
    update(deltaTime, isAiming, camera) {
        // Aim position
        if (isAiming) {
            this.mesh.position.lerp(new THREE.Vector3(0, -0.2, -0.6), deltaTime * 8);
        } else {
            this.mesh.position.lerp(new THREE.Vector3(0.4, -0.4, -0.8), deltaTime * 8);
        }
    }
    
    fire() {
        if (!this.isLoaded || this.isReloading) return false;
        this.isLoaded = false;
        console.log("MUSKET FIRED");
        return true;
    }
    
    startReload() {
        if (this.isReloading || this.isLoaded) return false;
        this.isReloading = true;
        setTimeout(() => {
            this.isReloading = false;
            this.isLoaded = true;
            if (this.onReloadComplete) this.onReloadComplete(this);
            console.log("MUSKET RELOADED");
        }, 2000);
        return true;
    }
    
    getMuzzlePosition() {
        const pos = new THREE.Vector3(0, 0.1, -1.3);
        pos.applyMatrix4(this.mesh.matrixWorld);
        return pos;
    }
    
    reset() {
        this.isLoaded = true;
        this.isReloading = false;
    }
}
