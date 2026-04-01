<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<script setup>
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f0f14 0%, #1a1a24 50%, #0f0f14 100%);
  position: relative;
}

.app-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 400px;
  background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.15) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}
</style>
