<template>
  <button
    @click.stop="handleClick"
    :class="['favorite-btn', { 'is-favorite': isFavorited, 'is-loading': loading }]"
    :title="isFavorited ? '取消收藏' : '收藏'"
  >
    <AppIcon :name="isFavorited ? 'heart' : 'heart'" :size="size" />
  </button>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { addFavorite, removeFavorite, checkFavorite } from '../api/favorites.js'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  song: {
    type: Object,
    required: true
  },
  size: {
    type: [Number, String],
    default: 20
  }
})

const emit = defineEmits(['toggle', 'update'])

const isFavorited = ref(false)
const loading = ref(false)

onMounted(() => {
  checkFavoriteStatus()
})

watch(() => props.song, () => {
  checkFavoriteStatus()
}, { deep: true })

function getSongId() {
  return props.song.id ||
    props.song.title + '_' + (props.song.artist || props.song.singer || '')
}

async function checkFavoriteStatus() {
  const songId = getSongId()
  if (!songId) return

  try {
    const result = await checkFavorite(songId)
    isFavorited.value = result.favorited
  } catch (error) {
    isFavorited.value = false
  }
}

async function handleClick() {
  if (loading.value) return

  loading.value = true
  const songId = getSongId()
  const songData = {
    ...props.song,
    id: songId
  }

  try {
    if (isFavorited.value) {
      await removeFavorite(songId)
      isFavorited.value = false
      emit('toggle', { song: songData, favorited: false })
    } else {
      await addFavorite(songData)
      isFavorited.value = true
      emit('toggle', { song: songData, favorited: true })
    }
    emit('update', isFavorited.value)
  } catch (error) {
    console.error('Favorite toggle error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.favorite-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.favorite-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.favorite-btn:focus-visible {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.4);
}

.favorite-btn.is-favorite {
  color: #ef4444;
}

.favorite-btn.is-favorite :deep(svg) {
  fill: #ef4444;
  stroke: #ef4444;
}

.favorite-btn.is-loading {
  opacity: 0.6;
  cursor: not-allowed;
}

.favorite-btn.is-loading :deep(svg) {
  animation: pulse 0.6s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
