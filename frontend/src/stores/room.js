import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRoomStore = defineStore('room', () => {
  const roomId = ref(null)
  const isHost = ref(false)
  const listeners = ref([])

  function setRoom(id, host) {
    roomId.value = id
    isHost.value = host
  }

  function setListeners(count) {
    listeners.value = Array.from({ length: count }, (_, i) => `listener-${i}`)
  }

  function addListener(id) {
    if (!listeners.value.includes(id)) {
      listeners.value = [...listeners.value, id]
    }
  }

  function clearRoom() {
    roomId.value = null
    isHost.value = false
    listeners.value = []
  }

  return { roomId, isHost, listeners, setRoom, setListeners, addListener, clearRoom }
})
