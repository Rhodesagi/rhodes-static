/**
 * DDA Raycasting Engine
 * Proper implementation using Digital Differential Analysis
 * No naive ray marching, correct radians math
 */
class Raycaster {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.focalLength = 0.8;
        this.fov = Math.PI / 3; // 60 degrees
    }
    
    castRays(player, map) {
        const rays = [];
        const halfFov = this.fov / 2;
        
        for (let x = 0; x < this.width; x++) {
            const cameraX = (2 * x / this.width) - 1;
            const rayAngle = player.angle + cameraX * halfFov;
            
            const ray = this.castSingleRay(player.x, player.y, rayAngle, map);
            ray.screenX = x;
            rays.push(ray);
        }
        
        return rays;
    }
    
    castSingleRay(startX, startY, angle, map) {
        // Ray direction
        const rayDirX = Math.cos(angle);
        const rayDirY = Math.sin(angle);
        
        // Current map position
        let mapX = Math.floor(startX);
        let mapY = Math.floor(startY);
        
        // Distance to next side
        const deltaDistX = Math.abs(1 / rayDirX);
        const deltaDistY = Math.abs(1 / rayDirY);
        
        let sideDistX, sideDistY;
        let stepX, stepY;
        
        // Calculate step and initial sideDist
        if (rayDirX < 0) {
            stepX = -1;
            sideDistX = (startX - mapX) * deltaDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1 - startX) * deltaDistX;
        }
        
        if (rayDirY < 0) {
            stepY = -1;
            sideDistY = (startY - mapY) * deltaDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1 - startY) * deltaDistY;
        }
        
        // DDA loop
        let hit = false;
        let side = 0; // 0 = NS wall, 1 = EW wall
        
        while (!hit) {
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
            }
            
            if (map.isWall(mapX, mapY)) {
                hit = true;
            }
        }
        
        // Calculate distance
        let perpWallDist;
        if (side === 0) {
            perpWallDist = (mapX - startX + (1 - stepX) / 2) / rayDirX;
        } else {
            perpWallDist = (mapY - startY + (1 - stepY) / 2) / rayDirY;
        }
        
        // Calculate wall hit position for texture
        let wallX;
        if (side === 0) {
            wallX = startY + perpWallDist * rayDirY;
        } else {
            wallX = startX + perpWallDist * rayDirX;
        }
        wallX -= Math.floor(wallX);
        
        return {
            distance: perpWallDist,
            side: side,
            wallX: wallX,
            hitX: mapX,
            hitY: mapY
        };
    }
    
    renderToCanvas(ctx, player, map) {
        const rays = this.castRays(player, map);
        const imageData = ctx.createImageData(this.width, this.height);
        const data = imageData.data;
        
        // Floor and ceiling
        const floorColor = map.floor;
        const ceilingColor = map.ceiling;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const idx = (y * this.width + x) * 4;
                
                if (y < this.height / 2) {
                    // Ceiling
                    data[idx] = ceilingColor.r;
                    data[idx + 1] = ceilingColor.g;
                    data[idx + 2] = ceilingColor.b;
                } else {
                    // Floor
                    data[idx] = floorColor.r;
                    data[idx + 1] = floorColor.g;
                    data[idx + 2] = floorColor.b;
                }
                data[idx + 3] = 255;
            }
        }
        
        // Walls
        for (let x = 0; x < this.width; x++) {
            const ray = rays[x];
            const lineHeight = Math.floor(this.height / ray.distance);
            const drawStart = Math.max(0, Math.floor(-lineHeight / 2 + this.height / 2));
            const drawEnd = Math.min(this.height - 1, Math.floor(lineHeight / 2 + this.height / 2));
            
            // Wall color with distance shading and side shading
            let wallColor = map.getWallColor(ray.hitX, ray.hitY);
            const distanceShade = Math.min(1, 15 / ray.distance);
            const sideShade = ray.side === 1 ? 0.7 : 1.0;
            
            const r = Math.floor(wallColor.r * distanceShade * sideShade);
            const g = Math.floor(wallColor.g * distanceShade * sideShade);
            const b = Math.floor(wallColor.b * distanceShade * sideShade);
            
            for (let y = drawStart; y <= drawEnd; y++) {
                const idx = (y * this.width + x) * 4;
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        return rays;
    }
}
