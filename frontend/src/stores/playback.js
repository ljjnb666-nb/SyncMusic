import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRoomStore } from './room'
import { getSocketInstance } from '../socket/client'

const STORAGE_KEY = 'syncmusic_playlist'

// Module-level audio player ref (not reactive — DOM refs should not be reactive)
let audioPlayerRef = null

// Load saved playlist from localStorage
function loadPlaylist() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (e) {
    console.error('[playback] Failed to load playlist:', e)
  }
  return []
}

export const usePlaybackStore = defineStore('playback', () => {
  // --- State ---
  const playlist = ref(loadPlaylist())
  const currentIndex = ref(-1)
  const isPlaying = ref(false)
  const position = ref(0)
  const duration = ref(0)
  const volume = ref(80)
  const playMode = ref('list') // 'list' | 'single' | 'shuffle'
  const shuffleHistory = ref([])

  // --- Computed ---
  // Import useRoomStore lazily inside computed to avoid circular dependency
  const isHost = computed(() => {
    const room = useRoomStore()
    return room.sessionId !== null && room.sessionId === room.hostId
  })

  const roomId = computed(() => {
    const room = useRoomStore()
    return room.id
  })

  const currentSong = computed(() => playlist.value[currentIndex.value] || null)

  // --- localStorage persistence ---
  let saveTimer = null
  function savePlaylist() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(playlist.value))
      } catch (e) {
        console.error('[playback] Failed to save playlist:', e)
      }
    }, 300)
  }

  // --- Audio player ref ---
  function setAudioPlayerRef(ref) {
    audioPlayerRef = ref
  }

  // --- Playlist management ---
  function addSong(song) {
    const exists = playlist.value.some(
      s => s.title === song.title && s.artist === song.artist
    )
    if (exists) return false
    playlist.value = [...playlist.value, song]
    if (currentIndex.value === -1) currentIndex.value = 0
    savePlaylist()
    return true
  }

  function removeSong(index) {
    playlist.value = playlist.value.filter((_, i) => i !== index)
    if (index === currentIndex.value) {
      if (playlist.value.length === 0) {
        currentIndex.value = -1
      } else if (index >= playlist.value.length) {
        currentIndex.value = playlist.value.length - 1
      }
    } else if (index < currentIndex.value) {
      currentIndex.value--
    }
    savePlaylist()
  }

  function setPlaylist(songs) {
    playlist.value = songs
    if (currentIndex.value === -1 && songs.length > 0) currentIndex.value = 0
    savePlaylist()
  }

  function clearPlaylist() {
    playlist.value = []
    currentIndex.value = -1
    isPlaying.value = false
    position.value = 0
    duration.value = 0
    shuffleHistory.value = []
    savePlaylist()
  }

  function changeSong(index) {
    if (index < 0 || index >= playlist.value.length) return
    currentIndex.value = index
    position.value = 0
  }

  // --- Playback controls ---
  function togglePlay() {
    if (isPlaying.value) pause()
    else play()
  }

  function play() {
    isPlaying.value = true
    if (audioPlayerRef) audioPlayerRef.play()
  }

  function pause() {
    isPlaying.value = false
    if (audioPlayerRef) audioPlayerRef.pause()
  }

  function seek(pos) {
    position.value = pos
    if (audioPlayerRef) audioPlayerRef.seek(pos)
  }

  function playNext() {
    const len = playlist.value.length
    if (len === 0) return

    let next = -1
    if (playMode.value === 'single') {
      next = currentIndex.value
    } else if (playMode.value === 'shuffle') {
      const unplayed = []
      for (let i = 0; i < len; i++) {
        if (!shuffleHistory.value.includes(i)) unplayed.push(i)
      }
      if (unplayed.length === 0) {
        shuffleHistory.value = []
        next = Math.floor(Math.random() * len)
        shuffleHistory.value.push(next)
      } else {
        next = unplayed[Math.floor(Math.random() * unplayed.length)]
        shuffleHistory.value.push(next)
      }
    } else {
      // list mode
      next = currentIndex.value < len - 1 ? currentIndex.value + 1 : -1
    }

    if (next >= 0) changeSong(next)
  }

  function playPrevious() {
    if (playlist.value.length === 0) return
    // If position > 3s, restart current song; otherwise go to previous
    if (position.value > 3) {
      seek(0)
      return
    }
    const prev = currentIndex.value > 0 ? currentIndex.value - 1 : 0
    changeSong(prev)
  }

  // --- Socket event emitters (host only) ---
  function emitPlay() {
    const socket = getSocketInstance()
    if (!socket) return
    const room = useRoomStore()
    socket.emit('playback:play', {
      roomId: room.id,
      track: currentSong.value,
      position: position.value,
      timestamp: Date.now()
    })
  }

  function emitPause() {
    const socket = getSocketInstance()
    if (!socket) return
    const room = useRoomStore()
    socket.emit('playback:pause', {
      roomId: room.id,
      position: position.value,
      timestamp: Date.now()
    })
  }

  function emitSeek() {
    const socket = getSocketInstance()
    if (!socket) return
    const room = useRoomStore()
    socket.emit('playback:seek', {
      roomId: room.id,
      position: position.value,
      timestamp: Date.now()
    })
  }

  // --- Socket event listeners ---
  function initSocketListeners() {
    const socket = getSocketInstance()
    if (!socket) return

    socket.on('playback:play', ({ track, position: pos, timestamp }) => {
      isPlaying.value = true
      if (track) {
        // Sync track — find in playlist or update current
        const idx = playlist.value.findIndex(
          s => s.title === track.title && s.artist === track.artist
        )
        if (idx >= 0) {
          currentIndex.value = idx
        }
      }
      position.value = pos
      // Apply elapsed time since event was emitted
      if (audioPlayerRef) {
        const elapsed = (Date.now() - timestamp) / 1000
        audioPlayerRef.seek(pos + elapsed)
        audioPlayerRef.play()
      }
    })

    socket.on('playback:pause', ({ position: pos, timestamp }) => {
      isPlaying.value = false
      if (audioPlayerRef) {
        const elapsed = (Date.now() - timestamp) / 1000
        audioPlayerRef.seek(pos + elapsed)
        audioPlayerRef.pause()
      }
    })

    socket.on('playback:seek', ({ position: pos }) => {
      position.value = pos
      if (audioPlayerRef) audioPlayerRef.seek(pos)
    })
  }

  return {
    // State
    playlist,
    currentIndex,
    isPlaying,
    position,
    duration,
    volume,
    playMode,
    // Computed
    isHost,
    roomId,
    currentSong,
    // Audio ref
    setAudioPlayerRef,
    // Playlist management
    addSong,
    removeSong,
    setPlaylist,
    clearPlaylist,
    changeSong,
    // Playback controls
    togglePlay,
    play,
    pause,
    seek,
    playNext,
    playPrevious,
    // Socket emitters
    emitPlay,
    emitPause,
    emitSeek,
    // Socket listeners
    initSocketListeners
  }
})
