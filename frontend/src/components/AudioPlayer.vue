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
  audioPlayer.value?.play().catch(e => console.error('Play error:', e))
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

defineExpose({ play, pause, seek, load })

watch(() => props.src, (newSrc) => {
  if (audioPlayer.value && newSrc) {
    audioPlayer.value.src = newSrc
    audioPlayer.value.load()
  }
})

watch(() => props.volume, (newVolume) => {
  if (audioPlayer.value) {
    audioPlayer.value.volume = newVolume / 100
  }
})
</script>
