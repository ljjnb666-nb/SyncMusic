<template>
  <div class="room-discovery">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <AppIcon name="search" :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索房间号、歌曲或歌手..."
          @input="handleSearch"
        />
        <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
          <AppIcon name="x" :size="16" />
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 房间列表 -->
    <div v-else-if="rooms.length > 0" class="room-list">
      <div
        v-for="room in rooms"
        :key="room.roomId"
        class="room-card"
        @click="handleJoinRoom(room.roomId)"
      >
        <div class="room-info">
          <div class="room-header">
            <span class="room-id">房间 {{ room.roomId }}</span>
            <span v-if="room.isPlaying" class="playing-badge">
              <AppIcon name="play" :size="12" />
              正在播放
            </span>
          </div>

          <!-- 当前歌曲 -->
          <div v-if="room.currentSong" class="current-song">
            <div class="song-cover">
              <img
                v-if="room.currentSong.coverUrl"
                :src="room.currentSong.coverUrl"
                :alt="room.currentSong.title"
              />
              <AppIcon v-else name="music" :size="20" class="cover-placeholder" />
            </div>
            <div class="song-info">
              <div class="song-title">{{ room.currentSong.title }}</div>
              <div class="song-artist">{{ room.currentSong.artist }}</div>
            </div>
          </div>
          <div v-else class="no-song">暂无播放</div>
        </div>

        <div class="room-meta">
          <div class="meta-item">
            <AppIcon name="users" :size="14" />
            <span>{{ room.listenerCount }}</span>
          </div>
          <div class="meta-item">
            <AppIcon name="list" :size="14" />
            <span>{{ room.songCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <AppIcon name="compass" :size="48" class="empty-icon" />
      <div class="empty-title">{{ searchQuery ? '没有找到符合条件的房间' : '暂无房间' }}</div>
      <div class="empty-desc">
        {{ searchQuery ? '试试其他关键词' : '创建房间后其他人就能发现了' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getRooms, searchRooms } from '../api/rooms.js'
import AppIcon from './AppIcon.vue'

const emit = defineEmits(['join-room'])

const rooms = ref([])
const loading = ref(false)
const searchQuery = ref('')
let searchTimer = null

async function fetchRooms() {
  loading.value = true
  try {
    const data = await getRooms()
    rooms.value = data.rooms || []
  } catch (error) {
    console.error('获取房间列表失败:', error)
    rooms.value = []
  } finally {
    loading.value = false
  }
}

async function handleSearch() {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  if (!searchQuery.value.trim()) {
    fetchRooms()
    return
  }

  searchTimer = setTimeout(async () => {
    loading.value = true
    try {
      const data = await searchRooms(searchQuery.value.trim())
      rooms.value = data.rooms || []
    } catch (error) {
      console.error('搜索房间失败:', error)
      rooms.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

function clearSearch() {
  searchQuery.value = ''
  fetchRooms()
}

function handleJoinRoom(roomId) {
  emit('join-room', roomId)
}

onMounted(() => {
  fetchRooms()
})
</script>

<style scoped>
.room-discovery {
  padding: 0 8px;
}

/* 搜索栏 */
.search-bar {
  margin-bottom: 20px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 16px;
  color: #64748b;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 14px 44px;
  background: rgba(26, 26, 36, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 12px;
  font-size: 15px;
  color: #f8fafc;
  outline: none;
  transition: all 0.25s ease;
}

.search-input::placeholder {
  color: #64748b;
}

.search-input:focus {
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.clear-btn {
  position: absolute;
  right: 12px;
  padding: 6px;
  background: rgba(100, 116, 139, 0.3);
  border: none;
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  background: rgba(100, 116, 139, 0.5);
  color: #f8fafc;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 16px;
  color: #64748b;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(139, 92, 246, 0.2);
  border-top-color: #a78bfa;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 房间列表 */
.room-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.room-card {
  background: rgba(26, 26, 36, 0.7);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-card:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.room-info {
  flex: 1;
  min-width: 0;
}

.room-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.room-id {
  font-size: 15px;
  font-weight: 600;
  color: #f8fafc;
}

.playing-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.current-song {
  display: flex;
  align-items: center;
  gap: 12px;
}

.song-cover {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: rgba(139, 92, 246, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  color: #64748b;
}

.song-info {
  min-width: 0;
}

.song-title {
  font-size: 14px;
  font-weight: 500;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-song {
  font-size: 13px;
  color: #475569;
  font-style: italic;
}

.room-meta {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  margin-left: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #64748b;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  color: #334155;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #475569;
}
</style>
