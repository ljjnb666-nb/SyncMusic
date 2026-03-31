// History Service - 播放历史服务
// 管理所有播放历史记录

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../../../data')
const HISTORY_FILE = path.join(DATA_DIR, 'history.json')

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// 历史记录结构
// {
//   id: string,               // 唯一标识
//   title: string,             // 歌曲标题
//   artist: string,            // 艺术家
//   album: string,             // 专辑
//   duration: number,          // 时长（秒）
//   coverUrl: string,          // 封面URL
//   fileUrl: string,           // 音频文件URL
//   playedAt: Date             // 播放时间
// }

const MAX_HISTORY_SIZE = 100 // 最多保存100条记录

// 内存中的历史记录
const history = []

// 持久化函数
function saveHistory() {
  const data = history.map(item => ({
    ...item,
    playedAt: item.playedAt instanceof Date ? item.playedAt.toISOString() : item.playedAt
  }))
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2))
}

function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'))
      history.length = 0
      data.forEach(item => {
        history.push({
          ...item,
          playedAt: new Date(item.playedAt)
        })
      })
      console.log(`Loaded ${history.length} history records from disk`)
    } catch (e) {
      console.error('Failed to load history:', e)
    }
  }
}

// 启动时加载历史记录
loadHistory()

// 每 30 秒自动保存
setInterval(saveHistory, 30000)

// 添加历史记录
function addHistory(song) {
  // 生成唯一ID
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const record = {
    id,
    title: song.title || 'Unknown',
    artist: song.artist || 'Unknown',
    album: song.album || '',
    duration: song.duration || 0,
    coverUrl: song.coverUrl || '',
    fileUrl: song.fileUrl || '',
    playedAt: new Date()
  }

  // 添加到列表开头
  history.unshift(record)

  // 如果超过最大数量，移除最旧的记录
  if (history.length > MAX_HISTORY_SIZE) {
    history.splice(MAX_HISTORY_SIZE)
  }

  saveHistory()
  return record
}

// 获取所有历史记录
function getHistory(limit = 50) {
  return history.slice(0, limit)
}

// 清空历史记录
function clearHistory() {
  history.length = 0
  saveHistory()
  return { success: true }
}

// 删除单条历史记录
function deleteHistory(id) {
  const index = history.findIndex(item => item.id === id)
  if (index === -1) {
    return { success: false, error: 'Record not found' }
  }
  history.splice(index, 1)
  saveHistory()
  return { success: true }
}

export {
  addHistory,
  getHistory,
  clearHistory,
  deleteHistory,
  saveHistory
}
