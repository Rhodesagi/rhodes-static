#!/usr/bin/env python3
"""
Real-time multiplayer chess server with WebSocket support.
Handles matchmaking, game state, timers, and spectators.
"""

import asyncio
import websockets
import json
import uuid
import copy
from datetime import datetime, timedelta
from typing import Dict, Set, Optional, List
from dataclasses import dataclass, field, asdict
from chess_logic import ChessBoard, Color, PieceType, Move
from database import Database
from pgn import generate_pgn, move_to_san

@dataclass
class PlayerConnection:
    websocket: websockets.WebSocketServerProtocol
    username: str
    elo: int
    in_game: Optional[str] = None
    color: Optional[Color] = None

@dataclass
class GameTimer:
    white_time: int  # seconds remaining
    black_time: int
    increment: int   # seconds added per move
    last_move_time: Optional[datetime] = None
    active_color: Optional[Color] = None
    
    def start(self, color: Color):
        self.active_color = color
        self.last_move_time = datetime.now()
    
    def switch_turn(self) -> bool:
        """Switch timer and return True if time expired."""
        if not self.last_move_time or not self.active_color:
            return False
        
        elapsed = (datetime.now() - self.last_move_time).total_seconds()
        
        if self.active_color == Color.WHITE:
            self.white_time -= int(elapsed)
            self.white_time += self.increment
            if self.white_time <= 0:
                self.white_time = 0
                return True
        else:
            self.black_time -= int(elapsed)
            self.black_time += self.increment
            if self.black_time <= 0:
                self.black_time = 0
                return True
        
        self.active_color = self.active_color.opposite()
        self.last_move_time = datetime.now()
        return False
    
    def get_times(self) -> Dict[str, int]:
        """Get current times accounting for elapsed time on active clock."""
        if not self.last_move_time or not self.active_color:
            return {"white": self.white_time, "black": self.black_time}
        
        elapsed = int((datetime.now() - self.last_move_time).total_seconds())
        
        if self.active_color == Color.WHITE:
            remaining = max(0, self.white_time - elapsed)
            return {"white": remaining, "black": self.black_time}
        else:
            remaining = max(0, self.black_time - elapsed)
            return {"white": self.white_time, "black": remaining}

@dataclass
class GameState:
    game_id: str
    board: ChessBoard
    white_player: str
    black_player: str
    white_socket: Optional[websockets.WebSocketServerProtocol] = None
    black_socket: Optional[websockets.WebSocketServerProtocol] = None
    spectators: Set[websockets.WebSocketServerProtocol] = field(default_factory=set)
    timer: Optional[GameTimer] = None
    status: str = "active"  # active, white_win, black_win, draw, abandoned
    result_reason: str = ""  # checkmate, timeout, resignation, draw_agreement, stalemate
    move_history_san: List[str] = field(default_factory=list)
    board_history: List[ChessBoard] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self, for_player: Optional[Color] = None) -> dict:
        """Convert game state to dictionary for JSON."""
        data = {
            "game_id": self.game_id,
            "board": self.board.to_dict(),
            "white_player": self.white_player,
            "black_player": self.black_player,
            "status": self.status,
            "turn": self.board.turn.value,
            "move_history": self.move_history_san,
            "spectator_count": len(self.spectators)
        }
        
        if self.timer:
            data["timer"] = self.timer.get_times()
        
        if for_player:
            data["your_color"] = for_player.value
            data["is_your_turn"] = self.board.turn == for_player
        
        return data

class ChessServer:
    def __init__(self):
        self.db = Database()
        self.connections: Dict[websockets.WebSocketServerProtocol, PlayerConnection] = {}
        self.games: Dict[str, GameState] = {}
        self.matchmaking_queue: List[PlayerConnection] = []
        self.username_to_connection: Dict[str, PlayerConnection] = {}
        
        # Game settings
        self.default_time = 600  # 10 minutes
        self.default_increment = 5  # 5 seconds
    
    async def register(self, websocket: websockets.WebSocketServerProtocol, username: str):
        """Register a new player connection."""
        # Get or create player in database
        player = self.db.get_or_create_player(username)
        
        conn = PlayerConnection(
            websocket=websocket,
            username=username,
            elo=player.elo
        )
        self.connections[websocket] = conn
        self.username_to_connection[username] = conn
        
        await self.send_message(websocket, {
            "type": "connected",
            "username": username,
            "elo": player.elo,
            "games_played": player.games_played
        })
    
    async def unregister(self, websocket: websockets.WebSocketServerProtocol):
        """Handle player disconnect."""
        if websocket not in self.connections:
            return
        
        conn = self.connections[websocket]
        
        # Remove from matchmaking queue
        if conn in self.matchmaking_queue:
            self.matchmaking_queue.remove(conn)
        
        # Handle disconnection from game
        if conn.in_game:
            await self.handle_player_disconnect(conn)
        
        del self.connections[websocket]
        if conn.username in self.username_to_connection:
            del self.username_to_connection[conn.username]
    
    async def handle_player_disconnect(self, conn: PlayerConnection):
        """Handle a player disconnecting from a game."""
        if not conn.in_game or conn.in_game not in self.games:
            return
        
        game = self.games[conn.in_game]
        
        # Only handle if game is still active
        if game.status != "active":
            return
        
        # Determine winner (opponent of disconnected player)
        if conn.color == Color.WHITE:
            winner_color = Color.BLACK
            winner_name = game.black_player
            game.status = "black_win"
        else:
            winner_color = Color.WHITE
            winner_name = game.white_player
            game.status = "white_win"
        
        game.result_reason = "abandonment"
        
        # Notify other player and spectators
        result_msg = {
            "type": "game_over",
            "result": game.status,
            "reason": f"{conn.username} disconnected",
            "winner": winner_name
        }
        
        await self.broadcast_to_game(game, result_msg)
        
        # Save game result
        await self.save_game_result(game)
    
    async def handle_message(self, websocket: websockets.WebSocketServerProtocol, message: str):
        """Handle incoming WebSocket message."""
        try:
            data = json.loads(message)
            msg_type = data.get("type")
            
            if msg_type == "register":
                await self.register(websocket, data.get("username", f"guest_{uuid.uuid4().hex[:8]}"))
            
            elif msg_type == "find_game":
                await self.handle_find_game(websocket)
            
            elif msg_type == "cancel_search":
                await self.handle_cancel_search(websocket)
            
            elif msg_type == "make_move":
                await self.handle_make_move(websocket, data)
            
            elif msg_type == "resign":
                await self.handle_resign(websocket)
            
            elif msg_type == "offer_draw":
                await self.handle_offer_draw(websocket)
            
            elif msg_type == "accept_draw":
                await self.handle_accept_draw(websocket)
            
            elif msg_type == "join_spectate":
                await self.handle_spectate(websocket, data.get("game_id"))
            
            elif msg_type == "leave_spectate":
                await self.handle_leave_spectate(websocket)
            
            elif msg_type == "get_leaderboard":
                await self.handle_leaderboard(websocket)
            
            elif msg_type == "get_game_history":
                await self.handle_game_history(websocket, data.get("username"))
            
            elif msg_type == "get_replay":
                await self.handle_get_replay(websocket, data.get("game_id"))
            
            else:
                await self.send_message(websocket, {"type": "error", "message": "Unknown message type"})
        
        except json.JSONDecodeError:
            await self.send_message(websocket, {"type": "error", "message": "Invalid JSON"})
        except Exception as e:
            print(f"Error handling message: {e}")
            await self.send_message(websocket, {"type": "error", "message": str(e)})
    
    async def handle_find_game(self, websocket: websockets.WebSocketServerProtocol):
        """Add player to matchmaking queue."""
        if websocket not in self.connections:
            await self.send_message(websocket, {"type": "error", "message": "Not registered"})
            return
        
        conn = self.connections[websocket]
        
        if conn.in_game:
            await self.send_message(websocket, {"type": "error", "message": "Already in game"})
            return
        
        if conn in self.matchmaking_queue:
            await self.send_message(websocket, {"type": "error", "message": "Already searching"})
            return
        
        self.matchmaking_queue.append(conn)
        await self.send_message(websocket, {"type": "searching", "position": len(self.matchmaking_queue)})
        
        # Try to match immediately
        await self.try_matchmaking()
    
    async def handle_cancel_search(self, websocket: websockets.WebSocketServerProtocol):
        """Remove player from matchmaking queue."""
        if websocket not in self.connections:
            return
        
        conn = self.connections[websocket]
        if conn in self.matchmaking_queue:
            self.matchmaking_queue.remove(conn)
            await self.send_message(websocket, {"type": "search_cancelled"})
    
    async def try_matchmaking(self):
        """Try to match players in queue."""
        while len(self.matchmaking_queue) >= 2:
            # Simple FIFO matching for now
            # Could be enhanced with ELO-based matching
            player1 = self.matchmaking_queue.pop(0)
            player2 = self.matchmaking_queue.pop(0)
            
            # Verify both still connected
            if player1.websocket not in self.connections or player2.websocket not in self.connections:
                # Put back valid player
                if player1.websocket in self.connections:
                    self.matchmaking_queue.insert(0, player1)
                if player2.websocket in self.connections:
                    self.matchmaking_queue.insert(0, player2)
                continue
            
            await self.start_game(player1, player2)
    
    async def start_game(self, white: PlayerConnection, black: PlayerConnection):
        """Start a new game between two players."""
        game_id = str(uuid.uuid4())
        
        game = GameState(
            game_id=game_id,
            board=ChessBoard(),
            white_player=white.username,
            black_player=black.username,
            white_socket=white.websocket,
            black_socket=black.websocket,
            timer=GameTimer(
                white_time=self.default_time,
                black_time=self.default_time,
                increment=self.default_increment
            )
        )
        
        self.games[game_id] = game
        
        white.in_game = game_id
        black.in_game = game_id
        white.color = Color.WHITE
        black.color = Color.BLACK
        
        # Start white's timer
        game.timer.start(Color.WHITE)
        
        # Notify both players
        await self.send_message(white.websocket, {
            "type": "game_start",
            "game_id": game_id,
            "color": "white",
            "opponent": black.username,
            "opponent_elo": black.elo,
            "game_state": game.to_dict(for_player=Color.WHITE)
        })
        
        await self.send_message(black.websocket, {
            "type": "game_start",
            "game_id": game_id,
            "color": "black",
            "opponent": white.username,
            "opponent_elo": white.elo,
            "game_state": game.to_dict(for_player=Color.BLACK)
        })
        
        # Start timer task
        asyncio.create_task(self.game_timer_task(game_id))
    
    async def game_timer_task(self, game_id: str):
        """Background task to handle game timers."""
        while game_id in self.games:
            game = self.games[game_id]
            
            if game.status != "active":
                break
            
            if game.timer:
                times = game.timer.get_times()
                
                # Check for timeout
                if times["white"] <= 0:
                    game.status = "black_win"
                    game.result_reason = "timeout"
                    await self.end_game(game)
                    break
                elif times["black"] <= 0:
                    game.status = "white_win"
                    game.result_reason = "timeout"
                    await self.end_game(game)
                    break
                
                # Broadcast timer update every second
                await self.broadcast_to_game(game, {
                    "type": "timer_update",
                    "times": times
                })
            
            await asyncio.sleep(1)
    
    async def handle_make_move(self, websocket: websockets.WebSocketServerProtocol, data: dict):
        """Handle a player making a move."""
        if websocket not in self.connections:
            return
        
        conn = self.connections[websocket]
        
        if not conn.in_game or conn.in_game not in self.games:
            await self.send_message(websocket, {"type": "error", "message": "Not in game"})
            return
        
        game = self.games[conn.in_game]
        
        if game.status != "active":
            await self.send_message(websocket, {"type": "error", "message": "Game not active"})
            return
        
        # Verify it's this player's turn
        if game.board.turn != conn.color:
            await self.send_message(websocket, {"type": "error", "message": "Not your turn"})
            return
        
        # Parse move
        from_sq = tuple(data.get("from"))
        to_sq = tuple(data.get("to"))
        promotion_str = data.get("promotion")
        
        promotion = None
        if promotion_str:
            promotion_map = {
                "queen": PieceType.QUEEN,
                "rook": PieceType.ROOK,
                "bishop": PieceType.BISHOP,
                "knight": PieceType.KNIGHT
            }
            promotion = promotion_map.get(promotion_str)
        
        # Validate and make move
        success, msg = game.board.make_move(from_sq, to_sq, promotion)
        
        if not success:
            await self.send_message(websocket, {"type": "error", "message": msg})
            return
        
        # Record move
        last_move = game.board.move_history[-1]
        game.board_history.append(copy.deepcopy(game.board))
        san = move_to_san(game.board, last_move)
        game.move_history_san.append(san)
        
        # Update timer
        time_expired = game.timer.switch_turn() if game.timer else False
        if time_expired:
            if conn.color == Color.WHITE:
                game.status = "black_win"
            else:
                game.status = "white_win"
            game.result_reason = "timeout"
            await self.end_game(game)
            return
        
        # Check for game end conditions
        await self.check_game_end(game)
        
        # Broadcast move to all players and spectators
        await self.broadcast_to_game(game, {
            "type": "move_made",
            "move": {"from": from_sq, "to": to_sq, "san": san},
            "game_state": game.to_dict()
        })
    
    async def check_game_end(self, game: GameState):
        """Check if the game has ended."""
        if game.status != "active":
            return
        
        current_color = game.board.turn
        
        # Check for checkmate or stalemate
        has_legal_moves = False
        for r in range(8):
            for c in range(8):
                piece = game.board.board[r][c]
                if piece and piece.color == current_color:
                    if game.board.get_legal_moves(r, c):
                        has_legal_moves = True
                        break
            if has_legal_moves:
                break
        
        if not has_legal_moves:
            if game.board.is_in_check(current_color):
                # Checkmate
                if current_color == Color.WHITE:
                    game.status = "black_win"
                else:
                    game.status = "white_win"
                game.result_reason = "checkmate"
            else:
                # Stalemate
                game.status = "draw"
                game.result_reason = "stalemate"
            
            await self.end_game(game)
            return
        
        # Check for 50-move rule
        if game.board.halfmove_clock >= 100:
            game.status = "draw"
            game.result_reason = "50-move rule"
            await self.end_game(game)
            return
    
    async def handle_resign(self, websocket: websockets.WebSocketServerProtocol):
        """Handle a player resigning."""
        if websocket not in self.connections:
            return
        
        conn = self.connections[websocket]
        
        if not conn.in_game or conn.in_game not in self.games:
            return
        
        game = self.games[conn.in_game]
        
        if game.status != "active":
            return
        
        if conn.color == Color.WHITE:
            game.status = "black_win"
        else:
            game.status = "white_win"
        
        game.result_reason = "resignation"
        
        await self.broadcast_to_game(game, {
            "type": "game_over",
            "result": game.status,
            "reason": f"{conn.username} resigned",
            "winner": game.black_player if conn.color == Color.WHITE else game.white_player
        })
        
        await self.end_game(game)
    
    async def handle_offer_draw(self, websocket: websockets.WebSocketServerProtocol):
        """Handle a draw offer."""
        if websocket not in self.connections:
            return
        
        conn = self.connections[websocket]
        
        if not conn.in_game or conn.in_game not in self.games:
            return
        
        game = self.games[conn.in_game]
        
        if game.status != "active":
            return
        
        # Notify opponent
        opponent_socket = game.black_socket if conn.color == Color.WHITE else game.white_socket
        if opponent_socket:
            await self.send_message(opponent_socket, {
                "type": "draw_offered",
                "by": conn.username
            })
    
    async def handle_accept_draw(self, websocket: websockets.WebSocketServerProtocol):
        """Handle accepting a draw offer."""
        if websocket not in self.connections:
            return
        
        conn = self.connections[websocket]
        
        if not conn.in_game or conn.in_game not in self.games:
            return
        
        game = self.games[conn.in_game]
        
        if game.status != "active":
            return
        
        game.status = "draw"
        game.result_reason = "agreement"
        
        await self.broadcast_to_game(game, {
            "type": "game_over",
            "result": "draw",
            "reason": "Draw by agreement"
        })
        
        await self.end_game(game)
    
    async def end_game(self, game: GameState):
        """End a game and clean up."""
        # Save to database
        await self.save_game_result(game)
        
        # Clean up player connections
        for conn in self.connections.values():
            if conn.in_game == game.game_id:
                conn.in_game = None
                conn.color = None
    
    async def save_game_result(self, game: GameState):
        """Save game result to database."""
        # Determine result string
        if game.status == "white_win":
            result = "1-0"
        elif game.status == "black_win":
            result = "0-1"
        elif game.status == "draw":
            result = "1/2-1/2"
        else:
            result = "*"
        
        # Generate PGN
        pgn = generate_pgn(
            white_player=game.white_player,
            black_player=game.black_player,
            result=result,
            moves=game.board.move_history,
            board_states=game.board_history
        )
        
        # Get ELOs before update
        white_elo = self.db.get_player(game.white_player).elo if self.db.get_player(game.white_player) else 1200
        black_elo = self.db.get_player(game.black_player).elo if self.db.get_player(game.black_player) else 1200
        
        # Save to database
        self.db.save_game(
            white_player=game.white_player,
            black_player=game.black_player,
            white_elo=white_elo,
            black_elo=black_elo,
            result=result,
            pgn=pgn
        )
        
        # Remove from active games after some time
        asyncio.create_task(self.delayed_game_cleanup(game.game_id))
    
    async def delayed_game_cleanup(self, game_id: str, delay: int = 300):
        """Remove game from active games after delay (for spectators)."""
        await asyncio.sleep(delay)
        if game_id in self.games:
            del self.games[game_id]
    
    async def handle_spectate(self, websocket: websockets.WebSocketServerProtocol, game_id: str):
        """Add a spectator to a game."""
        if not game_id or game_id not in self.games:
            await self.send_message(websocket, {"type": "error", "message": "Game not found"})
            return
        
        game = self.games[game_id]
        game.spectators.add(websocket)
        
        await self.send_message(websocket, {
            "type": "spectating",
            "game_id": game_id,
            "game_state": game.to_dict()
        })
    
    async def handle_leave_spectate(self, websocket: websockets.WebSocketServerProtocol):
        """Remove a spectator from a game."""
        for game in self.games.values():
            if websocket in game.spectators:
                game.spectators.remove(websocket)
                break
    
    async def handle_leaderboard(self, websocket: websockets.WebSocketServerProtocol):
        """Send leaderboard data."""
        players = self.db.get_leaderboard(limit=20)
        await self.send_message(websocket, {
            "type": "leaderboard",
            "players": [
                {
                    "username": p.username,
                    "elo": p.elo,
                    "games": p.games_played,
                    "wins": p.wins,
                    "losses": p.losses,
                    "draws": p.draws
                }
                for p in players
            ]
        })
    
    async def handle_game_history(self, websocket: websockets.WebSocketServerProtocol, username: str):
        """Send game history for a player."""
        if not username:
            if websocket in self.connections:
                username = self.connections[websocket].username
            else:
                return
        
        games = self.db.get_player_games(username, limit=20)
        await self.send_message(websocket, {
            "type": "game_history",
            "username": username,
            "games": [
                {
                    "id": g.id,
                    "white": g.white_player,
                    "black": g.black_player,
                    "result": g.result,
                    "played_at": g.played_at
                }
                for g in games
            ]
        })
    
    async def handle_get_replay(self, websocket: websockets.WebSocketServerProtocol, game_id: int):
        """Send PGN replay data."""
        game = self.db.get_game(game_id)
        if not game:
            await self.send_message(websocket, {"type": "error", "message": "Game not found"})
            return
        
        await self.send_message(websocket, {
            "type": "replay",
            "game_id": game_id,
            "pgn": game.pgn,
            "white": game.white_player,
            "black": game.black_player,
            "result": game.result
        })
    
    async def broadcast_to_game(self, game: GameState, message: dict):
        """Send message to both players and all spectators."""
        tasks = []
        
        if game.white_socket:
            tasks.append(self.send_message(game.white_socket, message))
        if game.black_socket:
            tasks.append(self.send_message(game.black_socket, message))
        
        for spectator in game.spectators:
            tasks.append(self.send_message(spectator, message))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def send_message(self, websocket: websockets.WebSocketServerProtocol, message: dict):
        """Send a JSON message to a websocket."""
        try:
            await websocket.send(json.dumps(message))
        except Exception as e:
            print(f"Error sending message: {e}")
    
    async def handler(self, websocket: websockets.WebSocketServerProtocol, path: str):
        """Main WebSocket connection handler."""
        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister(websocket)

async def main():
    server = ChessServer()
    
    print("Starting chess server on ws://0.0.0.0:8765")
    async with websockets.serve(server.handler, "0.0.0.0", 8765):
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())
