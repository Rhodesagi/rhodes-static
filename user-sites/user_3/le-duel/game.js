// LE DUEL - Raycasting Musket Duel Game
// Pseudo-3D first person shooter with iron sight aiming

const SCREEN_WIDTH = 400;
const SCREEN_HEIGHT = 300;
const FOV = Math.PI / 3;
const BLOCK_SIZE = 64;
const MOVE_SPEED = 2;
const ROT_SPEED = 0.03;
const TILT_SPEED = 0.02;
const MAX_TILT = 0.3;

// Map: 1=wall, 0=empty, 2=spawn1, 3=spawn2
const MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,0,0,0,0,0,0,3,1],
    [1,0,1,0,1,0,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,0,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,0,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,3,0,0,0,0,0,0,0,0,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1]
];

const MAP_WIDTH = MAP[0].length;
const MAP_HEIGHT = MAP.length;

// Textures (procedural)
const WALL_TEXTURE = createWallTexture();
const FLOOR_TEXTURE = createFloorTexture();
const WOOD_TEXTURE = createWoodTexture();
const METAL_TEXTURE = createMetalTexture();

function createWallTexture() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#554433';
    ctx.fillRect(0,0,64,64);
    for(let i=0;i<200;i++) {
        ctx.fillStyle = `rgba(${60+Math.random()*40},${50+Math.random()*30},${30+Math.random()*20},0.3)`;
        ctx.fillRect(Math.random()*64, Math.random()*64, 2+Math.random()*4, 2+Math.random()*4);
    }
    return c;
}

function createFloorTexture() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0,0,64,64);
    for(let i=0;i<100;i++) {
        ctx.fillStyle = `rgba(${40+Math.random()*20},${40+Math.random()*20},${40+Math.random()*20},0.5)`;
        ctx.fillRect(Math.random()*64, Math.random()*64, 1, 1);
    }
    return c;
}

function createWoodTexture() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#654321';
    ctx.fillRect(0,0,64,64);
    ctx.strokeStyle = '#543210';
    for(let i=0;i<10;i++) {
        ctx.beginPath();
        ctx.moveTo(0, Math.random()*64);
        ctx.lineTo(64, Math.random()*64);
        ctx.stroke();
    }
    return c;
}

function createMetalTexture() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#444';
    ctx.fillRect(0,0,64,64);
    for(let i=0;i<50;i++) {
        ctx.fillStyle = `rgba(${100+Math.random()*100},${100+Math.random()*100},${100+Math.random()*100},0.3)`;
        ctx.fillRect(Math.random()*64, Math.random()*64, 2, 2);
    }
    return c;
}

class Player {
    constructor(id, spawnChar) {
        this.id = id;
        this.spawnChar = spawnChar;
        this.reset();
    }

    reset() {
        // Find spawn position
        for(let y=0; y<MAP_HEIGHT; y++) {
            for(let x=0; x<MAP_WIDTH; x++) {
                if(MAP[y][x] === this.spawnChar) {
                    this.x = x * BLOCK_SIZE + BLOCK_SIZE/2;
                    this.y = y * BLOCK_SIZE + BLOCK_SIZE/2;
                    this.angle = this.spawnChar === 2 ? 0 : Math.PI;
                    break;
                }
            }
        }
        this.tilt = 0;
        this.pitch = 0;
        this.health = 100;
        this.alive = true;
        
        // Musket state
        this.loaded = true;
        this.reloading = false;
        this.reloadStage = 0;
        this.reloadTimer = 0;
        this.aiming = false;
        this.breathOffset = 0;
        this.breathTime = 0;
        this.recoil = 0;
        
        // Reload stages timing (ms)
        this.reloadStages = [
            { name: 'open pan', time: 300 },
            { name: 'pour powder', time: 800 },
            { name: 'charge powder', time: 600 },
            { name: 'place ball', time: 700 },
            { name: 'ram cartridge', time: 1200 },
            { name: 'prime pan', time: 800 },
            { name: 'close pan', time: 300 },
            { name: 'full cock', time: 500 }
        ];
    }

    update(dt) {
        if(!this.alive) return;
        
        this.breathTime += dt;
        this.breathOffset = Math.sin(this.breathTime * 0.002) * (this.aiming ? 0.5 : 2);
        
        if(this.recoil > 0) {
            this.recoil -= dt * 0.003;
            if(this.recoil < 0) this.recoil = 0;
        }
        
        if(this.reloading) {
            this.reloadTimer -= dt;
            if(this.reloadTimer <= 0) {
                this.reloadStage++;
                if(this.reloadStage >= this.reloadStages.length) {
                    this.reloading = false;
                    this.loaded = true;
                    this.reloadStage = 0;
                } else {
                    this.reloadTimer = this.reloadStages[this.reloadStage].time;
                }
            }
        }
    }

    move(dx, dy) {
        if(!this.alive) return;
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        if(!isWall(newX, this.y)) this.x = newX;
        if(!isWall(this.x, newY)) this.y = newY;
    }

    rotate(delta) {
        if(!this.alive) return;
        this.angle += delta;
    }

    tiltMusket(delta) {
        if(!this.alive) return;
        this.tilt += delta;
        this.tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT, this.tilt));
    }

    startAim() {
        if(!this.alive) return;
        this.aiming = true;
    }

    stopAim() {
        this.aiming = false;
    }

    fire() {
        if(!this.alive || !this.loaded || this.reloading) return false;
        
        this.loaded = false;
        this.recoil = 1.0;
        
        // Calculate shot direction with breath sway
        const sway = this.aiming ? (Math.random() - 0.5) * 0.02 : (Math.random() - 0.5) * 0.1;
        const shotAngle = this.angle + this.tilt + sway;
        
        return {
            x: this.x,
            y: this.y,
            angle: shotAngle,
            player: this
        };
    }

    startReload() {
        if(!this.alive || this.loaded || this.reloading) return;
        this.reloading = true;
        this.reloadStage = 0;
        this.reloadTimer = this.reloadStages[0].time;
    }

    takeDamage(amount) {
        this.health -= amount;
        if(this.health <= 0) {
            this.health = 0;
            this.alive = false;
        }
    }
}

function isWall(x, y) {
    const mx = Math.floor(x / BLOCK_SIZE);
    const my = Math.floor(y / BLOCK_SIZE);
    if(mx < 0 || mx >= MAP_WIDTH || my < 0 || my >= MAP_HEIGHT) return true;
    return MAP[my][mx] === 1;
}

function castRay(x, y, angle) {
    let rx = x;
    let ry = y;
    let dist = 0;
    const step = 2;
    
    while(dist < 1000) {
        rx += Math.cos(angle) * step;
        ry += Math.sin(angle) * step;
        dist += step;
        
        if(isWall(rx, ry)) {
            return { x: rx, y: ry, dist: dist, hit: true };
        }
    }
    
    return { x: rx, y: ry, dist: dist, hit: false };
}

function castRayToPlayer(fromX, fromY, angle, targetPlayer) {
    const dx = targetPlayer.x - fromX;
    const dy = targetPlayer.y - fromY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const angleToTarget = Math.atan2(dy, dx);
    
    // Check if aiming at player (with tolerance)
    let angleDiff = angleToTarget - angle;
    while(angleDiff > Math.PI) angleDiff -= 2*Math.PI;
    while(angleDiff < -Math.PI) angleDiff += 2*Math.PI;
    
    if(Math.abs(angleDiff) > 0.1) return null;
    
    // Check for wall between
    const wall = castRay(fromX, fromY, angleToTarget);
    if(wall.hit && wall.dist < dist) return null;
    
    return { dist: dist, angleDiff: angleDiff };
}

class Game {
    constructor() {
        this.canvas1 = document.getElementById('canvas1');
        this.canvas2 = document.getElementById('canvas2');
        this.ctx1 = this.canvas1.getContext('2d');
        this.ctx2 = this.canvas2.getContext('2d');
        
        this.canvas1.width = SCREEN_WIDTH;
        this.canvas1.height = SCREEN_HEIGHT;
        this.canvas2.width = SCREEN_WIDTH;
        this.canvas2.height = SCREEN_HEIGHT;
        
        this.player1 = new Player(1, 2);
        this.player2 = new Player(2, 3);
        
        this.keys = {};
        this.lastTime = 0;
        this.gameRunning = false;
        
        this.setupControls();
        this.setupResize();
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Player 1 actions
            if(e.key.toLowerCase() === 'x') this.player1.startAim();
            if(e.key.toLowerCase() === 'f') this.shoot(this.player1);
            if(e.key.toLowerCase() === 'r') this.player1.startReload();
            
            // Player 2 actions
            if(e.key.toLowerCase() === 'm') this.player2.startAim();
            if(e.key.toLowerCase() === 'h') this.shoot(this.player2);
            if(e.key.toLowerCase() === 'y') this.player2.startReload();
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            
            if(e.key.toLowerCase() === 'x') this.player1.stopAim();
            if(e.key.toLowerCase() === 'm') this.player2.stopAim();
        });
    }

    setupResize() {
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        const container = document.getElementById('gameContainer');
        const views = document.querySelectorAll('.player-view');
        views.forEach(v => {
            v.style.height = (window.innerHeight / 2 - 2) + 'px';
        });
    }

    shoot(player) {
        const shot = player.fire();
        if(!shot) return;
        
        const target = player === this.player1 ? this.player2 : this.player1;
        const hit = castRayToPlayer(shot.x, shot.y, shot.angle, target);
        
        if(hit) {
            // Damage based on distance and aim quality
            let damage = 80 + Math.random() * 40;
            if(hit.dist > 300) damage *= 0.6;
            if(!player.aiming) damage *= 0.5;
            
            target.takeDamage(damage);
            
            if(!target.alive) {
                this.endGame(player);
            }
        }
    }

    endGame(winner) {
        this.gameRunning = false;
        const victory = document.getElementById('victory');
        const victorText = document.getElementById('victorText');
        victorText.textContent = `Player ${winner.id} Wins!`;
        victorText.style.color = winner.id === 1 ? '#8f8' : '#88f';
        victory.style.display = 'block';
    }

    reset() {
        this.player1.reset();
        this.player2.reset();
        this.gameRunning = true;
        document.getElementById('victory').style.display = 'none';
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        if(!this.gameRunning) return;
        
        // Player 1 movement
        if(this.keys['w']) this.player1.move(Math.cos(this.player1.angle) * MOVE_SPEED, Math.sin(this.player1.angle) * MOVE_SPEED);
        if(this.keys['s']) this.player1.move(-Math.cos(this.player1.angle) * MOVE_SPEED, -Math.sin(this.player1.angle) * MOVE_SPEED);
        if(this.keys['a']) this.player1.move(Math.cos(this.player1.angle - Math.PI/2) * MOVE_SPEED, Math.sin(this.player1.angle - Math.PI/2) * MOVE_SPEED);
        if(this.keys['d']) this.player1.move(Math.cos(this.player1.angle + Math.PI/2) * MOVE_SPEED, Math.sin(this.player1.angle + Math.PI/2) * MOVE_SPEED);
        if(this.keys['q']) this.player1.tiltMusket(-TILT_SPEED);
        if(this.keys['e']) this.player1.tiltMusket(TILT_SPEED);
        
        // Player 2 movement
        if(this.keys['i']) this.player2.move(Math.cos(this.player2.angle) * MOVE_SPEED, Math.sin(this.player2.angle) * MOVE_SPEED);
        if(this.keys['k']) this.player2.move(-Math.cos(this.player2.angle) * MOVE_SPEED, -Math.sin(this.player2.angle) * MOVE_SPEED);
        if(this.keys['j']) this.player2.move(Math.cos(this.player2.angle - Math.PI/2) * MOVE_SPEED, Math.sin(this.player2.angle - Math.PI/2) * MOVE_SPEED);
        if(this.keys['l']) this.player2.move(Math.cos(this.player2.angle + Math.PI/2) * MOVE_SPEED, Math.sin(this.player2.angle + Math.PI/2) * MOVE_SPEED);
        if(this.keys['u']) this.player2.tiltMusket(-TILT_SPEED);
        if(this.keys['o']) this.player2.tiltMusket(TILT_SPEED);
        
        this.player1.update(dt);
        this.player2.update(dt);
    }

    render(ctx, player, otherPlayer) {
        // Clear
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT/2);
        ctx.fillStyle = '#3d3d3d';
        ctx.fillRect(0, SCREEN_HEIGHT/2, SCREEN_WIDTH, SCREEN_HEIGHT/2);
        
        // Raycasting
        const numRays = SCREEN_WIDTH / 2;
        const angleStep = FOV / numRays;
        
        for(let i=0; i<numRays; i++) {
            const rayAngle = player.angle - FOV/2 + i * angleStep;
            const ray = castRay(player.x, player.y, rayAngle);
            
            if(ray.hit) {
                const dist = ray.dist * Math.cos(rayAngle - player.angle);
                const wallHeight = (BLOCK_SIZE / dist) * 300;
                const y1 = SCREEN_HEIGHT/2 - wallHeight/2 + player.pitch + player.breathOffset;
                const y2 = y1 + wallHeight;
                
                // Texture mapping
                const wallX = ray.x % BLOCK_SIZE;
                const texX = Math.floor((wallX / BLOCK_SIZE) * 64);
                
                // Distance shading
                const shade = Math.max(0.2, 1 - ray.dist / 600);
                ctx.globalAlpha = shade;
                ctx.drawImage(WALL_TEXTURE, texX, 0, 1, 64, i*2, y1, 2, wallHeight);
                ctx.globalAlpha = 1;
            }
        }
        
        // Draw other player if visible
        const dx = otherPlayer.x - player.x;
        const dy = otherPlayer.y - player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const angleToOther = Math.atan2(dy, dx);
        
        let angleDiff = angleToOther - player.angle;
        while(angleDiff > Math.PI) angleDiff -= 2*Math.PI;
        while(angleDiff < -Math.PI) angleDiff += 2*Math.PI;
        
        if(Math.abs(angleDiff) < FOV/2 && dist < 800) {
            // Check if visible (not behind wall)
            const wall = castRay(player.x, player.y, angleToOther);
            if(!wall.hit || wall.dist > dist) {
                const screenX = SCREEN_WIDTH/2 + (angleDiff / (FOV/2)) * (SCREEN_WIDTH/2);
                const spriteHeight = (BLOCK_SIZE / dist) * 200;
                const spriteY = SCREEN_HEIGHT/2 - spriteHeight/2 + player.pitch;
                
                ctx.fillStyle = otherPlayer.id === 1 ? '#4a4' : '#44a';
                ctx.fillRect(screenX - spriteHeight/4, spriteY, spriteHeight/2, spriteHeight);
                
                // Head
                ctx.fillStyle = '#fdb';
                ctx.fillRect(screenX - spriteHeight/6, spriteY - spriteHeight/4, spriteHeight/3, spriteHeight/4);
            }
        }
        
        // Draw musket
        this.renderMusket(ctx, player);
        
        // Draw status (minimal - no HUD, just subtle indicators)
        if(player.reloading) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(SCREEN_WIDTH/2 - 60, SCREEN_HEIGHT - 40, 120, 20);
            ctx.fillStyle = '#aa8';
            const progress = (player.reloadStage + (player.reloadStages[player.reloadStage].time - player.reloadTimer) / player.reloadStages[player.reloadStage].time) / player.reloadStages.length;
            ctx.fillRect(SCREEN_WIDTH/2 - 58, SCREEN_HEIGHT - 38, 116 * progress, 16);
            
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(player.reloadStages[player.reloadStage].name, SCREEN_WIDTH/2, SCREEN_HEIGHT - 45);
        }
        
        // Death screen
        if(!player.alive) {
            ctx.fillStyle = 'rgba(100,0,0,0.7)';
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 30px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('DEFEATED', SCREEN_WIDTH/2, SCREEN_HEIGHT/2);
        }
    }

    renderMusket(ctx, player) {
        const w = SCREEN_WIDTH;
        const h = SCREEN_HEIGHT;
        
        ctx.save();
        
        // Recoil effect
        const recoilY = player.recoil * 50;
        
        // Aim down sights or hip fire
        if(player.aiming) {
            // Iron sight view
            ctx.translate(w/2, h - 80 - recoilY);
            
            // Stock
            ctx.drawImage(WOOD_TEXTURE, -20, 20, 40, 80);
            
            // Barrel
            ctx.drawImage(METAL_TEXTURE, -8, -40, 16, 80);
            
            // Rear sight
            ctx.fillStyle = '#222';
            ctx.fillRect(-10, -35, 20, 5);
            ctx.fillRect(-2, -40, 4, 10);
            
            // Front sight
            ctx.fillRect(-2, -60, 4, 8);
            ctx.fillStyle = '#aaa';
            ctx.fillRect(-1, -58, 2, 4);
            
            // Flintlock mechanism
            ctx.fillStyle = '#333';
            ctx.fillRect(-12, -10, 24, 15);
            ctx.fillStyle = '#666';
            ctx.fillRect(-8, -5, 16, 8);
            
        } else {
            // Hip fire position
            ctx.translate(w/2 + 50, h - 60 - recoilY);
            ctx.rotate(-0.3);
            
            // Stock
            ctx.drawImage(WOOD_TEXTURE, -15, 10, 30, 60);
            
            // Barrel
            ctx.drawImage(METAL_TEXTURE, -6, -50, 12, 70);
            
            // Flintlock
            ctx.fillStyle = '#333';
            ctx.fillRect(-10, -20, 20, 12);
        }
        
        ctx.restore();
        
        // Muzzle flash
        if(player.recoil > 0.8) {
            ctx.save();
            const flashX = player.aiming ? w/2 : w/2 + 80;
            const flashY = player.aiming ? h - 140 - recoilY : h - 110 - recoilY;
            ctx.translate(flashX, flashY);
            
            ctx.fillStyle = `rgba(255, ${200+Math.random()*55}, 0, ${player.recoil})`;
            ctx.beginPath();
            for(let i=0; i<8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const r = 20 + Math.random() * 20;
                ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = `rgba(255, 255, 200, ${player.recoil})`;
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        // Smoke
        if(player.recoil > 0) {
            ctx.fillStyle = `rgba(100,100,100,${player.recoil * 0.3})`;
            const smokeX = player.aiming ? w/2 : w/2 + 80;
            const smokeY = player.aiming ? h - 140 : h - 110;
            ctx.beginPath();
            ctx.arc(smokeX + Math.random()*20-10, smokeY - 30 - (1-player.recoil)*50, 20 + (1-player.recoil)*30, 0, Math.PI*2);
            ctx.fill();
        }
    }

    loop(timestamp) {
        if(!this.gameRunning) return;
        
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        this.update(dt);
        this.render(this.ctx1, this.player1, this.player2);
        this.render(this.ctx2, this.player2, this.player1);
        
        requestAnimationFrame((t) => this.loop(t));
    }
}

let game;

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    if(!game) game = new Game();
    game.reset();
}

function resetGame() {
    if(game) game.reset();
}