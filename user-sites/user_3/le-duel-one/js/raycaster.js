/**
 * Raycasting Engine - Pseudo-3D rendering (Wolfenstein/Doom style)
 * No WebGL - pure Canvas 2D raycasting
 */

const Raycaster = {
    // Map dimensions
    MAP_WIDTH: 16,
    MAP_HEIGHT: 16,
    
    // Cell size in world units
    CELL_SIZE: 64,
    
    // Field of view
    FOV: Math.PI / 3, // 60 degrees
    
    // The world map (1 = wall, 0 = empty)
    map: [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,1,1,0,0,0,0,0,0,1,1,0,0,1],
        [1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,0,1,1,0,0,0,0,0,0,0,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    
    // Wall textures (simplified - colors for different wall types)
    wallColors: {
        1: { r: 139, g: 90, b: 43 },    // Wood/brown
        2: { r: 100, g: 100, b: 100 },  // Stone
        3: { r: 160, g: 82, b: 45 }     // Dark wood
    },
    
    /**
     * Cast a single ray and return hit information
     * Uses DDA (Digital Differential Analysis) algorithm
     */
    castRay(x, y, angle) {
        const rayDirX = Math.cos(angle);
        const rayDirY = Math.sin(angle);
        
        // Which map cell we're in
        let mapX = Math.floor(x / this.CELL_SIZE);
        let mapY = Math.floor(y / this.CELL_SIZE);
        
        // Length of ray from current position to next x or y-side
        let sideDistX, sideDistY;
        
        // Length of ray from one x or y-side to next
        const deltaDistX = Math.abs(1 / rayDirX);
        const deltaDistY = Math.abs(1 / rayDirY);
        
        // Direction to step
        let stepX, stepY;
        
        // Was a NS or a EW wall hit?
        let side;
        
        // Calculate step and initial sideDist
        if (rayDirX < 0) {
            stepX = -1;
            sideDistX = (x / this.CELL_SIZE - mapX) * deltaDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1 - x / this.CELL_SIZE) * deltaDistX;
        }
        
        if (rayDirY < 0) {
            stepY = -1;
            sideDistY = (y / this.CELL_SIZE - mapY) * deltaDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1 - y / this.CELL_SIZE) * deltaDistY;
        }
        
        // Perform DDA
        let hit = false;
        let wallType = 0;
        
        while (!hit) {
            // Jump to next map square
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
            }
            
            // Check if ray has hit a wall
            if (mapX < 0 || mapX >= this.MAP_WIDTH || mapY < 0 || mapY >= this.MAP_HEIGHT) {
                hit = true;
                wallType = 1;
            } else if (this.map[mapY][mapX] > 0) {
                hit = true;
                wallType = this.map[mapY][mapX];
            }
        }
        
        // Calculate distance projected on camera direction
        let perpWallDist;
        if (side === 0) {
            perpWallDist = (mapX - x / this.CELL_SIZE + (1 - stepX) / 2) / rayDirX;
        } else {
            perpWallDist = (mapY - y / this.CELL_SIZE + (1 - stepY) / 2) / rayDirY;
        }
        
        // Calculate exact hit position for texture coordinate
        let wallX;
        if (side === 0) {
            wallX = y / this.CELL_SIZE + perpWallDist * rayDirY;
        } else {
            wallX = x / this.CELL_SIZE + perpWallDist * rayDirX;
        }
        wallX -= Math.floor(wallX);
        
        return {
            distance: perpWallDist * this.CELL_SIZE,
            side: side,
            wallType: wallType,
            wallX: wallX,
            mapX: mapX,
            mapY: mapY
        };
    },
    
    /**
     * Check if position is valid (not inside wall)
     */
    isValidPosition(x, y, radius = 10) {
        const minX = Math.floor((x - radius) / this.CELL_SIZE);
        const maxX = Math.floor((x + radius) / this.CELL_SIZE);
        const minY = Math.floor((y - radius) / this.CELL_SIZE);
        const maxY = Math.floor((y + radius) / this.CELL_SIZE);
        
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (y < 0 || y >= this.MAP_HEIGHT || x < 0 || x >= this.MAP_WIDTH) {
                    return false;
                }
                if (this.map[y][x] > 0) {
                    return false;
                }
            }
        }
        return true;
    },
    
    /**
     * Get wall color with distance shading
     */
    getWallColor(wallType, side, distance) {
        const baseColor = this.wallColors[wallType] || this.wallColors[1];
        
        // Darken based on distance (fog)
        const maxDist = 800;
        const fogFactor = Math.min(1, distance / maxDist);
        
        // Side shading (NS walls darker)
        const sideFactor = side === 1 ? 0.7 : 1.0;
        
        return {
            r: Math.floor(baseColor.r * sideFactor * (1 - fogFactor * 0.7)),
            g: Math.floor(baseColor.g * sideFactor * (1 - fogFactor * 0.7)),
            b: Math.floor(baseColor.b * sideFactor * (1 - fogFactor * 0.7))
        };
    }
};
