// In-memory RoomManager for active room state
// Source of truth for active rooms. SQLite is only for persistence across restarts.

const rooms = new Map()

const RoomManager = {
  get(roomId) {
    return rooms.get(roomId)
  },

  set(roomId, room) {
    rooms.set(roomId, room)
  },

  delete(roomId) {
    rooms.delete(roomId)
  },

  has(roomId) {
    return rooms.has(roomId)
  }
}

export { RoomManager }
