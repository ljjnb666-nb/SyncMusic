import { Router } from 'express'
import { getLyrics, getLyricsById } from '../services/lyricsService.js'

const router = Router()

// GET /api/lyrics?title=xxx&artist=xxx
router.get('/', async (req, res) => {
  try {
    const { title, artist, id } = req.query

    let result
    if (id) {
      result = await getLyricsById(id)
    } else if (title) {
      result = await getLyrics(title, artist || '')
    } else {
      return res.status(400).json({ success: false, error: 'title or id is required' })
    }

    res.json(result)
  } catch (error) {
    console.error('Lyrics API error:', error)
    res.status(500).json({ success: false, error: error.message || 'Internal server error' })
  }
})

export default router
