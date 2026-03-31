import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

export async function getFavorites() {
  const response = await api.get('/favorites')
  return response.data
}

export async function addFavorite(song) {
  const response = await api.post('/favorites', { song })
  return response.data
}

export async function removeFavorite(songId) {
  const response = await api.delete(`/favorites/${songId}`)
  return response.data
}

export async function checkFavorite(songId) {
  const response = await api.get(`/favorites/check/${songId}`)
  return response.data
}
