// Room REST API routes
import { Router } from 'express'
import { nanoid } from 'nanoid'
import { createRoom, getRoom } from '../services/roomService.js'

const router = Router()

// POST /api/rooms - Create a new room
router.post('/', (req, res) => {
  const { name, username } = req.body

  // Validate room name: 1-50 characters
  if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 50) {
    return res.status(400).json({ error: 'Room name is required (1-50 chars)' })
  }

  // Get hostId from header or generate
  const hostId = req.headers['x-session-id'] || nanoid(8)
  const hostUsername = username || 'Guest' + nanoid(4).slice(0, 4)

  const result = createRoom(name.trim(), hostId, hostUsername)
  res.status(201).json(result)
})

// GET /api/rooms/:id - Get room metadata
router.get('/:id', (req, res) => {
  const room = getRoom(req.params.id)

  if (!room) {
    return res.status(404).json({ error: 'Room not found' })
  }

  // Return only metadata (not full participant list)
  res.json({
    id: room.id,
    name: room.name,
    hostId: room.hostId,
    createdAt: room.createdAt
  })
})

export default router
