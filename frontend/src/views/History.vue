<template>
  <div class="history-view">
    <div class="history-header">
      <h2 class="history-title">播放历史</h2>
      <button
        v-if="records.length > 0"
        class="clear-btn"
        @click="handleClear"
        :disabled="clearing"
      >
        <AppIcon name="trash" :size="16" />
        <span>清空</span>
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="records.length === 0" class="empty">
      <AppIcon name="music" :size="48" class="empty-icon" />
      <p>暂无播放历史</p>
    </div>

    <!-- 历史列表 -->
    <div v-else class="history-list">
      <div
        v-for="record in records"
        :key="record.id"
        class="history-item"
      >
        <div class="song-cover">
          <img
            v-if="record.coverUrl"
            :src="record.coverUrl"
            :alt="record.title"
          />
          <div v-else class="cover-placeholder">
            <AppIcon name="music" :size="24" />
          </div>
        </div>

        <div class="song-info">
          <div class="song-title">{{ record.title }}</div>
          <div class="song-artist">{{ record.artist }}</div>
          <div class="song-time">{{ formatTime(record.playedAt) }}</div>
        </div>

        <div class="song-actions">
          <button
            v-if="hasRoom"
            class="action-btn"
            @click="addToPlaylist(record)"
            title="添加到播放列表"
          >
            <AppIcon name="plus" :size="18" />
          </button>
          <button
            class="action-btn delete"
            @click="handleDelete(record.id)"
            title="删除"
          >
            <AppIcon name="trash" :size="18" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useHistoryStore } from '../stores/history.js'
import AppIcon from '../components/AppIcon.vue'

const props = defineProps({
  hasRoom: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['add-to-playlist'])

const historyStore = useHistoryStore()
const clearing = ref(false)

const records = ref([])
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  await historyStore.fetchHistory()
  records.value = historyStore.records
  loading.value = historyStore.loading
})

// 格式化时间
function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days < 7) {
    return days + '天前'
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

// 添加到播放列表
function addToPlaylist(record) {
  emit('add-to-playlist', {
    title: record.title,
    artist: record.artist,
    album: record.album,
    duration: record.duration,
    coverUrl: record.coverUrl,
    fileUrl: record.fileUrl
  })
}

// 删除记录
async function handleDelete(id) {
  await historyStore.removeRecord(id)
  records.value = historyStore.records
}

// 清空历史
async function handleClear() {
  if (!confirm('确定要清空所有播放历史吗？')) return

  clearing.value = true
  await historyStore.clear()
  records.value = []
  clearing.value = false
}
</script>

<style scoped>
.history-view {
  padding: 0 8px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.history-title {
  font-size: 20px;
  font-weight: 600;
  color: #f8fafc;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 0;
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

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 0;
  color: #64748b;
}

.empty-icon {
  color: #475569;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: rgba(26, 26, 36, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.08);
  border-radius: 12px;
  transition: all 0.2s;
}

.history-item:hover {
  background: rgba(26, 26, 36, 0.8);
  border-color: rgba(139, 92, 246, 0.15);
}

.song-cover {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
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
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2));
  color: #a78bfa;
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 15px;
  font-weight: 500;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 13px;
  color: #64748b;
  margin-top: 2px;
}

.song-time {
  font-size: 12px;
  color: #475569;
  margin-top: 4px;
}

.song-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  color: #a78bfa;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(139, 92, 246, 0.2);
}

.action-btn.delete {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.2);
}
</style>
