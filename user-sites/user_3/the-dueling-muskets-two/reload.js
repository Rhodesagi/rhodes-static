// Musket reloading system

let reloadState = {
    active: false,
    player: null,
    step: 0,
    progress: 0,
    steps: [
        { name: 'Pour Powder', duration: 2.0, key: 'KeyP' },
        { name: 'Ram Ball', duration: 1.5, key: 'KeyB' },
        { name: 'Prime Pan', duration: 1.0, key: 'KeyV' },
        { name: 'Ready', duration: 0.5, key: 'KeyEnter' }
    ],
    currentStepStart: 0
};

// Start reloading process for a player
function startReload(playerIndex) {
    if (reloadState.active) return;
    
    const musket = muskets[playerIndex];
    if (!musket) return;
    
    // Check if already loaded
    if (musket.isLoaded) {
        showMessage(`Player ${playerIndex + 1} already loaded!`, 1500);
        return;
    }
    
    // Check resources
    if (musket.powder <= 0 || musket.ball <= 0) {
        showMessage(`Player ${playerIndex + 1}: Need powder and ball!`, 1500);
        return;
    }
    
    // Start reload
    reloadState.active = true;
    reloadState.player = playerIndex;
    reloadState.step = 0;
    reloadState.progress = 0;
    reloadState.currentStepStart = Date.now();
    
    musket.reloading = true;
    
    // Show reload overlay
    showReloadOverlay(playerIndex);
    
    console.log(`Player ${playerIndex + 1} started reloading`);
}

// Update reload progress
function updateReload() {
    if (!reloadState.active) return;
    
    const musket = muskets[reloadState.player];
    if (!musket) {
        cancelReload();
        return;
    }
    
    const currentTime = Date.now();
    const elapsed = (currentTime - reloadState.currentStepStart) / 1000;
    const stepDuration = reloadState.steps[reloadState.step].duration;
    
    reloadState.progress = Math.min(elapsed / stepDuration, 1);
    
    // Update progress bar
    const progressBar = document.getElementById('reloadProgress');
    if (progressBar) {
        progressBar.style.width = `${reloadState.progress * 100}%`;
    }
    
    // Highlight current step
    updateStepHighlight();
    
    // Check if step completed
    if (elapsed >= stepDuration) {
        nextStep();
    }
}

// Move to next reload step
function nextStep() {
    reloadState.step++;
    reloadState.progress = 0;
    reloadState.currentStepStart = Date.now();
    
    if (reloadState.step >= reloadState.steps.length) {
        finishReload();
        return;
    }
    
    // Update UI for new step
    updateStepHighlight();
    console.log(`Reload step: ${reloadState.steps[reloadState.step].name}`);
}

// Finish reloading
function finishReload() {
    const playerIndex = reloadState.player;
    const musket = muskets[playerIndex];
    
    if (musket) {
        // Consume resources
        musket.powder -= 25; // Use some powder
        musket.ball -= 1;
        
        // Set loaded state
        musket.isLoaded = true;
        musket.primed = true;
        
        musket.reloading = false;
        
        // Update HUD
        updateHUD(playerIndex);
        
        console.log(`Player ${playerIndex + 1} finished reloading`);
        showMessage(`Player ${playerIndex + 1} reloaded! Ready to fire.`, 2000);
    }
    
    // Hide overlay
    hideReloadOverlay();
    
    // Reset state
    reloadState.active = false;
    reloadState.player = null;
}

// Cancel reload
function cancelReload() {
    if (!reloadState.active) return;
    
    const playerIndex = reloadState.player;
    const musket = muskets[playerIndex];
    if (musket) {
        musket.reloading = false;
    }
    
    hideReloadOverlay();
    reloadState.active = false;
    reloadState.player = null;
    
    showMessage('Reload cancelled', 1500);
}

// Show reload overlay UI
function showReloadOverlay(playerIndex) {
    const overlay = document.getElementById('reloadOverlay');
    if (overlay) {
        overlay.style.display = 'block';
        overlay.style.left = playerIndex === 0 ? '25%' : '75%';
        
        // Reset step highlights
        for (let i = 0; i < 4; i++) {
            const stepEl = document.getElementById(`step${i + 1}`);
            if (stepEl) {
                stepEl.className = 'step';
                stepEl.textContent = `${i + 1}. ${reloadState.steps[i].name} (Press ${reloadState.steps[i].key})`;
            }
        }
        
        updateStepHighlight();
    }
}

// Hide reload overlay
function hideReloadOverlay() {
    const overlay = document.getElementById('reloadOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Update which step is highlighted
function updateStepHighlight() {
    if (!reloadState.active) return;
    
    for (let i = 0; i < 4; i++) {
        const stepEl = document.getElementById(`step${i + 1}`);
        if (stepEl) {
            if (i === reloadState.step) {
                stepEl.className = 'step active';
            } else if (i < reloadState.step) {
                stepEl.className = 'step';
                stepEl.innerHTML = `${i + 1}. ${reloadState.steps[i].name} ✓`;
            } else {
                stepEl.className = 'step';
            }
        }
    }
}

// Handle reload key presses (optional minigame)
function handleReloadKey(key) {
    if (!reloadState.active) return;
    
    const currentStep = reloadState.steps[reloadState.step];
    if (key === currentStep.key) {
        // Speed up progress on correct key press
        reloadState.progress += 0.3;
        if (reloadState.progress >= 1) {
            nextStep();
        }
    }
}

// Initialize reload system
function initReloadSystem() {
    // Add reload update to animation loop
    const originalAnimate = window.animate;
    window.animate = function() {
        if (typeof originalAnimate === 'function') {
            originalAnimate();
        }
        updateReload();
        updateMovement(clock.getDelta());
    };
    
    // Add key handler for reload minigame
    window.addEventListener('keydown', (event) => {
        handleReloadKey(event.code);
    });
    
    console.log('Reload system ready');
}

// Start reload system when page loads
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(initReloadSystem, 1500);
});