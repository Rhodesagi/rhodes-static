// 3D Iron sights geometry that renders in first-person view

class IronSights {
    constructor() {
        this.group = new THREE.Group();
        this.createSights();
    }
    
    createSights() {
        // Materials
        const steelMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        
        // Rear sight (notch/aperture)
        // Two posts forming a notch
        const rearHeight = 0.015;
        const rearWidth = 0.008;
        const rearDepth = 0.002;
        const notchWidth = 0.004;
        
        // Left rear post
        const leftPostGeo = new THREE.BoxGeometry(rearWidth, rearHeight, rearDepth);
        const leftPost = new THREE.Mesh(leftPostGeo, steelMat);
        leftPost.position.set(-notchWidth/2 - rearWidth/2, rearHeight/2, 0);
        this.group.add(leftPost);
        
        // Right rear post
        const rightPostGeo = new THREE.BoxGeometry(rearWidth, rearHeight, rearDepth);
        const rightPost = new THREE.Mesh(rightPostGeo, steelMat);
        rightPost.position.set(notchWidth/2 + rearWidth/2, rearHeight/2, 0);
        this.group.add(rightPost);
        
        // Front sight post (blade)
        const frontHeight = 0.02;
        const frontWidth = 0.003;
        const frontDepth = 0.002;
        const frontGeo = new THREE.BoxGeometry(frontWidth, frontHeight, frontDepth);
        const frontPost = new THREE.Mesh(frontGeo, steelMat);
        frontPost.position.set(0, frontHeight/2, -0.15); // 15cm forward
        this.group.add(frontPost);
        
        // Position entire sight group in front of camera
        this.group.position.set(0, -0.02, -0.3);
        
        // Initially hidden
        this.group.visible = false;
    }
    
    show() {
        this.group.visible = true;
    }
    
    hide() {
        this.group.visible = false;
    }
    
    setActive(active) {
        this.group.visible = active;
    }
    
    // Get the group to attach to camera
    getMesh() {
        return this.group;
    }
}

// Export
window.IronSights = IronSights;
