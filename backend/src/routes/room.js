import { Router } from 'express'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  addToPlaylist,
  removeFromPlaylist,
  getCurrentPlayState
} from '../services/roomService.js'

const DOWNLOAD_DIR = path.join(process.cwd(), '../downloads')

const router = Router()

// 确保下载目录存在
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true })
}

// 创建房间
router.post('/', (req, res) => {
  try {
    const { hostId } = req.body
    const room = createRoom(hostId || 'host_' + Date.now())
    res.json({ success: true, roomId: room.roomId, room })
  } catch (error) {
    console.error('Create room error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取房间信息
router.get('/:roomId', (req, res) => {
  try {
    const { roomId } = req.params

    if (!roomId || typeof roomId !== 'string') {
      return res.status(400).json({ error: 'Invalid room ID' })
    }

    const room = getRoom(roomId)
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    const playState = getCurrentPlayState(roomId)
    res.json({
      success: true,
      room: {
        roomId,
        hostId: room.hostId,
        playlist: room.playlist,
        currentIndex: room.currentIndex,
        isPlaying: room.isPlaying,
        currentTime: room.currentTime,
        listenerCount: room.listeners.length
      },
      currentSong: playState?.currentSong || null
    })
  } catch (error) {
    console.error('Get room error:', error)
    res.status(500).json({ error: error.message || 'Failed to get room' })
  }
})

// 添加歌曲到房间播放列表
router.post('/:roomId/playlist', (req, res) => {
  try {
    const { roomId } = req.params
    const { song, socketId } = req.body

    if (!roomId || typeof roomId !== 'string') {
      return res.status(400).json({ error: 'Invalid room ID' })
    }

    if (!song) {
      return res.status(400).json({ error: 'Song is required' })
    }

    if (!socketId) {
      return res.status(400).json({ error: 'socketId is required' })
    }

    const room = getRoom(roomId)
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    // 验证socketId是否是房间成员
    if (!room.listeners.includes(socketId)) {
      return res.status(403).json({ error: 'Not a member of this room' })
    }

    const result = addToPlaylist(roomId, song, socketId)

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    res.json({
      success: true,
      song: result.song,
      index: result.index
    })
  } catch (error) {
    console.error('Add to playlist error:', error)
    res.status(500).json({ error: error.message || 'Failed to add song to playlist' })
  }
})

// 从房间播放列表移除歌曲
router.delete('/:roomId/playlist/:index', (req, res) => {
  try {
    const { roomId, index } = req.params
    const { socketId } = req.body

    if (!roomId || typeof roomId !== 'string') {
      return res.status(400).json({ error: 'Invalid room ID' })
    }

    const indexNum = parseInt(index, 10)
    if (isNaN(indexNum) || indexNum < 0) {
      return res.status(400).json({ error: 'Invalid index' })
    }

    if (!socketId) {
      return res.status(400).json({ error: 'socketId is required' })
    }

    const room = getRoom(roomId)
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    const result = removeFromPlaylist(roomId, indexNum, socketId)

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    res.json({
      success: true,
      removedSong: result.removedSong
    })
  } catch (error) {
    console.error('Remove from playlist error:', error)
    res.status(500).json({ error: error.message || 'Failed to remove song from playlist' })
  }
})

// 获取播放列表
router.get('/:roomId/playlist', (req, res) => {
  try {
    const { roomId } = req.params

    if (!roomId || typeof roomId !== 'string') {
      return res.status(400).json({ error: 'Invalid room ID' })
    }

    const room = getRoom(roomId)
    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    res.json({
      success: true,
      playlist: room.playlist,
      currentIndex: room.currentIndex
    })
  } catch (error) {
    console.error('Get playlist error:', error)
    res.status(500).json({ error: error.message || 'Failed to get playlist' })
  }
})

export default router
