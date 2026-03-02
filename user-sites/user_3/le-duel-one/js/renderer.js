/**
 * Renderer - Split screen pseudo-3D with iron sight aiming
 * No crosshairs, no HUD - authentic iron sights only
 */

const Renderer = {
    canvas: null,
    ctx: null,
    
    // Screen dimensions
    width: 0,
    height: 0,
    halfWidth: 0,
    halfHeight: 0,
    
    // Viewport dimensions (each player gets half)
    viewportWidth: 0,
    viewportHeight: 0,
    
    // Distance to projection plane
    projectionPlaneDist: 0,
    
    // Texture data (procedural)
    textures: {},
    
    /**
     * Initialize renderer
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Generate textures
        this.generateTextures();
    },
    
    /**
     * Handle resize
     */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.halfWidth = Math.floor(this.width / 2);
        this.halfHeight = Math.floor(this.height / 2);
        
        // Vertical split - each player gets half width
        this.viewportWidth = this.halfWidth;
        this.viewportHeight = this.height;
        
        // Calculate projection plane distance for correct FOV
        this.projectionPlaneDist = (this.viewportWidth / 2) / Math.tan(Raycaster.FOV / 2);
    },
    
    /**
     * Generate procedural textures
     */
    generateTextures() {
        // Wood texture
        this.textures.wood = this.createNoiseTexture(64, 64, '#8B5A2B', '#654321');
        // Stone texture  
        this.textures.stone = this.createNoiseTexture(64, 64, '#808080', '#606060');
    },
    
    /**
     * Create noise texture
     */
    createNoiseTexture(w, h, color1, color2) {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        
        // Fill base
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, w, h);
        
        // Add noise
        for (let i = 0; i < w * h / 4; i++) {
            const x = Math.floor(Math.random() * w);
            const y = Math.floor(Math.random() * h);
            ctx.fillStyle = Math.random() > 0.5 ? color2 : color1;
            ctx.fillRect(x, y, 2, 2);
        }
        
        return canvas;
    },
    
    /**
     * Render frame for both players
     */
    render(player1, player2) {
        // Clear screen
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Render Player 1 (left half)
        this.renderViewport(player1, 0, 0, this.viewportWidth, this.viewportHeight);
        
        // Render Player 2 (right half)
        this.renderViewport(player2, this.halfWidth, 0, this.viewportWidth, this.viewportHeight);
        
        // Draw center divider
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(this.halfWidth - 2, 0, 4, this.height);
        
        // Draw player labels (minimal, no HUD)
        this.ctx.fillStyle = 'rgba(212, 175, 55, 0.5)';
        this.ctx.font = '12px Courier New';
        this.ctx.fillText('P1', 10, 20);
        this.ctx.fillText('P2', this.halfWidth + 10, 20);
    },
    
    /**
     * Render a single player's viewport
     */
    renderViewport(player, x, y, w, h) {
        if (!player.alive) {
            this.renderDeathScreen(x, y, w, h);
            return;
        }
        
        // Create ImageData for this viewport
        const imageData = this.ctx.createImageData(w, h);
        const data = imageData.data;
        
        // Render 3D view
        this.render3DView(player, data, w, h);
        
        // Put image data
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        tempCanvas.getContext('2d').putImageData(imageData, 0, 0);
        
        this.ctx.drawImage(tempCanvas, x, y);
        
        // Draw musket viewmodel with iron sights
        this.renderMusketViewmodel(player, x, y, w, h);
        
        // Draw iron sights if aiming
        if (player.aiming) {
            this.renderIronSights(x, y, w, h);
        }
    },
    
    /**
     * Render 3D raycasted view
     */
    render3DView(player, data, w, h) {
        const horizon = Math.floor(h / 2);
        const viewAngle = Player.getViewAngle(player);
        
        // Cast rays for each column
        for (let col = 0; col < w; col++) {
            // Calculate ray angle
            const rayAngle = viewAngle + Math.atan((col - w / 2) / this.projectionPlaneDist);
            
            // Cast ray
            const hit = Raycaster.castRay(player.x, player.y, rayAngle);
            
            // Fix fisheye
            const distance = hit.distance * Math.cos(rayAngle - viewAngle);
            
            // Calculate wall height on screen
            const wallHeight = Math.floor((Raycaster.CELL_SIZE / distance) * this.projectionPlaneDist);
            
            // Draw ceiling (sky)
            for (let row = 0; row < horizon - wallHeight / 2; row++) {
                const idx = (row * w + col) * 4;
                // Dark blue sky gradient
                const brightness = Math.floor(50 + (row / horizon) * 30);
                data[idx] = brightness;
                data[idx + 1] = brightness + 10;
                data[idx + 2] = brightness + 20;
                data[idx + 3] = 255;
            }
            
            // Draw wall
            const wallTop = Math.max(0, Math.floor(horizon - wallHeight / 2));
            const wallBottom = Math.min(h, Math.floor(horizon + wallHeight / 2));
            
            const color = Raycaster.getWallColor(hit.wallType, hit.side, hit.distance);
            
            // Add simple texture effect based on wallX
            const textureCoord = Math.floor(hit.wallX * 8) % 2;
            const shade = textureCoord === 0 ? 1 : 0.85;
            
            for (let row = wallTop; row < wallBottom; row++) {
                const idx = (row * w + col) * 4;
                data[idx] = Math.floor(color.r * shade);
                data[idx + 1] = Math.floor(color.g * shade);
                data[idx + 2] = Math.floor(color.b * shade);
                data[idx + 3] = 255;
            }
            
            // Draw floor
            for (let row = wallBottom; row < h; row++) {
                const idx = (row * w + col) * 4;
                // Dark floor
                const fog = (row - horizon) / (h - horizon);
                const brightness = Math.floor(30 * (1 - fog));
                data[idx] = brightness;
                data[idx + 1] = brightness;
                data[idx + 2] = brightness;
                data[idx + 3] = 255;
            }
        }
        
        // Draw opponent if visible (simple sprite rendering)
        this.renderOpponent(player, data, w, h);
    },
    
    /**
     * Render opponent player as a sprite
     */
    renderOpponent(player, data, w, h) {
        const opponent = player.isPlayer2 ? Game.player1 : Game.player2;
        if (!opponent || !opponent.alive) return;
        
        const dx = opponent.x - player.x;
        const dy = opponent.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 800) return; // Too far
        
        const viewAngle = Player.getViewAngle(player);
        const angle = Math.atan2(dy, dx);
        let relativeAngle = angle - viewAngle;
        
        // Normalize angle
        while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
        while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;
        
        // Check if in view
        if (Math.abs(relativeAngle) > Raycaster.FOV / 2 + 0.2) return;
        
        // Calculate screen position
        const screenX = Math.floor(w / 2 + Math.tan(relativeAngle) * this.projectionPlaneDist);
        
        // Check ray at this column to see if opponent is behind wall
        const hit = Raycaster.castRay(player.x, player.y, angle);
        if (hit.distance < distance - 10) return; // Behind wall
        
        // Calculate sprite size
        const spriteHeight = Math.floor((32 / distance) * this.projectionPlaneDist * 4);
        const spriteWidth = Math.floor(spriteHeight * 0.3);
        
        const spriteTop = Math.floor(h / 2 - spriteHeight / 2);
        const spriteLeft = Math.floor(screenX - spriteWidth / 2);
        
        // Draw simple sprite (white uniform shape)
        for (let y = Math.max(0, spriteTop); y < Math.min(h, spriteTop + spriteHeight); y++) {
            for (let x = Math.max(0, spriteLeft); x < Math.min(w, spriteLeft + spriteWidth); x++) {
                const idx = (y * w + x) * 4;
                // Simple white uniform with dark accents
                const isEdge = x === spriteLeft || x === spriteLeft + spriteWidth - 1 ||
                              y === spriteTop || y === spriteTop + spriteHeight - 1;
                
                if (isEdge) {
                    data[idx] = 30;
                    data[idx + 1] = 30;
                    data[idx + 2] = 30;
                } else {
                    data[idx] = 220;
                    data[idx + 1] = 220;
                    data[idx + 2] = 210;
                }
                data[idx + 3] = 255;
            }
        }
    },
    
    /**
     * Render musket viewmodel
     */
    renderMusketViewmodel(player, vx, vy, vw, vh) {
        const ctx = this.ctx;
        const centerX = vx + vw / 2;
        const centerY = vy + vh;
        
        // Recoil offset
        const recoilY = player.recoil * 30;
        
        // Musket sway
        const sway = Musket.getSway(player.aiming, Date.now());
        const swayX = sway.x * 2;
        const swayY = sway.y;
        
        ctx.save();
        ctx.translate(centerX + swayX, centerY - 100 - recoilY + swayY);
        
        // Rotate musket based on musketAngle
        const rotation = player.musketAngle * 0.5;
        ctx.rotate(rotation);
        
        // Stock (wood)
        ctx.fillStyle = '#654321';
        ctx.fillRect(-15, 0, 30, 150);
        
        // Barrel (metal)
        ctx.fillStyle = '#444';
        ctx.fillRect(-8, -80, 16, 120);
        
        // Barrel highlight
        ctx.fillStyle = '#666';
        ctx.fillRect(-4, -80, 4, 120);
        
        // Flintlock mechanism
        ctx.fillStyle = '#555';
        ctx.fillRect(-12, -40, 24, 30);
        
        // Hammer
        ctx.fillStyle = '#333';
        if (player.musket.cocked) {
            // Cocked back
            ctx.fillRect(-15, -60, 8, 25);
        } else {
            // Forward
            ctx.fillRect(-8, -50, 8, 20);
        }
        
        // Frizzen (pan cover)
        ctx.fillStyle = '#444';
        ctx.fillRect(4, -45, 10, 15);
        
        // Ramrod animation
        if (player.musket.ramrodOut) {
            ctx.fillStyle = '#8B4513';
            const rodExtension = Math.sin(player.musket.stageProgress * Math.PI) * 60;
            ctx.fillRect(10, -60 - rodExtension, 3, 100 + rodExtension);
        }
        
        // Bands
        ctx.fillStyle = '#333';
        ctx.fillRect(-10, 20, 20, 5);
        ctx.fillRect(-10, 80, 20, 5);
        
        ctx.restore();
    },
    
    /**
     * Render authentic iron sights (rear notch + front post)
     */
    renderIronSights(vx, vy, vw, vh) {
        const ctx = this.ctx;
        const centerX = vx + vw / 2;
        const centerY = vy + vh / 2;
        
        ctx.save();
        
        // Rear sight (notch) - at top center of screen
        const rearY = vy + vh * 0.35;
        ctx.fillStyle = '#111';
        
        // Rear sight base
        ctx.fillRect(centerX - 25, rearY - 5, 50, 8);
        // Rear notch (V-shaped cutout)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(centerX - 8, rearY - 5);
        ctx.lineTo(centerX, rearY + 8);
        ctx.lineTo(centerX + 8, rearY - 5);
        ctx.fill();
        
        // Front sight (post) - lower, smaller
        const frontY = vy + vh * 0.48;
        ctx.fillStyle = '#111';
        // Front post
        ctx.fillRect(centerX - 2, frontY - 15, 4, 20);
        // Front post top (square)
        ctx.fillRect(centerX - 3, frontY - 18, 6, 5);
        
        // Subtle sight picture guidance (very faint)
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(centerX, rearY);
        ctx.lineTo(centerX, frontY);
        ctx.stroke();
        
        ctx.restore();
    },
    
    /**
     * Render death screen
     */
    renderDeathScreen(x, y, w, h) {
        const ctx = this.ctx;
        ctx.fillStyle = '#300';
        ctx.fillRect(x, y, w, h);
        
        ctx.fillStyle = '#800';
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('HIT', x + w / 2, y + h / 2);
        ctx.textAlign = 'left';
    }
};
