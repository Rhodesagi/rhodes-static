class SplitScreenRenderer {
    constructor(canvas, player1, player2) {
        this.canvas = canvas;
        this.player1 = player1;
        this.player2 = player2;
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: "high-performance" });
        this.updateSize();
        window.addEventListener('resize', () => this.updateSize());
        this.createDivider();
    }
    
    updateSize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.canvas.width = width;
        this.canvas.height = height;
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        const halfWidth = Math.floor(width / 2);
        this.player1.camera.aspect = halfWidth / height;
        this.player1.camera.updateProjectionMatrix();
        this.player2.camera.aspect = halfWidth / height;
        this.player2.camera.updateProjectionMatrix();
    }
    
    createDivider() {
        const divider = document.createElement('div');
        divider.id = 'screenDivider';
        divider.style.cssText = 'position: absolute; left: 50%; top: 0; width: 2px; height: 100%; background: linear-gradient(180deg, transparent 0%, #8B4513 20%, #CD853F 50%, #8B4513 80%, transparent 100%); z-index: 10; pointer-events: none;';
        document.body.appendChild(divider);
    }
    
    render(scene) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const halfWidth = Math.floor(width / 2);
        this.renderer.setScissorTest(true);
        this.renderer.setViewport(0, 0, halfWidth, height);
        this.renderer.setScissor(0, 0, halfWidth, height);
        this.renderer.render(scene, this.player1.camera);
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
