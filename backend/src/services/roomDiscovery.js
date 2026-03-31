// Room Discovery Service - 房间发现服务
// 提供公开的房间列表和搜索功能

import { getAllRooms } from './roomService.js'

// 格式化房间信息用于展示
function formatRoomForDiscovery(roomId, room) {
  // 获取当前播放的歌曲信息
  const currentSong = room.currentIndex >= 0 && room.currentIndex < room.playlist.length
    ? room.playlist[room.currentIndex]
    : null

  return {
    roomId,
    listenerCount: room.listeners.length,
    songCount: room.playlist.length,
    isPlaying: room.isPlaying,
    currentSong: currentSong ? {
      title: currentSong.title,
      artist: currentSong.artist,
      coverUrl: currentSong.coverUrl
    } : null,
    createdAt: room.createdAt
  }
}

// 获取所有可发现的房间（过滤掉空房间）
function getDiscoverableRooms() {
  const allRooms = getAllRooms()

  // 只返回有歌曲或正在播放的房间
  return allRooms
    .filter(room => room.songCount > 0 || room.isPlaying)
    .map(room => ({
      roomId: room.roomId,
      listenerCount: room.listenerCount,
      songCount: room.songCount,
      isPlaying: room.isPlaying,
      currentSong: room.currentSong,
      createdAt: room.createdAt
    }))
    .sort((a, b) => {
      // 正在播放的房间优先
      if (a.isPlaying !== b.isPlaying) {
        return a.isPlaying ? -1 : 1
      }
      // 其次按人数排序
      return b.listenerCount - a.listenerCount
    })
}

// 搜索房间（按当前歌曲名称或歌手）
function searchRooms(keyword) {
  if (!keyword || typeof keyword !== 'string') {
    return []
  }

  const query = keyword.toLowerCase().trim()
  if (!query) return []

  const allRooms = getAllRooms()

  return allRooms
    .filter(room => {
      // 匹配房间ID
      if (room.roomId.toLowerCase().includes(query)) {
        return true
      }

      // 匹配当前歌曲
      if (room.currentSong) {
        const songTitle = (room.currentSong.title || '').toLowerCase()
        const songArtist = (room.currentSong.artist || '').toLowerCase()
        return songTitle.includes(query) || songArtist.includes(query)
      }

      return false
    })
    .map(room => ({
      roomId: room.roomId,
      listenerCount: room.listenerCount,
      songCount: room.songCount,
      isPlaying: room.isPlaying,
      currentSong: room.currentSong,
      createdAt: room.createdAt
    }))
    .sort((a, b) => {
      // 正在播放的房间优先
      if (a.isPlaying !== b.isPlaying) {
        return a.isPlaying ? -1 : 1
      }
      // 匹配度优先（完全匹配的房间排前面）
      const aExact = a.roomId.toLowerCase() === query
      const bExact = b.roomId.toLowerCase() === query
      if (aExact !== bExact) {
        return aExact ? -1 : 1
      }
      // 其次按人数排序
      return b.listenerCount - a.listenerCount
    })
}

export {
  getDiscoverableRooms,
  searchRooms
}
