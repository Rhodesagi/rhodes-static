const Game = {
    renderer: null,
    player1: null,
    player2: null,
    musket1: null,
    musket2: null,
    isRunning: false,
    lastTime: 0,
    stateP1: null,
    stateP2: null,
    winnerDisplay: null,
    gameOverlay: null,
    rematchBtn: null,

    init: function() {
        this.stateP1 = document.getElementById('state-p1');
        this.stateP2 = document.getElementById('state-p2');
        this.winnerDisplay = document.getElementById('winner-display');
        this.gameOverlay = document.getElementById('game-overlay');
        this.rematchBtn = document.getElementById('rematch-btn');

        this.rematchBtn.addEventListener('click', () => {
            this.reset();
        });

        this.renderer = new SplitScreenRenderer('game-container');

        const p1Start = new THREE.Vector3(-10, 0, 0);
        const p2Start = new THREE.Vector3(10, 0, 0);
        const p1Rot = new THREE.Euler(0, Math.PI / 2, 0);
        const p2Rot = new THREE.Euler(0, -Math.PI / 2, 0);

        this.player1 = new Player(1, p1Start, p1Rot);
        this.player2 = new Player(2, p2Start, p2Rot);

        this.musket1 = AssetGenerator.createMusket();
        this.musket2 = AssetGenerator.createMusket();

        this.player1.musket.setMesh(this.musket1);
        this.player2.musket.setMesh(this.musket2);

        this.renderer.addPlayerMusket(1, this.musket1);
        this.renderer.addPlayerMusket(2, this.musket2);

        const p1Canvas = document.getElementById('canvas-p1');
        const p2Canvas = document.getElementById('canvas-p2');

        p1Canvas.parentNode.insertBefore(this.renderer.renderer.domElement, p1Canvas);
        p1Canvas.style.display = 'none';
        p2Canvas.style.display = 'none';

        const flash1 = document.createElement('div');
        flash1.className = 'flash-overlay';
        document.getElementById('viewport-p1').appendChild(flash1);

        const flash2 = document.createElement('div');
        flash2.className = 'flash-overlay';
        document.getElementById('viewport-p2').appendChild(flash2);

        this.player1.setFlashElement(flash1);
        this.player2.setFlashElement(flash2);

        this.player1.setupInput(this.renderer.renderer.domElement);
        this.player2.setupInput(null);

        this.createHealthBars();

        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));

        this.pollGamepads();

        console.log('The Musket Duellists initialized');
        console.log('Player 1: WASD + Mouse (click to lock)');
        console.log('Player 2: Gamepad (preferred) or Arrow Keys + Numpad');
    },

    createHealthBars: function() {
        const p1Health = document.createElement('div');
        p1Health.className = 'health-bar';
        p1Health.innerHTML = '<div class="health-fill" id="health-p1" style="width: 100%"></div>';
        document.getElementById('viewport-p1').appendChild(p1Health);

        const p2Health = document.createElement('div');
        p2Health.className = 'health-bar';
        p2Health.innerHTML = '<div class="health-fill" id="health-p2" style="width: 100%"></div>';
        document.getElementById('viewport-p2').appendChild(p2Health);
    },

    pollGamepads: function() {
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i] && this.player2.gamepadIndex === -1) {
                this.player2.gamepadIndex = i;
                console.log('Gamepad auto-assigned to P2:', gamepads[i].id);
                break;
            }
        }
    },

    loop: function(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        this.player1.update(deltaTime, this.renderer.scene, this.player2);
        this.player2.update(deltaTime, this.renderer.scene, this.player1);

        this.renderer.updateMusketPosition(this.musket1, this.player1);
        this.renderer.updateMusketPosition(this.musket2, this.player2);

        this.updateUI();
        this.checkWinCondition();
        this.renderer.render(this.player1, this.player2);

        requestAnimationFrame(this.loop.bind(this));
    },

    updateUI: function() {
        this.stateP1.textContent = this.player1.musket.getStateDisplay();
        this.stateP1.className = 'musket-state ' + this.getStateClass(this.player1.musket.state);

        this.stateP2.textContent = this.player2.musket.getStateDisplay();
        this.stateP2.className = 'musket-state ' + this.getStateClass(this.player2.musket.state);

        const healthP1 = document.getElementById('health-p1');
        const healthP2 = document.getElementById('health-p2');
        if (healthP1) healthP1.style.width = this.player1.health + '%';
        if (healthP2) healthP2.style.width = this.player2.health + '%';
    },

    getStateClass: function(state) {
        if (state === 'ready') return 'ready';
        if (state === 'firing' || state === 'aiming') return '';
        return 'reloading';
    },

    checkWinCondition: function() {
        let winner = null;

        if (!this.player1.isAlive && this.player2.isAlive) {
            winner = 'PLAYER 2 WINS';
        } else if (!this.player2.isAlive && this.player1.isAlive) {
            winner = 'PLAYER 1 WINS';
        } else if (!this.player1.isAlive && !this.player2.isAlive) {
            winner = 'DOUBLE KILL - DRAW';
        }

        if (winner && !this.gameOverlay.classList.contains('active')) {
            this.winnerDisplay.textContent = winner;
            this.gameOverlay.classList.add('active');
        }
    },

    handleShot: function(shooter, target) {
        if (!shooter || !target || !shooter.isAlive) return;

        const shotData = shooter.fire();
        if (!shotData) return;

        this.renderer.addMuzzleFlash(shotData.origin, shotData.direction);

        const trajectory = Physics.calculateTrajectory(
            shotData.origin,
            shotData.direction,
            0.016
        );

        const hit = trajectory.checkCollision(this.renderer.scene, 200);

        if (hit) {
            this.renderer.addBulletTrail(shotData.origin, hit.point);

            if (target.position.distanceTo(hit.point) < 1.0) {
                const killed = target.takeDamage(100);
                console.log('Player', shooter.id, 'hit Player', target.id);
            } else {
                this.renderer.createHitEffect(hit.point);
            }
        } else {
            const endPoint = shotData.origin.clone().add(
                shotData.direction.clone().multiplyScalar(200)
            );
            this.renderer.addBulletTrail(shotData.origin, endPoint);
        }
    },

    reset: function() {
        const p1Start = new THREE.Vector3(-10, 0, 0);
        const p2Start = new THREE.Vector3(10, 0, 0);
        const p1Rot = new THREE.Euler(0, Math.PI / 2, 0);
        const p2Rot = new THREE.Euler(0, -Math.PI / 2, 0);

        this.player1.reset(p1Start, p1Rot);
        this.player2.reset(p2Start, p2Rot);

        this.musket1 = AssetGenerator.createMusket();
        this.musket2 = AssetGenerator.createMusket();
        this.player1.musket.setMesh(this.musket1);
        this.player2.musket.setMesh(this.musket2);
        this.renderer.addPlayerMusket(1, this.musket1);
        this.renderer.addPlayerMusket(2, this.musket2);

        this.renderer.clear();
        this.gameOverlay.classList.remove('active');
    }
};

window.addEventListener('keydown', (e) => {
    if (!Game.player1 || !Game.player2) return;
    if (e.code === 'KeyF') {
        Game.handleShot(Game.player1, Game.player2);
    }
});

const originalP1Fire = Player.prototype.fire;
Player.prototype.fire = function() {
    const result = originalP1Fire.call(this);
    if (result && this.id === 1) {
        Game.handleShot(Game.player1, Game.player2);
    } else if (result && this.id === 2) {
        Game.handleShot(Game.player2, Game.player1);
    }
    return result;
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof THREE !== 'undefined') {
            Game.init();
        } else {
            console.error('Three.js not loaded');
        }
    }, 100);
});
