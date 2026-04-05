<template>
  <div class="downloads-page">
    <div class="page-header">
      <h1 class="page-title">
        <AppIcon name="download" :size="28" />
        <span>下载管理</span>
      </h1>
    </div>

    <DownloadManager
      :downloads="downloads"
      :loadingDownloads="loadingDownloads"
      :downloadDir="downloadDir"
      :settingDir="settingDir"
      :dirMessage="dirMessage"
      @refresh="fetchDownloads"
      @add-downloaded-to-playlist="addToPlaylist"
      @update-download-dir="updateDownloadDir"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePlayerStore } from '../stores/player.js'
import { getDownloadDir, setDownloadDir as apiSetDownloadDir, getDownloadList } from '../api/music.js'
import DownloadManager from '../components/DownloadManager.vue'
import AppIcon from '../components/AppIcon.vue'

const playerStore = usePlayerStore()

const downloads = ref([])
const loadingDownloads = ref(false)
const downloadDir = ref('')
const settingDir = ref(false)
const dirMessage = ref(null)

onMounted(() => {
  fetchDownloads()
  fetchDownloadDir()
})

async function fetchDownloads() {
  loadingDownloads.value = true
  try {
    const data = await getDownloadList()
    downloads.value = Array.isArray(data) ? data : data.files || []
  } catch (err) {
    console.error('Failed to fetch downloads:', err)
  } finally {
    loadingDownloads.value = false
  }
}

async function fetchDownloadDir() {
  try {
    const data = await getDownloadDir()
    downloadDir.value = data.path || ''
  } catch (err) {
    console.error('Failed to fetch download dir:', err)
  }
}

async function updateDownloadDir(newPath) {
  settingDir.value = true
  dirMessage.value = null
  try {
    const result = await apiSetDownloadDir(newPath)
    downloadDir.value = result.path
    dirMessage.value = { type: 'success', text: result.message || '下载目录已更新' }
    fetchDownloads()
  } catch (err) {
    dirMessage.value = { type: 'error', text: err.message || '设置失败' }
  } finally {
    settingDir.value = false
  }
}

function addToPlaylist(file) {
  // 从文件名解析歌曲信息
  const nameWithoutExt = file.name.replace(/\.(mp3|flac|m4a)$/i, '')
  // 尝试解析 "歌手 - 歌曲名" 格式
  const parts = nameWithoutExt.split(' - ')
  let song = { title: nameWithoutExt, artist: '未知艺术家' }
  if (parts.length >= 2) {
    song.artist = parts[0].trim()
    song.title = parts.slice(1).join(' - ').trim()
  }
  song.duration = 0
  song.url = file.url

  playerStore.addSong(song)
  alert(`已添加"${song.title}"到播放列表`)
}
</script>

<style scoped>
.downloads-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: #f8fafc;
}
</style>
