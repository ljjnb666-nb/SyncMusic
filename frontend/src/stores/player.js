import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePlayerStore = defineStore('player', () => {
  const playlist = ref([])
  const currentIndex = ref(-1)

  function addSong(song) {
    playlist.value.push(song)
    if (currentIndex.value === -1) {
      currentIndex.value = 0
    }
  }

  function removeSong(index) {
    playlist.value.splice(index, 1)
    if (index < currentIndex.value) {
      currentIndex.value--
    }
  }

  return { playlist, currentIndex, addSong, removeSong }
})
