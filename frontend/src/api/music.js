import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

export async function parseMusicUrl(url) {
  const response = await api.post('/music/parse', { url })
  return response.data
}

export async function downloadMusic(url, quality = 'standard') {
  const response = await api.post('/music/download', { url, quality })
  return response.data
}

export async function downloadPlaylist(url, quality = 'standard') {
  const response = await api.post('/music/download-playlist', { url, quality })
  return response.data
}

export async function getDownloadList() {
  const response = await api.get('/music/downloads')
  return response.data
}

export async function browseFolder(folderPath) {
  const response = await api.post('/music/browse-folder', { folderPath })
  return response.data
}

export async function parsePlaylist(url) {
  const response = await api.post('/music/parse-playlist', { url })
  return response.data
}

export async function searchPlaylistSources(songs) {
  const response = await api.post('/music/search-playlist-sources', { songs })
  return response.data
}

export async function searchMusic(keyword, platform = 'all') {
  const response = await api.post('/music/search', { keyword, platform })
  return response.data
}

export async function browserDownload(title, artist) {
  const response = await api.post('/music/browser-download', { title, artist })
  return response.data
}
