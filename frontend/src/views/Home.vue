<template>
  <div class="home-view">
    <div class="home-bg"></div>

    <div class="main-content">
      <!-- Header -->
      <header class="header">
        <div class="header-content">
          <div class="logo">
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
            <h1 class="logo-text">SyncMusic</h1>
            <span class="logo-badge">一起听</span>
          </div>
        </div>
      </header>

      <!-- Join Room Card -->
      <div class="join-card">
        <div class="card-header">
          <h2 class="card-title">加入房间</h2>
          <p class="card-subtitle">输入房间号，与朋友一起听歌</p>
        </div>

        <form @submit.prevent="handleJoinRoom" class="join-form">
          <div class="input-group">
            <input
              v-model="joinRoomId"
              type="text"
              class="room-input"
              placeholder="输入房间号"
              maxlength="20"
              :disabled="isJoining"
            />
            <p v-if="joinError" class="error-text">{{ joinError }}</p>
          </div>

          <button
            type="submit"
            class="join-btn"
            :disabled="isJoining || joinRoomId.trim() === ''"
          >
            <span v-if="isJoining" class="btn-loading">
              <svg class="spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="30 70"/>
              </svg>
              加入中...
            </span>
            <span v-else>加入房间</span>
          </button>
        </form>
      </div>

      <!-- Room Creation Card -->
      <div class="create-card">
        <div class="card-header">
          <h2 class="card-title">创建房间</h2>
          <p class="card-subtitle">创建一个新房间，邀请朋友一起听音乐</p>
        </div>

        <form @submit.prevent="handleCreateRoom" class="create-form">
          <div class="input-group">
            <input
              v-model="roomName"
              type="text"
              class="room-input"
              placeholder="输入房间名称"
              maxlength="50"
              :disabled="isCreating"
            />
            <p v-if="error" class="error-text">{{ error }}</p>
          </div>

          <button
            type="submit"
            class="create-btn"
            :disabled="isCreating || roomName.trim() === ''"
          >
            <span v-if="isCreating" class="btn-loading">
              <svg class="spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="30 70"/>
              </svg>
              创建中...
            </span>
            <span v-else>创建房间</span>
          </button>
        </form>
      </div>

      <!-- Features -->
      <div class="features">
        <div class="feature">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3>邀请朋友</h3>
          <p>创建房间后分享链接即可邀请朋友加入</p>
        </div>
        <div class="feature">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          </div>
          <h3>同步播放</h3>
          <p>房主控制播放，所有人同步收听</p>
        </div>
        <div class="feature">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
          </div>
          <h3>音乐解析</h3>
          <p>支持QQ音乐、网易云、酷狗链接解析</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomStore } from '../stores/room'
import { createRoom, joinRoom } from '../api/room'
import { getSessionId, getUsername, setUsername } from '../utils/session'
import { connectToRoom } from '../socket/client'

const router = useRouter()
const roomStore = useRoomStore()

const roomName = ref('')
const isCreating = ref(false)
const error = ref('')

const joinRoomId = ref('')
const isJoining = ref(false)
const joinError = ref('')

async function handleCreateRoom() {
  if (roomName.value.trim() === '') {
    error.value = '请输入房间名称'
    return
  }

  isCreating.value = true
  error.value = ''

  try {
    const sessionId = getSessionId()
    const username = getUsername()
    setUsername(username)

    const result = await createRoom(roomName.value.trim(), sessionId, username)

    // Connect to socket and join room
    connectToRoom(result.roomId, username)
    roomStore.setSessionId(sessionId)

    // Navigate to room
    router.push(`/room/${result.roomId}`)
  } catch (err) {
    error.value = err.message || '创建房间失败'
  } finally {
    isCreating.value = false
  }
}

async function handleJoinRoom() {
  if (joinRoomId.value.trim() === '') {
    joinError.value = '请输入房间号'
    return
  }

  isJoining.value = true
  joinError.value = ''

  try {
    const sessionId = getSessionId()
    const username = getUsername()

    await joinRoom(joinRoomId.value.trim(), sessionId, username)

    // Connect to socket and join room
    connectToRoom(joinRoomId.value.trim(), username)
    roomStore.setSessionId(sessionId)

    // Navigate to room
    router.push(`/room/${joinRoomId.value.trim()}`)
  } catch (err) {
    joinError.value = err.message || '加入房间失败'
  } finally {
    isJoining.value = false
  }
}
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  position: relative;
}

.home-bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, #0f0f14 0%, #1a1a24 50%, #0f0f14 100%);
  z-index: -1;
}

.home-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 400px;
  background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.15) 0%, transparent 60%);
  pointer-events: none;
}

.home-bg::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 300px;
  background: radial-gradient(ellipse 60% 40% at 50% 100%, rgba(6, 182, 212, 0.08) 0%, transparent 60%);
  pointer-events: none;
}

.main-content {
  max-width: 480px;
  margin: 0 auto;
  padding: 48px 24px;
  position: relative;
  z-index: 1;
}

/* Header */
.header {
  margin-bottom: 48px;
  text-align: center;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  color: #a78bfa;
  animation: float 3s ease-in-out infinite;
}

.logo-text {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #f8fafc 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-badge {
  padding: 4px 12px;
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: #a78bfa;
}

/* Join Card */
.join-card {
  background: rgba(26, 26, 36, 0.8);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}

.join-card .card-title {
  color: #22d3ee;
}

.join-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.join-btn {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #0891b2 0%, #22d3ee 100%);
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.25s ease;
}

.join-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.3);
}

.join-btn:active:not(:disabled) {
  transform: translateY(0);
}

.join-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Create Card */
.create-card {
  background: rgba(26, 26, 36, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  backdrop-filter: blur(10px);
}

.card-header {
  text-align: center;
  margin-bottom: 28px;
}

.card-title {
  font-size: 24px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0 0 8px;
}

.card-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.room-input {
  width: 100%;
  padding: 14px 18px;
  background: rgba(15, 15, 20, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  font-size: 16px;
  color: #f8fafc;
  outline: none;
  transition: all 0.25s ease;
  box-sizing: border-box;
}

.room-input::placeholder {
  color: #475569;
}

.room-input:focus {
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.room-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-text {
  color: #ef4444;
  font-size: 13px;
  margin: 0;
}

.create-btn {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.25s ease;
}

.create-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
}

.create-btn:active:not(:disabled) {
  transform: translateY(0);
}

.create-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Features */
.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.feature {
  text-align: center;
  padding: 20px 12px;
  background: rgba(26, 26, 36, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 16px;
}

.feature-icon {
  width: 36px;
  height: 36px;
  margin: 0 auto 12px;
  color: #a78bfa;
}

.feature-icon svg {
  width: 100%;
  height: 100%;
}

.feature h3 {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0 0 6px;
}

.feature p {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
</style>
