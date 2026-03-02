/**
 * LE DUEL - A Gentleman's Musket Duel
 * Pseudo-3D Raycasting FPS with Iron Sight Aiming
 */

// Game Constants
const SCREEN_WIDTH = 320;
const SCREEN_HEIGHT = 200;
const FOV = Math.PI / 3;
const MOVE_SPEED = 0.045;
const ROT_SPEED = 0.025;
const MUSKET_ROT_SPEED = 0.035;

// Map (1 = wall, 0 = empty)
const MAP_SIZE = 16;
const MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,1,1,0,0,0,0,0,0,1,1,0,0,1],
    [1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,0,0,1,1,0,0,0,0,0,0,1,1,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Wall textures (procedural)
const WALL_COLORS = ['#444', '#555', '#3a3a3a', '#4a4a4a'];
const FLOOR_COLOR = '#2a2520';
const CEILING_COLOR = '#1a1a20';

// Musket States
const MUSKET_STATE = {
    READY: 'ready',
    AIMING: 'aiming',
    FIRING: 'firing',
    RELOADING: 'reloading',
    EMPTY: 'empty'
};

// Reload Steps
const RELOAD_STEPS = [
    { name: 'powder', duration: 1200, text: 'Pouring powder...' },
    { name: 'ball', duration: 1000, text: 'Loading ball...' },
    { name: 'ramrod', duration: 1500, text: 'Ramming...' },
    { name: 'prime', duration: 800, text: 'Priming pan...' },
    { name: 'return', duration: 600, text: 'Shouldering...' }
];

// Input State
const keys = {};

// Players
class Player {
    constructor(x, y, angle, color, isPlayer2 = false) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.musketAngle = 0; // Relative to player angle
        this.color = color;
        this.isPlayer2 = isPlayer2;
        
        // Musket state
        this.musketState = MUSKET_STATE.READY;
        this.loaded = true;
        this.reloading = false;
        this.reloadStep = 0;
        this.reloadTimer = 0;
        this.aimProgress = 0;
        this.recoil = 0;
        
        // Sway for realism
        this.swayTime = Math.random() * 100;
        this.swayAmount = 0.002;
        
        // Hit detection
        this.alive = true;
        this.respawnTimer = 0;
    }
    
    update(dt) {
        if (!this.alive) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }
        
        this.swayTime += dt;
        
        // Handle reload
        if (this.reloading) {
            this.reloadTimer -= dt * 16;
            if (this.reloadTimer <= 0) {
                this.advanceReload();
            }
        }
        
        // Handle recoil recovery
        if (this.recoil > 0) {
            this.recoil = Math.max(0, this.recoil - dt * 2);
        }
        
        // Handle aiming
        if (this.musketState === MUSKET_STATE.AIMING) {
            this.aimProgress = Math.min(1, this.aimProgress + dt * 3);
            this.swayAmount = 0.0003; // Less sway when aiming
        } else {
            this.aimProgress = Math.max(0, this.aimProgress - dt * 4);
            this.swayAmount = 0.002;
        }
        
        // Apply sway
        if (this.aimProgress < 1) {
            this.musketAngle += Math.sin(this.swayTime * 0.5) * this.swayAmount;
        }
    }
    
    advanceReload() {
        this.reloadStep++;
        if (this.reloadStep >= RELOAD_STEPS.length) {
            this.reloading = false;
            this.loaded = true;
            this.musketState = MUSKET_STATE.READY;
            this.updateStatus('Ready');
        } else {
            this.reloadTimer = RELOAD_STEPS[this.reloadStep].duration;
            this.updateStatus(RELOAD_STEPS[this.reloadStep].text);
        }
    }
    
    startReload() {
        if (this.reloading || this.loaded) return;
        this.reloading = true;
        this.reloadStep = 0;
        this.reloadTimer = RELOAD_STEPS[0].duration;
        this.musketState = MUSKET_STATE.RELOADING;
        this.aimProgress = 0;
        this.updateStatus(RELOAD_STEPS[0].text);
    }
    
    aim(active) {
        if (this.reloading || !this.alive) return;
        this.musketState = active ? MUSKET_STATE.AIMING : MUSKET_STATE.READY;
    }
    
    fire() {
        if (this.reloading || !this.loaded || this.recoil > 0 || !this.alive) {
            return false;
        }
        
        this.loaded = false;
        this.recoil = 1.0;
        this.musketState = MUSKET_STATE.FIRING;
        this.updateStatus('Empty');
        
        // Calculate shot direction with musket angle
        const shotAngle = this.angle + this.musketAngle;
        
        // Check hit on other player
        return {
            angle: shotAngle,
            x: this.x,
            y: this.y
        };
    }
    
    hit() {
        this.alive = false;
        this.respawnTimer = 3000; // 3 second respawn
        this.updateStatus('FALLEN');
    }
    
    respawn() {
        this.alive = true;
        this.loaded = true;
        this.reloading = false;
        this.musketState = MUSKET_STATE.READY;
        this.musketAngle = 0;
        this.aimProgress = 0;
        
        // Random respawn
        const spawns = [[2, 2], [13, 2], [2, 13], [13, 13]];
        const spawn = spawns[Math.floor(Math.random() * spawns.length)];
        this.x = spawn[0] + 0.5;
        this.y = spawn[1] + 0.5;
        this.angle = Math.random() * Math.PI * 2;
        
        this.updateStatus('Ready');
    }
    
    updateStatus(text) {
        const id = this.isPlayer2 ? 'p2-status' : 'p1-status';
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }
    
    get totalAngle() {
        return this.angle + this.musketAngle;
    }
}

// Game State
const player1 = new Player(2.5, 2.5, Math.PI / 4, '#4488ff');
const player2 = new Player(13.5, 13.5, Math.PI * 1.25, '#ff4444', true);

// Canvas setup
let canvas1, canvas2, ctx1, ctx2;
let gameRunning = false;
let lastTime = 0;

// Initialize
function init() {
    canvas1 = document.getElementById('canvas1');
    canvas2 = document.getElementById('canvas2');
    canvas1.width = SCREEN_WIDTH;
    canvas1.height = SCREEN_HEIGHT;
    canvas2.width = SCREEN_WIDTH;
    canvas2.height = SCREEN_HEIGHT;
    ctx1 = canvas1.getContext('2d');
    ctx2 = canvas2.getContext('2d');
    
    // Input handlers
    window.addEventListener('keydown', e => {
        keys[e.code] = true;
        handleKeyDown(e);
    });
    window.addEventListener('keyup', e => {
        keys[e.code] = false;
        handleKeyUp(e);
    });
    
    document.getElementById('start-btn').addEventListener('click', startGame);
}

function handleKeyDown(e) {
    // Player 1
    if (e.code === 'KeyX') player1.aim(true);
    if (e.code === 'KeyF') {
        const shot = player1.fire();
        if (shot) checkHit(shot, player1, player2);
    }
    if (e.code === 'KeyR') player1.startReload();
    
    // Player 2
    if (e.code === 'KeyM') player2.aim(true);
    if (e.code === 'Semicolon') {
        const shot = player2.fire();
        if (shot) checkHit(shot, player2, player1);
    }
    if (e.code === 'KeyP') player2.startReload();
}

function handleKeyUp(e) {
    if (e.code === 'KeyX') player1.aim(false);
    if (e.code === 'KeyM') player2.aim(false);
}

function checkHit(shot, shooter, target) {
    // Raycast to check wall collision and player hit
    const cos = Math.cos(shot.angle);
    const sin = Math.sin(shot.angle);
    
    let rayX = shot.x;
    let rayY = shot.y;
    let dist = 0;
    const maxDist = 20;
    const step = 0.05;
    
    while (dist < maxDist) {
        rayX += cos * step;
        rayY += sin * step;
        dist += step;
        
        // Check wall hit
        const mapX = Math.floor(rayX);
        const mapY = Math.floor(rayY);
        if (mapX < 0 || mapX >= MAP_SIZE || mapY < 0 || mapY >= MAP_SIZE || MAP[mapY][mapX] === 1) {
            return; // Hit wall
        }
        
        // Check player hit
        const dx = rayX - target.x;
        const dy = rayY - target.y;
        const playerDist = Math.sqrt(dx * dx + dy * dy);
        
        if (playerDist < 0.3 && target.alive) {
            target.hit();
            return;
        }
    }
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('controls-info').style.display = 'block';
    gameRunning = true;
    requestAnimationFrame(gameLoop);
}

// Movement
function movePlayer(player, forward, strafe, dt) {
    if (!player.alive) return;
    
    const moveStep = forward * MOVE_SPEED;
    const strafeStep = strafe * MOVE_SPEED * 0.6; // Slower strafe
    
    const newX = player.x + Math.cos(player.angle) * moveStep + Math.cos(player.angle + Math.PI/2) * strafeStep;
    const newY = player.y + Math.sin(player.angle) * moveStep + Math.sin(player.angle + Math.PI/2) * strafeStep;
    
    // Wall collision
    const padding = 0.2;
    const mapX = Math.floor(newX);
    const mapY = Math.floor(newY);
    
    if (mapX >= 0 && mapX < MAP_SIZE && mapY >= 0 && mapY < MAP_SIZE && MAP[mapY][mapX] === 0) {
        // Check corners for smoother collision
        const canMoveX = MAP[Math.floor(player.y)][Math.floor(newX)] === 0;
        const canMoveY = MAP[Math.floor(newY)][Math.floor(player.x)] === 0;
        
        if (canMoveX) player.x = newX;
        if (canMoveY) player.y = newY;
    }
}

function rotateMusket(player, dir, dt) {
    if (!player.alive) return;
    player.musketAngle += dir * MUSKET_ROT_SPEED;
    // Clamp musket angle
    player.musketAngle = Math.max(-Math.PI/3, Math.min(Math.PI/3, player.musketAngle));
}

function rotatePlayer(player, dir, dt) {
    if (!player.alive) return;
    player.angle += dir * ROT_SPEED;
}

// Raycasting
function castRay(angle, startX, startY) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    
    // DDA algorithm
    let mapX = Math.floor(startX);
    let mapY = Math.floor(startY);
    
    const deltaDistX = Math.abs(1 / cos);
    const deltaDistY = Math.abs(1 / sin);
    
    let stepX, stepY;
    let sideDistX, sideDistY;
    
    if (cos < 0) {
        stepX = -1;
        sideDistX = (startX - mapX) * deltaDistX;
    } else {
        stepX = 1;
        sideDistX = (mapX + 1 - startX) * deltaDistX;
    }
    
    if (sin < 0) {
        stepY = -1;
        sideDistY = (startY - mapY) * deltaDistY;
    } else {
        stepY = 1;
        sideDistY = (mapY + 1 - startY) * deltaDistY;
    }
    
    let hit = false;
    let side = 0;
    
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
        
        if (mapX < 0 || mapX >= MAP_SIZE || mapY < 0 || mapY >= MAP_SIZE) {
            hit = true;
        } else if (MAP[mapY][mapX] > 0) {
            hit = true;
        }
    }
    
    let perpWallDist;
    if (side === 0) {
        perpWallDist = (mapX - startX + (1 - stepX) / 2) / cos;
    } else {
        perpWallDist = (mapY - startY + (1 - stepY) / 2) / sin;
    }
    
    return {
        distance: perpWallDist,
        side: side,
        mapX: mapX,
        mapY: mapY
    };
}

// Render view
function renderView(ctx, player, opponent) {
    // Clear
    ctx.fillStyle = CEILING_COLOR;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2);
    ctx.fillStyle = FLOOR_COLOR;
    ctx.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT / 2);
    
    if (!player.alive) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        ctx.fillStyle = '#444';
        ctx.font = '20px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('FALLEN', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        ctx.font = '12px Courier New';
        ctx.fillText('Honor demands patience...', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 25);
        drawMusket(ctx, player);
        return;
    }
    
    // Raycast walls
    const stripeWidth = 2;
    for (let x = 0; x < SCREEN_WIDTH; x += stripeWidth) {
        const cameraX = 2 * x / SCREEN_WIDTH - 1;
        const rayAngle = player.totalAngle + cameraX * FOV / 2;
        
        const ray = castRay(rayAngle, player.x, player.y);
        
        // Draw opponent if in view
        const dx = opponent.x - player.x;
        const dy = opponent.y - player.y;
        const distToOpponent = Math.sqrt(dx * dx + dy * dy);
        const angleToOpponent = Math.atan2(dy, dx);
        let angleDiff = angleToOpponent - player.totalAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // Calculate wall height
        const wallHeight = SCREEN_HEIGHT / ray.distance;
        const drawStart = Math.max(0, (SCREEN_HEIGHT - wallHeight) / 2);
        const drawEnd = Math.min(SCREEN_HEIGHT, (SCREEN_HEIGHT + wallHeight) / 2);
        
        // Color based on side and distance
        const brightness = Math.max(0.2, 1 - ray.distance / 15);
        const baseColor = ray.side === 0 ? WALL_COLORS[0] : WALL_COLORS[1];
        const shaded = shadeColor(baseColor, brightness);
        
        ctx.fillStyle = shaded;
        ctx.fillRect(x, drawStart, stripeWidth, drawEnd - drawStart);
        
        // Draw floor
        for (let y = Math.floor(drawEnd); y < SCREEN_HEIGHT; y++) {
            const floorDist = SCREEN_HEIGHT / (2 * y - SCREEN_HEIGHT);
            const fog = Math.min(1, floorDist / 10);
            ctx.fillStyle = shadeColor(FLOOR_COLOR, 1 - fog * 0.5);
            ctx.fillRect(x, y, stripeWidth, 1);
        }
    }
    
    // Draw opponent sprite
    drawOpponent(ctx, player, opponent);
    
    // Draw musket
    drawMusket(ctx, player);
}

function drawOpponent(ctx, player, opponent) {
    if (!opponent.alive) return;
    
    const dx = opponent.x - player.x;
    const dy = opponent.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const angleToOpponent = Math.atan2(dy, dx);
    let angleDiff = angleToOpponent - player.totalAngle;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    // Check if in view
    if (Math.abs(angleDiff) < FOV / 2 && dist < 20) {
        // Check not behind wall
        const ray = castRay(angleToOpponent, player.x, player.y);
        if (ray.distance > dist - 0.5) {
            const screenX = SCREEN_WIDTH / 2 + angleDiff / (FOV / 2) * (SCREEN_WIDTH / 2);
            const spriteHeight = SCREEN_HEIGHT / dist * 0.8;
            const spriteWidth = spriteHeight * 0.5;
            
            const brightness = Math.max(0.3, 1 - dist / 12);
            ctx.fillStyle = shadeColor(opponent.color, brightness);
            ctx.fillRect(screenX - spriteWidth / 2, SCREEN_HEIGHT / 2 - spriteHeight / 2, spriteWidth, spriteHeight);
            
            // Draw musket
            ctx.fillStyle = shadeColor('#654321', brightness);
            ctx.fillRect(screenX - 2, SCREEN_HEIGHT / 2, 4, spriteHeight / 3);
        }
    }
}

function drawMusket(ctx, player) {
    const centerX = SCREEN_WIDTH / 2;
    const bottomY = SCREEN_HEIGHT;
    
    // Calculate position based on aim and recoil
    const aimOffset = player.aimProgress * 40;
    const recoilOffset = player.recoil * 30;
    const sideOffset = Math.sin(player.swayTime * 0.3) * (1 - player.aimProgress) * 5;
    
    const stockX = centerX + sideOffset;
    const stockY = bottomY - 20 + aimOffset - recoilOffset;
    
    // Stock (wood)
    ctx.strokeStyle = '#5c4033';
    ctx.fillStyle = '#6b4423';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(stockX, stockY);
    ctx.lineTo(stockX, stockY - 60);
    ctx.stroke();
    
    // Barrel (metal)
    ctx.strokeStyle = '#2a2a2a';
    ctx.fillStyle = '#333';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(stockX, stockY - 55);
    ctx.lineTo(stockX, stockY - 140);
    ctx.stroke();
    
    // Barrel bands
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
        const bandY = stockY - 65 - i * 30;
        ctx.beginPath();
        ctx.moveTo(stockX - 3, bandY);
        ctx.lineTo(stockX + 3, bandY);
        ctx.stroke();
    }
    
    // Rear sight (notch)
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(stockX - 8, stockY - 100);
    ctx.lineTo(stockX - 3, stockY - 100);
    ctx.lineTo(stockX - 3, stockY - 105);
    ctx.moveTo(stockX + 8, stockY - 100);
    ctx.lineTo(stockX + 3, stockY - 100);
    ctx.lineTo(stockX + 3, stockY - 105);
    ctx.stroke();
    
    // Front sight post (blade)
    const sightHeight = player.aimProgress > 0.8 ? 15 : 8;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(stockX - 1, stockY - 142, 2, sightHeight);
    
    // Draw reload animation if active
    if (player.reloading) {
        drawReloadAnimation(ctx, player);
    }
    
    // Muzzle flash
    if (player.recoil > 0.7) {
        ctx.fillStyle = `rgba(255, 200, 50, ${player.recoil})`;
        ctx.beginPath();
        ctx.arc(stockX, stockY - 145, 15 * player.recoil, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(255, 100, 0, ${player.recoil * 0.8})`;
        ctx.beginPath();
        ctx.arc(stockX, stockY - 145, 8 * player.recoil, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Iron sight overlay when aiming
    if (player.aimProgress > 0.1) {
        drawIronSights(ctx, player.aimProgress);
    }
}

function drawIronSights(ctx, progress) {
    const alpha = progress * 0.7;
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;
    
    // Rear sight aperture (blur edges)
    const gradient = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, 150);
    gradient.addColorStop(0, `rgba(0,0,0,0)`);
    gradient.addColorStop(0.3, `rgba(0,0,0,${alpha * 0.3})`);
    gradient.addColorStop(1, `rgba(0,0,0,${alpha})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    // Rear sight V-notch
    ctx.strokeStyle = `rgba(20, 20, 20, ${alpha})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX - 40, centerY + 30);
    ctx.lineTo(centerX - 5, centerY + 30);
    ctx.lineTo(centerX - 5, centerY + 25);
    ctx.moveTo(centerX + 40, centerY + 30);
    ctx.lineTo(centerX + 5, centerY + 30);
    ctx.lineTo(centerX + 5, centerY + 25);
    ctx.stroke();
    
    // Front sight post (centered in notch)
    ctx.fillStyle = `rgba(30, 30, 30, ${alpha})`;
    ctx.fillRect(centerX - 2, centerY + 15, 4, 20);
    
    // Front sight tip (gold/brass)
    ctx.fillStyle = `rgba(180, 140, 60, ${alpha})`;
    ctx.fillRect(centerX - 1, centerY + 15, 2, 4);
}

function drawReloadAnimation(ctx, player) {
    const step = RELOAD_STEPS[player.reloadStep];
    const progress = 1 - (player.reloadTimer / step.duration);
    
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT - 100;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(centerX - 80, centerY - 20, 160, 40);
    
    ctx.fillStyle = '#aaa';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(step.name.toUpperCase(), centerX, centerY);
    
    // Progress bar
    ctx.strokeStyle = '#444';
    ctx.strokeRect(centerX - 60, centerY + 5, 120, 8);
    ctx.fillStyle = '#666';
    ctx.fillRect(centerX - 58, centerY + 7, 116 * progress, 4);
    
    // Visual animation based on step
    ctx.save();
    ctx.translate(centerX + 100, centerY);
    
    switch(step.name) {
        case 'powder':
            // Powder horn tilting
            ctx.rotate(-Math.PI / 4 * progress);
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.ellipse(0, 0, 15, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'ball':
            // Ball dropping
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.arc(0, -20 + progress * 20, 5, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'ramrod':
            // Ramrod moving
            ctx.fillStyle = '#654321';
            ctx.fillRect(-3, -30 + progress * 40, 6, 40);
            break;
        case 'prime':
            // Pan priming
            ctx.fillStyle = '#333';
            ctx.fillRect(-10, -5, 20, 10);
            if (progress > 0.5) {
                ctx.fillStyle = '#f4a460';
                ctx.fillRect(-5, -2, 10, 4);
            }
            break;
        case 'return':
            // Musket returning to shoulder
            ctx.globalAlpha = progress;
            ctx.fillStyle = '#5c4033';
            ctx.fillRect(-5, -40, 10, 40);
            break;
    }
    
    ctx.restore();
}

function shadeColor(color, factor) {
    const hex = color.replace('#', '');
    const r = Math.floor(parseInt(hex.substr(0, 2), 16) * factor);
    const g = Math.floor(parseInt(hex.substr(2, 2), 16) * factor);
    const b = Math.floor(parseInt(hex.substr(4, 2), 16) * factor);
    return `rgb(${r},${g},${b})`;
}

// Main game loop
function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    const dt = (timestamp - lastTime) / 1000 || 0.016;
    lastTime = timestamp;
    
    // Player 1 input
    let p1Move = 0, p1Strafe = 0;
    if (keys['KeyW']) p1Move += 1;
    if (keys['KeyS']) p1Move -= 1;
    if (keys['KeyA']) p1Strafe -= 1;
    if (keys['KeyD']) p1Strafe += 1;
    if (keys['KeyQ']) rotateMusket(player1, -1, dt);
    if (keys['KeyE']) rotateMusket(player1, 1, dt);
    
    // Player 1 body rotation (when not aiming)
    if (player1.musketState !== MUSKET_STATE.AIMING) {
        if (keys['ArrowLeft']) rotatePlayer(player1, -1, dt);
        if (keys['ArrowRight']) rotatePlayer(player1, 1, dt);
    }
    
    movePlayer(player1, p1Move, p1Strafe, dt);
    
    // Player 2 input
    let p2Move = 0, p2Strafe = 0;
    if (keys['KeyI']) p2Move += 1;
    if (keys['KeyK']) p2Move -= 1;
    if (keys['KeyJ']) p2Strafe -= 1;
    if (keys['KeyL']) p2Strafe += 1;
    if (keys['KeyU']) rotateMusket(player2, -1, dt);
    if (keys['KeyO']) rotateMusket(player2, 1, dt);
    
    // Player 2 body rotation
    if (player2.musketState !== MUSKET_STATE.AIMING) {
        if (keys['Numpad4']) rotatePlayer(player2, -1, dt);
        if (keys['Numpad6']) rotatePlayer(player2, 1, dt);
    }
    
    movePlayer(player2, p2Move, p2Strafe, dt);
    
    // Update players
    player1.update(dt);
    player2.update(dt);
    
    // Render
    renderView(ctx1, player1, player2);
    renderView(ctx2, player2, player1);
    
    requestAnimationFrame(gameLoop);
}

// Start
init();