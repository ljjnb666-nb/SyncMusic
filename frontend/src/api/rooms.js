import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

// 获取所有可发现的房间
export async function getRooms() {
  const response = await api.get('/rooms')
  return response.data
}

// 搜索房间
export async function searchRooms(query) {
  const response = await api.get('/rooms/search', { params: { q: query } })
  return response.data
}
