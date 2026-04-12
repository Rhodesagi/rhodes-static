// musket-duel/renderer.js
// Split-screen 3D renderer - NO CROSSHAIRS, only iron sights

const Renderer = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  
  // Wall colors
  wallColor: '#654321',
  pillarColor: '#4a3728',
  groundColor1: '#3d4a2d',
  groundColor2: '#4a5a35',
  skyColor: '#87CEEB',
  
  FOV: Math.PI / 3, // 60 degrees
  
  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },
  
  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  },
  
  // Clear entire canvas
  clear() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);
  },
  
  // Render split screen
  render(player1, player2, gameOver, winner) {
    this.clear();
    
    const halfWidth = Math.floor(this.width / 2);
    
    // Draw center divider
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(halfWidth - 2, 0, 4, this.height);
    
    // Render Player 1 (left half)
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, 0, halfWidth - 2, this.height);
    this.ctx.clip();
    this.renderPlayerView(player1, player2, halfWidth - 2, this.height, '#4488ff');
    this.ctx.restore();
    
    // Render Player 2 (right half)
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(halfWidth + 2, 0, halfWidth - 2, this.height);
    this.ctx.clip();
    this.renderPlayerView(player2, player1, halfWidth - 2, this.height, '#ff4444');
    this.ctx.restore();
    
    // Draw center label
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 12px Courier New';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('VS', halfWidth, 30);
  },
  
  // Render first-person view for one player
  renderPlayerView(player, opponent, viewWidth, viewHeight, playerColor) {
    const eye = player.getEyePosition();
    
    // Draw sky (top half)
    const horizonY = Math.floor(viewHeight / 2);
    this.ctx.fillStyle = this.skyColor;
    this.ctx.fillRect(0, 0, viewWidth, horizonY);
    
    // Draw ground with perspective
    for (let y = horizonY; y < viewHeight; y += 4) {
      const t = (y - horizonY) / (viewHeight - horizonY);
      const shade = Math.floor(t * 50);
      this.ctx.fillStyle = (Math.floor(y / 20) % 2 === 0) ? 
        `rgb(${61 + shade}, ${74 + shade}, ${45 + shade})` :
        `rgb(${74 + shade}, ${90 + shade}, ${53 + shade})`;
      this.ctx.fillRect(0, y, viewWidth, 4);
    }
    
    // Raycast walls/floor
    const numRays = 80;
    const fov = this.FOV;
    
    for (let i = 0; i < numRays; i++) {
      const rayOffset = (i / numRays - 0.5) * fov;
      const rayYaw = player.yaw + rayOffset;
      
      const hit = World.castRay(eye.x, eye.z, 
        Math.cos(rayYaw), Math.sin(rayYaw), 30);
      
      if (hit.hit) {
        // Calculate distance with fisheye correction
        const dist = hit.dist * Math.cos(rayOffset);
        const wallHeight = Math.min(viewHeight, 
          (World.wallHeight / (dist + 0.1)) * (viewHeight / 2));
        
        const shade = Math.max(0, 1 - dist / 20);
        const color = hit.type === 'pillar' ? 
          `rgb(${74 * shade}, ${55 * shade}, ${40 * shade})` :
          `rgb(${101 * shade}, ${67 * shade}, ${33 * shade})`;
        
        const stripWidth = viewWidth / numRays + 1;
        const stripX = (i / numRays) * viewWidth;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(stripX, horizonY - wallHeight/2, stripWidth, wallHeight);
      }
    }
    
    // Draw opponent as billboard sprite
    if (opponent && opponent.alive) {
      this.drawBillboard(player, opponent, eye, viewWidth, viewHeight, horizonY);
    }
    
    // Draw weapon
    this.drawWeapon(player, viewWidth, viewHeight, playerColor);
    
    // NO CROSSHAIR - this is iron sights only
    // The iron sights are drawn as part of the weapon view
    
    // Death indicator
    if (!player.alive) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, viewWidth, viewHeight);
      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = 'bold 24px Courier New';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('HIT!', viewWidth / 2, horizonY);
    }
  },
  
  // Draw opponent as 2D billboard
  drawBillboard(player, opponent, eye, viewWidth, viewHeight, horizonY) {
    const dx = opponent.x - eye.x;
    const dz = opponent.z - eye.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    
    if (dist < 0.5) return; // Too close
    
    // Check if visible (not behind wall)
    if (World.lineHitsWall(eye.x, eye.z, opponent.x, opponent.z)) return;
    
    // Calculate angle relative to player
    const angle = Math.atan2(dz, dx) - player.yaw;
    let normalizedAngle = ((angle + Math.PI) % (2 * Math.PI)) - Math.PI;
    
    // Check if in FOV
    if (Math.abs(normalizedAngle) > this.FOV / 2) return;
    
    // Project to screen
    const screenX = (normalizedAngle / this.FOV + 0.5) * viewWidth;
    const spriteHeight = Math.min(viewHeight * 0.8, 
      (Player.HEIGHT / (dist + 0.1)) * (viewHeight / 2));
    const spriteWidth = spriteHeight * 0.3;
    
    // Draw simple humanoid figure
    const x = screenX - spriteWidth / 2;
    const y = horizonY - spriteHeight / 2;
    
    // Shadow
    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(screenX, horizonY + spriteHeight/3, 
      spriteWidth/2, spriteWidth/8, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Body
    this.ctx.fillStyle = opponent.color || '#ff4444';
    this.ctx.fillRect(x, y, spriteWidth, spriteHeight * 0.6);
    
    // Head
    this.ctx.fillStyle = '#ffccaa';
    const headSize = spriteWidth * 0.4;
    this.ctx.fillRect(screenX - headSize/2, y - headSize * 0.8, 
      headSize, headSize);
    
    // Muskets
    this.ctx.fillStyle = '#4a3728';
    this.ctx.fillRect(x - spriteWidth*0.2, y + spriteHeight*0.3, 
      spriteWidth*0.2, spriteHeight*0.4);
    
    // Distance fade
    const alpha = Math.max(0, 1 - dist / 25);
    if (alpha < 1) {
      this.ctx.fillStyle = `rgba(0,0,0,${1-alpha})`;
      this.ctx.fillRect(x - 10, y - 10, spriteWidth + 20, spriteHeight + 20);
    }
  },
  
  // Draw first-person musket with iron sights
  drawWeapon(player, viewWidth, viewHeight, color) {
    const musket = player.musket;
    const w = viewWidth;
    const h = viewHeight;
    
    // Weapon base position (bottom of screen, slightly right for right-shoulder)
    const baseX = w * 0.65;
    const baseY = h * 0.85;
    
    // Recoil offset
    const recoil = musket.recoilAmount * 50;
    
    // If iron sights are active, draw sight picture
    if (musket.ironSightsActive && musket.state === Musket.States.READY) {
      this.drawIronSightsView(w, h, color);
    } else {
      // Draw musket in lowered/carry position
      this.ctx.strokeStyle = '#5c4033';
      this.ctx.lineWidth = 8;
      this.ctx.lineCap = 'round';
      
      // Stock
      this.ctx.beginPath();
      this.ctx.moveTo(baseX, baseY);
      this.ctx.lineTo(baseX + 20 - recoil, baseY - 80);
      this.ctx.stroke();
      
      // Barrel (longer, extending up and back)
      this.ctx.strokeStyle = '#2a1a0a';
      this.ctx.lineWidth = 6;
      this.ctx.beginPath();
      this.ctx.moveTo(baseX + 20 - recoil, baseY - 80);
      this.ctx.lineTo(baseX - 30 - recoil, baseY - 200);
      this.ctx.stroke();
      
      // Musket ball animation during reload
      if (musket.state === Musket.States.INSERT_BALL || 
          musket.state === Musket.States.INSERT_PATCH) {
        this.ctx.fillStyle = '#444';
        const animX = baseX + 40 - recoil + (musket.animationProgress * 20);
        this.ctx.beginPath();
        this.ctx.arc(animX, baseY - 120, 4, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      // Ramrod animation
      if (musket.state.includes('RAM')) {
        this.ctx.strokeStyle = '#8b7355';
        this.ctx.lineWidth = 3;
        const ramProgress = (musket.stateTimer % 0.8) / 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(baseX + 60, baseY - 80 + ramProgress * 60);
        this.ctx.lineTo(baseX + 60, baseY - 180 + ramProgress * 60);
        this.ctx.stroke();
      }
      
      // Reload progress indicator (on weapon itself, not as crosshair)
      if (musket.state !== Musket.States.READY) {
        const progress = musket.getProgress();
        this.ctx.fillStyle = '#0f0';
        this.ctx.fillRect(baseX - 20, baseY - 30, progress * 40, 4);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(baseX - 20, baseY - 30, 40, 4);
      }
    }
  },
  
  // Draw the iron sight picture (NO ARTIFICIAL CROSSHAIR)
  drawIronSightsView(w, h, color) {
    // When aiming, we see the rear notch and front post aligned
    const centerX = w / 2;
    const centerY = h / 2;
    
    // Background blur (focus on sights)
    this.ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
    this.ctx.fillRect(0, 0, w, h);
    
    // Rear sight (notch) - U-shaped rear sight of Brown Bess
    this.ctx.strokeStyle = '#1a1a1a';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 40, centerY + 30);
    this.ctx.lineTo(centerX - 40, centerY + 10);
    this.ctx.lineTo(centerX - 15, centerY + 10);
    this.ctx.moveTo(centerX + 15, centerY + 10);
    this.ctx.lineTo(centerX + 40, centerY + 10);
    this.ctx.lineTo(centerX + 40, centerY + 30);
    this.ctx.stroke();
    
    // Front sight post (blade sight)
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY + 10);
    this.ctx.lineTo(centerX, centerY - 40);
    this.ctx.stroke();
    
    // Front sight top (rounded)
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY - 40, 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Barrel blur at bottom (indicating weapon frame)
    this.ctx.fillStyle = 'rgba(44, 33, 20, 0.8)';
    this.ctx.fillRect(centerX - 60, h - 100, 120, 100);
    
    // The alignment is the key - you align the front post in the rear notch
    // NO RED DOT, NO CROSSHAIR - just the physical sights
  }
};

Renderer.init();
