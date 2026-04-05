// Socket.io handlers for room events
import { nanoid } from 'nanoid'
import { RoomManager } from '../state/roomManager.js'
import { getRoom, roomExists } from '../services/roomService.js'
import { deleteRoom, addParticipant, removeParticipant } from '../db.js'

function handleJoin(io, socket, { roomId, username }) {
  try {
    console.log(`[JOIN] roomId=${roomId} username=${username}`)
    console.log(`[JOIN] headers: ${JSON.stringify(socket.handshake.headers)}`)

    // Validate room exists (checks both memory and DB)
    if (!roomExists(roomId)) {
      socket.emit('error', { message: 'Room not found' })
      return
    }

    // Use getRoom which reconstructs from DB if needed
    const room = getRoom(roomId)
    if (!room) {
      socket.emit('error', { message: 'Room not found' })
      return
    }

    // Use sessionId from header or query if available, otherwise generate
    let userId = socket.handshake.headers['x-session-id'] || socket.handshake.query.sessionId || socket.data.userId
    if (!userId) {
      userId = nanoid(8)
    }
    console.log(`[JOIN] userId=${userId}`)
    socket.data.userId = userId
    socket.data.roomId = roomId

    // Check if participant already exists (same sessionId reconnecting)
    const existingIndex = room.participants.findIndex(p => p.id === userId)
    let participant
    if (existingIndex !== -1) {
      // Update existing participant's username if changed
      room.participants[existingIndex].username = username || room.participants[existingIndex].username
      socket.data.joinedAt = room.participants[existingIndex].joinedAt
      participant = room.participants[existingIndex]
    } else {
      // Create new participant
      participant = {
        id: userId,
        username: username || 'Guest' + nanoid(4).slice(0, 4),
        joinedAt: Date.now(),
        isHost: false
      }
      room.participants.push(participant)
      socket.data.joinedAt = participant.joinedAt
      // Persist to DB
      addParticipant({ id: userId, roomId, username: participant.username, isHost: false, joinedAt: participant.joinedAt })
    }

    // Join Socket.io room
    socket.join(roomId)

    // Emit room:state to joining user (FULL room first)
    socket.emit('room:state', room)

    // Emit room:join to others
    socket.to(roomId).emit('room:join', { userId, username: participant.username })
  } catch (err) {
    console.error('[JOIN ERROR]', err)
    socket.emit('error', { message: 'Internal error' })
  }
}

function handlePlay(io, socket, { roomId, track, position, timestamp }) {
  socket.to(roomId).emit('playback:play', { track, position, timestamp })
}

function handlePause(io, socket, { roomId, position, timestamp }) {
  socket.to(roomId).emit('playback:pause', { position, timestamp })
}

function handleSeek(io, socket, { roomId, position, timestamp }) {
  socket.to(roomId).emit('playback:seek', { position, timestamp })
}

function handleNext(io, socket, { roomId }) {
  const room = RoomManager.get(roomId)
  if (!room) return

  socket.to(roomId).emit('playback:next', {
    track: room.currentTrack,
    position: 0,
    timestamp: Date.now()
  })
}

function handleRoomUpdate(io, socket, { roomId, playlist, currentTrack }) {
  const room = RoomManager.get(roomId)
  if (!room) return
  if (playlist !== undefined) room.playlist = playlist
  if (currentTrack !== undefined) room.currentTrack = currentTrack
  socket.to(roomId).emit('room:update', { playlist: room.playlist, currentTrack: room.currentTrack })
}

function handleDisconnect(io, socket, reason) {
  const { roomId, userId } = socket.data

  console.log(`[DISCONNECT] reason=${reason} roomId=${roomId} userId=${userId}`)

  if (!roomId) {
    console.log('[DISCONNECT] No roomId, returning')
    return // Wasn't in a room
  }

  const room = RoomManager.get(roomId)
  if (!room) {
    console.log('[DISCONNECT] Room not found in RoomManager')
    return
  }

  console.log(`[DISCONNECT] Room found, participants before: ${JSON.stringify(room.participants.map(p => ({id: p.id, isHost: p.isHost})))}`)

  // Find and remove participant
  const participantIndex = room.participants.findIndex(p => p.id === userId)
  if (participantIndex === -1) {
    console.log('[DISCONNECT] Participant not found')
    return
  }

  const wasHost = room.participants[participantIndex].isHost
  console.log(`[DISCONNECT] wasHost=${wasHost}, removing participant`)
  room.participants.splice(participantIndex, 1)
  // Remove from DB
  removeParticipant(userId, roomId)

  // Emit room:leave to others
  socket.to(roomId).emit('room:leave', { userId })

  // Host transfer: if host left and participants remain
  if (wasHost && room.participants.length > 0) {
    // Sort by joinedAt ascending (oldest first)
    room.participants.sort((a, b) => a.joinedAt - b.joinedAt)
    const newHost = room.participants[0]
    newHost.isHost = true
    room.hostId = newHost.id

    console.log(`[HOST TRANSFER] room=${roomId} oldHost=${userId} newHost=${newHost.id}`)
    io.to(roomId).emit('room:host', { hostId: newHost.id })
  }

  // Cleanup: if no participants left
  if (room.participants.length === 0) {
    RoomManager.delete(roomId)
    deleteRoom(roomId)
  }

  socket.leave(roomId)
}

export { handleJoin, handleDisconnect, handlePlay, handlePause, handleSeek, handleNext, handleRoomUpdate }
