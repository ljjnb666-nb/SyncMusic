import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRoomStore = defineStore('room', () => {
  const roomId = ref(null)
  const isHost = ref(false)
  const listeners = ref([])

  return { roomId, isHost, listeners }
})
