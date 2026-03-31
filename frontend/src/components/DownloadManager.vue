<template>
  <div class="download-manager">
    <!-- 已下载文件卡片 -->
    <div class="card mb-6">
      <div class="card-header">
        <h2 class="section-title">
          <AppIcon name="download" :size="20" class="section-icon" />
          已下载文件
        </h2>
      </div>

      <!-- 骨架屏 -->
      <div v-if="loadingDownloads" class="download-list">
        <div v-for="i in 3" :key="i" class="download-item skeleton-item">
          <div class="skeleton" style="width: 48px; height: 48px; border-radius: 12px;"></div>
          <div class="skeleton-text">
            <div class="skeleton" style="width: 60%; height: 16px;"></div>
            <div class="skeleton" style="width: 30%; height: 14px; margin-top: 8px;"></div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="downloads.length === 0" class="empty-state">
        <AppIcon name="folder-open" :size="48" class="empty-icon" />
        <p>暂无下载文件</p>
      </div>

      <!-- 下载列表 -->
      <div v-else class="download-list">
        <div
          v-for="file in downloads"
          :key="file.name"
          class="download-item"
        >
          <div class="file-icon">
            <AppIcon name="file-audio" :size="20" />
          </div>
          <div class="file-info">
            <p class="file-name">{{ file.name }}</p>
            <p class="file-size">{{ formatFileSize(file.size) }}</p>
          </div>
          <div class="file-actions">
            <button
              @click="$emit('add-downloaded-to-playlist', file)"
              class="btn btn-secondary btn-sm"
            >
              <AppIcon name="plus" :size="14" />
              <span>添加</span>
            </button>
            <a :href="file.url" download class="btn btn-primary btn-sm">
              <AppIcon name="download" :size="14" />
              <span>下载</span>
            </a>
          </div>
        </div>
      </div>

      <button @click="$emit('refresh')" class="btn btn-secondary mt-4">
        <AppIcon name="refresh-cw" :size="16" />
        <span>刷新列表</span>
      </button>
    </div>

    <!-- 下载目录设置卡片 -->
    <div class="card">
      <h2 class="section-title">
        <AppIcon name="settings" :size="20" class="section-icon" />
        下载位置
      </h2>
      <div class="input-group">
        <input
          :value="downloadDir"
          @input="updateDir($event.target.value)"
          type="text"
          placeholder="输入下载目录路径..."
          class="input input-mono"
        />
        <button
          @click="$emit('update-download-dir', localDir)"
          :disabled="settingDir"
          class="btn btn-primary"
        >
          <AppIcon v-if="settingDir" name="loader" :size="16" class="animate-spin" />
          <template v-else>
            <AppIcon name="save" :size="16" />
            <span>设置</span>
          </template>
        </button>
      </div>
      <p class="hint-text">
        💡 支持绝对路径或相对路径（相对于项目根目录）
      </p>
      <p v-if="dirMessage" :class="['message', dirMessage.type === 'error' ? 'message-error' : 'message-success']">
        {{ dirMessage.text }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { formatFileSize } from '../utils/format.js'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  downloads: {
    type: Array,
    default: () => []
  },
  loadingDownloads: Boolean,
  downloadDir: {
    type: String,
    default: ''
  },
  settingDir: Boolean,
  dirMessage: Object
})

const emit = defineEmits([
  'refresh', 'add-downloaded-to-playlist', 'update-download-dir'
])

const localDir = ref('')

watch(() => props.downloadDir, (val) => {
  localDir.value = val
}, { immediate: true })

function updateDir(val) {
  localDir.value = val
}
</script>

<style scoped>
.download-manager {
  animation: fadeIn 0.3s ease;
}

.mb-6 {
  margin-bottom: 24px;
}

.mt-4 {
  margin-top: 16px;
}

/* 区域标题 */
.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 20px;
}

.section-icon {
  font-size: 20px;
}

.subsection-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 12px;
}

/* 当前播放 */
.now-playing {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(139, 92, 246, 0.08);
  border-radius: 12px;
  margin-bottom: 16px;
}

.cover-wrapper {
  flex-shrink: 0;
}

.cover-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.cover-placeholder.is-playing {
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.now-info {
  flex: 1;
  min-width: 0;
}

.now-title {
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.now-artist {
  font-size: 13px;
  color: #a78bfa;
  margin-top: 4px;
}

.play-controls {
  display: flex;
  gap: 8px;
}

.play-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 进度条 */
.progress-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.time-label {
  font-size: 12px;
  color: #64748b;
  min-width: 40px;
}

.progress-bar {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: rgba(139, 92, 246, 0.2);
  border-radius: 3px;
  cursor: pointer;
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
  cursor: pointer;
}

/* 播放列表 */
.playlist-section {
  margin-top: 16px;
}

.count {
  font-weight: 400;
  color: #64748b;
}

.empty-playlist {
  text-align: center;
  padding: 20px;
  color: #64748b;
  font-size: 14px;
}

.playlist {
  max-height: 250px;
  overflow-y: auto;
  padding-right: 4px;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(139, 92, 246, 0.03);
  border: 1px solid transparent;
  border-radius: 8px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.playlist-item:hover {
  background: rgba(139, 92, 246, 0.1);
}

.playlist-item.active {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
}

.playlist-index {
  width: 24px;
  text-align: center;
  font-size: 13px;
  color: #64748b;
}

.playing-icon {
  color: #a78bfa;
  animation: pulse 1s ease-in-out infinite;
}

.playlist-info {
  flex: 1;
  min-width: 0;
}

.playlist-title-text {
  font-size: 14px;
  font-weight: 500;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-artist {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.remove-btn {
  padding: 4px 8px;
  color: #64748b;
  border-radius: 4px;
  transition: all 0.2s;
}

.remove-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* 本地音乐列表 */
.music-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

.music-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(139, 92, 246, 0.03);
  border: 1px solid transparent;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.music-item:hover {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.15);
}

.music-info {
  flex: 1;
  min-width: 0;
}

.music-title {
  font-size: 14px;
  font-weight: 500;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-artist {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

/* 下载列表 */
.download-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.download-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid transparent;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.download-item:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.2);
}

.skeleton-item {
  background: rgba(26, 26, 36, 0.6);
}

.skeleton-text {
  flex: 1;
}

.file-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a78bfa;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 按钮 */
.btn {
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  outline: none;
}

.btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.4);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(139, 92, 246, 0.4);
}

.btn-secondary {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.3);
}

.btn-sm {
  padding: 8px 14px;
  font-size: 13px;
}

/* 输入组 */
.input-group {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.import-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.input {
  flex: 1;
  padding: 14px 18px;
  font-size: 15px;
}

.input-mono {
  font-family: 'JetBrains Mono', monospace;
}

/* 提示文本 */
.hint-text {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

/* 消息 */
.message {
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  margin-top: 12px;
}

.message-success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.message-error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

/* 卡片 */
.card {
  background: rgba(26, 26, 36, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 20px;
  padding: 28px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.card:hover {
  border-color: rgba(139, 92, 246, 0.2);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(139, 92, 246, 0.1);
}

.page-info {
  font-size: 13px;
  color: #64748b;
  min-width: 50px;
  text-align: center;
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
</style>
