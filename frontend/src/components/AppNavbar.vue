<template>
  <nav class="app-navbar">
    <div class="navbar-content">
      <!-- Logo -->
      <router-link to="/" class="navbar-logo">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
        <span class="logo-text">SyncMusic</span>
      </router-link>

      <!-- Navigation Links -->
      <div class="navbar-links">
        <router-link to="/" class="nav-link" :class="{ active: $route.name === 'home' }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="10 8 16 12 10 16 10 8"/>
          </svg>
          <span>发现</span>
        </router-link>
        <router-link to="/search" class="nav-link" :class="{ active: $route.name === 'search' }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span>搜索</span>
        </router-link>
        <router-link to="/favorites" class="nav-link" :class="{ active: $route.name === 'favorites' }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>收藏</span>
        </router-link>
        <router-link to="/history" class="nav-link" :class="{ active: $route.name === 'history' }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>历史</span>
        </router-link>
        <router-link to="/playlist" class="nav-link" :class="{ active: $route.name === 'playlist' }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          <span>歌单</span>
        </router-link>
        <router-link to="/downloads" class="nav-link" :class="{ active: $route.name === 'downloads' }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>下载</span>
        </router-link>
      </div>

      <!-- Room Button -->
      <div class="navbar-actions">
        <button @click="showRoomModal = true" class="room-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>一起听</span>
        </button>
      </div>
    </div>
  </nav>

  <!-- Room Modal -->
  <div v-if="showRoomModal" class="modal-overlay" @click.self="showRoomModal = false">
    <div class="room-modal">
      <h3>一起听音乐</h3>
      <p>创建或加入房间，与朋友同步听歌</p>

      <div class="modal-section">
        <h4>创建房间</h4>
        <div class="input-group">
          <input
            v-model="roomName"
            type="text"
            placeholder="输入房间名称"
            @keyup.enter="handleCreateRoom"
          />
          <button @click="handleCreateRoom" :disabled="isCreating || !roomName.trim()">
            {{ isCreating ? '创建中...' : '创建' }}
          </button>
        </div>
      </div>

      <div class="modal-divider">
        <span>或</span>
      </div>

      <div class="modal-section">
        <h4>加入房间</h4>
        <div class="input-group">
          <input
            v-model="joinRoomId"
            type="text"
            placeholder="输入房间号"
            @keyup.enter="handleJoinRoom"
          />
          <button @click="handleJoinRoom" :disabled="isJoining || !joinRoomId.trim()">
            {{ isJoining ? '加入中...' : '加入' }}
          </button>
        </div>
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>

      <button @click="showRoomModal = false" class="close-btn">关闭</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomStore } from '../stores/room'
import { usePlayerStore } from '../stores/player'
import { createRoom as apiCreateRoom, joinRoom as apiJoinRoom } from '../api/room'
import { getSessionId, getUsername, setUsername } from '../utils/session'
import { connectToRoom } from '../socket/client'

const router = useRouter()
const roomStore = useRoomStore()
const playerStore = usePlayerStore()

const showRoomModal = ref(false)
const roomName = ref('')
const joinRoomId = ref('')
const isCreating = ref(false)
const isJoining = ref(false)
const error = ref('')

async function handleCreateRoom() {
  if (!roomName.value.trim()) return
  isCreating.value = true
  error.value = ''
  try {
    const sessionId = getSessionId()
    const username = getUsername()
    setUsername(username)
    const result = await apiCreateRoom(roomName.value.trim(), sessionId, username)
    connectToRoom(result.roomId, username)
    roomStore.setSessionId(sessionId)
    showRoomModal.value = false
    router.push(`/room/${result.roomId}`)
  } catch (err) {
    error.value = err.message || '创建房间失败'
  } finally {
    isCreating.value = false
  }
}

async function handleJoinRoom() {
  if (!joinRoomId.value.trim()) return
  isJoining.value = true
  error.value = ''
  try {
    const sessionId = getSessionId()
    const username = getUsername()
    setUsername(username)
    await apiJoinRoom(joinRoomId.value.trim(), sessionId, username)
    connectToRoom(joinRoomId.value.trim(), username)
    roomStore.setSessionId(sessionId)
    showRoomModal.value = false
    router.push(`/room/${joinRoomId.value.trim()}`)
  } catch (err) {
    error.value = err.message || '加入房间失败'
  } finally {
    isJoining.value = false
  }
}
</script>

<style scoped>
.app-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(15, 15, 20, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  z-index: 100;
}

.navbar-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 32px;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #a78bfa;
}

.logo-icon {
  width: 28px;
  height: 28px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #f8fafc 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.navbar-links {
  display: flex;
  gap: 8px;
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  background: none;
  border: none;
  cursor: pointer;
}

.nav-link:hover {
  color: #f8fafc;
  background: rgba(139, 92, 246, 0.1);
}

.nav-link.active {
  color: #a78bfa;
  background: rgba(139, 92, 246, 0.15);
}

.navbar-actions {
  display: flex;
  gap: 12px;
}

.room-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.room-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

/* Search Panel */
.search-panel {
  position: fixed;
  top: 70px;
  right: 24px;
  width: 420px;
  max-height: 80vh;
  background: rgba(26, 26, 36, 0.98);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 16px;
  padding: 20px;
  z-index: 200;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.search-header {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  padding: 10px 14px;
  background: rgba(15, 15, 20, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  color: #f8fafc;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.5);
}

.search-btn {
  padding: 10px 16px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-search {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
}

.close-search:hover {
  background: rgba(139, 92, 246, 0.1);
  color: #f8fafc;
}

/* Search Results */
.search-results {
  margin-bottom: 20px;
  max-height: 240px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(139, 92, 246, 0.05);
  border-radius: 8px;
  margin-bottom: 6px;
  transition: background 0.2s;
}

.search-result-item:hover {
  background: rgba(139, 92, 246, 0.1);
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
  color: #f8fafc;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-artist {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.result-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(139, 92, 246, 0.1);
  border: none;
  border-radius: 6px;
  color: #a78bfa;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(139, 92, 246, 0.2);
}

/* URL Parse Section */
.url-parse-section {
  border-top: 1px solid rgba(139, 92, 246, 0.1);
  padding-top: 16px;
  margin-top: 8px;
}

.url-input-row,
.playlist-input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.url-input {
  flex: 1;
  padding: 10px 14px;
  background: rgba(15, 15, 20, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  color: #f8fafc;
  font-size: 14px;
}

.url-input:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.5);
}

.parse-btn {
  padding: 10px 16px;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.parse-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Parsed Result */
.parsed-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 10px;
  margin-bottom: 12px;
}

.parsed-info {
  flex: 1;
  min-width: 0;
}

.parsed-title {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.parsed-artist {
  font-size: 12px;
  color: #a78bfa;
  margin: 0;
}

/* Playlist Section */
.playlist-parse-section {
  border-top: 1px solid rgba(139, 92, 246, 0.1);
  padding-top: 16px;
  margin-top: 8px;
}

.playlist-result {
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 10px;
  padding: 12px;
}

.playlist-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.playlist-name {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
}

.playlist-count {
  font-size: 12px;
  color: #64748b;
}

.add-all-btn {
  margin-left: auto;
  padding: 4px 10px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 12px;
  cursor: pointer;
}

.playlist-songs {
  max-height: 160px;
  overflow-y: auto;
}

.playlist-song-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(139, 92, 246, 0.05);
}

.playlist-song-item:last-child {
  border-bottom: none;
}

.playlist-song-item .song-title {
  flex: 1;
  font-size: 13px;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-song-item .song-singer {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

.playlist-song-item .add-btn {
  width: 24px;
  height: 24px;
  background: rgba(139, 92, 246, 0.15);
  border: none;
  border-radius: 4px;
  color: #a78bfa;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.playlist-song-item .add-btn:hover {
  background: rgba(139, 92, 246, 0.25);
}

.more-songs {
  font-size: 12px;
  color: #64748b;
  text-align: center;
  margin: 8px 0 0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.room-modal {
  background: #1a1a24;
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 16px;
  padding: 32px;
  width: 400px;
  max-width: 90vw;
}

.room-modal h3 {
  color: #f8fafc;
  font-size: 20px;
  margin: 0 0 8px;
}

.room-modal > p {
  color: #64748b;
  font-size: 14px;
  margin: 0 0 24px;
}

.modal-section h4 {
  color: #94a3b8;
  font-size: 13px;
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-group {
  display: flex;
  gap: 8px;
}

.input-group input {
  flex: 1;
  padding: 10px 14px;
  background: rgba(15, 15, 20, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  color: #f8fafc;
  font-size: 14px;
}

.input-group input:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.5);
}

.input-group button {
  padding: 10px 20px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.input-group button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: #475569;
  font-size: 12px;
}

.modal-divider::before,
.modal-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(139, 92, 246, 0.2);
}

.modal-divider span {
  padding: 0 16px;
}

.error-text {
  color: #ef4444;
  font-size: 13px;
  margin: 16px 0;
}

.close-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  margin-top: 16px;
}

.close-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  color: #f8fafc;
}
</style>
