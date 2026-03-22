import aiohttp
import asyncio
import json
import time
import logging
import chess
from aiohttp import web
from chess_logic import ChessGame
from database import init_db, get_or_create_user, update_elo, save_game, save_move
from matchmaking import MatchmakingQueue

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChessServer:
    def __init__(self):
        self.games = {}  # game_id -> ChessGame
        self.players = {}  # websocket -> player info
        self.game_of_player = {}  # websocket -> game_id
        self.spectators = {}  # game_id -> set of websockets
        self.matchmaking = MatchmakingQueue()
        self.game_counter = 0
    
    async def handle_websocket(self, request):
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        
        # Wait for login message
        try:
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    if data.get('type') == 'login':
                        username = data.get('username')
                        if not username:
                            await ws.send_json({'type': 'error', 'message': 'Username required'})
                            await ws.close()
                            break
                        user = await get_or_create_user(username)
                        self.players[ws] = {
                            'user_id': user['id'],
                            'username': user['username'],
                            'elo': user['elo']
                        }
                        await ws.send_json({
                            'type': 'login_success',
                            'user_id': user['id'],
                            'username': user['username'],
                            'elo': user['elo']
                        })
                        break
                    else:
                        await ws.send_json({'type': 'error', 'message': 'First message must be login'})
                        await ws.close()
                        break
                else:
                    break
        except Exception as e:
            logger.error(f"Login error: {e}")
            await ws.close()
            return ws
        
        # Main message loop
        try:
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    await self.handle_message(ws, msg.data)
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    logger.error(f"WebSocket error: {ws.exception()}")
        except Exception as e:
            logger.error(f"Error in connection: {e}")
        finally:
            await self.cleanup_connection(ws)
        return ws
    
    async def handle_message(self, ws, raw):
        try:
            data = json.loads(raw)
            msg_type = data.get('type')
            
            if msg_type == 'join_queue':
                await self.join_queue(ws)
            
            elif msg_type == 'leave_queue':
                await self.leave_queue(ws)
            
            elif msg_type == 'move':
                game_id = self.game_of_player.get(ws)
                if not game_id:
                    await ws.send_json({'type': 'error', 'message': 'Not in a game'})
                    return
                game = self.games.get(game_id)
                if not game:
                    await ws.send_json({'type': 'error', 'message': 'Game not found'})
                    return
                move_uci = data.get('move')
                if not move_uci:
                    return
                # Validate turn
                player_info = self.players[ws]
                if (player_info['username'] == game.white and game.board.turn != chess.WHITE) or \
                   (player_info['username'] == game.black and game.board.turn != chess.BLACK):
                    await ws.send_json({'type': 'error', 'message': 'Not your turn'})
                    return
                # Apply move
                success = game.apply_move(move_uci)
                if success:
                    # Broadcast move to all players and spectators
                    await self.broadcast_game_state(game_id)
                    # Save move to database
                    await save_move(game_id, len(game.move_history), move_uci)
                    # Check game over
                    if game.is_game_over():
                        result = game.get_result()
                        await self.end_game(game_id, result)
                else:
                    await ws.send_json({'type': 'error', 'message': 'Invalid move'})
            
            elif msg_type == 'offer_draw':
                # Not implemented for simplicity
                pass
            
            elif msg_type == 'resign':
                game_id = self.game_of_player.get(ws)
                if game_id:
                    player = self.players[ws]
                    game = self.games[game_id]
                    result = '1-0' if player['username'] == game.black else '0-1'
                    await self.end_game(game_id, result)
            
            elif msg_type == 'spectate':
                game_id = data.get('game_id')
                if game_id in self.games:
                    self.spectators.setdefault(game_id, set()).add(ws)
                    await self.send_game_state(ws, game_id)
                else:
                    await ws.send_json({'type': 'error', 'message': 'Game not found'})
            
            else:
                logger.warning(f"Unknown message type: {msg_type}")
        except json.JSONDecodeError:
            logger.error("Invalid JSON")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def join_queue(self, ws):
        player = self.players.get(ws)
        if not player:
            await ws.send_json({'type': 'error', 'message': 'Not logged in'})
            return
        # Already in a game?
        if ws in self.game_of_player:
            await ws.send_json({'type': 'error', 'message': 'Already in a game'})
            return
        future = await self.matchmaking.join_queue(
            player['user_id'], player['username'], player['elo']
        )
        await ws.send_json({'type': 'queue_joined'})
        # Wait for match
        match = await future
        if match is None:
            await ws.send_json({'type': 'queue_timeout'})
            return
        opponent_id, opponent_username, color = match
        # Create game
        self.game_counter += 1
        game_id = self.game_counter
        white = player['username'] if color == 'white' else opponent_username
        black = opponent_username if color == 'white' else player['username']
        game = ChessGame(game_id, white, black)
        game.start_time = time.time()
        self.games[game_id] = game
        
        # Find opponent websocket (could be multiple connections, we need to find by username)
        opponent_ws = None
        for sock, info in self.players.items():
            if info['username'] == opponent_username:
                opponent_ws = sock
                break
        
        # Map websockets to game
        self.game_of_player[ws] = game_id
        if opponent_ws:
            self.game_of_player[opponent_ws] = game_id
        
        # Notify both players
        await ws.send_json({
            'type': 'game_start',
            'game_id': game_id,
            'color': color,
            'white': white,
            'black': black,
            'white_time': game.white_time,
            'black_time': game.black_time,
            'fen': game.get_fen()
        })
        if opponent_ws:
            await opponent_ws.send_json({
                'type': 'game_start',
                'game_id': game_id,
                'color': 'white' if color == 'black' else 'black',
                'white': white,
                'black': black,
                'white_time': game.white_time,
                'black_time': game.black_time,
                'fen': game.get_fen()
            })
        
        # Start clock task
        asyncio.create_task(self.clock_tick(game_id))
    
    async def leave_queue(self, ws):
        player = self.players.get(ws)
        if player:
            await self.matchmaking.leave_queue(player['user_id'])
            await ws.send_json({'type': 'queue_left'})
    
    async def clock_tick(self, game_id):
        """Background task that updates clocks and broadcasts."""
        while game_id in self.games:
            game = self.games[game_id]
            if game.is_game_over():
                break
            start = time.time()
            await asyncio.sleep(1)  # tick every second
            elapsed = time.time() - start
            timeout = game.update_clocks(elapsed)
            if timeout:
                result = '0-1' if game.white_time <= 0 else '1-0'
                await self.end_game(game_id, result)
                break
            # Broadcast time update every second
            await self.broadcast_time(game_id)
    
    async def broadcast_time(self, game_id):
        game = self.games.get(game_id)
        if not game:
            return
        msg = {
            'type': 'time_update',
            'white_time': game.white_time,
            'black_time': game.black_time
        }
        await self.broadcast_to_game(game_id, msg)
    
    async def broadcast_game_state(self, game_id):
        game = self.games.get(game_id)
        if not game:
            return
        msg = {
            'type': 'game_state',
            'fen': game.get_fen(),
            'move_history': game.move_history,
            'white_time': game.white_time,
            'black_time': game.black_time,
            'turn': 'white' if game.board.turn == chess.WHITE else 'black',
            'result': game.get_result() if game.is_game_over() else None
        }
        await self.broadcast_to_game(game_id, msg)
    
    async def broadcast_to_game(self, game_id, msg):
        # Send to players
        for ws, gid in list(self.game_of_player.items()):
            if gid == game_id:
                try:
                    await ws.send_json(msg)
                except Exception:
                    pass
        # Send to spectators
        for ws in self.spectators.get(game_id, set()):
            try:
                await ws.send_json(msg)
            except Exception:
                pass
    
    async def send_game_state(self, ws, game_id):
        game = self.games.get(game_id)
        if not game:
            await ws.send_json({'type': 'error', 'message': 'Game not found'})
            return
        await ws.send_json({
            'type': 'game_state',
            'fen': game.get_fen(),
            'move_history': game.move_history,
            'white_time': game.white_time,
            'black_time': game.black_time,
            'turn': 'white' if game.board.turn == chess.WHITE else 'black',
            'result': game.get_result() if game.is_game_over() else None
        })
    
    async def end_game(self, game_id, result):
        game = self.games.get(game_id)
        if not game:
            return
        game.result = result
        pgn = game.generate_pgn()
        end_time = time.time()
        # Save to database
        white_id = None
        black_id = None
        for ws, info in self.players.items():
            if info['username'] == game.white:
                white_id = info['user_id']
            if info['username'] == game.black:
                black_id = info['user_id']
        if white_id and black_id:
            await save_game(white_id, black_id, pgn, result, game.start_time, end_time)
            await update_elo(white_id, black_id, result)
        # Broadcast result
        await self.broadcast_to_game(game_id, {
            'type': 'game_over',
            'result': result,
            'pgn': pgn
        })
        # Cleanup
        for ws, gid in list(self.game_of_player.items()):
            if gid == game_id:
                del self.game_of_player[ws]
        self.spectators.pop(game_id, None)
        self.games.pop(game_id, None)
    
    async def cleanup_connection(self, ws):
        player = self.players.pop(ws, None)
        if player:
            # Remove from queue
            await self.matchmaking.leave_queue(player['user_id'])
            # If in game, resign
            game_id = self.game_of_player.pop(ws, None)
            if game_id and game_id in self.games:
                game = self.games[game_id]
                if player['username'] in (game.white, game.black):
                    result = '1-0' if player['username'] == game.black else '0-1'
                    await self.end_game(game_id, result)
        # Remove from spectators
        for game_id, spectators in list(self.spectators.items()):
            if ws in spectators:
                spectators.remove(ws)
                if not spectators:
                    del self.spectators[game_id]

async def start_background_tasks(app):
    # Initialize database
    await init_db()
    # No other background tasks needed

async def index(request):
    return web.FileResponse('index.html')

app = web.Application()
server = ChessServer()

app.router.add_get('/ws', server.handle_websocket)
app.router.add_get('/', index)
app.router.add_static('/', path='./', show_index=True)

app.on_startup.append(start_background_tasks)

if __name__ == '__main__':
    web.run_app(app, host='0.0.0.0', port=8080)

