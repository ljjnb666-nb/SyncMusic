import { defineStore } from 'pinia'
import { normalizeTrackPath } from '../utils/trackUtils.js'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'syncmusic_playlist'
const STORAGE_INDEX_KEY = 'syncmusic_playlist_index'

// 从 localStorage 加载保存的播放列表
// 自动迁移：规范化所有 track.path，修复历史遗留的 % 字符问题
function loadPlaylist() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const playlist = JSON.parse(saved)
      // Migration: normalize all track paths on load
      return playlist.map(normalizeTrackPath)
    }
  } catch (e) {
    console.error('Failed to load playlist:', e)
  }
  return []
}

// 从 localStorage 加载保存的播放索引
function loadCurrentIndex() {
  try {
    const saved = localStorage.getItem(STORAGE_INDEX_KEY)
    if (saved !== null) {
      return parseInt(saved, 10)
    }
  } catch (e) {
    console.error('Failed to load current index:', e)
  }
  return -1
}

export const usePlayerStore = defineStore('player', () => {
  // 初始化时从 localStorage 加载
  const playlist = ref(loadPlaylist())
  const currentIndex = ref(loadCurrentIndex())
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const volume = ref(80)
  const lyrics = ref([])
  const lyricsFetched = ref(false)
  const playMode = ref('list') // 'list' | 'single' | 'shuffle'
  const shuffleHistory = ref([]) // 随机播放历史

  const currentSong = computed(() => playlist.value[currentIndex.value] || null)

  // 保存播放列表到 localStorage
  let saveTimer = null
  function savePlaylist() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(playlist.value))
      } catch (e) {
        console.error('Failed to save playlist:', e)
      }
    }, 300)
  }

  // 保存当前索引到 localStorage
  function saveCurrentIndex() {
    try {
      localStorage.setItem(STORAGE_INDEX_KEY, String(currentIndex.value))
    } catch (e) {
      console.error('Failed to save current index:', e)
    }
  }

  function addSong(song) {
    // 检查是否已存在（根据 title 和 artist 判断）
    const exists = playlist.value.some(
      s => s.title === song.title && s.artist === song.artist
    )
    if (exists) {
      return false // 歌曲已存在
    }
    playlist.value = [...playlist.value, song]
    if (currentIndex.value === -1) {
      currentIndex.value = 0
    }
    savePlaylist()
    return true
  }

  function removeSong(index) {
    playlist.value = playlist.value.filter((_, i) => i !== index)
    if (index === currentIndex.value) {
      // Removed current song
      if (playlist.value.length === 0) {
        currentIndex.value = -1
      } else if (index >= playlist.value.length) {
        currentIndex.value = playlist.value.length - 1
      }
    } else if (index < currentIndex.value) {
      currentIndex.value--
    }
    savePlaylist()
    saveCurrentIndex()
  }

  function setPlaylist(songs) {
    playlist.value = songs
    if (currentIndex.value === -1 && songs.length > 0) {
      currentIndex.value = 0
    }
    savePlaylist()
  }

  function setCurrentIndex(index) {
    currentIndex.value = index
    saveCurrentIndex()
  }

  function setPlaying(playing) {
    isPlaying.value = playing
  }

  function setCurrentTime(time) {
    currentTime.value = time
  }

  // Seek to specific time (used by sync events)
  function seekTo(time) {
    currentTime.value = time
  }

  function setVolume(vol) {
    volume.value = vol
  }

  function setLyrics(items) {
    lyrics.value = items
  }

  function setLyricsFetched(val) {
    lyricsFetched.value = val
  }

  function clear() {
    playlist.value = []
    currentIndex.value = -1
    isPlaying.value = false
    currentTime.value = 0
    shuffleHistory.value = []
    savePlaylist()
    saveCurrentIndex()
  }

  function setPlayMode(mode) {
    playMode.value = mode
    // 切换模式时重置随机历史
    if (mode === 'shuffle') {
      shuffleHistory.value = [currentIndex.value].filter(i => i >= 0)
    } else {
      shuffleHistory.value = []
    }
  }

  function getPrevIndex() {
    const len = playlist.value.length
    if (len === 0) return -1
    if (currentIndex.value <= 0) return 0
    return currentIndex.value - 1
  }

  function getNextIndex() {
    const len = playlist.value.length
    if (len === 0) return -1

    if (playMode.value === 'single') {
      // 单曲循环：停在当前歌曲
      return currentIndex.value
    }

    if (playMode.value === 'shuffle') {
      // 随机播放：从未播放过的歌曲中随机选一首
      const unplayed = []
      for (let i = 0; i < len; i++) {
        if (!shuffleHistory.value.includes(i)) {
          unplayed.push(i)
        }
      }
      if (unplayed.length === 0) {
        // 全部播完，从头重新随机
        shuffleHistory.value = []
        const next = Math.floor(Math.random() * len)
        shuffleHistory.value.push(next)
        return next
      }
      const next = unplayed[Math.floor(Math.random() * unplayed.length)]
      shuffleHistory.value.push(next)
      return next
    }

    // 列表循环：currentIndex + 1，到末尾停止
    if (currentIndex.value >= len - 1) {
      return -1
    }
    return currentIndex.value + 1
  }

  return {
    playlist,
    currentIndex,
    isPlaying,
    currentTime,
    volume,
    lyrics,
    lyricsFetched,
    playMode,
    currentSong,
    addSong,
    removeSong,
    setPlaylist,
    setCurrentIndex,
    setPlaying,
    setCurrentTime,
    seekTo,
    setVolume,
    setLyrics,
    setLyricsFetched,
    setPlayMode,
    getNextIndex,
    getPrevIndex,
    clear
  }
})
