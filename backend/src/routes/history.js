import { Router } from 'express'
import {
  addHistory,
  getHistory,
  clearHistory,
  deleteHistory
} from '../services/historyService.js'

const router = Router()

// 获取播放历史
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50
    const history = getHistory(limit)
    res.json({
      success: true,
      history,
      total: history.length
    })
  } catch (error) {
    console.error('Get history error:', error)
    res.status(500).json({ error: error.message || 'Failed to get history' })
  }
})

// 添加历史记录
router.post('/', (req, res) => {
  try {
    const { song } = req.body

    if (!song) {
      return res.status(400).json({ error: 'Song is required' })
    }

    const record = addHistory(song)
    res.json({
      success: true,
      record
    })
  } catch (error) {
    console.error('Add history error:', error)
    res.status(500).json({ error: error.message || 'Failed to add history' })
  }
})

// 清空历史记录
router.delete('/', (req, res) => {
  try {
    const result = clearHistory()
    res.json(result)
  } catch (error) {
    console.error('Clear history error:', error)
    res.status(500).json({ error: error.message || 'Failed to clear history' })
  }
})

// 删除单条历史记录
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: 'ID is required' })
    }

    const result = deleteHistory(id)
    if (!result.success) {
      return res.status(404).json({ error: result.error })
    }

    res.json(result)
  } catch (error) {
    console.error('Delete history error:', error)
    res.status(500).json({ error: error.message || 'Failed to delete history' })
  }
})

export default router
