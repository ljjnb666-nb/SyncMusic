<template>
  <div class="user-avatar" :style="{ width: size + 'px', height: size + 'px' }">
    <img
      v-if="user?.avatar"
      :src="user.avatar"
      :alt="user.username"
      class="avatar-img"
    />
    <span v-else class="avatar-placeholder">
      {{ displayInitial }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  user: {
    type: Object,
    default: null
  },
  size: {
    type: Number,
    default: 40
  }
})

const displayInitial = computed(() => {
  if (!props.user?.username) return '?'
  return props.user.username.charAt(0).toUpperCase()
})
</script>

<style scoped>
.user-avatar {
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(139, 92, 246, 0.3);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: calc(var(--size, 40px) * 0.4);
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  user-select: none;
}
</style>
