// MUSKETFIRE - Split-screen rendering
// Horizontal split - P1 top, P2 bottom
// Proper viewport clearing to prevent depth buffer pollution

class SplitScreenRenderer {
    constructor(canvas, scene, player1, player2) {
        this.canvas = canvas;
        this.scene = scene;
        this.player1 = player1;
        this.player2 = player2;
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Handle resize
        window.addEventListener('resize', () => this.onResize());
    }
    
    onResize() {
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    }
    
    render() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        const halfHeight = Math.floor(height / 2);
        
        // Update player cameras aspect ratios
        this.player1.camera.aspect = width / halfHeight;
        this.player1.camera.updateProjectionMatrix();
        
        this.player2.camera.aspect = width / halfHeight;
        this.player2.camera.updateProjectionMatrix();
        
        // Clear entire buffer
        this.renderer.setScissorTest(false);
        this.renderer.clear();
        
        // Render P1 (top half)
        this.renderer.setViewport(0, halfHeight, width, halfHeight);
        this.renderer.setScissor(0, halfHeight, width, halfHeight);
        this.renderer.setScissorTest(true);
        this.renderer.clear(); // Clear this viewport
        
        // Make P2 invisible to P1 (optional, for cleaner view)
        this.player2.visualGroup.visible = false;
        
        this.renderer.render(this.scene, this.player1.camera);
        
        // Render P2 (bottom half)
        this.renderer.setViewport(0, 0, width, halfHeight);
        this.renderer.setScissor(0, 0, width, halfHeight);
        this.renderer.clear(); // Clear this viewport
        
        // Make both visible for P2's view
        this.player2.visualGroup.visible = true;
        this.player1.visualGroup.visible = true;
        
        this.renderer.render(this.scene, this.player2.camera);
        
        this.renderer.setScissorTest(false);
    }
    
    // Full screen effect rendering (damage overlays, etc)
    renderOverlay(ctx, p1Damage, p2Damage) {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        const halfHeight = Math.floor(height / 2);
        
        ctx.clearRect(0, 0, width, height);
        
        // P1 damage (top half)
        if (p1Damage > 0) {
            const alpha = p1Damage * 0.6;
            const gradient = ctx.createLinearGradient(0, 0, 0, halfHeight);
            gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, halfHeight);
        }
        
        // P2 damage (bottom half)
        if (p2Damage > 0) {
            const alpha = p2Damage * 0.6;
            const gradient = ctx.createLinearGradient(0, halfHeight, 0, height);
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
            gradient.addColorStop(1, `rgba(255, 0, 0, ${alpha})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, halfHeight, width, halfHeight);
        }
        
        // Split line
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, halfHeight);
        ctx.lineTo(width, halfHeight);
        ctx.stroke();
    }
}

// Export
window.SplitScreenRenderer = SplitScreenRenderer;
