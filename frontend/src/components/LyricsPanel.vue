<template>
  <div class="lyrics-panel">
    <div class="lyrics-header">
      <h3 class="lyrics-title">
        <AppIcon name="mic" :size="18" />
        <span>歌词</span>
      </h3>
      <button
        v-if="hasLyrics"
        @click="$emit('close')"
        class="btn-close"
        title="关闭歌词"
      >
        <AppIcon name="x" :size="16" />
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="lyrics-loading">
      <div class="loading-spinner"></div>
      <span>正在加载歌词...</span>
    </div>

    <!-- 无歌词状态 -->
    <div v-else-if="!hasLyrics" class="lyrics-empty">
      <AppIcon name="music" :size="40" class="empty-icon" />
      <p>{{ emptyMessage }}</p>
      <button
        v-if="!loading && !fetched"
        @click="$emit('fetch')"
        class="btn-fetch"
      >
        <AppIcon name="download" :size="16" />
        <span>获取歌词</span>
      </button>
    </div>

    <!-- 歌词内容 -->
    <div v-else class="lyrics-content" ref="lyricsContainer">
      <div
        class="lyrics-scroll"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="(line, index) in lyrics"
          :key="index"
          :class="['lyrics-line', { active: index === currentIndex, past: index < currentIndex }]"
          :ref="el => setLineRef(el, index)"
          @click="$emit('seek', line.time)"
        >
          {{ line.text }}
        </div>
      </div>
    </div>

    <!-- 歌词进度指示 -->
    <div v-if="hasLyrics && lyrics.length > 0" class="lyrics-progress">
      <span class="progress-current">{{ formatTime(currentTime) }}</span>
      <div class="progress-bar-container">
        <div
          class="progress-bar-fill"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
      <span class="progress-total">{{ formatTime(duration) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { getCurrentLyricIndex, formatTime } from '../utils/lrcParser.js'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  lyrics: {
    type: Array,
    default: () => []
  },
  currentTime: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  },
  fetched: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'fetch', 'seek'])

// 当前歌词行索引
const currentIndex = ref(-1)
const lyricsContainer = ref(null)
const lineRefs = ref([])

// 设置歌词行ref
function setLineRef(el, index) {
  if (el) {
    lineRefs.value[index] = el
  }
}

// 是否有歌词
const hasLyrics = computed(() => props.lyrics && props.lyrics.length > 0)

// 空消息
const emptyMessage = computed(() => {
  if (props.fetched) {
    return '该歌曲暂无歌词'
  }
  return '暂无歌词'
})

// 进度百分比
const progressPercent = computed(() => {
  if (!props.duration || props.duration === 0) return 0
  return Math.min(100, (props.currentTime / props.duration) * 100)
})

// 滚动偏移量
const offsetY = computed(() => {
  if (currentIndex.value <= 0) return 0
  if (currentIndex.value >= props.lyrics.length - 1) {
    // 最后一行：尽可能往上滚动，但保留可见性
    return -(lineRefs.value.length * 40) + (lyricsContainer.value?.clientHeight || 200) / 2
  }

  // 计算目标行的累计高度
  let targetOffset = 0
  for (let i = 0; i < currentIndex.value; i++) {
    const el = lineRefs.value[i]
    if (el) {
      targetOffset += el.offsetHeight + 12 // 行高 + 间距
    }
  }

  // 容器高度的一半减去当前行高度的一半，作为目标偏移
  const containerHeight = lyricsContainer.value?.clientHeight || 200
  const currentEl = lineRefs.value[currentIndex.value]
  const currentHeight = currentEl?.offsetHeight || 40

  return -(targetOffset - containerHeight / 2 + currentHeight / 2)
})

// 监听当前播放时间变化
watch(() => props.currentTime, (time) => {
  const newIndex = getCurrentLyricIndex(props.lyrics, time)
  if (newIndex !== currentIndex.value) {
    currentIndex.value = newIndex
  }
}, { immediate: true })

// 监听歌词变化，重置索引
watch(() => props.lyrics, () => {
  currentIndex.value = -1
  lineRefs.value = []
})

// 滚动到当前行
watch(currentIndex, async (index) => {
  if (index < 0) return
  await nextTick()
  const el = lineRefs.value[index]
  if (el && lyricsContainer.value) {
    el.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }
})
</script>

<style scoped>
.lyrics-panel {
  background: rgba(26, 26, 36, 0.9);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
}

.lyrics-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.lyrics-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
}

.btn-close {
  padding: 6px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* 加载状态 */
.lyrics-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;
  font-size: 14px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(139, 92, 246, 0.2);
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 空状态 */
.lyrics-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;
  text-align: center;
}

.empty-icon {
  opacity: 0.5;
}

.lyrics-empty p {
  font-size: 14px;
  margin: 0;
}

.btn-fetch {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.btn-fetch:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

/* 歌词内容 */
.lyrics-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.lyrics-scroll {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 60px 0;
}

.lyrics-line {
  font-size: 15px;
  color: #64748b;
  line-height: 1.6;
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 8px;
  transition: all 0.3s ease;
  text-align: center;
}

.lyrics-line.past {
  color: #475569;
  font-size: 14px;
}

.lyrics-line.active {
  color: #f8fafc;
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%);
  text-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
}

/* 进度指示 */
.lyrics-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(139, 92, 246, 0.1);
}

.progress-current,
.progress-total {
  font-size: 12px;
  color: #64748b;
  font-variant-numeric: tabular-nums;
  min-width: 36px;
}

.progress-current {
  text-align: right;
}

.progress-bar-container {
  flex: 1;
  height: 4px;
  background: rgba(139, 92, 246, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
}
</style>
