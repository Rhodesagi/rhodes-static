// Split-screen dual viewport rendering for same-computer multiplayer
// Uses setScissor() + setViewport(), NOT PointerLockControls

export class SplitScreenRenderer {
    constructor(renderer, player1, player2) {
        this.renderer = renderer;
        this.player1 = player1;
        this.player2 = player2;
        
        // Setup canvas
        this.canvas = renderer.domElement;
        this.updateSize();
        
        // Listen for resize
        window.addEventListener('resize', () => this.updateSize());
    }
    
    updateSize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Each player gets half width, full height
        // Aspect ratio is width/2 : height
        const aspect = (width / 2) / height;
        
        this.player1.camera.aspect = aspect;
        this.player1.camera.updateProjectionMatrix();
        
        this.player2.camera.aspect = aspect;
        this.player2.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    render(scene) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const halfWidth = Math.floor(width / 2);
        
        // Clear entire screen
        this.renderer.setScissorTest(false);
        this.renderer.clear();
        
        // Render player 1 (left half)
        this.renderer.setScissorTest(true);
        this.renderer.setScissor(0, 0, halfWidth, height);
        this.renderer.setViewport(0, 0, halfWidth, height);
        this.renderer.render(scene, this.player1.camera);
        
        // Render player 2 (right half)
        this.renderer.setScissor(halfWidth, 0, width - halfWidth, height);
        this.renderer.setViewport(halfWidth, 0, width - halfWidth, height);
        this.renderer.render(scene, this.player2.camera);
        
        // Draw split line
        this.drawSplitLine(halfWidth, height);
    }
    
    drawSplitLine(x, height) {
        // Access the 2D context for overlay
        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x - 1, 0, 2, height);
        ctx.restore();
    }
}
