// casino_backend/db.js
// casino_backend/db.js
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

// Open (or create) the SQLite database
export async function openDb() {
    return open({
        filename: './casino.db',
        driver: sqlite3.Database
    });
}

// Create tables if they don't exist
export async function init() {
    const db = await openDb();

        await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT UNIQUE,   -- <--- add this
        username TEXT,
        email TEXT,
        coins INTEGER DEFAULT 250
    );

    CREATE TABLE IF NOT EXISTS game_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        game TEXT,
        score INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    `);

    return db;
}
