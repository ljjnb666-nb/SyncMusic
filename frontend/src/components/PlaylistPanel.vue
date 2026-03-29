<template>
  <div class="bg-gray-800 p-4 rounded-lg mt-4">
    <h3 class="text-lg font-bold mb-4">播放列表</h3>
    <div v-if="playlist.length === 0" class="text-gray-400">
      暂无歌曲
    </div>
    <div v-for="(song, index) in playlist" :key="index" class="flex items-center gap-4 p-2 hover:bg-gray-700 rounded">
      <span class="text-gray-400 w-8">{{ index + 1 }}</span>
      <div class="flex-1">
        <div>{{ song.title }}</div>
        <div class="text-sm text-gray-400">{{ song.artist }}</div>
      </div>
      <button @click="$emit('remove', index)" class="text-red-400">删除</button>
    </div>
  </div>
</template>

<script setup>
defineProps(['playlist'])
defineEmits(['remove'])
</script>
