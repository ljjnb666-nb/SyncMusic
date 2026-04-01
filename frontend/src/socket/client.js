// Socket.io client singleton
import { io } from 'socket.io-client'
import { getSessionId } from '../utils/session'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Socket metadata storage (avoid socket.data which may be undefined)
const socketMeta = {
  roomId: null,
  sessionId: null
}

// Create socket with sessionId header
const sessionId = getSessionId()
const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
  extraHeaders: {
    'x-session-id': sessionId
  }
})

/**
 * Connect to a room and emit room:join
 * @param {string} roomId
 * @param {string} username
 * @returns {Socket} socket instance
 */
export function connectToRoom(roomId, username) {
  socketMeta.roomId = roomId
  socketMeta.sessionId = sessionId
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
 * Disconnect from socket
 */
export function disconnect() {
  socket.disconnect()
}

export default socket
