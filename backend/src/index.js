import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { handleJoin, handleDisconnect } from './socket/handlers.js'

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
  const urlPath = req.params[0]
  const filename = decodeURIComponent(urlPath)
  const resolvedPath = path.resolve(DOWNLOAD_DIR, filename)

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
  const filePath = decodeURIComponent(urlPath)

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

app.get('/downloads/*', (req, res) => serveDownloadFile(req, res, '/downloads'))
app.get('/api/downloads/*', (req, res) => serveDownloadFile(req, res, '/api/downloads'))
app.get('/local-music/*', (req, res) => serveLocalMusicFile(req, res))

import musicRouter from './routes/music.js'
import roomRouter from './routes/room.js'

app.use('/api/music', musicRouter)
app.use('/api/rooms', roomRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('room:join', (data) => handleJoin(io, socket, data))

  socket.on('disconnect', (reason) => handleDisconnect(io, socket, reason))
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})

export { app, server, io }
