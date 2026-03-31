<template>
  <div class="playlist-panel">
    <h3 class="panel-title">
      <AppIcon name="list-music" :size="18" />
      <span>播放列表</span>
    </h3>
    <div v-if="playlist.length === 0" class="empty-state">
      <AppIcon name="music" :size="32" class="empty-icon" />
      <p>暂无歌曲</p>
    </div>
    <div v-else class="song-list">
      <div
        v-for="(song, index) in playlist"
        :key="index"
        class="song-item"
      >
        <span class="song-index">{{ index + 1 }}</span>
        <div class="song-info">
          <div class="song-title">{{ song.title }}</div>
          <div class="song-artist">{{ song.artist }}</div>
        </div>
        <button @click="$emit('remove', index)" class="remove-btn">
          <AppIcon name="trash" :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue'

defineProps(['playlist'])
defineEmits(['remove'])
</script>

<style scoped>
.playlist-panel {
  background: rgba(26, 26, 36, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 16px;
  padding: 20px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 16px;
}

.empty-state {
  text-align: center;
  padding: 30px 20px;
  color: #64748b;
}

.empty-icon {
  color: #64748b;
  opacity: 0.6;
  margin-bottom: 8px;
}

.song-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  transition: background 0.2s ease;
  cursor: pointer;
}

.song-item:hover {
  background: rgba(139, 92, 246, 0.08);
}

.song-index {
  width: 24px;
  text-align: center;
  font-size: 13px;
  color: #64748b;
  flex-shrink: 0;
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 14px;
  font-weight: 500;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.remove-btn {
  padding: 6px;
  border-radius: 6px;
  color: #64748b;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
}

.remove-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.remove-btn:focus-visible {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.4);
}
</style>
