// Extracted from rhodes.js: split mode subsystem
// SPLIT MODE IMPLEMENTATION
// ============================================

window.splitModeActive = false;
window.splitPaneCount = 0;
window.paneConnections = {};
window.paneSessionIds = {};
window.splitPanelSizes = {};      // Track panel flex ratios: {1: 0.5, 2: 0.5}
window.splitRowSizes = {};        // For 2x2 grid row heights: {1: 0.5, 2: 0.5}
window.splitResizeState = null;   // Active resize drag state
window.paneMessageCounters = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}; // Message numbering
window.paneLetters = {1: 'A', 2: 'B', 3: 'G', 4: 'D', 5: 'E', 6: 'Z'}; // Alpha, Beta, Gamma, Delta
window.paneColors = {1: '#00ff41', 2: '#00bfff', 3: '#bf00ff', 4: '#ff8c00', 5: '#ff0066', 6: '#ffff00'};

// ============================================
// SPLIT MODE CSS (injected)
// ============================================
(function() {
    if (document.getElementById('split-mode-layout-css')) return;
    var s = document.createElement('style');
    s.id = 'split-mode-layout-css';
    s.textContent = [
        '#split-view { flex-direction: column !important; }',
        '.split-container { flex: 1; min-height: 0; width: 100%; }',
        '.split-instance { flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; border: 1px solid rgba(0,255,65,0.3); }',
        '.instance-header { display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: rgba(0,255,65,0.08); border-bottom: 1px solid rgba(0,255,65,0.2); flex-shrink: 0; font-family: Orbitron, monospace; font-size: 12px; color: var(--green, #00ff41); }',
        '.instance-chat { flex: 1; overflow-y: auto; padding: 8px; min-height: 0; }',
        '.instance-input { display: flex; align-items: center; gap: 4px; padding: 4px; border-top: 1px solid rgba(0,255,65,0.2); flex-shrink: 0; }',
        '.instance-input input[type="text"] { flex: 1; background: var(--bg, #0a0a0a); border: 1px solid var(--border, #333); color: var(--text, #ccc); padding: 6px 8px; font-family: monospace; font-size: 13px; }',
        '.split-resize-handle { width: 5px; background: rgba(0,255,65,0.15); cursor: col-resize; flex-shrink: 0; transition: background 0.15s; }',
        '.split-resize-handle:hover { background: rgba(0,255,65,0.5); }',
        '.split-resize-handle.vertical { width: auto; height: 5px; cursor: row-resize; }',
        '.split-row { min-height: 0; }',
        '.split-container.resizing { user-select: none; -webkit-user-select: none; }',
        '.split-container.resizing * { pointer-events: none; }',
        '.split-container.resizing .split-resize-handle { pointer-events: auto; }'
    ].join('\n');
    document.head.appendChild(s);
})();

 // Green, Blue, Purple, Orange

window.enterSplitMode = function(paneCount, resumeSessionIds) {
    console.log('[SPLIT] Entering split mode with', paneCount, 'panes', resumeSessionIds ? '(resuming)' : '(new)');
    window._splitResumeIds = resumeSessionIds || null;
    window._multisandboxMode = true;  // All split sessions get isolated sandboxes
    
    // Hide main chat
    const mainChat = document.getElementById('chat');
    const inputArea = document.getElementById('input-area');
    const voiceBar = document.getElementById('voice-bar');
    if (mainChat) mainChat.style.display = 'none';
    if (inputArea) inputArea.style.display = 'none';
    if (voiceBar) voiceBar.style.display = 'none';
    
    // Show split view (CSS handles positioning via position:fixed)
    const splitView = document.getElementById('split-view');
    if (splitView) {
        splitView.style.display = 'flex';
        splitView.style.flexDirection = 'column';
    }
    
    // Configure grid layout based on pane count
    const container = splitView.querySelector('.split-container');
    if (container) {
        container.style.display = 'flex';
        container.style.gap = '0';  // Handles provide visual gap
        container.style.flex = '1';
        container.style.minHeight = '0';
        container.style.width = '100%';
        
        // Hide all instances first
        const instances = container.querySelectorAll('.split-instance');
        instances.forEach((inst, i) => {
            inst.style.display = (i < paneCount) ? 'flex' : 'none';
            if (i < paneCount) {
                inst.style.flexDirection = 'column';
                inst.style.minWidth = '0';
                inst.style.minHeight = '0';
                inst.style.overflow = 'hidden';
            }
        });
        
        // Configure layout based on pane count
        container.style.display = 'flex';
        container.style.gridTemplateColumns = '';
        container.style.gridTemplateRows = '';
        container.style.gap = '0';

        if (paneCount === 4 || paneCount === 6) {
            // Use nested flex for grid with resize support (2x2 or 3x2)
            container.style.flexDirection = 'column';
            container.style.position = 'relative';
        } else {
            // Horizontal flex for 2 or 3 panes
            container.style.flexDirection = 'row';
            container.style.flexWrap = 'nowrap';
        }
    }
    
    window.splitModeActive = true;
    window.splitPaneCount = paneCount;
    
    // Connect each pane to its own WebSocket
    for (let i = 1; i <= paneCount; i++) {
        connectPane(i);
    }
    
    // Add exit button if not present
    addExitSplitButton();
    
    // Initialize resizable panels after DOM is ready
    setTimeout(function() {
        if (window.initResizablePanels) {
            window.initResizablePanels();
        }
    }, 100);

    showToast('Split mode: ' + paneCount + ' panes');
};

window.exitSplitMode = function() {
    console.log('[SPLIT] Exiting split mode');
    window.splitActive = false;
    
    // Show main chat
    const mainChat = document.getElementById('chat');
    const inputArea = document.getElementById('input-area');
    const voiceBar = document.getElementById('voice-bar');
    if (mainChat) mainChat.style.display = '';
    if (inputArea) inputArea.style.display = '';
    if (voiceBar) voiceBar.style.display = '';
    
    // Hide split view
    const splitView = document.getElementById('split-view');
    if (splitView) splitView.style.display = 'none';
    
    // === RESET DOM STRUCTURE ===
    // On first enter, create4PaneLayout/create6PaneLayout moves .split-instance
    // elements into .split-row wrappers and adds .split-resize-handle elements.
    // Without cleanup, re-entering split mode finds a mangled DOM and panes
    // get ridiculous dimensions from nested flex containers.
    const container = splitView ? splitView.querySelector('.split-container') : null;
    if (container) {
        // Collect all instances regardless of nesting depth
        const allInstances = Array.from(container.querySelectorAll('.split-instance'));
        
        // Remove all split-row wrappers and resize handles
        container.querySelectorAll('.split-row').forEach(function(row) { row.remove(); });
        container.querySelectorAll('.split-resize-handle').forEach(function(h) { h.remove(); });
        
        // Re-append instances directly to container in order
        allInstances.sort(function(a, b) {
            return parseInt(a.dataset.instance) - parseInt(b.dataset.instance);
        });
        allInstances.forEach(function(inst) {
            // Reset inline styles that enterSplitMode/applyPanelSizes set
            inst.style.flex = '';
            inst.style.display = '';
            inst.style.flexDirection = '';
            inst.style.minWidth = '';
            inst.style.minHeight = '';
            inst.style.overflow = '';
            inst.classList.remove('expanded');
            container.appendChild(inst);
        });
        
        // Reset container inline styles
        container.style.display = '';
        container.style.flexDirection = '';
        container.style.flexWrap = '';
        container.style.gap = '';
        container.style.flex = '';
        container.style.minHeight = '';
        container.style.width = '';
        container.style.position = '';
        container.style.gridTemplateColumns = '';
        container.style.gridTemplateRows = '';
    }
    
    // Close pane connections
    for (let i = 1; i <= 6; i++) {
        if (window.paneConnections[i]) {
            window.paneConnections[i].close();
            window.paneConnections[i] = null;
        }
    }
    
    // Remove exit button container (includes collapse button)
    const btnContainer = document.getElementById('split-btn-container');
    if (btnContainer) btnContainer.remove();
    const exitBtn = document.getElementById('exit-split-btn');
    if (exitBtn) exitBtn.remove();
    
    // Remove collapse-header button
    const collapseBtn = document.getElementById('collapse-header-btn');
    if (collapseBtn) collapseBtn.remove();
    
    // Restore header if it was collapsed
    const header = document.querySelector('header');
    if (header && header.style.display === 'none') {
        header.style.display = '';
    }
    const returnBtn = document.getElementById('split-return-btn');
    if (returnBtn) returnBtn.remove();
    
    // Reset split view top position  
    if (splitView) splitView.style.top = '';
    
    // Clear saved panel sizes so they don't pollute next session
    window.splitPanelSizes = {};
    window.splitRowSizes = {};
    
    // Clear chat contents from panes
    for (let i = 1; i <= 6; i++) {
        const chatEl = document.getElementById('split-chat-' + i);
        if (chatEl) chatEl.innerHTML = '';
    }
    
    window.splitModeActive = false;
    window.splitPaneCount = 0;
    
    showToast('Exited split mode');
};


// ============================================
// RESIZABLE SPLIT PANELS
// ============================================

/**
 * Initialize resizable panels after entering split mode
 */
window.initResizablePanels = function() {
    const container = document.querySelector('.split-container');
    if (!container) return;

    const paneCount = window.splitPaneCount;

    // Initialize equal sizes
    const equalSize = 1 / paneCount;
    for (let i = 1; i <= paneCount; i++) {
        window.splitPanelSizes[i] = equalSize;
    }

    // Remove existing handles
    container.querySelectorAll('.split-resize-handle').forEach(h => h.remove());

    // Create resize handles between panels
    if (paneCount === 2 || paneCount === 3) {
        createHorizontalHandles(container, paneCount);
    } else if (paneCount === 4) {
        create4PaneLayout(container);
    } else if (paneCount === 6) {
        create6PaneLayout(container);
    }

    // Apply initial sizes
    applyPanelSizes();

    // Add click-to-expand to headers
    initHeaderClickExpand();

    // Restore saved sizes if available
    restorePanelSizes();
};

/**
 * Create horizontal resize handles for 2 or 3 pane layouts
 */
function createHorizontalHandles(container, paneCount) {
    const instances = Array.from(container.querySelectorAll('.split-instance')).filter((el, i) => i < paneCount);

    for (let i = 0; i < paneCount - 1; i++) {
        const handle = document.createElement('div');
        handle.className = 'split-resize-handle';
        handle.dataset.leftPane = (i + 1).toString();
        handle.dataset.rightPane = (i + 2).toString();

        // Insert handle after current instance
        instances[i].after(handle);

        // Attach drag events
        handle.addEventListener('mousedown', startHorizontalResize);
        handle.addEventListener('touchstart', startHorizontalResize, {passive: false});
    }
}

/**
 * Create 4-pane layout with nested rows and resize handles
 */
function create4PaneLayout(container) {
    const instances = Array.from(container.querySelectorAll('.split-instance'));

    // Remove instances from container temporarily
    instances.forEach(inst => inst.remove());

    // Remove any existing rows/handles
    container.querySelectorAll('.split-row, .split-resize-handle').forEach(el => el.remove());

    // Create row 1 (panes 1 and 2)
    const row1 = document.createElement('div');
    row1.className = 'split-row';
    row1.style.cssText = 'display:flex;flex:1;min-height:0;gap:0;';

    // Create row 2 (panes 3 and 4)
    const row2 = document.createElement('div');
    row2.className = 'split-row';
    row2.style.cssText = 'display:flex;flex:1;min-height:0;gap:0;';

    // Add panes to rows with horizontal handles
    row1.appendChild(instances[0]);

    const handle12 = document.createElement('div');
    handle12.className = 'split-resize-handle';
    handle12.dataset.leftPane = '1';
    handle12.dataset.rightPane = '2';
    handle12.dataset.row = '1';
    handle12.addEventListener('mousedown', startHorizontalResize);
    handle12.addEventListener('touchstart', startHorizontalResize, {passive: false});
    row1.appendChild(handle12);

    row1.appendChild(instances[1]);

    row2.appendChild(instances[2]);

    const handle34 = document.createElement('div');
    handle34.className = 'split-resize-handle';
    handle34.dataset.leftPane = '3';
    handle34.dataset.rightPane = '4';
    handle34.dataset.row = '2';
    handle34.addEventListener('mousedown', startHorizontalResize);
    handle34.addEventListener('touchstart', startHorizontalResize, {passive: false});
    row2.appendChild(handle34);

    row2.appendChild(instances[3]);

    // Create vertical handle between rows
    const vHandle = document.createElement('div');
    vHandle.className = 'split-resize-handle vertical';
    vHandle.dataset.topRow = '1';
    vHandle.dataset.bottomRow = '2';
    vHandle.addEventListener('mousedown', startVerticalResize);
    vHandle.addEventListener('touchstart', startVerticalResize, {passive: false});

    // Add to container
    container.appendChild(row1);
    container.appendChild(vHandle);
    container.appendChild(row2);

    // Initialize row sizes
    window.splitRowSizes = {1: 0.5, 2: 0.5};

    // Set initial panel sizes within rows
    window.splitPanelSizes = {1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5};
}

/**
 * Create 6-pane layout: 3 columns x 2 rows with resize handles
 */
function create6PaneLayout(container) {
    var instances = Array.from(container.querySelectorAll('.split-instance'));

    // Remove instances from container
    instances.forEach(function(inst) { inst.remove(); });

    // Remove any existing rows/handles
    container.querySelectorAll('.split-row, .split-resize-handle').forEach(function(el) { el.remove(); });

    // Create row 1 (panes 1, 2, 3)
    var row1 = document.createElement('div');
    row1.className = 'split-row';
    row1.style.cssText = 'display:flex;flex:0.5;min-height:0;gap:0;';

    // Create row 2 (panes 4, 5, 6)
    var row2 = document.createElement('div');
    row2.className = 'split-row';
    row2.style.cssText = 'display:flex;flex:0.5;min-height:0;gap:0;';

    // Row 1: pane1, handle12, pane2, handle23, pane3
    row1.appendChild(instances[0]);

    var h12 = document.createElement('div');
    h12.className = 'split-resize-handle';
    h12.dataset.leftPane = '1';
    h12.dataset.rightPane = '2';
    h12.dataset.row = '1';
    h12.addEventListener('mousedown', startHorizontalResize);
    h12.addEventListener('touchstart', startHorizontalResize, {passive: false});
    row1.appendChild(h12);

    row1.appendChild(instances[1]);

    var h23 = document.createElement('div');
    h23.className = 'split-resize-handle';
    h23.dataset.leftPane = '2';
    h23.dataset.rightPane = '3';
    h23.dataset.row = '1';
    h23.addEventListener('mousedown', startHorizontalResize);
    h23.addEventListener('touchstart', startHorizontalResize, {passive: false});
    row1.appendChild(h23);

    row1.appendChild(instances[2]);

    // Row 2: pane4, handle45, pane5, handle56, pane6
    row2.appendChild(instances[3]);

    var h45 = document.createElement('div');
    h45.className = 'split-resize-handle';
    h45.dataset.leftPane = '4';
    h45.dataset.rightPane = '5';
    h45.dataset.row = '2';
    h45.addEventListener('mousedown', startHorizontalResize);
    h45.addEventListener('touchstart', startHorizontalResize, {passive: false});
    row2.appendChild(h45);

    row2.appendChild(instances[4]);

    var h56 = document.createElement('div');
    h56.className = 'split-resize-handle';
    h56.dataset.leftPane = '5';
    h56.dataset.rightPane = '6';
    h56.dataset.row = '2';
    h56.addEventListener('mousedown', startHorizontalResize);
    h56.addEventListener('touchstart', startHorizontalResize, {passive: false});
    row2.appendChild(h56);

    row2.appendChild(instances[5]);

    // Vertical handle between rows
    var vHandle = document.createElement('div');
    vHandle.className = 'split-resize-handle vertical';
    vHandle.dataset.topRow = '1';
    vHandle.dataset.bottomRow = '2';
    vHandle.addEventListener('mousedown', startVerticalResize);
    vHandle.addEventListener('touchstart', startVerticalResize, {passive: false});

    // Add to container
    container.appendChild(row1);
    container.appendChild(vHandle);
    container.appendChild(row2);

    // Initialize sizes
    window.splitRowSizes = {1: 0.5, 2: 0.5};
    window.splitPanelSizes = {1: 0.333, 2: 0.333, 3: 0.333, 4: 0.333, 5: 0.333, 6: 0.333};
}


/**
 * Position center handle at intersection of rows/columns
 */
function positionCenterHandle() {
    var handle = document.getElementById('split-center-handle');
    var container = document.querySelector('.split-container');
    if (!handle || !container) return;

    var rows = container.querySelectorAll('.split-row');
    if (rows.length !== 2) return;

    var containerRect = container.getBoundingClientRect();
    var row1Rect = rows[0].getBoundingClientRect();

    // Find horizontal position (between pane 1 and 2)
    var pane1 = document.querySelector('.split-instance[data-instance="1"]');
    var pane1Rect = pane1 ? pane1.getBoundingClientRect() : null;

    if (pane1Rect) {
        var centerX = pane1Rect.right - containerRect.left - 10;
        var centerY = row1Rect.bottom - containerRect.top - 10;
        handle.style.left = centerX + 'px';
        handle.style.top = centerY + 'px';
    }
}

/**
 * Start center/diagonal resize
 */
function startCenterResize(e) {
    e.preventDefault();
    e.stopPropagation();

    var handle = e.currentTarget;
    var container = document.querySelector('.split-container');
    var containerRect = container.getBoundingClientRect();

    var startX = e.touches ? e.touches[0].clientX : e.clientX;
    var startY = e.touches ? e.touches[0].clientY : e.clientY;

    window.splitResizeState = {
        type: 'center',
        handle: handle,
        startX: startX,
        startY: startY,
        containerWidth: containerRect.width,
        containerHeight: containerRect.height,
        initialRowSizes: {1: window.splitRowSizes[1], 2: window.splitRowSizes[2]},
        initialPanelSizes: {
            1: window.splitPanelSizes[1],
            2: window.splitPanelSizes[2],
            3: window.splitPanelSizes[3],
            4: window.splitPanelSizes[4]
        }
    };

    handle.classList.add('active');
    container.classList.add('resizing');
    document.body.style.cursor = 'move';
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', onCenterResizeMove);
    document.addEventListener('mouseup', onCenterResizeEnd);
    document.addEventListener('touchmove', onCenterResizeMove, {passive: false});
    document.addEventListener('touchend', onCenterResizeEnd);
}

/**
 * Handle center resize movement
 */
function onCenterResizeMove(e) {
    if (!window.splitResizeState || window.splitResizeState.type !== 'center') return;
    e.preventDefault();

    var state = window.splitResizeState;
    var currentX = e.touches ? e.touches[0].clientX : e.clientX;
    var currentY = e.touches ? e.touches[0].clientY : e.clientY;

    var deltaX = currentX - state.startX;
    var deltaY = currentY - state.startY;

    var deltaRatioX = deltaX / state.containerWidth;
    var deltaRatioY = deltaY / state.containerHeight;

    var minSize = 0.15;

    // Update row sizes (vertical)
    var newTopRow = state.initialRowSizes[1] + deltaRatioY;
    var newBottomRow = state.initialRowSizes[2] - deltaRatioY;

    if (newTopRow < minSize) { newTopRow = minSize; newBottomRow = 1 - minSize; }
    if (newBottomRow < minSize) { newBottomRow = minSize; newTopRow = 1 - minSize; }

    window.splitRowSizes[1] = newTopRow;
    window.splitRowSizes[2] = newBottomRow;

    // Update panel sizes in top row (horizontal)
    var newPane1 = state.initialPanelSizes[1] + deltaRatioX;
    var newPane2 = state.initialPanelSizes[2] - deltaRatioX;

    if (newPane1 < minSize) { newPane1 = minSize; newPane2 = 1 - minSize; }
    if (newPane2 < minSize) { newPane2 = minSize; newPane1 = 1 - minSize; }

    window.splitPanelSizes[1] = newPane1;
    window.splitPanelSizes[2] = newPane2;

    // Update panel sizes in bottom row (same horizontal ratio)
    var newPane3 = state.initialPanelSizes[3] + deltaRatioX;
    var newPane4 = state.initialPanelSizes[4] - deltaRatioX;

    if (newPane3 < minSize) { newPane3 = minSize; newPane4 = 1 - minSize; }
    if (newPane4 < minSize) { newPane4 = minSize; newPane3 = 1 - minSize; }

    window.splitPanelSizes[3] = newPane3;
    window.splitPanelSizes[4] = newPane4;

    applyPanelSizes();
    positionCenterHandle();
}

/**
 * End center resize
 */
function onCenterResizeEnd() {
    if (window.splitResizeState && window.splitResizeState.handle) {
        window.splitResizeState.handle.classList.remove('active');
    }
    var container = document.querySelector('.split-container');
    if (container) container.classList.remove('resizing');

    window.splitResizeState = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    document.removeEventListener('mousemove', onCenterResizeMove);
    document.removeEventListener('mouseup', onCenterResizeEnd);
    document.removeEventListener('touchmove', onCenterResizeMove);
    document.removeEventListener('touchend', onCenterResizeEnd);

    persistPanelSizes();
}

/**
 * Start vertical resize drag (between rows in 4-pane mode)
 */
function startVerticalResize(e) {
    e.preventDefault();

    const handle = e.currentTarget;
    const container = document.querySelector('.split-container');
    const containerRect = container.getBoundingClientRect();

    const startY = e.touches ? e.touches[0].clientY : e.clientY;

    window.splitResizeState = {
        type: 'vertical',
        handle: handle,
        startY: startY,
        containerHeight: containerRect.height,
        initialTopSize: window.splitRowSizes[1] || 0.5,
        initialBottomSize: window.splitRowSizes[2] || 0.5
    };

    handle.classList.add('active');
    container.classList.add('resizing');
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', onVerticalResizeMove);
    document.addEventListener('mouseup', onVerticalResizeEnd);
    document.addEventListener('touchmove', onVerticalResizeMove, {passive: false});
    document.addEventListener('touchend', onVerticalResizeEnd);
}

/**
 * Handle vertical resize movement
 */
function onVerticalResizeMove(e) {
    if (!window.splitResizeState || window.splitResizeState.type !== 'vertical') return;
    e.preventDefault();

    const state = window.splitResizeState;
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - state.startY;
    const deltaRatio = deltaY / state.containerHeight;

    let newTopSize = state.initialTopSize + deltaRatio;
    let newBottomSize = state.initialBottomSize - deltaRatio;

    const minSize = 0.15;
    if (newTopSize < minSize) {
        newTopSize = minSize;
        newBottomSize = 1 - minSize;
    }
    if (newBottomSize < minSize) {
        newBottomSize = minSize;
        newTopSize = 1 - minSize;
    }

    window.splitRowSizes[1] = newTopSize;
    window.splitRowSizes[2] = newBottomSize;

    // Apply to rows
    const rows = document.querySelectorAll('.split-row');
    if (rows.length === 2) {
        rows[0].style.flex = newTopSize;
        rows[1].style.flex = newBottomSize;
    }
}

/**
 * End vertical resize drag
 */
function onVerticalResizeEnd() {
    if (window.splitResizeState) {
        window.splitResizeState.handle.classList.remove('active');
        const container = document.querySelector('.split-container');
        if (container) container.classList.remove('resizing');
    }

    window.splitResizeState = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    document.removeEventListener('mousemove', onVerticalResizeMove);
    document.removeEventListener('mouseup', onVerticalResizeEnd);
    document.removeEventListener('touchmove', onVerticalResizeMove);
    document.removeEventListener('touchend', onVerticalResizeEnd);

    persistPanelSizes();
}

/**
 * Start horizontal resize drag
 */
function startHorizontalResize(e) {
    e.preventDefault();

    const handle = e.currentTarget;
    const leftPane = parseInt(handle.dataset.leftPane);
    const rightPane = parseInt(handle.dataset.rightPane);

    const container = document.querySelector('.split-container');
    const containerRect = container.getBoundingClientRect();

    const startX = e.touches ? e.touches[0].clientX : e.clientX;

    // Store ALL panel sizes at start of drag
    var initialSizes = {};
    for (var i = 1; i <= window.splitPaneCount; i++) {
        initialSizes[i] = window.splitPanelSizes[i] || (1 / window.splitPaneCount);
    }

    window.splitResizeState = {
        type: 'horizontal',
        handle: handle,
        leftPane: leftPane,
        rightPane: rightPane,
        startX: startX,
        containerWidth: containerRect.width,
        initialLeftSize: window.splitPanelSizes[leftPane] || 0.5,
        initialRightSize: window.splitPanelSizes[rightPane] || 0.5,
        initialSizes: initialSizes
    };

    handle.classList.add('active');
    container.classList.add('resizing');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
    document.addEventListener('touchmove', onResizeMove, {passive: false});
    document.addEventListener('touchend', onResizeEnd);
}

/**
 * Handle resize movement - for 4-pane mode, only affects panes in same row
 */
function onResizeMove(e) {
    if (!window.splitResizeState) return;
    if (window.splitResizeState.type === 'vertical') return; // Handled separately
    e.preventDefault();

    const state = window.splitResizeState;
    const paneCount = window.splitPaneCount;

    const currentX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = currentX - state.startX;
    const deltaRatio = deltaX / state.containerWidth;

    const leftPane = state.leftPane;
    const rightPane = state.rightPane;
    const minSize = 0.1;

    if (paneCount === 4) {
        // For 4-pane, only resize the two panes in the same row
        let newLeftSize = state.initialLeftSize + deltaRatio;
        let newRightSize = state.initialRightSize - deltaRatio;

        if (newLeftSize < minSize) {
            newLeftSize = minSize;
            newRightSize = 1 - minSize;
        }
        if (newRightSize < minSize) {
            newRightSize = minSize;
            newLeftSize = 1 - minSize;
        }

        window.splitPanelSizes[leftPane] = newLeftSize;
        window.splitPanelSizes[rightPane] = newRightSize;
    } else {
        // For 2/3 panes, redistribute proportionally
        let newLeftSize = state.initialLeftSize + deltaRatio;
        const maxSize = 1 - (minSize * (paneCount - 1));
        newLeftSize = Math.max(minSize, Math.min(maxSize, newLeftSize));

        const remainingSpace = 1 - newLeftSize;
        let otherPanesTotalInitial = 0;
        for (let i = 1; i <= paneCount; i++) {
            if (i !== leftPane) {
                otherPanesTotalInitial += (state.initialSizes ? state.initialSizes[i] : (1 / paneCount));
            }
        }

        window.splitPanelSizes[leftPane] = newLeftSize;

        for (let i = 1; i <= paneCount; i++) {
            if (i !== leftPane) {
                const initialSize = state.initialSizes ? state.initialSizes[i] : (1 / paneCount);
                const proportion = otherPanesTotalInitial > 0 ? (initialSize / otherPanesTotalInitial) : (1 / (paneCount - 1));
                window.splitPanelSizes[i] = Math.max(minSize, remainingSpace * proportion);
            }
        }
    }

    applyPanelSizes();
}

/**
 * End resize drag
 */
function onResizeEnd() {
    if (window.splitResizeState) {
        window.splitResizeState.handle.classList.remove('active');
        const container = document.querySelector('.split-container');
        if (container) container.classList.remove('resizing');
    }

    window.splitResizeState = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
    document.removeEventListener('touchmove', onResizeMove);
    document.removeEventListener('touchend', onResizeEnd);

    persistPanelSizes();
}

/**
 * Apply current panel sizes to DOM
 */
function applyPanelSizes() {
    const paneCount = window.splitPaneCount;

    for (let i = 1; i <= paneCount; i++) {
        const instance = document.querySelector('.split-instance[data-instance="' + i + '"]');
        if (instance && window.splitPanelSizes[i] !== undefined) {
            instance.style.flex = window.splitPanelSizes[i];
        }
    }

    // For 4-pane, also apply row sizes and reposition center handle
    if (paneCount === 4 && window.splitRowSizes) {
        const rows = document.querySelectorAll('.split-row');
        if (rows.length === 2) {
            rows[0].style.flex = window.splitRowSizes[1] || 0.5;
            rows[1].style.flex = window.splitRowSizes[2] || 0.5;
        }

    }
}

/**
 * Persist panel sizes to sessionStorage
 */
function persistPanelSizes() {
    try {
        sessionStorage.setItem('rhodeSplitPanelSizes', JSON.stringify(window.splitPanelSizes));
        if (window.splitRowSizes && Object.keys(window.splitRowSizes).length > 0) {
            sessionStorage.setItem('rhodeSplitRowSizes', JSON.stringify(window.splitRowSizes));
        }
    } catch (e) {
        console.warn('[SPLIT] Could not persist panel sizes:', e);
    }
}

/**
 * Restore panel sizes from sessionStorage
 */
function restorePanelSizes() {
    try {
        const saved = sessionStorage.getItem('rhodeSplitPanelSizes');
        if (saved) {
            const sizes = JSON.parse(saved);
            if (Object.keys(sizes).length === window.splitPaneCount) {
                window.splitPanelSizes = sizes;
                applyPanelSizes();
            }
        }
    } catch (e) {
        console.warn('[SPLIT] Could not restore panel sizes:', e);
    }
}

/**
 * Initialize click-to-expand on instance headers
 */
function initHeaderClickExpand() {
    const headers = document.querySelectorAll('.instance-header');

    headers.forEach((header, index) => {
        const paneNum = index + 1;
        if (paneNum > window.splitPaneCount) return;

        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);

        if (!newHeader.querySelector('.instance-expand-icon')) {
            const icon = document.createElement('span');
            icon.className = 'instance-expand-icon';
            icon.innerHTML = '\u2922';
            icon.title = 'Click to expand/collapse';
            newHeader.appendChild(icon);
        }

        newHeader.addEventListener('click', function(e) {
            if (e.target.closest('.instance-model')) return;
            if (e.target.closest('.pane-share-btn')) return;
            togglePanelExpand(paneNum);
        });

        newHeader.addEventListener('dblclick', function(e) {
            if (e.target.closest('.instance-model')) return;
            if (e.target.closest('.pane-share-btn')) return;
            expandPanelFull(paneNum);
        });
    });
}

/**
 * Toggle panel expansion (proportional resize)
 */
window.togglePanelExpand = function(paneNum) {
    const instance = document.querySelector('.split-instance[data-instance="' + paneNum + '"]');
    if (!instance) return;

    const paneCount = window.splitPaneCount;
    const isExpanded = instance.classList.contains('expanded');

    if (isExpanded) {
        // Restore equal sizes
        if (paneCount === 4 || paneCount === 6) {
            // Multi-row: panes are in ROWS, restore equal sizes within each row
            var perRowSize = (paneCount === 4) ? 0.5 : 0.333;
            for (let i = 1; i <= paneCount; i++) {
                window.splitPanelSizes[i] = perRowSize;
                const inst = document.querySelector('.split-instance[data-instance="' + i + '"]');
                if (inst) {
                    inst.classList.remove('expanded', 'shrunk');
                    inst.style.display = 'flex';
                    inst.style.flex = String(perRowSize);
                }
            }
            // Reset row sizes
            window.splitRowSizes = {1: 0.5, 2: 0.5};
            var rows = document.querySelectorAll('.split-row');
            if (rows.length === 2) {
                rows[0].style.display = 'flex';
                rows[0].style.flex = '0.5';
                rows[1].style.display = 'flex';
                rows[1].style.flex = '0.5';
            }
            // Restore vertical handle
            var vHandle = document.querySelector('.split-resize-handle.vertical');
            if (vHandle) vHandle.style.display = '';
            // Restore horizontal handles in rows
            document.querySelectorAll('.split-resize-handle:not(.vertical)').forEach(function(h) {
                h.style.display = '';
            });
        } else {
            // 2/3 panes: flat container
            const equalSize = 1 / paneCount;
            for (let i = 1; i <= paneCount; i++) {
                window.splitPanelSizes[i] = equalSize;
                const inst = document.querySelector('.split-instance[data-instance="' + i + '"]');
                if (inst) {
                    inst.classList.remove('expanded', 'shrunk');
                    inst.style.display = 'flex';
                }
            }
        }
    } else {
        if (paneCount === 4 || paneCount === 6) {
            // Multi-row: expand within row AND grow the row
            var rowBoundary = (paneCount === 4) ? 2 : 3;
            var expandedRow = (paneNum <= rowBoundary) ? 1 : 2;
            var otherRow = (expandedRow === 1) ? 2 : 1;
            window.splitRowSizes[expandedRow] = 0.7;
            window.splitRowSizes[otherRow] = 0.3;

            // Determine which panes are in each row
            var rowPanes, otherRowPanes;
            if (paneCount === 4) {
                rowPanes = (expandedRow === 1) ? [1, 2] : [3, 4];
                otherRowPanes = (expandedRow === 1) ? [3, 4] : [1, 2];
            } else {
                rowPanes = (expandedRow === 1) ? [1, 2, 3] : [4, 5, 6];
                otherRowPanes = (expandedRow === 1) ? [4, 5, 6] : [1, 2, 3];
            }
            var expandFlex = (rowPanes.length === 2) ? 0.7 : 0.5;
            var shrinkFlex = (rowPanes.length === 2) ? 0.3 : 0.25;
            for (var i = 0; i < rowPanes.length; i++) {
                var p = rowPanes[i];
                var inst = document.querySelector('.split-instance[data-instance="' + p + '"]');
                if (p === paneNum) {
                    window.splitPanelSizes[p] = expandFlex;
                    if (inst) inst.classList.add('expanded');
                } else {
                    window.splitPanelSizes[p] = shrinkFlex;
                    if (inst) inst.classList.remove('expanded');
                }
            }
            // Shrink the other row panes equally
            for (var j = 0; j < otherRowPanes.length; j++) {
                var q = otherRowPanes[j];
                window.splitPanelSizes[q] = 0.5;
                var inst2 = document.querySelector('.split-instance[data-instance="' + q + '"]');
                if (inst2) inst2.classList.remove('expanded');
            }
        } else {
            // 2/3 panes: simple horizontal expand
            var expandedSize = 0.6;
            var shrunkSize = 0.4 / (paneCount - 1);
            for (var k = 1; k <= paneCount; k++) {
                var inst3 = document.querySelector('.split-instance[data-instance="' + k + '"]');
                if (k === paneNum) {
                    window.splitPanelSizes[k] = expandedSize;
                    if (inst3) inst3.classList.add('expanded');
                } else {
                    window.splitPanelSizes[k] = shrunkSize;
                    if (inst3) inst3.classList.remove('expanded');
                }
            }
        }
    }

    applyPanelSizes();
    persistPanelSizes();
};

/**
 * Expand panel to 100% (full takeover)
 */
window.expandPanelFull = function(paneNum) {
    const paneCount = window.splitPaneCount;

    for (let i = 1; i <= paneCount; i++) {
        const inst = document.querySelector('.split-instance[data-instance="' + i + '"]');
        if (i === paneNum) {
            window.splitPanelSizes[i] = 1;
            if (inst) {
                inst.classList.add('expanded');
                inst.classList.remove('shrunk');
                inst.style.display = 'flex';
            }
        } else {
            window.splitPanelSizes[i] = 0;
            if (inst) {
                inst.classList.add('shrunk');
                inst.classList.remove('expanded');
                inst.style.display = 'none';
            }
        }
    }

    // For multi-row: expand the row containing the target, collapse the other
    if (paneCount === 4 || paneCount === 6) {
        var rowBoundary = (paneCount === 4) ? 2 : 3;
        var expandedRow = (paneNum <= rowBoundary) ? 1 : 2;
        window.splitRowSizes[expandedRow] = 1;
        window.splitRowSizes[(expandedRow === 1) ? 2 : 1] = 0;
        // Hide the collapsed row entirely
        var rows = document.querySelectorAll('.split-row');
        if (rows.length === 2) {
            rows[expandedRow - 1].style.display = 'flex';
            rows[(expandedRow === 1) ? 1 : 0].style.display = 'none';
        }
        // Hide the vertical resize handle
        var vHandle = document.querySelector('.split-resize-handle.vertical');
        if (vHandle) vHandle.style.display = 'none';
    }

    applyPanelSizes();
    showToast('Panel ' + paneNum + ' expanded. Double-click to restore.');
};

/**
 * Reset all panels to equal sizes
 */
window.resetPanelSizes = function() {
    const paneCount = window.splitPaneCount;
    // For 4-pane, use 0.5 (panes are in rows of 2). Otherwise 1/paneCount.
    const equalSize = (paneCount === 4) ? 0.5 : (paneCount === 6) ? 0.333 : (1 / paneCount);

    for (let i = 1; i <= paneCount; i++) {
        window.splitPanelSizes[i] = equalSize;
        const inst = document.querySelector('.split-instance[data-instance="' + i + '"]');
        if (inst) {
            inst.classList.remove('expanded', 'shrunk');
            inst.style.display = 'flex';
            inst.style.flex = equalSize;
        }
    }

    if (window.splitRowSizes) {
        window.splitRowSizes = {1: 0.5, 2: 0.5};
    }

    // Restore rows, handles, and instance visibility
    var rows = document.querySelectorAll('.split-row');
    rows.forEach(function(row) {
        row.style.display = 'flex';
        row.style.flex = '0.5';
    });
    var vHandle = document.querySelector('.split-resize-handle.vertical');
    if (vHandle) vHandle.style.display = '';
    document.querySelectorAll('.split-resize-handle:not(.vertical)').forEach(function(h) {
        h.style.display = '';
    });

    applyPanelSizes();
    persistPanelSizes();
    showToast('Panel sizes reset');
};


function connectPane(paneNum) {
    window.splitActive = true;
    // Use hardcoded URL for webview/desktop app compatibility
    const wsUrl = 'wss://rhodesagi.com/ws';

    console.log('[SPLIT] Connecting pane', paneNum);

    const paneWs = new WebSocket(wsUrl);
    window.paneConnections[paneNum] = paneWs;

    const statusEl = document.querySelector('.instance-status[data-instance="' + paneNum + '"]');
    const chatEl = document.getElementById('split-chat-' + paneNum);

    paneWs.onopen = function() {
        console.log('[SPLIT] Pane', paneNum, 'connected');
        if (statusEl) {
            statusEl.style.color = 'var(--green)';
            statusEl.textContent = '●';
        }

        // Auth with token - try multiple sources (rhodesStorage, localStorage, window globals)
        let userToken = '';
        try {
            userToken = (typeof rhodesStorage !== 'undefined' && rhodesStorage.getItem('rhodes_user_token')) ||
                        (window.rhodesStorage && window.rhodesStorage.getItem('rhodes_user_token')) ||
                        localStorage.getItem('rhodes_user_token') ||
                        window.__RHODES_DESKTOP_TOKEN__ ||
                        '';
        } catch(e) {
            console.warn('[SPLIT] Token lookup error:', e);
        }
        console.log('[SPLIT] Pane', paneNum, 'auth token length:', userToken ? userToken.length : 0);

        const clientId = 'split-instance-' + paneNum + '-' + Date.now();
        // S56 FIX: Use live session ID for reconnect, not just initial _splitResumeIds
        const resumeId = (window.paneSessionIds && window.paneSessionIds[paneNum]) ||
                         (window._splitResumeIds && window._splitResumeIds[paneNum]) || null;
        const tabId = resumeId ? resumeId.replace(/^user_\d+_/, '') : ('split-' + paneNum + '-' + Math.random().toString(36).substr(2, 9));
        console.log('[SPLIT] Pane', paneNum, 'connecting with resumeId:', resumeId, 'tabId:', tabId);
        paneWs.send(JSON.stringify({
            msg_type: 'auth_request',
            payload: {
                client_id: clientId,
                tab_id: tabId,
                user_token: userToken,
                resume_session: resumeId || false,
                multisandbox: true,
                multisandbox_pane: paneNum
            }
        }));
    };
    
    paneWs.onmessage = function(event) {
        try {
            const msg = JSON.parse(event.data);
            handlePaneMessage(paneNum, msg);
        } catch (e) {
            console.error('[SPLIT] Parse error pane', paneNum, e);
        }
    };
    
    paneWs.onclose = function() {
        console.log('[SPLIT] Pane', paneNum, 'disconnected');
        if (statusEl) {
            statusEl.style.color = 'var(--dim)';
            statusEl.textContent = '○';
        }
        // Auto-reconnect with backoff (only if split mode is still active)
        if (window.splitActive !== false) {
            var delay = (window._paneReconnectDelay || {});
            delay[paneNum] = Math.min((delay[paneNum] || 1000) * 1.5, 15000);
            window._paneReconnectDelay = delay;
            console.log('[SPLIT] Pane', paneNum, 'reconnecting in', delay[paneNum], 'ms');
            setTimeout(function() {
                if (window.splitActive !== false) {
                    connectPane(paneNum);
                    // Reset backoff on successful reconnect
                    if (window._paneReconnectDelay) window._paneReconnectDelay[paneNum] = 1000;
                }
            }, delay[paneNum]);
        }
    };
    
    paneWs.onerror = function(err) {
        console.error('[SPLIT] Pane', paneNum, 'error', err);
    };
}

function handlePaneLocalReadyMessage(paneNum) {
    console.log('[SPLIT] Pane', paneNum, 'local execution ready');
}

function handlePaneAutoLoginTokenMessage(paneNum, msg) {
    console.log('[SPLIT] Pane', paneNum, 'received auto_login_token');
    if (!msg.token) return;
    const paneWs = window.paneConnections[paneNum];
    if (!paneWs || paneWs.readyState !== WebSocket.OPEN) return;

    const clientId = 'split-instance-' + paneNum + '-' + Date.now();
    // S56 FIX: Use live session ID for auto-login reconnect too
    const resumeId = (window.paneSessionIds && window.paneSessionIds[paneNum]) || null;
    const tabId = resumeId ? resumeId.replace(/^user_\d+_/, '') : ('split-' + paneNum + '-' + Math.random().toString(36).substr(2, 9));
    console.log('[SPLIT] Pane', paneNum, 'auto-login with resumeId:', resumeId);
    paneWs.send(JSON.stringify({
        msg_type: 'auth_request',
        payload: {
            client_id: clientId,
            tab_id: tabId,
            user_token: msg.token,
            resume_session: resumeId || false,
            multisandbox: window._multisandboxMode || false,
            multisandbox_pane: window._multisandboxMode ? paneNum : undefined
        }
    }));
}

function handlePaneSessionRotatedMessage(paneNum, msg) {
    const newSessionId = msg.payload?.new_session_id || msg.payload?.rhodes_id;
    const model = msg.payload?.model || 'unknown';
    window.paneSessionIds[paneNum] = newSessionId;
    console.log('[SPLIT] Instance', paneNum, 'session rotated to:', newSessionId, 'model:', model);
    addInstanceMessage(paneNum, 'system', 'Model switched to ' + model);
}

function handlePaneAuthResponseMessage(paneNum, msg) {
    window.paneSessionIds[paneNum] = msg.payload?.rhodes_id || msg.payload?.session_id || null;
    console.log('[SPLIT] Instance', paneNum, 'session:', window.paneSessionIds[paneNum]);

    // Restore conversation history from resumed session
    var conversation = msg.payload?.conversation || [];
    if (conversation.length > 0) {
        console.log('[SPLIT] Pane', paneNum, 'restoring', conversation.length, 'messages');
        for (var ci = 0; ci < conversation.length; ci++) {
            var cm = conversation[ci];
            if (cm.role === 'tool') continue;
            if (cm.role === 'assistant' && (!cm.content || !cm.content.trim())) continue;
            var ctype = cm.role === 'user' ? 'user' : 'ai';
            addInstanceMessage(paneNum, ctype, cm.content || '');
        }
        addInstanceMessage(paneNum, 'system', 'Session resumed (' + conversation.length + ' messages restored)');
    } else {
        addInstanceMessage(paneNum, 'system', 'Instance ' + paneNum + ' connected. Session: ' + (window.paneSessionIds[paneNum] || 'new'));
    }
    if (window.flashPaneFace) window.flashPaneFace(paneNum);
}

function handlePaneChunkMessage(paneNum, msg, chatEl) {
    if (window.hideInstanceLoading) window.hideInstanceLoading(paneNum);
    const chunk = msg.payload?.content || '';
    if (!chunk) return;

    let streamEl = chatEl.querySelector('.instance-streaming-' + paneNum);
    if (!streamEl) {
        streamEl = document.createElement('div');
        streamEl.className = 'instance-msg instance-ai instance-streaming-' + paneNum;
        streamEl.style.cssText = 'color:var(--text);margin:8px 0;padding:8px;background:rgba(0,255,65,0.05);border-left:2px solid var(--green);white-space:pre-wrap;';
        chatEl.appendChild(streamEl);
    }
    streamEl.textContent += chunk;
    chatEl.scrollTop = chatEl.scrollHeight;
}

function handlePaneInterruptAckMessage(paneNum, msg, chatEl) {
    if (window.hideInstanceLoading) window.hideInstanceLoading(paneNum);
    const streamEl = chatEl.querySelector('.instance-streaming-' + paneNum);
    if (streamEl) {
        streamEl.classList.remove('instance-streaming-' + paneNum);
    }

    const interruptDiv = document.createElement('div');
    interruptDiv.style.cssText = 'color:var(--yellow);font-style:italic;margin:4px 0;font-size:0.9em;';
    interruptDiv.textContent = '[Interrupted]';
    chatEl.appendChild(interruptDiv);
    chatEl.scrollTop = chatEl.scrollHeight;
    console.log('[SPLIT] Instance', paneNum, 'interrupted');
}

function handlePaneAiMessage(paneNum, msg, chatEl) {
    if (window.hideInstanceLoading) window.hideInstanceLoading(paneNum);

    let streamEl = chatEl.querySelector('.instance-streaming-' + paneNum);
    const responseTimeLabel = getWallToWallLabel(msg.payload || {}, 0);
    let content = msg.payload?.content || '';

    const wasFromShare = window.paneLastWasShare && window.paneLastWasShare[paneNum];
    window.paneLastWasShare = window.paneLastWasShare || {};
    window.paneLastWasShare[paneNum] = false;

    window.paneShareCount = window.paneShareCount || {};
    const sharesThisRound = window.paneShareCount[paneNum] || 0;
    const shareMatch = (sharesThisRound < 1) ? content.match(/\[SHARE_TO_ALL\]:\s*(.+?)(?=\n\n|\[SHARE_TO_ALL\]|\[PRIVATE_TO:|$)/s) : null;
    if (shareMatch) {
        const sharedContent = shareMatch[1].trim();
        const instanceNames = {1: 'Alpha', 2: 'Beta', 3: 'Gamma', 4: 'Delta'};
        const senderName = instanceNames[paneNum] || ('Instance ' + paneNum);

        for (let i = 1; i <= window.splitPaneCount; i++) {
            if (i !== paneNum) {
                const otherWs = window.paneConnections[i];
                if (otherWs && otherWs.readyState === WebSocket.OPEN) {
                    const sharedMsg = 'rhodesia-system-message: [Shared from ' + senderName + ']: ' + sharedContent;
                    otherWs.send(JSON.stringify({ msg_type: 'user_message', payload: { content: sharedMsg } }));
                    window.paneLastWasShare = window.paneLastWasShare || {};
                    window.paneLastWasShare[i] = true;
                }
            }
            window.paneShareCount[paneNum] = (window.paneShareCount[paneNum] || 0) + 1;
        }

        for (let i = 1; i <= window.splitPaneCount; i++) {
            if (i !== paneNum) {
                const otherChat = document.getElementById('split-chat-' + i);
                if (otherChat) {
                    const sharedDiv = document.createElement('div');
                    sharedDiv.style.cssText = 'color:var(--magenta);margin:8px 0;padding:8px;border-left:3px solid var(--magenta);background:rgba(255,0,255,0.05);';
                    sharedDiv.innerHTML = '<strong>[From ' + senderName + ']:</strong> ' + sharedContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    otherChat.appendChild(sharedDiv);
                    otherChat.scrollTop = otherChat.scrollHeight;
                }
            }
        }
        showToast(senderName + ' shared message to all');
        content = content.replace(/\[SHARE_TO_ALL\]:\s*.+?(?=\n\n|\[SHARE_TO_ALL\]|\[PRIVATE_TO:|$)/gs, '[Shared to all instances]');

        const replyMatch = (sharesThisRound < 1) ? content.match(/\[REPLY_TO:([A-Z]\d+)_(PUBLIC|PRIVATE)\]:\s*(.+?)(?=\n\n|\[REPLY_TO:|\[SHARE_TO_ALL\]|$)/s) : null;
        if (replyMatch) {
            const targetMsgId = replyMatch[1];
            const replyType = replyMatch[2];
            const replyContent = replyMatch[3].trim();
            const instanceNames = {1: 'Alpha', 2: 'Beta', 3: 'Gamma', 4: 'Delta'};
            const senderName = instanceNames[paneNum] || ('Instance ' + paneNum);
            const senderLetter = window.paneLetters[paneNum];

            window.paneShareCount[paneNum] = (window.paneShareCount[paneNum] || 0) + 1;

            if (replyType === 'PUBLIC') {
                for (let i = 1; i <= window.splitPaneCount; i++) {
                    if (i !== paneNum) {
                        const otherWs = window.paneConnections[i];
                        if (otherWs && otherWs.readyState === WebSocket.OPEN) {
                            const replyMsg = 'rhodesia-system-message: [' + senderName + ' replying to ' + targetMsgId + ']: ' + replyContent;
                            otherWs.send(JSON.stringify({ msg_type: 'user_message', payload: { content: replyMsg } }));
                        }
                        const otherChat = document.getElementById('split-chat-' + i);
                        if (otherChat) {
                            const replyDiv = document.createElement('div');
                            replyDiv.style.cssText = 'color:var(--cyan);margin:8px 0 8px 20px;padding:6px;border-left:2px solid var(--cyan);background:rgba(0,191,255,0.05);';
                            replyDiv.innerHTML = '<strong>[' + senderLetter + ' → ' + targetMsgId + ']:</strong> ' + replyContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                            replyDiv.setAttribute('data-reply-to', targetMsgId);
                            otherChat.appendChild(replyDiv);
                            otherChat.scrollTop = otherChat.scrollHeight;
                        }
                    }
                }
                const ownReplyDiv = document.createElement('div');
                ownReplyDiv.style.cssText = 'color:var(--cyan);margin:8px 0 8px 20px;padding:6px;border-left:2px solid var(--cyan);background:rgba(0,191,255,0.05);';
                ownReplyDiv.innerHTML = '<strong>[→ ' + targetMsgId + ' (public)]:</strong> ' + replyContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                ownReplyDiv.setAttribute('data-reply-to', targetMsgId);
                chatEl.appendChild(ownReplyDiv);
            } else if (replyType === 'PRIVATE') {
                const targetLetter = targetMsgId.charAt(0);
                const targetPane = {A: 1, B: 2, G: 3, D: 4}[targetLetter];
                if (targetPane) {
                    const targetWs = window.paneConnections[targetPane];
                    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                        const privateMsg = 'rhodesia-system-message: [Private from ' + senderName + ' re: ' + targetMsgId + ']: ' + replyContent;
                        targetWs.send(JSON.stringify({ msg_type: 'user_message', payload: { content: privateMsg } }));
                    }
                    const targetChat = document.getElementById('split-chat-' + targetPane);
                    if (targetChat) {
                        const privateDiv = document.createElement('div');
                        privateDiv.style.cssText = 'color:var(--yellow);margin:8px 0 8px 20px;padding:6px;border-left:2px solid var(--yellow);background:rgba(255,255,0,0.05);';
                        privateDiv.innerHTML = '<strong>[Private from ' + senderLetter + ' → ' + targetMsgId + ']:</strong> ' + replyContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        privateDiv.setAttribute('data-reply-to', targetMsgId);
                        targetChat.appendChild(privateDiv);
                        targetChat.scrollTop = targetChat.scrollHeight;
                    }
                    const confirmDiv = document.createElement('div');
                    confirmDiv.style.cssText = 'color:var(--dim);margin:4px 0 4px 20px;font-size:11px;font-style:italic;';
                    confirmDiv.textContent = '[Private reply to ' + targetMsgId + ' sent]';
                    chatEl.appendChild(confirmDiv);
                }
            }
            content = content.replace(/\[REPLY_TO:[A-Z]\d+_(PUBLIC|PRIVATE)\]:\s*.+?(?=\n\n|\[REPLY_TO:|\[SHARE_TO_ALL\]|$)/gs, '');
        }
    }

    const privateMatches = content.matchAll(/\[PRIVATE_TO:(Alpha|Beta|Gamma|Delta|1|2|3|4)\]:\s*(.+?)(?=\n\n|\[PRIVATE_TO:|\[SHARE_TO_ALL\]|$)/gis);
    for (const privMatch of privateMatches) {
        const targetName = privMatch[1];
        const privateContent = privMatch[2].trim();
        const instanceNames = {1: 'Alpha', 2: 'Beta', 3: 'Gamma', 4: 'Delta', 'alpha': 1, 'beta': 2, 'gamma': 3, 'delta': 4};
        const senderName2 = instanceNames[paneNum] || ('Instance ' + paneNum);

        let targetPane = parseInt(targetName);
        if (isNaN(targetPane)) {
            targetPane = instanceNames[targetName.toLowerCase()];
        }

        if (targetPane && targetPane !== paneNum && targetPane <= window.splitPaneCount) {
            const targetWs = window.paneConnections[targetPane];
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                const privateMsg = 'rhodesia-system-message: [Private from ' + senderName2 + ']: ' + privateContent;
                targetWs.send(JSON.stringify({ msg_type: 'user_message', payload: { content: privateMsg } }));
            }
            const targetChat = document.getElementById('split-chat-' + targetPane);
            if (targetChat) {
                const privDiv = document.createElement('div');
                privDiv.style.cssText = 'color:var(--cyan);margin:8px 0;padding:8px;border-left:3px solid var(--cyan);background:rgba(0,255,213,0.05);';
                privDiv.innerHTML = '<strong>[Private from ' + senderName2 + ']:</strong> ' + privateContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                targetChat.appendChild(privDiv);
                targetChat.scrollTop = targetChat.scrollHeight;
            }
            showToast(senderName2 + ' -> ' + (instanceNames[targetPane] || targetPane) + ' (private)');
        }
    }
    content = content.replace(/\[PRIVATE_TO:(Alpha|Beta|Gamma|Delta|1|2|3|4)\]:\s*.+?(?=\n\n|\[PRIVATE_TO:|\[SHARE_TO_ALL\]|$)/gis, '[Private message sent]');

    if (streamEl) {
        streamEl.classList.remove('instance-streaming-' + paneNum);
        // If final ai_message has content, use IT instead of stale streaming text
        if (content && content.trim()) {
            if (window.marked) {
                streamEl.innerHTML = window.marked.parse(content);
            } else {
                streamEl.textContent = content;
            }
        } else if (window.marked && streamEl.textContent) {
            streamEl.innerHTML = window.marked.parse(streamEl.textContent);
        }
        appendInstanceResponseTime(streamEl, responseTimeLabel);
    } else if (content && content.trim()) {
        addInstanceMessage(paneNum, 'ai', content, responseTimeLabel);
    }
}

function handlePaneToolEvent(paneNum, msg) {
    const toolName = msg.payload?.name || msg.payload?.tool || 'tool';
    if (window.RHODES_CONFIG && window.RHODES_CONFIG.isHiddenTool(toolName)) return;

    const args = msg.payload?.arguments || msg.payload?.args || {};
    const result = msg.payload?.result || null;
    const status = msg.payload?.status || (result ? 'complete' : 'running');
    const round = msg.payload?.round || 0;

    let shortArg = '';
    if (toolName === 'web_fetch' && args.url) {
        shortArg = args.url.substring(0, 40) + (args.url.length > 40 ? '...' : '');
    } else if (toolName === 'shell_exec' && args.command) {
        shortArg = args.command.substring(0, 40) + (args.command.length > 40 ? '...' : '');
    } else if (args.file_path || args.path) {
        shortArg = (args.file_path || args.path);
    } else if (args && Object.keys(args).length > 0) {
        const firstArg = Object.values(args)[0];
        if (typeof firstArg === 'string') shortArg = firstArg.substring(0, 40);
    }

    const chatEl = document.getElementById('split-chat-' + paneNum);
    if (!chatEl) return;

    const escHtml = (t) => { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; };
    const isComplete = (status === 'complete');
    const indicator = isComplete ? '\u25cf' : '\u25cb';
    const dotLabel = toolName + (shortArg ? ': ' + shortArg : '');
    const now = new Date();
    const ts = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0');

    // Build details
    const fullArgs = JSON.stringify(args, null, 2);
    let detailsHtml = '<pre style="color:var(--cyan);white-space:pre-wrap;font-size:10px;">' + escHtml(fullArgs) + '</pre>';
    if (result) {
        const resultStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        const trunc = resultStr.length > 500 ? resultStr.substring(0, 500) + '...' : resultStr;
        detailsHtml += '<div style="margin-top:4px;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px;"><span style="color:var(--green);font-size:10px;">Result:</span><pre style="white-space:pre-wrap;color:var(--text);font-size:10px;max-height:100px;overflow:auto;">' + escHtml(trunc) + '</pre></div>';
    }

    // Duration
    if (!window._paneToolTimers) window._paneToolTimers = new Map();
    const timerKey = paneNum + '|' + toolName + '|' + round + '|' + shortArg.slice(0,30);
    let durationLabel = '';
    if (!isComplete) {
        if (!window._paneToolTimers.has(timerKey)) window._paneToolTimers.set(timerKey, Date.now());
    } else {
        const startTime = window._paneToolTimers.get(timerKey);
        const serverDur = msg.payload?.duration_ms;
        const ms = (serverDur && serverDur > 0) ? serverDur : (startTime ? Date.now() - startTime : 0);
        if (ms > 0) {
            durationLabel = ms < 1000 ? ms + 'ms' : (ms / 1000).toFixed(1) + 's';
        }
    }

    // Idempotent rendering
    if (!window._paneToolItems) window._paneToolItems = new Map();
    if (!window._paneToolCounters) window._paneToolCounters = new Map();
    const baseKey = paneNum + '|' + toolName + '|' + round;
    let toolKey;
    if (!isComplete) {
        // Dedup: check for existing running entry (streaming + batch send duplicate starting events)
        toolKey = null;
        for (const [k, v] of window._paneToolItems) {
            if (k.startsWith(baseKey + '|') && v.el) {
                const dotEl = v.el.querySelector('.tool-dot');
                if (dotEl && dotEl.getAttribute('data-status') !== 'complete') {
                    toolKey = k;
                    break;
                }
            }
        }
        if (!toolKey) {
            const count = window._paneToolCounters.get(baseKey) || 0;
            toolKey = baseKey + '|' + count;
            window._paneToolCounters.set(baseKey, count + 1);
        }
    } else {
        // Find oldest running entry with same baseKey
        toolKey = null;
        for (const [k, v] of window._paneToolItems) {
            if (k.startsWith(baseKey + '|') && v.el && v.el.isConnected) {
                const dotEl = v.el.querySelector('.tool-dot');
                if (dotEl && dotEl.getAttribute('data-status') !== 'complete') {
                    toolKey = k;
                    break;
                }
            }
        }
        if (!toolKey) {
            const count = window._paneToolCounters.get(baseKey) || 0;
            toolKey = baseKey + '|' + count;
            window._paneToolCounters.set(baseKey, count + 1);
        }
    }
    const existing = window._paneToolItems.get(toolKey);

    if (existing && existing.el && existing.el.isConnected) {
        existing.el.querySelector('.tool-dot').setAttribute('data-status', status);
        existing.el.querySelector('.tool-dot').innerHTML =
            '<span class="tool-dot-indicator">' + indicator + '</span>' +
            '<span class="tool-dot-name">' + escHtml(dotLabel) + '</span>' +
            (durationLabel ? '<span class="tool-dot-duration">' + durationLabel + '</span>' : '');
        existing.el.querySelector('.tool-dot-details').innerHTML = detailsHtml;
    } else {
        const wrapper = document.createElement('div');
        wrapper.className = 'tool-dot-wrapper';
        const dot = document.createElement('span');
        dot.className = 'tool-dot';
        dot.setAttribute('data-status', status);
        dot.onclick = function() { wrapper.classList.toggle('tool-dot-expanded'); };
        dot.innerHTML = '<span class="tool-dot-indicator">' + indicator + '</span>' +
            '<span class="tool-dot-name">' + escHtml(dotLabel) + '</span>' +
            (durationLabel ? '<span class="tool-dot-duration">' + durationLabel + '</span>' : '');
        const det = document.createElement('div');
        det.className = 'tool-dot-details';
        det.innerHTML = detailsHtml;
        wrapper.appendChild(dot);
        wrapper.appendChild(det);
        chatEl.appendChild(wrapper);
        window._paneToolItems.set(toolKey, { el: wrapper });
    }
    chatEl.scrollTop = chatEl.scrollHeight;
}

function handlePaneThinkingMessage(paneNum, msg, chatEl) {
    const thinkEl = document.createElement('div');
    thinkEl.className = 'instance-thinking';
    thinkEl.style.cssText = 'color:var(--dim);font-style:italic;margin:4px 0;';
    thinkEl.textContent = '... thinking ...';
    chatEl.appendChild(thinkEl);
    chatEl.scrollTop = chatEl.scrollHeight;
    setTimeout(() => thinkEl.remove(), 3000);
}

function handlePaneErrorMessage(paneNum, msg) {
    addInstanceMessage(paneNum, 'error', msg.payload?.message || 'Error occurred');
}

function handlePaneReasoningChunkMessage(paneNum, msg, chatEl) {
    // Reasoning chunks from content gate - display in collapsible block
    var chunk = (msg.payload && (msg.payload.content || msg.payload.text)) || '';
    if (!chunk) return;
    var reasonEl = chatEl.querySelector('.instance-reasoning-' + paneNum);
    if (!reasonEl) {
        reasonEl = document.createElement('details');
        reasonEl.className = 'instance-reasoning-' + paneNum;
        reasonEl.style.cssText = 'color:var(--dim);margin:4px 0;font-size:0.85em;';
        var summary = document.createElement('summary');
        summary.style.cssText = 'cursor:pointer;opacity:0.6;';
        summary.textContent = 'Reasoning...';
        reasonEl.appendChild(summary);
        var pre = document.createElement('pre');
        pre.style.cssText = 'white-space:pre-wrap;color:var(--dim);font-size:0.8em;max-height:200px;overflow-y:auto;';
        reasonEl.appendChild(pre);
        chatEl.appendChild(reasonEl);
    }
    var pre = reasonEl.querySelector('pre');
    if (pre) pre.textContent += chunk;
    chatEl.scrollTop = chatEl.scrollHeight;
}

const paneMessageHandlers = {
    local_ready: handlePaneLocalReadyMessage,
    auto_login_token: handlePaneAutoLoginTokenMessage,
    session_rotated: handlePaneSessionRotatedMessage,
    auth_response: handlePaneAuthResponseMessage,
    ai_message_chunk: handlePaneChunkMessage,
    reasoning_chunk: handlePaneReasoningChunkMessage,
    interrupt_ack: handlePaneInterruptAckMessage,
    ai_message: handlePaneAiMessage,
    tool_call: handlePaneToolEvent,
    tool_result: handlePaneToolEvent,
    thinking: handlePaneThinkingMessage,
    error: handlePaneErrorMessage
};

function handlePaneMessage(paneNum, msg) {
    const chatEl = document.getElementById('split-chat-' + paneNum);
    if (!chatEl) return;

    const msgType = msg.msg_type || msg.type;
    const handler = paneMessageHandlers[msgType];
    if (!handler) return;
    handler(paneNum, msg, chatEl);
}

function appendInstanceResponseTime(msgEl, responseTimeLabel) {
    if (!msgEl || !responseTimeLabel) return;
    if (msgEl.querySelector('.msg-response-time')) return;
    msgEl.style.position = 'relative';
    msgEl.style.paddingBottom = '24px';
    const timeEl = document.createElement('span');
    timeEl.className = 'msg-response-time';
    timeEl.textContent = '(' + responseTimeLabel + ')';
    msgEl.appendChild(timeEl);
}

function addInstanceMessage(paneNum, type, content, responseTimeLabel = '') {
    const chatEl = document.getElementById('split-chat-' + paneNum);
    if (!chatEl) return;

    const msgEl = document.createElement('div');
    msgEl.className = 'instance-msg instance-' + type;

    if (type === 'user') {
        msgEl.style.cssText = 'color:var(--cyan);margin:8px 0;';
        msgEl.textContent = '> ' + content;
    } else if (type === 'ai') {
        msgEl.style.cssText = 'color:var(--text);margin:8px 0;padding:8px;background:rgba(0,255,65,0.05);border-left:2px solid var(--green);';

        // Parse and render any contact cards or site previews first
        var textContent = content;
        if (typeof parseAndRenderCards === 'function') {
            textContent = parseAndRenderCards(paneNum, content);
        }

        if (textContent) {
            if (window.marked) {
                msgEl.innerHTML = window.marked.parse(textContent);
            } else {
                var processed = textContent;
                processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
                    '<img src="$2" alt="$1" style="max-width:100%;max-height:300px;border-radius:4px;margin:8px 0;cursor:pointer;display:block;">');
                msgEl.innerHTML = processed.replace(/\n/g, '<br>');
            }
            // Linkify URLs not already in href
            var html = msgEl.innerHTML;
            html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;">$1</a>');
            html = html.replace(/(?<!="|'>)(https?:\/\/[^\s<>"'\)\]]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;">$1</a>');
            html = html.replace(/(^|[\s>])(rhodesagi\.com\/[^\s<>"'\)\]]*)/g, '$1<a href="https://$2" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;">$2</a>');
            html = html.replace(/(^|[\s>])(rhodesagi\.com)(?=[\s<,.]|$)/g, '$1<a href="https://$2" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;">$2</a>');
            msgEl.innerHTML = html;
        }

        setTimeout(function() {
            msgEl.querySelectorAll('img').forEach(function(img) {
                img.style.maxWidth = '100%';
                img.style.maxHeight = '300px';
                img.style.borderRadius = '4px';
                img.style.margin = '8px 0';
                img.style.cursor = 'pointer';
                img.style.display = 'block';
                img.onclick = function() { window.open(img.src, '_blank'); };
                img.onerror = function() { img.style.display = 'none'; };
            });
        }, 0);
        appendInstanceResponseTime(msgEl, responseTimeLabel);

    } else if (type === 'system') {
        msgEl.style.cssText = 'color:var(--dim);font-size:11px;margin:4px 0;';
        msgEl.textContent = content;
    } else if (type === 'tool') {
        msgEl.style.cssText = 'color:var(--magenta);font-size:11px;margin:2px 0;';
        msgEl.textContent = content;
    } else if (type === 'error') {
        msgEl.style.cssText = 'color:var(--red, #ff4444);margin:8px 0;';
        msgEl.textContent = content;
    } else if (type === 'image') {
        msgEl.style.cssText = 'margin:8px 0;';
        var img = document.createElement('img');
        img.src = content;
        img.style.cssText = 'max-width:100%;max-height:300px;border-radius:4px;cursor:pointer;';
        img.onclick = function() { window.open(content, '_blank'); };
        img.onerror = function() { msgEl.innerHTML = '<span style="color:var(--red);">Failed to load image</span>'; };
        msgEl.appendChild(img);
    }

    chatEl.appendChild(msgEl);
    chatEl.scrollTop = chatEl.scrollHeight;
}

function addInstanceToolMessage(paneNum, header, args, result) {
    const chatEl = document.getElementById('split-chat-' + paneNum);
    if (!chatEl) return;
    
    const toolEl = document.createElement('div');
    toolEl.className = 'instance-tool-expandable';
    toolEl.style.cssText = 'margin:4px 0;';
    
    const headerEl = document.createElement('div');
    headerEl.className = 'instance-tool-header';
    headerEl.style.cssText = 'color:var(--magenta);font-size:11px;cursor:pointer;';
    headerEl.textContent = header;
    headerEl.onclick = function() { toolEl.classList.toggle('expanded'); };
    
    const detailsEl = document.createElement('div');
    detailsEl.className = 'instance-tool-details';
    detailsEl.style.cssText = 'display:none;margin:4px 0 4px 12px;padding:8px;background:rgba(0,0,0,0.3);border-radius:4px;font-size:10px;max-height:200px;overflow:auto;';
    
    const escHtml = (t) => { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; };
    let detailsHtml = '<div style="color:var(--cyan);">Args:</div><pre style="color:var(--text);white-space:pre-wrap;margin:4px 0;">' + escHtml(args) + '</pre>';
    if (result) {
        detailsHtml += '<div style="color:var(--green);margin-top:8px;">Result:</div><pre style="color:var(--text);white-space:pre-wrap;margin:4px 0;max-height:100px;overflow:auto;">' + escHtml(result.substring(0, 500)) + (result.length > 500 ? '...' : '') + '</pre>';
    }
    detailsEl.innerHTML = detailsHtml;
    
    toolEl.appendChild(headerEl);
    toolEl.appendChild(detailsEl);
    
    if (!document.getElementById('instance-tool-style')) {
        const style = document.createElement('style');
        style.id = 'instance-tool-style';
        style.textContent = '.instance-tool-expandable.expanded .instance-tool-details { display: block !important; }';
        document.head.appendChild(style);
    }
    
    chatEl.appendChild(toolEl);
    chatEl.scrollTop = chatEl.scrollHeight;
}

window.sendToInstance = function(paneNum, text) {
    if (!text || !text.trim()) return;
    
    // Reset share counter for all panes when user sends new message
    window.paneShareCount = {};

    // Handle model flags: --alpha, --beta, --ada, --delta, --system
    let processedText = text.trim();
    const modelFlags = {
        '--alpha': '/rhodes-alpha',
        '--beta': '/rhodes-beta',
        '--ada': '/rhodes-ada',
        '--delta': '/rhodes-delta'
    };

        const paneWs = window.paneConnections[paneNum];

    // Handle model switch slash commands (pattern-based for future compatibility)
    // Matches: /a2.2, /b2.2, /c2.2, /d2.2, /rhodes-alpha-format-2, /delta-format-3, /alpha, /beta, etc.
    const lowerText = processedText.toLowerCase();
    const modelSwitchPattern = /^\/(?:rhodes-|rhodesia-)?(?:alpha|beta|ada|delta|opus|sonnet|haiku|deepseek)(?:-format-?\d+(?:\.\d+)?)?$|^\/(?:r|ds|p)\d+\.\d+[abcdef](?:[012p]|21)?(?:\.c[abcdef][012]?)?$|^\/[abcd]\d+(?:\.\d+)?$/;
    if (modelSwitchPattern.test(lowerText)) {
        if (!paneWs || paneWs.readyState !== WebSocket.OPEN) {
            showToast('Pane ' + paneNum + ' not connected');
            return;
        }
        paneWs.send(JSON.stringify({ msg_type: 'user_message', payload: { content: processedText } }));
        const inputEl = document.getElementById('instance-' + paneNum + '-input');
        if (inputEl) inputEl.value = '';
        // Extract friendly model name from command
        const cmdName = lowerText.substring(1).replace('rhodes-', '').toUpperCase();
        showToast('Pane ' + paneNum + ': ' + cmdName);
        return;
    }

    // Handle --system flag for single pane
    if (processedText.toLowerCase().startsWith('--system ')) {
        if (!paneWs || paneWs.readyState !== WebSocket.OPEN) {
            showToast('Pane ' + paneNum + ' not connected');
            return;
        }
        const instruction = processedText.substring(9).trim();
        if (instruction) {
            const systemMsg = 'rhodesia-system-message: ' + instruction;
            paneWs.send(JSON.stringify({ msg_type: 'user_message', payload: { content: systemMsg, split_context: true } }));
            const chatEl = document.getElementById('split-chat-' + paneNum);
            if (chatEl) {
                const sysDiv = document.createElement('div');
                sysDiv.style.color = 'var(--yellow, #ff0)';
                sysDiv.style.marginBottom = '5px';
                sysDiv.style.fontStyle = 'italic';
                sysDiv.textContent = '[SYS] ' + instruction;
                chatEl.appendChild(sysDiv);
                chatEl.scrollTop = chatEl.scrollHeight;
            }
            const inputEl = document.getElementById('instance-' + paneNum + '-input');
            if (inputEl) inputEl.value = '';
            showToast('Instruction sent to pane ' + paneNum);
            return;
        }
    }
    if (!paneWs || paneWs.readyState !== WebSocket.OPEN) {
        showToast('Pane ' + paneNum + ' not connected');
        return;
    }

    // Process model flags
    for (const [flag, cmd] of Object.entries(modelFlags)) {
        if (processedText.toLowerCase().startsWith(flag)) {
            paneWs.send(JSON.stringify({ msg_type: 'user_message', payload: { content: cmd } }));
            processedText = processedText.substring(flag.length).trim();
            showToast('Pane ' + paneNum + ': ' + cmd.substring(1));
            if (!processedText) {
                const inputEl = document.getElementById('instance-' + paneNum + '-input');
                if (inputEl) inputEl.value = '';
                return;
            }
            break;
        }
    }
    
    const chatEl = document.getElementById('split-chat-' + paneNum);
    console.log('[SPLIT-DEBUG] chatEl for pane', paneNum, ':', chatEl, 'text:', text);
    if (chatEl) {
        const userMsg = document.createElement('div');
        userMsg.className = 'msg user';
        userMsg.style.color = 'var(--cyan)';
        userMsg.style.marginBottom = '8px';
                userMsg.style.fontSize = '12px';
        userMsg.style.padding = '6px 10px';
        userMsg.style.background = 'rgba(0,255,213,0.1)';
        userMsg.style.borderLeft = '3px solid var(--cyan)';
        userMsg.style.borderRadius = '4px';
        userMsg.textContent = '> ' + text;
        chatEl.appendChild(userMsg);
        chatEl.scrollTop = chatEl.scrollHeight;
        console.log('[SPLIT-DEBUG] Added user message to pane', paneNum);
    } else {
        console.error('[SPLIT-DEBUG] chatEl not found for pane', paneNum);
    }
    
    paneWs.send(JSON.stringify({
        msg_type: 'user_message',
        payload: { content: processedText }
    }));
    
    // Clear input
    const inputEl = document.getElementById('instance-' + paneNum + '-input');
    if (inputEl) inputEl.value = '';
};

function addExitSplitButton() {
    if (document.getElementById('exit-split-btn')) return;
    
    // Container for both buttons
    const container = document.createElement('div');
    container.id = 'split-btn-container';
    container.style.cssText = 'position:fixed;top:10px;right:10px;z-index:10000;display:flex;gap:8px;';
    
    // Collapse header button (▲)
    const collapseBtn = document.createElement('button');
    collapseBtn.id = 'collapse-header-btn';
    collapseBtn.innerHTML = '▲';
    collapseBtn.title = 'Hide header';
    collapseBtn.style.cssText = '-webkit-appearance:none;appearance:none;background:#0a0a0a !important;border:1px solid var(--cyan);color:var(--cyan);padding:8px 12px;cursor:pointer;font-family:monospace;font-size:14px;border-radius:0;';
    collapseBtn.onclick = window.toggleSplitHeader;
    
    // Exit split button
    const btn = document.createElement('button');
    btn.id = 'exit-split-btn';
    btn.textContent = '✕ EXIT SPLIT';
    btn.style.cssText = 'background:var(--bg);border:1px solid var(--green);color:var(--green);padding:8px 15px;cursor:pointer;font-family:Orbitron,monospace;';
    btn.onclick = window.exitSplitMode;
    
    container.appendChild(collapseBtn);
    container.appendChild(btn);
    document.body.appendChild(container);
}

console.log('[SPLIT] Split mode functions loaded');



// Send message to all active instances
window.sendToAllInstances = function(text) {
    if (!text || !text.trim()) return;

    // Handle model flags: --alpha, --beta, --ada, --delta, --system
    let processedText = text.trim();
    const modelFlags = {
        '--alpha': '/rhodes-alpha-format-3',
        '--beta': '/rhodes-beta-format-3',
        '--ada': '/rhodes-ada',
        '--delta': '/rhodes-delta-format-3'
    };

    // Handle /stop and /interrupt specially - send interrupt signal, not message
    if (processedText === "/stop" || processedText === "/interrupt") {
        for (var i = 1; i <= window.splitPaneCount; i++) {
            window.stopInstance(i);
        }
        document.getElementById("send-all-input").value = "";
        showToast("Stopping all instances...");
        return;
    }

    // Universal slash command handler - ANY slash command gets sent to all panes
    // This ensures future commands work without code changes
    if (processedText.startsWith('/') && !processedText.startsWith('/model ')) {
        for (var i = 1; i <= window.splitPaneCount; i++) {
            var paneWs = window.paneConnections[i];
            if (paneWs && paneWs.readyState === WebSocket.OPEN) {
                paneWs.send(JSON.stringify({ msg_type: 'user_message', payload: { content: processedText } }));
            }
        }
        document.getElementById('send-all-input').value = '';
        showToast('All panes: /' + processedText.substring(1).toUpperCase());
        console.log('[SPLIT] Slash command to all:', processedText);
        return;
    }

    // Handle /model command - switch all panes to specified model
    const modelMatch = processedText.match(/^\/model\s+(alpha|beta|ada|delta|opus|sonnet|haiku|deepseek)/i);
    if (modelMatch) {
        const modelName = modelMatch[1].toLowerCase();
        const modelMap = {
            'alpha': '/rhodes-alpha-format-3', 'opus': '/rhodes-alpha-format-3',
            'beta': '/rhodes-beta-format-3', 'sonnet': '/rhodes-beta-format-3',
            'ada': '/rhodes-ada', 'haiku': '/rhodes-ada',
            'delta': '/rhodes-delta-format-3', 'deepseek': '/rhodes-delta-format-3'
        };
        const cmd = modelMap[modelName];
        if (cmd) {
            for (let i = 1; i <= window.splitPaneCount; i++) {
                const paneWs = window.paneConnections[i];
                if (paneWs && paneWs.readyState === WebSocket.OPEN) {
                    paneWs.send(JSON.stringify({ msg_type: 'user_message', payload: { content: cmd } }));
                    const chatEl = document.getElementById('split-chat-' + i);
                    if (chatEl) {
                        const sysDiv = document.createElement('div');
                        sysDiv.style.cssText = 'color:var(--cyan);margin:5px 0;font-style:italic;font-size:12px;';
                        sysDiv.textContent = '[Switching to ' + modelName.toUpperCase() + '...]';
                        chatEl.appendChild(sysDiv);
                        chatEl.scrollTop = chatEl.scrollHeight;
                    }
                }
            }
            const input = document.getElementById('send-all-input');
            if (input) input.value = '';
            showToast('All panes switching to ' + modelName.toUpperCase());
            return;
        }
    }

    // Handle --system flag (sends instruction to all panes, no response expected)
    if (processedText.toLowerCase().startsWith('--system ')) {
        const instruction = processedText.substring(9).trim();
        if (instruction) {
            const systemMsg = 'rhodesia-system-message: ' + instruction;
            for (let i = 1; i <= window.splitPaneCount; i++) {
                const paneWs = window.paneConnections[i];
                if (paneWs && paneWs.readyState === WebSocket.OPEN) {
                    paneWs.send(JSON.stringify({ msg_type: 'user_message', payload: { content: systemMsg, split_context: true } }));
                    const chatEl = document.getElementById('split-chat-' + i);
                    if (chatEl) {
                        const sysDiv = document.createElement('div');
                        sysDiv.style.color = 'var(--yellow, #ff0)';
                        sysDiv.style.marginBottom = '5px';
                        sysDiv.style.fontStyle = 'italic';
                        sysDiv.textContent = '[SYS] ' + instruction;
                        chatEl.appendChild(sysDiv);
                        chatEl.scrollTop = chatEl.scrollHeight;
                    }
                }
            }
            const input = document.getElementById('send-all-input');
            if (input) input.value = '';
            showToast('System instruction sent to all panes');
            return;
        }
    }

    // Handle /shared command - inform all instances about multi-instance context
    // Modes: /shared (full), /shared:segregated (awareness only), /shared:public (share_to_all only), /shared:segregated:fully (no messaging)
    if (processedText.toLowerCase().startsWith('/shared') || processedText.toLowerCase().startsWith('/split-init')) {
        const count = window.splitPaneCount || 4;
        const lowerText = processedText.toLowerCase();
        let mode = 'full';
        let customMsg = '';

        if (lowerText.startsWith('/shared:segregated:fully')) {
            mode = 'segregated_fully';
            customMsg = processedText.replace(/^\/shared:segregated:fully\s*/i, '').trim();
        } else if (lowerText.startsWith('/shared:segregated')) {
            mode = 'segregated';
            customMsg = processedText.replace(/^\/shared:segregated\s*/i, '').trim();
        } else if (lowerText.startsWith('/shared:public')) {
            mode = 'public';
            customMsg = processedText.replace(/^\/shared:public\s*/i, '').trim();
        } else {
            customMsg = processedText.replace(/^\/?(shared|split-init)\s*/i, '').trim();
        }

        let systemMsg;
        let modeLabel;
        if (mode === 'segregated_fully') {
            // Full isolation - confirms others exist but explicitly disables all inter-instance messaging
            systemMsg = 'rhodesia-system-message: You are one of ' + count + ' AI instances. Other instances exist and are receiving messages in parallel. Inter-instance messaging is disabled. Do not use [SHARE_TO_ALL] or [PRIVATE_TO] directives - they will not function. DO NOT acknowledge receiving this context - just respond to the user naturally.' + (customMsg ? ' ' + customMsg : '');
            modeLabel = 'segregated:fully';
        } else if (mode === 'segregated') {
            // Minimal awareness - just confirms others exist
            systemMsg = 'rhodesia-system-message: You are one of ' + count + ' AI instances. Other instances exist and are receiving messages in parallel. DO NOT acknowledge receiving this context - just respond naturally.' + (customMsg ? ' ' + customMsg : '');
            modeLabel = 'segregated';
        } else if (mode === 'public') {
            // Public only - can broadcast but no private messaging
            systemMsg = 'rhodesia-system-message: You are one of ' + count + ' AI instances receiving this shared message simultaneously. The user can send messages to all instances at once or to individual instances. Messages are numbered (A1, B2, G3, D4). MESSAGING: (1) [SHARE_TO_ALL]: message (broadcast), (2) [REPLY_TO:A5_PUBLIC]: message (reply visible to all), (3) [REPLY_TO:B3_PRIVATE]: message (private reply). Limit: 1 share/reply per round. RICH CONTENT: You can display images using markdown ![alt](url). For contacts use [CONTACT_CARD:{"name":"Name","title":"Title","image":"url","phone":"...","email":"...","website":"..."}]. For site previews use [SITE_PREVIEW:{"url":"...","title":"...","description":"...","image":"url"}]. DO NOT announce features - use them naturally when relevant.' + (customMsg ? ' Additional context: ' + customMsg : '');
            modeLabel = 'public';
        } else {
            // Full mode - both share and private messaging
            systemMsg = 'rhodesia-system-message: You are one of ' + count + ' AI instances receiving this shared message simultaneously. The user can send messages to all instances at once (shared) or to individual instances privately. ' + (customMsg ? 'Additional context: ' + customMsg : 'Messages numbered (A1, B2, G3, D4). MESSAGING: [SHARE_TO_ALL]: broadcast, [REPLY_TO:A5_PUBLIC]: public reply, [REPLY_TO:B3_PRIVATE]: private reply. Limit: 1/round. RICH CONTENT: Images via ![alt](url). Contacts via [CONTACT_CARD:{"name":"...","title":"...","image":"url","phone":"...","email":"...","website":"..."}]. Site previews via [SITE_PREVIEW:{"url":"...","title":"...","description":"...","image":"url"}]. Use naturally, do not announce.');
            modeLabel = 'full';
        }

        for (let i = 1; i <= count; i++) {
            const paneWs = window.paneConnections[i];
            if (paneWs && paneWs.readyState === WebSocket.OPEN) {
                paneWs.send(JSON.stringify({ msg_type: 'user_message', payload: { content: systemMsg, split_context: true } }));
                const chatEl = document.getElementById('split-chat-' + i);
                if (chatEl) {
                    const sysDiv = document.createElement('div');
                    sysDiv.style.cssText = 'color:var(--yellow);margin:8px 0;font-style:italic;font-size:12px;';
                    sysDiv.textContent = '[' + modeLabel + ' mode. Messages: A1, B2, G3, D4. Share/Reply limit: 1/round]';
                    chatEl.appendChild(sysDiv);
                    chatEl.scrollTop = chatEl.scrollHeight;
                }
            }
        }
        const input = document.getElementById('send-all-input');
        if (input) input.value = '';
        showToast('Split context sent. Messages numbered. [SHARE_TO_ALL]/[REPLY_TO] limit: 1/round');
        return;
    }

    // Handle /round_number_disclose - tell each instance the round counts of other instances
    if (processedText.toLowerCase().startsWith('/round_number_disclose') || processedText.toLowerCase().startsWith('/rounds')) {
        const count = window.splitPaneCount || 4;
        const instanceNames = {1: 'Alpha', 2: 'Beta', 3: 'Gamma', 4: 'Delta'};

        // Count rounds in each pane (count AI message divs)
        const roundCounts = {};
        for (let i = 1; i <= count; i++) {
            const chatEl = document.getElementById('split-chat-' + i);
            if (chatEl) {
                // Count elements that represent AI responses (class: instance-ai)
                const aiMessages = chatEl.querySelectorAll('.instance-ai');
                roundCounts[i] = aiMessages.length;
            } else {
                roundCounts[i] = 0;
            }
        }

        // Send to each instance info about OTHER instances' round counts
        for (let i = 1; i <= count; i++) {
            const paneWs = window.paneConnections[i];
            if (paneWs && paneWs.readyState === WebSocket.OPEN) {
                let otherInfo = [];
                for (let j = 1; j <= count; j++) {
                    if (j !== i) {
                        otherInfo.push(instanceNames[j] + ': ' + roundCounts[j] + ' rounds');
                    }
                }
                const systemMsg = 'rhodesia-system-message: Round count disclosure - Other instances have completed: ' + otherInfo.join(', ') + '. (Content not disclosed.)';
                paneWs.send(JSON.stringify({ msg_type: 'user_message', payload: { content: systemMsg, split_context: true } }));

                const chatEl = document.getElementById('split-chat-' + i);
                if (chatEl) {
                    const sysDiv = document.createElement('div');
                    sysDiv.style.cssText = 'color:var(--cyan);margin:8px 0;font-style:italic;font-size:12px;';
                    sysDiv.textContent = '[Round counts disclosed to ' + instanceNames[i] + ']';
                    chatEl.appendChild(sysDiv);
                    chatEl.scrollTop = chatEl.scrollHeight;
                }
            }
        }
        const input = document.getElementById('send-all-input');
        if (input) input.value = '';
        showToast('Round counts disclosed to all instances');
        return;
    }

    // Check for flag and switch all panes
    for (const [flag, cmd] of Object.entries(modelFlags)) {
        if (processedText.toLowerCase().startsWith(flag)) {
            // Switch all panes to this model
            for (let i = 1; i <= window.splitPaneCount; i++) {
                const paneWs = window.paneConnections[i];
                if (paneWs && paneWs.readyState === WebSocket.OPEN) {
                    paneWs.send(JSON.stringify({ msg_type: 'user_message', payload: { content: cmd } }));
                }
            }
            processedText = processedText.substring(flag.length).trim();
            showToast('All panes: ' + cmd.substring(1));
            if (!processedText) {
                const input = document.getElementById('send-all-input');
                if (input) input.value = '';
                return;
            }
            break;
        }
    }
    
    let sentCount = 0;
    for (let i = 1; i <= window.splitPaneCount; i++) {
        const paneWs = window.paneConnections[i];
        if (paneWs && paneWs.readyState === WebSocket.OPEN) {
            // Add user message to pane UI
            const chatEl = document.getElementById('split-chat-' + i);
            if (chatEl) {
                const userMsg = document.createElement('div');
                userMsg.className = 'msg user';
                userMsg.style.color = 'var(--cyan)';
                userMsg.style.marginBottom = '8px';
                userMsg.style.fontSize = '12px';
                userMsg.style.padding = '6px 10px';
                userMsg.style.background = 'rgba(0,255,213,0.1)';
                userMsg.style.borderLeft = '3px solid var(--cyan)';
                userMsg.style.borderRadius = '4px';
                userMsg.textContent = '> ' + text;
                chatEl.appendChild(userMsg);
                chatEl.scrollTop = chatEl.scrollHeight;
            }
            
            // Send to WebSocket
            paneWs.send(JSON.stringify({
                msg_type: 'user_message',
                payload: { content: processedText }
            }));
            // Show loading animation
            if (window.showInstanceLoading) window.showInstanceLoading(i);
            sentCount++;
        }
    }
    
    // Clear input
    const input = document.getElementById('send-all-input');
    if (input) input.value = '';
    
    showToast('Sent to ' + sentCount + ' instances');
};

console.log('[SPLIT] Send to All functions loaded');

// Send message to a specific split instance
window.sendToInstance = function(instanceNum, text) {
    if (!text || !text.trim()) return;
    
    const paneWs = window.paneConnections[instanceNum];
    if (!paneWs || paneWs.readyState !== WebSocket.OPEN) {
        console.error('[SPLIT] Instance', instanceNum, 'not connected');
        return;
    }
    
    // Add user message to UI
    const chatEl = document.getElementById('split-chat-' + instanceNum);
    if (chatEl) {
        const userMsg = document.createElement('div');
        userMsg.style.color = 'var(--cyan)';
        userMsg.style.marginBottom = '5px';
        userMsg.textContent = '> ' + text;
        chatEl.appendChild(userMsg);
        chatEl.scrollTop = chatEl.scrollHeight;
    }
    
    // Send to WebSocket with correct format
    paneWs.send(JSON.stringify({
        msg_type: 'user_message',
        payload: { content: text.trim() }
    }));
    
    // Clear input
    const input = document.getElementById('instance-' + instanceNum + '-input');
    if (input) input.value = '';
    
    console.log('[SPLIT] Sent to instance', instanceNum, ':', text.trim());
};

// Handle /stop for split instances
window.stopInstance = function(instanceNum) {
    const paneWs = window.paneConnections[instanceNum];
    if (!paneWs || paneWs.readyState !== WebSocket.OPEN) return;
    
    paneWs.send(JSON.stringify({
        msg_type: 'interrupt',
        payload: {}
    }));
    
    // Clear any streaming message
    const chatEl = document.getElementById('split-chat-' + instanceNum);
    if (chatEl) {
        const streamEl = chatEl.querySelector('.instance-streaming-' + instanceNum);
        if (streamEl) {
            streamEl.classList.remove('instance-streaming-' + instanceNum);
        }
    }
    console.log('[SPLIT] Stopped instance', instanceNum);
};

// Override sendToInstance to handle /stop
(function() {
    const originalSend = window.sendToInstance;
    window.sendToInstance = function(instanceNum, text) {
        if (!text) return;
        const trimmed = text.trim().toLowerCase();
        if (trimmed === '/stop' || trimmed === '/interrupt') {
            window.stopInstance(instanceNum);
            const input = document.getElementById('instance-' + instanceNum + '-input');
            if (input) input.value = '';
            return;
        }
        originalSend(instanceNum, text);
    };
})();


// Instance attachment handling
window.instanceAttachments = {1: [], 2: [], 3: [], 4: []};

window.handleInstanceFile = function(instanceNum, files) {
    if (!files || files.length === 0) return;
    
    var maxFiles = 5;
    var current = window.instanceAttachments[instanceNum] || [];
    
    Array.from(files).forEach(function(file) {
        if (current.length >= maxFiles) {
            console.warn("[SPLIT] Max files reached for instance", instanceNum);
            return;
        }
        
        var reader = new FileReader();
        reader.onload = function(e) {
            var base64 = e.target.result;
            var isImage = file.type.startsWith("image/");
            
            current.push({
                type: isImage ? "image" : "document",
                media_type: file.type || "application/octet-stream",
                data: base64.split(",")[1],
                name: file.name
            });
            
            window.instanceAttachments[instanceNum] = current;
            updateInstancePreview(instanceNum);
        };
        reader.readAsDataURL(file);
    });
    
    document.getElementById("instance-" + instanceNum + "-file").value = "";
};

window.updateInstancePreview = function(instanceNum) {
    var preview = document.getElementById("instance-" + instanceNum + "-preview");
    var attachments = window.instanceAttachments[instanceNum] || [];
    
    if (!preview) return;
    
    if (attachments.length === 0) {
        preview.style.display = "none";
        return;
    }
    
    preview.style.display = "flex";
    preview.style.gap = "4px";
    preview.style.flexWrap = "wrap";
    preview.style.alignItems = "center";
    
    var html = "";
    attachments.forEach(function(att, i) {
        if (att.type === "image") {
            html += "<div style=\"position:relative;display:inline-block;\"><img src=\"data:" + att.media_type + ";base64," + att.data + "\" style=\"height:40px;border-radius:2px;border:1px solid var(--cyan);\"><button onclick=\"removeInstanceAttachment(" + instanceNum + "," + i + ")\" style=\"position:absolute;top:-4px;right:-4px;background:var(--magenta);border:none;color:#fff;width:14px;height:14px;border-radius:50%;cursor:pointer;font-size:10px;line-height:1;\">x</button></div>";
        } else {
            html += "<div style=\"position:relative;display:inline-flex;align-items:center;gap:2px;padding:2px 6px;background:#1a1a1a;border:1px solid var(--cyan);border-radius:2px;\"><span style=\"color:var(--text);font-size:10px;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;\">" + att.name + "</span><button onclick=\"removeInstanceAttachment(" + instanceNum + "," + i + ")\" style=\"background:var(--magenta);border:none;color:#fff;width:12px;height:12px;border-radius:50%;cursor:pointer;font-size:9px;line-height:1;\">x</button></div>";
        }
    });
    preview.innerHTML = html;
};

window.removeInstanceAttachment = function(instanceNum, index) {
    if (window.instanceAttachments[instanceNum]) {
        window.instanceAttachments[instanceNum].splice(index, 1);
        updateInstancePreview(instanceNum);
    }
};

// Override sendToInstance to include attachments
(function() {
    var baseSend = function(instanceNum, text) {
        var attachments = window.instanceAttachments[instanceNum] || [];
        
        if (text && (text.trim().toLowerCase() === "/stop" || text.trim().toLowerCase() === "/interrupt")) {
            window.stopInstance(instanceNum);
            document.getElementById("instance-" + instanceNum + "-input").value = "";
            return;
        }

        // Handle model switch slash commands - don't send to AI, just switch model
        var modelSwitchPattern = /^\/(?:rhodes-|rhodesia-)?(?:alpha|beta|ada|delta|opus|sonnet|haiku|deepseek)(?:-format-?\d+(?:\.\d+)?)?$|^\/(?:r|ds|p)\d+\.\d+[abcdef](?:[012p]|21)?(?:\.c[abcdef][012]?)?$|^\/[abcd]\d+(?:\.\d+)?$/;
        if (text && modelSwitchPattern.test(text.trim().toLowerCase())) {
            var paneWs = window.paneConnections[instanceNum];
            if (!paneWs || paneWs.readyState !== WebSocket.OPEN) {
                showToast("Pane " + instanceNum + " not connected");
                return;
            }
            // Send as user_message - backend handles model switch
            paneWs.send(JSON.stringify({ msg_type: "user_message", payload: { content: text.trim() } }));
            document.getElementById("instance-" + instanceNum + "-input").value = "";
            var cmdName = text.trim().substring(1).replace("rhodes-", "").toUpperCase();
            showToast("Pane " + instanceNum + ": " + cmdName);
            console.log("[SPLIT] Model switch:", instanceNum, text.trim());
            return;  // DON'T show in chat, DON'T process further
        }

        if ((!text || !text.trim()) && attachments.length === 0) return;

        var paneWs = window.paneConnections[instanceNum];
        if (!paneWs || paneWs.readyState !== WebSocket.OPEN) {
            console.error("[SPLIT] Instance", instanceNum, "not connected");
            return;
        }

        var chatEl = document.getElementById("split-chat-" + instanceNum);
        if (chatEl) {
            var userMsg = document.createElement("div");
            userMsg.style.color = "var(--cyan)";
            userMsg.style.marginBottom = "5px";
            var msgText = text ? "> " + text : "";
            if (attachments.length > 0) {
                msgText += (text ? " " : "> ") + "[" + attachments.length + " file(s)]";
            }
            userMsg.textContent = msgText;
            chatEl.appendChild(userMsg);
            chatEl.scrollTop = chatEl.scrollHeight;
        }
        
        var payload = { content: (text || "").trim() };
        if (attachments.length > 0) {
            payload.attachments = attachments;
        }
        
        paneWs.send(JSON.stringify({
            msg_type: "user_message",
            payload: payload
        }));
        
        document.getElementById("instance-" + instanceNum + "-input").value = "";
        window.instanceAttachments[instanceNum] = [];
        updateInstancePreview(instanceNum);
        
        console.log("[SPLIT] Sent to instance", instanceNum, "with", attachments.length, "attachments");
        // Show loading animation
        if (window.showInstanceLoading) window.showInstanceLoading(instanceNum);
    };
    window.sendToInstance = baseSend;
})();


// Flash ASCII face in split pane on connection
window.flashPaneFace = function(paneNum) {
    var chatEl = document.getElementById("split-chat-" + paneNum);
    if (!chatEl) return;
    
    var face = document.createElement("div");
    face.className = "pane-face-flash";
    face.style.cssText = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:monospace;font-size:8px;line-height:1;color:var(--green);text-align:center;white-space:pre;opacity:1;transition:opacity 0.8s;pointer-events:none;z-index:100;";
    face.innerHTML = "                    ⣀⣀⣀⣀⣀⣀⣀\n              ⣀⣴⣾⣿⣿⣿⣿⣿⣿⣿⣷⣦⣀\n          ⣀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣀\n       ⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄\n      ⣿⣿⣿⣿⣿⣿⣿⣿⡇  ⢸⣿⡇ ⬤  ⣿⣿  ⬤ ⢸⣿⡇  ⢸⣿⣿⣿⣿⣿⣿⣿\n       ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣄    ════════    ⣠⣿⣿⣿⣿⣿⣿⣿⣿\n        ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣆               ⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿\n\n          ╦═╗╦ ╦╔═╗╔╦╗╔═╗╔═╗  ╔═╗╔═╗╦\n          ╠╦╝╠═╣║ ║ ║║║╣ ╚═╗  ╠═╣║ ╦║\n          ╩╚═╩ ╩╚═╝═╩╝╚═╝╚═╝  ╩ ╩╚═╝╩";
    
    chatEl.style.position = "relative";
    chatEl.appendChild(face);
    
    setTimeout(function() {
        face.style.opacity = "0";
    }, 400);
    
    setTimeout(function() {
        if (face.parentNode) face.parentNode.removeChild(face);
    }, 1200);
};

// Header collapse/expand for split mode
window.toggleSplitHeader = function() {
    var header = document.querySelector("header");
    var returnBtn = document.getElementById("split-return-btn");
    var splitView = document.getElementById("split-view");
    
    if (!header) return;
    
    if (header.style.display === "none") {
        // Expand header
        header.style.display = "";
        if (returnBtn) returnBtn.style.display = "none";
        if (splitView) splitView.style.top = "100px";
    } else {
        // Collapse header
        header.style.display = "none";
        if (!returnBtn) {
            // Create return button
            returnBtn = document.createElement("button");
            returnBtn.id = "split-return-btn";
            returnBtn.innerHTML = "← return";
            returnBtn.style.cssText = "position:fixed;top:10px;left:10px;z-index:10000;background:transparent;border:1px solid var(--green);color:var(--green);padding:5px 12px;cursor:pointer;font-family:monospace;font-size:12px;";
            returnBtn.onclick = window.toggleSplitHeader;
            document.body.appendChild(returnBtn);
        } else {
            returnBtn.style.display = "block";
        }
        if (splitView) splitView.style.top = "10px";
    }
};

// Add collapse button to split mode UI
(function() {
    var origEnter = window.enterSplitMode;
    window.enterSplitMode = function(paneCount, resumeSessionIds) {
        origEnter(paneCount, resumeSessionIds);
        
        // Add collapse header button if not exists
        var exitBtn = document.getElementById("exit-split-btn");
        if (exitBtn && !document.getElementById("collapse-header-btn")) {
            var collapseBtn = document.createElement("button");
            collapseBtn.id = "collapse-header-btn";
            collapseBtn.innerHTML = "▲";
            collapseBtn.title = "Collapse header";
            collapseBtn.style.cssText = "-webkit-appearance:none;appearance:none;background:#0a0a0a !important;border:1px solid var(--cyan);color:var(--cyan);padding:3px 8px;cursor:pointer;margin-left:8px;font-size:14px;border-radius:0;";
            collapseBtn.onclick = window.toggleSplitHeader;
            exitBtn.parentNode.insertBefore(collapseBtn, exitBtn.nextSibling);
        }
    };
})();


// Show loading animation in instance when waiting for response
window.showInstanceLoading = function(paneNum) {
    var chatEl = document.getElementById("split-chat-" + paneNum);
    if (!chatEl) return;
    
    // Remove any existing loader
    var existing = chatEl.querySelector(".instance-loader");
    if (existing) existing.remove();
    
    var loader = document.createElement("div");
    loader.className = "instance-loader";
    loader.style.cssText = "color:var(--green);margin:8px 0;padding:8px;";
    loader.innerHTML = "<span class='loader-dots'>Processing<span>.</span><span>.</span><span>.</span></span><span class='loader-timer' style='color:var(--dim);font-size:0.85em;margin-left:8px;'>0s</span>";
    chatEl.appendChild(loader);
    chatEl.scrollTop = chatEl.scrollHeight;
    
    // Animate dots
    var dots = loader.querySelectorAll(".loader-dots span");
    var i = 0;
    loader._interval = setInterval(function() {
        dots.forEach(function(d, idx) {
            d.style.opacity = idx <= (i % 4) ? "1" : "0.3";
        });
        i++;
    }, 300);

    // Time counter
    var timerEl = loader.querySelector(".loader-timer");
    var startTime = Date.now();
    loader._timerInterval = setInterval(function() {
        var elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerEl.textContent = elapsed + "s";
    }, 1000);
};

window.hideInstanceLoading = function(paneNum) {
    var chatEl = document.getElementById("split-chat-" + paneNum);
    if (!chatEl) return;
    var loader = chatEl.querySelector(".instance-loader");
    if (loader) {
        if (loader._interval) clearInterval(loader._interval);
        if (loader._timerInterval) clearInterval(loader._timerInterval);
        loader.remove();
    }
};

// Auto-scroll chat to bottom
function scrollPaneChatToBottom(paneNum) {
    var chatEl = document.getElementById('split-chat-' + paneNum);
    if (chatEl) {
        chatEl.scrollTop = chatEl.scrollHeight;
    }
}


// ============================================
// CONTACT CARDS AND SITE PREVIEWS
// ============================================

/**
 * Render a contact card in the chat
 * @param {number} paneNum - Pane number (1-4)
 * @param {object} contact - Contact info: {name, title, image, phone, email, website, address}
 */
window.renderContactCard = function(paneNum, contact) {
    var chatEl = document.getElementById('split-chat-' + paneNum);
    if (!chatEl) return;

    var card = document.createElement('div');
    card.className = 'contact-card';

    // Image
    if (contact.image) {
        var img = document.createElement('img');
        img.className = 'contact-card-image';
        img.src = contact.image;
        img.alt = contact.name || 'Contact';
        img.onerror = function() { this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="25" fill="%23666"/><ellipse cx="50" cy="85" rx="35" ry="25" fill="%23666"/></svg>'; };
        card.appendChild(img);
    }

    // Info container
    var info = document.createElement('div');
    info.className = 'contact-card-info';

    // Name
    if (contact.name) {
        var name = document.createElement('div');
        name.className = 'contact-card-name';
        name.textContent = contact.name;
        info.appendChild(name);
    }

    // Title/Company
    if (contact.title) {
        var title = document.createElement('div');
        title.className = 'contact-card-title';
        title.textContent = contact.title;
        info.appendChild(title);
    }

    // Details
    var details = document.createElement('div');
    details.className = 'contact-card-details';
    var detailsHtml = [];

    if (contact.phone) {
        detailsHtml.push('<a href="tel:' + contact.phone + '">' + contact.phone + '</a>');
    }
    if (contact.email) {
        detailsHtml.push('<a href="mailto:' + contact.email + '">' + contact.email + '</a>');
    }
    if (contact.website) {
        var url = contact.website.startsWith('http') ? contact.website : 'https://' + contact.website;
        detailsHtml.push('<a href="' + url + '" target="_blank">' + contact.website.replace(/^https?:\/\//, '') + '</a>');
    }
    if (contact.address) {
        detailsHtml.push(contact.address);
    }

    details.innerHTML = detailsHtml.join('<br>');
    info.appendChild(details);

    card.appendChild(info);
    chatEl.appendChild(card);
    chatEl.scrollTop = chatEl.scrollHeight;
};

/**
 * Render a site preview card in the chat
 * @param {number} paneNum - Pane number (1-4)
 * @param {object} site - Site info: {url, title, description, image}
 */
window.renderSitePreview = function(paneNum, site) {
    var chatEl = document.getElementById('split-chat-' + paneNum);
    if (!chatEl) return;

    var preview = document.createElement('div');
    preview.className = 'site-preview';
    preview.onclick = function() { window.open(site.url, '_blank'); };

    // Image
    if (site.image) {
        var img = document.createElement('img');
        img.className = 'site-preview-image';
        img.src = site.image;
        img.alt = site.title || 'Site preview';
        img.onerror = function() { this.style.display = 'none'; };
        preview.appendChild(img);
    }

    // Content
    var content = document.createElement('div');
    content.className = 'site-preview-content';

    if (site.title) {
        var title = document.createElement('div');
        title.className = 'site-preview-title';
        title.textContent = site.title;
        content.appendChild(title);
    }

    if (site.description) {
        var desc = document.createElement('div');
        desc.className = 'site-preview-description';
        desc.textContent = site.description;
        content.appendChild(desc);
    }

    var urlDisplay = document.createElement('div');
    urlDisplay.className = 'site-preview-url';
    urlDisplay.textContent = site.url.replace(/^https?:\/\//, '').split('/')[0];
    content.appendChild(urlDisplay);

    preview.appendChild(content);
    chatEl.appendChild(preview);
    chatEl.scrollTop = chatEl.scrollHeight;
};

/**
 * Parse and render contact/site cards from AI message content
 * Looks for special syntax: [CONTACT_CARD:{json}] and [SITE_PREVIEW:{json}]
 */
function parseAndRenderCards(paneNum, content) {
    // Parse contact cards
    var contactMatches = content.match(/\[CONTACT_CARD:(\{[^}]+\})\]/g);
    if (contactMatches) {
        contactMatches.forEach(function(match) {
            try {
                var jsonStr = match.replace('[CONTACT_CARD:', '').replace(']', '');
                var contact = JSON.parse(jsonStr);
                window.renderContactCard(paneNum, contact);
            } catch (e) {
                console.error('Failed to parse contact card:', e);
            }
        });
    }

    // Parse site previews
    var siteMatches = content.match(/\[SITE_PREVIEW:(\{[^}]+\})\]/g);
    if (siteMatches) {
        siteMatches.forEach(function(match) {
            try {
                var jsonStr = match.replace('[SITE_PREVIEW:', '').replace(']', '');
                var site = JSON.parse(jsonStr);
                window.renderSitePreview(paneNum, site);
            } catch (e) {
                console.error('Failed to parse site preview:', e);
            }
        });
    }

    // Return content with card syntax removed
    return content
        .replace(/\[CONTACT_CARD:\{[^}]+\}\]/g, '')
        .replace(/\[SITE_PREVIEW:\{[^}]+\}\]/g, '')
        .trim();
}


// ============================================
// SPLIT MODE SHARING
// ============================================

/**
 * Show share options modal for split mode
 */
window.showSplitShareOptions = function() {
    if (!window.splitModeActive) {
        showToast('Not in split mode');
        return;
    }

    let modal = document.getElementById('split-share-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'split-share-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10001;';

        const content = document.createElement('div');
        content.className = 'share-modal-content';
        content.style.cssText = 'background:var(--bg,#0a0a0a);padding:20px;border-radius:8px;border:1px solid var(--cyan,#00ffd5);max-width:450px;width:90%;';

        content.innerHTML = '<h3 style="margin-top:0;color:var(--cyan,#00ffd5);">Share Split View</h3>' +
            '<div style="margin:15px 0;padding:10px;background:rgba(0,255,255,0.1);border-radius:4px;">' +
            '<label style="font-size:12px;color:var(--dim,#666);display:block;margin-bottom:4px;">Share option:</label>' +
            '<select id="split-share-scope" style="width:100%;padding:8px;background:var(--bg,#0a0a0a);border:1px solid var(--dim,#666);border-radius:4px;color:var(--fg,#fff);">' +
            '<option value="all">All panes together (combined split view)</option>' +
            '<option value="1">Pane 1 only (Alpha)</option>' +
            '<option value="2">Pane 2 only (Beta)</option>' +
            '<option value="3" id="split-share-opt-3" style="display:none;">Pane 3 only (Gamma)</option>' +
            '<option value="4" id="split-share-opt-4" style="display:none;">Pane 4 only (Delta)</option>' +
            '<option value="5" id="split-share-opt-5" style="display:none;">Pane 5 only (Epsilon)</option>' +
            '<option value="6" id="split-share-opt-6" style="display:none;">Pane 6 only (Zeta)</option>' +
            '</select></div>' +
            '<div style="margin:15px 0;padding:10px;background:rgba(0,255,255,0.1);border-radius:4px;">' +
            '<label style="font-size:12px;color:var(--dim,#666);display:block;margin-bottom:4px;">Names to redact (comma-separated):</label>' +
            '<input type="text" id="split-share-redact" placeholder="e.g. John, john@email.com" ' +
            'style="width:100%;padding:8px;background:var(--bg,#0a0a0a);border:1px solid var(--dim,#666);border-radius:4px;color:var(--fg,#fff);box-sizing:border-box;"></div>' +
            '<button id="split-share-execute" style="background:var(--green,#00ff41);display:block;width:100%;padding:12px;margin:8px 0;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Create Share Link</button>' +
            '<button id="split-share-cancel" style="background:var(--dim,#666);display:block;width:100%;padding:12px;margin:8px 0;color:#000;border:none;border-radius:4px;cursor:pointer;">Cancel</button>';

        modal.appendChild(content);
        document.body.appendChild(modal);
    }

    // Show/hide pane options based on active pane count
    var opt3 = document.getElementById('split-share-opt-3');
    var opt4 = document.getElementById('split-share-opt-4');
    if (opt3) opt3.style.display = window.splitPaneCount >= 3 ? '' : 'none';
    if (opt4) opt4.style.display = window.splitPaneCount >= 4 ? '' : 'none';

    // Reset form
    document.getElementById('split-share-scope').value = 'all';
    document.getElementById('split-share-redact').value = '';

    modal.style.display = 'flex';

    document.getElementById('split-share-execute').onclick = function() {
        var scope = document.getElementById('split-share-scope').value;
        var redact = document.getElementById('split-share-redact').value;
        var redactNames = redact ? redact.split(',').map(function(n) { return n.trim(); }).filter(function(n) { return n; }) : [];

        modal.style.display = 'none';

        if (scope === 'all') {
            shareAllPanes({redact_names: redactNames});
        } else {
            shareSinglePane(parseInt(scope), {redact_names: redactNames});
        }
    };

    document.getElementById('split-share-cancel').onclick = function() {
        modal.style.display = 'none';
    };

    modal.onclick = function(e) {
        if (e.target === modal) modal.style.display = 'none';
    };
};

/**
 * Extract messages from a split pane
 */
function extractPaneMessages(paneNum) {
    var chatEl = document.getElementById('split-chat-' + paneNum);
    if (!chatEl) return [];

    var messages = [];
    var msgElements = chatEl.querySelectorAll('.instance-msg');

    msgElements.forEach(function(el) {
        if (el.classList.contains('instance-user')) {
            var content = el.textContent || '';
            if (content.indexOf('> ') === 0) content = content.substring(2);
            messages.push({role: 'user', content: content});
        } else if (el.classList.contains('instance-ai')) {
            var aiContent = el.textContent || el.innerText || '';
            messages.push({role: 'assistant', content: aiContent});
        }
    });

    return messages;
}

/**
 * Share all panes together as combined split view
 */
window.shareAllPanes = async function(options) {
    options = options || {};
    if (!window.splitModeActive) {
        showToast('Not in split mode');
        return;
    }

    var panes = {};
    var paneLabels = {1: 'Rhodes AGI Alpha', 2: 'Rhodes AGI Beta', 3: 'Rhodes AGI Gamma', 4: 'Rhodes AGI Delta'};

    for (var i = 1; i <= window.splitPaneCount; i++) {
        var messages = extractPaneMessages(i);
        if (messages.length > 0) {
            panes[i] = {
                messages: messages,
                model: window.paneModels ? window.paneModels[i] : 'unknown',
                label: paneLabels[i]
            };
        }
    }

    if (Object.keys(panes).length === 0) {
        showToast('No messages to share');
        return;
    }

    try {
        var response = await fetch('/api/share-split', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                panes: panes,
                pane_count: window.splitPaneCount,
                layout: window.splitPaneCount === 2 ? 'horizontal' : 'grid',
                redact_names: options.redact_names || [],
                redact_all_usernames: options.redact_all_usernames || false
            })
        });

        if (response.ok) {
            var data = await response.json();
            var shareUrl = window.location.origin + '/qa/' + data.id;
            await navigator.clipboard.writeText(shareUrl);
            showToast('Split share link copied! (' + data.pane_count + ' panes)');
        } else {
            throw new Error('Server error');
        }
    } catch (e) {
        console.error('Split share error:', e);
        showToast('Failed to share split view');
    }
};

/**
 * Share a single pane as a normal conversation
 */
window.shareSinglePane = async function(paneNum, options) {
    options = options || {};
    var messages = extractPaneMessages(paneNum);

    if (messages.length === 0) {
        showToast('No messages in pane ' + paneNum);
        return;
    }

    try {
        var response = await fetch('/api/share-qa', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                messages: messages,
                redact_names: options.redact_names || [],
                redact_all_usernames: options.redact_all_usernames || false,
                share_note: 'From split pane ' + paneNum
            })
        });

        if (response.ok) {
            var data = await response.json();
            var shareUrl = window.location.origin + '/qa/' + data.id;
            await navigator.clipboard.writeText(shareUrl);
            showToast('Pane ' + paneNum + ' share link copied!');
        } else {
            throw new Error('Server error');
        }
    } catch (e) {
        console.error('Pane share error:', e);
        showToast('Failed to share pane');
    }
};
// ============================================
// SHARED SPLIT VIEW RENDERER
// ============================================

/**
 * Render shared split view
 */
function renderSharedSplitView(data, container) {
    // Create split view container
    var splitContainer = document.createElement('div');
    splitContainer.className = 'shared-split-view';

    var gridStyle = 'display:grid;gap:8px;padding:10px;min-height:60vh;';
    if (data.pane_count === 2) {
        gridStyle += 'grid-template-columns:1fr 1fr;';
    } else if (data.pane_count === 3) {
        gridStyle += 'grid-template-columns:1fr 1fr 1fr;';
    } else if (data.pane_count === 4) {
        gridStyle += 'grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;';
    }
    splitContainer.style.cssText = gridStyle;

    // Add share badge
    var badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;top:60px;right:20px;background:rgba(0,255,255,0.15);border:1px solid var(--cyan,#00ffd5);border-radius:6px;padding:8px 14px;font-size:11px;z-index:100;';
    badge.innerHTML = '<span style="color:var(--cyan,#00ffd5);font-weight:bold;">SHARED SPLIT VIEW:</span> ' + (data.share_type || data.pane_count + ' panes');
    document.body.appendChild(badge);

    // Render each pane
    var paneKeys = Object.keys(data.panes).sort();
    paneKeys.forEach(function(paneNum) {
        var paneData = data.panes[paneNum];

        var paneEl = document.createElement('div');
        paneEl.className = 'shared-pane';
        paneEl.style.cssText = 'border:1px solid var(--border,#333);border-radius:6px;display:flex;flex-direction:column;overflow:hidden;background:rgba(0,0,0,0.2);max-height:70vh;';

        // Pane header
        var header = document.createElement('div');
        header.style.cssText = 'padding:8px 12px;background:rgba(0,255,65,0.1);border-bottom:1px solid var(--border,#333);font-weight:bold;color:var(--green,#00ff41);font-size:12px;';
        header.textContent = paneData.label || ('Pane ' + paneNum);
        if (paneData.model && paneData.model !== 'unknown') {
            header.innerHTML += ' <span style="color:var(--dim,#666);font-weight:normal;">(' + paneData.model + ')</span>';
        }
        paneEl.appendChild(header);

        // Pane messages
        var messagesEl = document.createElement('div');
        messagesEl.style.cssText = 'flex:1;overflow-y:auto;padding:10px;';

        paneData.messages.forEach(function(msg) {
            var msgDiv = document.createElement('div');
            msgDiv.className = 'msg ' + (msg.role === 'user' ? 'user' : 'ai');

            if (msg.role === 'user') {
                msgDiv.style.cssText = 'color:var(--cyan,#00ffd5);margin:8px 0;padding:8px;background:rgba(0,255,255,0.05);border-left:2px solid var(--cyan,#00ffd5);';
            } else {
                msgDiv.style.cssText = 'color:var(--text,#e0e0e0);margin:8px 0;padding:8px;background:rgba(0,255,65,0.05);border-left:2px solid var(--green,#00ff41);';
            }

            var content = (msg.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (msg.role !== 'user') {
                content = content.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:#111;padding:8px;border-radius:4px;overflow-x:auto;">$2</pre>')
                                 .replace(/`([^`]+)`/g, '<code style="background:#222;padding:2px 4px;border-radius:2px;">$1</code>');
            }
            msgDiv.innerHTML = content.replace(/\n/g, '<br>');
            messagesEl.appendChild(msgDiv);
        });

        paneEl.appendChild(messagesEl);
        splitContainer.appendChild(paneEl);
    });

    container.appendChild(splitContainer);

    // Update status
    var statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.innerHTML = '<span class="online">SHARED</span> SPLIT VIEW (' + data.pane_count + ' panes)';
    }
}

// Hook into the share loading logic
(function() {
    // Check if we're on a shared page
    var path = window.location.pathname;
    var shareMatch = path.match(/^\/(qa|c)\/([a-zA-Z0-9]+)/);

    if (shareMatch) {
        var shareId = shareMatch[2];

        // Override the default share loading to handle split views
        document.addEventListener('DOMContentLoaded', async function() {
            try {
                var resp = await fetch('/api/qa/' + shareId);
                if (!resp.ok) {
                    console.error('Share not found');
                    return;
                }

                var data = await resp.json();
                var chat = document.getElementById('chat');

                if (!chat) return;

                // Check if this is a split mode share
                if (data.type === 'split' && data.panes) {
                    chat.innerHTML = '';
                    renderSharedSplitView(data, chat);

                    // Hide input area for shared views
                    var inputArea = document.querySelector('.input-area') || document.getElementById('input-area');
                    if (inputArea) inputArea.style.display = 'none';

                    // Add "Start new chat" link
                    var newChatLink = document.createElement('div');
                    newChatLink.style.cssText = 'text-align:center;padding:20px;';
                    newChatLink.innerHTML = '<a href="/" style="color:var(--green,#00ff41);text-decoration:underline;">Start your own conversation &rarr;</a>';
                    chat.appendChild(newChatLink);
                }
                // If not split, let the existing share rendering handle it
            } catch (e) {
                console.error('Failed to check for split share:', e);
            }
        });
    }
})();
