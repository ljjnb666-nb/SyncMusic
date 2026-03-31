<template>
  <div class="playlist-page">
    <div class="page-header">
      <h1 class="page-title">
        <AppIcon name="list-music" :size="28" />
        <span>歌单</span>
      </h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="clearPlaylist">
          <AppIcon name="trash" :size="16" />
          <span>清空</span>
        </button>
      </div>
    </div>

    <!-- 本地音乐区域 -->
    <div class="local-music-section">
      <div class="section-header">
        <h2 class="section-title">
          <AppIcon name="folder" :size="18" />
          <span>本地音乐</span>
        </h2>
        <button @click="$emit('import-music')" class="btn-secondary btn-sm">
          <AppIcon name="upload" :size="14" />
          <span>导入</span>
        </button>
      </div>
      <div class="input-group">
        <input
          v-model="localMusicPath"
          type="text"
          placeholder="输入音乐文件夹路径，如 D:\Music"
          class="input input-mono"
          @keyup.enter="loadLocalMusic(localMusicPath)"
        />
        <button @click="loadLocalMusic(localMusicPath)" class="btn-primary">
          <AppIcon name="folder-open" :size="16" />
          <span>加载</span>
        </button>
      </div>
      <p class="hint-text">支持 mp3 / flac / m4a</p>

      <!-- 本地音乐列表 -->
      <div v-if="localMusic.length === 0" class="empty-state-sm">
        <AppIcon name="music" :size="32" class="empty-icon" />
        <p>暂无本地音乐</p>
      </div>
      <div v-else class="local-music-list">
        <div
          v-for="(song, index) in paginatedLocalMusic"
          :key="song.path"
          class="song-item"
        >
          <div class="song-info">
            <div class="song-title">{{ song.title }}</div>
            <div class="song-meta">{{ song.artist }}</div>
          </div>
          <div class="song-actions">
            <FavoriteButton :song="song" :size="16" />
            <button @click="addToPlaylist(song)" class="btn-icon-sm" title="添加到歌单">
              <AppIcon name="plus" :size="14" />
            </button>
            <button @click="playSong(song)" class="btn-icon-sm" title="播放">
              <AppIcon name="play" :size="14" />
            </button>
          </div>
        </div>
        <!-- 分页 -->
        <div v-if="localMusicTotalPages > 1" class="pagination">
          <button
            class="btn-page"
            :disabled="localMusicPage === 1"
            @click="localMusicPage--"
          >
            <AppIcon name="chevron-left" :size="16" />
          </button>
          <span class="page-info">{{ localMusicPage }} / {{ localMusicTotalPages }}</span>
          <button
            class="btn-page"
            :disabled="localMusicPage === localMusicTotalPages"
            @click="localMusicPage++"
          >
            <AppIcon name="chevron-right" :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- 播放列表 -->
    <div class="playlist-section">
      <div class="section-header">
        <h2 class="section-title">
          <AppIcon name="list-music" :size="18" />
          <span>播放列表</span>
          <span class="count">({{ playerStore.playlist.length }} 首)</span>
        </h2>
      </div>

      <div v-if="playerStore.playlist.length === 0" class="empty-state">
        <AppIcon name="music" :size="48" class="empty-icon" />
        <p class="empty-text">播放列表为空</p>
        <p class="empty-hint">从上方本地音乐添加歌曲到歌单</p>
      </div>

      <div v-else>
        <div class="song-list">
          <div
            v-for="(song, index) in paginatedPlaylist"
            :key="song.id || index"
            :class="['song-item', { active: index === actualPlayingIndex }]"
            @click="playSongByIndex(index)"
          >
            <div class="song-index">
              <span class="index-num">{{ (playlistPage - 1) * playlistPageSize + index + 1 }}</span>
              <div v-if="index === actualPlayingIndex && playerStore.isPlaying" class="playing-indicator">
                <span class="bar"></span>
                <span class="bar"></span>
                <span class="bar"></span>
              </div>
              <AppIcon v-else name="play" :size="12" class="play-icon" />
            </div>
            <div class="song-info">
              <div class="song-title">{{ song.title }}</div>
              <div class="song-meta">{{ song.artist }}</div>
            </div>
            <div class="song-duration">
              {{ formatDuration(song.duration) }}
            </div>
            <div class="song-actions">
              <FavoriteButton :song="song" :size="16" />
              <button @click.stop="removeSong(index)" class="btn-icon-sm" title="移除">
                <AppIcon name="trash" :size="14" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="playlistTotalPages > 1" class="pagination">
          <button
            class="btn-page"
            :disabled="playlistPage === 1"
            @click="playlistPage--"
          >
            <AppIcon name="chevron-left" :size="16" />
          </button>
          <span class="page-info">{{ playlistPage }} / {{ playlistTotalPages }}</span>
          <button
            class="btn-page"
            :disabled="playlistPage === playlistTotalPages"
            @click="playlistPage++"
          >
            <AppIcon name="chevron-right" :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, toRef } from 'vue'
import { usePlayerStore } from '../stores/player.js'
import { formatDuration } from '../utils/format.js'
import AppIcon from '../components/AppIcon.vue'
import FavoriteButton from '../components/FavoriteButton.vue'

const emit = defineEmits(['load-local-music', 'import-music', 'play', 'add-to-playlist'])

const playerStore = usePlayerStore()

const props = defineProps({
  localMusic: {
    type: Array,
    default: () => []
  }
})

const localMusicPath = ref('')
const localMusicPage = ref(1)
const localMusicPageSize = 10
const playlistPage = ref(1)
const playlistPageSize = 20

// 本地音乐使用 props.localMusic
const localMusic = toRef(props, 'localMusic')

// 本地音乐分页
const localMusicTotalPages = computed(() => Math.ceil(localMusic.value.length / localMusicPageSize) || 1)
const paginatedLocalMusic = computed(() => {
  const start = (localMusicPage.value - 1) * localMusicPageSize
  return localMusic.value.slice(start, start + localMusicPageSize)
})

// 播放列表分页
const playlistTotalPages = computed(() => Math.ceil(playerStore.playlist.length / playlistPageSize) || 1)
const paginatedPlaylist = computed(() => {
  const start = (playlistPage.value - 1) * playlistPageSize
  return playerStore.playlist.slice(start, start + playlistPageSize)
})

const currentPlayingIndex = computed(() => playerStore.currentIndex)

// 计算实际播放列表中的索引（考虑分页）
const actualPlayingIndex = computed(() => {
  if (playerStore.currentIndex < 0) return -1
  const start = (playlistPage.value - 1) * playlistPageSize
  const end = start + playlistPageSize
  if (playerStore.currentIndex >= start && playerStore.currentIndex < end) {
    return playerStore.currentIndex - start
  }
  return -1
})

function loadLocalMusic(path) {
  if (!path) return
  emit('load-local-music', path)
}

function addToPlaylist(song) {
  emit('add-to-playlist', song)
}

function playSong(song) {
  // 直接播放这首歌：设置播放列表为当前歌曲，开始播放
  playerStore.setPlaylist([song])
  playerStore.setCurrentIndex(0)
  playerStore.setPlaying(true)
  // 通知 Home.vue 播放
  emit('play', 0)
}

function playSongByIndex(index) {
  const actualIndex = (playlistPage.value - 1) * playlistPageSize + index
  playerStore.setCurrentIndex(actualIndex)
  playerStore.setPlaying(true)
  // 通知 Home.vue 播放
  emit('play', actualIndex)
}

function removeSong(index) {
  const actualIndex = (playlistPage.value - 1) * playlistPageSize + index
  playerStore.removeSong(actualIndex)
  if (playlistPage.value > playlistTotalPages.value && playlistPage.value > 1) {
    playlistPage.value = playlistTotalPages.value
  }
}

function clearPlaylist() {
  if (confirm('确定要清空播放列表吗？')) {
    playerStore.clear()
    playlistPage.value = 1
  }
}

// 更新本地音乐列表（通过 playerStore 或直接通过 prop 传入）
// 这里假设通过 defineExpose 或事件从 Home.vue 获取
</script>

<style scoped>
.playlist-page {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.header-actions {
  display: flex;
  gap: 12px;
}

/* 分区 */
.local-music-section {
  background: rgba(26, 26, 36, 0.6);
  border-radius: 16px;
  border: 1px solid rgba(139, 92, 246, 0.12);
  padding: 20px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc;
}

.count {
  font-weight: 400;
  color: #64748b;
}

/* 本地音乐列表 */
.local-music-list {
  margin-top: 16px;
}

.local-music-list .song-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.local-music-list .song-item:hover {
  background: rgba(139, 92, 246, 0.08);
}

.local-music-list .song-info {
  flex: 1;
  min-width: 0;
}

.local-music-list .song-title {
  font-size: 14px;
  font-weight: 500;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.local-music-list .song-meta {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.local-music-list .song-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.local-music-list .song-item:hover .song-actions {
  opacity: 1;
}

/* 播放列表 */
.playlist-section {
  background: rgba(26, 26, 36, 0.6);
  border-radius: 16px;
  border: 1px solid rgba(139, 92, 246, 0.12);
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-state-sm {
  text-align: center;
  padding: 30px 20px;
  color: #64748b;
}

.empty-icon {
  color: #64748b;
  opacity: 0.4;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 16px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.empty-hint {
  font-size: 14px;
  color: #64748b;
}

.song-list {
  max-height: 400px;
  overflow-y: auto;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.song-item:hover {
  background: rgba(139, 92, 246, 0.08);
}

.song-item.active {
  background: rgba(139, 92, 246, 0.12);
}

.song-item.active .song-title {
  color: #a78bfa;
}

.song-index {
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.index-num {
  font-size: 13px;
  color: #64748b;
}

.play-icon {
  color: #64748b;
  opacity: 0;
  transition: opacity 0.2s;
}

.song-item:hover .play-icon {
  opacity: 1;
}

.playing-indicator {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 12px;
}

.playing-indicator .bar {
  width: 3px;
  background: #a78bfa;
  border-radius: 1px;
  animation: equalize 0.8s ease-in-out infinite;
}

.playing-indicator .bar:nth-child(1) { animation-delay: 0s; height: 6px; }
.playing-indicator .bar:nth-child(2) { animation-delay: 0.2s; height: 10px; }
.playing-indicator .bar:nth-child(3) { animation-delay: 0.4s; height: 4px; }

@keyframes equalize {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.5); }
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 14px;
  font-weight: 500;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-meta {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.song-duration {
  font-size: 12px;
  color: #64748b;
  flex-shrink: 0;
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

/* 按钮 */
.btn-icon-sm {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(139, 92, 246, 0.1);
  color: #a78bfa;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon-sm:hover {
  background: rgba(139, 92, 246, 0.2);
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(139, 92, 246, 0.1);
  color: #a78bfa;
  border: 1px solid rgba(139, 92, 246, 0.2);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-secondary:hover {
  background: rgba(139, 92, 246, 0.2);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 8px;
  background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

/* 输入 */
.input-group {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.input {
  flex: 1;
  padding: 12px 16px;
  font-size: 14px;
  border-radius: 8px;
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.15);
  color: #f8fafc;
  outline: none;
}

.input::placeholder {
  color: #64748b;
}

.input:focus {
  border-color: rgba(139, 92, 246, 0.4);
}

.input-mono {
  font-family: 'JetBrains Mono', monospace;
}

.hint-text {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 16px;
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  margin-top: 12px;
  border-top: 1px solid rgba(139, 92, 246, 0.1);
}

.btn-page {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(139, 92, 246, 0.1);
  color: #a78bfa;
  border: 1px solid rgba(139, 92, 246, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-page:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.2);
}

.btn-page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #64748b;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
</style>
