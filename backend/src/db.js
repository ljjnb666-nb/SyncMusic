// SQLite database initialization for room metadata persistence
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../../data')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const DB_PATH = path.join(DATA_DIR, 'syncmusic.db')

// Create database instance
const db = new Database(DB_PATH)

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL')

// Create rooms table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    host_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`)

// Helper functions
function createRoom(id, name, hostId) {
  const stmt = db.prepare('INSERT INTO rooms (id, name, host_id, created_at) VALUES (?, ?, ?, ?)')
  return stmt.run(id, name, hostId, Date.now())
}

function getRoom(id) {
  const stmt = db.prepare('SELECT * FROM rooms WHERE id = ?')
  return stmt.get(id)
}

function deleteRoom(id) {
  const stmt = db.prepare('DELETE FROM rooms WHERE id = ?')
  return stmt.run(id)
}

export { db, createRoom, getRoom, deleteRoom }
