// Socket.io client singleton
import { io } from 'socket.io-client'
import { getSessionId } from '../utils/session'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling']
})

/**
 * Connect to a room and emit room:join
 * @param {string} roomId
 * @param {string} username
 * @returns {Socket} socket instance
 */
export function connectToRoom(roomId, username) {
  const sessionId = getSessionId()
  socket.data.roomId = roomId
  socket.data.sessionId = sessionId
  socket.connect()
  socket.emit('room:join', { roomId, username })
  return socket
}

/**
 * Disconnect from socket
 */
export function disconnect() {
  socket.disconnect()
}

export default socket
