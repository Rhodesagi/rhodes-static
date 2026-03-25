// Map and raycasting engine for pseudo-3D rendering

export class Map {
    constructor() {
        // 10x10 grid map (1 = wall, 0 = empty)
        this.grid = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 1, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 1, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];
        
        this.width = this.grid[0].length;
        this.height = this.grid.length;
        
        // Wall colors
        this.wallColors = {
            1: '#8b4513', // Brown wood
        };
        
        // Floor and ceiling colors
        this.floorColor = '#2a2a2a';
        this.ceilingColor = '#1a1a1a';
    }
    
    isWall(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return true; // Boundary is wall
        }
        return this.grid[Math.floor(y)][Math.floor(x)] === 1;
    }
    
    castRay(playerX, playerY, rayAngle, maxDepth = 20) {
        // Normalize ray angle
        rayAngle = rayAngle % (Math.PI * 2);
        if (rayAngle < 0) rayAngle += Math.PI * 2;
        
        // Ray direction components
        const rayDirX = Math.cos(rayAngle);
        const rayDirY = Math.sin(rayAngle);
        
        // Player's position in the grid
        const mapX = Math.floor(playerX);
        const mapY = Math.floor(playerY);
        
        // Length of ray from current position to next x or y-side
        let sideDistX, sideDistY;
        
        // Length of ray from one x or y-side to next x or y-side
        const deltaDistX = Math.abs(1 / rayDirX);
        const deltaDistY = Math.abs(1 / rayDirY);
        
        // Direction to step in x or y-direction (either +1 or -1)
        let stepX, stepY;
        
        let hit = 0; // Was there a wall hit?
        let side; // Was a NS or a EW wall hit?
        
        // Calculate step and initial sideDist
        if (rayDirX < 0) {
            stepX = -1;
            sideDistX = (playerX - mapX) * deltaDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1.0 - playerX) * deltaDistX;
        }
        
        if (rayDirY < 0) {
            stepY = -1;
            sideDistY = (playerY - mapY) * deltaDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1.0 - playerY) * deltaDistY;
        }
        
        // Perform DDA (Digital Differential Analysis)
        let currentX = mapX;
        let currentY = mapY;
        
        while (hit === 0 && Math.abs(currentX - mapX) < maxDepth && Math.abs(currentY - mapY) < maxDepth) {
            // Jump to next map square, either in x-direction, or in y-direction
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                currentX += stepX;
                side = 0;
            } else {
                sideDistY += deltaDistY;
                currentY += stepY;
                side = 1;
            }
            
            // Check if ray has hit a wall
            if (currentX < 0 || currentX >= this.width || currentY < 0 || currentY >= this.height) {
                hit = 1; // Hit boundary
            } else if (this.grid[currentY][currentX] === 1) {
                hit = 1;
            }
        }
        
        // Calculate distance projected on camera direction (Euclidean distance would give fisheye effect)
        let perpWallDist;
        if (side === 0) {
            perpWallDist = (currentX - playerX + (1 - stepX) / 2) / rayDirX;
        } else {
            perpWallDist = (currentY - playerY + (1 - stepY) / 2) / rayDirY;
        }
        
        // Avoid division by zero
        if (perpWallDist < 0.001) perpWallDist = 0.001;
        
        return {
            distance: perpWallDist,
            hit: hit === 1,
            side: side, // 0 = x-side (EW wall), 1 = y-side (NS wall)
            mapX: currentX,
            mapY: currentY,
            rayDirX: rayDirX,
            rayDirY: rayDirY
        };
    }
    
    renderView(ctx, player, viewportX, viewportY, viewportWidth, viewportHeight) {
        // Draw ceiling
        ctx.fillStyle = this.ceilingColor;
        ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight / 2);
        
        // Draw floor
        ctx.fillStyle = this.floorColor;
        ctx.fillRect(viewportX, viewportY + viewportHeight / 2, viewportWidth, viewportHeight / 2);
        
        // Raycasting for each column
        const playerX = player.x;
        const playerY = player.y;
        const playerAngle = player.angle;
        
        // Field of view
        const fov = Math.PI / 2; // 90 degrees
        
        for (let x = 0; x < viewportWidth; x++) {
            // Calculate ray position and direction
            const cameraX = 2 * x / viewportWidth - 1; // x-coordinate in camera space (-1 to 1)
            const rayAngle = playerAngle + cameraX * fov / 2;
            
            // Cast ray
            const ray = this.castRay(playerX, playerY, rayAngle);
            
            if (ray.hit) {
                // Calculate height of line to draw on screen
                const lineHeight = Math.min(viewportHeight, viewportHeight / ray.distance);
                
                // Calculate lowest and highest pixel to fill in current stripe
                const drawStart = Math.max(0, viewportHeight / 2 - lineHeight / 2);
                const drawEnd = Math.min(viewportHeight, viewportHeight / 2 + lineHeight / 2);
                
                // Choose wall color
                let color = this.wallColors[1];
                
                // Darken color based on side and distance
                let darken = 1.0 - Math.min(ray.distance / 10, 0.5);
                
                if (ray.side === 1) {
                    darken *= 0.7; // Darken y-side walls
                }
                
                // Apply darkening
                const rgb = this.hexToRgb(color);
                const darkened = {
                    r: Math.floor(rgb.r * darken),
                    g: Math.floor(rgb.g * darken),
                    b: Math.floor(rgb.b * darken)
                };
                
                ctx.fillStyle = `rgb(${darkened.r}, ${darkened.g}, ${darkened.b})`;
                
                // Draw the wall slice
                ctx.fillRect(
                    viewportX + x, 
                    viewportY + drawStart, 
                    1, 
                    drawEnd - drawStart
                );
                
                // Draw subtle texture variation (alternating dark stripes)
                if (x % 3 === 0) {
                    ctx.fillStyle = `rgba(0, 0, 0, 0.1)`;
                    ctx.fillRect(
                        viewportX + x, 
                        viewportY + drawStart, 
                        1, 
                        drawEnd - drawStart
                    );
                }
            }
        }
        
        // Draw player as a dot on minimap (debug)
        const miniMapSize = 80;
        const miniMapX = viewportX + viewportWidth - miniMapSize - 10;
        const miniMapY = viewportY + 10;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(miniMapX, miniMapY, miniMapSize, miniMapSize);
        
        // Draw grid
        const cellSize = miniMapSize / this.width;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === 1) {
                    ctx.fillStyle = '#8b4513';
                    ctx.fillRect(
                        miniMapX + x * cellSize,
                        miniMapY + y * cellSize,
                        cellSize,
                        cellSize
                    );
                }
                
                // Grid lines
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(
                    miniMapX + x * cellSize,
                    miniMapY + y * cellSize,
                    cellSize,
                    cellSize
                );
            }
        }
        
        // Draw player on minimap
        const playerMapX = miniMapX + playerX * cellSize;
        const playerMapY = miniMapY + playerY * cellSize;
        
        ctx.fillStyle = player.id === 1 ? '#3a7bd5' : '#c54b4b';
        ctx.beginPath();
        ctx.arc(playerMapX, playerMapY, cellSize * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw player direction line
        ctx.strokeStyle = player.id === 1 ? '#3a7bd5' : '#c54b4b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(playerMapX, playerMapY);
        ctx.lineTo(
            playerMapX + Math.cos(playerAngle) * cellSize * 2,
            playerMapY + Math.sin(playerAngle) * cellSize * 2
        );
        ctx.stroke();
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
}