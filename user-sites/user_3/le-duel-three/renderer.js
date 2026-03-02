class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 320;
        this.height = 200;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    render(player, otherPlayer) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // Sky
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(0, 0, w, h/2);

        // Floor
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(0, h/2, w, h/2);

        if (!player.alive) {
            this.renderDeathScreen(ctx, w, h);
            return;
        }

        // Raycasting
        const fov = player.musket.getFOV() * Math.PI / 180;
        const numRays = w;
        const angleStep = fov / numRays;
        const startAngle = player.angle - fov/2;

        for (let i = 0; i < numRays; i++) {
            const rayAngle = startAngle + i * angleStep;
            const hit = this.castRay(player.x, player.y, rayAngle);
            
            if (hit) {
                // Fix fisheye
                const dist = hit.dist * Math.cos(rayAngle - player.angle);
                const wallHeight = h / (dist * 0.5);
                const wallTop = (h - wallHeight) / 2;
                
                // Texture/shading based on distance
                const brightness = Math.max(0.1, 1 - dist / 15);
                const tex = getWallTexture(hit.x, hit.y);
                const r = Math.floor(tex.r * brightness);
                const g = Math.floor(tex.g * brightness);
                const b = Math.floor(tex.b * brightness);
                
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(i, wallTop, 1, wallHeight);
                
                // Floor casting (simple)
                const floorBrightness = Math.max(0.05, 0.3 - dist / 30);
                ctx.fillStyle = `rgb(${60*floorBrightness},${50*floorBrightness},${40*floorBrightness})`;
                ctx.fillRect(i, wallTop + wallHeight, 1, h - wallTop - wallHeight);
            }
        }

        // Render other player if visible
        this.renderPlayerSprite(player, otherPlayer, w, h);

        // Render musket/iron sights (no HUD, no crosshair)
        this.renderMusket(player, w, h);

        // Flash effect
        if (player.musket.flashTimer > 0) {
            ctx.fillStyle = `rgba(255, 255, 200, ${player.musket.flashTimer / 100})`;
            ctx.fillRect(0, 0, w, h);
        }

        // Reload text (only during reload)
        if (player.musket.state > 0 && player.musket.state < 7) {
            ctx.fillStyle = '#ff0';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            const stepName = player.musket.getStepName();
            const pct = Math.floor(player.musket.getReloadPercent());
            ctx.fillText(`${stepName} ${pct}%`, w/2, h - 30);
        }
    }

    castRay(x, y, angle) {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        
        let dist = 0;
        const maxDist = 20;
        const step = 0.02;
        
        while (dist < maxDist) {
            dist += step;
            const cx = x + cos * dist;
            const cy = y + sin * dist;
            
            if (MAP.isWall(cx, cy)) {
                return { dist, x: cx, y: cy };
            }
        }
        return null;
    }

    renderPlayerSprite(viewer, target, w, h) {
        const dx = target.x - viewer.x;
        const dy = target.y - viewer.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 20 || dist < 0.5) return;
        
        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - viewer.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        const fov = viewer.musket.getFOV() * Math.PI / 180;
        if (Math.abs(angleDiff) > fov/2) return;
        
        // Check line of sight
        if (!this.checkLineOfSight(viewer.x, viewer.y, target.x, target.y)) return;
        
        const screenX = w/2 + (angleDiff / (fov/2)) * (w/2);
        const size = h / (dist * 0.4);
        const screenY = h/2;
        
        // Simple sprite
        this.ctx.fillStyle = target.color;
        this.ctx.fillRect(screenX - size/4, screenY - size/2, size/2, size);
        
        // Musket
        this.ctx.fillStyle = '#5c4033';
        this.ctx.fillRect(screenX - size/8, screenY - size/4, size/4, size/2);
    }

    checkLineOfSight(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const steps = Math.floor(dist * 2);
        
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            if (MAP.isWall(x1 + dx * t, y1 + dy * t)) return false;
        }
        return true;
    }

    renderMusket(player, w, h) {
        const ctx = this.ctx;
        const aim = player.musket.aimProgress;
        const recoil = player.musket.recoil;
        const tilt = player.musket.musketTilt;

        ctx.save();
        
        // Apply recoil offset
        const recoilY = recoil * 30;
        ctx.translate(0, recoilY);
        
        // Apply tilt rotation
        ctx.translate(w/2, h);
        ctx.rotate(tilt * Math.PI / 180);
        ctx.translate(-w/2, -h);

        if (aim > 0.5) {
            // Iron sight view - minimal gun visible, focus on sights
            this.renderIronSights(ctx, w, h, aim);
        } else {
            // Hip view - show full musket
            this.renderFullMusket(ctx, w, h);
        }
        
        ctx.restore();
    }

    renderIronSights(ctx, w, h, aim) {
        const centerX = w / 2;
        const centerY = h / 2;
        
        // Rear sight (notch)
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 20, centerY + 10);
        ctx.lineTo(centerX - 5, centerY + 5);
        ctx.lineTo(centerX + 5, centerY + 5);
        ctx.lineTo(centerX + 20, centerY + 10);
        ctx.stroke();
        
        // Front sight post
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(centerX - 1, centerY + 30, 2, 15);
        
        // Blur the edges when aiming (tunnel vision)
        const gradient = ctx.createRadialGradient(centerX, centerY + 20, 20, centerX, centerY + 20, 100);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    renderFullMusket(ctx, w, h) {
        const centerX = w / 2;
        const bottomY = h;
        
        // Stock
        ctx.fillStyle = '#5c4033';
        ctx.beginPath();
        ctx.moveTo(centerX - 15, bottomY);
        ctx.lineTo(centerX - 10, bottomY - 80);
        ctx.lineTo(centerX + 10, bottomY - 80);
        ctx.lineTo(centerX + 15, bottomY);
        ctx.fill();
        
        // Barrel
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(centerX - 4, bottomY - 140, 8, 60);
        
        // Barrel bands
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(centerX - 5, bottomY - 130, 10, 3);
        ctx.fillRect(centerX - 5, bottomY - 110, 10, 3);
        ctx.fillRect(centerX - 5, bottomY - 90, 10, 3);
        
        // Flintlock mechanism
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(centerX - 8, bottomY - 75, 16, 20);
        ctx.fillRect(centerX - 6, bottomY - 85, 12, 10);
        
        // Pan
        ctx.fillStyle = '#3d3d3d';
        ctx.fillRect(centerX + 4, bottomY - 82, 6, 6);
        
        // Ramrod (if reloading and at ramrod step)
        // This would be animated based on reload state
    }

    renderDeathScreen(ctx, w, h) {
        ctx.fillStyle = 'rgba(139, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FALLEN', w/2, h/2);
        ctx.font = '10px monospace';
        ctx.fillText('Reloading...', w/2, h/2 + 20);
    }
}