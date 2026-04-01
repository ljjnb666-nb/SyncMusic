// Room service unit tests
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRoom, getRoom, roomExists } from '../src/services/roomService.js'
import { RoomManager } from '../src/state/roomManager.js'

describe('RoomService', () => {
  beforeEach(() => {
    // Clear RoomManager state before each test
    for (const key of RoomManager['_rooms']?.keys() || []) {
      RoomManager.delete(key)
    }
  })

  afterEach(() => {
    // Cleanup
    for (const key of RoomManager['_rooms']?.keys() || []) {
      RoomManager.delete(key)
    }
  })

  it('createRoom returns roomId and inviteUrl', () => {
    const result = createRoom('Test Room', 'host123', 'TestHost')
    expect(result.roomId).toBeDefined()
    expect(typeof result.roomId).toBe('string')
    expect(result.inviteUrl).toBe(`/room/${result.roomId}`)
  })

  it('createRoom generates valid nanoid (10 chars)', () => {
    const result = createRoom('Test Room', 'host123', 'TestHost')
    expect(result.roomId).toHaveLength(10)
    expect(result.roomId).toMatch(/^[a-zA-Z0-9_-]+$/)
  })

  it('createRoom stores in memory and SQLite', () => {
    const result = createRoom('Test Room', 'host123', 'TestHost')
    expect(roomExists(result.roomId)).toBe(true)
    const room = getRoom(result.roomId)
    expect(room).toBeDefined()
    expect(room.id).toBe(result.roomId)
  })

  it('createRoom sets host as first participant with isHost: true', () => {
    const result = createRoom('Test Room', 'host123', 'TestHost')
    const room = getRoom(result.roomId)
    expect(room.participants).toHaveLength(1)
    expect(room.participants[0].isHost).toBe(true)
    expect(room.hostId).toBe(room.participants[0].id)
  })

  it('getRoom returns full room state', () => {
    const result = createRoom('Test Room', 'host123', 'TestHost')
    const room = getRoom(result.roomId)
    expect(room.id).toBe(result.roomId)
    expect(room.name).toBe('Test Room')
    expect(room.isPlaying).toBe(false)
    expect(room.currentTrack).toBeNull()
    expect(room.position).toBe(0)
    expect(room.playlist).toEqual([])
  })

  it('roomExists returns true for existing room', () => {
    const result = createRoom('Test Room', 'host123', 'TestHost')
    expect(roomExists(result.roomId)).toBe(true)
  })

  it('roomExists returns false for non-existent room', () => {
    expect(roomExists('nonexistent')).toBe(false)
  })
})
