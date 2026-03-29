// Room Service - 房间管理服务
// 管理所有房间的状态，包括播放列表、当前播放状态等

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../../../data')
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json')

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// 房间状态结构
// {
//   hostId: string,           // 房主socket ID
//   listeners: string[],      // 所有听众socket ID列表
//   playlist: Song[],         // 播放列表
//   currentIndex: number,     // 当前播放歌曲索引
//   isPlaying: boolean,       // 是否正在播放
//   currentTime: number,      // 当前播放位置（秒）
//   createdAt: Date           // 创建时间
// }

// Song结构
// {
//   id: string,               // 歌曲唯一标识
//   title: string,             // 歌曲标题
//   artist: string,            // 艺术家
//   album: string,             // 专辑
//   duration: number,          // 时长（秒）
//   coverUrl: string,          // 封面URL
//   fileUrl: string,           // 音频文件URL
//   addedBy: string,           // 添加者socket ID
//   addedAt: Date              // 添加时间
// }

const rooms = new Map()

// 持久化函数
function saveRooms() {
  const data = {}
  rooms.forEach((room, id) => {
    data[id] = {
      ...room,
      listeners: [],
      hostId: ''
    }
  })
  fs.writeFileSync(ROOMS_FILE, JSON.stringify(data, null, 2))
}

function loadRooms() {
  if (fs.existsSync(ROOMS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(ROOMS_FILE, 'utf-8'))
      Object.entries(data).forEach(([id, room]) => {
        rooms.set(id, room)
      })
      console.log(`Loaded ${rooms.size} rooms from disk`)
    } catch (e) {
      console.error('Failed to load rooms:', e)
    }
  }
}

// 每 30 秒自动保存
setInterval(saveRooms, 30000)

// 生成安全的房间ID
function generateRoomId() {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
  return randomPart
}

// 创建新房间
function createRoom(hostId) {
  const roomId = generateRoomId()
  const room = {
    hostId,
    listeners: [hostId],
    playlist: [],
    currentIndex: -1,
    isPlaying: false,
    currentTime: 0,
    createdAt: new Date()
  }
  rooms.set(roomId, room)
  return { roomId, room }
}

// 获取房间信息
function getRoom(roomId) {
  return rooms.get(roomId)
}

// 获取所有房间列表（用于调试）
function getAllRooms() {
  const roomList = []
  for (const [roomId, room] of rooms.entries()) {
    roomList.push({
      roomId,
      hostId: room.hostId,
      listenerCount: room.listeners.length,
      songCount: room.playlist.length,
      currentIndex: room.currentIndex,
      isPlaying: room.isPlaying
    })
  }
  return roomList
}

// 加入房间
function joinRoom(roomId, socketId) {
  const room = rooms.get(roomId)
  if (!room) {
    return { success: false, error: 'Room not found' }
  }

  if (!room.listeners.includes(socketId)) {
    room.listeners.push(socketId)
  }

  return {
    success: true,
    room: {
      roomId,
      hostId: room.hostId,
      isHost: room.hostId === socketId,
      listeners: room.listeners,
      playlist: room.playlist,
      currentIndex: room.currentIndex,
      isPlaying: room.isPlaying,
      currentTime: room.currentTime
    }
  }
}

// 离开房间
function leaveRoom(roomId, socketId) {
  const room = rooms.get(roomId)
  if (!room) {
    return { success: false, error: 'Room not found' }
  }

  // 从听众列表中移除
  room.listeners = room.listeners.filter(id => id !== socketId)

  // 如果没有听众了，删除房间
  if (room.listeners.length === 0) {
    rooms.delete(roomId)
    return { success: true, roomDeleted: true }
  }

  // 如果房主离开，将房主权限转移给第一个听众
  if (room.hostId === socketId) {
    room.hostId = room.listeners[0]
  }

  return { success: true, roomDeleted: false }
}

// 验证是否是房主
function isHost(roomId, socketId) {
  const room = rooms.get(roomId)
  return room && room.hostId === socketId
}

// 添加歌曲到播放列表
function addToPlaylist(roomId, song, socketId) {
  const room = rooms.get(roomId)
  if (!room) {
    return { success: false, error: 'Room not found' }
  }

  // 任何房间成员都可以添加歌曲
  const newSong = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: song.title || 'Unknown',
    artist: song.artist || 'Unknown',
    album: song.album || '',
    duration: song.duration || 0,
    coverUrl: song.coverUrl || '',
    fileUrl: song.fileUrl || '',
    addedBy: socketId,
    addedAt: new Date()
  }

  room.playlist.push(newSong)

  // 如果当前没有播放的歌曲，自动设置为第一首
  if (room.currentIndex === -1 && room.playlist.length === 1) {
    room.currentIndex = 0
  }

  return { success: true, song: newSong, index: room.playlist.length - 1 }
}

// 从播放列表移除歌曲
function removeFromPlaylist(roomId, index, socketId) {
  const room = rooms.get(roomId)
  if (!room) {
    return { success: false, error: 'Room not found' }
  }

  // 只有房主可以移除歌曲
  if (!isHost(roomId, socketId)) {
    return { success: false, error: 'Only host can remove songs' }
  }

  if (index < 0 || index >= room.playlist.length) {
    return { success: false, error: 'Invalid index' }
  }

  const removedSong = room.playlist.splice(index, 1)[0]

  // 调整当前播放索引
  if (room.playlist.length === 0) {
    room.currentIndex = -1
  } else if (index < room.currentIndex) {
    room.currentIndex--
  } else if (index === room.currentIndex) {
    // 如果移除的是当前播放的歌曲
    if (room.currentIndex >= room.playlist.length) {
      room.currentIndex = room.playlist.length - 1
    }
  }

  return { success: true, removedSong }
}

// 播放下一首
function playNext(roomId, socketId) {
  const room = rooms.get(roomId)
  if (!room) {
    return { success: false, error: 'Room not found' }
  }

  // 只有房主可以切歌
  if (!isHost(roomId, socketId)) {
    return { success: false, error: 'Only host can skip songs' }
  }

  if (room.playlist.length === 0) {
    return { success: false, error: 'Playlist is empty' }
  }

  room.currentIndex = (room.currentIndex + 1) % room.playlist.length
  room.currentTime = 0

  return {
    success: true,
    currentIndex: room.currentIndex,
    currentSong: room.playlist[room.currentIndex]
  }
}

// 播放上一首
function playPrevious(roomId, socketId) {
  const room = rooms.get(roomId)
  if (!room) {
    return { success: false, error: 'Room not found' }
  }

  if (!isHost(roomId, socketId)) {
    return { success: false, error: 'Only host can skip songs' }
  }

  if (room.playlist.length === 0) {
    return { success: false, error: 'Playlist is empty' }
  }

  room.currentIndex = room.currentIndex <= 0
    ? room.playlist.length - 1
    : room.currentIndex - 1
  room.currentTime = 0

  return {
    success: true,
    currentIndex: room.currentIndex,
    currentSong: room.playlist[room.currentIndex]
  }
}

// 更新播放状态
function updatePlayState(roomId, socketId, playState) {
  const room = rooms.get(roomId)
  if (!room) {
    return { success: false, error: 'Room not found' }
  }

  if (!isHost(roomId, socketId)) {
    return { success: false, error: 'Only host can control playback' }
  }

  if (playState.isPlaying !== undefined) {
    room.isPlaying = playState.isPlaying
  }
  if (playState.currentTime !== undefined) {
    room.currentTime = playState.currentTime
  }
  if (playState.currentIndex !== undefined) {
    if (playState.currentIndex >= 0 && playState.currentIndex < room.playlist.length) {
      room.currentIndex = playState.currentIndex
    }
  }

  return {
    success: true,
    room: {
      isPlaying: room.isPlaying,
      currentTime: room.currentTime,
      currentIndex: room.currentIndex,
      currentSong: room.playlist[room.currentIndex] || null
    }
  }
}

// 获取当前播放信息
function getCurrentPlayState(roomId) {
  const room = rooms.get(roomId)
  if (!room) {
    return null
  }

  return {
    currentSong: room.playlist[room.currentIndex] || null,
    currentIndex: room.currentIndex,
    isPlaying: room.isPlaying,
    currentTime: room.currentTime,
    playlist: room.playlist,
    listenerCount: room.listeners.length
  }
}

// 处理用户断开连接
function handleDisconnect(socketId) {
  const affectedRooms = []

  for (const [roomId, room] of rooms.entries()) {
    if (room.hostId === socketId) {
      // 房主离开
      if (room.listeners.length > 1) {
        // 将房主权限转移给第一个听众
        room.hostId = room.listeners.find(id => id !== socketId) || room.listeners[0]
        room.listeners = room.listeners.filter(id => id !== socketId)
        affectedRooms.push({ roomId, action: 'host_transfer', newHost: room.hostId })
      } else {
        // 只有房主一人，删除房间
        rooms.delete(roomId)
        affectedRooms.push({ roomId, action: 'deleted' })
      }
    } else {
      // 听众离开
      room.listeners = room.listeners.filter(id => id !== socketId)
      if (room.listeners.length === 0) {
        rooms.delete(roomId)
        affectedRooms.push({ roomId, action: 'deleted' })
      } else {
        affectedRooms.push({ roomId, action: 'listener_left', remainingListeners: room.listeners.length })
      }
    }
  }

  return affectedRooms
}

export {
  rooms,
  createRoom,
  getRoom,
  getAllRooms,
  joinRoom,
  leaveRoom,
  isHost,
  addToPlaylist,
  removeFromPlaylist,
  playNext,
  playPrevious,
  updatePlayState,
  getCurrentPlayState,
  handleDisconnect,
  loadRooms,
  saveRooms
}
