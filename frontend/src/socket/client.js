// Socket.io client singleton
import { io } from 'socket.io-client'
import { getSessionId } from '../utils/session'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Socket metadata storage
const socketMeta = {
  roomId: null,
  sessionId: null
}

// Socket instance (lazy)
let socket = null

/**
 * Get or create socket instance with current sessionId
 */
function getSocket() {
  const currentSessionId = getSessionId()
  // If socket exists but sessionId changed, disconnect old socket
  if (socket && socket.connected) {
    const existingSessionId = socket.io.engine?.transport?.headers?.['x-session-id']
    if (existingSessionId !== currentSessionId) {
      socket.disconnect()
      socket = null
    }
  }
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      extraHeaders: {
        'x-session-id': currentSessionId
      }
    })
  }
  return socket
}

/**
 * Connect to a room and emit room:join
 * @param {string} roomId
 * @param {string} username
 * @returns {Socket} socket instance
 */
export function connectToRoom(roomId, username) {
  const currentSessionId = getSessionId()

  // Skip if already connected to the same room
  if (socket && socket.connected && socketMeta.roomId === roomId) {
    socket.emit('room:join', { roomId, username })
    return socket
  }

  socketMeta.roomId = roomId
  socketMeta.sessionId = currentSessionId

  // Disconnect existing socket if roomId changed
  if (socket && socket.connected) {
    socket.disconnect()
  }
  // Create new socket with current sessionId
  socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
    query: {
      sessionId: currentSessionId
    }
  })
  socket.connect()
  socket.emit('room:join', { roomId, username })
  return socket
}

/**
 * Get socket metadata
 */
export function getSocketMeta() {
  return socketMeta
}

/**
 * Get current socket instance (may be null if not connected yet)
 */
export function getSocketInstance() {
  return socket
}

/**
 * Disconnect from socket
 */
export function disconnect() {
  if (socket) {
    socket.disconnect()
  }
}

export default { connectToRoom, disconnect, getSocketMeta, getSocketInstance }
