// musket-duel/world.js
// Simple arena world for dueling

const World = {
  width: 100,
  depth: 100,
  wallHeight: 3,
  
  // Simple layout: open arena with 4 pillars for cover
  walls: [],
  pillars: [
    { x: 25, z: 25, w: 4, d: 4 },
    { x: 75, z: 25, w: 4, d: 4 },
    { x: 25, z: 75, w: 4, d: 4 },
    { x: 75, z: 75, w: 4, d: 4 }
  ],
  
  init() {
    // Boundary walls
    this.walls.push({ x: -2, z: 0, w: 2, d: 100 }); // Left
    this.walls.push({ x: 100, z: 0, w: 2, d: 100 }); // Right
    this.walls.push({ x: 0, z: -2, w: 100, d: 2 }); // Top
    this.walls.push({ x: 0, z: 100, w: 100, d: 2 }); // Bottom
  },
  
  // Ray-wall intersection for raycasting
  castRay(rayX, rayZ, rayDirX, rayDirZ, maxDist = 20) {
    let dist = 0;
    let step = 0.1;
    
    while (dist < maxDist) {
      const x = rayX + rayDirX * dist;
      const z = rayZ + rayDirZ * dist;
      
      // Check all walls and pillars
      for (const wall of this.walls) {
        if (x >= wall.x && x <= wall.x + wall.w &&
            z >= wall.z && z <= wall.z + wall.d) {
          return { hit: true, dist: dist, x: x, z: z, type: 'wall' };
        }
      }
      
      for (const pillar of this.pillars) {
        if (x >= pillar.x && x <= pillar.x + pillar.w &&
            z >= pillar.z && z <= pillar.z + pillar.d) {
          return { hit: true, dist: dist, x: x, z: z, type: 'pillar' };
        }
      }
      
      // Check bounds
      if (x < 0 || x > this.width || z < 0 || z > this.depth) {
        return { hit: true, dist: dist, x: x, z: z, type: 'boundary' };
      }
      
      dist += step;
    }
    
    return { hit: false, dist: maxDist };
  },
  
  // Check if point is inside a wall (for collision)
  isSolid(x, z) {
    for (const wall of this.walls) {
      if (x >= wall.x && x <= wall.x + wall.w &&
          z >= wall.z && z <= wall.z + wall.d) {
        return true;
      }
    }
    for (const pillar of this.pillars) {
      if (x >= pillar.x && x <= pillar.x + pillar.w &&
          z >= pillar.z && z <= pillar.z + pillar.d) {
        return true;
      }
    }
    return x < 0 || x > this.width || z < 0 || z > this.depth;
  },
  
  // Check line segment for collision
  lineHitsWall(x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const dist = Math.sqrt(dx*dx + dz*dz);
    const steps = Math.ceil(dist * 2); // Check every 0.5 units
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + dx * t;
      const z = z1 + dz * t;
      if (this.isSolid(x, z)) return true;
    }
    return false;
  }
};

World.init();
