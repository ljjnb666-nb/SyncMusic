# SyncMusic 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个两人异地同步播放音乐的应用，支持QQ音乐/网易云/酷狗音乐链接导入

**Architecture:** 前端 Vue3 + Vite，后端 Node.js + Express + Socket.IO，音乐解析通过调用各平台API实现

**Tech Stack:** Vue3, Vite, Pinia, TailwindCSS, Node.js, Express, Socket.IO, Docker

---

## 文件结构

```
SyncMusic/
├── frontend/                         # 前端项目
│   ├── src/
│   │   ├── App.vue                   # 根组件
│   │   ├── main.js                   # 入口文件
│   │   ├── api/                      # API 调用
│   │   │   └── music.js              # 音乐解析 API
│   │   ├── components/
│   │   │   ├── MusicPlayer.vue       # 播放器组件
│   │   │   ├── SyncStatus.vue        # 同步状态显示
│   │   │   ├── RoomPanel.vue         # 房间控制面板
│   │   │   └── PlaylistPanel.vue      # 歌单面板
│   │   ├── views/
│   │   │   └── Home.vue              # 首页/主页面
│   │   ├── stores/
│   │   │   ├── player.js             # 播放器状态
│   │   │   └── room.js               # 房间状态
│   │   └── socket/
│   │       └── client.js             # Socket.IO 客户端
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/                         # 后端项目
│   ├── src/
│   │   ├── index.js                  # Express 入口 + Socket.IO
│   │   ├── routes/
│   │   │   └── music.js              # 音乐解析路由
│   │   ├── services/
│   │   │   ├── qqMusic.js            # QQ音乐解析服务
│   │   │   ├── neteaseMusic.js       # 网易云解析服务
│   │   │   └── kugouMusic.js         # 酷狗解析服务
│   │   └── socket/
│   │       └── handlers.js           # Socket.IO 事件处理
│   └── package.json
├── .env.example                     # 环境变量模板
└── docker-compose.yml               # Docker 部署
```

---

## Phase 1: 基础框架搭建

### Task 1: 初始化前端项目

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.js`
- Create: `frontend/src/App.vue`

- [ ] **Step 1: 创建 frontend/package.json**

```json
{
  "name": "syncmusic-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "pinia": "^2.1.0",
    "socket.io-client": "^4.7.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.js**

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true
      }
    }
  }
})
```

- [ ] **Step 3: 创建 TailwindCSS 配置**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: { extend: {} },
  plugins: []
}
```

- [ ] **Step 4: 创建 postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

- [ ] **Step 5: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SyncMusic - 一起听</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 6: 创建 src/main.js**

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

- [ ] **Step 7: 创建 src/style.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: 创建 src/App.vue**

```vue
<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <Home />
  </div>
</template>

<script setup>
import Home from './views/Home.vue'
</script>
```

- [ ] **Step 9: 创建 src/views/Home.vue (临时占位)**

```vue
<template>
  <div class="p-8">
    <h1 class="text-2xl">SyncMusic</h1>
    <p>基础框架搭建中...</p>
  </div>
</template>
```

- [ ] **Step 10: 初始化前端并测试**

Run: `cd frontend && npm install && npm run dev`
Expected: Vite dev server starts on port 3000

---

### Task 2: 初始化后端项目

**Files:**
- Create: `backend/package.json`
- Create: `backend/src/index.js`
- Create: `.env.example`

- [ ] **Step 1: 创建 backend/package.json**

```json
{
  "name": "syncmusic-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "socket.io": "^4.7.0",
    "cors": "^2.8.5",
    "axios": "^1.6.0"
  }
}
```

- [ ] **Step 2: 创建 .env.example**

```
# 后端端口
PORT=3001

# CORS允许的来源（开发环境）
CORS_ORIGIN=http://localhost:3000

# 生产环境设置为 *
# CORS_ORIGIN=*
```

- [ ] **Step 3: 创建 backend/src/index.js (安全版本)**

```javascript
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { randomBytes } from 'crypto'

const app = express()
const httpServer = createServer(app)

// 从环境变量读取CORS配置，默认为开发环境
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true
  }
})

app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(express.json())

// 临时路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})
```

- [ ] **Step 4: 初始化后端并测试**

Run: `cd backend && npm install && npm run dev`
Expected: Backend starts on port 3001

---

### Task 3: 前后端联调测试

- [ ] **Step 1: 验证前后端通信**

Open browser: http://localhost:3000
Check Network tab: /api/health should return 200

---

## Phase 2: 音乐解析模块

### Task 4: 后端音乐解析路由（安全版本）

**Files:**
- Modify: `backend/src/index.js`
- Create: `backend/src/routes/music.js`

- [ ] **Step 1: 创建 backend/src/routes/music.js`

```javascript
import { Router } from 'express'
import { parseQQMusic } from '../services/qqMusic.js'
import { parseNeteaseMusic } from '../services/neteaseMusic.js'
import { parseKugouMusic } from '../services/kugouMusic.js'

const router = Router()

router.post('/parse', async (req, res) => {
  try {
    const { url } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    // 安全验证：解析URL获取hostname，防止spoofing攻击
    let hostname
    try {
      hostname = new URL(url).hostname
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    let result

    // 使用hostname.endsWith()防止 "attacker.com/?qq.com" 这样的spoofing
    if (hostname.endsWith('qq.com') || hostname.endsWith('y.qq.com')) {
      result = await parseQQMusic(url)
    } else if (hostname.endsWith('music.163.com') || hostname.endsWith('y.music.163.com')) {
      result = await parseNeteaseMusic(url)
    } else if (hostname.endsWith('kugou.com')) {
      result = await parseKugouMusic(url)
    } else {
      return res.status(400).json({ error: 'Unsupported platform' })
    }

    res.json(result)
  } catch (error) {
    console.error('Parse error:', error)
    res.status(500).json({ error: 'Failed to parse music URL' })
  }
})

export default router
```

- [ ] **Step 2: 更新 backend/src/index.js 引入路由**

在 index.js 中添加:
```javascript
import musicRouter from './routes/music.js'
app.use('/api/music', musicRouter)
```

- [ ] **Step 3: 创建服务占位文件**

创建 `backend/src/services/qqMusic.js`, `neteaseMusic.js`, `kugouMusic.js`，返回临时测试数据:
```javascript
export async function parseQQMusic(url) {
  return {
    title: '测试歌曲',
    artist: '测试歌手',
    album: '测试专辑',
    duration: 240,
    audioUrl: 'https://example.com/test.mp3',
    coverUrl: 'https://example.com/cover.jpg'
  }
}
```

---

### Task 5: 前端音乐解析UI

**Files:**
- Create: `frontend/src/api/music.js`
- Modify: `frontend/src/views/Home.vue`

- [ ] **Step 1: 创建 frontend/src/api/music.js**

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

export async function parseMusicUrl(url) {
  const response = await api.post('/music/parse', { url })
  return response.data
}
```

- [ ] **Step 2: 更新 Home.vue 添加链接输入框**

```vue
<template>
  <div class="p-8 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-8">SyncMusic - 一起听</h1>

    <div class="mb-8">
      <input
        v-model="musicUrl"
        type="text"
        placeholder="输入QQ音乐/网易云/酷狗音乐链接..."
        class="w-full p-4 bg-gray-800 rounded-lg text-white"
      />
      <button
        @click="handleParse"
        class="mt-4 px-6 py-2 bg-blue-600 rounded-lg"
      >
        解析
      </button>
    </div>

    <div v-if="currentSong" class="bg-gray-800 p-4 rounded-lg">
      <h2 class="text-xl">{{ currentSong.title }}</h2>
      <p class="text-gray-400">{{ currentSong.artist }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { parseMusicUrl } from '../api/music.js'

const musicUrl = ref('')
const currentSong = ref(null)

async function handleParse() {
  try {
    const song = await parseMusicUrl(musicUrl.value)
    currentSong.value = song
  } catch (error) {
    alert('解析失败: ' + error.message)
  }
}
</script>
```

- [ ] **Step 3: 测试音乐解析**

Run: `npm run dev` on frontend
Expected: 页面显示输入框，输入链接后能解析出歌曲信息

---

## Phase 3: 同步播放模块（安全版本）

### Task 6: Socket.IO 房间系统（安全版本）

**Files:**
- Create: `backend/src/socket/handlers.js`（修复版）
- Modify: `backend/src/index.js`

- [ ] **Step 1: 创建 backend/src/socket/handlers.js`

```javascript
import { randomBytes } from 'crypto'

// 存储房间状态（内存存储，重启后丢失 - MVP阶段可接受）
const rooms = new Map()

// 房主权限验证辅助函数
function isHost(room, socketId) {
  return room && room.host === socketId
}

// 错误响应辅助函数
function emitError(socket, message) {
  socket.emit('error', { message })
}

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // 创建房间 - 使用crypto.randomBytes生成安全的房间ID
    socket.on('create-room', () => {
      const roomId = generateSecureRoomId()
      socket.join(roomId)
      rooms.set(roomId, {
        host: socket.id,
        listeners: [socket.id],
        currentSong: null,
        playing: false,
        position: 0
      })
      socket.emit('room-created', { roomId })
    })

    // 加入房间
    socket.on('join-room', ({ roomId }) => {
      if (!roomId || typeof roomId !== 'string') {
        emitError(socket, 'Invalid room ID')
        return
      }

      const room = rooms.get(roomId)
      if (!room) {
        emitError(socket, 'Room not found')
        return
      }
      socket.join(roomId)
      room.listeners.push(socket.id)
      socket.emit('room-joined', { roomId, isHost: false })
      // 通知房主有新听众
      socket.to(roomId).emit('listener-joined', { listenerId: socket.id })
    })

    // 播放状态同步 - 必须验证是房主才能控制
    socket.on('play', ({ roomId, position }) => {
      const room = rooms.get(roomId)
      if (!isHost(room, socket.id)) {
        emitError(socket, 'Only host can control playback')
        return
      }
      if (room) {
        room.playing = true
        room.position = position
        socket.to(roomId).emit('sync-play', { position })
      }
    })

    // 暂停同步 - 必须验证是房主
    socket.on('pause', ({ roomId, position }) => {
      const room = rooms.get(roomId)
      if (!isHost(room, socket.id)) {
        emitError(socket, 'Only host can control playback')
        return
      }
      if (room) {
        room.playing = false
        room.position = position
        socket.to(roomId).emit('sync-pause', { position })
      }
    })

    // 切歌同步 - 必须验证是房主
    socket.on('change-song', ({ roomId, song }) => {
      const room = rooms.get(roomId)
      if (!isHost(room, socket.id)) {
        emitError(socket, 'Only host can control playback')
        return
      }
      if (room) {
        room.currentSong = song
        room.position = 0
        io.to(roomId).emit('sync-song-change', { song })
      }
    })

    // 断开连接 - 正确清理房间状态
    socket.on('disconnect', () => {
      for (const [roomId, room] of rooms.entries()) {
        if (room.host === socket.id) {
          // 房主离开，通知所有人并删除房间
          io.to(roomId).emit('host-left')
          rooms.delete(roomId)
        } else {
          // 听众离开，从列表中移除
          room.listeners = room.listeners.filter(id => id !== socket.id)
          // 如果没有听众了，清理空房间
          if (room.listeners.length === 0) {
            rooms.delete(roomId)
          }
        }
      }
    })
  })
}

// 使用crypto.randomBytes生成安全的随机房间ID
function generateSecureRoomId() {
  return randomBytes(3).toString('hex').toUpperCase()
}
```

- [ ] **Step 2: 更新 backend/src/index.js**

```javascript
import { setupSocketHandlers } from './socket/handlers.js'

// 在 io.on('connection') 之前添加
setupSocketHandlers(io)
```

- [ ] **Step 3: 创建 frontend/src/socket/client.js**

```javascript
import { io } from 'socket.io-client'

const socket = io({
  autoConnect: false
})

export default socket
```

- [ ] **Step 4: 创建 frontend/src/stores/room.js**

```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRoomStore = defineStore('room', () => {
  const roomId = ref(null)
  const isHost = ref(false)
  const listeners = ref([])

  return { roomId, isHost, listeners }
})
```

- [ ] **Step 5: 更新 Home.vue 添加房间功能（修复版）**

```vue
<template>
  <div class="p-8 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-8">SyncMusic - 一起听</h1>

    <!-- 房间控制 -->
    <div class="mb-8 flex gap-4">
      <button @click="createRoom" class="px-6 py-2 bg-green-600 rounded-lg">
        创建房间
      </button>
      <input v-model="joinRoomId" placeholder="输入房间号" class="p-2 bg-gray-800 rounded" />
      <button @click="joinRoom" class="px-6 py-2 bg-blue-600 rounded-lg">
        加入房间
      </button>
    </div>

    <div v-if="roomStore.roomId" class="mb-4 text-lg">
      房间号: {{ roomStore.roomId }} {{ roomStore.isHost ? '(房主)' : '(听众)' }}
    </div>

    <!-- 音乐输入 -->
    <div class="mb-8">
      <input
        v-model="musicUrl"
        type="text"
        placeholder="输入QQ音乐/网易云/酷狗音乐链接..."
        class="w-full p-4 bg-gray-800 rounded-lg"
      />
      <button @click="handleParse" class="mt-4 px-6 py-2 bg-blue-600 rounded-lg">
        解析
      </button>
    </div>

    <!-- 当前歌曲 -->
    <div v-if="currentSong" class="bg-gray-800 p-4 rounded-lg">
      <h2 class="text-xl">{{ currentSong.title }}</h2>
      <p class="text-gray-400">{{ currentSong.artist }}</p>
      <audio ref="audioEl" :src="currentSong.audioUrl" @timeupdate="onTimeUpdate" />
      <div class="mt-4">
        <button @click="togglePlay" class="px-6 py-2 bg-purple-600 rounded-lg">
          {{ isPlaying ? '暂停' : '播放' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onUnmounted } from 'vue'
import socket from '../socket/client.js'
import { useRoomStore } from '../stores/room.js'
import { parseMusicUrl } from '../api/music.js'

const audioEl = ref(null)
const musicUrl = ref('')
const currentSong = ref(null)
const isPlaying = ref(false)
const joinRoomId = ref('')

const roomStore = useRoomStore()
// 使用 storeToRefs 保持响应性
const { roomId, isHost } = storeToRefs(roomStore)

socket.connect()

// 组件卸载时断开socket连接
onUnmounted(() => {
  socket.disconnect()
})

socket.on('room-created', ({ roomId: id }) => {
  roomStore.roomId = id
  roomStore.isHost = true
})

socket.on('room-joined', ({ roomId: id }) => {
  roomStore.roomId = id
  roomStore.isHost = false
})

socket.on('sync-play', ({ position }) => {
  if (audioEl.value) {
    audioEl.value.currentTime = position
    audioEl.value.play()
    isPlaying.value = true
  }
})

socket.on('sync-pause', ({ position }) => {
  if (audioEl.value) {
    audioEl.value.pause()
    isPlaying.value = false
  }
})

socket.on('sync-song-change', ({ song }) => {
  currentSong.value = song
})

socket.on('error', ({ message }) => {
  alert('错误: ' + message)
})

function createRoom() {
  socket.emit('create-room')
}

function joinRoom() {
  socket.emit('join-room', { roomId: joinRoomId.value })
}

async function handleParse() {
  try {
    const song = await parseMusicUrl(musicUrl.value)
    currentSong.value = song
    if (roomStore.roomId) {
      socket.emit('change-song', { roomId: roomStore.roomId, song })
    }
  } catch (error) {
    alert('解析失败: ' + error.message)
  }
}

function togglePlay() {
  if (!currentSong.value) return
  if (isPlaying.value) {
    audioEl.value?.pause()
    if (roomStore.roomId) {
      socket.emit('pause', { roomId: roomStore.roomId, position: audioEl.value?.currentTime })
    }
  } else {
    audioEl.value?.play()
    if (roomStore.roomId) {
      socket.emit('play', { roomId: roomStore.roomId, position: audioEl.value?.currentTime })
    }
  }
  isPlaying.value = !isPlaying.value
}

function onTimeUpdate() {
  // 可选：同步进度
}
</script>
```

---

## Phase 4: 歌单管理

### Task 7: 歌单功能

**Files:**
- Create: `frontend/src/components/PlaylistPanel.vue`
- Modify: `frontend/src/views/Home.vue`
- Modify: `frontend/src/stores/player.js`

- [ ] **Step 1: 创建 player store**

```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePlayerStore = defineStore('player', () => {
  const playlist = ref([])
  const currentIndex = ref(-1)

  function addSong(song) {
    playlist.value.push(song)
    if (currentIndex.value === -1) {
      currentIndex.value = 0
    }
  }

  function removeSong(index) {
    playlist.value.splice(index, 1)
    if (index < currentIndex.value) {
      currentIndex.value--
    }
  }

  return { playlist, currentIndex, addSong, removeSong }
})
```

- [ ] **Step 2: 创建 PlaylistPanel.vue**

```vue
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
```

- [ ] **Step 3: 更新 Home.vue 集成歌单**

---

## Phase 5: Docker 部署

### Task 8: Docker 配置

**Files:**
- Create: `frontend/Dockerfile`
- Create: `backend/Dockerfile`
- Create: `docker-compose.yml`
- Create: `frontend/nginx.conf`

- [ ] **Step 1: 创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - CORS_ORIGIN=http://localhost:3000
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

- [ ] **Step 2: 创建 backend/Dockerfile**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

- [ ] **Step 3: 创建 frontend/Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 4: 创建 frontend/nginx.conf**

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://backend:3001;
  }

  location /socket.io {
    proxy_pass http://backend:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

- [ ] **Step 5: 本地 Docker 测试**

Run: `docker-compose up --build`
Expected: 前后端服务启动成功

---

## 验收标准检查

- [ ] 两个用户可以同时访问同一房间
- [ ] 房主播放/暂停/切歌，听众自动同步
- [ ] 可以导入QQ音乐/网易云/酷狗音乐歌曲链接
- [ ] 播放进度同步误差 < 1秒
- [ ] 本地开发正常运行
- [ ] Docker 部署成功

---

## 安全修复说明

本计划已修复以下安全问题：

1. **URL验证** - 使用 `new URL(url).hostname.endsWith()` 替代 `url.includes()` 防止spoofing攻击
2. **房间ID生成** - 使用 `crypto.randomBytes()` 替代 `Math.random()` 防止可预测的房间ID
3. **CORS配置** - 使用环境变量 `CORS_ORIGIN` 替代硬编码
4. **房主权限验证** - 所有播放控制事件都验证socket.id是否与room.host匹配
5. **Pinia响应性** - 使用 `storeToRefs()` 保持store属性的响应性
6. **资源清理** - 添加 `onUnmounted` 断开socket连接
7. **输入验证** - 添加roomId类型检查
8. **空房间清理** - 听众全离开后删除空房间
