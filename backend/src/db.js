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

// Create participants table
db.exec(`
  CREATE TABLE IF NOT EXISTS participants (
    id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    username TEXT NOT NULL,
    is_host INTEGER NOT NULL DEFAULT 0,
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (id, room_id)
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

function roomExists(id) {
  const stmt = db.prepare('SELECT 1 FROM rooms WHERE id = ?')
  return !!stmt.get(id)
}

function deleteRoom(id) {
  const stmt = db.prepare('DELETE FROM rooms WHERE id = ?')
  return stmt.run(id)
}

function addParticipant({ id, roomId, username, isHost, joinedAt }) {
  const stmt = db.prepare('INSERT OR REPLACE INTO participants (id, room_id, username, is_host, joined_at) VALUES (?, ?, ?, ?, ?)')
  return stmt.run(id, roomId, username, isHost ? 1 : 0, joinedAt)
}

function removeParticipant(id, roomId) {
  const stmt = db.prepare('DELETE FROM participants WHERE id = ? AND room_id = ?')
  return stmt.run(id, roomId)
}

function getParticipants(roomId) {
  const stmt = db.prepare('SELECT * FROM participants WHERE room_id = ? ORDER BY joined_at ASC')
  return stmt.all(roomId)
}

function clearParticipants(roomId) {
  const stmt = db.prepare('DELETE FROM participants WHERE room_id = ?')
  return stmt.run(roomId)
}

export { db, createRoom, getRoom, deleteRoom, roomExists, addParticipant, removeParticipant, getParticipants, clearParticipants }
