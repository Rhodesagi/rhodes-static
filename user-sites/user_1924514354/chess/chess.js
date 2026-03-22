class ChessUI {
    constructor() {
        this.ws = null;
        this.loggedIn = false;
        this.username = null;
        this.userId = null;
        this.elo = 1500;
        this.color = null; // 'white' or 'black'
        this.gameId = null;
        this.boardState = null; // FEN
        this.moveHistory = [];
        this.selectedSquare = null;
        this.legalMoves = [];
        this.draggedPiece = null;
        this.capturedWhite = [];
        this.capturedBlack = [];
        this.whiteTime = 600;
        this.blackTime = 600;
        this.clockInterval = null;
        this.promotionPending = null; // {from, to}
        
        this.initEventListeners();
        this.initBoard();
        this.updateTimers();
    }
    
    initEventListeners() {
        document.getElementById('login-btn').addEventListener('click', () => this.login());
        document.getElementById('username').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('queue-btn').addEventListener('click', () => this.joinQueue());
        document.getElementById('leave-btn').addEventListener('click', () => this.leaveQueue());
        document.getElementById('resign-btn').addEventListener('click', () => this.resign());
        document.getElementById('offer-draw-btn').addEventListener('click', () => this.offerDraw());
        document.getElementById('spectate-btn').addEventListener('click', () => this.spectate());
        
        // Promotion modal
        document.querySelectorAll('.promotion-piece').forEach(el => {
            el.addEventListener('click', (e) => {
                const piece = e.target.dataset.piece;
                this.completePromotion(piece);
            });
        });
    }
    
    login() {
        const input = document.getElementById('username');
        const username = input.value.trim();
        if (!username) {
            alert('Please enter a username');
            return;
        }
        this.connectWebSocket(username);
    }
    
    connectWebSocket(username) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname === 'localhost' ? 'localhost:8080' : window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            this.ws.send(JSON.stringify({ type: 'login', username }));
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        this.ws.onclose = () => {
            console.log('WebSocket closed');
            this.loggedIn = false;
            this.updateUI();
        };
    }
    
    handleMessage(data) {
        console.log('Received:', data);
        switch (data.type) {
            case 'login_success':
                this.loggedIn = true;
                this.username = data.username;
                this.userId = data.user_id;
                this.elo = data.elo;
                this.updateUI();
                break;
            case 'queue_joined':
                document.getElementById('queue-status').textContent = 'Waiting for opponent...';
                document.getElementById('queue-btn').disabled = true;
                document.getElementById('leave-btn').disabled = false;
                break;
            case 'queue_timeout':
                document.getElementById('queue-status').textContent = 'Queue timeout, no opponent found.';
                document.getElementById('queue-btn').disabled = false;
                document.getElementById('leave-btn').disabled = true;
                break;
            case 'game_start':
                this.handleGameStart(data);
                break;
            case 'game_state':
                this.updateBoard(data);
                break;
            case 'time_update':
                this.whiteTime = data.white_time;
                this.blackTime = data.black_time;
                this.updateTimers();
                break;
            case 'game_over':
                this.handleGameOver(data);
                break;
            case 'error':
                alert('Error: ' + data.message);
                break;
        }
    }
    
    handleGameStart(data) {
        this.gameId = data.game_id;
        this.color = data.color;
        this.boardState = data.fen;
        this.whiteTime = data.white_time;
        this.blackTime = data.black_time;
        this.moveHistory = [];
        this.capturedWhite = [];
        this.capturedBlack = [];
        
        document.getElementById('game-id').textContent = data.game_id;
        document.getElementById('player-color').textContent = data.color;
        document.getElementById('white-player').textContent = data.white;
        document.getElementById('black-player').textContent = data.black;
        document.getElementById('game-result').textContent = '-';
        
        document.getElementById('queue-btn').disabled = true;
        document.getElementById('leave-btn').disabled = true;
        document.getElementById('resign-btn').disabled = false;
        document.getElementById('offer-draw-btn').disabled = false;
        document.getElementById('queue-status').textContent = 'In game';
        
        this.updateBoard({ fen: data.fen, move_history: [] });
        this.startClock();
    }
    
    updateBoard(data) {
        if (data.fen) this.boardState = data.fen;
        if (data.move_history) this.moveHistory = data.move_history;
        this.renderBoard();
        this.updateMoveHistory();
        this.updateCapturedPieces();
    }
    
    renderBoard() {
        const board = document.getElementById('chessboard');
        board.innerHTML = '';
        // Parse FEN
        const fen = this.boardState;
        const fenParts = fen.split(' ');
        const position = fenParts[0];
        const rows = position.split('/');
        
        for (let rank = 0; rank < 8; rank++) {
            const row = rows[rank];
            let file = 0;
            for (let ch of row) {
                if (isNaN(ch)) {
                    // piece
                    const piece = ch;
                    const squareId = String.fromCharCode(97 + file) + (8 - rank);
                    const square = this.createSquare(squareId, piece, rank, file);
                    board.appendChild(square);
                    file++;
                } else {
                    // empty squares
                    const emptyCount = parseInt(ch);
                    for (let i = 0; i < emptyCount; i++) {
                        const squareId = String.fromCharCode(97 + file) + (8 - rank);
                        const square = this.createSquare(squareId, null, rank, file);
                        board.appendChild(square);
                        file++;
                    }
                }
            }
        }
    }
    
    createSquare(squareId, piece, rank, file) {
        const square = document.createElement('div');
        square.className = `square ${(rank + file) % 2 === 0 ? 'light' : 'dark'}`;
        square.dataset.square = squareId;
        
        if (piece) {
            const pieceDiv = document.createElement('div');
            pieceDiv.className = 'piece';
            pieceDiv.dataset.piece = piece;
            pieceDiv.dataset.square = squareId;
            pieceDiv.textContent = this.getPieceSymbol(piece);
            pieceDiv.draggable = this.isMyPiece(piece);
            pieceDiv.addEventListener('dragstart', (e) => this.dragStart(e, squareId));
            pieceDiv.addEventListener('click', () => this.squareClick(squareId));
            square.appendChild(pieceDiv);
        }
        
        square.addEventListener('dragover', (e) => e.preventDefault());
        square.addEventListener('drop', (e) => this.drop(e, squareId));
        square.addEventListener('click', () => this.squareClick(squareId));
        
        return square;
    }
    
    getPieceSymbol(piece) {
        const map = {
            'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
            'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
        };
        return map[piece] || '';
    }
    
    isMyPiece(piece) {
        if (!this.color) return false;
        const isWhite = piece === piece.toUpperCase();
        return (this.color === 'white' && isWhite) || (this.color === 'black' && !isWhite);
    }
    
    dragStart(e, squareId) {
        if (!this.isMyTurn()) return;
        this.draggedPiece = squareId;
        e.dataTransfer.setData('text/plain', squareId);
    }
    
    drop(e, targetSquare) {
        e.preventDefault();
        if (!this.draggedPiece || !this.isMyTurn()) return;
        const from = this.draggedPiece;
        const to = targetSquare;
        this.draggedPiece = null;
        this.makeMove(from, to);
    }
    
    squareClick(squareId) {
        if (!this.isMyTurn()) return;
        if (this.selectedSquare) {
            // Try move
            this.makeMove(this.selectedSquare, squareId);
            this.selectedSquare = null;
            this.clearLegalHighlights();
        } else {
            // Select piece
            const piece = this.getPieceAt(squareId);
            if (piece && this.isMyPiece(piece)) {
                this.selectedSquare = squareId;
                this.highlightSquare(squareId);
                // TODO: fetch legal moves from server (we'll just allow any move for now)
            }
        }
    }
    
    makeMove(from, to) {
        // Check promotion
        const piece = this.getPieceAt(from);
        if (piece && (piece === 'P' || piece === 'p')) {
            const rank = to[1];
            if ((piece === 'P' && rank === '8') || (piece === 'p' && rank === '1')) {
                this.promotionPending = { from, to };
                this.showPromotionModal();
                return;
            }
        }
        this.sendMove(from, to);
    }
    
    sendMove(from, to, promotion = 'q') {
        const move = from + to + (promotion !== 'q' ? promotion : '');
        this.ws.send(JSON.stringify({ type: 'move', move }));
        this.selectedSquare = null;
        this.clearLegalHighlights();
    }
    
    showPromotionModal() {
        document.getElementById('promotion-modal').style.display = 'flex';
    }
    
    completePromotion(piece) {
        document.getElementById('promotion-modal').style.display = 'none';
        if (this.promotionPending) {
            this.sendMove(this.promotionPending.from, this.promotionPending.to, piece);
            this.promotionPending = null;
        }
    }
    
    isMyTurn() {
        if (!this.boardState) return false;
        const fenParts = this.boardState.split(' ');
        const turn = fenParts[1]; // 'w' or 'b'
        return (this.color === 'white' && turn === 'w') || (this.color === 'black' && turn === 'b');
    }
    
    getPieceAt(squareId) {
        const square = document.querySelector(`[data-square="${squareId}"] .piece`);
        return square ? square.dataset.piece : null;
    }
    
    highlightSquare(squareId) {
        document.querySelectorAll('.square').forEach(sq => sq.classList.remove('selected'));
        const square = document.querySelector(`[data-square="${squareId}"]`);
        if (square) square.classList.add('selected');
    }
    
    clearLegalHighlights() {
        document.querySelectorAll('.square').forEach(sq => sq.classList.remove('selected', 'legal-move'));
    }
    
    updateMoveHistory() {
        const container = document.getElementById('move-history');
        container.innerHTML = '';
        for (let i = 0; i < this.moveHistory.length; i += 2) {
            const moveNum = i / 2 + 1;
            const white = this.moveHistory[i];
            const black = this.moveHistory[i + 1] || '';
            const entry = document.createElement('div');
            entry.className = 'move-entry';
            entry.innerHTML = `<span>${moveNum}.</span> <span>${white}</span> <span>${black}</span>`;
            container.appendChild(entry);
        }
        container.scrollTop = container.scrollHeight;
    }
    
    updateCapturedPieces() {
        // Simple capture detection: compare piece counts
        // For now, just placeholder
        document.getElementById('captured-white').innerHTML = this.capturedWhite.map(p => 
            `<div class="captured-piece">${this.getPieceSymbol(p)}</div>`
        ).join('');
        document.getElementById('captured-black').innerHTML = this.capturedBlack.map(p => 
            `<div class="captured-piece">${this.getPieceSymbol(p)}</div>`
        ).join('');
    }
    
    startClock() {
        if (this.clockInterval) clearInterval(this.clockInterval);
        this.clockInterval = setInterval(() => {
            if (this.isMyTurn()) {
                // Server updates time, but we can decrement locally for smoothness
                // We'll just rely on server updates
            }
            this.updateTimers();
        }, 1000);
    }
    
    updateTimers() {
        const format = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        };
        document.getElementById('white-clock').textContent = format(this.whiteTime);
        document.getElementById('black-clock').textContent = format(this.blackTime);
    }
    
    handleGameOver(data) {
        document.getElementById('game-result').textContent = data.result;
        document.getElementById('resign-btn').disabled = true;
        document.getElementById('offer-draw-btn').disabled = true;
        document.getElementById('queue-btn').disabled = false;
        document.getElementById('leave-btn').disabled = true;
        document.getElementById('queue-status').textContent = 'Game over';
        if (this.clockInterval) clearInterval(this.clockInterval);
        alert(`Game over! Result: ${data.result}`);
    }
    
    joinQueue() {
        this.ws.send(JSON.stringify({ type: 'join_queue' }));
    }
    
    leaveQueue() {
        this.ws.send(JSON.stringify({ type: 'leave_queue' }));
    }
    
    resign() {
        if (confirm('Are you sure you want to resign?')) {
            this.ws.send(JSON.stringify({ type: 'resign' }));
        }
    }
    
    offerDraw() {
        this.ws.send(JSON.stringify({ type: 'offer_draw' }));
    }
    
    spectate() {
        const gameId = document.getElementById('spectate-id').value;
        if (!gameId) return;
        this.ws.send(JSON.stringify({ type: 'spectate', game_id: parseInt(gameId) }));
    }
    
    logout() {
        if (this.ws) this.ws.close();
        this.loggedIn = false;
        this.username = null;
        this.updateUI();
    }
    
    updateUI() {
        const loginPanel = document.getElementById('username').parentElement;
        const userInfo = document.getElementById('user-info');
        if (this.loggedIn) {
            loginPanel.style.display = 'none';
            userInfo.style.display = 'flex';
            document.getElementById('display-username').textContent = this.username;
            document.getElementById('elo').textContent = this.elo;
            document.getElementById('queue-btn').disabled = false;
            document.getElementById('leave-btn').disabled = true;
        } else {
            loginPanel.style.display = 'block';
            userInfo.style.display = 'none';
            document.getElementById('queue-btn').disabled = true;
            document.getElementById('leave-btn').disabled = true;
            document.getElementById('resign-btn').disabled = true;
            document.getElementById('offer-draw-btn').disabled = true;
        }
    }
    
    initBoard() {
        // Coordinates already in HTML
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.chessUI = new ChessUI();
});
