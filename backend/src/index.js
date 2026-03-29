import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { setupSocketHandlers } from './socket/handlers.js'
import { loadRooms } from './services/roomService.js'

const DOWNLOAD_DIR = process.env.DOWNLOAD_DIR || path.join(process.cwd(), '../downloads')

const app = express()
const httpServer = createServer(app)

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173'
]

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || DEV_ORIGINS.some(o => origin.startsWith(o))) {
        callback(null, true)
      } else {
        callback(null, true)
      }
    },
    credentials: true
  }
})

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || DEV_ORIGINS.some(o => origin.startsWith(o))) {
      callback(null, true)
    } else {
      callback(null, true)
    }
  },
  credentials: true
}))
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
      console.log(`[${prefix}] File not found:`, resolvedPath)
      res.status(404).send('File not found')
    } else {
      console.error(`[${prefix}] Error:`, e)
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
app.use('/api/room', roomRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

setupSocketHandlers(io)
loadRooms()

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})
