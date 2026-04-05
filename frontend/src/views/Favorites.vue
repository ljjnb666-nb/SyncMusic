<template>
  <div class="favorites-view">
    <div class="favorites-header">
      <h2 class="favorites-title">
        <AppIcon name="heart" :size="22" class="title-icon" />
        <span>我的收藏</span>
        <span class="favorites-count" v-if="favorites.length > 0">{{ favorites.length }}</span>
      </h2>
      <button @click="handleRefresh" class="refresh-btn" :disabled="loading">
        <AppIcon name="refresh" :size="18" :class="{ spinning: loading }" />
      </button>
    </div>

    <div v-if="!loading && favorites.length === 0" class="empty-state">
      <AppIcon name="heart" :size="48" class="empty-icon" />
      <p class="empty-title">暂无收藏</p>
      <p class="empty-desc">在搜索结果或播放列表中点击收藏按钮添加歌曲</p>
    </div>

    <div v-else-if="loading" class="loading-state">
      <AppIcon name="loader" :size="32" class="spinning" />
      <p>加载中...</p>
    </div>

    <div v-else class="favorites-list">
      <div
        v-for="(song, index) in favorites"
        :key="song.id || index"
        class="song-item"
        @dblclick="handlePlay(song)"
      >
        <div class="song-cover">
          <img v-if="song.coverUrl" :src="song.coverUrl" :alt="song.title" />
          <div v-else class="cover-placeholder">
            <AppIcon name="music" :size="20" />
          </div>
        </div>
        <div class="song-info">
          <div class="song-title">{{ song.title }}</div>
          <div class="song-artist">{{ song.artist || 'Unknown' }}</div>
          <div class="song-meta">
            <span v-if="song.album" class="song-album">{{ song.album }}</span>
            <span v-if="song.duration" class="song-duration">{{ formatDuration(song.duration) }}</span>
            <span v-if="song.source" class="song-source">{{ song.source }}</span>
          </div>
        </div>
        <div class="song-actions">
          <button @click.stop="handlePlay(song)" class="action-btn play-btn" title="播放">
            <AppIcon name="play" :size="16" />
          </button>
          <button @click.stop="handleAddToRoom(song)" class="action-btn add-btn" title="添加到播放列表">
            <AppIcon name="plus" :size="16" />
          </button>
          <button @click.stop="handleRemove(song)" class="action-btn remove-btn" title="取消收藏">
            <AppIcon name="trash" :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getFavorites, removeFavorite } from '../api/favorites.js'
import { formatDuration } from '../utils/format.js'
import AppIcon from '../components/AppIcon.vue'
import { usePlayerStore } from '../stores/player.js'

const props = defineProps({
  hasRoom: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['play', 'add-to-room'])

const favorites = ref([])
const loading = ref(false)
const playerStore = usePlayerStore()

async function fetchFavorites() {
  loading.value = true
  try {
    const result = await getFavorites()
    favorites.value = result.favorites || []
  } catch (error) {
    console.error('Failed to fetch favorites:', error)
  } finally {
    loading.value = false
  }
}

function handleRefresh() {
  fetchFavorites()
}

function handlePlay(song) {
  // 直接播放歌曲：设置播放列表为当前歌曲，开始播放
  playerStore.setPlaylist([song])
  playerStore.setCurrentIndex(0)
  playerStore.setPlaying(true)
}

function handleAddToRoom(song) {
  emit('add-to-room', song)
}

async function handleRemove(song) {
  if (!confirm(`确定要取消收藏 "${song.title}" 吗？`)) return

  try {
    await removeFavorite(song.id)
    favorites.value = favorites.value.filter(f => f.id !== song.id)
  } catch (error) {
    console.error('Failed to remove favorite:', error)
  }
}

onMounted(() => {
  fetchFavorites()
})
</script>

<style scoped>
.favorites-view {
  padding: 0 8px;
}

.favorites-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.favorites-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
}

.title-icon {
  color: #ef4444;
}

.favorites-count {
  padding: 2px 10px;
  background: rgba(139, 92, 246, 0.2);
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  color: #a78bfa;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 10px;
  border: none;
  background: rgba(139, 92, 246, 0.1);
  color: #a78bfa;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: rgba(139, 92, 246, 0.2);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  color: #475569;
  opacity: 0.5;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #94a3b8;
  margin: 0 0 8px 0;
}

.empty-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  color: #64748b;
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(26, 26, 36, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.08);
  border-radius: 14px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.song-item:hover {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.15);
}

.song-cover {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(139, 92, 246, 0.1);
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 15px;
  font-weight: 600;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.song-artist {
  font-size: 13px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
}

.song-album {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.song-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.song-item:hover .song-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

.play-btn:hover {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
</style>
