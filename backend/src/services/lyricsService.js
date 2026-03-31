/**
 * 歌词服务 - 获取和解析歌词
 * 支持从网易云音乐等平台获取LRC格式歌词
 */

// 解析LRC格式歌词
export function parseLRC(lrcText) {
  if (!lrcText) return []

  const lines = lrcText.split('\n')
  const lyrics = []

  // LRC时间标签正则: [mm:ss.xx] 或 [mm:ss:xx]
  const timeTagRegex = /\[(\d{1,2}):(\d{2})[.:](\d{2,3})?\]/
  // 元数据标签
  const metaTagRegex = /\[(ar|ti|al|by|offset|length):(.+)\]/

  const meta = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // 解析元数据
    const metaMatch = trimmed.match(metaTagRegex)
    if (metaMatch) {
      meta[metaMatch[1]] = metaMatch[2].trim()
      continue
    }

    // 解析时间标签
    let match = timeTagRegex.exec(trimmed)
    if (match) {
      const min = parseInt(match[1], 10)
      const sec = parseInt(match[2], 10)
      const ms = match[4]
        ? parseInt(match[4].padEnd(3, '0').slice(0, 3), 10)
        : 0
      const time = min * 60 + sec + ms / 1000

      // 获取时间标签后的文本
      const text = trimmed.slice(match[0].length).trim()

      if (text) {
        lyrics.push({ time, text })
      }
    }
  }

  // 按时间排序
  lyrics.sort((a, b) => a.time - b.time)

  return { meta, lyrics }
}

// 获取当前播放行的索引
export function getCurrentLyricIndex(lyrics, currentTime) {
  if (!lyrics || lyrics.length === 0) return -1

  let index = -1
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time <= currentTime) {
      index = i
    } else {
      break
    }
  }
  return index
}

// 获取网易云音乐歌词
async function fetchNeteaseLyrics(songId) {
  const url = `https://music.163.com/api/song/lyric?id=${songId}&lv=1&kv=1&tv=-1`

  const response = await fetch(url, {
    headers: {
      'Referer': 'https://music.163.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const data = await response.json()

  if (data.code !== 200) {
    throw new Error(`API error: ${data.code}`)
  }

  // 合并原文和翻译歌词
  let lrcText = data.lrc?.lyric || ''
  const transText = data.ttrans?.lyric || data.zhcls?.lyric || ''

  // 如果有翻译，追加翻译行
  if (transText) {
    const origLines = lrcText.split('\n')
    const transLines = transText.split('\n')

    // 简单合并策略：按时间戳对齐
    const timeTagRegex = /\[(\d{1,2}):(\d{2})[.:](\d{2,3})\]/
    const origMap = {}

    for (const line of origLines) {
      const match = timeTagRegex.exec(line)
      if (match) {
        origMap[match[0]] = line
      }
    }

    for (const line of transLines) {
      const match = timeTagRegex.exec(line)
      if (match && origMap[match[0]]) {
        // 追加翻译
        const origText = origMap[match[0]].replace(timeTagRegex, '')
        const transTextContent = line.replace(timeTagRegex, '').trim()
        if (transTextContent) {
          origMap[match[0]] = match[0] + origText + ' / ' + transTextContent
        }
      }
    }

    lrcText = Object.values(origMap).join('\n')
  }

  return parseLRC(lrcText)
}

// 搜索歌曲并获取歌词
export async function getLyrics(title, artist) {
  try {
    // 首先尝试通过搜索获取网易云音乐歌曲ID
    const searchUrl = `https://music.163.com/api/search/get`

    const params = new URLSearchParams({
      s: `${title} ${artist || ''}`.trim(),
      type: 1,
      limit: 1,
      offset: 0
    })

    const searchRes = await fetch(`${searchUrl}?${params}`, {
      headers: {
        'Referer': 'https://music.163.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!searchRes.ok) {
      throw new Error(`Search HTTP ${searchRes.status}`)
    }

    const searchData = await searchRes.json()
    const songs = searchData.result?.songs || []

    if (songs.length === 0) {
      return { success: false, error: '未找到相关歌曲' }
    }

    // 使用第一个搜索结果获取歌词
    const songId = songs[0].id
    const songName = songs[0].name
    const artists = songs[0].artists?.map(a => a.name).join(', ') || artist || ''

    const lyricsData = await fetchNeteaseLyrics(songId)

    if (lyricsData.lyrics.length === 0) {
      return { success: false, error: '该歌曲暂无歌词' }
    }

    return {
      success: true,
      title: songName,
      artist: artists,
      ...lyricsData
    }
  } catch (error) {
    console.error('获取歌词失败:', error)
    return { success: false, error: error.message || '获取歌词失败' }
  }
}

// 根据歌曲信息直接获取歌词（用于已有songId的情况）
export async function getLyricsById(songId) {
  try {
    const lyricsData = await fetchNeteaseLyrics(songId)

    if (lyricsData.lyrics.length === 0) {
      return { success: false, error: '该歌曲暂无歌词' }
    }

    return { success: true, ...lyricsData }
  } catch (error) {
    console.error('获取歌词失败:', error)
    return { success: false, error: error.message || '获取歌词失败' }
  }
}
