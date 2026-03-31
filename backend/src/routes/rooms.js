import { Router } from 'express'
import { getDiscoverableRooms, searchRooms } from '../services/roomDiscovery.js'

const router = Router()

// 获取所有可发现的房间
router.get('/', (req, res) => {
  try {
    const rooms = getDiscoverableRooms()
    res.json({ success: true, rooms })
  } catch (error) {
    console.error('Get rooms error:', error)
    res.status(500).json({ error: 'Failed to get rooms' })
  }
})

// 搜索房间
router.get('/search', (req, res) => {
  try {
    const { q } = req.query
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' })
    }
    const rooms = searchRooms(q)
    res.json({ success: true, rooms })
  } catch (error) {
    console.error('Search rooms error:', error)
    res.status(500).json({ error: 'Failed to search rooms' })
  }
})

export default router
