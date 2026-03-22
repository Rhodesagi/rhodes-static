import aiosqlite
import asyncio
import time

DB_PATH = 'chess.db'

async def init_db():
    """Initialize database tables."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                elo INTEGER DEFAULT 1500,
                games_played INTEGER DEFAULT 0,
                wins INTEGER DEFAULT 0,
                losses INTEGER DEFAULT 0,
                draws INTEGER DEFAULT 0
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                white_id INTEGER,
                black_id INTEGER,
                pgn TEXT,
                result TEXT,
                start_time REAL,
                end_time REAL,
                FOREIGN KEY (white_id) REFERENCES users (id),
                FOREIGN KEY (black_id) REFERENCES users (id)
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS moves (
                game_id INTEGER,
                move_number INTEGER,
                move_uci TEXT,
                timestamp REAL,
                FOREIGN KEY (game_id) REFERENCES games (id)
            )
        ''')
        await db.commit()

async def get_or_create_user(username):
    """Get user by username, create if doesn't exist."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            'SELECT id, username, elo FROM users WHERE username = ?',
            (username,)
        )
        row = await cursor.fetchone()
        if row:
            return {'id': row[0], 'username': row[1], 'elo': row[2]}
        else:
            await db.execute(
                'INSERT INTO users (username) VALUES (?)',
                (username,)
            )
            await db.commit()
            cursor = await db.execute(
                'SELECT id, username, elo FROM users WHERE username = ?',
                (username,)
            )
            row = await cursor.fetchone()
            return {'id': row[0], 'username': row[1], 'elo': row[2]}

async def update_elo(white_id, black_id, result):
    """Update ELO ratings after a game.
    result: '1-0' white win, '0-1' black win, '1/2-1/2' draw."""
    async with aiosqlite.connect(DB_PATH) as db:
        # Fetch current ratings
        cursor = await db.execute(
            'SELECT elo FROM users WHERE id IN (?, ?)',
            (white_id, black_id)
        )
        rows = await cursor.fetchall()
        white_elo = rows[0][0]
        black_elo = rows[1][0]
        
        # Expected scores
        expected_white = 1 / (1 + 10 ** ((black_elo - white_elo) / 400))
        expected_black = 1 - expected_white
        
        # Actual scores
        if result == '1-0':
            actual_white, actual_black = 1, 0
        elif result == '0-1':
            actual_white, actual_black = 0, 1
        else:
            actual_white, actual_black = 0.5, 0.5
        
        # K-factor (can be adjusted)
        K = 32
        new_white_elo = white_elo + K * (actual_white - expected_white)
        new_black_elo = black_elo + K * (actual_black - expected_black)
        
        # Update database
        await db.execute(
            'UPDATE users SET elo = ?, games_played = games_played + 1, '
            'wins = wins + ?, losses = losses + ?, draws = draws + ? WHERE id = ?',
            (new_white_elo,
             1 if actual_white == 1 else 0,
             1 if actual_white == 0 else 0,
             1 if actual_white == 0.5 else 0,
             white_id)
        )
        await db.execute(
            'UPDATE users SET elo = ?, games_played = games_played + 1, '
            'wins = wins + ?, losses = losses + ?, draws = draws + ? WHERE id = ?',
            (new_black_elo,
             1 if actual_black == 1 else 0,
             1 if actual_black == 0 else 0,
             1 if actual_black == 0.5 else 0,
             black_id)
        )
        await db.commit()

async def save_game(white_id, black_id, pgn, result, start_time, end_time):
    """Save finished game to database."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            'INSERT INTO games (white_id, black_id, pgn, result, start_time, end_time) '
            'VALUES (?, ?, ?, ?, ?, ?)',
            (white_id, black_id, pgn, result, start_time, end_time)
        )
        game_id = cursor.lastrowid
        await db.commit()
        return game_id

async def save_move(game_id, move_number, move_uci):
    """Save a move to database."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            'INSERT INTO moves (game_id, move_number, move_uci, timestamp) '
            'VALUES (?, ?, ?, ?)',
            (game_id, move_number, move_uci, time.time())
        )
        await db.commit()

async def get_user_stats(username):
    """Get user stats."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            'SELECT elo, games_played, wins, losses, draws FROM users WHERE username = ?',
            (username,)
        )
        row = await cursor.fetchone()
        if row:
            return {
                'elo': row[0],
                'games_played': row[1],
                'wins': row[2],
                'losses': row[3],
                'draws': row[4]
            }
        else:
            return None

if __name__ == '__main__':
    asyncio.run(init_db())
