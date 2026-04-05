import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

export async function parseMusicUrl(url) {
  const response = await api.post('/music/parse', { url })
  return response.data
}

export async function downloadMusic(url, quality = '320k') {
  const response = await api.post('/music/download', { url, quality })
  return response.data
}

export async function downloadPlaylist(url, quality = '320k') {
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

export async function getStreamUrl(title, artist) {
  const response = await api.post('/music/stream-url', { title, artist })
  return response.data
}

export async function getDownloadDir() {
  const response = await api.get('/music/download-dir')
  return response.data
}

export async function setDownloadDir(path) {
  const response = await api.post('/music/download-dir', { path })
  return response.data
}

export async function uploadMusicFiles(files) {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })
  const response = await api.post('/music/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export async function getLyrics(title, artist) {
  const response = await api.get('/lyrics', { params: { title, artist } })
  return response.data
}
