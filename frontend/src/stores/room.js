import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getSocketInstance } from '../socket/client'

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
  function setAudioPlayerRef(ref) {
    audioPlayerRef = ref
  }

  function initSocket() {
    const sock = getSocketInstance()
    if (!sock) return
    sock.on('room:state', (room) => setRoom(room))
    sock.on('room:join', ({ userId, username }) => addParticipant({ userId, username }))
    sock.on('room:leave', ({ userId }) => removeParticipant(userId))
    sock.on('room:host', ({ hostId: newHostId }) => setHost(newHostId))

    // Playback sync listeners (for non-host participants)
    sock.on('playback:play', ({ track, position, timestamp }) => {
      isPlaying.value = true
      if (track) currentTrack.value = track
      position.value = position
      if (audioPlayerRef) {
        const elapsed = (Date.now() - timestamp) / 1000
        const currentPos = position + elapsed
        audioPlayerRef.value?.seek(currentPos)
        audioPlayerRef.value?.play()
      }
    })
    sock.on('playback:pause', ({ position, timestamp }) => {
      isPlaying.value = false
      if (audioPlayerRef) {
        const elapsed = (Date.now() - timestamp) / 1000
        const currentPos = position + elapsed
        audioPlayerRef.value?.seek(currentPos)
        audioPlayerRef.value?.pause()
      }
    })
    sock.on('playback:seek', ({ position, timestamp }) => {
      position.value = position
      if (audioPlayerRef) {
        audioPlayerRef.value?.seek(position)
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
