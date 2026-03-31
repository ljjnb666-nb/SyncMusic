<template>
  <div class="room-player">
    <!-- 歌词面板 -->
    <div v-if="showLyrics && roomId" class="lyrics-section">
      <LyricsPanel
        v-if="isHost"
        :lyrics="lyrics"
        :current-time="currentTime"
        :duration="currentSong?.duration || 0"
        :loading="loadingLyrics"
        :fetched="lyricsFetched"
        @close="showLyrics = false"
        @fetch="fetchLyrics"
        @seek="onLyricsSeek"
      />
    </div>

    <!-- 房间控制卡片 -->
    <div class="card mb-6">
      <h2 class="section-title">
        <AppIcon name="headphones" :size="20" class="section-icon" />
        同步房间
      </h2>
      <div class="room-controls">
        <button
          @click="$emit('create-room')"
          :disabled="!!roomId"
          class="btn btn-success"
        >
          <AppIcon name="sparkles" :size="18" />
          <span>创建房间</span>
        </button>
        <div class="input-wrapper">
          <input
            v-model="joinRoomId"
            placeholder="输入房间号..."
            class="input"
            :disabled="!!roomId"
            @keyup.enter="$emit('join-room', joinRoomId)"
          />
        </div>
        <button
          @click="$emit('join-room', joinRoomId)"
          :disabled="!!roomId || !joinRoomId"
          class="btn btn-primary"
        >
          <AppIcon name="log-in" :size="18" />
          <span>加入房间</span>
        </button>
      </div>
    </div>

    <!-- 已加入房间信息 -->
    <div v-if="roomId" class="card card-active mb-6">
      <div class="room-header">
        <div class="room-info">
          <div class="room-id-display">
            <span class="room-label">房间号</span>
            <span class="room-id">{{ roomId }}</span>
          </div>
          <div class="room-status">
            <span :class="['status-badge', isHost ? 'badge-host' : 'badge-listener']">
              <AppIcon v-if="isHost" name="crown" :size="14" />
              <AppIcon v-else name="headphones" :size="14" />
              <span>{{ isHost ? '房主' : '听众' }}</span>
            </span>
            <span class="listener-count">
              <AppIcon name="users" :size="14" />
              <span>{{ listeners.length }} 位听众</span>
            </span>
          </div>
        </div>
        <button @click="$emit('leave-room')" class="btn btn-danger">
          <AppIcon name="log-out" :size="18" />
          <span>离开房间</span>
        </button>
      </div>

      <div :class="['role-tip', isHost ? 'tip-host' : 'tip-listener']">
        <AppIcon v-if="isHost" name="zap" :size="16" />
        <AppIcon v-else name="link" :size="16" />
        <span>{{ isHost ? '房主可以控制播放，听众会自动同步' : '跟随房主播放控制' }}</span>
      </div>
    </div>

    <!-- 本地音乐库 (房主可用) -->
    <div v-if="roomId && isHost" class="card mb-6">
      <h3 class="subsection-title">
        <AppIcon name="folder" :size="16" />
        <span>本地音乐</span>
      </h3>

      <!-- 文件夹路径设置 -->
      <div class="input-group">
        <input
          v-model="localMusicPath"
          type="text"
          placeholder="输入音乐文件夹路径，如 D:\Music"
          class="input input-mono"
          @keyup.enter="$emit('load-local-music', localMusicPath)"
        />
        <button @click="$emit('load-local-music', localMusicPath)" class="btn btn-primary">
          <AppIcon name="folder-open" :size="16" />
          <span>加载</span>
        </button>
      </div>

      <!-- 导入音乐按钮 -->
      <div class="import-actions">
        <button @click="$emit('import-music')" class="btn btn-secondary">
          <AppIcon name="upload" :size="16" />
          <span>导入音乐文件</span>
        </button>
        <span class="hint-text">支持 mp3 / flac / m4a</span>
      </div>

      <!-- 本地音乐列表 -->
      <div v-if="localMusic.length === 0" class="empty-state">
        <AppIcon name="music" :size="40" class="empty-icon" />
        <p>暂无本地音乐，请设置路径或导入文件</p>
      </div>
      <div v-else class="music-list">
        <div
          v-for="song in localMusic"
          :key="song.path"
          class="music-item"
        >
          <div class="music-info">
            <p class="music-title">{{ song.title }}</p>
            <p class="music-artist">{{ song.artist }}</p>
          </div>
          <button @click="$emit('add-local-to-playlist', song)" class="btn btn-secondary btn-sm">
            <AppIcon name="plus" :size="14" />
            <span>添加</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 播放器卡片 -->
    <div v-if="roomId" class="card">
      <h3 class="subsection-title">
        <AppIcon name="disc" :size="16" />
        <span>播放控制</span>
      </h3>

      <!-- 当前播放歌曲 -->
      <div v-if="currentSong" class="now-playing">
        <div class="cover-wrapper">
          <div v-if="currentSong.coverUrl" class="cover-container">
            <img :src="currentSong.coverUrl" class="cover-img" />
          </div>
          <div v-else class="cover-placeholder">
            <AppIcon name="music" :size="32" class="music-icon" />
          </div>
          <div v-if="isPlaying" class="playing-indicator">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </div>
        </div>
        <div class="now-info">
          <p class="now-title">{{ currentSong.title }}</p>
          <p class="now-artist">{{ currentSong.artist }}</p>
          <p class="now-duration">
            ⏱️ {{ currentSong.duration ? formatDuration(currentSong.duration) : '加载中...' }}
          </p>
        </div>
        <div v-if="isHost" class="play-controls">
          <button @click="$emit('toggle-play')" class="btn btn-primary play-btn">
            <AppIcon :name="isPlaying ? 'pause' : 'play'" :size="18" />
            <span>{{ isPlaying ? '暂停' : '播放' }}</span>
          </button>
          <button @click="$emit('play-next')" class="btn btn-secondary">
            <AppIcon name="skip-forward" :size="16" />
            <span>下一首</span>
          </button>
          <button @click="$emit('change-play-mode')" class="btn btn-secondary mode-btn" :title="modeLabel">
            <AppIcon :name="modeIcon" :size="16" />
          </button>
          <button @click="showLyrics = !showLyrics" class="btn btn-secondary">
            <AppIcon name="mic" :size="16" />
            <span>{{ showLyrics ? '隐藏歌词' : '歌词' }}</span>
          </button>
        </div>
        <div v-else class="sync-status">
          <span :class="['sync-badge', isPlaying ? 'playing' : 'paused']">
            <AppIcon :name="isPlaying ? 'volume' : 'pause'" :size="14" />
            <span>{{ isPlaying ? '正在播放' : '已暂停' }}</span>
          </span>
        </div>
      </div>
      <div v-else class="empty-state">
        <AppIcon name="list-music" :size="40" class="empty-icon" />
        <p>播放列表为空，请添加歌曲</p>
      </div>

      <!-- 进度条 -->
      <div v-if="currentSong && isHost" class="progress-section">
        <input
          type="range"
          v-model="localCurrentTime"
          :max="currentSong.duration || 100"
          @input="onSeek"
          class="progress-bar"
        />
        <div class="progress-time">
          <span>{{ formatDuration(localCurrentTime) }}</span>
          <span>{{ formatDuration(currentSong.duration || 0) }}</span>
        </div>
      </div>

      <!-- 音量控制 -->
      <div v-if="isHost" class="volume-section">
        <AppIcon name="volume" :size="18" class="volume-icon" />
        <input
          type="range"
          v-model="localVolume"
          min="0"
          max="100"
          class="volume-bar"
        />
        <span class="volume-value">{{ localVolume }}%</span>
      </div>

      <!-- 播放列表 -->
      <div class="playlist-section">
        <div class="playlist-header">
          <h4 class="playlist-title">
            <AppIcon name="list-music" :size="16" />
            <span>播放列表</span>
            <span class="count">({{ playlist.length }} 首)</span>
          </h4>
        </div>

        <div v-if="playlist.length === 0" class="empty-playlist">
          暂无歌曲
        </div>
        <div v-else class="playlist">
          <TransitionGroup name="list">
            <div
              v-for="(song, index) in playlist"
              :key="song.id || index"
              :class="['playlist-item', { active: index === currentIndex }]"
              @click="isHost && $emit('change-song', index)"
            >
              <span class="playlist-index">
                <AppIcon v-if="index === currentIndex && isPlaying" name="music" :size="14" class="playing-icon" />
                <span v-else>{{ index + 1 }}</span>
              </span>
              <div class="playlist-info">
                <p class="playlist-title-text">{{ song.title }}</p>
                <p class="playlist-artist">{{ song.artist }}</p>
              </div>
              <span
                v-if="isHost"
                class="remove-btn"
                @click.stop="$emit('remove-song', index)"
              >
                <AppIcon name="x" :size="14" />
              </span>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { TransitionGroup, ref, watch, computed } from 'vue'
import { formatDuration } from '../utils/format.js'
import { getLyrics } from '../api/music.js'
import AppIcon from './AppIcon.vue'
import LyricsPanel from './LyricsPanel.vue'

const props = defineProps({
  roomId: String,
  isHost: Boolean,
  listeners: {
    type: Array,
    default: () => []
  },
  playlist: {
    type: Array,
    default: () => []
  },
  currentIndex: Number,
  currentSong: Object,
  isPlaying: Boolean,
  currentTime: Number,
  volume: [Number, String],
  playMode: {
    type: String,
    default: 'list'
  },
  localMusic: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'create-room', 'join-room', 'leave-room',
  'toggle-play', 'play-next', 'change-song', 'remove-song',
  'seek', 'volume-change',
  'load-local-music', 'import-music', 'add-local-to-playlist',
  'change-play-mode'
])

// 播放模式图标和标签
const modeIcon = computed(() => {
  const icons = { list: 'list-music', single: 'repeat-one', shuffle: 'shuffle' }
  return icons[props.playMode] || 'list-music'
})

const modeLabel = computed(() => {
  const labels = { list: '列表循环', single: '单曲循环', shuffle: '随机播放' }
  return labels[props.playMode] || '列表循环'
})

// 本地状态 (v-model 支持)
const joinRoomId = ref('')
const localMusicPath = ref('')
const localCurrentTime = ref(0)
const localVolume = ref(80)

// 歌词状态
const showLyrics = ref(false)
const lyrics = ref([])
const lyricsFetched = ref(false)
const loadingLyrics = ref(false)

// 监听外部变化同步到本地
watch(() => props.currentTime, (val) => { localCurrentTime.value = val })
watch(() => props.volume, (val) => { localVolume.value = val })

// 双向绑定到父组件
watch(localCurrentTime, (val) => emit('seek', val))
watch(localVolume, (val) => emit('volume-change', val))

function onSeek() {
  emit('seek', localCurrentTime.value)
}

function onLyricsSeek(time) {
  emit('seek', time)
}

// 获取歌词
async function fetchLyrics() {
  if (!props.currentSong) return

  loadingLyrics.value = true
  lyrics.value = []
  lyricsFetched.value = false

  try {
    const result = await getLyrics(props.currentSong.title, props.currentSong.artist)
    if (result.success && result.lyrics) {
      lyrics.value = result.lyrics
      lyricsFetched.value = true
    }
  } catch (error) {
    console.error('获取歌词失败:', error)
  } finally {
    loadingLyrics.value = false
  }
}

// 监听歌曲变化，自动获取歌词
watch(() => props.currentSong, (song) => {
  if (song && showLyrics.value) {
    lyrics.value = []
    lyricsFetched.value = false
    fetchLyrics()
  }
}, { immediate: true })
</script>

<style scoped>
.room-player {
  animation: fadeIn 0.3s ease;
}

/* 歌词区域 */
.lyrics-section {
  margin-bottom: 24px;
  height: 320px;
}

.mb-6 {
  margin-bottom: 24px;
}

/* 标题 */
.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 20px;
}

.section-icon {
  font-size: 20px;
}

.subsection-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 16px;
}

/* 房间控制 */
.room-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.input-wrapper {
  flex: 1;
  min-width: 150px;
}

/* 房间信息卡片 */
.card-active {
  border-color: rgba(139, 92, 246, 0.3);
  background: linear-gradient(145deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.room-info {
  flex: 1;
}

.room-id-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.room-label {
  font-size: 14px;
  color: #64748b;
}

.room-id {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 2px;
}

.room-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
}

.badge-host {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
  color: #a78bfa;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.badge-listener {
  background: rgba(6, 182, 212, 0.15);
  color: #22d3ee;
  border: 1px solid rgba(6, 182, 212, 0.3);
}

.listener-count {
  color: #64748b;
  font-size: 14px;
}

.role-tip {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
}

.tip-host {
  background: rgba(168, 85, 247, 0.1);
  color: #a78bfa;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.tip-listener {
  background: rgba(6, 182, 212, 0.1);
  color: #22d3ee;
  border: 1px solid rgba(6, 182, 212, 0.2);
}

/* 按钮 */
.btn {
  padding: 12px 20px;
  font-size: 14px;
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

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(239, 68, 68, 0.4);
}

.btn-sm {
  padding: 8px 14px;
  font-size: 13px;
}

/* 输入框 */
.input {
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  background: rgba(15, 15, 20, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #f8fafc;
  transition: all 0.2s ease;
}

.input::placeholder {
  color: #64748b;
}

.input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
}

.input-mono {
  font-family: 'JetBrains Mono', monospace;
}

/* 输入组 */
.input-group {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.import-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.hint-text {
  color: #64748b;
  font-size: 13px;
}

/* 当前播放 */
.now-playing {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 20px;
  background: rgba(139, 92, 246, 0.08);
  border-radius: 16px;
  margin-bottom: 20px;
}

.cover-wrapper {
  position: relative;
  flex-shrink: 0;
}

.cover-container {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a78bfa;
}

.music-icon {
  color: #a78bfa;
}

.playing-indicator {
  position: absolute;
  bottom: -8px;
  right: -8px;
  display: flex;
  gap: 2px;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
}

.playing-indicator .bar {
  width: 3px;
  height: 12px;
  background: linear-gradient(to top, #8b5cf6, #06b6d4);
  border-radius: 2px;
  animation: bounce 0.8s ease-in-out infinite;
}

.playing-indicator .bar:nth-child(2) {
  animation-delay: 0.2s;
}

.playing-indicator .bar:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%, 100% { height: 4px; }
  50% { height: 12px; }
}

.now-info {
  flex: 1;
  min-width: 0;
}

.now-title {
  font-size: 18px;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.now-artist {
  font-size: 14px;
  color: #a78bfa;
  margin-bottom: 4px;
}

.now-duration {
  font-size: 12px;
  color: #64748b;
}

.play-controls {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.play-btn {
  padding: 14px 24px;
  font-size: 15px;
}

.mode-btn {
  padding: 12px 14px;
  min-width: 44px;
  justify-content: center;
}

.sync-status {
  flex-shrink: 0;
}

.sync-badge {
  padding: 10px 16px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 500;
}

.sync-badge.playing {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.sync-badge.paused {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

/* 进度条 */
.progress-section {
  margin-bottom: 16px;
}

.progress-bar {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: rgba(139, 92, 246, 0.2);
  border-radius: 3px;
  cursor: pointer;
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
  cursor: pointer;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
  transition: transform 0.2s;
}

.progress-bar::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.progress-time {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
}

/* 音量控制 */
.volume-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.volume-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.volume-bar {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  height: 4px;
  background: rgba(139, 92, 246, 0.2);
  border-radius: 2px;
  cursor: pointer;
}

.volume-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
  cursor: pointer;
}

.volume-value {
  width: 45px;
  text-align: right;
  font-size: 13px;
  color: #64748b;
  flex-shrink: 0;
}

/* 播放列表 */
.playlist-section {
  margin-top: 20px;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.playlist-title {
  font-size: 15px;
  font-weight: 600;
  color: #f8fafc;
}

.count {
  font-weight: 400;
  color: #64748b;
}

.empty-playlist {
  text-align: center;
  padding: 30px;
  color: #64748b;
  font-size: 14px;
}

.playlist {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 4px;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(139, 92, 246, 0.03);
  border: 1px solid transparent;
  border-radius: 10px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.playlist-item:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.15);
}

.playlist-item.active {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
}

.playlist-index {
  width: 24px;
  text-align: center;
  font-size: 13px;
  color: #64748b;
  flex-shrink: 0;
}

.playing-icon {
  font-size: 14px;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.playlist-info {
  flex: 1;
  min-width: 0;
}

.playlist-title-text {
  font-size: 14px;
  font-weight: 500;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-artist {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.remove-btn {
  padding: 4px 10px;
  font-size: 12px;
  color: #64748b;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.remove-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* 本地音乐列表 */
.music-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.music-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(139, 92, 246, 0.03);
  border: 1px solid transparent;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.music-item:hover {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.15);
}

.music-info {
  flex: 1;
  min-width: 0;
}

.music-title {
  font-size: 14px;
  font-weight: 500;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-artist {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 30px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 8px;
}

/* 卡片 */
.card {
  background: rgba(26, 26, 36, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 20px;
  padding: 24px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.card:hover {
  border-color: rgba(139, 92, 246, 0.2);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
}

/* 列表动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
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
