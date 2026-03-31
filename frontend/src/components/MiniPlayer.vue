<template>
  <div v-if="currentSong" class="mini-player">
    <!-- 背景模糊层 -->
    <div class="player-bg" :style="bgStyle"></div>

    <!-- 左侧：歌曲封面 -->
    <div class="cover-wrapper" :class="{ 'is-playing': isPlaying }">
      <img
        v-if="currentSong.thumbnail"
        :src="currentSong.thumbnail"
        :alt="currentSong.title"
        class="cover-img"
      />
      <div v-else class="cover-placeholder">
        <AppIcon name="disc" :size="24" />
      </div>
      <!-- 播放状态指示器 -->
      <div v-if="isPlaying" class="playing-ring"></div>
    </div>

    <!-- 中间：歌曲信息和进度条 -->
    <div class="center-section">
      <div class="song-info" @click="handleExpand">
        <div class="song-title">{{ currentSong.title }}</div>
        <div class="song-artist">{{ currentSong.artist || '未知艺术家' }}</div>
      </div>
      <div class="progress-section">
        <span class="time-text">{{ formatTime(currentTime) }}</span>
        <div class="progress-bar-wrapper">
          <input
            type="range"
            class="progress-slider"
            :value="currentTime"
            :max="currentSong.duration || 100"
            @input="onSeek($event.target.value)"
          />
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
        <span class="time-text">{{ formatTime(currentSong.duration || 0) }}</span>
      </div>
    </div>

    <!-- 右侧：控制按钮 -->
    <div class="controls" @click.stop>
      <button class="ctrl-btn" @click="playPrev" title="上一首">
        <AppIcon name="skip-back" :size="18" />
      </button>
      <button class="ctrl-btn play-btn" @click="togglePlay" :title="isPlaying ? '暂停' : '播放'">
        <AppIcon :name="isPlaying ? 'pause' : 'play'" :size="20" />
      </button>
      <button class="ctrl-btn" @click="playNext" title="下一首">
        <AppIcon name="skip-forward" :size="18" />
      </button>
    </div>

    <!-- 音量控制 -->
    <div class="volume-section" @click.stop>
      <button class="ctrl-btn vol-btn" @click="toggleMute" :title="isMuted ? '取消静音' : '静音'">
        <AppIcon :name="volumeIcon" :size="16" />
      </button>
      <div class="volume-bar-wrapper">
        <input
          type="range"
          class="volume-slider"
          :value="isMuted ? 0 : volume"
          min="0"
          max="100"
          @input="onVolumeChange($event.target.value)"
        />
        <div class="volume-bar">
          <div class="volume-fill" :style="{ width: (isMuted ? 0 : volume) + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { usePlayerStore } from '../stores/player.js'
import AppIcon from './AppIcon.vue'

const playerStore = usePlayerStore()

const currentSong = computed(() => playerStore.currentSong)
const isPlaying = computed(() => playerStore.isPlaying)
const volume = computed(() => playerStore.volume)
const currentTime = computed(() => playerStore.currentTime)
const volumeBeforeMute = ref(80)
const isMuted = ref(false)

const progressPercent = computed(() => {
  if (!currentSong.value?.duration) return 0
  return (currentTime.value / currentSong.value.duration) * 100
})

const bgStyle = computed(() => {
  if (currentSong.value?.thumbnail) {
    return { backgroundImage: `url(${currentSong.value.thumbnail})` }
  }
  return {}
})

const volumeIcon = computed(() => {
  if (isMuted.value || volume.value === 0) return 'volume-x'
  if (volume.value < 50) return 'volume-1'
  return 'volume-2'
})

const emit = defineEmits(['toggle-play', 'play-next', 'play-prev', 'expand', 'volume-change', 'seek'])

function togglePlay() {
  emit('toggle-play')
}

function playNext() {
  emit('play-next')
}

function playPrev() {
  emit('play-prev')
}

function onSeek(value) {
  const time = parseFloat(value)
  // 使用 change 事件触发，避免 input 事件每像素都触发
  // 实际 seek 时间由 App.vue 通过 playerStore.currentTime 同步到 Audio
  playerStore.setCurrentTime(time)
}

function handleExpand() {
  emit('expand')
}

function toggleMute() {
  if (isMuted.value) {
    playerStore.setVolume(volumeBeforeMute.value)
    isMuted.value = false
  } else {
    volumeBeforeMute.value = volume.value
    playerStore.setVolume(0)
    isMuted.value = true
  }
  emit('volume-change', playerStore.volume)
}

function onVolumeChange(value) {
  const vol = parseInt(value)
  playerStore.setVolume(vol)
  if (vol > 0) {
    isMuted.value = false
  }
}

function formatTime(seconds) {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.mini-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 16px;
  background: linear-gradient(180deg, rgba(20, 20, 30, 0.98) 0%, rgba(15, 15, 25, 0.99) 100%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  z-index: 1000;
  overflow: hidden;
}

/* 背景模糊层 */
.player-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: blur(40px) saturate(0.5);
  opacity: 0.15;
  z-index: -1;
}

.player-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
}

/* 封面样式 */
.cover-wrapper {
  position: relative;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: visible;
}

.cover-img,
.cover-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #2a2a3e 0%, #1a1a2e 100%);
  color: rgba(167, 139, 250, 0.8);
}

.cover-wrapper.is-playing .cover-img,
.cover-wrapper.is-playing .cover-placeholder {
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
}

/* 播放环 */
.playing-ring {
  position: absolute;
  inset: -6px;
  border-radius: 14px;
  border: 2px solid transparent;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.6), rgba(6, 182, 212, 0.6)) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: pulse-ring 2s ease-in-out infinite;
}

@keyframes pulse-ring {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
}

/* 中间区域 */
.center-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 歌曲信息 */
.song-info {
  cursor: pointer;
  transition: opacity 0.2s;
}

.song-info:hover {
  opacity: 0.8;
}

.song-title {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.2px;
}

.song-artist {
  font-size: 12px;
  color: rgba(167, 139, 250, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

/* 进度条区域 */
.progress-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-text {
  font-size: 10px;
  color: rgba(148, 163, 184, 0.7);
  min-width: 32px;
  font-variant-numeric: tabular-nums;
  font-family: 'JetBrains Mono', monospace;
}

.progress-bar-wrapper {
  flex: 1;
  height: 4px;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%);
  border-radius: 2px;
  transition: width 0.1s linear;
}

/* 隐藏原生的进度滑块 */
.progress-slider {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  margin: 0;
}

/* 控制按钮 */
.controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.ctrl-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  background: rgba(139, 92, 246, 0.1);
  color: rgba(248, 250, 252, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
}

.ctrl-btn:hover {
  background: rgba(139, 92, 246, 0.25);
  color: #f8fafc;
  transform: scale(1.05);
}

.ctrl-btn:active {
  transform: scale(0.95);
}

.play-btn {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #06b6d4 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);
}

.play-btn:hover {
  background: linear-gradient(135deg, #9b6dff 0%, #8b5cf6 50%, #22d3ee 100%);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
  color: white;
}

/* 音量控制 */
.volume-section {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.vol-btn {
  width: 30px;
  height: 30px;
  background: transparent;
}

.vol-btn:hover {
  background: rgba(139, 92, 246, 0.15);
}

.volume-bar-wrapper {
  width: 70px;
  height: 4px;
  position: relative;
}

.volume-bar {
  height: 100%;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 2px;
  overflow: hidden;
}

.volume-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%);
  border-radius: 2px;
  transition: width 0.1s ease;
}

.volume-slider {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  margin: 0;
  z-index: 1;
}

/* 响应式 */
@media (max-width: 768px) {
  .volume-section {
    display: none;
  }
  .mini-player {
    padding: 0 16px;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .progress-section {
    display: none;
  }
  .cover-wrapper {
    width: 42px;
    height: 42px;
  }
}
</style>
