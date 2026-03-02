// Global input handling for both players

const Input = {
    players: {},
    
    init: function(players, muskets) {
        this.players = players;
        this.muskets = muskets;
        this.setupKeyListeners();
    },
    
    setupKeyListeners: function() {
        window.addEventListener('keydown', (e) => {
            // Prevent default for game keys to avoid browser shortcuts
            if (['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','KeyX','KeyF','KeyR',
                 'ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyI','KeyK',
                 'KeyM','Period','KeyL'].includes(e.code)) {
                e.preventDefault();
            }
            
            // Fire and reload on keydown only once
            if (!e.repeat) {
                // Player 1 fire
                if (e.code === 'KeyF') {
                    const musket = this.muskets[0];
                    if (musket && musket.fire) musket.fire();
                }
                // Player 2 fire
                if (e.code === 'Period') {
                    const musket = this.muskets[1];
                    if (musket && musket.fire) musket.fire();
                }
                // Player 1 reload
                if (e.code === 'KeyR') {
                    const musket = this.muskets[0];
                    if (musket && musket.startReload) musket.startReload();
                }
                // Player 2 reload
                if (e.code === 'KeyL') {
                    const musket = this.muskets[1];
                    if (musket && musket.startReload) musket.startReload();
                }
            }
        });
    }
};

// Initialize after game loads
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.player1 && window.player2 && window.muskets) {
            Input.init([window.player1, window.player2], window.muskets);
        }
    }, 1000);
});