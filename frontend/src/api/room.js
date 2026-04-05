// REST API client for room operations
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Create a new room
 * @param {string} name - room name
 * @param {string} sessionId - user's session ID
 * @param {string} username - user's display name
 * @returns {{ roomId: string, inviteUrl: string }}
 */
export async function createRoom(name, sessionId, username) {
  const response = await fetch(`${API_BASE}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': sessionId
    },
    body: JSON.stringify({ name, username })
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to create room' }))
    throw new Error(err.message || 'Failed to create room')
  }
  return response.json()
}

/**
 * Join an existing room
 * @param {string} roomId - room ID to join
 * @param {string} sessionId - user's session ID
 * @param {string} username - user's display name
 * @returns {{ success: boolean, roomId: string }}
 */
export async function joinRoom(roomId, sessionId, username) {
  const response = await fetch(`${API_BASE}/api/rooms/${roomId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': sessionId
    },
    body: JSON.stringify({ username })
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to join room' }))
    throw new Error(err.message || 'Failed to join room')
  }
  return response.json()
}

/**
 * Get room metadata
 * @param {string} roomId
 * @returns {{ id, name, hostId, createdAt } | null}
 */
export async function getRoom(roomId) {
  try {
    const response = await fetch(`${API_BASE}/api/rooms/${roomId}`)
    if (response.status === 404) return null
    if (!response.ok) throw new Error('Failed to fetch room')
    return response.json()
  } catch {
    throw new Error('Failed to fetch room')
  }
}
