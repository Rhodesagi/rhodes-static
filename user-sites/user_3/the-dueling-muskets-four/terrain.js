function createTerrain() {
    const size = 100;
    const segments = 50;
    
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    
    // Simple height displacement
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        // Gentle hills
        vertices[i + 1] = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2;
    }
    geometry.computeVertexNormals();
    
    const textureLoader = new THREE.TextureLoader();
    const grassColor = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
    grassColor.wrapS = grassColor.wrapT = THREE.RepeatWrapping;
    grassColor.repeat.set(10, 10);
    
    const material = new THREE.MeshLambertMaterial({ 
        map: grassColor,
        side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -1;
    
    // Add some trees for cover
    addTrees(mesh);
    
    return mesh;
}

function addTrees(ground) {
    const treeGeometry = new THREE.ConeGeometry(1, 3, 8);
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const greenMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const brownMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    for (let i = 0; i < 30; i++) {
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        const y = 0; // ground height at that point
        
        const trunk = new THREE.Mesh(trunkGeometry, brownMaterial);
        trunk.position.set(x, y + 1, z);
        ground.add(trunk);
        
        const top = new THREE.Mesh(treeGeometry, greenMaterial);
        top.position.set(x, y + 3, z);
        ground.add(top);
    }
}