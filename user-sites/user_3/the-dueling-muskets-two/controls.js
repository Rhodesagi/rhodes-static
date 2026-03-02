// Keyboard controls for two-player musket duel

// Key state tracking
const keys = {};

// Player 1 controls
const P1_MOVE_FORWARD = 'KeyW';
const P1_MOVE_BACK = 'KeyS';
const P1_MOVE_LEFT = 'KeyA';
const P1_MOVE_RIGHT = 'KeyD';
const P1_TURN_LEFT = 'KeyQ';
const P1_TURN_RIGHT = 'KeyE';
const P1_RELOAD = 'KeyR';
const P1_AIM = 'KeyX';
const P1_FIRE = 'KeyF';

// Player 2 controls
const P2_MOVE_FORWARD = 'ArrowUp';
const P2_MOVE_BACK = 'ArrowDown';
const P2_MOVE_LEFT = 'ArrowLeft';
const P2_MOVE_RIGHT = 'ArrowRight';
const P2_TURN_LEFT = 'KeyN';
const P2_TURN_RIGHT = 'KeyM';
const P2_RELOAD = 'KeyL';
const P2_AIM = 'Period';
const P2_FIRE = 'Slash';

// Movement speed
const MOVE_SPEED = 5;
const TURN_SPEED = 2;
const MOUSE_SENSITIVITY = 0.002;

// Initialize controls
function initControls() {
    // Set up key listeners
    window.addEventListener('keydown', (event) => {
        keys[event.code] = true;
        handleAction(event.code);
    });
    
    window.addEventListener('keyup', (event) => {
        keys[event.code] = false;
    });
    
    // Set up mouse movement for looking (optional)
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', () => {
        document.body.requestPointerLock();
    });
    
    console.log('Controls ready');
}

// Handle discrete actions (reload, fire, aim toggle)
function handleAction(key) {
    // Player 1 actions
    if (key === P1_RELOAD && !muskets[0].reloading) {
        startReload(0);
    }
    if (key === P1_AIM) {
        toggleAim(0);
    }
    if (key === P1_FIRE) {
        fireMusket(0);
    }
    
    // Player 2 actions
    if (key === P2_RELOAD && !muskets[1].reloading) {
        startReload(1);
    }
    if (key === P2_AIM) {
        toggleAim(1);
    }
    if (key === P2_FIRE) {
        fireMusket(1);
    }
}

// Handle continuous movement
function updateMovement(delta) {
    // Player 1 movement
    let p1Move = new THREE.Vector3(0, 0, 0);
    if (keys[P1_MOVE_FORWARD]) p1Move.z -= 1;
    if (keys[P1_MOVE_BACK]) p1Move.z += 1;
    if (keys[P1_MOVE_LEFT]) p1Move.x -= 1;
    if (keys[P1_MOVE_RIGHT]) p1Move.x += 1;
    
    // Player 2 movement
    let p2Move = new THREE.Vector3(0, 0, 0);
    if (keys[P2_MOVE_FORWARD]) p2Move.z -= 1;
    if (keys[P2_MOVE_BACK]) p2Move.z += 1;
    if (keys[P2_MOVE_LEFT]) p2Move.x -= 1;
    if (keys[P2_MOVE_RIGHT]) p2Move.x += 1;
    
    // Normalize and apply
    if (p1Move.lengthSq() > 0) {
        p1Move.normalize();
        muskets[0].camera.position.add(p1Move.multiplyScalar(MOVE_SPEED * delta));
    }
    
    if (p2Move.lengthSq() > 0) {
        p2Move.normalize();
        muskets[1].camera.position.add(p2Move.multiplyScalar(MOVE_SPEED * delta));
    }
    
    // Player 1 musket turning (Q/E)
    let p1Turn = 0;
    if (keys[P1_TURN_LEFT]) p1Turn += 1;
    if (keys[P1_TURN_RIGHT]) p1Turn -= 1;
    
    // Player 2 musket turning (N/M)
    let p2Turn = 0;
    if (keys[P2_TURN_LEFT]) p2Turn += 1;
    if (keys[P2_TURN_RIGHT]) p2Turn -= 1;
    
    // Apply musket rotation
    if (p1Turn !== 0 && muskets[0].group) {
        muskets[0].group.rotation.z += p1Turn * TURN_SPEED * delta;
        // Clamp rotation
        muskets[0].group.rotation.z = Math.max(-Math.PI/6, Math.min(Math.PI/6, muskets[0].group.rotation.z));
    }
    
    if (p2Turn !== 0 && muskets[1].group) {
        muskets[1].group.rotation.z += p2Turn * TURN_SPEED * delta;
        muskets[1].group.rotation.z = Math.max(-Math.PI/6, Math.min(Math.PI/6, muskets[1].group.rotation.z));
    }
}

// Mouse look (optional, can be disabled for pure keyboard)
function handleMouseMove(event) {
    if (document.pointerLockElement === document.body) {
        // Horizontal rotation (yaw) for both players based on which side mouse is on
        const mouseX = event.movementX;
        const viewportWidth = window.innerWidth;
        
        // Determine which player's view the mouse is in
        if (event.clientX < viewportWidth / 2) {
            // Player 1 view
            muskets[0].camera.rotation.y -= mouseX * MOUSE_SENSITIVITY;
        } else {
            // Player 2 view
            muskets[1].camera.rotation.y -= mouseX * MOUSE_SENSITIVITY;
        }
    }
}

// Aim toggle - brings musket to iron sights position
function toggleAim(playerIndex) {
    const musket = muskets[playerIndex];
    musket.isAiming = !musket.isAiming;
    
    if (musket.group) {
        if (musket.isAiming) {
            // Move musket to aiming position (centered, closer to eye)
            musket.group.position.set(0, -0.1, -0.3);
            musket.group.rotation.z = 0;
        } else {
            // Return to hip position
            musket.group.position.set(0.5, -0.3, -1);
        }
    }
    
    console.log(`Player ${playerIndex + 1} ${musket.isAiming ? 'aiming' : 'not aiming'}`);
}

// Fire musket
function fireMusket(playerIndex) {
    const musket = muskets[playerIndex];
    
    // Check if musket is loaded and primed
    if (!musket.isLoaded || !musket.primed) {
        console.log(`Player ${playerIndex + 1}: Musket not ready to fire!`);
        showMessage(`Player ${playerIndex + 1}: Reload first!`, 2000);
        return;
    }
    
    // Fire animation
    if (musket.group) {
        // Kickback
        musket.group.position.z += 0.2;
        setTimeout(() => {
            if (musket.group) musket.group.position.z -= 0.2;
        }, 100);
    }
    
    // Create muzzle flash
    createMuzzleFlash(musket.camera);
    
    // Reset loaded state
    musket.isLoaded = false;
    musket.primed = false;
    musket.ball = 0;
    
    // Update HUD
    updateHUD(playerIndex);
    
    console.log(`Player ${playerIndex + 1} fired!`);
    showMessage(`Player ${playerIndex + 1} fired!`, 1000);
}

// Create muzzle flash effect
function createMuzzleFlash(camera) {
    const flashGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({ color: 0xFFAA00, transparent: true, opacity: 0.8 });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    
    // Position at musket barrel end
    flash.position.set(0.8, -0.2, -1.5);
    camera.add(flash);
    
    // Animate and remove
    let opacity = 0.8;
    function animateFlash() {
        opacity -= 0.1;
        flashMaterial.opacity = opacity;
        
        if (opacity <= 0) {
            camera.remove(flash);
            return;
        }
        
        requestAnimationFrame(animateFlash);
    }
    
    animateFlash();
}

// Show temporary message
function showMessage(text, duration) {
    const messageEl = document.getElementById('message');
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.style.display = 'block';
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, duration);
    }
}

// Update HUD display
function updateHUD(playerIndex) {
    const musket = muskets[playerIndex];
    const prefix = playerIndex === 0 ? 'p1' : 'p2';
    
    document.getElementById(`${prefix}Powder`).textContent = `${musket.powder}%`;
    document.getElementById(`${prefix}Ball`).textContent = musket.ball;
    document.getElementById(`${prefix}Primed`).textContent = musket.primed ? 'Yes' : 'No';
}

// Initialize controls when main.js is ready
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(initControls, 1000); // Wait for muskets to be created
});