import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getSocketInstance } from '../socket/client'
import { usePlayerStore } from './player'

export const useRoomStore = defineStore('room', () => {
  // State
  const id = ref(null)
  const name = ref('')
  const hostId = ref(null)
  const participants = ref([])
  const isPlaying = ref(false)
  const currentTrack = ref(null)
  const position = ref(0)
  const sessionId = ref(null)
  const isConnected = ref(false)

  // Getters
  const isHost = computed(() => sessionId.value !== null && sessionId.value === hostId.value)
  const participantCount = computed(() => participants.value.length)
  const participantList = computed(() =>
    [...participants.value].sort((a, b) => a.joinedAt - b.joinedAt)
  )
  const hostParticipant = computed(() =>
    participants.value.find(p => p.isHost === true) || null
  )

  // Actions
  function setRoom(room) {
    id.value = room.id
    name.value = room.name
    hostId.value = room.hostId
    participants.value = room.participants || []
    isPlaying.value = room.isPlaying ?? false
    currentTrack.value = room.currentTrack ?? null
    position.value = room.position ?? 0
    // Sync with playerStore for UI display
    if (!isHost.value) {
      const playerStore = usePlayerStore()
      playerStore.setPlaying(room.isPlaying ?? false)
      // Sync full playlist if available, fallback to currentTrack only
      if (room.playlist && room.playlist.length > 0) {
        playerStore.setPlaylist(room.playlist)
        // Find currentIndex matching currentTrack
        const idx = room.playlist.findIndex(t => t.id === room.currentTrack?.id)
        playerStore.setCurrentIndex(idx >= 0 ? idx : 0)
      } else if (room.currentTrack) {
        playerStore.setPlaylist([room.currentTrack])
        playerStore.setCurrentIndex(0)
      }
      // Seek guest to correct position and play/pause to sync with host
      if (audioPlayerRef.value) {
        syncGuestPlayback(room)
      } else {
        // audioPlayerRef not ready yet, save for later
        pendingRoomState = room
      }
    }
  }

  function setSessionId(sid) {
    sessionId.value = sid
  }

  function addParticipant({ userId, username }) {
    // Avoid duplicates
    if (participants.value.some(p => p.id === userId)) return
    participants.value.push({
      id: userId,
      username,
      joinedAt: Date.now(),
      isHost: false
    })
  }

  function removeParticipant(userId) {
    participants.value = participants.value.filter(p => p.id !== userId)
  }

  function setHost(newHostId) {
    hostId.value = newHostId
    participants.value.forEach(p => {
      p.isHost = p.id === newHostId
    })
  }

  function clearRoom() {
    id.value = null
    name.value = ''
    hostId.value = null
    participants.value = []
    isPlaying.value = false
    currentTrack.value = null
    position.value = 0
    isConnected.value = false
  }

  function updateParticipantUsername(userId, username) {
    const p = participants.value.find(p => p.id === userId)
    if (p) p.username = username
  }

  // Initialize socket event bindings (call once)
  // audioPlayerRef should be set externally via setAudioPlayerRef
  let audioPlayerRef = null
  // Track last received room state for deferred sync (when audioPlayerRef wasn't ready yet)
  let pendingRoomState = null

  function setAudioPlayerRef(ref) {
    audioPlayerRef = ref
    // If we have a pending room state (guest joined while audio wasn't ready), sync now
    if (pendingRoomState && !isHost.value) {
      syncGuestPlayback(pendingRoomState)
      pendingRoomState = null
    }
  }

  // Sync guest playback when room:state arrives
  function syncGuestPlayback(room) {
    if (!audioPlayerRef.value || isHost.value) return
    const playerStore = usePlayerStore()
    playerStore.setPlaying(room.isPlaying ?? false)
    if (room.playlist && room.playlist.length > 0) {
      playerStore.setPlaylist(room.playlist)
      const idx = room.playlist.findIndex(t => t.id === room.currentTrack?.id)
      playerStore.setCurrentIndex(idx >= 0 ? idx : 0)
    } else if (room.currentTrack) {
      playerStore.setPlaylist([room.currentTrack])
      playerStore.setCurrentIndex(0)
    }
    // Seek and play/pause
    const nowPlaying = room.isPlaying ?? false
    const syncPosition = room.position ?? 0
    const positionUpdatedAt = room.positionUpdatedAt ?? Date.now()
    const elapsed = (Date.now() - positionUpdatedAt) / 1000
    const livePosition = nowPlaying ? syncPosition + elapsed : syncPosition
    audioPlayerRef.value.seek(livePosition)
    if (nowPlaying) {
      audioPlayerRef.value.play()
    } else {
      audioPlayerRef.value.pause()
    }
  }

  function initSocket() {
    const sock = getSocketInstance()
    if (!sock) return
    sock.on('room:state', (room) => setRoom(room))
    sock.on('room:update', ({ playlist, currentTrack: track }) => {
      if (track) currentTrack.value = track
      if (playlist && !isHost.value) {
        const playerStore = usePlayerStore()
        playerStore.setPlaylist(playlist)
        if (track) {
          const idx = playlist.findIndex(t => t.id === track.id)
          playerStore.setCurrentIndex(idx >= 0 ? idx : 0)
        }
      }
    })
    sock.on('room:join', ({ userId, username }) => addParticipant({ userId, username }))
    sock.on('room:leave', ({ userId }) => removeParticipant(userId))
    sock.on('room:host', ({ hostId: newHostId }) => setHost(newHostId))

    // Playback sync listeners (for non-host participants)
    // Guest 收到 sync 事件时尝试播放，audioPlayerRef 可能还没设置好，需要重试
    function tryPlay(pos, timestamp, track) {
      if (audioPlayerRef.value) {
        const audio = audioPlayerRef.value.audioPlayer
        if (!audio) return false
        // 如果 track 有 path，优先使用 path（跳过 watch 触发的 load）
        if (track && track.path) {
          // 直接设置 src，不依赖 watch 链（watch 的 load 会用 currentTrackSrc 覆盖）
          const src = audio.src
          // 转换 path 为正确的 URL（与 Room.vue 的 currentTrackSrc 逻辑一致）
          let targetSrc
          if (track.path.startsWith('/downloads/') || track.path.startsWith('/local-music/')) {
            targetSrc = track.path
          } else if (track.path.match(/^[A-Z]:/i) || track.path.startsWith('/')) {
            targetSrc = `/local-music/${encodeURIComponent(track.path)}`
          } else {
            targetSrc = `/downloads/${track.path}`
          }
          // 如果 src 已经是目标 path，无需重新加载
          if (src !== targetSrc) {
            audio.src = targetSrc
            audio.load()
          }
          const doPlay = () => {
            audio.onloadedmetadata = null
            const elapsed = (Date.now() - timestamp) / 1000
            audioPlayerRef.value?.seek(pos + elapsed)
            audioPlayerRef.value?.play()
          }
          audio.onloadedmetadata = doPlay
          // 备用：1秒后直接播放（以防事件没触发）
          setTimeout(() => {
            if (audioPlayerRef.value?.audioPlayer) {
              audio.onloadedmetadata = null
              const elapsed = (Date.now() - timestamp) / 1000
              audioPlayerRef.value?.seek(pos + elapsed)
              audioPlayerRef.value?.play()
            }
          }, 1000)
        } else if (track && track.url) {
          // URL 类型（如 blobUrl，虽然 guest 不应该有 blobUrl）
          audio.src = track.url
          audio.load()
          setTimeout(() => {
            const elapsed = (Date.now() - timestamp) / 1000
            audioPlayerRef.value?.seek(pos + elapsed)
            audioPlayerRef.value?.play()
          }, 500)
        } else {
          // 没有 path/url，直接尝试播放（从当前位置）
          const elapsed = (Date.now() - timestamp) / 1000
          audioPlayerRef.value?.seek(pos + elapsed)
          audioPlayerRef.value?.play()
        }
        return true
      }
      return false
    }

    sock.on('playback:play', ({ track, position: pos, timestamp }) => {
      isPlaying.value = true
      position.value = pos
      if (track) {
        currentTrack.value = track
        // Guest: 把 track 加入 playerStore，并继续调用 tryPlay（Room.vue AudioPlayer）
        if (!isHost.value) {
          const playerStore = usePlayerStore()
          playerStore.setPlaylist([track])
          playerStore.setCurrentIndex(0)
          playerStore.setPlaying(true)
        }
      }
      // Host 和 Guest 都使用 Room.vue 的 audioPlayerRef 直接播放
      if (!tryPlay(pos, timestamp, track)) {
        let attempts = 0
        const maxAttempts = 10
        const retry = setInterval(() => {
          attempts++
          if (tryPlay(pos, timestamp, track) || attempts >= maxAttempts) {
            clearInterval(retry)
          }
        }, 100)
      }
    })
    sock.on('playback:pause', ({ position: pos, timestamp }) => {
      isPlaying.value = false
      if (audioPlayerRef.value) {
        const elapsed = (Date.now() - timestamp) / 1000
        const currentPos = pos + elapsed
        audioPlayerRef.value?.seek(currentPos)
        audioPlayerRef.value?.pause()
      } else if (!isHost.value) {
        // Guest: 通过 playerStore 暂停（App.vue AudioPlayer 会响应）
        const playerStore = usePlayerStore()
        playerStore.setPlaying(false)
      }
    })
    sock.on('playback:seek', ({ position: pos, timestamp }) => {
      position.value = pos
      if (audioPlayerRef.value) {
        audioPlayerRef.value?.seek(pos)
      } else if (!isHost.value) {
        // Guest: 通过 playerStore 同步进度（App.vue AudioPlayer 会响应）
        const playerStore = usePlayerStore()
        playerStore.seekTo(pos)
      }
    })
  }

  return {
    // State
    id,
    name,
    hostId,
    participants,
    isPlaying,
    currentTrack,
    position,
    sessionId,
    isConnected,
    // Getters
    isHost,
    participantCount,
    participantList,
    hostParticipant,
    // Actions
    setRoom,
    setSessionId,
    addParticipant,
    removeParticipant,
    setHost,
    clearRoom,
    updateParticipantUsername,
    initSocket,
    setAudioPlayerRef
  }
})
