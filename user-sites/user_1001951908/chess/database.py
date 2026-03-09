"""
SQLite database for ELO ratings and game history.
"""

import sqlite3
import json
from datetime import datetime
from typing import Optional, List, Dict, Tuple
from dataclasses import dataclass
import threading

@dataclass
class Player:
    id: int
    username: str
    elo: int
    games_played: int
    wins: int
    losses: int
    draws: int
    created_at: str

@dataclass
class GameRecord:
    id: int
    white_player: str
    black_player: str
    white_elo: int
    black_elo: int
    result: str  # "1-0", "0-1", "1/2-1/2"
    pgn: str
    played_at: str
    final_fen: Optional[str] = None

class Database:
    def __init__(self, db_path: str = "chess.db"):
        self.db_path = db_path
        self._local = threading.local()
        self._init_db()
    
    def _get_conn(self) -> sqlite3.Connection:
        if not hasattr(self._local, 'conn') or self._local.conn is None:
            self._local.conn = sqlite3.connect(self.db_path)
            self._local.conn.row_factory = sqlite3.Row
        return self._local.conn
    
    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Players table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS players (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                elo INTEGER DEFAULT 1200,
                games_played INTEGER DEFAULT 0,
                wins INTEGER DEFAULT 0,
                losses INTEGER DEFAULT 0,
                draws INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Games table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                white_player TEXT NOT NULL,
                black_player TEXT NOT NULL,
                white_elo INTEGER NOT NULL,
                black_elo INTEGER NOT NULL,
                result TEXT NOT NULL,
                pgn TEXT NOT NULL,
                final_fen TEXT,
                played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
    
    def get_or_create_player(self, username: str) -> Player:
        """Get existing player or create new one with default ELO 1200."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM players WHERE username = ?", (username,))
        row = cursor.fetchone()
        
        if row:
            return Player(**dict(row))
        
        # Create new player
        cursor.execute(
            "INSERT INTO players (username, elo) VALUES (?, ?)",
            (username, 1200)
        )
        conn.commit()
        
        cursor.execute("SELECT * FROM players WHERE username = ?", (username,))
        row = cursor.fetchone()
        return Player(**dict(row))
    
    def get_player(self, username: str) -> Optional[Player]:
        """Get player by username."""
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM players WHERE username = ?", (username,))
        row = cursor.fetchone()
        return Player(**dict(row)) if row else None
    
    def get_leaderboard(self, limit: int = 20) -> List[Player]:
        """Get top players by ELO."""
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM players ORDER BY elo DESC LIMIT ?",
            (limit,)
        )
        return [Player(**dict(row)) for row in cursor.fetchall()]
    
    def update_elo(self, white_username: str, black_username: str, result: str) -> Tuple[int, int]:
        """
        Update ELO ratings after a game.
        Result: "1-0" (white wins), "0-1" (black wins), "1/2-1/2" (draw)
        Returns: (new_white_elo, new_black_elo)
        """
        conn = self._get_conn()
        cursor = conn.cursor()
        
        white = self.get_player(white_username)
        black = self.get_player(black_username)
        
        if not white or not black:
            raise ValueError("Players not found")
        
        # Calculate ELO changes
        K = 32  # K-factor
        
        expected_white = 1 / (1 + 10 ** ((black.elo - white.elo) / 400))
        expected_black = 1 / (1 + 10 ** ((white.elo - black.elo) / 400))
        
        if result == "1-0":
            actual_white, actual_black = 1, 0
            white_wins, white_losses = 1, 0
            black_wins, black_losses = 0, 1
            white_draws, black_draws = 0, 0
        elif result == "0-1":
            actual_white, actual_black = 0, 1
            white_wins, white_losses = 0, 1
            black_wins, black_losses = 1, 0
            white_draws, black_draws = 0, 0
        else:  # Draw
            actual_white, actual_black = 0.5, 0.5
            white_wins, white_losses = 0, 0
            black_wins, black_losses = 0, 0
            white_draws, black_draws = 1, 1
        
        new_white_elo = int(white.elo + K * (actual_white - expected_white))
        new_black_elo = int(black.elo + K * (actual_black - expected_black))
        
        # Update players
        cursor.execute("""
            UPDATE players 
            SET elo = ?, games_played = games_played + 1, 
                wins = wins + ?, losses = losses + ?, draws = draws + ?
            WHERE username = ?
        """, (new_white_elo, white_wins, white_losses, white_draws, white_username))
        
        cursor.execute("""
            UPDATE players 
            SET elo = ?, games_played = games_played + 1, 
                wins = wins + ?, losses = losses + ?, draws = draws + ?
            WHERE username = ?
        """, (new_black_elo, black_wins, black_losses, black_draws, black_username))
        
        conn.commit()
        return new_white_elo, new_black_elo
    
    def save_game(self, white_player: str, black_player: str, white_elo: int, 
                  black_elo: int, result: str, pgn: str, final_fen: Optional[str] = None) -> int:
        """Save a completed game and return game ID."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO games (white_player, black_player, white_elo, black_elo, result, pgn, final_fen)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (white_player, black_player, white_elo, black_elo, result, pgn, final_fen))
        
        game_id = cursor.lastrowid
        conn.commit()
        
        # Update ELO ratings
        self.update_elo(white_player, black_player, result)
        
        return game_id
    
    def get_game(self, game_id: int) -> Optional[GameRecord]:
        """Get game by ID."""
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM games WHERE id = ?", (game_id,))
        row = cursor.fetchone()
        return GameRecord(**dict(row)) if row else None
    
    def get_player_games(self, username: str, limit: int = 20) -> List[GameRecord]:
        """Get games for a specific player."""
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM games 
            WHERE white_player = ? OR black_player = ?
            ORDER BY played_at DESC
            LIMIT ?
        """, (username, username, limit))
        return [GameRecord(**dict(row)) for row in cursor.fetchall()]
    
    def get_recent_games(self, limit: int = 20) -> List[GameRecord]:
        """Get recent games."""
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM games ORDER BY played_at DESC LIMIT ?",
            (limit,)
        )
        return [GameRecord(**dict(row)) for row in cursor.fetchall()]
