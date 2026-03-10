function createArena(scene) {
    const walls = [];
    const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0x5a4a3a,
        roughness: 0.9
    });
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x3a3a2a,
        roughness: 1.0
    });
    
    // Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 30),
        floorMat
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    
    // Create wall function
    function createWall(x, z, w, d, h = 3) {
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            wallMat
        );
        wall.position.set(x, h / 2, z);
        scene.add(wall);
        walls.push(wall);
        return wall;
    }
    
    // Outer walls
    createWall(0, -15, 30, 1);   // North
    createWall(0, 15, 30, 1);    // South
    createWall(-15, 0, 1, 30);   // West
    createWall(15, 0, 1, 30);    // East
    
    // Central obstacles
    createWall(0, 0, 4, 4, 2.5);     // Central block
    createWall(-8, -8, 3, 3, 2);     // SW corner block
    createWall(8, 8, 3, 3, 2);       // NE corner block
    createWall(-8, 8, 3, 3, 2);      // NW corner block
    createWall(8, -8, 3, 3, 2);      // SE corner block
    
    // Barricades
    createWall(0, -10, 6, 1, 1.5);   // North barricade
    createWall(0, 10, 6, 1, 1.5);    // South barricade
    createWall(-10, 0, 1, 6, 1.5);   // West barricade
    createWall(10, 0, 1, 6, 1.5);    // East barricade
    
    // Add some cover blocks
    createWall(-5, -5, 2, 2, 1.2);
    createWall(5, 5, 2, 2, 1.2);
    createWall(-5, 5, 2, 2, 1.2);
    createWall(5, -5, 2, 2, 1.2);
    
    // Add lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    scene.add(sun);
    
    // Add some atmospheric fog
    scene.fog = new THREE.Fog(0x8a7a6a, 5, 25);
    
    return walls;
}
