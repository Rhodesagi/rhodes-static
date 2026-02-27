/**
 * Split-Screen Renderer - Dual viewport rendering for same-computer multiplayer
 * Uses ScissorTest for proper split-screen without stretching
 */

class SplitScreenRenderer {
    constructor(canvas, player1, player2) {
        this.canvas = canvas;
        this.player1 = player1;
        this.player2 = player2;
        
        // Main WebGL renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            powerPreference: "high-performance"
        });
        
        this.updateSize();
        
        // Handle window resize
        window.addEventListener('resize', () => this.updateSize());
        
        // Divider line geometry (visual separator)
        this.createDivider();
    }
    
    updateSize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Each player gets half the width
        const halfWidth = Math.floor(width / 2);
        
        // Update camera aspect ratios
        this.player1.camera.aspect = halfWidth / height;
        this.player1.camera.updateProjectionMatrix();
        
        this.player2.camera.aspect = halfWidth / height;
        this.player2.camera.updateProjectionMatrix();
    }
    
    createDivider() {
        // Create a visual divider using CSS instead of 3D geometry
        const divider = document.createElement('div');
        divider.id = 'screenDivider';
        divider.style.cssText = `
            position: absolute;
            left: 50%;
            top: 0;
            width: 2px;
            height: 100%;
            background: linear-gradient(180deg, 
                transparent 0%, 
                #8B4513 20%, 
                #CD853F 50%, 
                #8B4513 80%, 
                transparent 100%
            );
            z-index: 10;
            pointer-events: none;
        `;
        document.body.appendChild(divider);
    }
    
    render(scene) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const halfWidth = Math.floor(width / 2);
        
        this.renderer.setScissorTest(true);
        
        // Render Player 1 (left half)
        this.renderer.setViewport(0, 0, halfWidth, height);
        this.renderer.setScissor(0, 0, halfWidth, height);
        this.renderer.render(scene, this.player1.camera);
        
        // Render Player 2 (right half)
        this.renderer.setViewport(halfWidth, 0, halfWidth, height);
        this.renderer.setScissor(halfWidth, 0, halfWidth, height);
        this.renderer.render(scene, this.player2.camera);
        
        this.renderer.setScissorTest(false);
    }
    
    dispose() {
        this.renderer.dispose();
        const divider = document.getElementById('screenDivider');
        if (divider) divider.remove();
    }
}