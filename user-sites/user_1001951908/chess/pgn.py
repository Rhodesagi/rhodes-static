"""
PGN (Portable Game Notation) generation and parsing for chess games.
"""

from typing import List, Optional, Tuple
from chess_logic import ChessBoard, Move, PieceType, Color

def square_to_algebraic(row: int, col: int) -> str:
    """Convert board coordinates to algebraic notation (e.g., 0,0 -> a8)."""
    files = 'abcdefgh'
    ranks = '87654321'
    return files[col] + ranks[row]

def algebraic_to_square(sq: str) -> Tuple[int, int]:
    """Convert algebraic notation to board coordinates (e.g., e4 -> 4,4)."""
    files = 'abcdefgh'
    ranks = '87654321'
    col = files.index(sq[0])
    row = ranks.index(sq[1])
    return (row, col)

def piece_to_letter(piece_type: PieceType) -> str:
    """Get piece letter for PGN notation."""
    letters = {
        PieceType.KING: 'K',
        PieceType.QUEEN: 'Q',
        PieceType.ROOK: 'R',
        PieceType.BISHOP: 'B',
        PieceType.KNIGHT: 'N',
        PieceType.PAWN: ''
    }
    return letters.get(piece_type, '')

def get_disambiguation(board: ChessBoard, move: Move) -> str:
    """
    Determine if disambiguation is needed for a move.
    Returns file, rank, or both if needed.
    """
    from_row, from_col = move.from_sq
    to_row, to_col = move.to_sq
    piece = board.board[from_row][from_col]
    
    if not piece or piece.piece_type == PieceType.PAWN:
        return ""
    
    # Find all pieces of same type and color that could move to the same square
    same_pieces = []
    for r in range(8):
        for c in range(8):
            p = board.board[r][c]
            if p and p.piece_type == piece.piece_type and p.color == piece.color and (r, c) != (from_row, from_col):
                # Check if this piece could legally move to the target
                valid, _ = board.is_valid_move((r, c), move.to_sq)
                if valid:
                    same_pieces.append((r, c))
    
    if not same_pieces:
        return ""
    
    # Check if file disambiguation is sufficient
    files = set(p[1] for p in same_pieces)
    if from_col not in files:
        return square_to_algebraic(from_row, from_col)[0]  # Just file
    
    # Check if rank disambiguation is sufficient
    ranks = set(p[0] for p in same_pieces)
    if from_row not in ranks:
        return square_to_algebraic(from_row, from_col)[1]  # Just rank
    
    # Both needed
    return square_to_algebraic(from_row, from_col)

def move_to_san(board: ChessBoard, move: Move) -> str:
    """Convert a move to Standard Algebraic Notation."""
    from_row, from_col = move.from_sq
    to_row, to_col = move.to_sq
    piece = board.board[from_row][from_col]
    
    if not piece:
        return "???"
    
    # Castling
    if move.is_castle_kingside:
        return "O-O"
    if move.is_castle_queenside:
        return "O-O-O"
    
    san = ""
    
    # Piece letter (except pawns)
    if piece.piece_type != PieceType.PAWN:
        san += piece_to_letter(piece.piece_type)
        san += get_disambiguation(board, move)
    
    # Capture
    if move.captured_piece or move.is_en_passant:
        if piece.piece_type == PieceType.PAWN:
            san += square_to_algebraic(from_row, from_col)[0]  # File of pawn
        san += "x"
    
    # Destination square
    san += square_to_algebraic(to_row, to_col)
    
    # Promotion
    if move.promotion:
        san += "=" + piece_to_letter(move.promotion)
    
    # Check or checkmate detection
    # We need to simulate the move to check
    import copy
    test_board = copy.deepcopy(board)
    test_board._execute_move(move)
    test_board.turn = piece.color.opposite()
    
    if test_board.is_in_check(piece.color.opposite()):
        # Check for checkmate
        has_legal_moves = False
        for r in range(8):
            for c in range(8):
                p = test_board.board[r][c]
                if p and p.color == piece.color.opposite():
                    if test_board.get_legal_moves(r, c):
                        has_legal_moves = True
                        break
            if has_legal_moves:
                break
        
        san += "#" if not has_legal_moves else "+"
    
    return san

def generate_pgn(white_player: str, black_player: str, result: str,
                 moves: List[Move], board_states: List[ChessBoard],
                 event: str = "Online Game", site: str = "Rhodes Chess",
                 date: Optional[str] = None) -> str:
    """
    Generate a complete PGN string from a game.
    
    Args:
        white_player: White player's username
        black_player: Black player's username
        result: Game result ("1-0", "0-1", "1/2-1/2", "*")
        moves: List of moves made
        board_states: List of board states after each move (for SAN generation)
        event: Event name
        site: Site name
        date: Date in YYYY.MM.DD format (defaults to today)
    """
    if date is None:
        from datetime import datetime
        date = datetime.now().strftime("%Y.%m.%d")
    
    pgn = f'[Event "{event}"]\n'
    pgn += f'[Site "{site}"]\n'
    pgn += f'[Date "{date}"]\n'
    pgn += f'[White "{white_player}"]\n'
    pgn += f'[Black "{black_player}"]\n'
    pgn += f'[Result "{result}"]\n\n'
    
    # Generate move text
    move_text = []
    for i, move in enumerate(moves):
        move_num = (i // 2) + 1
        is_white_move = i % 2 == 0
        
        if is_white_move:
            move_text.append(f"{move_num}.")
        
        # Use board state before move for SAN
        board = board_states[i] if i < len(board_states) else ChessBoard()
        san = move_to_san(board, move)
        move_text.append(san)
    
    # Add result
    move_text.append(result)
    
    # Format with line breaks every 10 moves
    formatted_moves = []
    current_line = []
    move_count = 0
    
    for token in move_text:
        current_line.append(token)
        if token in ["1-0", "0-1", "1/2-1/2", "*"]:
            break
        if "." in token and not token.endswith("."):
            move_count += 1
        if move_count >= 10:
            formatted_moves.append(" ".join(current_line))
            current_line = []
            move_count = 0
    
    if current_line:
        formatted_moves.append(" ".join(current_line))
    
    pgn += "\n".join(formatted_moves)
    
    return pgn

def parse_pgn_move(pgn_move: str, board: ChessBoard) -> Optional[Tuple[Tuple[int, int], Tuple[int, int], Optional[PieceType]]]:
    """
    Parse a SAN move and return (from_sq, to_sq, promotion).
    This is a simplified parser - full SAN parsing is complex.
    """
    pgn_move = pgn_move.strip().replace("+", "").replace("#", "")
    
    # Castling
    if pgn_move in ["O-O", "0-0"]:
        row = 0 if board.turn == Color.WHITE else 7
        return ((row, 4), (row, 6), None)
    if pgn_move in ["O-O-O", "0-0-0"]:
        row = 0 if board.turn == Color.WHITE else 7
        return ((row, 4), (row, 2), None)
    
    # Promotion
    promotion = None
    if "=" in pgn_move:
        parts = pgn_move.split("=")
        pgn_move = parts[0]
        promo_letter = parts[1][0].upper()
        letter_to_piece = {
            'Q': PieceType.QUEEN,
            'R': PieceType.ROOK,
            'B': PieceType.BISHOP,
            'N': PieceType.KNIGHT
        }
        promotion = letter_to_piece.get(promo_letter)
    
    # Parse destination square (last 2 chars, or last char after 'x')
    if "x" in pgn_move:
        parts = pgn_move.split("x")
        dest = parts[-1][-2:]
    else:
        dest = pgn_move[-2:]
    
    try:
        to_sq = algebraic_to_square(dest)
    except (ValueError, IndexError):
        return None
    
    # Determine piece type
    piece_type = PieceType.PAWN
    if pgn_move[0].isupper():
        letter_to_piece = {
            'K': PieceType.KING,
            'Q': PieceType.QUEEN,
            'R': PieceType.ROOK,
            'B': PieceType.BISHOP,
            'N': PieceType.KNIGHT
        }
        piece_type = letter_to_piece.get(pgn_move[0], PieceType.PAWN)
    
    # Find the piece that can make this move
    candidates = []
    for r in range(8):
        for c in range(8):
            piece = board.board[r][c]
            if piece and piece.piece_type == piece_type and piece.color == board.turn:
                valid, move = board.is_valid_move((r, c), to_sq, promotion)
                if valid and move:
                    candidates.append((r, c))
    
    if len(candidates) == 1:
        return (candidates[0], to_sq, promotion)
    elif len(candidates) > 1:
        # Disambiguation needed - use file/rank hints from pgn_move
        # This is simplified - full disambiguation is more complex
        for candidate in candidates:
            file_char = square_to_algebraic(candidate[0], candidate[1])[0]
            rank_char = square_to_algebraic(candidate[0], candidate[1])[1]
            if file_char in pgn_move or rank_char in pgn_move:
                return (candidate, to_sq, promotion)
        return (candidates[0], to_sq, promotion)
    
    return None
