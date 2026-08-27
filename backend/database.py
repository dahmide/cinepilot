"""
SQLite database for CinePilot auth.
Handles user creation and lookup — kept separate from ClickHouse
since ClickHouse is OLAP and not suited for row-level user operations.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "cinepilot.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id       TEXT PRIMARY KEY,
            username      TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at    TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def get_user_by_username(username: str):
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM users WHERE username = ?", (username,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: str):
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM users WHERE user_id = ?", (user_id,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def create_user(user_id: str, username: str, password_hash: str, created_at: str):
    conn = get_connection()
    conn.execute(
        "INSERT INTO users (user_id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
        (user_id, username, password_hash, created_at),
    )
    conn.commit()
    conn.close()
