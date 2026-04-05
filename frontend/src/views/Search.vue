<template>
  <div class="search-page">
    <!-- Search Section -->
    <div class="search-header">
      <div class="search-input-wrapper">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索歌曲、歌手或专辑..."
          @keyup.enter="handleSearch"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- URL Parse Section -->
    <div class="parse-section">
      <h3 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        链接解析
      </h3>
      <div class="url-input-wrapper">
        <input
          v-model="musicUrl"
          type="text"
          placeholder="输入QQ音乐/网易云/酷狗链接..."
          class="url-input"
          @keyup.enter="handleParse"
        />
        <button @click="handleParse" class="parse-btn" :disabled="loadingParse">
          {{ loadingParse ? '解析中...' : '解析' }}
        </button>
      </div>
      <!-- Parsed Result -->
      <div v-if="parsedSong" class="parsed-result">
        <div class="parsed-info">
          <p class="parsed-title">{{ parsedSong.title }}</p>
          <p class="parsed-artist">{{ parsedSong.artist }}</p>
        </div>
        <div class="parsed-actions">
          <button @click="addToPlaylist(parsedSong)" class="action-btn" title="添加到歌单">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button @click="handleDownload" class="action-btn" title="下载">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Playlist Parse Section -->
    <div class="parse-section">
      <h3 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        歌单解析
      </h3>
      <div class="url-input-wrapper">
        <input
          v-model="playlistUrl"
          type="text"
          placeholder="输入歌单链接..."
          class="url-input"
          @keyup.enter="handleParsePlaylist"
        />
        <button @click="handleParsePlaylist" class="parse-btn" :disabled="loadingPlaylist">
          {{ loadingPlaylist ? '解析中...' : '解析歌单' }}
        </button>
      </div>
      <!-- Playlist Result -->
      <div v-if="parsedPlaylist" class="playlist-result">
        <div class="playlist-header">
          <span class="playlist-name">{{ parsedPlaylist.title }}</span>
          <span class="playlist-count">({{ parsedPlaylist.songCount }}首)</span>
          <button @click="addAllToPlaylist" class="add-all-btn">全部添加</button>
        </div>
        <div class="playlist-songs">
          <div
            v-for="song in parsedPlaylist.songs.slice(0, 10)"
            :key="song.id"
            class="playlist-song-item"
          >
            <span class="song-title">{{ song.title }}</span>
            <span class="song-singer">{{ song.singer }}</span>
            <button @click="addToPlaylist(song)" class="add-btn">+</button>
          </div>
          <p v-if="parsedPlaylist.songCount > 10" class="more-songs">
            还有 {{ parsedPlaylist.songCount - 10 }} 首...
          </p>
        </div>
      </div>
    </div>

    <div class="search-content">
      <!-- Loading -->
      <div v-if="isSearching" class="loading">
        <div class="spinner"></div>
        <p>搜索中...</p>
      </div>

      <!-- Results -->
      <div v-else-if="searchResults.length > 0" class="results">
        <div class="results-header">
          <span>找到 {{ searchResults.length }} 首歌曲</span>
        </div>
        <div class="song-list">
          <div
            v-for="song in searchResults"
            :key="song.id || song.mid"
            class="song-item"
            @click="playSong(song)"
          >
            <div class="song-cover">
              <img v-if="song.pic" :src="song.pic" :alt="song.title" />
              <div v-else class="cover-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
              </div>
              <div class="play-overlay">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
            </div>
            <div class="song-info">
              <div class="song-name">{{ song.title }}</div>
              <div class="song-artist">{{ song.artist || song.singer || '未知艺术家' }}</div>
            </div>
            <div class="song-actions">
              <FavoriteButton :song="song" :size="16" />
              <button @click.stop="addToPlaylist(song)" class="action-btn" title="添加到歌单">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <button @click.stop="downloadSong(song)" class="action-btn" title="下载">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="hasSearched" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <p>未找到相关歌曲</p>
        <span>尝试其他关键词</span>
      </div>

      <!-- Initial State -->
      <div v-else class="initial-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <p>搜索你喜欢的音乐</p>
        <span>输入关键词开始搜索</span>
      </div>
    </div>

    <!-- Download Modal -->
    <div v-if="showDownloadModal" class="modal-overlay" @click.self="showDownloadModal = false">
      <div class="download-modal">
        <h3>下载歌曲</h3>
        <div class="download-song-info" v-if="selectedSong">
          <p class="song-title">{{ selectedSong.name }}</p>
          <p class="song-artist">{{ selectedSong.artist || selectedSong.singer }}</p>
        </div>
        <div v-if="isDownloading" class="download-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: downloadProgress + '%' }"></div>
          </div>
          <p>{{ downloadStatus }}</p>
        </div>
        <div v-else-if="downloadError" class="download-error">
          <p>{{ downloadError }}</p>
        </div>
        <div v-else class="download-options">
          <button @click="confirmDownload" class="download-btn">开始下载</button>
        </div>
        <button @click="showDownloadModal = false" class="close-btn">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePlayerStore } from '../stores/player'
import { searchMusic, getStreamUrl, parseMusicUrl, downloadMusic, parsePlaylist, browserDownload } from '../api/music'
import FavoriteButton from '../components/FavoriteButton.vue'

const playerStore = usePlayerStore()

const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const hasSearched = ref(false)

// URL解析相关状态
const musicUrl = ref('')
const parsedSong = ref(null)
const loadingParse = ref(false)

// 歌单解析相关状态
const playlistUrl = ref('')
const parsedPlaylist = ref(null)
const loadingPlaylist = ref(false)

// 下载相关状态
const showDownloadModal = ref(false)
const selectedSong = ref(null)
const isDownloading = ref(false)
const downloadProgress = ref(0)
const downloadStatus = ref('')
const downloadError = ref('')
const isStreaming = ref(false)

async function handleSearch() {
  if (!searchQuery.value.trim()) return
  isSearching.value = true
  hasSearched.value = true
  try {
    const data = await searchMusic(searchQuery.value.trim())
    searchResults.value = data.results || []
  } catch (err) {
    console.error('Search failed:', err)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
}

function playSong(song) {
  // 检查是否有可播放的URL
  if (song.url) {
    // 有URL，直接播放
    playerStore.setPlaylist(searchResults.value)
    const index = searchResults.value.findIndex(s => (s.id || s.mid) === (song.id || song.mid))
    if (index !== -1) {
      playerStore.setCurrentIndex(index)
      playerStore.setPlaying(true)
    }
    return
  }
  // 没有URL，提示用户下载后才能播放完整版
  selectedSong.value = song
  showDownloadModal.value = true
  downloadError.value = ''
  downloadProgress.value = 0
}

function addToPlaylist(song) {
  playerStore.addSong(song)
}

function downloadSong(song) {
  selectedSong.value = song
  showDownloadModal.value = true
  downloadError.value = ''
  downloadProgress.value = 0
}

async function confirmDownload() {
  if (!selectedSong.value) return
  isDownloading.value = true
  downloadError.value = ''
  downloadStatus.value = '准备下载...'

  try {
    const song = selectedSong.value
    downloadStatus.value = '正在下载...'
    downloadProgress.value = 30

    const response = await fetch('/api/music/browser-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: song.title,
        artist: song.artist || song.singer
      })
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || result.message || '下载请求失败')
    }

    // 下载成功后更新歌曲的 path，以便收藏后能正常播放
    if (result.filename) {
      selectedSong.value.path = `/downloads/${result.filename}`
    }

    downloadProgress.value = 100
    downloadStatus.value = '下载完成'

    setTimeout(() => {
      showDownloadModal.value = false
    }, 1500)
  } catch (err) {
    downloadError.value = err.message || '下载失败'
  } finally {
    isDownloading.value = false
  }
}

// 解析音乐URL
async function handleParse() {
  if (!musicUrl.value.trim()) return
  loadingParse.value = true
  try {
    const result = await parseMusicUrl(musicUrl.value.trim())
    parsedSong.value = result
  } catch (err) {
    console.error('Parse failed:', err)
    parsedSong.value = null
  } finally {
    loadingParse.value = false
  }
}

// 下载解析的歌曲
async function handleDownload() {
  if (!parsedSong.value) return
  selectedSong.value = parsedSong.value
  showDownloadModal.value = true
  downloadError.value = ''
  downloadProgress.value = 0
}

// 解析歌单
async function handleParsePlaylist() {
  if (!playlistUrl.value.trim()) return
  loadingPlaylist.value = true
  try {
    const result = await parsePlaylist(playlistUrl.value.trim())
    parsedPlaylist.value = result
  } catch (err) {
    console.error('Playlist parse failed:', err)
    parsedPlaylist.value = null
  } finally {
    loadingPlaylist.value = false
  }
}

// 全部添加到歌单
function addAllToPlaylist() {
  if (!parsedPlaylist.value) return
  parsedPlaylist.value.songs.forEach(song => {
    playerStore.addSong(song)
  })
}

// 获取平台名称
function getPlatformName(url) {
  if (url.includes('qq.com') || url.includes('y.qq.com')) return 'QQ音乐'
  if (url.includes('music.163.com') || url.includes('y.music.163.com')) return '网易云音乐'
  if (url.includes('kugou.com')) return '酷狗音乐'
  return '未知平台'
}
</script>

<style scoped>
.search-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.search-header {
  margin-bottom: 24px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  transition: all 0.2s;
}

.search-input-wrapper:focus-within {
  border-color: rgba(139, 92, 246, 0.6);
  background: rgba(255, 255, 255, 0.08);
}

.search-input-wrapper svg {
  color: #64748b;
  flex-shrink: 0;
}

.search-input-wrapper input {
  flex: 1;
  background: none;
  border: none;
  color: #f8fafc;
  font-size: 16px;
  outline: none;
}

.search-input-wrapper input::placeholder {
  color: #475569;
}

.clear-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  color: #f8fafc;
}

.loading, .empty-state, .initial-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
}

.loading .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(139, 92, 246, 0.2);
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state svg, .initial-state svg {
  color: #475569;
  margin-bottom: 16px;
}

.empty-state p, .initial-state p {
  font-size: 16px;
  color: #94a3b8;
  margin: 0 0 4px;
}

.empty-state span, .initial-state span {
  font-size: 14px;
  color: #64748b;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  color: #64748b;
  font-size: 14px;
}

.song-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.song-item:hover {
  background: rgba(139, 92, 246, 0.1);
}

.song-cover {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(139, 92, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b5cf6;
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: white;
}

.song-item:hover .play-overlay {
  opacity: 1;
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-name {
  font-size: 14px;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.song-item:hover .song-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

/* Parse Section */
.parse-section {
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f8fafc;
  font-size: 16px;
  margin: 0 0 16px;
}

.section-title svg {
  color: #8b5cf6;
}

.url-input-wrapper {
  display: flex;
  gap: 8px;
}

.url-input {
  flex: 1;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  color: #f8fafc;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.url-input:focus {
  border-color: rgba(139, 92, 246, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.url-input::placeholder {
  color: #475569;
}

.parse-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.parse-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.parse-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Parsed Result */
.parsed-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding: 16px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 8px;
}

.parsed-info {
  flex: 1;
}

.parsed-title {
  color: #f8fafc;
  font-size: 14px;
  margin: 0 0 4px;
}

.parsed-artist {
  color: #64748b;
  font-size: 12px;
  margin: 0;
}

.parsed-actions {
  display: flex;
  gap: 8px;
}

/* Playlist Result */
.playlist-result {
  margin-top: 16px;
  padding: 16px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 8px;
}

.playlist-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.playlist-name {
  color: #f8fafc;
  font-size: 14px;
  font-weight: 500;
}

.playlist-count {
  color: #64748b;
  font-size: 12px;
}

.add-all-btn {
  margin-left: auto;
  padding: 6px 12px;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-all-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.playlist-songs {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.playlist-song-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
}

.playlist-song-item .song-title {
  flex: 1;
  color: #f8fafc;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-song-item .song-singer {
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.playlist-song-item .add-btn {
  padding: 4px 10px;
  background: rgba(139, 92, 246, 0.2);
  border: none;
  border-radius: 4px;
  color: #a78bfa;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.playlist-song-item .add-btn:hover {
  background: rgba(139, 92, 246, 0.4);
  color: #f8fafc;
}

.more-songs {
  color: #64748b;
  font-size: 12px;
  text-align: center;
  margin: 8px 0 0;
}

/* Download Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.download-modal {
  background: #1a1a24;
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 16px;
  padding: 32px;
  width: 360px;
  max-width: 90vw;
}

.download-modal h3 {
  color: #f8fafc;
  font-size: 18px;
  margin: 0 0 16px;
}

.download-song-info {
  margin-bottom: 20px;
}

.song-title {
  color: #f8fafc;
  font-size: 14px;
  margin: 0 0 4px;
}

.song-artist {
  color: #64748b;
  font-size: 12px;
  margin: 0;
}

.download-progress {
  margin: 20px 0;
}

.progress-bar {
  height: 6px;
  background: rgba(139, 92, 246, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  border-radius: 3px;
  transition: width 0.3s;
}

.download-progress p {
  color: #94a3b8;
  font-size: 13px;
  margin: 0;
  text-align: center;
}

.download-error {
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  margin: 20px 0;
}

.download-error p {
  color: #ef4444;
  font-size: 13px;
  margin: 0;
}

.download-options {
  margin: 20px 0;
}

.download-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.download-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.close-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  margin-top: 12px;
}

.close-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  color: #f8fafc;
}
</style>
