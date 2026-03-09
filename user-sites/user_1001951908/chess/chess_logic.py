"""
Complete chess move validation including all special moves.
Handles board state, move generation, and game rules.
"""

from enum import Enum
from typing import Optional, List, Tuple, Dict
from dataclasses import dataclass, field
import copy

class Color(Enum):
    WHITE = "white"
    BLACK = "black"
    
    def opposite(self) -> "Color":
        return Color.BLACK if self == Color.WHITE else Color.WHITE

class PieceType(Enum):
    KING = "king"
    QUEEN = "queen"
    ROOK = "rook"
    BISHOP = "bishop"
    KNIGHT = "knight"
    PAWN = "pawn"

@dataclass
class Piece:
    piece_type: PieceType
    color: Color
    
    def __str__(self):
        symbols = {
            (Color.WHITE, PieceType.KING): "♔",
            (Color.WHITE, PieceType.QUEEN): "♕",
            (Color.WHITE, PieceType.ROOK): "♖",
            (Color.WHITE, PieceType.BISHOP): "♗",
            (Color.WHITE, PieceType.KNIGHT): "♘",
            (Color.WHITE, PieceType.PAWN): "♙",
            (Color.BLACK, PieceType.KING): "♚",
            (Color.BLACK, PieceType.QUEEN): "♛",
            (Color.BLACK, PieceType.ROOK): "♜",
            (Color.BLACK, PieceType.BISHOP): "♝",
            (Color.BLACK, PieceType.KNIGHT): "♞",
            (Color.BLACK, PieceType.PAWN): "♟",
        }
        return symbols.get((self.color, self.piece_type), "?")

@dataclass
class Move:
    from_sq: Tuple[int, int]  # (row, col)
    to_sq: Tuple[int, int]
    promotion: Optional[PieceType] = None
    is_castle_kingside: bool = False
    is_castle_queenside: bool = False
    is_en_passant: bool = False
    captured_piece: Optional[Piece] = None

class ChessBoard:
    def __init__(self):
        self.board: List[List[Optional[Piece]]] = [[None] * 8 for _ in range(8)]
        self.turn: Color = Color.WHITE
        self.move_history: List[Move] = []
        self.captured_pieces: Dict[Color, List[Piece]] = {Color.WHITE: [], Color.BLACK: []}
        
        # Castling rights
        self.white_kingside_castle = True
        self.white_queenside_castle = True
        self.black_kingside_castle = True
        self.black_queenside_castle = True
        
        # En passant target
        self.en_passant_target: Optional[Tuple[int, int]] = None
        
        # Halfmove clock (for 50-move rule)
        self.halfmove_clock = 0
        
        # Full move number
        self.fullmove_number = 1
        
        self._setup_board()
    
    def _setup_board(self):
        # Set up pawns
        for col in range(8):
            self.board[1][col] = Piece(PieceType.PAWN, Color.WHITE)
            self.board[6][col] = Piece(PieceType.PAWN, Color.BLACK)
        
        # Set up pieces
        back_row = [PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
                    PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK]
        
        for col, piece_type in enumerate(back_row):
            self.board[0][col] = Piece(piece_type, Color.WHITE)
            self.board[7][col] = Piece(piece_type, Color.BLACK)
    
    def get_piece(self, row: int, col: int) -> Optional[Piece]:
        if 0 <= row < 8 and 0 <= col < 8:
            return self.board[row][col]
        return None
    
    def find_king(self, color: Color) -> Tuple[int, int]:
        for row in range(8):
            for col in range(8):
                piece = self.board[row][col]
                if piece and piece.piece_type == PieceType.KING and piece.color == color:
                    return (row, col)
        raise ValueError(f"No {color.value} king found")
    
    def is_square_attacked(self, row: int, col: int, by_color: Color) -> bool:
        """Check if a square is attacked by any piece of the given color."""
        for r in range(8):
            for c in range(8):
                piece = self.board[r][c]
                if piece and piece.color == by_color:
                    if self._can_piece_attack(r, c, row, col, piece):
                        return True
        return False
    
    def _can_piece_attack(self, from_row: int, from_col: int, to_row: int, to_col: int, piece: Piece) -> bool:
        """Check if a piece at from_sq can attack to_sq (ignores check)."""
        if piece.piece_type == PieceType.PAWN:
            direction = -1 if piece.color == Color.WHITE else 1
            return abs(to_col - from_col) == 1 and to_row == from_row + direction
        elif piece.piece_type == PieceType.KNIGHT:
            return (abs(to_row - from_row), abs(to_col - from_col)) in [(2, 1), (1, 2)]
        elif piece.piece_type == PieceType.KING:
            return max(abs(to_row - from_row), abs(to_col - from_col)) == 1
        elif piece.piece_type == PieceType.ROOK:
            return self._is_straight_line_clear(from_row, from_col, to_row, to_col)
        elif piece.piece_type == PieceType.BISHOP:
            return self._is_diagonal_clear(from_row, from_col, to_row, to_col)
        elif piece.piece_type == PieceType.QUEEN:
            return (self._is_straight_line_clear(from_row, from_col, to_row, to_col) or
                    self._is_diagonal_clear(from_row, from_col, to_row, to_col))
        return False
    
    def _is_straight_line_clear(self, from_row: int, from_col: int, to_row: int, to_col: int) -> bool:
        if from_row != to_row and from_col != to_col:
            return False
        
        dr = 0 if from_row == to_row else (1 if to_row > from_row else -1)
        dc = 0 if from_col == to_col else (1 if to_col > from_col else -1)
        
        r, c = from_row + dr, from_col + dc
        while (r, c) != (to_row, to_col):
            if self.board[r][c] is not None:
                return False
            r += dr
            c += dc
        return True
    
    def _is_diagonal_clear(self, from_row: int, from_col: int, to_row: int, to_col: int) -> bool:
        if abs(to_row - from_row) != abs(to_col - from_col):
            return False
        
        dr = 1 if to_row > from_row else -1
        dc = 1 if to_col > from_col else -1
        
        r, c = from_row + dr, from_col + dc
        while (r, c) != (to_row, to_col):
            if self.board[r][c] is not None:
                return False
            r += dr
            c += dc
        return True
    
    def is_in_check(self, color: Color) -> bool:
        king_pos = self.find_king(color)
        return self.is_square_attacked(king_pos[0], king_pos[1], color.opposite())
    
    def would_be_in_check(self, color: Color, move: Move) -> bool:
        """Test if making a move would leave the king in check."""
        test_board = copy.deepcopy(self)
        test_board._execute_move(move)
        return test_board.is_in_check(color)
    
    def _execute_move(self, move: Move):
        """Execute a move without validation (for internal use)."""
        piece = self.board[move.from_sq[0]][move.from_sq[1]]
        target = self.board[move.to_sq[0]][move.to_sq[1]]
        
        # Handle capture
        if target:
            self.captured_pieces[piece.color].append(target)
        
        # Handle en passant capture
        if move.is_en_passant:
            ep_row = move.from_sq[0]
            ep_col = move.to_sq[1]
            captured = self.board[ep_row][ep_col]
            if captured:
                self.captured_pieces[piece.color].append(captured)
            self.board[ep_row][ep_col] = None
        
        # Move piece
        self.board[move.to_sq[0]][move.to_sq[1]] = piece
        self.board[move.from_sq[0]][move.from_sq[1]] = None
        
        # Handle promotion
        if move.promotion:
            self.board[move.to_sq[0]][move.to_sq[1]] = Piece(move.promotion, piece.color)
        
        # Handle castling - move rook
        if move.is_castle_kingside:
            row = move.from_sq[0]
            self.board[row][5] = self.board[row][7]
            self.board[row][7] = None
        elif move.is_castle_queenside:
            row = move.from_sq[0]
            self.board[row][3] = self.board[row][0]
            self.board[row][0] = None
    
    def is_valid_move(self, from_sq: Tuple[int, int], to_sq: Tuple[int, int], 
                      promotion: Optional[PieceType] = None) -> Tuple[bool, Optional[Move]]:
        """Check if a move is valid and return the Move object if it is."""
        from_row, from_col = from_sq
        to_row, to_col = to_sq
        
        # Basic bounds check
        if not (0 <= from_row < 8 and 0 <= from_col < 8 and 0 <= to_row < 8 and 0 <= to_col < 8):
            return False, None
        
        piece = self.board[from_row][from_col]
        if not piece or piece.color != self.turn:
            return False, None
        
        target = self.board[to_row][to_col]
        if target and target.color == piece.color:
            return False, None
        
        move = Move(from_sq, to_sq, promotion)
        
        # Validate based on piece type
        if piece.piece_type == PieceType.PAWN:
            valid = self._validate_pawn_move(from_row, from_col, to_row, to_col, piece, move)
        elif piece.piece_type == PieceType.KNIGHT:
            valid = (abs(to_row - from_row), abs(to_col - from_col)) in [(2, 1), (1, 2)]
        elif piece.piece_type == PieceType.BISHOP:
            valid = self._is_diagonal_clear(from_row, from_col, to_row, to_col)
        elif piece.piece_type == PieceType.ROOK:
            valid = self._is_straight_line_clear(from_row, from_col, to_row, to_col)
        elif piece.piece_type == PieceType.QUEEN:
            valid = (self._is_straight_line_clear(from_row, from_col, to_row, to_col) or
                     self._is_diagonal_clear(from_row, from_col, to_row, to_col))
        elif piece.piece_type == PieceType.KING:
            valid = self._validate_king_move(from_row, from_col, to_row, to_col, piece, move)
        else:
            return False, None
        
        if not valid:
            return False, None
        
        # Check if move leaves king in check
        if self.would_be_in_check(piece.color, move):
            return False, None
        
        # Set captured piece in move
        if target:
            move.captured_piece = target
        
        return True, move
    
    def _validate_pawn_move(self, from_row: int, from_col: int, to_row: int, to_col: int, 
                           piece: Piece, move: Move) -> bool:
        direction = -1 if piece.color == Color.WHITE else 1
        start_row = 1 if piece.color == Color.WHITE else 6
        
        # Forward move
        if from_col == to_col:
            if to_row == from_row + direction and self.board[to_row][to_col] is None:
                # Check for promotion
                if to_row in [0, 7] and not move.promotion:
                    return False  # Must specify promotion piece
                return True
            # Double move from start
            if (from_row == start_row and to_row == from_row + 2 * direction and
                self.board[from_row + direction][from_col] is None and
                self.board[to_row][to_col] is None):
                return True
            return False
        
        # Capture
        if abs(to_col - from_col) == 1 and to_row == from_row + direction:
            target = self.board[to_row][to_col]
            # Normal capture
            if target and target.color != piece.color:
                if to_row in [0, 7] and not move.promotion:
                    return False
                return True
            # En passant
            if (to_row, to_col) == self.en_passant_target:
                move.is_en_passant = True
                return True
        
        return False
    
    def _validate_king_move(self, from_row: int, from_col: int, to_row: int, to_col: int,
                           piece: Piece, move: Move) -> bool:
        # Normal king move
        if max(abs(to_row - from_row), abs(to_col - from_col)) == 1:
            return True
        
        # Castling
        if from_row != to_row or abs(to_col - from_col) != 2:
            return False
        
        # Check if king is in check
        if self.is_in_check(piece.color):
            return False
        
        row = from_row
        if to_col > from_col:  # Kingside
            if piece.color == Color.WHITE and not self.white_kingside_castle:
                return False
            if piece.color == Color.BLACK and not self.black_kingside_castle:
                return False
            # Check squares are empty and not attacked
            if self.board[row][5] or self.board[row][6]:
                return False
            if self.is_square_attacked(row, 5, piece.color.opposite()):
                return False
            if self.is_square_attacked(row, 6, piece.color.opposite()):
                return False
            # Check rook is in place
            if not self.board[row][7] or self.board[row][7].piece_type != PieceType.ROOK:
                return False
            move.is_castle_kingside = True
            return True
        else:  # Queenside
            if piece.color == Color.WHITE and not self.white_queenside_castle:
                return False
            if piece.color == Color.BLACK and not self.black_queenside_castle:
                return False
            # Check squares are empty
            if self.board[row][1] or self.board[row][2] or self.board[row][3]:
                return False
            # Check squares are not attacked
            if self.is_square_attacked(row, 2, piece.color.opposite()):
                return False
            if self.is_square_attacked(row, 3, piece.color.opposite()):
                return False
            # Check rook is in place
            if not self.board[row][0] or self.board[row][0].piece_type != PieceType.ROOK:
                return False
            move.is_castle_queenside = True
            return True
    
    def make_move(self, from_sq: Tuple[int, int], to_sq: Tuple[int, int],
                  promotion: Optional[PieceType] = None) -> Tuple[bool, str]:
        """Make a move if valid. Returns (success, message)."""
        valid, move = self.is_valid_move(from_sq, to_sq, promotion)
        if not valid:
            return False, "Invalid move"
        
        piece = self.board[from_sq[0]][from_sq[1]]
        
        # Execute the move
        self._execute_move(move)
        
        # Update castling rights
        if piece.piece_type == PieceType.KING:
            if piece.color == Color.WHITE:
                self.white_kingside_castle = False
                self.white_queenside_castle = False
            else:
                self.black_kingside_castle = False
                self.black_queenside_castle = False
        elif piece.piece_type == PieceType.ROOK:
            if from_sq == (0, 0):
                self.white_queenside_castle = False
            elif from_sq == (0, 7):
                self.white_kingside_castle = False
            elif from_sq == (7, 0):
                self.black_queenside_castle = False
            elif from_sq == (7, 7):
                self.black_kingside_castle = False
        
        # Update en passant target
        if piece.piece_type == PieceType.PAWN and abs(to_sq[0] - from_sq[0]) == 2:
            self.en_passant_target = ((from_sq[0] + to_sq[0]) // 2, from_sq[1])
        else:
            self.en_passant_target = None
        
        # Update move counters
        if piece.piece_type == PieceType.PAWN or move.captured_piece:
            self.halfmove_clock = 0
        else:
            self.halfmove_clock += 1
        
        if piece.color == Color.BLACK:
            self.fullmove_number += 1
        
        # Record move
        self.move_history.append(move)
        self.turn = piece.color.opposite()
        
        return True, "Move successful"
    
    def get_legal_moves(self, row: int, col: int) -> List[Tuple[int, int]]:
        """Get all legal destination squares for a piece."""
        legal = []
        for r in range(8):
            for c in range(8):
                valid, _ = self.is_valid_move((row, col), (r, c))
                if valid:
                    legal.append((r, c))
        return legal
    
    def to_dict(self) -> dict:
        """Convert board state to dictionary for JSON serialization."""
        return {
            "board": [[str(p) if p else None for p in row] for row in self.board],
            "turn": self.turn.value,
            "captured": {
                "white": [str(p) for p in self.captured_pieces[Color.WHITE]],
                "black": [str(p) for p in self.captured_pieces[Color.BLACK]]
            },
            "castling": {
                "white_kingside": self.white_kingside_castle,
                "white_queenside": self.white_queenside_castle,
                "black_kingside": self.black_kingside_castle,
                "black_queenside": self.black_queenside_castle
            }
        }
