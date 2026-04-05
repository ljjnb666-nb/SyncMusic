// RoomService - Room creation and management
import { nanoid } from 'nanoid'
import { RoomManager } from '../state/roomManager.js'
import { createRoom as dbCreateRoom, getRoom as dbGetRoom, roomExists as dbRoomExists, addParticipant as dbAddParticipant, getParticipants as dbGetParticipants, removeParticipant as dbRemoveParticipant, clearParticipants as dbClearParticipants, savePlaylist, getPlaylist } from '../db.js'

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

  // Persist host as participant
  const host = room.participants[0]
  dbAddParticipant({ id: host.id, roomId, username: host.username, isHost: true, joinedAt: host.joinedAt })

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
    const dbParticipants = dbGetParticipants(roomId)
    const reconstructed = {
      id: dbRoom.id,
      name: dbRoom.name,
      createdAt: dbRoom.created_at,
      hostId: dbRoom.host_id,
      isPlaying: false,
      currentTrack: null,
      position: 0,
      positionUpdatedAt: Date.now(),
      playlist: getPlaylist(roomId),
      participants: dbParticipants.map(p => ({
        id: p.id,
        username: p.username,
        joinedAt: p.joined_at,
        isHost: !!p.is_host
      }))
    }
    RoomManager.set(roomId, reconstructed)
    return reconstructed
  }

  return null
}

function roomExists(roomId) {
  return RoomManager.has(roomId) || dbRoomExists(roomId)
}

function joinRoom(roomId, sessionId, username) {
  const room = getRoom(roomId)
  if (!room) {
    throw new Error('Room not found')
  }

  // Check if already a participant
  const existing = room.participants.find(p => p.id === sessionId)
  if (existing) {
    return { roomId, alreadyJoined: true }
  }

  const participant = {
    id: sessionId,
    username: username || 'Guest' + nanoid(4).slice(0, 4),
    joinedAt: Date.now(),
    isHost: false
  }

  room.participants.push(participant)
  RoomManager.set(roomId, room)

  // Persist to DB
  dbAddParticipant({ id: sessionId, roomId, username: participant.username, isHost: false, joinedAt: participant.joinedAt })

  return { roomId, inviteUrl: `/room/${roomId}` }
}

export { createRoom, getRoom, roomExists, joinRoom }
