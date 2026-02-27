// ╔══════════════════════════════════════════════════════════════╗
// ║           THE MUSKETEERS THREE - MUSKET DUEL FPS              ║
// ║     Iron sights only. No HUD. Authentic reloading.           ║
// ╚══════════════════════════════════════════════════════════════╝

const GameState = { MENU: 0, PLAYING: 1, RELOADING: 2, AIMING: 3, VICTORY: 4 };
let currentState = GameState.MENU;
let currentPlayer = 1;
let player1HP = 100, player2HP = 100;

let scene, camera, renderer;
let musketGroup, musketBarrel;
let opponentMesh;
let particles = [], smokeParticles = [];

let playerPos = { x: 0, z: 10 };
let playerRot = 0;
let musketRotY = 0, musketRotX = 0;
let isAiming = false, isReloading = false, canFire = false;
let reloadStage = 0;

const keys = {};

const RELOAD_STAGES = [
    { name: "📂 Open Pan", duration: 500 },
    { name: "⚗️ Pour Powder", duration: 1200 },
    { name: "⚫ Patch & Ball", duration: 1500 },
    { name: "🔧 Ramrod", duration: 2000 },
    { name: "✨ Prime Pan", duration: 800 },
    { name: "📁 Close Pan", duration: 500 },
    { name: "🔨 Cock Hammer", duration: 600 },
    { name: "⚔️ READY", duration: 0 }
];

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 10);
    
    const canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);
    
    createArena();
    createMusket();
    createOpponent();
    
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    animate();
}

function createArena() {
    const groundGeo = new THREE.PlaneGeometry(200, 200, 50, 50);
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const z = Math.random() * 0.3;
        pos.setZ(i, z);
    }
    groundGeo.computeVertexNormals();
    
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x3d5c3d, roughness: 0.9, metalness: 0.1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    const skyGeo = new THREE.SphereGeometry(400, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide });
    const skybox = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skybox);
    
    for (let i = 0; i < 15; i++) {
        const tree = createTree();
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 60;
        tree.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
        scene.add(tree);
    }
    
    createDuelingPost(-15, -30, 1);
    createDuelingPost(15, -30, 2);
    createDuelingPost(0, 30, 0);
}

function createTree() {
    const group = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2;
    trunk.castShadow = true;
    group.add(trunk);
    
    const leavesGeo = new THREE.ConeGeometry(3, 8, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2d4a1e });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 6;
    leaves.castShadow = true;
    group.add(leaves);
    
    return group;
}

function createDuelingPost(x, z, num) {
    const post = new THREE.Group();
    const baseGeo = new THREE.CylinderGeometry(0.8, 1, 0.5, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.25;
    post.add(base);
    
    const woodGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const wood = new THREE.Mesh(woodGeo, woodMat);
    wood.position.y = 1.25;
    post.add(wood);
    
    post.position.set(x, 0, z);
    scene.add(post);
}

function createMusket() {
    musketGroup = new THREE.Group();
    
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.7 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.8 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xB5A642, roughness: 0.3, metalness: 0.9 });
    
    // Stock
    const stockGeo = new THREE.BoxGeometry(0.12, 0.2, 1.2);
    const stockPos = stockGeo.attributes.position;
    for (let i = 0; i < stockPos.count; i++) {
        if (stockPos.getZ(i) < -0.3) {
            stockPos.setX(i, stockPos.getX(i) * 0.6);
            stockPos.setY(i, stockPos.getY(i) * 0.6);
        }
    }
    stockGeo.computeVertexNormals();
    const musketStock = new THREE.Mesh(stockGeo, woodMat);
    musketStock.position.set(0, -0.05, -0.2);
    musketGroup.add(musketStock);
    
    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 12);
    musketBarrel = new THREE.Mesh(barrelGeo, metalMat);
    musketBarrel.rotation.x = Math.PI / 2;
    musketBarrel.position.set(0, 0.05, 0.4);
    musketGroup.add(musketBarrel);
    
    // Brass bands
    for (let i = 0; i < 3; i++) {
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12), brassMat);
        band.rotation.x = Math.PI / 2;
        band.position.set(0, 0.05, -0.2 + i * 0.5);
        musketGroup.add(band);
    }
    
    // Trigger guard
    const guardGeo = new THREE.TorusGeometry(0.08, 0.01, 8, 16, Math.PI);
    const triggerGuard = new THREE.Mesh(guardGeo, brassMat);
    triggerGuard.position.set(0, -0.08, -0.15);
    triggerGuard.rotation.z = Math.PI;
    musketGroup.add(triggerGuard);
    
    // Trigger
    const trigger = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.06, 8), metalMat);
    trigger.rotation.z = Math.PI / 4;
    trigger.position.set(0, -0.1, -0.15);
    musketGroup.add(trigger);
    
    // Hammer
    const hammerGroup = new THREE.Group();
    const hammerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8), metalMat);
    hammerBase.rotation.x = Math.PI / 2;
    const hammerArm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 0.02), metalMat);
    hammerArm.position.y = 0.05;
    hammerGroup.add(hammerBase, hammerArm);
    hammerGroup.position.set(-0.04, 0.12, -0.35);
    hammerGroup.name = "hammer";
    musketGroup.add(hammerGroup);
    
    // Pan cover
    const panCover = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.08), metalMat);
    panCover.position.set(0.04, 0.08, -0.35);
    musketGroup.add(panCover);
    
    // IRON SIGHTS - Front blade
    const ironSightFront = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.04, 0.01), metalMat);
    ironSightFront.position.set(0, 0.13, 1.1);
    musketGroup.add(ironSightFront);
    
    // Rear sight V-notch
    const rearSightBase = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.02), metalMat);
    rearSightBase.position.set(0, 0.11, -0.25);
    musketGroup.add(rearSightBase);
    
    const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.03, 0.005), metalMat);
    leftPost.position.set(-0.008, 0.015, 0);
    const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.03, 0.005), metalMat);
    rightPost.position.set(0.008, 0.015, 0);
    const rearSight = new THREE.Group();
    rearSight.add(leftPost, rightPost);
    rearSight.position.set(0, 0.125, -0.25);
    musketGroup.add(rearSight);
    
    // Ramrod
    const ramrod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.3, 8), metalMat);
    ramrod.rotation.x = Math.PI / 2;
    ramrod.position.set(0, -0.12, 0.4);
    ramrod.name = "ramrod";
    musketGroup.add(ramrod);
    
    musketGroup.position.set(0.3, -0.3, 0.5);
    musketGroup.rotation.y = -0.1;
    musketGroup.visible = false;
    scene.add(musketGroup);
}

function createOpponent() {
    opponentMesh = new THREE.Group();
    
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a0080 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.25), bodyMat);
    torso.position.y = 1.1;
    opponentMesh.add(torso);
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
    head.position.y = 1.6;
    opponentMesh.add(head);
    
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.02, 3), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    hatBrim.position.y = 1.72;
    opponentMesh.add(hatBrim);
    
    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.15, 16), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    hatCrown.position.y = 1.8;
    opponentMesh.add(hatCrown);
    
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.7), pantsMat);
    leftLeg.position.set(-0.12, 0.35, 0);
    opponentMesh.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.7), pantsMat);
    rightLeg.position.set(0.12, 0.35, 0);
    opponentMesh.add(rightLeg);
    
    updateOpponentPosition();
    scene.add(opponentMesh);
}

function updateOpponentPosition() {
    if (!opponentMesh) return;
    if (currentPlayer === 1) {
        opponentMesh.position.set(15, 0, -30);
        opponentMesh.rotation.y = Math.PI;
    } else {
        opponentMesh.position.set(-15, 0, -30);
        opponentMesh.rotation.y = 0;
    }
}

function onKeyDown(e) {
    keys[e.code] = true;
    if (currentState !== GameState.PLAYING) return;
    
    if (e.code === 'KeyX' && !isReloading) toggleAim(true);
    if (e.code === 'KeyF' && canFire && isAiming && !isReloading) fireMusket();
    if (e.code === 'KeyR' && !isReloading && !canFire) startReload();
    if (e.code === 'KeyQ') musketRotY = Math.max(musketRotY - 0.03, -0.25);
    if (e.code === 'KeyE') musketRotY = Math.min(musketRotY + 0.03, 0.25);
}

function onKeyUp(e) {
    keys[e.code] = false;
    if (e.code === 'KeyX') toggleAim(false);
}

function toggleAim(aiming) {
    isAiming = aiming;
    const hint = document.getElementById('aimHint');
    
    if (aiming) {
        musketGroup.position.set(0, -0.08, 0.25);
        musketGroup.rotation.x = -0.05;
        hint.style.display = 'block';
        hint.textContent = canFire ? "Aim with Q/E, Press F to Fire" : "Must reload first!";
    } else {
        musketGroup.position.set(0.3, -0.3, 0.5);
        musketGroup.rotation.x = 0;
        hint.style.display = 'none';
    }
}

function startReload() {
    isReloading = true;
    reloadStage = 0;
    
    const statusEl = document.getElementById('reloadStatus');
    statusEl.style.display = 'block';
    statusEl.textContent = RELOAD_STAGES[0].name;
    statusEl.style.color = "#fff";
    
    musketGroup.position.set(0.3, -0.4, 0.5);
    musketGroup.rotation.x = 0.3;
    
    processReloadStage();
}

function processReloadStage() {
    if (reloadStage >= RELOAD_STAGES.length - 1) {
        finishReload();
        return;
    }
    
    const stage = RELOAD_STAGES[reloadStage];
    const statusEl = document.getElementById('reloadStatus');
    
    animateReloadStage(reloadStage);
    
    setTimeout(() => {
        reloadStage++;
        if (reloadStage < RELOAD_STAGES.length) {
            statusEl.textContent = RELOAD_STAGES[reloadStage].name;
            processReloadStage();
        }
    }, stage.duration);
}

function animateReloadStage(stage) {
    const ramrod = musketGroup.getObjectByName("ramrod");
    const hammer = musketGroup.getObjectByName("hammer");
    
    switch(stage) {
        case 0: musketGroup.rotation.z = 0.1; break;
        case 3: if (ramrod) ramrod.visible = false; break;
        case 5: musketGroup.rotation.z = 0; break;
        case 6: if (hammer) hammer.rotation.x = -0.5; break;
    }
}

function finishReload() {
    isReloading = false;
    canFire = true;
    
    const statusEl = document.getElementById('reloadStatus');
    statusEl.textContent = "⚔️ READY TO FIRE ⚔️";
    statusEl.style.color = "#d4af37";
    
    const ramrod = musketGroup.getObjectByName("ramrod");
    if (ramrod) ramrod.visible = true;
    
    setTimeout(() => {
        statusEl.style.display = 'none';
        statusEl.style.color = "#fff";
    }, 2000);
}

function fireMusket() {
    if (!canFire) return;
    canFire = false;
    
    // Recoil
    musketGroup.position.z += 0.3;
    musketGroup.rotation.x += 0.2;
    
    createMuzzleFlash();
    createSmoke();
    
    const statusEl = document.getElementById('reloadStatus');
    statusEl.style.display = 'block';
    statusEl.textContent = "💥 BOOM! 💥";
    statusEl.style.color = "#ff4444";
    
    const hammer = musketGroup.getObjectByName("hammer");
    if (hammer) hammer.rotation.x = 0;
    
    checkHit();
    
    setTimeout(() => {
        statusEl.style.display = 'none';
        statusEl.style.color = "#fff";
    }, 1000);
    
    setTimeout(() => {
        if (isAiming) {
            musketGroup.position.set(0, -0.08, 0.25);
            musketGroup.rotation.x = -0.05;
        }
    }, 200);
}

function createMuzzleFlash() {
    const flash = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.9 })
    );
    
    const barrelTip = new THREE.Vector3(0, 0.05, 1.1);
    barrelTip.applyMatrix4(musketGroup.matrixWorld);
    flash.position.copy(barrelTip);
    
    scene.add(flash);
    particles.push({ mesh: flash, life: 5, type: 'flash' });
}

function createSmoke() {
    for (let i = 0; i < 20; i++) {
        const smoke = new THREE.Mesh(
            new THREE.SphereGeometry(0.05 + Math.random() * 0.1, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.6 })
        );
        
        const barrelTip = new THREE.Vector3(0, 0.05, 1.1);
        barrelTip.applyMatrix4(musketGroup.matrixWorld);
        
        smoke.position.copy(barrelTip);
        smoke.position.x += (Math.random() - 0.5) * 0.1;
        smoke.position.y += (Math.random() - 0.5) * 0.1;
        
        const velocity = new THREE.Vector3((Math.random() - 0.5) * 0.05, Math.random() * 0.05 + 0.02, 0.1 + Math.random() * 0.05);
        velocity.applyQuaternion(camera.quaternion);
        
        scene.add(smoke);
        smokeParticles.push({ mesh: smoke, velocity: velocity, life: 120 + Math.random() * 60, maxLife: 120 + Math.random() * 60 });
    }
}

function checkHit() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    const aimOffset = new THREE.Vector3(musketRotY * 2, musketRotX * 2, 0);
    raycaster.ray.direction.add(aimOffset).normalize();
    
    const intersects = raycaster.intersectObject(opponentMesh, true);
    
    if (intersects.length > 0) {
        const hitY = intersects[0].point.y;
        let damage = 0, text = "";
        
        if (hitY > 1.5) { damage = 100; text = "☠️ HEADSHOT! ☠️"; }
        else if (hitY > 1.0) { damage = 60; text = "☠️ HIT! ☠️"; }
        else { damage = 30; text = "☠️ LEG HIT! ☠️"; }
        
        if (currentPlayer === 1) player2HP -= damage;
        else player1HP -= damage;
        
        showHitMarker(text);
        
        if (player1HP <= 0 || player2HP <= 0) {
            setTimeout(() => endDuel(), 1000);
        } else {
            setTimeout(() => switchTurn(), 2000);
        }
    } else {
        showHitMarker("💨 MISS! 💨", true);
        setTimeout(() => switchTurn(), 1500);
    }
}

function showHitMarker(text, isMiss) {
    const marker = document.getElementById('hitMarker');
    marker.textContent = text;
    marker.style.color = isMiss ? '#888' : '#ff4444';
    marker.style.display = 'block';
    marker.style.animation = 'none';
    marker.offsetHeight;
    marker.style.animation = 'hitPulse 0.5s ease-out';
    
    setTimeout(() => { marker.style.display = 'none'; }, 1500);
}

function switchTurn() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    
    isAiming = false;
    isReloading = false;
    canFire = false;
    musketRotY = 0;
    musketRotX = 0;
    
    document.getElementById('turnIndicator').textContent = `Player ${currentPlayer}'s Turn`;
    document.getElementById('aimHint').style.display = 'none';
    document.getElementById('reloadStatus').style.display = 'none';
    
    musketGroup.position.set(0.3, -0.3, 0.5);
    musketGroup.rotation.set(0, -0.1, 0);
    
    updateOpponentPosition();
    
    setTimeout(() => { if (currentState === GameState.PLAYING) startReload(); }, 500);
}

function endDuel() {
    currentState = GameState.VICTORY;
    const winner = player1HP > 0 ? 1 : 2;
    document.getElementById('victoryText').textContent = `Player ${winner} Wins!`;
    document.getElementById('victoryScreen').style.display = 'flex';
    if (document.exitPointerLock) document.exitPointerLock();
}

function animate() {
    requestAnimationFrame(animate);
    
    if (currentState === GameState.PLAYING) {
        updateMovement();
        updateParticles();
        updateMusket();
    }
    
    renderer.render(scene, camera);
}

function updateMovement() {
    const speed = 0.08;
    if (keys['KeyW']) camera.position.z -= speed;
    if (keys['KeyS']) camera.position.z += speed;
    if (keys['KeyA']) camera.position.x -= speed;
    if (keys['KeyD']) camera.position.x += speed;
    
    camera.position.x = Math.max(-45, Math.min(45, camera.position.x));
    camera.position.z = Math.max(-45, Math.min(25, camera.position.z));
    camera.position.y = 1.6;
}

function updateMusket() {
    if (!musketGroup.visible) return;
    
    musketGroup.position.applyMatrix4(camera.matrixWorld);
    musketGroup.quaternion.copy(camera.quaternion);
    musketGroup.rotateY(musketRotY);
    musketGroup.rotateX(musketRotX);
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life--;
        if (p.type === 'flash') {
            p.mesh.scale.multiplyScalar(0.8);
            p.mesh.material.opacity = p.life / 5;
        }
        if (p.life <= 0) {
            scene.remove(p.mesh);
            particles.splice(i, 1);
        }
    }
    
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
        const p = smokeParticles[i];
        p.life--;
        p.mesh.position.add(p.velocity);
        p.mesh.scale.multiplyScalar(1.01);
        p.mesh.material.opacity = (p.life / p.maxLife) * 0.6;
        p.velocity.y += 0.001;
        
        if (p.life <= 0) {
            scene.remove(p.mesh);
            smokeParticles.splice(i, 1);
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function startGame(playerNum) {
    currentPlayer = playerNum;
    currentState = GameState.PLAYING;
    player1HP = 100;
    player2HP = 100;
    
    document.getElementById('introScreen').style.display = 'none';
    document.getElementById('gameUI').style.display = 'block';
    document.getElementById('turnIndicator').textContent = `Player ${currentPlayer}'s Turn`;
    
    musketGroup.visible = true;
    
    const canvas = document.getElementById('gameCanvas');
    if (canvas.requestPointerLock) canvas.requestPointerLock();
    
    if (currentPlayer === 1) camera.position.set(-15, 1.6, 10);
    else camera.position.set(15, 1.6, 10);
    camera.lookAt(0, 1.6, -30);
    
    setTimeout(() => startReload(), 1000);
}

function resetGame() {
    currentState = GameState.MENU;
    document.getElementById('victoryScreen').style.display = 'none';
    document.getElementById('introScreen').style.display = 'flex';
    document.getElementById('gameUI').style.display = 'none';
    musketGroup.visible = false;
    player1HP = 100;
    player2HP = 100;
    isAiming = false;
    isReloading = false;
    canFire = false;
}

window.addEventListener('load', init);
