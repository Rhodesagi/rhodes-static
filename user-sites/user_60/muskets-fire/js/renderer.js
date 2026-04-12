/**
 * Split-Screen Renderer
 * Manages two viewports with proper scissoring and state management
 */

class SplitScreenRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Viewport dimensions
        this.updateDimensions();
        
        // Listen for resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Scene
        this.scene = new THREE.Scene();
        
        // Players and their cameras
        this.players = [];
        
        // Viewport overlays
        this.setupViewportOverlays();
    }
    
    updateDimensions() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.viewportWidth = width / 2;
        this.viewportHeight = height;
        
        this.renderer.setSize(width, height);
    }
    
    handleResize() {
        this.updateDimensions();
        
        // Update camera aspect ratios
        for (const player of this.players) {
            if (player && player.camera) {
                player.camera.aspect = this.viewportWidth / this.viewportHeight;
                player.camera.updateProjectionMatrix();
            }
        }
    }
    
    setupViewportOverlays() {
        const p1Viewport = document.getElementById('viewport-p1');
        const p2Viewport = document.getElementById('viewport-p2');
        
        if (p1Viewport && p2Viewport) {
            p1Viewport.addEventListener('click', () => this.requestPointerLock(0));
            p2Viewport.addEventListener('click', () => this.requestPointerLock(1));
        }
    }
    
    requestPointerLock(playerIndex) {
        const canvas = this.canvas;
        
        // Pointer lock for mouse look
        if (document.pointerLockElement !== canvas) {
            canvas.requestPointerLock = canvas.requestPointerLock || 
                                      canvas.mozRequestPointerLock ||
                                      canvas.webkitRequestPointerLock;
            
            if (canvas.requestPointerLock) {
                // Store which player is locking
                this.lockingPlayer = playerIndex;
                canvas.requestPointerLock();
            }
        }
    }
    
    setupPointerLockListeners(players) {
        this.players = players;
        
        // Pointer lock change events
        document.addEventListener('pointerlockchange', () => this.handlePointerLockChange());
        document.addEventListener('mozpointerlockchange', () => this.handlePointerLockChange());
        document.addEventListener('webkitpointerlockchange', () => this.handlePointerLockChange());
        
        // Mouse movement for locked pointer
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mozmousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('webkitmousemove', (e) => this.handleMouseMove(e));
    }
    
    handlePointerLockChange() {
        const canvas = this.canvas;
        const isLocked = document.pointerLockElement === canvas ||
                        document.mozPointerLockElement === canvas ||
                        document.webkitPointerLockElement === canvas;
        
        if (isLocked && this.lockingPlayer !== undefined) {
            // Set which player has mouse control
            for (let i = 0; i < this.players.length; i++) {
                this.players[i].setPointerLock(i === this.lockingPlayer);
            }
            
            // Update UI
            const p1El = document.getElementById('viewport-p1');
            const p2El = document.getElementById('viewport-p2');
            
            if (p1El && p2El) {
                p1El.classList.toggle('locked', this.lockingPlayer === 0);
                p2El.classList.toggle('locked', this.lockingPlayer === 1);
                p1El.classList.toggle('active', this.lockingPlayer === 0);
                p2El.classList.toggle('active', this.lockingPlayer === 1);
            }
        } else {
            // Released
            for (const player of this.players) {
                player.setPointerLock(false);
            }
            
            const p1El = document.getElementById('viewport-p1');
            const p2El = document.getElementById('viewport-p2');
            if (p1El && p2El) {
                p1El.classList.remove('locked', 'active');
                p2El.classList.remove('locked', 'active');
            }
        }
    }
    
    handleMouseMove(e) {
        // Get mouse delta
        const dx = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        const dy = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
        
        // Send to locked player
        for (const player of this.players) {
            if (player.pointerLocked) {
                player.handleMouseMove(dx, dy);
            }
        }
    }
    
    render() {
        const width = this.viewportWidth;
        const height = this.viewportHeight;
        
        // Clear entire canvas
        this.renderer.setScissorTest(false);
        this.renderer.clear();
        
        // Render Player 1 (left half)
        if (this.players[0] && this.players[0].camera) {
            this.renderer.setViewport(0, 0, width, height);
            this.renderer.setScissor(0, 0, width, height);
            this.renderer.setScissorTest(true);
            
            // Update player 1 camera aspect
            this.players[0].camera.aspect = width / height;
            this.players[0].camera.updateProjectionMatrix();
            
            // Render scene from player 1 perspective
            this.renderer.render(this.scene, this.players[0].camera);
        }
        
        // Render Player 2 (right half)
        if (this.players[1] && this.players[1].camera) {
            this.renderer.setViewport(width, 0, width, height);
            this.renderer.setScissor(width, 0, width, height);
            this.renderer.setScissorTest(true);
            
            // Update player 2 camera aspect
            this.players[1].camera.aspect = width / height;
            this.players[1].camera.updateProjectionMatrix();
            
            // Render scene from player 2 perspective
            this.renderer.render(this.scene, this.players[1].camera);
        }
        
        // Disable scissor for any additional rendering
        this.renderer.setScissorTest(false);
    }
    
    addToScene(object) {
        this.scene.add(object);
    }
    
    removeFromScene(object) {
        this.scene.remove(object);
    }
    
    getScene() {
        return this.scene;
    }
    
    dispose() {
        this.renderer.dispose();
    }
}