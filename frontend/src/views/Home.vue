<template>
  <div class="home">
    <!-- 背景装饰 -->
    <div class="home-bg"></div>

    <!-- 主内容 -->
    <div class="main-content">
      <!-- Header -->
      <header class="header">
        <div class="header-content">
          <div class="logo">
            <AppIcon name="music" :size="32" class="logo-icon" />
            <h1 class="logo-text">SyncMusic</h1>
            <span class="logo-badge">一起听</span>
          </div>
        </div>
      </header>

      <!-- Tab 导航 -->
      <nav class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab-item', { active: activeTab === tab.id }]"
        >
          <AppIcon :name="tab.icon" :size="18" class="tab-icon" />
          <span class="tab-text">{{ tab.label }}</span>
        </button>
      </nav>

      <!-- 内容区域 -->
      <main class="content-area">
        <!-- 解析 Tab -->
        <MusicParser
          v-if="activeTab === 'parse'"
          :parsed-song="parsedSong"
          :loading="loading.parse"
          :loading-search="loading.search"
          :loading-playlist="loading.playlist"
          :search-results="searchResults"
          :searched="searched"
          :has-room="!!roomStore.roomId"
          :parsed-playlist="parsedPlaylist"
          :downloading-selected="downloadingSelected"
          @parse="handleParse"
          @download="handleDownload"
          @search="searchSongs"
          @add-to-playlist="addSearchResultToPlaylist"
          @parse-playlist="handleParsePlaylist"
          @download-selected="downloadSelected"
          @download-song="handleDownloadSong"
        />

        <!-- 下载管理 Tab -->
        <DownloadManager
          v-if="activeTab === 'downloads'"
          :downloads="downloads"
          :loading-downloads="loading.downloads"
          :download-dir="downloadDir"
          :setting-dir="settingDir"
          :dir-message="dirMessage"
          @refresh="refreshDownloads"
          @add-downloaded-to-playlist="addDownloadedToPlaylist"
          @update-download-dir="handleUpdateDownloadDir"
        />

        <!-- 歌单 Tab -->
        <PlaylistPage
          v-if="activeTab === 'playlist'"
          :local-music="localMusic"
          @load-local-music="loadLocalMusic"
          @import-music="importMusicFiles"
          @play="handlePlaylistPlay"
          @add-to-playlist="handleAddToPlaylist"
        />

        <!-- 历史 Tab -->
        <History
          v-if="activeTab === 'history'"
          :has-room="!!roomStore.roomId"
          @add-to-playlist="addHistoryToPlaylist"
        />

        <!-- 收藏 Tab -->
        <Favorites
          v-if="activeTab === 'favorites'"
          :has-room="!!roomStore.roomId"
          @play="addSearchResultToPlaylist"
          @add-to-room="addSearchResultToPlaylist"
        />

        <!-- 发现 Tab -->
        <RoomDiscovery
          v-if="activeTab === 'discover'"
          @join-room="handleDiscoverJoinRoom"
        />

        <!-- 一起听 Tab -->
        <RoomPlayer
          v-if="activeTab === 'room'"
          v-model:join-room-id="joinRoomId"
          v-model:local-music-path="localMusicPath"
          :room-id="roomStore.roomId"
          :is-host="roomStore.isHost"
          :listeners="roomStore.listeners"
          :playlist="playerStore.playlist"
          :current-index="playerStore.currentIndex"
          :current-song="playerStore.currentSong"
          :is-playing="playerStore.isPlaying"
          :current-time="playerStore.currentTime"
          :volume="playerStore.volume"
          :play-mode="playerStore.playMode"
          :local-music="localMusic"
          @create-room="createRoom"
          @join-room="joinRoom"
          @leave-room="leaveRoom"
          @toggle-play="togglePlay"
          @play-next="playNextSong"
          @change-song="changeSong"
          @remove-song="removeSong"
          @seek="onSeek"
          @volume-change="handleVolumeChange"
          @change-play-mode="changePlayMode"
          @load-local-music="loadLocalMusic"
          @import-music="importMusicFiles"
          @add-local-to-playlist="addLocalToPlaylist"
        />
      </main>
    </div>

    <!-- Toast 消息 -->
    <Transition name="slide">
      <div v-if="toast.show" :class="['toast', toast.type === 'error' ? 'toast-error' : 'toast-success']">
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { parseMusicUrl, downloadMusic, downloadPlaylist, getDownloadList, parsePlaylist, searchMusic, browserDownload, browseFolder, getDownloadDir, setDownloadDir, uploadMusicFiles } from '../api/music.js'
import { io } from 'socket.io-client'
import { useRoomStore } from '../stores/room.js'
import { usePlayerStore } from '../stores/player.js'
import { useHistoryStore } from '../stores/history.js'
import { formatDuration } from '../utils/format.js'
import { parseLRC, getCurrentLyricIndex } from '../utils/lrcParser.js'
import MusicParser from '../components/MusicParser.vue'
import DownloadManager from '../components/DownloadManager.vue'
import RoomPlayer from '../components/RoomPlayer.vue'
import RoomDiscovery from '../components/RoomDiscovery.vue'
import History from '../views/History.vue'
import Favorites from '../views/Favorites.vue'
import PlaylistPage from '../views/Playlist.vue'
import AppIcon from '../components/AppIcon.vue'

const roomStore = useRoomStore()
const playerStore = usePlayerStore()
const historyStore = useHistoryStore()

const tabs = [
  { id: 'parse', label: '解析', icon: 'search' },
  { id: 'downloads', label: '下载管理', icon: 'download' },
  { id: 'playlist', label: '歌单', icon: 'list-music' },
  { id: 'history', label: '历史', icon: 'clock' },
  { id: 'favorites', label: '收藏', icon: 'heart' },
  { id: 'discover', label: '发现', icon: 'compass' },
  { id: 'room', label: '一起听', icon: 'headphones' }
]

const activeTab = ref('parse')

// 切换到下载管理tab时自动刷新列表
watch(activeTab, (newTab) => {
  if (newTab === 'downloads') {
    refreshDownloads()
  }
})

const playlistUrl = ref('')
const parsedSong = ref(null)
const parsedPlaylist = ref(null)
const downloads = ref([])
const selectedQuality = ref('standard')
const playlistMessage = ref('')
const joinRoomId = ref('')
const localMusicPath = ref('')
const localMusic = ref([])
const searchKeyword = ref('')
const searchResults = ref([])
const searched = ref(false)

const loading = ref({
  parse: false,
  download: false,
  playlist: false,
  search: false,
  downloads: false,
  localMusic: false
})
const downloadingAll = ref(false)
const downloadingSelected = ref(false)
const downloadDir = ref('')
const settingDir = ref(false)
const dirMessage = ref(null)

// 限流配置
const BATCH_DOWNLOAD_DELAY = 500
let searchDebounceTimer = null

const API_BASE = import.meta.env.VITE_API_BASE || ''

// WebSocket连接 - 使用根路径让 Vite 代理转发
const socket = io('/', {
  transports: ['polling', 'websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
})

// Toast
const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// 计算属性
const selectedCount = computed(() => {
  if (!parsedPlaylist.value?.songs) return 0
  return parsedPlaylist.value.songs.filter(s => s.selected).length
})

// 工具函数
function getAudioDuration(fileUrl) {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.src = fileUrl
    let resolved = false
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true
        audio.src = ''
        resolve(0)
      }
    }, 5000)
    audio.addEventListener('loadedmetadata', () => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeoutId)
        resolve(audio.duration || 0)
      }
    })
    audio.addEventListener('error', () => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeoutId)
        audio.src = ''
        resolve(0)
      }
    })
  })
}

// 本地播放 Audio 实例（不依赖房间）
let localAudio = null
let localAudioInit = false

function getLocalAudio() {
  if (!localAudio) {
    localAudio = new Audio()
    localAudio.volume = playerStore.volume / 100

    localAudio.addEventListener('timeupdate', () => {
      if (playerStore.currentSong && !roomStore.roomId) {
        playerStore.setCurrentTime(localAudio.currentTime)
      }
    })

    localAudio.addEventListener('ended', () => {
      if (!roomStore.roomId) {
        playNextLocal()
      }
    })

    localAudio.addEventListener('loadedmetadata', () => {
      if (playerStore.currentSong && !roomStore.roomId) {
        const duration = localAudio.duration
        const song = { ...playerStore.currentSong, duration }
        playerStore.setPlaylist([
          ...playerStore.playlist.slice(0, playerStore.currentIndex),
          song,
          ...playerStore.playlist.slice(playerStore.currentIndex + 1)
        ])
      }
    })
  }
  return localAudio
}

function playLocalSong(index) {
  const audio = getLocalAudio()
  const song = playerStore.playlist[index]
  if (!song) return

  audio.src = song.fileUrl
  audio.play()
  playerStore.setCurrentIndex(index)
  playerStore.setPlaying(true)
  // 添加到播放历史
  historyStore.addRecord({
    title: song.title,
    artist: song.artist || 'Unknown',
    album: song.album || '',
    duration: song.duration || 0,
    coverUrl: song.coverUrl || song.thumbnail || '',
    fileUrl: song.fileUrl
  })
  playerStore.setCurrentTime(0)
}

function toggleLocalPlay() {
  const audio = getLocalAudio()
  if (playerStore.isPlaying && !roomStore.roomId) {
    audio.pause()
    playerStore.setPlaying(false)
  } else if (!roomStore.roomId && playerStore.currentSong) {
    audio.play()
    playerStore.setPlaying(true)
  }
}

function playNextLocal() {
  const nextIndex = playerStore.getNextIndex()
  if (nextIndex >= 0) {
    playLocalSong(nextIndex)
  } else {
    playerStore.setPlaying(false)
  }
}

// 房间会话持久化
function saveRoomSession() {
  if (roomStore.roomId) {
    sessionStorage.setItem('syncmusic_room', JSON.stringify({
      roomId: roomStore.roomId,
      isHost: roomStore.isHost,
      timestamp: Date.now()
    }))
  }
}

function restoreRoomSession() {
  const saved = sessionStorage.getItem('syncmusic_room')
  if (saved && socket.connected) {
    const { roomId, timestamp } = JSON.parse(saved)
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      socket.emit('rejoin-room', { roomId })
    }
  }
}

// 房主同步状态
let hostRafId = null
let hostStartTime = 0
let listenerPlayStartTime = 0
let listenerStartPosition = 0

function startHostSync() {
  hostStartTime = performance.now()
  let lastSyncMs = 0

  function tick() {
    if (!playerStore.isPlaying || !roomStore.roomId || !roomStore.isHost) {
      hostRafId = requestAnimationFrame(tick)
      return
    }
    const now = performance.now()
    const elapsed = (now - hostStartTime) / 1000
    playerStore.setCurrentTime(Math.min(elapsed, playerStore.currentSong?.duration || 100))
    if (now - lastSyncMs >= 500) {
      socket.emit('sync-time', { roomId: roomStore.roomId, time: playerStore.currentTime })
      // 同步歌词进度给听众
      if (playerStore.lyrics.length > 0) {
        const currentLyricIndex = getCurrentLyricIndex(playerStore.lyrics, playerStore.currentTime)
        socket.emit('sync-lyrics', {
          roomId: roomStore.roomId,
          lyrics: playerStore.lyrics,
          currentLyricIndex
        })
      }
      lastSyncMs = now
    }
    hostRafId = requestAnimationFrame(tick)
  }
  hostRafId = requestAnimationFrame(tick)
}

function stopHostSync() {
  if (hostRafId) {
    cancelAnimationFrame(hostRafId)
    hostRafId = null
  }
}

// Socket事件处理
function setupSocketListeners() {
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
    restoreRoomSession()
  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected')
  })

  socket.on('reconnect', () => {
    console.log('Socket reconnected')
    restoreRoomSession()
  })

  socket.on('room-created', ({ roomId, room }) => {
    roomStore.setRoom(roomId, true)
    if (room) {
      playerStore.setPlaylist(room.playlist || [])
      playerStore.setCurrentIndex(room.currentIndex ?? -1)
    }
    saveRoomSession()
    showToast('房间已创建: ' + roomId)
  })

  socket.on('room-joined', ({ roomId, isHost: isRoomHost, room }) => {
    roomStore.setRoom(roomId, isRoomHost)
    if (room) {
      playerStore.setPlaylist(room.playlist || [])
      playerStore.setCurrentIndex(room.currentIndex ?? -1)
      playerStore.setPlaying(room.isPlaying || false)
      playerStore.setCurrentTime(room.currentTime || 0)
      playerStore.setPlayMode(room.playMode || 'list')
    }
    saveRoomSession()
    showToast('已加入房间: ' + roomId)
  })

  socket.on('room-left', () => {
    sessionStorage.removeItem('syncmusic_room')
    roomStore.clearRoom()
    // 离开房间时不清理播放列表，保留本地播放状态
    // playerStore.clear() 已移除，支持"先播放，再一起听"
    showToast('已离开房间')
  })

  socket.on('listener-joined', ({ listenerId, listenerCount }) => {
    roomStore.addListener(listenerId)
    roomStore.setListeners(listenerCount)
  })

  socket.on('listener-left', ({ listenerCount }) => {
    roomStore.setListeners(listenerCount)
  })

  socket.on('playlist-updated', ({ playlist: newPlaylist, currentIndex: newCurrentIndex }) => {
    playerStore.setPlaylist(newPlaylist)
    playerStore.setCurrentIndex(newCurrentIndex)
  })

  socket.on('sync-play', ({ position, currentIndex: newIndex, currentSong: song }) => {
    playerStore.setPlaying(true)
    playerStore.setCurrentTime(position)
    if (!roomStore.isHost) {
      listenerPlayStartTime = performance.now()
      listenerStartPosition = position
    }
    if (newIndex !== undefined) {
      playerStore.setCurrentIndex(newIndex)
    }
    if (song) {
      const playlist = playerStore.playlist
      if (playlist[newIndex]) {
        playerStore.setPlaylist([
          ...playlist.slice(0, newIndex),
          song,
          ...playlist.slice(newIndex + 1)
        ])
      }
    }
  })

  socket.on('sync-pause', ({ position }) => {
    playerStore.setPlaying(false)
    playerStore.setCurrentTime(position)
    if (!roomStore.isHost) {
      listenerPlayStartTime = 0
    }
  })

  socket.on('sync-song-change', ({ currentIndex: newIndex, currentSong: song, position, isPlaying: playing }) => {
    playerStore.setCurrentIndex(newIndex)
    playerStore.setCurrentTime(position || 0)
    playerStore.setPlaying(playing)
    if (song && playerStore.playlist[newIndex]) {
      const playlist = playerStore.playlist
      playerStore.setPlaylist([
        ...playlist.slice(0, newIndex),
        song,
        ...playlist.slice(newIndex + 1)
      ])
    }
  })

  socket.on('play-state-updated', ({ isPlaying: playing, currentTime: time }) => {
    playerStore.setPlaying(playing)
    playerStore.setCurrentTime(time)
  })

  socket.on('sync-time-update', ({ time }) => {
    if (!roomStore.isHost) {
      const now = performance.now()
      let expectedTime = time
      if (listenerPlayStartTime > 0) {
        expectedTime = listenerStartPosition + (now - listenerPlayStartTime) / 1000
      }
      const drift = expectedTime - playerStore.currentTime
      if (Math.abs(drift) > 0.5) {
        playerStore.setCurrentTime(expectedTime)
      } else if (Math.abs(drift) > 0.05) {
        playerStore.setCurrentTime(playerStore.currentTime + drift * 0.3)
      }
    }
  })

  socket.on('error', ({ message }) => {
    showToast(message, 'error')
  })

  // 歌词同步（听众接收）
  socket.on('lyrics-sync', ({ lyrics, currentLyricIndex }) => {
    if (!roomStore.isHost) {
      playerStore.setLyrics(lyrics || [])
      playerStore.setLyricsFetched(true)
    }
  })

  // 播放模式同步
  socket.on('play-mode-changed', ({ playMode }) => {
    playerStore.setPlayMode(playMode)
  })
}

const SOCKET_EVENTS = [
  'connect', 'disconnect', 'reconnect', 'room-created', 'room-joined', 'room-left',
  'listener-joined', 'listener-left', 'playlist-updated',
  'sync-play', 'sync-pause', 'sync-song-change',
  'play-state-updated', 'sync-time-update', 'error', 'lyrics-sync', 'play-mode-changed'
]

// 房间操作
function createRoom() {
  socket.emit('create-room-with-playlist', {
    playlist: playerStore.playlist,
    currentIndex: playerStore.currentIndex,
    isPlaying: playerStore.isPlaying,
    currentTime: playerStore.currentTime,
    playMode: playerStore.playMode
  })
}

function joinRoom(id) {
  if (!id) {
    showToast('请输入房间号', 'error')
    return
  }
  socket.emit('join-room', { roomId: id.toUpperCase() })
}

function handleDiscoverJoinRoom(roomId) {
  // 从发现页加入房间后切换到一起听 Tab
  joinRoom(roomId)
  activeTab.value = 'room'
}

function leaveRoom() {
  if (roomStore.roomId) {
    socket.emit('leave-room', { roomId: roomStore.roomId })
  }
}

// 播放控制
function togglePlay() {
  if (roomStore.roomId && roomStore.isHost) {
    // 房间模式：发送 Socket.IO 事件
    if (playerStore.isPlaying) {
      socket.emit('pause', { roomId: roomStore.roomId, position: playerStore.currentTime })
    } else {
      socket.emit('play', { roomId: roomStore.roomId, position: playerStore.currentTime })
    }
  } else if (playerStore.currentSong) {
    // 本地模式：直接控制本地 Audio
    toggleLocalPlay()
  }
}

function playNextSong() {
  if (roomStore.roomId && roomStore.isHost) {
    // 房间模式
    socket.emit('play-next', { roomId: roomStore.roomId })
  } else {
    // 本地模式
    playNextLocal()
  }
}

function changeSong(index) {
  if (roomStore.roomId && roomStore.isHost) {
    // 房间模式
    socket.emit('change-song', { roomId: roomStore.roomId, index })
  } else if (playerStore.playlist[index]) {
    // 本地模式：直接切换歌曲
    playLocalSong(index)
  }
}

// 处理来自 Playlist.vue 的播放事件
function handlePlaylistPlay(index) {
  if (roomStore.roomId && roomStore.isHost) {
    // 房间模式
    socket.emit('change-song', { roomId: roomStore.roomId, index })
  } else {
    // 本地模式
    playLocalSong(index)
  }
}

function removeSong(index) {
  if (roomStore.roomId && roomStore.isHost) {
    // 房间模式
    socket.emit('remove-from-playlist', { roomId: roomStore.roomId, index })
  } else {
    // 本地模式：从播放列表移除
    playerStore.removeSong(index)
  }
}

// 处理来自 Playlist.vue 的添加到播放列表
async function handleAddToPlaylist(song) {
  if (roomStore.roomId) {
    // 房间模式
    await addToRoomPlaylist(song)
  } else {
    // 本地模式：获取时长后添加
    const duration = await getAudioDuration(song.fileUrl)
    const songWithDuration = { ...song, duration }
    playerStore.addSong(songWithDuration)
    // 如果是第一次添加，自动播放
    if (playerStore.playlist.length === 1) {
      playLocalSong(0)
    }
  }
}

function onSeek(time) {
  if (roomStore.roomId && roomStore.isHost) {
    // 房间模式
    socket.emit('sync-time', { roomId: roomStore.roomId, time })
  } else {
    // 本地模式：直接设置 Audio 时间
    const audio = getLocalAudio()
    audio.currentTime = time
    playerStore.setCurrentTime(time)
  }
}

function handleVolumeChange(volume) {
  playerStore.setVolume(volume)
}

function changePlayMode() {
  if (roomStore.roomId && roomStore.isHost) {
    // 房间模式
    const modes = ['list', 'single', 'shuffle']
    const current = playerStore.playMode
    const next = modes[(modes.indexOf(current) + 1) % modes.length]
    socket.emit('change-play-mode', { roomId: roomStore.roomId, mode: next })
  } else {
    // 本地模式：直接更新播放模式
    const modes = ['list', 'single', 'shuffle']
    const current = playerStore.playMode
    const next = modes[(modes.indexOf(current) + 1) % modes.length]
    playerStore.setPlayMode(next)
  }
}

// 添加歌曲到播放列表
async function addToRoomPlaylist(song) {
  if (!roomStore.roomId) {
    showToast('请先加入房间', 'error')
    return
  }

  const fileUrl = song.url || `${API_BASE}/downloads/${encodeURIComponent(song.title)}.mp3`
  const duration = await getAudioDuration(fileUrl)

  const roomSong = {
    title: song.title || song.name,
    artist: song.singer || song.artist || 'Unknown',
    album: song.album || '',
    duration,
    coverUrl: song.cover || '',
    fileUrl
  }

  socket.emit('add-to-playlist', { roomId: roomStore.roomId, song: roomSong })
  showToast(duration > 0 ? '已添加到播放列表' : '已添加(时长获取失败)')
}

async function addDownloadedToPlaylist(file) {
  const nameWithoutExt = file.name.replace(/\.(mp3|flac|m4a)$/i, '')
  const parts = nameWithoutExt.split(' - ')
  const title = parts.length > 1 ? parts[1].trim() : parts[0].trim()
  const artist = parts.length > 1 ? parts[0].trim() : 'Unknown'
  const fileUrl = `${API_BASE}/api/downloads/${encodeURIComponent(file.name)}`

  const duration = await getAudioDuration(fileUrl)
  const song = { title, artist, album: '', duration, coverUrl: '', fileUrl }

  if (roomStore.roomId) {
    // 房间模式
    socket.emit('add-to-playlist', { roomId: roomStore.roomId, song })
  } else {
    // 本地模式
    playerStore.addSong(song)
    // 如果是第一次添加，自动播放
    if (playerStore.playlist.length === 1) {
      playLocalSong(0)
    }
  }
  showToast(duration > 0 ? '已添加到播放列表' : '已添加(时长获取失败)')
}

async function addSearchResultToPlaylist(song) {
  const duration = await getAudioDuration(song.fileUrl)
  const roomSong = {
    title: song.title,
    artist: song.singer || song.artist,
    album: '',
    duration,
    coverUrl: '',
    fileUrl: song.fileUrl
  }

  if (roomStore.roomId) {
    // 房间模式
    socket.emit('add-to-playlist', { roomId: roomStore.roomId, song: roomSong })
  } else {
    // 本地模式
    playerStore.addSong(roomSong)
    // 如果是第一次添加，自动播放
    if (playerStore.playlist.length === 1) {
      playLocalSong(0)
    }
  }
  showToast(duration > 0 ? '已添加到播放列表' : '已添加(时长获取失败)')
}

async function addLocalToPlaylist(song) {
  const duration = await getAudioDuration(song.fileUrl)
  const roomSong = {
    title: song.title,
    artist: song.artist,
    album: '',
    duration,
    coverUrl: '',
    fileUrl: song.fileUrl
  }

  if (roomStore.roomId) {
    // 房间模式
    socket.emit('add-to-playlist', { roomId: roomStore.roomId, song: roomSong })
  } else {
    // 本地模式
    playerStore.addSong(roomSong)
    // 如果是第一次添加，自动播放
    if (playerStore.playlist.length === 1) {
      playLocalSong(0)
    }
  }
  showToast(duration > 0 ? '已添加到播放列表' : '已添加(时长获取失败)')
}

// 从历史添加到播放列表
async function addHistoryToPlaylist(song) {
  const duration = await getAudioDuration(song.fileUrl)
  const roomSong = {
    title: song.title,
    artist: song.artist,
    album: song.album || '',
    duration: song.duration || duration,
    coverUrl: song.coverUrl || '',
    fileUrl: song.fileUrl
  }

  if (roomStore.roomId) {
    // 房间模式
    socket.emit('add-to-playlist', { roomId: roomStore.roomId, song: roomSong })
  } else {
    // 本地模式
    playerStore.addSong(roomSong)
    // 如果是第一次添加，自动播放
    if (playerStore.playlist.length === 1) {
      playLocalSong(0)
    }
  }
  showToast(duration > 0 ? '已添加到播放列表' : '已添加(时长获取失败)')
}

// 搜索音乐
function searchSongs(keyword) {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }

  const kw = keyword?.trim()
  if (!kw) return

  searchDebounceTimer = setTimeout(async () => {
    loading.value.search = true
    searchResults.value = []
    searched.value = false

    try {
      const results = await searchMusic(kw)
      searchResults.value = results.results || []
      searched.value = true
    } catch (error) {
      showToast('搜索失败: ' + error.message, 'error')
    } finally {
      loading.value.search = false
    }
  }, 300)
}

// 本地音乐
async function loadLocalMusic(path) {
  if (!path?.trim()) {
    showToast('请输入文件夹路径', 'error')
    return
  }
  loading.value.localMusic = true
  try {
    const result = await browseFolder(path)
    localMusic.value = result.files.map(f => {
      const nameWithoutExt = f.name.replace(/\.(mp3|flac|m4a)$/i, '')
      const parts = nameWithoutExt.split(' - ')
      return {
        path: f.path,
        title: parts.length > 1 ? parts[1].trim() : parts[0].trim(),
        artist: parts.length > 1 ? parts[0].trim() : 'Unknown',
        fileUrl: `${API_BASE}/local-music/${encodeURIComponent(f.path)}`
      }
    })
    // 保存到 localStorage
    saveLocalMusic()
    showToast(`已加载 ${localMusic.value.length} 首歌曲`)
  } catch (error) {
    showToast('加载失败: ' + error.message, 'error')
  } finally {
    loading.value.localMusic = false
  }
}

// 页面加载时自动恢复本地音乐
function restoreLocalMusic() {
  try {
    const savedPath = localStorage.getItem('syncmusic_local_music_path')
    const savedMusic = localStorage.getItem('syncmusic_local_music')
    // 先恢复音乐列表
    if (savedMusic) {
      localMusic.value = JSON.parse(savedMusic)
    }
    // 再恢复路径
    if (savedPath) {
      localMusicPath.value = savedPath
    }
  } catch (e) {
    console.error('Failed to restore local music:', e)
  }
}

// 保存本地音乐到 localStorage
function saveLocalMusic() {
  try {
    localStorage.setItem('syncmusic_local_music', JSON.stringify(localMusic.value))
    if (localMusicPath.value) {
      localStorage.setItem('syncmusic_local_music_path', localMusicPath.value)
    }
  } catch (e) {
    console.error('Failed to save local music:', e)
  }
}

async function importMusicFiles() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.mp3,.flac,.m4a'
  input.multiple = true
  input.onchange = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    loading.value.localMusic = true
    try {
      const result = await uploadMusicFiles(files)
      if (result.success && result.files) {
        // 添加到本地音乐列表，使用服务器URL
        for (const file of result.files) {
          const song = {
            path: file.name,
            title: file.title,
            artist: file.artist,
            duration: file.duration || 0,
            fileUrl: file.path // 使用服务器路径，如 /downloads/xxx.mp3
          }
          localMusic.value = [...localMusic.value, song]
        }
        saveLocalMusic()
        showToast(`已导入 ${result.files.length} 首歌曲`)
      }
    } catch (error) {
      showToast('导入失败: ' + error.message, 'error')
    } finally {
      loading.value.localMusic = false
    }
  }
  input.click()
}

// 解析和下载
async function handleParse(url, quality) {
  if (!url) {
    showToast('请输入音乐链接', 'error')
    return
  }

  loading.value.parse = true
  try {
    parsedSong.value = await parseMusicUrl(url)
    selectedQuality.value = quality
    showToast('解析成功')
  } catch (error) {
    showToast('解析失败: ' + error.message, 'error')
  } finally {
    loading.value.parse = false
  }
}

async function handleDownload(url, quality) {
  if (!parsedSong.value) {
    showToast('请先解析歌曲', 'error')
    return
  }

  loading.value.download = true
  try {
    await downloadMusic(url, quality)
    showToast('下载成功')
    await refreshDownloads()
  } catch (error) {
    showToast('下载失败: ' + error.message, 'error')
  } finally {
    loading.value.download = false
  }
}

async function handleParsePlaylist(url) {
  if (!url) {
    showToast('请输入歌单链接', 'error')
    return
  }

  loading.value.playlist = true
  playlistMessage.value = ''
  try {
    parsedPlaylist.value = await parsePlaylist(url)
    parsedPlaylist.value.songs = parsedPlaylist.value.songs.map(song => ({
      ...song,
      selected: false,
      downloading: false,
      downloadStatus: null
    }))
    showToast('解析成功，共 ' + parsedPlaylist.value.songCount + ' 首歌曲')
  } catch (error) {
    showToast('解析失败: ' + error.message, 'error')
  } finally {
    loading.value.playlist = false
  }
}

async function handlePlaylistDownload(url) {
  if (!url) {
    showToast('请输入歌单链接', 'error')
    return
  }

  loading.value.playlist = true
  playlistMessage.value = ''
  try {
    const result = await downloadPlaylist(url, selectedQuality.value)
    playlistMessage.value = result.message
    showToast('歌单下载已开始')
  } catch (error) {
    showToast('下载失败: ' + error.message, 'error')
  } finally {
    loading.value.playlist = false
  }
}

async function handleDownloadSong(song) {
  if (song.downloading) return
  song.downloading = true
  song.downloadStatus = null
  try {
    await browserDownload(song.title, song.singer)
    song.downloadStatus = 'success'
    showToast(`下载成功: ${song.title}`)
    await refreshDownloads()
  } catch (error) {
    song.downloadStatus = 'failed'
    showToast('下载失败: ' + error.message, 'error')
  } finally {
    song.downloading = false
  }
}

// 下载列表操作
function selectAll() {
  if (!parsedPlaylist.value?.songs) return
  const allSelected = selectedCount.value === parsedPlaylist.value.songs.length
  parsedPlaylist.value.songs = parsedPlaylist.value.songs.map(s => ({
    ...s,
    selected: !allSelected
  }))
}

async function downloadAll() {
  if (!parsedPlaylist.value?.songs) return
  downloadingAll.value = true
  for (const song of parsedPlaylist.value.songs) {
    song.selected = true
    await handleDownloadSong(song)
    await new Promise(r => setTimeout(r, BATCH_DOWNLOAD_DELAY))
  }
  downloadingAll.value = false
}

async function downloadSelected() {
  if (!parsedPlaylist.value?.songs) return
  const selectedSongs = parsedPlaylist.value.songs.filter(s => s.selected)
  downloadingSelected.value = true
  for (const song of selectedSongs) {
    await handleDownloadSong(song)
    await new Promise(r => setTimeout(r, BATCH_DOWNLOAD_DELAY))
  }
  downloadingSelected.value = false
}

async function refreshDownloads() {
  loading.value.downloads = true
  try {
    downloads.value = await getDownloadList()
    localMusic.value = downloads.value.map(file => {
      const nameWithoutExt = file.name.replace(/\.(mp3|flac|m4a)$/i, '')
      const parts = nameWithoutExt.split(' - ')
      const fileName = file.url.split('/').pop()
      const encodedUrl = '/downloads/' + encodeURIComponent(fileName)
      return {
        path: file.url,
        title: parts.length > 1 ? parts[1].trim() : parts[0].trim(),
        artist: parts.length > 1 ? parts[0].trim() : 'Unknown',
        fileUrl: `${API_BASE}${encodedUrl}`
      }
    })
  } catch (error) {
    console.error('获取下载列表失败:', error)
  } finally {
    loading.value.downloads = false
  }
}

async function handleUpdateDownloadDir(newPath) {
  settingDir.value = true
  dirMessage.value = null
  try {
    const result = await setDownloadDir(newPath)
    downloadDir.value = result.path
    dirMessage.value = { text: '下载目录已设置，重启后端服务后生效', type: 'success' }
  } catch (error) {
    dirMessage.value = { text: error.response?.data?.error || '设置失败', type: 'error' }
  } finally {
    settingDir.value = false
  }
}

// 监听播放器状态变化
watch([() => roomStore.roomId, () => roomStore.isHost, () => playerStore.isPlaying], ([roomId, isHost, playing]) => {
  if (roomId && isHost && playing) {
    startHostSync()
  } else {
    stopHostSync()
  }
})

// 监听音量变化，同步到本地 Audio
watch(() => playerStore.volume, (volume) => {
  const audio = getLocalAudio()
  audio.volume = volume / 100
})

// 监听 seek 变化，同步到本地 Audio
watch(() => playerStore.currentTime, (time) => {
  if (!roomStore.roomId && time !== undefined) {
    const audio = getLocalAudio()
    if (Math.abs(audio.currentTime - time) > 0.5) {
      audio.currentTime = time
    }
  }
})

// 监听 playerStore.isPlaying 变化，同步到本地 Audio（处理 MiniPlayer 的控制）
let lastPlayingState = null
watch(() => playerStore.isPlaying, (newPlaying) => {
  // 避免初始化的 undefined 触发
  if (lastPlayingState === null) {
    lastPlayingState = newPlaying
    return
  }

  // 仅在本地模式且状态实际变化时同步
  if (!roomStore.roomId && newPlaying !== lastPlayingState) {
    const audio = getLocalAudio()
    if (newPlaying) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }
  lastPlayingState = newPlaying
})

// 监听 currentIndex 变化，切换本地播放歌曲
let lastIndex = null
watch(() => playerStore.currentIndex, (newIndex) => {
  if (lastIndex === null) {
    lastIndex = newIndex
    return
  }

  // 仅在本地模式且索引实际变化时切换歌曲
  if (!roomStore.roomId && newIndex !== lastIndex && newIndex >= 0) {
    playLocalSong(newIndex)
  }
  lastIndex = newIndex
})

onUnmounted(() => {
  stopHostSync()
  SOCKET_EVENTS.forEach(event => socket.off(event))
})

onMounted(async () => {
  setupSocketListeners()
  socket.connect()
  restoreLocalMusic()
  refreshDownloads()
  try {
    const result = await getDownloadDir()
    downloadDir.value = result.path
  } catch (e) {
    console.error('获取下载目录失败:', e)
  }
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  position: relative;
}

.home-bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, #0f0f14 0%, #1a1a24 50%, #0f0f14 100%);
  z-index: -1;
}

.home-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 400px;
  background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.12) 0%, transparent 60%);
}

.home-bg::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 300px;
  background: radial-gradient(ellipse 60% 40% at 50% 100%, rgba(6, 182, 212, 0.08) 0%, transparent 60%);
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  position: relative;
  z-index: 1;
}

/* Header */
.header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  color: #a78bfa;
  animation: float 3s ease-in-out infinite;
  flex-shrink: 0;
}

.logo-text {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #f8fafc 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-badge {
  padding: 4px 12px;
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: #a78bfa;
}

/* Tab 导航 */
.tab-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  padding: 6px;
  background: rgba(26, 26, 36, 0.6);
  border-radius: 16px;
  border: 1px solid rgba(139, 92, 246, 0.1);
  backdrop-filter: blur(10px);
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: none;
  background: transparent;
  outline: none;
}

.tab-item:focus-visible {
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5);
}

.tab-item:hover {
  color: #94a3b8;
  background: rgba(139, 92, 246, 0.08);
}

.tab-item.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%);
  color: #f8fafc;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
}

.tab-icon {
  flex-shrink: 0;
}

/* 内容区域 */
.content-area {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 16px 24px;
  border-radius: 12px;
  font-weight: 500;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

.toast-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.toast-error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
</style>
