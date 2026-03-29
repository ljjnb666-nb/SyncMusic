import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * QQ音乐解析服务
 */

function extractSongId(url) {
  // 歌曲链接: y.qq.com/n/ryms/song/001Qu4vt2xurZd
  const songMatch = url.match(/y\.qq\.com.*song\/([a-zA-Z0-9]+)/)
  if (songMatch) return { type: 'song', id: songMatch[1] }

  // 歌单链接: y.qq.com/n/ryqq_v2/playlist/4090592756
  const playlistMatch = url.match(/y\.qq\.com.*playlist\/(\d+)/)
  if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] }

  // 直接输入songmid
  if (/^[a-zA-Z0-9]+$/.test(url.trim())) {
    return { type: 'song', id: url.trim() }
  }

  return null
}

/**
 * 解析QQ音乐歌单，获取所有歌曲信息
 * 使用yt-dlp提取歌单基本信息
 */
export async function parseQQMusicPlaylist(url) {
  // 支持新旧两种URL格式
  const playlistMatch = url.match(/playlist\/(\d+)/)
  if (!playlistMatch) {
    throw new Error('无法解析歌单链接')
  }
  const playlistId = playlistMatch[1]

  // 转换QQ音乐新URL格式为yt-dlp支持的旧格式
  let ytDlpUrl = url.replace('/n/ryqq_v2/playlist/', '/n/ryqq/playlist/')

  try {
    // 使用yt-dlp提取歌单信息
    const cookieFile = path.join(__dirname, '../../../cookies.txt')
    let cookieArg = ''
    if (fs.existsSync(cookieFile)) {
      cookieArg = `--cookies "${cookieFile}"`
    }

    const { stdout } = await execAsync(
      `yt-dlp --flat-playlist --dump-json ${cookieArg} "${ytDlpUrl}"`,
      { timeout: 60000 }
    )

    const basicSongs = []
    let playlistTitle = '未知歌单'

    for (const line of stdout.split('\n').filter(l => l.trim())) {
      try {
        const data = JSON.parse(line)
        if (!playlistTitle || playlistTitle === '未知歌单') {
          playlistTitle = data.playlist_title || '未知歌单'
        }
        basicSongs.push({
          id: data.id || '',
          mid: data.id || '',
          title: data.title || '未知歌曲',
          url: data.url || data.original_url || `https://y.qq.com/n/ryqq/songDetail/${data.id}`
        })
      } catch (e) {
        // 忽略解析错误
      }
    }

    // 并发获取所有歌曲详情（限制并发数为10）
    const songs = await fetchSongsDetail(basicSongs)

    return {
      id: playlistId,
      title: playlistTitle,
      coverUrl: '',
      creator: '',
      songCount: songs.length,
      songs
    }
  } catch (error) {
    console.error('QQ playlist parse error:', error.message)
    throw new Error('解析歌单失败: ' + error.message)
  }
}

/**
 * 批量获取歌曲详情（并发控制）
 */
async function fetchSongsDetail(basicSongs) {
  const results = []
  const batchSize = 10

  for (let i = 0; i < basicSongs.length; i += batchSize) {
    const batch = basicSongs.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(song => fetchSingleSongDetail(song))
    )
    results.push(...batchResults)

    // 每批间隔100ms，避免请求过快
    if (i + batchSize < basicSongs.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return results
}

/**
 * 获取单首歌详情
 */
async function fetchSingleSongDetail(song) {
  try {
    const searchUrl = `https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg?songmid=${song.id}&format=json`

    const response = await axios.get(searchUrl, {
      headers: {
        'Referer': 'https://y.qq.com/',
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 10000
    })

    if (response.data && response.data.data && response.data.data[0]) {
      const data = response.data.data[0]
      return {
        id: song.id,
        mid: song.mid,
        title: song.title,
        singer: data.singer?.map(s => s.name).join(', ') || '未知歌手',
        album: data.album?.name || '',
        duration: data.interval || 0,
        durationStr: formatDuration(data.interval || 0),
        url: song.url
      }
    }
  } catch (e) {
    console.error('fetchSingleSongDetail error:', e.message)
  }

  // 失败时返回基本信息
  return {
    id: song.id,
    mid: song.mid,
    title: song.title,
    singer: '未知歌手',
    album: '',
    duration: 0,
    durationStr: '--:--',
    url: song.url
  }
}

/**
 * 获取歌曲详情（用于刷新单首歌的详细信息）
 */
export async function getQQSongDetail(songId) {
  try {
    const searchUrl = `https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg?songmid=${songId}&format=json`

    const response = await axios.get(searchUrl, {
      headers: {
        'Referer': 'https://y.qq.com/',
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 15000
    })

    if (response.data && response.data.data && response.data.data[0]) {
      const song = response.data.data[0]
      return {
        singer: song.singer?.map(s => s.name).join(', ') || '未知歌手',
        album: song.album?.name || '',
        duration: song.interval || 0,
        durationStr: formatDuration(song.interval || 0)
      }
    }
    return { singer: '未知歌手', album: '', duration: 0, durationStr: '--:--' }
  } catch (error) {
    console.error('QQ song detail error:', error.message)
    return { singer: '未知歌手', album: '', duration: 0, durationStr: '--:--' }
  }
}

// 格式化时长（秒转为 mm:ss）
function formatDuration(seconds) {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 解析QQ音乐URL
 */
export async function parseQQMusic(url) {
  const result = extractSongId(url)

  if (!result) {
    throw new Error('无法解析QQ音乐链接，请检查链接格式')
  }

  if (result.type === 'playlist') {
    // 返回歌单信息，让用户使用歌单下载功能
    return {
      title: 'QQ音乐歌单',
      artist: '歌单',
      album: '',
      duration: 0,
      audioUrl: '',
      coverUrl: '',
      platform: 'qq',
      isPlaylist: true,
      playlistId: result.id,
      message: '这是歌单链接，请使用"下载歌单"功能'
    }
  }

  // 单曲解析
  const songmid = result.id

  let title = '未知歌曲'
  let artist = '未知歌手'
  let album = ''
  let coverUrl = 'https://y.gtimg.cn/music/photo_new/T002R300x300M000.jpg'

  try {
    const searchUrl = `https://c.y.qq.com/v8/fcg-bin/fcg_search_qqmusic.fcg?w=${encodeURIComponent(songmid)}&format=json&p=1&n=1`

    const response = await axios.get(searchUrl, {
      headers: {
        'Referer': 'https://y.qq.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000
    })

    if (response.data && response.data.data && response.data.data.song) {
      const song = response.data.data.song.list[0]
      if (song) {
        title = song.name || title
        artist = song.singer?.map(s => s.name).join(', ') || artist
        album = song.album?.name || album
        coverUrl = song.pic?.replace('http:', 'https:') || coverUrl
      }
    }
  } catch (error) {
    console.error('QQ search error:', error.message)
  }

  return {
    title,
    artist,
    album,
    duration: 0,
    audioUrl: '',
    coverUrl,
    platform: 'qq',
    note: 'QQ音乐解析需要登录才能获取播放URL'
  }
}
