import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3001/api'
})

// 获取房间信息
export async function getRoom(roomId) {
  const response = await api.get(`/room/${roomId}`)
  return response.data
}

// 获取播放列表
export async function getPlaylist(roomId) {
  const response = await api.get(`/room/${roomId}/playlist`)
  return response.data
}

// 添加歌曲到播放列表
export async function addToPlaylist(roomId, song, socketId) {
  const response = await api.post(`/room/${roomId}/playlist`, { song, socketId })
  return response.data
}

// 从播放列表移除歌曲
export async function removeFromPlaylist(roomId, index, socketId) {
  const response = await api.delete(`/room/${roomId}/playlist/${index}`, {
    data: { socketId }
  })
  return response.data
}
