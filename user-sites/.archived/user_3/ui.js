// UI and rendering utilities for split-screen musket duel

export function renderSplitScreen(ctx, player1, player2, map, screenWidth, halfHeight) {
    // Player 1 viewport (top half)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, screenWidth, halfHeight);
    ctx.clip();
    
    map.renderView(ctx, player1, 0, 0, screenWidth, halfHeight);
    
    // Draw player 2 in player 1's view if visible
    drawOtherPlayer(ctx, player2, player1, screenWidth, halfHeight);
    
    ctx.restore();
    
    // Player 2 viewport (bottom half)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, halfHeight, screenWidth, halfHeight);
    ctx.clip();
    
    map.renderView(ctx, player2, 0, halfHeight, screenWidth, halfHeight);
    
    // Draw player 1 in player 2's view if visible
    drawOtherPlayer(ctx, player1, player2, screenWidth, halfHeight, halfHeight);
    
    ctx.restore();
    
    // Draw divider line
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, halfHeight);
    ctx.lineTo(screenWidth, halfHeight);
    ctx.stroke();
}

function drawOtherPlayer(ctx, otherPlayer, viewerPlayer, screenWidth, viewportHeight, viewportOffsetY = 0) {
    // Calculate if other player is in field of view
    const dx = otherPlayer.x - viewerPlayer.x;
    const dy = otherPlayer.y - viewerPlayer.y;
    
    // Distance between players
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 15) return; // Too far to see
    
    // Angle from viewer to other player
    let angleToOther = Math.atan2(dy, dx);
    
    // Adjust for viewer's facing angle
    let relativeAngle = angleToOther - viewerPlayer.angle;
    
    // Normalize angle to -π to π
    while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
    while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;
    
    // Field of view check (90 degrees = π/2)
    if (Math.abs(relativeAngle) > Math.PI / 2) return;
    
    // Project to screen space
    const screenX = (relativeAngle / (Math.PI / 2)) * (screenWidth / 2) + (screenWidth / 2);
    
    // Size based on distance (closer = larger)
    const size = Math.max(5, Math.min(30, 100 / distance));
    
    // Vertical position (center)
    const screenY = viewportHeight / 2 + viewportOffsetY;
    
    // Draw other player indicator
    ctx.fillStyle = otherPlayer.id === 1 ? '#3a7bd5' : '#c54b4b';
    ctx.beginPath();
    ctx.arc(screenX, screenY, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw health bar above player
    const healthWidth = size * 2;
    const healthHeight = 4;
    const healthX = screenX - healthWidth / 2;
    const healthY = screenY - size - 5;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(healthX, healthY, healthWidth, healthHeight);
    
    ctx.fillStyle = otherPlayer.health > 50 ? '#0f0' : otherPlayer.health > 25 ? '#ff0' : '#f00';
    ctx.fillRect(healthX, healthY, healthWidth * (otherPlayer.health / 100), healthHeight);
}

export function drawIronSights(ctx, screenWidth, halfHeight, isPlayer1Aiming, isPlayer2Aiming) {
    // Player 1 iron sights (top half)
    if (isPlayer1Aiming) {
        const centerX = screenWidth / 2;
        const centerY = halfHeight / 2;
        
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        
        // Rear sight (notch)
        ctx.beginPath();
        ctx.moveTo(centerX - 15, centerY - 8);
        ctx.lineTo(centerX + 15, centerY - 8);
        ctx.lineTo(centerX + 12, centerY - 4);
        ctx.lineTo(centerX - 12, centerY - 4);
        ctx.closePath();
        ctx.stroke();
        
        // Front sight (post)
        ctx.beginPath();
        ctx.moveTo(centerX - 2, centerY + 10);
        ctx.lineTo(centerX + 2, centerY + 10);
        ctx.lineTo(centerX + 1, centerY - 2);
        ctx.lineTo(centerX - 1, centerY - 2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
        ctx.fill();
        ctx.stroke();
        
        // Center dot
        ctx.fillStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 1, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Player 2 iron sights (bottom half)
    if (isPlayer2Aiming) {
        const centerX = screenWidth / 2;
        const centerY = halfHeight + halfHeight / 2;
        
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        
        // Rear sight (notch)
        ctx.beginPath();
        ctx.moveTo(centerX - 15, centerY - 8);
        ctx.lineTo(centerX + 15, centerY - 8);
        ctx.lineTo(centerX + 12, centerY - 4);
        ctx.lineTo(centerX - 12, centerY - 4);
        ctx.closePath();
        ctx.stroke();
        
        // Front sight (post)
        ctx.beginPath();
        ctx.moveTo(centerX - 2, centerY + 10);
        ctx.lineTo(centerX + 2, centerY + 10);
        ctx.lineTo(centerX + 1, centerY - 2);
        ctx.lineTo(centerX - 1, centerY - 2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
        ctx.fill();
        ctx.stroke();
        
        // Center dot
        ctx.fillStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}

export function updateHUD(player1, player2, musket1, musket2) {
    // Update health bars
    const p1HealthFill = document.getElementById('p1-health');
    const p2HealthFill = document.getElementById('p2-health');
    
    if (p1HealthFill) {
        p1HealthFill.style.width = `${player1.health}%`;
    }
    
    if (p2HealthFill) {
        p2HealthFill.style.width = `${player2.health}%`;
    }
    
    // Update ammo status
    const p1Ammo = document.getElementById('p1-ammo');
    const p2Ammo = document.getElementById('p2-ammo');
    
    if (p1Ammo) {
        p1Ammo.textContent = musket1.getAmmoStatus();
        p1Ammo.className = `ammo-status ${musket1.loaded ? 'loaded' : musket1.reloadState > 0 ? 'reloading' : 'empty'}`;
    }
    
    if (p2Ammo) {
        p2Ammo.textContent = musket2.getAmmoStatus();
        p2Ammo.className = `ammo-status ${musket2.loaded ? 'loaded' : musket2.reloadState > 0 ? 'reloading' : 'empty'}`;
    }
    
    // Update reload progress
    updateReloadStages('p1-reload', musket1);
    updateReloadStages('p2-reload', musket2);
}

function updateReloadStages(elementId, musket) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.innerHTML = '';
    
    if (musket.reloadState === 0) {
        element.innerHTML = '<div class="reload-stage completed"></div><div class="reload-stage completed"></div><div class="reload-stage completed"></div><div class="reload-stage completed"></div><div class="reload-stage completed"></div><div class="reload-stage completed"></div>';
        return;
    }
    
    for (let i = 1; i <= 6; i++) {
        const stage = document.createElement('div');
        stage.className = 'reload-stage';
        
        if (i < musket.reloadState) {
            stage.classList.add('completed');
        } else if (i === musket.reloadState) {
            stage.classList.add('active');
        }
        
        element.appendChild(stage);
    }
}

export function showWinnerScreen(winner) {
    const winnerDisplay = document.getElementById('winner-display');
    const winnerText = document.getElementById('winner-text');
    const hud = document.getElementById('hud');
    
    if (winnerDisplay && winnerText && hud) {
        winnerText.textContent = `PLAYER ${winner.id} VICTORY!`;
        winnerDisplay.classList.remove('hidden');
        hud.classList.add('hidden');
    }
}