<template>
  <div class="app-container">
    <router-view />
    <MiniPlayer
      v-if="playerStore.currentSong"
      @toggle-play="togglePlay"
      @play-next="playNext"
      @play-prev="playPrev"
      @expand="expandPlayer"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth.js'
import { usePlayerStore } from './stores/player.js'
import MiniPlayer from './components/MiniPlayer.vue'

const authStore = useAuthStore()
const playerStore = usePlayerStore()

onMounted(() => {
  if (authStore.token) {
    authStore.fetchCurrentUser()
  }
})

function togglePlay() {
  playerStore.setPlaying(!playerStore.isPlaying)
}

function playNext() {
  const nextIndex = playerStore.getNextIndex()
  if (nextIndex >= 0) {
    playerStore.setCurrentIndex(nextIndex)
  }
}

function playPrev() {
  const prevIndex = playerStore.getPrevIndex()
  if (prevIndex >= 0) {
    playerStore.setCurrentIndex(prevIndex)
  }
}

function expandPlayer() {
  const playerSection = document.querySelector('.player-section, .audio-player, #player')
  if (playerSection) {
    playerSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
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
</style>
