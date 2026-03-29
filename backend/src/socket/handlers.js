import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  isHost,
  addToPlaylist,
  removeFromPlaylist,
  playNext,
  playPrevious,
  updatePlayState,
  getCurrentPlayState,
  handleDisconnect
} from '../services/roomService.js'

// 错误响应辅助函数
function emitError(socket, message) {
  socket.emit('error', { message })
}

// 通知房间内所有人
function emitToRoom(io, roomId, event, data) {
  io.to(roomId).emit(event, data)
}

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // 创建房间
    socket.on('create-room', () => {
      const { roomId, room } = createRoom(socket.id)
      socket.join(roomId)
      socket.emit('room-created', {
        roomId,
        isHost: true,
        room: {
          hostId: room.hostId,
          playlist: room.playlist,
          currentIndex: room.currentIndex,
          isPlaying: room.isPlaying,
          currentTime: room.currentTime
        }
      })
      console.log(`Room created: ${roomId} by ${socket.id}`)
    })

    // 加入房间
    socket.on('join-room', ({ roomId }) => {
      if (!roomId || typeof roomId !== 'string') {
        emitError(socket, 'Invalid room ID')
        return
      }

      const result = joinRoom(roomId, socket.id)
      if (!result.success) {
        emitError(socket, result.error)
        return
      }

      socket.join(roomId)

      // 返回房间状态给加入者
      socket.emit('room-joined', {
        roomId,
        isHost: result.room.isHost,
        room: result.room
      })

      // 通知房主有新听众加入
      socket.to(roomId).emit('listener-joined', {
        listenerId: socket.id,
        listenerCount: result.room.listeners.length
      })
    })

    // 离开房间
    socket.on('leave-room', ({ roomId }) => {
      if (!roomId) return

      const result = leaveRoom(roomId, socket.id)
      if (!result.success) return

      socket.leave(roomId)
      socket.emit('room-left', { roomId })

      if (result.roomDeleted) {
        emitToRoom(io, roomId, 'room-deleted', { roomId })
      } else {
        socket.to(roomId).emit('listener-left', {
          listenerId: socket.id,
          listenerCount: getRoom(roomId)?.listeners.length || 0
        })
      }
    })

    // 重新加入房间（断线重连）
    socket.on('rejoin-room', ({ roomId }) => {
      if (!roomId) return

      const room = getRoom(roomId)
      if (!room) {
        emitError(socket, '房间不存在或已过期')
        return
      }

      socket.join(roomId)

      // 以听众身份重新加入
      socket.emit('room-joined', {
        roomId,
        isHost: false,
        room: {
          hostId: room.hostId,
          playlist: room.playlist,
          currentIndex: room.currentIndex,
          isPlaying: room.isPlaying,
          currentTime: room.currentTime,
          listeners: room.listeners
        }
      })
    })

    // 添加歌曲到播放列表
    socket.on('add-to-playlist', ({ roomId, song }) => {
      const room = getRoom(roomId)
      if (!room) {
        emitError(socket, 'Room not found')
        return
      }

      // 验证是否是房间成员
      if (!room.listeners.includes(socket.id)) {
        emitError(socket, 'Not a member of this room')
        return
      }

      const result = addToPlaylist(roomId, song, socket.id)
      if (!result.success) {
        emitError(socket, result.error)
        return
      }

      // 广播播放列表更新给所有人
      emitToRoom(io, roomId, 'playlist-updated', {
        playlist: room.playlist,
        currentIndex: room.currentIndex,
        addedSong: result.song
      })
    })

    // 从播放列表移除歌曲（仅房主）
    socket.on('remove-from-playlist', ({ roomId, index }) => {
      if (!isHost(roomId, socket.id)) {
        emitError(socket, 'Only host can remove songs')
        return
      }

      const result = removeFromPlaylist(roomId, index, socket.id)
      if (!result.success) {
        emitError(socket, result.error)
        return
      }

      const room = getRoom(roomId)
      emitToRoom(io, roomId, 'playlist-updated', {
        playlist: room.playlist,
        currentIndex: room.currentIndex
      })
    })

    // 播放控制（仅房主）
    socket.on('play', ({ roomId, position }) => {
      const room = getRoom(roomId)
      if (!room) {
        emitError(socket, 'Room not found')
        return
      }

      if (!isHost(roomId, socket.id)) {
        emitError(socket, 'Only host can control playback')
        return
      }

      room.isPlaying = true
      room.currentTime = position || 0

      // 同步播放状态给所有听众
      socket.to(roomId).emit('sync-play', {
        position: room.currentTime,
        currentIndex: room.currentIndex,
        currentSong: room.playlist[room.currentIndex] || null
      })

      // 确认给房主
      socket.emit('play-state-updated', {
        isPlaying: true,
        currentTime: room.currentTime
      })
    })

    // 暂停控制（仅房主）
    socket.on('pause', ({ roomId, position }) => {
      const room = getRoom(roomId)
      if (!room) {
        emitError(socket, 'Room not found')
        return
      }

      if (!isHost(roomId, socket.id)) {
        emitError(socket, 'Only host can control playback')
        return
      }

      room.isPlaying = false
      room.currentTime = position || 0

      socket.to(roomId).emit('sync-pause', {
        position: room.currentTime
      })

      socket.emit('play-state-updated', {
        isPlaying: false,
        currentTime: room.currentTime
      })
    })

    // 切歌（仅房主）
    socket.on('change-song', ({ roomId, index }) => {
      const room = getRoom(roomId)
      if (!room) {
        emitError(socket, 'Room not found')
        return
      }

      if (!isHost(roomId, socket.id)) {
        emitError(socket, 'Only host can control playback')
        return
      }

      if (index < 0 || index >= room.playlist.length) {
        emitError(socket, 'Invalid song index')
        return
      }

      room.currentIndex = index
      room.currentTime = 0
      room.isPlaying = true

      const currentSong = room.playlist[index]

      // 广播给所有人（包括房主）
      io.to(roomId).emit('sync-song-change', {
        currentIndex: index,
        currentSong,
        position: 0,
        isPlaying: true
      })
    })

    // 播放下一首（仅房主）
    socket.on('play-next', ({ roomId }) => {
      if (!isHost(roomId, socket.id)) {
        emitError(socket, 'Only host can skip songs')
        return
      }

      const result = playNext(roomId, socket.id)
      if (!result.success) {
        emitError(socket, result.error)
        return
      }

      const room = getRoom(roomId)
      io.to(roomId).emit('sync-song-change', {
        currentIndex: result.currentIndex,
        currentSong: result.currentSong,
        position: 0,
        isPlaying: true
      })
    })

    // 播放上一首（仅房主）
    socket.on('play-previous', ({ roomId }) => {
      if (!isHost(roomId, socket.id)) {
        emitError(socket, 'Only host can skip songs')
        return
      }

      const result = playPrevious(roomId, socket.id)
      if (!result.success) {
        emitError(socket, result.error)
        return
      }

      const room = getRoom(roomId)
      io.to(roomId).emit('sync-song-change', {
        currentIndex: result.currentIndex,
        currentSong: result.currentSong,
        position: 0,
        isPlaying: true
      })
    })

    // 同步播放进度（仅房主）
    socket.on('sync-time', ({ roomId, time }) => {
      const room = getRoom(roomId)
      if (!room || !isHost(roomId, socket.id)) return

      room.currentTime = time
      socket.to(roomId).emit('sync-time-update', { time })
    })

    // 播放列表重新排序（仅房主）
    socket.on('reorder-playlist', ({ roomId, fromIndex, toIndex }) => {
      if (!isHost(roomId, socket.id)) {
        emitError(socket, 'Only host can reorder playlist')
        return
      }

      const room = getRoom(roomId)
      if (!room) {
        emitError(socket, 'Room not found')
        return
      }

      // 移动歌曲
      const [song] = room.playlist.splice(fromIndex, 1)
      room.playlist.splice(toIndex, 0, song)

      // 调整当前播放索引
      if (room.currentIndex === fromIndex) {
        room.currentIndex = toIndex
      } else if (fromIndex < room.currentIndex && toIndex >= room.currentIndex) {
        room.currentIndex--
      } else if (fromIndex > room.currentIndex && toIndex <= room.currentIndex) {
        room.currentIndex++
      }

      io.to(roomId).emit('playlist-updated', {
        playlist: room.playlist,
        currentIndex: room.currentIndex
      })
    })

    // 获取当前播放状态
    socket.on('get-play-state', ({ roomId }, callback) => {
      const room = getRoom(roomId)
      if (!room) {
        callback?.({ error: 'Room not found' })
        return
      }

      const playState = getCurrentPlayState(roomId)
      callback?.(playState)
    })

    // 断开连接
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)

      const affectedRooms = handleDisconnect(socket.id)

      for (const affected of affectedRooms) {
        if (affected.action === 'deleted') {
          io.to(affected.roomId).emit('room-deleted', { roomId: affected.roomId })
        } else if (affected.action === 'host_transfer') {
          io.to(affected.roomId).emit('host-changed', { newHost: affected.newHost })
        } else {
          io.to(affected.roomId).emit('listener-left', {
            listenerId: socket.id,
            listenerCount: affected.remainingListeners
          })
        }
      }
    })
  })
}

