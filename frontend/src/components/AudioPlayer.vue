<template>
  <audio
    ref="audioPlayer"
    @timeupdate="onAudioTimeUpdate"
    @ended="onAudioEnded"
    @loadedmetadata="onAudioLoaded"
  />
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  autoPlay: {
    type: Boolean,
    default: false
  },
  volume: {
    type: Number,
    default: 80
  }
})

const emit = defineEmits(['timeupdate', 'ended', 'loaded'])

const audioPlayer = ref(null)

function onAudioTimeUpdate() {
  if (audioPlayer.value) {
    emit('timeupdate', audioPlayer.value.currentTime)
  }
}

function onAudioEnded() {
  emit('ended')
}

function onAudioLoaded() {
  if (audioPlayer.value) {
    emit('loaded', audioPlayer.value.duration)
  }
}

function play() {
  audioPlayer.value?.play().catch(e => {
    // 忽略 AbortError，因为可能是被新的播放请求中断
    if (e.name !== 'AbortError') {
      console.error('Play error:', e)
    }
  })
}

function pause() {
  audioPlayer.value?.pause()
}

function seek(time) {
  if (audioPlayer.value) {
    audioPlayer.value.currentTime = time
  }
}

function load(src) {
  if (audioPlayer.value) {
    audioPlayer.value.src = src
    audioPlayer.value.load()
  }
}

defineExpose({ play, pause, seek, load, audioPlayer })

watch(() => props.src, (newSrc) => {
  if (audioPlayer.value && newSrc) {
    // 如果正在播放，先暂停再加载新src，避免竞态
    const wasPlaying = !audioPlayer.value.paused
    audioPlayer.value.src = newSrc
    audioPlayer.value.load()
    // load() 是异步的，需要等元数据加载完成后再播放
    const tryPlay = () => {
      if (props.autoPlay && audioPlayer.value) {
        audioPlayer.value.play().catch(e => {
          // 忽略 AbortError，因为可能是被新的播放请求中断
          if (e.name !== 'AbortError') {
            console.error('Play error:', e)
          }
        })
      }
    }
    // 监听 loadedmetadata 确保加载完成后再播放
    audioPlayer.value.onloadedmetadata = tryPlay
    // 备用：500ms 后尝试播放（以防事件没触发）
    setTimeout(tryPlay, 500)
  }
}, { immediate: false })

// 响应 autoPlay 变化
watch(() => props.autoPlay, (autoPlay) => {
  if (!audioPlayer.value) return
  if (autoPlay) {
    audioPlayer.value.play().catch(e => {
      // 忽略 AbortError，因为可能是被新的播放请求中断
      if (e.name !== 'AbortError') {
        console.error('Play error:', e)
      }
    })
  } else {
    audioPlayer.value.pause()
  }
})

watch(() => props.volume, (newVolume) => {
  if (audioPlayer.value) {
    audioPlayer.value.volume = newVolume / 100
  }
})
</script>
