import chess
import chess.pgn
import io

class ChessGame:
    def __init__(self, game_id, white_player, black_player):
        self.game_id = game_id
        self.white = white_player
        self.black = black_player
        self.board = chess.Board()
        self.move_history = []
        self.result = None
        self.pgn = None
        self.start_time = None
        self.last_move_time = None
        self.white_time = 600  # 10 minutes in seconds
        self.black_time = 600
        self.clock_active = 'white'  # whose turn, clock is ticking
    
    def apply_move(self, move_uci):
        """Apply a move in UCI format (e.g., 'e2e4'). Returns True if valid."""
        try:
            move = chess.Move.from_uci(move_uci)
            if move in self.board.legal_moves:
                self.board.push(move)
                self.move_history.append(move_uci)
                # switch clock
                if self.board.turn == chess.WHITE:
                    self.clock_active = 'white'
                else:
                    self.clock_active = 'black'
                return True
            else:
                return False
        except Exception:
            return False
    
    def get_fen(self):
        return self.board.fen()
    
    def is_game_over(self):
        return self.board.is_game_over()
    
    def get_result(self):
        if not self.is_game_over():
            return None
        if self.board.is_checkmate():
            if self.board.turn == chess.WHITE:
                return '0-1'  # black wins
            else:
                return '1-0'
        elif self.board.is_stalemate():
            return '1/2-1/2'
        elif self.board.is_insufficient_material():
            return '1/2-1/2'
        elif self.board.is_fifty_moves():
            return '1/2-1/2'
        elif self.board.is_repetition():
            return '1/2-1/2'
        else:
            return '*'
    
    def generate_pgn(self):
        """Generate PGN string of the game."""
        game = chess.pgn.Game()
        game.headers['Event'] = 'Online Chess'
        game.headers['Site'] = 'Rhodes Chess'
        game.headers['White'] = self.white
        game.headers['Black'] = self.black
        node = game
        for move_uci in self.move_history:
            move = chess.Move.from_uci(move_uci)
            node = node.add_variation(move)
        exporter = chess.pgn.StringExporter(headers=True, variations=False, comments=False)
        return game.accept(exporter)
    
    def update_clocks(self, elapsed_seconds):
        """Update clocks based on elapsed time."""
        if self.clock_active == 'white':
            self.white_time = max(0, self.white_time - elapsed_seconds)
        else:
            self.black_time = max(0, self.black_time - elapsed_seconds)
        if self.white_time <= 0 or self.black_time <= 0:
            self.result = '0-1' if self.white_time <= 0 else '1-0'
            return True  # flag time out
        return False

