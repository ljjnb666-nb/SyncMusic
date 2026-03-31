import { Router } from 'express'
import { getFavorites, addFavorite, removeFavorite, isFavorite } from '../services/favoritesService.js'

const router = Router()

// 获取收藏列表
router.get('/', (req, res) => {
  try {
    const favorites = getFavorites()
    res.json({
      success: true,
      count: favorites.length,
      favorites
    })
  } catch (error) {
    console.error('Get favorites error:', error)
    res.status(500).json({ error: 'Failed to get favorites' })
  }
})

// 添加收藏
router.post('/', (req, res) => {
  try {
    const { song } = req.body

    if (!song) {
      return res.status(400).json({ error: 'Song is required' })
    }

    if (!song.title) {
      return res.status(400).json({ error: 'Song title is required' })
    }

    const result = addFavorite(song)

    if (!result.success) {
      return res.status(409).json({ error: result.error })
    }

    res.json({
      success: true,
      favorite: result.favorite,
      message: 'Added to favorites'
    })
  } catch (error) {
    console.error('Add favorite error:', error)
    res.status(500).json({ error: 'Failed to add favorite' })
  }
})

// 移除收藏
router.delete('/:songId', (req, res) => {
  try {
    const { songId } = req.params

    if (!songId) {
      return res.status(400).json({ error: 'Song ID is required' })
    }

    const result = removeFavorite(songId)

    if (!result.success) {
      return res.status(404).json({ error: result.error })
    }

    res.json({
      success: true,
      message: 'Removed from favorites'
    })
  } catch (error) {
    console.error('Remove favorite error:', error)
    res.status(500).json({ error: 'Failed to remove favorite' })
  }
})

// 检查歌曲是否已收藏
router.get('/check/:songId', (req, res) => {
  try {
    const { songId } = req.params
    const favorited = isFavorite(songId)
    res.json({ songId, favorited })
  } catch (error) {
    console.error('Check favorite error:', error)
    res.status(500).json({ error: 'Failed to check favorite' })
  }
})

export default router
