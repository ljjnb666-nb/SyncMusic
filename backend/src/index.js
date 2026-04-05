import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { handleJoin, handleDisconnect, handlePlay, handlePause, handleSeek, handleNext, handleRoomUpdate } from './socket/handlers.js'

const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || path.join(process.cwd(), '../downloads')

const app = express()
const server = createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

app.use(cors())
app.use(express.json())

function serveDownloadFile(req, res, prefix) {
  console.log(`[serveDownloadFile] ${prefix} ${req.path} params:`, req.params)
  const urlPath = req.params[0]
  if (!urlPath) {
    return res.status(400).send('Missing filename')
  }
  // 双重解码，防止文件名含 % 被浏览器二次编码后无法解析；失败时降级到单次解码
  let filename
  try {
    filename = decodeURIComponent(decodeURIComponent(urlPath))
  } catch {
    try { filename = decodeURIComponent(urlPath) } catch { filename = urlPath }
  }
  const resolvedPath = path.resolve(DOWNLOAD_DIR, filename)
  console.log(`[serveDownloadFile] filename: ${filename} resolved: ${resolvedPath} exists: ${fs.existsSync(resolvedPath)}`)

  if (!resolvedPath.startsWith(DOWNLOAD_DIR)) {
    return res.status(403).send('Forbidden')
  }

  console.log(`[${prefix}] ${req.path}`)

  const stream = fs.createReadStream(resolvedPath)
  stream.on('error', (e) => {
    if (e.code === 'ENOENT') {
      res.status(404).send('File not found')
    } else {
      res.status(500).send('Server error')
    }
  })
  stream.on('ready', () => {
    res.setHeader('Content-Type', 'audio/mpeg')
    stream.pipe(res)
  })
}

function serveLocalMusicFile(req, res) {
  const urlPath = req.params[0]
  // 双重解码，防止文件名含 % 被浏览器二次编码后无法解析；失败时降级到单次解码
  let filePath
  try {
    filePath = decodeURIComponent(decodeURIComponent(urlPath))
  } catch {
    try { filePath = decodeURIComponent(urlPath) } catch { filePath = urlPath }
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found')
  }

  const stat = fs.statSync(filePath)
  if (!stat.isFile()) {
    return res.status(403).send('Not a file')
  }

  console.log(`[local-music] ${filePath}`)

  const stream = fs.createReadStream(filePath)
  stream.on('error', (e) => {
    console.error('[local-music] Error:', e)
    res.status(500).send('Server error')
  })
  stream.on('ready', () => {
    res.setHeader('Content-Type', 'audio/mpeg')
    stream.pipe(res)
  })
}

import musicRouter from './routes/music.js'
import roomRouter from './routes/room.js'
import favoritesRouter from './routes/favorites.js'
import historyRouter from './routes/history.js'
import authRouter from './routes/auth.js'

app.use('/api/music', musicRouter)
app.use('/api/rooms', roomRouter)
app.use('/api/favorites', favoritesRouter)
app.use('/api/history', historyRouter)
app.use('/api/auth', authRouter)

// String routes with * wildcard — Express handles these without pre-decoding the
// path segment, so % in filenames works fine (frontend always encodes % to %25).
// The music router's /downloads (no trailing /) serves the file list.
app.get('/downloads/*', (req, res) => serveDownloadFile(req, res, '/downloads'))
app.get('/downloads', (req, res) => {
  // 透传到 music router 的 /downloads 列表接口
  import('./routes/music.js').then(m => m.default.handle(req, res, () => {}))
})
app.get('/api/downloads/*', (req, res) => serveDownloadFile(req, res, '/api/downloads'))
app.get('/local-music/*', (req, res) => serveLocalMusicFile(req, res))

// 捕获 Express decode 错误（路由层 decodeURIComponent 失败）
app.use((err, req, res, next) => {
  if (err instanceof URIError && err.message.includes('Failed to decode')) {
    console.warn('[decode error]', err.message)
    return res.status(400).json({ error: 'Invalid URL encoding' })
  }
  next(err)
})

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('room:join', (data) => handleJoin(io, socket, data))
  socket.on('room:update', (data) => handleRoomUpdate(io, socket, data))
  socket.on('playback:play', (data) => handlePlay(io, socket, data))
  socket.on('playback:pause', (data) => handlePause(io, socket, data))
  socket.on('playback:seek', (data) => handleSeek(io, socket, data))
  socket.on('playback:next', (data) => handleNext(io, socket, data))

  socket.on('disconnect', (reason) => handleDisconnect(io, socket, reason))
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})

export { app, server, io }
