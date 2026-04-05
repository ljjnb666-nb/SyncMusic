<template>
  <div class="room-view">
    <div class="room-bg"></div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <svg class="spinner" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="30 70"/>
      </svg>
      <p>正在连接房间...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <h2>房间不存在</h2>
      <p>{{ error }}</p>
      <button @click="goHome" class="back-btn">返回首页</button>
    </div>

    <!-- Room Content -->
    <div v-else class="room-content">
      <!-- Hidden Audio Player -->
      <AudioPlayer
        ref="audioPlayerRef"
        :src="currentTrackSrc"
        :volume="volume"
        @timeupdate="onAudioTimeUpdate"
        @ended="onAudioEnded"
        @loaded="onAudioLoaded"
      />
      <!-- Room Header -->
      <header class="room-header">
        <button @click="confirmLeave" class="back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="room-info">
          <h1 class="room-name">{{ roomStore.name || '房间' }}</h1>
          <p class="room-id">房间号: {{ roomStore.id }}</p>
        </div>
        <button @click="copyInviteLink" class="share-btn">
          <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          <span v-else>已复制!</span>
        </button>
      </header>

      <!-- Host Indicator -->
      <div class="host-indicator">
        <span v-if="roomStore.isHost" class="host-you">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          你现在是房主
        </span>
        <span v-else class="host-other">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          房主: {{ hostParticipant?.username || '未知' }}
        </span>
      </div>

      <!-- Participant List -->
      <div class="room-section">
        <ParticipantList />
      </div>

      <!-- Playback Area -->
      <div class="room-section playback-section">
        <div v-if="playerStore.currentSong" class="player-card">
          <div class="now-playing">
            <div class="track-info">
              <p class="track-title">{{ playerStore.currentSong?.title || '未知歌曲' }}</p>
              <p class="track-artist">{{ playerStore.currentSong?.artist || '未知艺术家' }}</p>
            </div>
            <div class="player-controls">
              <button v-if="roomStore.isHost" @click="togglePlay" class="play-btn">
                <svg v-if="!playerStore.isPlaying" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              </button>
              <div v-else class="sync-badge" :class="playerStore.isPlaying ? 'playing' : 'paused'">
                <span>{{ playerStore.isPlaying ? '同步播放中' : '已暂停' }}</span>
              </div>
            </div>
          </div>
          <div class="progress-bar-container">
            <span class="time-label">{{ formatTime(currentTime) }}</span>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <span class="time-label">{{ formatTime(duration) }}</span>
          </div>
        </div>
        <div v-else class="playback-placeholder">
          <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="10 8 16 12 10 16 10 8"/>
          </svg>
          <p>暂无音乐播放</p>
          <p class="placeholder-hint">请先在歌单页面导入音乐，或搜索添加</p>
        </div>
      </div>

      <!-- Room Playlist (显示房间里已添加的歌曲) -->
      <div v-if="playerStore.playlist.length > 0" class="room-section">
        <h3 class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          播放列表
          <span class="playlist-count">({{ playerStore.playlist.length }} 首)</span>
        </h3>
        <div class="room-playlist">
          <div
            v-for="(song, index) in playerStore.playlist"
            :key="song.id || index"
            :class="['room-playlist-item', { active: index === playerStore.currentIndex }]"
            @click="playFromPlaylist(index)"
          >
            <div class="playlist-item-info">
              <span class="playlist-item-title">{{ song.title }}</span>
              <span class="playlist-item-artist">{{ song.artist }}</span>
            </div>
            <div class="playlist-item-actions">
              <button
                v-if="index !== playerStore.currentIndex"
                @click.stop="removeFromPlaylist(index)"
                class="btn-icon"
                title="移除"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <span v-else class="playing-indicator">
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Room Tips -->
      <div class="room-section room-tips">
        <div class="tip-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <div class="tip-content">
            <p class="tip-title">音乐管理</p>
            <p class="tip-desc">搜索、下载和导入音乐请前往 <router-link to="/search">搜索页面</router-link> 或 <router-link to="/playlist">歌单页面</router-link></p>
          </div>
        </div>
      </div>

      <!-- Leave Room Button -->
      <button @click="confirmLeave" class="leave-btn">
        离开房间
      </button>
    </div>

    <!-- Leave Confirmation Modal -->
    <div v-if="showLeaveModal" class="modal-overlay" @click.self="showLeaveModal = false">
      <div class="modal">
        <h3>确定要离开房间吗?</h3>
        <p>离开后可以重新通过链接加入</p>
        <div class="modal-actions">
          <button @click="showLeaveModal = false" class="modal-btn cancel">取消</button>
          <button @click="leaveRoom" class="modal-btn confirm">确定离开</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '../stores/room'
import { usePlayerStore } from '../stores/player'
import { getRoom, joinRoom } from '../api/room'
import { getSessionId, getUsername, setUsername } from '../utils/session'
import socket, { connectToRoom, disconnect, getSocketInstance } from '../socket/client'
import ParticipantList from '../components/ParticipantList.vue'
import AudioPlayer from '../components/AudioPlayer.vue'

const route = useRoute()
const router = useRouter()
const roomStore = useRoomStore()

const isLoading = ref(true)
const error = ref('')
const copied = ref(false)
const showLeaveModal = ref(false)

// Audio player state
const audioPlayerRef = ref(null)
const volume = ref(80)
const currentTime = ref(0)
const duration = ref(0)

const roomId = computed(() => route.params.roomId)
const sessionId = getSessionId()
const hostParticipant = computed(() => roomStore.hostParticipant)
const playerStore = usePlayerStore()

// Current track source for AudioPlayer
const currentTrackSrc = computed(() => {
  const track = playerStore.currentSong || roomStore.currentTrack
  if (!track) return ''
  // Prefer blobUrl (locally imported files)
  if (track.blobUrl) return track.blobUrl
  // Prefer local path if available
  if (track.path) {
    // 如果是 URL 路径（/downloads/ 或 /local-music/ 前缀），直接使用
    if (track.path.startsWith('/downloads/') || track.path.startsWith('/local-music/')) {
      return track.path
    }
    // 如果是绝对路径（Windows: C:/, Unix: /），使用 /local-music/ 代理
    if (track.path.match(/^[A-Z]:/i) || track.path.startsWith('/')) {
      return `/local-music/${encodeURIComponent(track.path)}`
    }
    // 相对路径放到 downloads 下
    return `/downloads/${track.path}`
  }
  if (track.url) return track.url
  return ''
})

// Progress percent
const progressPercent = computed(() => {
  if (!duration.value || duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

// Format time helper
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Toggle play - both Host and Guest can control
function togglePlay() {
  if (roomStore.isHost) {
    if (playerStore.isPlaying) {
      // Host 暂停：先暂停本地播放器，再广播
      audioPlayerRef.value?.pause()
      roomStore.isPlaying = false
      playerStore.setPlaying(false)
      emitPause()
    } else {
      // Host 播放：先播放本地播放器，再广播
      audioPlayerRef.value?.play()
      roomStore.isPlaying = true
      playerStore.setPlaying(true)
      emitPlay()
    }
  } else {
    // Guest: 发送播放控制事件给 Host，不自己播放
    const sock = getSocketInstance()
    if (!sock) return
    if (playerStore.isPlaying) {
      sock.emit('playback:pause', { roomId: roomId.value })
    } else {
      const { blobUrl, ...trackForGuest } = playerStore.currentSong || roomStore.currentTrack || {}
      sock.emit('playback:play', {
        roomId: roomId.value,
        track: trackForGuest,
        position: currentTime.value,
        timestamp: Date.now()
      })
    }
  }
}

// Play song from playlist at given index
function playFromPlaylist(index) {
  playerStore.setCurrentIndex(index)
  const song = playerStore.playlist[index]
  if (song && roomStore.isHost) {
    roomStore.currentTrack = song
    roomStore.isPlaying = true
    playerStore.setPlaying(true)
    // Sync currentTrack to backend so guests receive it
    const sock = getSocketInstance()
    sock?.emit('room:update', {
      roomId: roomId.value,
      playlist: playerStore.playlist,
      currentTrack: song
    })
    setTimeout(() => {
      audioPlayerRef.value?.play()
      emitPlay()
    }, 100)
  }
}

// Remove song from playlist at given index
function removeFromPlaylist(index) {
  playerStore.removeSong(index)
  if (roomStore.isHost) {
    const sock = getSocketInstance()
    sock?.emit('room:update', {
      roomId: roomId.value,
      playlist: playerStore.playlist,
      currentTrack: roomStore.currentTrack
    })
  }
}

async function copyInviteLink() {
  try {
    await navigator.clipboard.writeText(roomId.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = roomId.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

function confirmLeave() {
  showLeaveModal.value = true
}

function leaveRoom() {
  disconnect()
  roomStore.clearRoom()
  router.push('/')
}

function goHome() {
  router.push('/')
}

// Audio event handlers
function onAudioTimeUpdate(time) {
  currentTime.value = time
}

function onAudioEnded() {
  // Notify host to play next
  const sock = getSocketInstance()
  if (roomStore.isHost) {
    sock.emit('playback:next', { roomId: roomId.value })
  }
}

function onAudioLoaded(dur) {
  duration.value = dur
}

// Host playback controls - emit to socket
function emitPlay() {
  const sock = getSocketInstance()
  if (!roomStore.isHost) return
  // 排除 blobUrl（无法跨浏览器共享），让房客通过 path 或 url 访问
  const { blobUrl, ...trackForGuest } = playerStore.currentSong || {}
  sock.emit('playback:play', {
    roomId: roomId.value,
    track: trackForGuest,
    position: currentTime.value,
    timestamp: Date.now()
  })
}

function emitPause() {
  const sock = getSocketInstance()
  if (!roomStore.isHost) return
  sock.emit('playback:pause', {
    roomId: roomId.value,
    position: currentTime.value,
    timestamp: Date.now()
  })
}

function emitSeek(time) {
  const sock = getSocketInstance()
  if (!roomStore.isHost) return
  sock.emit('playback:seek', {
    roomId: roomId.value,
    position: time,
    timestamp: Date.now()
  })
}

// Watch for host playback state changes
watch(() => roomStore.isPlaying, (playing) => {
  if (!audioPlayerRef.value) return
  if (playing) {
    audioPlayerRef.value.play()
  } else {
    audioPlayerRef.value.pause()
  }
  // Sync playerStore.isPlaying for UI badge display
  playerStore.setPlaying(playing)
})

// Watch for track changes
watch(() => roomStore.currentTrack, (track) => {
  if (!track || !audioPlayerRef.value) return
  audioPlayerRef.value.load(currentTrackSrc.value)
})

onMounted(async () => {
  try {
    // Check if room exists
    const room = await getRoom(roomId.value)
    if (!room) {
      error.value = '无法找到该房间，请检查房间号是否正确'
      isLoading.value = false
      return
    }

    // Set session ID and connect
    roomStore.setSessionId(sessionId)
    const username = getUsername()
    setUsername(username)

    // Connect to room first (creates socket)
    connectToRoom(roomId.value, username)

    // Initialize socket event listeners BEFORE joining room
    // This prevents the race condition where room:state arrives before listeners are set
    roomStore.initSocket()

    // Join room via API (will add as participant if not already)
    try {
      await joinRoom(roomId.value, sessionId, username)
    } catch (e) {
      // Ignore join errors (might already be joined)
    }

    // Set audio player ref for sync events
    roomStore.setAudioPlayerRef(audioPlayerRef)

    // Watch for connection status
    watch(() => roomStore.isConnected, (connected) => {
      if (!connected && !error.value) {
        error.value = '连接已断开'
      }
    })

    isLoading.value = false
  } catch (err) {
    error.value = err.message || '加入房间失败'
    isLoading.value = false
  }
})

onUnmounted(() => {
  disconnect()
})
</script>

<style scoped>
.room-view {
  min-height: 100vh;
  position: relative;
}

.room-bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, #0f0f14 0%, #1a1a24 50%, #0f0f14 100%);
  z-index: -1;
}

.room-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 300px;
  background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.15) 0%, transparent 60%);
  pointer-events: none;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
  color: #a78bfa;
}

.spinner {
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-state p {
  font-size: 16px;
  margin: 0;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  padding: 24px;
}

.error-icon {
  width: 64px;
  height: 64px;
  color: #ef4444;
  margin-bottom: 16px;
}

.error-state h2 {
  font-size: 24px;
  color: #f8fafc;
  margin: 0 0 8px;
}

.error-state p {
  color: #64748b;
  margin: 0 0 24px;
}

/* Room Content */
.room-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}

/* Room Header */
.room-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(26, 26, 36, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #a78bfa;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.room-info {
  flex: 1;
}

.room-name {
  font-size: 24px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 4px;
}

.room-id {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 10px;
  color: #a78bfa;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.share-btn:hover {
  background: rgba(139, 92, 246, 0.25);
}

.share-btn svg {
  width: 18px;
  height: 18px;
}

/* Host Indicator */
.host-indicator {
  margin-bottom: 20px;
}

.host-you,
.host-other {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
}

.host-you {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 179, 8, 0.15) 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #f59e0b;
}

.host-you svg {
  width: 18px;
  height: 18px;
}

.host-other {
  background: rgba(26, 26, 36, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: #94a3b8;
}

.host-other svg {
  width: 18px;
  height: 18px;
}

/* Room Sections */
.room-section {
  margin-bottom: 20px;
}

/* Playback Section */
.playback-section {
  margin-bottom: 24px;
}

.playback-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: rgba(26, 26, 36, 0.6);
  border: 1px dashed rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  text-align: center;
}

.placeholder-icon {
  width: 48px;
  height: 48px;
  color: #475569;
  margin-bottom: 16px;
}

.playback-placeholder p {
  font-size: 16px;
  color: #64748b;
  margin: 0 0 8px;
}

.playback-placeholder .placeholder-hint {
  font-size: 13px;
  color: #475569;
  margin: 0;
}

.playback-placeholder span {
  font-size: 13px;
  color: #475569;
}

/* Player Card */
.player-card {
  background: rgba(26, 26, 36, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 20px;
}

.now-playing {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.track-info {
  flex: 1;
}

.track-title {
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0 0 4px;
}

.track-artist {
  font-size: 14px;
  color: #a78bfa;
  margin: 0;
}

.player-controls {
  display: flex;
  align-items: center;
}

.play-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.play-btn:hover {
  transform: scale(1.05);
}

.play-btn svg {
  width: 20px;
  height: 20px;
}

.sync-badge {
  padding: 8px 16px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
}

.sync-badge.playing {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.sync-badge.paused {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-label {
  font-size: 12px;
  color: #64748b;
  min-width: 35px;
}

.progress-track {
  flex: 1;
  height: 4px;
  background: rgba(139, 92, 246, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%);
  transition: width 0.1s;
}

/* Room Tips */
.room-tips {
  margin-top: 16px;
}

.tip-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 12px;
}

.tip-card svg {
  color: #8b5cf6;
  flex-shrink: 0;
  margin-top: 2px;
}

.tip-content {
  flex: 1;
}

.tip-title {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0 0 4px;
}

.tip-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.tip-desc a {
  color: #a78bfa;
  text-decoration: none;
}

.tip-desc a:hover {
  text-decoration: underline;
}

/* Leave Button */
.leave-btn {
  width: 100%;
  padding: 14px 24px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;
}

.leave-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
}

/* Music Parser Wrapper */
.music-parser-wrapper {
  width: 100%;
  max-width: 400px;
  margin-top: 16px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal {
  background: rgba(26, 26, 36, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  max-width: 320px;
  width: 100%;
  text-align: center;
}

.modal h3 {
  font-size: 18px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0 0 8px;
}

.modal p {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 20px;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-btn {
  flex: 1;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-btn.cancel {
  background: rgba(100, 116, 139, 0.2);
  border: 1px solid rgba(100, 116, 139, 0.3);
  color: #94a3b8;
}

.modal-btn.cancel:hover {
  background: rgba(100, 116, 139, 0.3);
}

.modal-btn.confirm {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.modal-btn.confirm:hover {
  background: rgba(239, 68, 68, 0.3);
}

/* Room Playlist Styles */
.room-playlist {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.room-playlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.room-playlist-item:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.2);
}

.room-playlist-item.active {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
}

.playlist-item-info {
  flex: 1;
  min-width: 0;
}

.playlist-item-title {
  font-size: 14px;
  font-weight: 500;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.playlist-item-artist {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.playlist-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.playing-indicator {
  color: #8b5cf6;
  display: flex;
  align-items: center;
}

.btn-icon {
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #64748b;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.playlist-count {
  font-size: 13px;
  font-weight: 400;
  color: #64748b;
  margin-left: 8px;
}
</style>
