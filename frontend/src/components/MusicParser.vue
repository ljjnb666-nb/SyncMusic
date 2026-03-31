<template>
  <div class="music-parser">
    <!-- 链接输入卡片 -->
    <div class="card mb-6">
      <div class="card-header">
        <h2 class="section-title">
          <AppIcon name="link" :size="20" class="section-icon" />
          输入音乐链接
        </h2>
      </div>
      <div class="input-group">
        <input
          v-model="musicUrl"
          type="text"
          placeholder="输入QQ音乐/网易云/酷狗音乐链接..."
          class="input"
          @keyup.enter="handleParse"
        />
        <select v-model="selectedQuality" class="input select">
          <option value="128k">128K MP3</option>
          <option value="320k">320K MP3</option>
          <option value="flac">FLAC 无损</option>
          <option value="hi-res">Hi-Res 最高音质</option>
        </select>
      </div>
      <div class="btn-group">
        <button
          @click="handleParse"
          :disabled="loading"
          class="btn btn-primary"
        >
          <AppIcon v-if="loading" name="loader" :size="18" class="animate-spin" />
          <template v-else>
            <AppIcon name="search" :size="18" />
            <span>解析</span>
          </template>
        </button>
        <button
          @click="handleDownload"
          :disabled="loading || !parsedSong"
          class="btn btn-success"
        >
          <AppIcon name="download" :size="18" />
          <span>下载</span>
        </button>
      </div>
    </div>

    <!-- 解析结果 -->
    <div v-if="parsedSong" class="card card-glow mb-6">
      <div class="song-info">
        <div class="song-cover">
          <img v-if="parsedSong.coverUrl" :src="parsedSong.coverUrl" class="cover-img" />
          <div v-else class="cover-placeholder">
            <AppIcon name="music" :size="48" />
          </div>
        </div>
        <div class="song-details">
          <h3 class="song-title">{{ parsedSong.title }}</h3>
          <p class="song-artist">{{ parsedSong.artist }}</p>
          <p class="song-album">{{ parsedSong.album }}</p>
          <div class="song-meta">
            <span v-if="parsedSong.duration" class="badge badge-primary">
              ⏱️ {{ formatDuration(parsedSong.duration) }}
            </span>
            <span v-if="parsedSong.message" class="badge badge-warning">
              ⚠️ {{ parsedSong.message }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 歌词显示 -->
    <div v-if="parsedSong?.lyric" class="card mb-6">
      <h2 class="section-title">
        <AppIcon name="file-text" :size="20" class="section-icon" />
        歌词
      </h2>
      <pre class="lyrics">{{ parsedSong.lyric }}</pre>
    </div>

    <!-- 歌单解析 -->
    <div class="card mb-6">
      <h2 class="section-title">
        <AppIcon name="list-music" :size="20" class="section-icon" />
        歌单解析
      </h2>
      <div class="input-group">
        <input
          v-model="playlistUrl"
          type="text"
          placeholder="输入QQ音乐/网易云/酷狗音乐歌单链接..."
          class="input"
          @keyup.enter="handleParsePlaylist"
        />
        <button
          @click="handleParsePlaylist"
          :disabled="loadingPlaylist"
          class="btn btn-primary"
        >
          <AppIcon v-if="loadingPlaylist" name="loader" :size="18" class="animate-spin" />
          <template v-else>
            <AppIcon name="download" :size="18" />
            <span>解析歌单</span>
          </template>
        </button>
      </div>
    </div>

    <!-- 歌单解析结果 -->
    <div v-if="parsedPlaylist" class="card mb-6">
      <div class="playlist-header">
        <h2 class="playlist-title">
          {{ parsedPlaylist.title }}
          <span class="song-count">({{ parsedPlaylist.songCount }} 首)</span>
        </h2>
        <div class="playlist-actions">
          <button @click="selectAll" class="btn btn-secondary">
            {{ selectedCount === parsedPlaylist.songCount ? '取消全选' : '全选' }}
          </button>
          <button
            @click="$emit('download-selected')"
            :disabled="selectedCount === 0 || downloadingSelected"
            class="btn btn-success"
          >
            {{ downloadingSelected ? '下载中...' : `下载选中 (${selectedCount})` }}
          </button>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>歌曲</th>
              <th>歌手</th>
              <th style="width: 80px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(song, index) in parsedPlaylist.songs" :key="song.id">
              <td>
                <input type="checkbox" v-model="song.selected" class="checkbox" />
              </td>
              <td class="song-name">{{ song.title }}</td>
              <td class="text-muted">{{ song.singer || '未知' }}</td>
              <td>
                <button
                  v-if="song.downloading"
                  disabled
                  class="btn btn-secondary btn-sm"
                >
                  <AppIcon name="loader" :size="14" class="animate-spin" />
                </button>
                <button
                  v-else
                  @click="$emit('download-song', song)"
                  class="btn btn-primary btn-sm"
                >
                  <AppIcon name="download" :size="14" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 搜索音乐 -->
    <div class="card mb-6">
      <h2 class="section-title">
        <AppIcon name="music2" :size="20" class="section-icon" />
        搜索音乐
      </h2>
      <div class="input-group">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="输入歌曲名或歌手..."
          class="input"
          @keyup.enter="$emit('search', searchKeyword)"
        />
        <button
          @click="$emit('search', searchKeyword)"
          :disabled="loadingSearch"
          class="btn btn-primary"
        >
          <AppIcon v-if="loadingSearch" name="loader" :size="18" class="animate-spin" />
          <template v-else>
            <AppIcon name="search" :size="18" />
            <span>搜索</span>
          </template>
        </button>
      </div>

      <!-- 骨架屏 -->
      <div v-if="loadingSearch" class="search-results">
        <div v-for="i in 3" :key="i" class="search-item skeleton-item">
          <div class="skeleton" style="width: 48px; height: 48px; border-radius: 12px;"></div>
          <div class="skeleton-text">
            <div class="skeleton" style="width: 60%; height: 16px;"></div>
            <div class="skeleton" style="width: 40%; height: 14px; margin-top: 8px;"></div>
          </div>
        </div>
      </div>

      <!-- 搜索结果列表 -->
      <div v-else-if="searched && searchResults.length > 0" class="search-results">
        <div
          v-for="song in searchResults"
          :key="song.id"
          class="search-item"
        >
          <div class="search-icon">
            <AppIcon :name="getPlatformIcon(song.source || song.platform)" :size="20" />
          </div>
          <div class="search-info">
            <p class="search-title">{{ song.title }}</p>
            <p class="search-artist">{{ song.artist }} • {{ getPlatformName(song.source || song.platform) }}</p>
          </div>
          <div class="search-actions">
            <FavoriteButton :song="song" :size="18" />
            <button
              v-if="hasRoom"
              @click="$emit('add-to-playlist', song)"
              class="btn btn-secondary btn-sm"
            >
              <AppIcon name="plus" :size="14" />
              <span>添加</span>
            </button>
            <button
              @click="$emit('download-song', song)"
              class="btn btn-primary btn-sm"
            >
              <AppIcon name="download" :size="14" />
            </button>
          </div>
        </div>
      </div>
      <div v-else-if="searched && searchResults.length === 0" class="empty-state">
        <AppIcon name="search" :size="40" class="empty-icon" />
        <p>未找到相关歌曲</p>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="card">
      <h2 class="section-title">
        <AppIcon name="help-circle" :size="20" class="section-icon" />
        支持的链接格式
      </h2>
      <ul class="link-list">
        <li>
          <span class="platform-badge">网易云</span>
          https://music.163.com/song?id=347230
        </li>
        <li>
          <span class="platform-badge">QQ</span>
          https://y.qq.com/n/ryms/song/001Qu4vt2xurZd
        </li>
        <li>
          <span class="platform-badge">酷狗</span>
          https://www.kugou.com/yy/song/detail/xxxxx
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { formatDuration } from '../utils/format.js'
import AppIcon from './AppIcon.vue'
import FavoriteButton from './FavoriteButton.vue'

const props = defineProps({
  parsedSong: Object,
  loading: Boolean,
  loadingSearch: Boolean,
  loadingPlaylist: Boolean,
  searchResults: {
    type: Array,
    default: () => []
  },
  searched: Boolean,
  hasRoom: Boolean,
  parsedPlaylist: Object,
  downloadingSelected: Boolean
})

const emit = defineEmits([
  'parse', 'download', 'search', 'add-to-playlist',
  'parse-playlist', 'download-selected', 'download-song'
])

const musicUrl = ref('')
const selectedQuality = ref('320k')
const searchKeyword = ref('')
const playlistUrl = ref('')

const selectedCount = computed(() => {
  if (!props.parsedPlaylist?.songs) return 0
  return props.parsedPlaylist.songs.filter(s => s.selected).length
})

function handleParse() {
  emit('parse', musicUrl.value, selectedQuality.value)
}

function handleDownload() {
  emit('download', musicUrl.value, selectedQuality.value)
}

function handleParsePlaylist() {
  emit('parse-playlist', playlistUrl.value)
}

function selectAll() {
  if (!props.parsedPlaylist?.songs) return
  const allSelected = selectedCount.value === props.parsedPlaylist.songs.length
  props.parsedPlaylist.songs.forEach(s => s.selected = !allSelected)
}

function getPlatformIcon(platform) {
  const map = {
    kugou: 'headphones',
    migu: 'music',
    netease: 'cloud',
    qq: 'headphones'
  }
  return map[platform?.toLowerCase()] || 'music'
}

function getPlatformName(platform) {
  const map = {
    kugou: '酷狗',
    migu: '咪咕',
    netease: '网易云',
    qq: 'QQ音乐'
  }
  return map[platform?.toLowerCase()] || platform
}

onMounted(() => {
  musicUrl.value = ''
  searchKeyword.value = ''
  playlistUrl.value = ''
})
</script>

<style scoped>
.music-parser {
  animation: fadeIn 0.3s ease;
}

.mb-6 {
  margin-bottom: 24px;
}

/* 卡片头部 */
.card-header {
  margin-bottom: 20px;
}

/* 区域标题 */
.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 16px;
}

.section-icon {
  font-size: 20px;
}

/* 输入组 */
.input-group {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.input {
  flex: 1;
  padding: 14px 18px;
  font-size: 15px;
}

.select {
  width: 160px;
  cursor: pointer;
}

/* 按钮组 */
.btn-group {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  outline: none;
}

.btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.4);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(139, 92, 246, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(16, 185, 129, 0.4);
}

.btn-secondary {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.3);
}

.btn-sm {
  padding: 8px 16px;
  font-size: 13px;
}

/* 歌曲信息 */
.song-info {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.song-cover {
  flex-shrink: 0;
}

.cover-img {
  width: 140px;
  height: 140px;
  border-radius: 16px;
  object-fit: cover;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.cover-placeholder {
  width: 140px;
  height: 140px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

.song-details {
  flex: 1;
  padding-top: 8px;
}

.song-title {
  font-size: 26px;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 8px;
}

.song-artist {
  font-size: 16px;
  color: #a78bfa;
  margin-bottom: 4px;
}

.song-album {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 12px;
}

.song-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 徽章 */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
}

.badge-primary {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.badge-warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

/* 歌词 */
.lyrics {
  background: rgba(139, 92, 246, 0.05);
  border-radius: 12px;
  padding: 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.8;
  color: #94a3b8;
  max-height: 300px;
  overflow-y: auto;
}

/* 歌单头部 */
.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.playlist-title {
  font-size: 20px;
  font-weight: 600;
  color: #f8fafc;
}

.song-count {
  font-size: 14px;
  font-weight: 400;
  color: #64748b;
}

.playlist-actions {
  display: flex;
  gap: 12px;
}

/* 表格 */
.table-container {
  background: rgba(26, 26, 36, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.table-container table {
  width: 100%;
  border-collapse: collapse;
}

.table-container th {
  background: rgba(139, 92, 246, 0.08);
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.table-container td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.05);
}

.table-container tr:last-child td {
  border-bottom: none;
}

.table-container tr:hover td {
  background: rgba(139, 92, 246, 0.05);
}

.song-name {
  font-weight: 500;
  color: #f8fafc;
}

.text-muted {
  color: #64748b;
}

/* 复选框 */
.checkbox {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.checkbox:checked {
  background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
  border-color: #8b5cf6;
}

.checkbox:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 11px;
  font-weight: bold;
}

/* 搜索结果 */
.search-results {
  margin-top: 16px;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid transparent;
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.search-item:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.2);
}

.skeleton-item {
  background: rgba(26, 26, 36, 0.6);
}

.skeleton-text {
  flex: 1;
}

.search-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.search-info {
  flex: 1;
  min-width: 0;
}

.search-title {
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-artist {
  font-size: 13px;
  color: #64748b;
}

.search-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.empty-icon {
  display: block;
  margin-bottom: 12px;
  color: #64748b;
  opacity: 0.6;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 链接列表 */
.link-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.link-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(139, 92, 246, 0.05);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #94a3b8;
}

.link-list li:last-child {
  border-bottom: none;
}

.platform-badge {
  padding: 4px 10px;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #a78bfa;
  white-space: nowrap;
}

/* 卡片 */
.card {
  background: rgba(26, 26, 36, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 20px;
  padding: 28px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.card:hover {
  border-color: rgba(139, 92, 246, 0.2);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
}

.card-glow {
  box-shadow: 0 0 40px rgba(139, 92, 246, 0.15);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
