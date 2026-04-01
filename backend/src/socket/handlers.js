// Socket.io handlers for room events
import { nanoid } from 'nanoid'
import { RoomManager } from '../state/roomManager.js'
import { getRoom, roomExists } from '../services/roomService.js'
import { deleteRoom } from '../db.js'

function handleJoin(io, socket, { roomId, username }) {
  // Validate room exists
  if (!roomExists(roomId)) {
    socket.emit('error', { message: 'Room not found' })
    return
  }

  const room = RoomManager.get(roomId)
  if (!room) {
    socket.emit('error', { message: 'Room not found' })
    return
  }

  // Use sessionId from header if available, otherwise generate
  // Frontend sends x-session-id header when connecting via Socket.io
  let userId = socket.handshake.headers['x-session-id'] || socket.data.userId
  if (!userId) {
    userId = nanoid(8)
  }
  socket.data.userId = userId
  socket.data.roomId = roomId

  // Create participant
  const participant = {
    id: userId,
    username: username || 'Guest' + nanoid(4).slice(0, 4),
    joinedAt: Date.now(),
    isHost: false
  }

  // Add to room
  room.participants.push(participant)

  // Join Socket.io room
  socket.join(roomId)

  // Emit room:state to joining user (FULL room first)
  socket.emit('room:state', room)

  // Emit room:join to others
  socket.to(roomId).emit('room:join', { userId, username: participant.username })
}

function handleDisconnect(io, socket, reason) {
  const { roomId, userId } = socket.data

  if (!roomId) {
    return // Wasn't in a room
  }

  const room = RoomManager.get(roomId)
  if (!room) {
    return
  }

  // Find and remove participant
  const participantIndex = room.participants.findIndex(p => p.id === userId)
  if (participantIndex === -1) {
    return
  }

  const wasHost = room.participants[participantIndex].isHost
  room.participants.splice(participantIndex, 1)

  // Emit room:leave to others
  socket.to(roomId).emit('room:leave', { userId })

  // Host transfer: if host left and participants remain
  if (wasHost && room.participants.length > 0) {
    // Sort by joinedAt ascending (oldest first)
    room.participants.sort((a, b) => a.joinedAt - b.joinedAt)
    const newHost = room.participants[0]
    newHost.isHost = true
    room.hostId = newHost.id

    io.to(roomId).emit('room:host', { hostId: newHost.id })
  }

  // Cleanup: if no participants left
  if (room.participants.length === 0) {
    RoomManager.delete(roomId)
    deleteRoom(roomId)
  }

  socket.leave(roomId)
}

export { handleJoin, handleDisconnect }
