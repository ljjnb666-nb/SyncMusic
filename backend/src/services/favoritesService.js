// Favorites Service - 收藏服务
// 管理用户收藏的音乐列表

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../../../data')
const FAVORITES_FILE = path.join(DATA_DIR, 'favorites.json')

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// 收藏数据结构
// [
//   {
//     id: string,           // 歌曲唯一标识
//     title: string,        // 歌曲标题
//     artist: string,       // 艺术家
//     album: string,        // 专辑
//     duration: number,      // 时长（秒）
//     coverUrl: string,     // 封面URL
//     fileUrl: string,      // 音频文件URL
//     source: string,       // 来源平台
//     addedAt: string       // 添加时间
//   }
// ]

// 内存中的收藏列表
let favorites = []

// 持久化函数
function saveFavorites() {
  fs.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2))
}

function loadFavorites() {
  if (fs.existsSync(FAVORITES_FILE)) {
    try {
      favorites = JSON.parse(fs.readFileSync(FAVORITES_FILE, 'utf-8'))
      console.log(`Loaded ${favorites.length} favorites from disk`)
    } catch (e) {
      console.error('Failed to load favorites:', e)
      favorites = []
    }
  }
}

// 初始化加载
loadFavorites()

// 每 30 秒自动保存
setInterval(saveFavorites, 30000)

// 获取所有收藏
function getFavorites() {
  return favorites
}

// 添加收藏
function addFavorite(song) {
  // 检查是否已收藏（根据 id 或 title+artist 判断唯一性）
  const exists = favorites.some(f =>
    f.id === song.id ||
    (f.title === song.title && f.artist === song.artist)
  )

  if (exists) {
    return { success: false, error: 'Already in favorites', favorite: null }
  }

  const favorite = {
    id: song.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: song.title || 'Unknown',
    artist: song.artist || 'Unknown',
    album: song.album || '',
    duration: song.duration || 0,
    coverUrl: song.coverUrl || song.cover || '',
    fileUrl: song.fileUrl || song.url || '',
    source: song.source || '',
    addedAt: new Date().toISOString()
  }

  favorites.unshift(favorite)
  saveFavorites()

  return { success: true, favorite }
}

// 移除收藏（通过歌曲ID）
function removeFavorite(songId) {
  const index = favorites.findIndex(f => f.id === songId)

  if (index === -1) {
    return { success: false, error: 'Favorite not found' }
  }

  const removed = favorites.splice(index, 1)[0]
  saveFavorites()

  return { success: true, removed }
}

// 检查歌曲是否已收藏
function isFavorite(songId) {
  return favorites.some(f => f.id === songId)
}

// 清空所有收藏
function clearFavorites() {
  favorites = []
  saveFavorites()
  return { success: true }
}

export {
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  clearFavorites,
  loadFavorites,
  saveFavorites
}
