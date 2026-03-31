import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

// 获取播放历史
export async function getHistory(limit = 50) {
  const response = await api.get('/history', { params: { limit } })
  return response.data
}

// 添加历史记录
export async function addHistory(song) {
  const response = await api.post('/history', { song })
  return response.data
}

// 清空历史记录
export async function clearHistory() {
  const response = await api.delete('/history')
  return response.data
}

// 删除单条历史记录
export async function deleteHistory(id) {
  const response = await api.delete(`/history/${id}`)
  return response.data
}
