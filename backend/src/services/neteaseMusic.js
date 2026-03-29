import axios from 'axios'

/**
 * 网易云音乐解析服务
 * 可以获取歌曲信息，但完整音频需要VIP登录
 */

// 从URL提取歌曲ID
function extractSongId(url) {
  // https://music.163.com/song?id=347230
  const idMatch = url.match(/id=(\d+)/)
  if (idMatch) return idMatch[1]

  // https://y.music.163.com/song?id=347230
  const shortMatch = url.match(/y\.music\.163\.com.*id=(\d+)/)
  if (shortMatch) return shortMatch[1]

  return null
}

/**
 * 解析网易云音乐URL
 */
export async function parseNeteaseMusic(url) {
  const songId = extractSongId(url)

  if (!songId) {
    throw new Error('无法解析网易云音乐链接，请检查链接格式')
  }

  // 获取歌曲详情
  const detailUrl = `http://music.163.com/api/song/detail/?ids=[${songId}]`
  const response = await axios.get(detailUrl, {
    headers: {
      'Referer': 'http://music.163.com/',
      'User-Agent': 'Mozilla/5.0'
    }
  })

  if (!response.data || !response.data.songs || !response.data.songs[0]) {
    throw new Error('无法获取歌曲信息')
  }

  const song = response.data.songs[0]
  const artists = song.artists?.map(a => a.name).join(', ') || '未知歌手'

  // 尝试获取歌词
  let lyric = null
  try {
    const lyricResponse = await axios.get(`http://music.163.com/api/song/media?id=${songId}`, {
      headers: { 'Referer': 'http://music.163.com/' }
    })
    if (lyricResponse.data && lyricResponse.data.lyric) {
      lyric = lyricResponse.data.lyric
    }
  } catch (e) {
    // 歌词获取失败，继续
  }

  return {
    title: song.name || '未知歌曲',
    artist: artists,
    album: song.album?.name || '',
    duration: Math.floor((song.duration || 0) / 1000),
    audioUrl: '', // 网易云需要VIP才能获取播放URL
    coverUrl: song.album?.picUrl?.replace('http:', 'https:') || '',
    platform: 'netease',
    lyric: lyric,
    message: '部分歌曲需要VIP才能播放完整音频'
  }
}
