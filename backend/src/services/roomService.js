// RoomService - Room creation and management
import { nanoid } from 'nanoid'
import { RoomManager } from '../state/roomManager.js'
import { createRoom as dbCreateRoom, getRoom as dbGetRoom } from '../db.js'

function createRoom(name, hostId, hostUsername) {
  const roomId = nanoid(10)

  const room = {
    id: roomId,
    name: name.trim().slice(0, 50),
    createdAt: Date.now(),
    hostId: hostId,  // Use the provided hostId
    isPlaying: false,
    currentTrack: null,
    position: 0,
    positionUpdatedAt: Date.now(),
    playlist: [],
    participants: [{
      id: hostId,  // Use the provided hostId as participant id
      username: hostUsername || 'Guest' + nanoid(4).slice(0, 4),
      joinedAt: Date.now(),
      isHost: true
    }]
  }

  RoomManager.set(roomId, room)
  dbCreateRoom(roomId, room.name, hostId)

  return { roomId, inviteUrl: `/room/${roomId}` }
}

function getRoom(roomId) {
  const room = RoomManager.get(roomId)
  if (room) {
    return room
  }

  // Reconstruct from SQLite if exists
  const dbRoom = dbGetRoom(roomId)
  if (dbRoom) {
    const reconstructed = {
      id: dbRoom.id,
      name: dbRoom.name,
      createdAt: dbRoom.created_at,
      hostId: dbRoom.host_id,
      isPlaying: false,
      currentTrack: null,
      position: 0,
      positionUpdatedAt: Date.now(),
      playlist: [],
      participants: []
    }
    RoomManager.set(roomId, reconstructed)
    return reconstructed
  }

  return null
}

function roomExists(roomId) {
  return RoomManager.has(roomId)
}

export { createRoom, getRoom, roomExists }
