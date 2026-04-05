<template>
  <div class="app-container">
    <AppNavbar />
    <main class="main-content">
      <router-view />
    </main>
    <!-- Hidden Audio Player (for actual playback) -->
    <AudioPlayer
      v-if="hasAudioSrc && !isInRoom"
      ref="audioPlayerRef"
      :src="audioSrc"
      :auto-play="playerStore.isPlaying"
      :volume="playerStore.volume"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      @loaded="onLoaded"
    />
    <!-- Mini Player -->
    <MiniPlayer
      v-if="playerStore.currentSong"
      @toggle-play="togglePlay"
      @play-next="playNext"
      @play-prev="playPrev"
      @seek="handleSeek"
      @volume-change="handleVolumeChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { trackPathToUrl } from './utils/trackUtils.js'
import { useRoute } from 'vue-router'
import AppNavbar from './components/AppNavbar.vue'
import AudioPlayer from './components/AudioPlayer.vue'
import MiniPlayer from './components/MiniPlayer.vue'
import { usePlayerStore } from './stores/player'

const playerStore = usePlayerStore()
const audioPlayerRef = ref(null)
const route = useRoute()

// 是否在房间页面 - 房间页面由 Room.vue 的 AudioPlayer 负责播放
const isInRoom = computed(() => route.path.startsWith('/room/'))

// Audio source for local music
// Uses shared utility for safe URL construction
const audioSrc = computed(() => {
  const song = playerStore.currentSong
  if (!song) return ''
  return trackPathToUrl(song)
})

const hasAudioSrc = computed(() => audioSrc.value !== '')

// When audio source changes, load and potentially auto-play
watch(audioSrc, (newSrc, oldSrc) => {
  if (!newSrc) return
  // If this is a new source and we're supposed to be playing, start playback
  if (newSrc !== oldSrc && playerStore.isPlaying && audioPlayerRef.value) {
    // Source changed while playing, reload and continue
    setTimeout(() => {
      if (audioPlayerRef.value && playerStore.isPlaying) {
        audioPlayerRef.value.play()
      }
    }, 100)
  }
})

// Sync audio playback with playerStore
watch(() => playerStore.isPlaying, (playing) => {
  if (!audioPlayerRef.value) return
  if (playing) {
    // If no src set but we have a song, load it first
    const ref = audioPlayerRef.value
    if (ref.audioPlayer && !ref.audioPlayer.src && audioSrc.value) {
      ref.audioPlayer.src = audioSrc.value
      ref.audioPlayer.load()
    }
    ref.play()
  } else {
    audioPlayerRef.value.pause()
  }
})

// Sync volume
watch(() => playerStore.volume, (vol) => {
  if (audioPlayerRef.value && audioPlayerRef.value.audioPlayer) {
    audioPlayerRef.value.audioPlayer.volume = vol / 100
  }
})

// Sync current time changes from seek
watch(() => playerStore.currentTime, (time) => {
  if (audioPlayerRef.value && audioPlayerRef.value.audioPlayer && Math.abs(audioPlayerRef.value.audioPlayer.currentTime - time) > 1) {
    audioPlayerRef.value.seek(time)
  }
})

// When current song changes and should be playing, start playback
watch(() => playerStore.currentSong, (song) => {
  if (song && playerStore.isPlaying && audioPlayerRef.value) {
    setTimeout(() => {
      if (audioPlayerRef.value && playerStore.isPlaying) {
        audioPlayerRef.value.play()
      }
    }, 100)
  }
})

function onTimeUpdate(time) {
  playerStore.setCurrentTime(time)
}

function onEnded() {
  playerStore.setPlaying(false)
  // Play next song
  const nextIndex = playerStore.getNextIndex()
  if (nextIndex >= 0) {
    playerStore.setCurrentIndex(nextIndex)
    playerStore.setPlaying(true)
  }
}

function onLoaded(duration) {
  // Could store duration if needed
  // Auto-play when loaded if isPlaying is true
  if (playerStore.isPlaying && audioPlayerRef.value) {
    audioPlayerRef.value.play()
  }
}

// MiniPlayer control handlers
function togglePlay() {
  playerStore.setPlaying(!playerStore.isPlaying)
}

function playNext() {
  const nextIndex = playerStore.getNextIndex()
  if (nextIndex >= 0) {
    playerStore.setCurrentIndex(nextIndex)
    playerStore.setPlaying(true)
  } else {
    playerStore.setPlaying(false)
  }
}

function playPrev() {
  const prevIndex = playerStore.getPrevIndex()
  if (prevIndex >= 0) {
    playerStore.setCurrentIndex(prevIndex)
    playerStore.setPlaying(true)
  }
}

function handleSeek(time) {
  if (audioPlayerRef.value) {
    audioPlayerRef.value.seek(time)
  }
}

function handleVolumeChange(vol) {
  playerStore.setVolume(vol)
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f0f14 0%, #1a1a24 50%, #0f0f14 100%);
  position: relative;
}

.app-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 400px;
  background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.15) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.main-content {
  padding-top: 60px;
  min-height: calc(100vh - 60px);
  position: relative;
  z-index: 1;
}
</style>
