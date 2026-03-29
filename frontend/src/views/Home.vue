<template>
  <div class="p-8 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-8">SyncMusic - 一起听</h1>

    <!-- Tab 导航 -->
    <div class="flex gap-4 mb-6 border-b border-gray-700">
      <button
        @click="activeTab = 'parse'"
        :class="['px-4 py-2', activeTab === 'parse' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400']"
      >
        解析音乐
      </button>
      <button
        @click="activeTab = 'downloads'"
        :class="['px-4 py-2', activeTab === 'downloads' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400']"
      >
        下载管理
      </button>
      <button
        @click="activeTab = 'room'"
        :class="['px-4 py-2', activeTab === 'room' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400']"
      >
        一起听
      </button>
    </div>

    <!-- 解析音乐 Tab -->
    <div v-if="activeTab === 'parse'" class="space-y-6">
      <!-- 链接输入 -->
      <div class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-xl font-bold mb-4">输入音乐链接</h2>
        <div class="flex gap-4">
          <input
            v-model="musicUrl"
            type="text"
            placeholder="输入QQ音乐/网易云/酷狗音乐链接..."
            class="flex-1 p-3 bg-gray-700 rounded text-white"
            @keyup.enter="handleParse"
          />
          <select v-model="selectedQuality" class="p-3 bg-gray-700 rounded text-white">
            <option value="standard">标准(MP3)</option>
            <option value="high">高品质(FLAC)</option>
          </select>
        </div>
        <div class="flex gap-4 mt-4">
          <button @click="handleParse" :disabled="loading.parse" class="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 btn-hover">
            {{ loading.parse ? '解析中...' : '解析' }}
          </button>
          <button @click="handleDownload" :disabled="loading.download || !parsedSong" class="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 btn-hover">
            {{ loading.download ? '下载中...' : '下载' }}
          </button>
        </div>
      </div>

      <!-- 解析结果 -->
      <div v-if="parsedSong" class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-xl font-bold mb-4">解析结果</h2>
        <div class="flex gap-6">
          <img :src="parsedSong.coverUrl" class="w-32 h-32 rounded-lg object-cover" />
          <div class="flex-1">
            <h3 class="text-2xl font-bold">{{ parsedSong.title }}</h3>
            <p class="text-gray-400 mt-1">{{ parsedSong.artist }}</p>
            <p class="text-gray-500 mt-1">{{ parsedSong.album }}</p>
            <p v-if="parsedSong.duration" class="text-gray-500 mt-1">时长: {{ formatDuration(parsedSong.duration) }}</p>
            <p v-if="parsedSong.message" class="text-yellow-400 mt-2 text-sm">{{ parsedSong.message }}</p>
          </div>
        </div>
      </div>

      <!-- 歌词显示 -->
      <div v-if="parsedSong?.lyric" class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-xl font-bold mb-4">歌词</h2>
        <pre class="text-gray-300 whitespace-pre-wrap text-sm font-mono">{{ parsedSong.lyric }}</pre>
      </div>

      <!-- 使用说明 -->
      <div class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-xl font-bold mb-4">支持的链接格式</h2>
        <ul class="text-gray-300 space-y-2 text-sm">
          <li>• 网易云音乐: https://music.163.com/song?id=347230</li>
          <li>• QQ音乐: https://y.qq.com/n/ryms/song/001Qu4vt2xurZd</li>
          <li>• 酷狗音乐: https://www.kugou.com/yy/song/detail/xxxxx</li>
        </ul>
      </div>

      <!-- 搜索音乐 -->
      <div class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-xl font-bold mb-4">搜索音乐</h2>
        <div class="flex gap-4">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="输入歌曲名或歌手..."
            class="flex-1 p-3 bg-gray-700 rounded text-white"
            @keyup.enter="searchSongs"
          />
          <button @click="searchSongs" :disabled="loading.search" class="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 btn-hover">
            {{ loading.search ? '搜索中...' : '搜索' }}
          </button>
        </div>
        <!-- 搜索结果骨架屏 -->
        <div v-if="loading.search" class="mt-4 space-y-3">
          <div v-for="i in 3" :key="i" class="animate-pulse flex items-center gap-4 p-3 bg-gray-700 rounded">
            <div class="w-12 h-12 bg-gray-600 rounded"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-600 rounded w-3/4"></div>
              <div class="h-3 bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        <!-- 搜索结果列表 -->
        <div v-else-if="searched && searchResults.length > 0" class="mt-4 space-y-2">
          <div
            v-for="song in searchResults"
            :key="song.id"
            class="flex items-center justify-between p-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-600 rounded flex items-center justify-center text-lg">
                {{ song.platform === 'kugou' ? '🐕' : song.platform === 'migu' ? '🎵' : song.platform === 'netEase' ? '☁️' : '🍹' }}
              </div>
              <div>
                <p class="font-medium">{{ song.title }}</p>
                <p class="text-gray-400 text-sm">{{ song.artist }} • {{ song.platform }}</p>
              </div>
            </div>
            <button
              v-if="roomStore.roomId"
              @click="addSearchResultToPlaylist(song)"
              class="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 transition-colors"
            >
              添加
            </button>
          </div>
        </div>
        <div v-else-if="searched && searchResults.length === 0" class="mt-4 text-gray-400 text-center py-4">
          未找到相关歌曲
        </div>
      </div>
    </div>

    <!-- 下载管理 Tab -->
    <div v-if="activeTab === 'downloads'" class="space-y-6">
      <!-- 歌单下载 -->
      <div class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-xl font-bold mb-4">QQ音乐歌单解析</h2>
        <div class="flex gap-4">
          <input
            v-model="playlistUrl"
            type="text"
            placeholder="输入QQ音乐歌单链接..."
            class="flex-1 p-3 bg-gray-700 rounded text-white"
            @keyup.enter="handleParsePlaylist"
          />
          <button @click="handleParsePlaylist" :disabled="loading.playlist" class="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 btn-hover">
            {{ loading.playlist ? '解析中...' : '解析并搜索' }}
          </button>
          <button @click="handlePlaylistDownload" :disabled="loading.playlist || !parsedPlaylist" class="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50">
            下载歌单
          </button>
          <button @click="refreshDownloads" class="px-6 py-3 bg-gray-600 rounded-lg hover:bg-gray-700">
            刷新
          </button>
        </div>
        <p v-if="playlistMessage" class="text-green-400 mt-2 text-sm">{{ playlistMessage }}</p>
      </div>

      <!-- 解析结果 - 歌单歌曲列表 -->
      <div v-if="parsedPlaylist" class="bg-gray-800 p-6 rounded-lg">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">{{ parsedPlaylist.title }} ({{ parsedPlaylist.songCount }} 首)</h2>
          <div class="flex gap-2">
            <button @click="selectAll" class="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 rounded">
              {{ selectedCount === parsedPlaylist.songCount ? '取消全选' : '全选' }}
            </button>
            <button @click="downloadSelected" :disabled="selectedCount === 0 || downloadingSelected" class="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 rounded disabled:opacity-50">
              {{ downloadingSelected ? '下载中...' : `下载选中 (${selectedCount})` }}
            </button>
            <button @click="downloadAll" :disabled="downloadingAll" class="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded disabled:opacity-50">
              {{ downloadingAll ? '下载中...' : '一键下载全部' }}
            </button>
          </div>
        </div>
        <div class="max-h-96 overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="text-gray-400 border-b border-gray-700">
              <tr>
                <th class="py-2 text-left">#</th>
                <th class="py-2 text-left">歌曲</th>
                <th class="py-2 text-left">歌手</th>
                <th class="py-2 text-left">时长</th>
                <th class="py-2 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(song, index) in parsedPlaylist.songs" :key="song.id" class="border-b border-gray-700 hover:bg-gray-700">
                <td class="py-2 text-gray-400">
                  <input type="checkbox" v-model="song.selected" class="w-4 h-4 mr-2" />
                  {{ index + 1 }}
                </td>
                <td class="py-2">{{ song.title }}</td>
                <td class="py-2 text-gray-400">{{ song.singer || '未知' }}</td>
                <td class="py-2 text-gray-400">{{ song.durationStr || '--:--' }}</td>
                <td class="py-2 flex gap-2">
                  <button v-if="song.downloading" disabled class="px-3 py-1 text-xs bg-gray-500 rounded">
                    下载中...
                  </button>
                  <button v-else-if="song.downloadStatus === 'success'" class="px-3 py-1 text-xs bg-green-600 rounded">
                    成功
                  </button>
                  <button v-else-if="song.downloadStatus === 'failed'" @click="handleDownloadSong(song)" class="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 rounded">
                    失败重试
                  </button>
                  <button v-else @click="handleDownloadSong(song)" class="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded">
                    下载
                  </button>
                  <button
                    v-if="song.downloadStatus === 'success' && roomStore.roomId"
                    @click="addToRoomPlaylist(song)"
                    class="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 rounded"
                  >
                    添加到播放列表
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 下载列表 -->
      <div class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-xl font-bold mb-4">已下载文件</h2>
        <!-- 骨架屏 -->
        <div v-if="loading.downloads" class="space-y-3">
          <div v-for="i in 3" :key="i" class="animate-pulse flex items-center gap-4 p-3 bg-gray-700 rounded">
            <div class="w-12 h-12 bg-gray-600 rounded"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-600 rounded w-3/4"></div>
              <div class="h-3 bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        <div v-else-if="downloads.length === 0" class="text-gray-400 text-center py-8">
          暂无下载文件
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="file in downloads"
            :key="file.name"
            class="flex items-center justify-between p-3 bg-gray-700 rounded hover:bg-gray-600"
          >
            <div class="flex-1">
              <p class="font-medium">{{ file.name }}</p>
              <p class="text-sm text-gray-400">{{ formatFileSize(file.size) }}</p>
            </div>
            <div class="flex gap-2">
              <button
                v-if="roomStore.roomId"
                @click="addDownloadedToPlaylist(file)"
                class="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
              >
                添加到播放列表
              </button>
              <a :href="API_BASE + file.url" download class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
                下载
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- 下载目录 -->
      <div class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-xl font-bold mb-4">下载位置</h2>
        <p class="text-gray-400 text-sm font-mono">C:\Users\LJJ2004\所有项目\SyncMusic\downloads\</p>
      </div>
    </div>

    <!-- 一起听 Tab -->
    <div v-if="activeTab === 'room'" class="space-y-6">
      <!-- 隐藏的音频播放器 -->
      <audio ref="audioPlayer" @timeupdate="onAudioTimeUpdate" @ended="onAudioEnded" @loadedmetadata="onAudioLoaded"></audio>

      <!-- 房间控制 -->
      <div class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-xl font-bold mb-4">同步房间</h2>
        <div class="flex gap-4">
          <button @click="createRoom" :disabled="roomStore.roomId" class="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 btn-hover">
            创建房间
          </button>
          <input v-model="joinRoomId" placeholder="输入房间号" class="p-3 bg-gray-700 rounded text-white" :disabled="roomStore.roomId" />
          <button @click="joinRoom" :disabled="roomStore.roomId || !joinRoomId" class="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 btn-hover">
            加入房间
          </button>
        </div>
      </div>

      <!-- 已加入房间 -->
      <div v-if="roomStore.roomId" class="bg-gray-800 p-6 rounded-lg">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-lg">房间号: <span class="text-blue-400 font-bold">{{ roomStore.roomId }}</span></p>
            <p class="text-gray-400">
              {{ roomStore.isHost ? '(房主)' : '(听众)' }}
              <span class="ml-2 text-green-400">听众: {{ roomStore.listeners.length }}</span>
            </p>
          </div>
          <button @click="leaveRoom" class="px-4 py-2 bg-red-600 rounded hover:bg-red-700">
            离开房间
          </button>
        </div>

        <!-- 房间信息 -->
        <div v-if="roomStore.isHost" class="mt-4 p-4 bg-gray-700 rounded">
          <p class="text-yellow-400">房主可以控制播放，听众会自动同步</p>
        </div>
        <div v-else class="mt-4 p-4 bg-gray-700 rounded">
          <p class="text-blue-400">跟随房主播放控制</p>
        </div>
      </div>

      <!-- 本地音乐库 (房主可用) -->
      <div v-if="roomStore.roomId && roomStore.isHost" class="bg-gray-800 p-6 rounded-lg">
        <h3 class="text-lg font-bold mb-4">本地音乐</h3>
        <!-- 文件夹路径设置 -->
        <div class="flex gap-2 mb-4">
          <input
            v-model="localMusicPath"
            type="text"
            placeholder="输入音乐文件夹路径，如 D:\Music"
            class="flex-1 p-2 bg-gray-700 rounded text-white text-sm"
          />
          <button @click="loadLocalMusic" class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 btn-hover">
            加载
          </button>
        </div>
        <!-- 导入音乐按钮 -->
        <div class="flex gap-2 mb-4">
          <button @click="importMusicFiles" class="px-4 py-2 bg-green-600 rounded hover:bg-green-700 btn-hover">
            导入音乐文件
          </button>
          <span class="text-gray-400 text-sm self-center">支持 mp3/flac/m4a</span>
        </div>
        <div v-if="localMusic.length === 0" class="text-gray-400 text-center py-4">
          暂无本地音乐，请设置路径或导入文件
        </div>
        <div v-else class="max-h-64 overflow-y-auto space-y-2">
          <div
            v-for="song in localMusic"
            :key="song.path"
            class="flex items-center justify-between p-3 bg-gray-700 rounded hover:bg-gray-600"
          >
            <div class="flex-1">
              <p class="font-medium">{{ song.title }}</p>
              <p class="text-gray-400 text-sm">{{ song.artist }}</p>
            </div>
            <button @click="addLocalToPlaylist(song)" class="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700">
              添加
            </button>
          </div>
        </div>
      </div>

      <!-- 播放器 -->
      <div v-if="roomStore.roomId" class="bg-gray-800 p-6 rounded-lg">
        <h3 class="text-lg font-bold mb-4">播放控制</h3>

        <!-- 当前播放歌曲 -->
        <div v-if="currentSong" class="flex items-center gap-4 mb-4 p-3 bg-gray-700 rounded">
          <div class="w-16 h-16 bg-gray-600 rounded flex items-center justify-center">
            <span v-if="!currentSong.coverUrl" class="text-2xl">🎵</span>
            <img v-else :src="currentSong.coverUrl" class="w-16 h-16 rounded object-cover" />
          </div>
          <div class="flex-1">
            <p class="font-bold">{{ currentSong.title }}</p>
            <p class="text-gray-400 text-sm">{{ currentSong.artist }}</p>
            <p class="text-gray-500 text-xs mt-1">
              时长: {{ currentSong.duration ? formatDuration(currentSong.duration) : '加载中...' }}
            </p>
          </div>
          <div v-if="roomStore.isHost" class="flex gap-2">
            <button @click="togglePlay" class="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700">
              {{ isPlaying ? '暂停' : '播放' }}
            </button>
            <button @click="playNextSong" class="px-4 py-3 bg-gray-600 rounded-lg hover:bg-gray-700">
              下一首
            </button>
          </div>
          <div v-else class="text-blue-400">
            {{ isPlaying ? '正在播放' : '已暂停' }}
          </div>
        </div>
        <div v-else class="text-gray-400 text-center py-4">
          播放列表为空，请添加歌曲
        </div>

        <!-- 进度条 -->
        <div v-if="currentSong && roomStore.isHost" class="mb-4">
          <input
            type="range"
            v-model="currentTime"
            :max="currentSong.duration || 100"
            @input="onSeek"
            class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-sm text-gray-400 mt-1">
            <span>{{ formatDuration(currentTime) }}</span>
            <span>{{ formatDuration(currentSong.duration || 0) }}</span>
          </div>
        </div>

        <!-- 音量控制 -->
        <div v-if="roomStore.isHost" class="flex items-center gap-4 mb-4">
          <span class="text-gray-400">音量</span>
          <input
            type="range"
            v-model="volume"
            min="0"
            max="100"
            class="w-32 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <span class="text-gray-400">{{ volume }}%</span>
        </div>

        <!-- 播放列表 -->
        <div class="mt-6">
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-bold">播放列表 ({{ playlist.length }} 首)</h4>
          </div>
          <div v-if="playlist.length === 0" class="text-gray-400 text-center py-4">
            暂无歌曲
          </div>
          <div v-else class="max-h-64 overflow-y-auto space-y-1">
            <TransitionGroup name="list" tag="div" class="space-y-1">
              <div
                v-for="(song, index) in playlist"
                :key="song.id"
                :class="[
                  'flex items-center gap-3 p-2 rounded cursor-pointer transition-colors duration-150',
                  index === currentIndex ? 'bg-blue-600' : 'hover:bg-gray-700'
                ]"
                @click="roomStore.isHost && changeSong(index)"
              >
                <span class="text-gray-400 w-6">{{ index + 1 }}</span>
                <span v-if="index === currentIndex && isPlaying" class="text-lg">🎵</span>
                <span v-else class="w-6"></span>
                <div class="flex-1">
                  <p class="font-medium">{{ song.title }}</p>
                  <p class="text-gray-400 text-sm">{{ song.artist }}</p>
                </div>
                <span v-if="roomStore.isHost" class="text-red-400 hover:text-red-300" @click.stop="removeSong(index)">
                  ✕
                </span>
              </div>
            </TransitionGroup>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast 消息 -->
    <div v-if="toast.show" :class="['fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg', toast.type === 'error' ? 'bg-red-600' : 'bg-green-600']">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, TransitionGroup } from 'vue'
import { parseMusicUrl, downloadMusic, downloadPlaylist, getDownloadList, parsePlaylist, searchMusic, browserDownload, browseFolder } from '../api/music.js'
import { io } from 'socket.io-client'

const activeTab = ref('parse')
const musicUrl = ref('')
const playlistUrl = ref('')
const parsedSong = ref(null)
const parsedPlaylist = ref(null)
const downloads = ref([])
const selectedQuality = ref('standard')
const playlistMessage = ref('')
const joinRoomId = ref('')
const localMusicPath = ref('')

const loading = ref({
  parse: false,
  download: false,
  playlist: false,
  search: false,
  downloads: false,
  localMusic: false
})
const downloadingAll = ref(false)
const downloadingSelected = ref(false)
const audioPlayer = ref(null)
const localMusic = ref([])
const searchKeyword = ref('')
const searchResults = ref([])
const searched = ref(false)

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

// WebSocket连接
const socket = io(API_BASE, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
})

// 房间会话持久化
function saveRoomSession() {
  if (roomStore.value.roomId) {
    sessionStorage.setItem('syncmusic_room', JSON.stringify({
      roomId: roomStore.value.roomId,
      isHost: roomStore.value.isHost,
      timestamp: Date.now()
    }))
  }
}

function restoreRoomSession() {
  const saved = sessionStorage.getItem('syncmusic_room')
  if (saved && socket.connected) {
    const { roomId, timestamp } = JSON.parse(saved)
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      socket.emit('rejoin-room', { roomId })
    }
  }
}

// 播放器状态
const isPlaying = ref(false)
const currentTime = ref(0)
const volume = ref(80)
const playlist = ref([])
const currentIndex = ref(-1)
const currentSong = computed(() => playlist.value[currentIndex.value] || null)

// 房间状态
const roomStore = ref({
  roomId: null,
  isHost: false,
  listeners: []
})

const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

function getAudioDuration(fileUrl) {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.src = fileUrl
    let resolved = false
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true
        audio.src = ''
        resolve(0)
      }
    }, 5000)
    audio.addEventListener('loadedmetadata', () => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeoutId)
        resolve(audio.duration || 0)
      }
    })
    audio.addEventListener('error', () => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeoutId)
        audio.src = ''
        resolve(0)
      }
    })
  })
}

function buildListenerArray(count) {
  return Array.from({ length: count }, (_, i) => `listener-${i}`)
}

const SOCKET_EVENTS = [
  'connect', 'disconnect', 'reconnect', 'room-created', 'room-joined', 'room-left',
  'listener-joined', 'listener-left', 'playlist-updated',
  'sync-play', 'sync-pause', 'sync-song-change',
  'play-state-updated', 'sync-time-update', 'error'
]

// Socket事件处理
function setupSocketListeners() {
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
    restoreRoomSession()
  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected')
  })

  socket.on('reconnect', () => {
    console.log('Socket reconnected')
    restoreRoomSession()
  })

  socket.on('room-created', ({ roomId, isHost: isRoomHost, room }) => {
    roomStore.value.roomId = roomId
    roomStore.value.isHost = true
    if (room) {
      playlist.value = room.playlist || []
      currentIndex.value = room.currentIndex || -1
    }
    saveRoomSession()
    showToast('房间已创建: ' + roomId)
  })

  socket.on('room-joined', ({ roomId, isHost: isRoomHost, room }) => {
    roomStore.value.roomId = roomId
    roomStore.value.isHost = isRoomHost
    if (room) {
      playlist.value = room.playlist || []
      currentIndex.value = room.currentIndex || -1
      isPlaying.value = room.isPlaying || false
      currentTime.value = room.currentTime || 0
    }
    saveRoomSession()
    showToast('已加入房间: ' + roomId)
  })

  socket.on('room-left', () => {
    sessionStorage.removeItem('syncmusic_room')
    roomStore.value.roomId = null
    roomStore.value.isHost = false
    roomStore.value.listeners = []
    playlist.value = []
    currentIndex.value = -1
    isPlaying.value = false
    showToast('已离开房间')
  })

  socket.on('listener-joined', ({ listenerId, listenerCount }) => {
    if (!roomStore.value.listeners.includes(listenerId)) {
      roomStore.value.listeners.push(listenerId)
    }
    roomStore.value.listeners = buildListenerArray(listenerCount)
  })

  socket.on('listener-left', ({ listenerCount }) => {
    roomStore.value.listeners = buildListenerArray(listenerCount)
  })

  socket.on('playlist-updated', ({ playlist: newPlaylist, currentIndex: newCurrentIndex }) => {
    playlist.value = newPlaylist
    currentIndex.value = newCurrentIndex
  })

  socket.on('sync-play', ({ position, currentIndex: newIndex, currentSong: song }) => {
    isPlaying.value = true
    currentTime.value = position
    if (newIndex !== undefined) {
      currentIndex.value = newIndex
    }
    if (song) {
      if (playlist.value[newIndex]) {
        playlist.value[newIndex] = song
      }
    }
  })

  socket.on('sync-pause', ({ position }) => {
    isPlaying.value = false
    currentTime.value = position
  })

  socket.on('sync-song-change', ({ currentIndex: newIndex, currentSong: song, position, isPlaying: playing }) => {
    currentIndex.value = newIndex
    currentTime.value = position || 0
    isPlaying.value = playing
    if (song && playlist.value[newIndex]) {
      playlist.value[newIndex] = song
    }
    if (roomStore.value.isHost && song?.fileUrl) {
      audioPlayer.value.src = song.fileUrl
      audioPlayer.value.load()
      audioPlayer.value.currentTime = position || 0
      if (playing) {
        audioPlayer.value.play().catch(e => console.error('Play error:', e))
      }
    }
  })

  socket.on('play-state-updated', ({ isPlaying: playing, currentTime: time }) => {
    isPlaying.value = playing
    currentTime.value = time
  })

  socket.on('sync-time-update', ({ time }) => {
    if (!roomStore.value.isHost) {
      const drift = time - currentTime.value
      if (Math.abs(drift) > 1) {
        currentTime.value = time
      }
    }
  })

  socket.on('error', ({ message }) => {
    showToast(message, 'error')
  })
}

function createRoom() {
  socket.emit('create-room')
}

function joinRoom() {
  if (!joinRoomId.value) {
    showToast('请输入房间号', 'error')
    return
  }
  socket.emit('join-room', { roomId: joinRoomId.value.toUpperCase() })
}

function leaveRoom() {
  if (roomStore.value.roomId) {
    socket.emit('leave-room', { roomId: roomStore.value.roomId })
  }
}

function togglePlay() {
  if (!roomStore.value.roomId || !roomStore.value.isHost) return

  if (isPlaying.value) {
    audioPlayer.value?.pause()
    socket.emit('pause', { roomId: roomStore.value.roomId, position: currentTime.value })
  } else {
    if (currentSong.value?.fileUrl) {
      audioPlayer.value?.play()
    }
    socket.emit('play', { roomId: roomStore.value.roomId, position: currentTime.value })
  }
}

function onAudioTimeUpdate() {
  if (audioPlayer.value) {
    currentTime.value = audioPlayer.value.currentTime
  }
}

function onAudioEnded() {
  playNextSong()
}

function onAudioLoaded() {
  if (audioPlayer.value && currentSong.value) {
    audioPlayer.value.duration = currentSong.value.duration || audioPlayer.value.duration
  }
}

function playNextSong() {
  if (!roomStore.value.roomId || !roomStore.value.isHost) return
  socket.emit('play-next', { roomId: roomStore.value.roomId })
}

function changeSong(index) {
  if (!roomStore.value.roomId || !roomStore.value.isHost) return
  socket.emit('change-song', { roomId: roomStore.value.roomId, index })

  // 加载音频文件
  const song = playlist.value[index]
  if (song?.fileUrl) {
    audioPlayer.value.src = song.fileUrl
    audioPlayer.value.load()
    if (isPlaying.value) {
      audioPlayer.value.play()
    }
  }
}

function removeSong(index) {
  if (!roomStore.value.roomId || !roomStore.value.isHost) return
  socket.emit('remove-from-playlist', { roomId: roomStore.value.roomId, index })
}

function onSeek() {
  if (!roomStore.value.roomId || !roomStore.value.isHost) return
  if (audioPlayer.value) {
    audioPlayer.value.currentTime = currentTime.value
  }
  socket.emit('sync-time', { roomId: roomStore.value.roomId, time: currentTime.value })
}

async function addToRoomPlaylist(song) {
  if (!roomStore.value.roomId) {
    showToast('请先加入房间', 'error')
    return
  }

  const fileUrl = song.url || `${API_BASE}/downloads/${encodeURIComponent(song.title)}.mp3`
  const duration = await getAudioDuration(fileUrl)

  const roomSong = {
    title: song.title || song.name,
    artist: song.singer || song.artist || 'Unknown',
    album: song.album || '',
    duration,
    coverUrl: song.cover || '',
    fileUrl
  }

  socket.emit('add-to-playlist', { roomId: roomStore.value.roomId, song: roomSong })
  showToast(duration > 0 ? '已添加到播放列表' : '已添加(时长获取失败)')
}

async function addDownloadedToPlaylist(file) {
  if (!roomStore.value.roomId) {
    showToast('请先加入房间', 'error')
    return
  }

  const nameWithoutExt = file.name.replace(/\.(mp3|flac|m4a)$/i, '')
  const parts = nameWithoutExt.split(' - ')
  const title = parts.length > 1 ? parts[1].trim() : parts[0].trim()
  const artist = parts.length > 1 ? parts[0].trim() : 'Unknown'
  const fileUrl = `${API_BASE}/api/downloads/${encodeURIComponent(file.name)}`

  const duration = await getAudioDuration(fileUrl)
  const song = { title, artist, album: '', duration, coverUrl: '', fileUrl }
  socket.emit('add-to-playlist', { roomId: roomStore.value.roomId, song })
  showToast(duration > 0 ? '已添加到播放列表' : '已添加(时长获取失败)')
}

async function searchSongs() {
  if (!searchKeyword.value.trim()) return
  loading.value.search = true
  searchResults.value = []
  searched.value = false

  try {
    const results = await searchMusic(searchKeyword.value)
    searchResults.value = results.results || []
    searched.value = true
  } catch (error) {
    showToast('搜索失败: ' + error.message, 'error')
  } finally {
    loading.value.search = false
  }
}

async function addSearchResultToPlaylist(song) {
  if (!roomStore.value.roomId) {
    showToast('请先加入房间', 'error')
    return
  }

  const duration = await getAudioDuration(song.fileUrl)
  const roomSong = {
    title: song.title,
    artist: song.singer || song.artist,
    album: '',
    duration,
    coverUrl: '',
    fileUrl: song.fileUrl
  }
  socket.emit('add-to-playlist', { roomId: roomStore.value.roomId, song: roomSong })
  showToast(duration > 0 ? '已添加到播放列表' : '已添加(时长获取失败)')
}

async function addLocalToPlaylist(song) {
  if (!roomStore.value.roomId) {
    showToast('请先加入房间', 'error')
    return
  }

  const duration = await getAudioDuration(song.fileUrl)
  const roomSong = {
    title: song.title,
    artist: song.artist,
    album: '',
    duration,
    coverUrl: '',
    fileUrl: song.fileUrl
  }
  socket.emit('add-to-playlist', { roomId: roomStore.value.roomId, song: roomSong })
  showToast(duration > 0 ? '已添加到播放列表' : '已添加(时长获取失败)')
}

async function loadLocalMusic() {
  if (!localMusicPath.value.trim()) {
    showToast('请输入文件夹路径', 'error')
    return
  }
  loading.value.localMusic = true
  try {
    const result = await browseFolder(localMusicPath.value)
    localMusic.value = result.files.map(f => {
      const nameWithoutExt = f.name.replace(/\.(mp3|flac|m4a)$/i, '')
      const parts = nameWithoutExt.split(' - ')
      return {
        path: f.path,
        title: parts.length > 1 ? parts[1].trim() : parts[0].trim(),
        artist: parts.length > 1 ? parts[0].trim() : 'Unknown',
        fileUrl: `${API_BASE}/local-music/${encodeURIComponent(f.path)}`
      }
    })
    showToast(`已加载 ${localMusic.value.length} 首歌曲`)
  } catch (error) {
    showToast('加载失败: ' + error.message, 'error')
  } finally {
    loading.value.localMusic = false
  }
}

async function importMusicFiles() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.mp3,.flac,.m4a'
  input.multiple = true
  input.onchange = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    for (const file of files) {
      const nameWithoutExt = file.name.replace(/\.(mp3|flac|m4a)$/i, '')
      const parts = nameWithoutExt.split(' - ')
      const song = {
        path: file.name,
        title: parts.length > 1 ? parts[1].trim() : parts[0].trim(),
        artist: parts.length > 1 ? parts[0].trim() : 'Unknown',
        fileUrl: URL.createObjectURL(file)
      }
      localMusic.value.push(song)
    }
    showToast(`已导入 ${files.length} 首歌曲`)
  }
  input.click()
}

// 进度更新定时器
let hostRafId = null
let lastHostTime = 0
let lastSyncTime = 0

function startHostSync() {
  lastHostTime = performance.now()
  lastSyncTime = Date.now()
  function tick() {
    if (isPlaying.value && roomStore.value.roomId && roomStore.value.isHost) {
      const now = performance.now()
      const delta = (now - lastHostTime) / 1000
      lastHostTime = now
      currentTime.value = Math.min(
        currentTime.value + delta,
        currentSong.value?.duration || 100
      )
      // 每 500ms 广播一次给听众
      if (Date.now() - lastSyncTime >= 500) {
        socket.emit('sync-time', { roomId: roomStore.value.roomId, time: currentTime.value })
        lastSyncTime = Date.now()
      }
    }
    hostRafId = requestAnimationFrame(tick)
  }
  hostRafId = requestAnimationFrame(tick)
}

function stopHostSync() {
  if (hostRafId) {
    cancelAnimationFrame(hostRafId)
    hostRafId = null
  }
}

onUnmounted(() => {
  stopHostSync()
  SOCKET_EVENTS.forEach(event => socket.off(event))
})

watch([() => roomStore.value.roomId, () => roomStore.value.isHost, isPlaying], ([roomId, isHost, playing]) => {
  if (roomId && isHost && playing) {
    startHostSync()
  } else {
    stopHostSync()
  }
})

watch(volume, (newVolume) => {
  if (audioPlayer.value) {
    audioPlayer.value.volume = newVolume / 100
  }
})

const selectedCount = computed(() => {
  if (!parsedPlaylist.value?.songs) return 0
  return parsedPlaylist.value.songs.filter(s => s.selected).length
})

function selectAll() {
  if (!parsedPlaylist.value?.songs) return
  const allSelected = selectedCount.value === parsedPlaylist.value.songs.length
  parsedPlaylist.value.songs.forEach(s => s.selected = !allSelected)
}

async function downloadAll() {
  if (!parsedPlaylist.value?.songs) return
  downloadingAll.value = true
  for (const song of parsedPlaylist.value.songs) {
    song.selected = true
    await handleDownloadSong(song)
    await new Promise(r => setTimeout(r, 500))
  }
  downloadingAll.value = false
}

async function downloadSelected() {
  if (!parsedPlaylist.value?.songs) return
  const selectedSongs = parsedPlaylist.value.songs.filter(s => s.selected)
  downloadingSelected.value = true
  for (const song of selectedSongs) {
    await handleDownloadSong(song)
    await new Promise(r => setTimeout(r, 500))
  }
  downloadingSelected.value = false
}

async function handleParse() {
  if (!musicUrl.value) {
    showToast('请输入音乐链接', 'error')
    return
  }

  loading.value.parse = true
  try {
    parsedSong.value = await parseMusicUrl(musicUrl.value)
    showToast('解析成功')
  } catch (error) {
    showToast('解析失败: ' + error.message, 'error')
  } finally {
    loading.value.parse = false
  }
}

async function handleDownload() {
  if (!parsedSong.value) {
    showToast('请先解析歌曲', 'error')
    return
  }

  loading.value.download = true
  try {
    await downloadMusic(musicUrl.value, selectedQuality.value)
    showToast('下载成功')
    await refreshDownloads()
  } catch (error) {
    showToast('下载失败: ' + error.message, 'error')
  } finally {
    loading.value.download = false
  }
}

async function handlePlaylistDownload() {
  if (!playlistUrl.value) {
    showToast('请输入歌单链接', 'error')
    return
  }

  loading.value.playlist = true
  playlistMessage.value = ''
  try {
    const result = await downloadPlaylist(playlistUrl.value, selectedQuality.value)
    playlistMessage.value = result.message
    showToast('歌单下载已开始')
  } catch (error) {
    showToast('下载失败: ' + error.message, 'error')
  } finally {
    loading.value.playlist = false
  }
}

async function handleDownloadSong(song) {
  if (song.downloading) return
  song.downloading = true
  song.downloadStatus = null
  try {
    await browserDownload(song.title, song.singer)
    song.downloadStatus = 'success'
    showToast(`下载成功: ${song.title}`)
    await refreshDownloads()
  } catch (error) {
    song.downloadStatus = 'failed'
    showToast('下载失败: ' + error.message, 'error')
  } finally {
    song.downloading = false
  }
}

async function handleParsePlaylist() {
  if (!playlistUrl.value) {
    showToast('请输入歌单链接', 'error')
    return
  }

  loading.value.playlist = true
  try {
    parsedPlaylist.value = await parsePlaylist(playlistUrl.value)
    // 初始化每首歌的选中状态和下载状态
    parsedPlaylist.value.songs.forEach(song => {
      song.selected = false
      song.downloading = false
      song.downloadStatus = null
    })
    showToast('解析成功，共 ' + parsedPlaylist.value.songCount + ' 首歌曲')
  } catch (error) {
    showToast('解析失败: ' + error.message, 'error')
  } finally {
    loading.value.playlist = false
  }
}

async function refreshDownloads() {
  loading.value.downloads = true
  try {
    downloads.value = await getDownloadList()
    // 更新本地音乐库
    localMusic.value = downloads.value.map(file => {
      const nameWithoutExt = file.name.replace(/\.(mp3|flac|m4a)$/i, '')
      const parts = nameWithoutExt.split(' - ')
      // 从路径中提取文件名并编码
      const fileName = file.url.split('/').pop()
      const encodedUrl = '/downloads/' + encodeURIComponent(fileName)
      return {
        path: file.url,
        title: parts.length > 1 ? parts[1].trim() : parts[0].trim(),
        artist: parts.length > 1 ? parts[0].trim() : 'Unknown',
        fileUrl: `${API_BASE}${encodedUrl}`
      }
    })
  } catch (error) {
    console.error('获取下载列表失败:', error)
  } finally {
    loading.value.downloads = false
  }
}

function formatDuration(seconds) {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024
    i++
  }
  return `${bytes.toFixed(1)} ${units[i]}`
}

onMounted(() => {
  setupSocketListeners()
  socket.connect()
  refreshDownloads()
})
</script>
