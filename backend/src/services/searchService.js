import axios from 'axios'

/**
 * 多平台音乐搜索服务
 * 从QQ音乐解析歌单后，搜索其他平台下载
 */

/**
 * 搜索咪咕音乐
 */
async function searchMigu(keyword) {
  try {
    const url = `https://mapi.migu.cn/migu/search?keyword=${encodeURIComponent(keyword)}&count=5&type=2`
    const response = await axios.get(url, {
      headers: {
        'Referer': 'https://music.migu.cn/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    })

    const results = []
    if (response.data && response.data.data) {
      const songs = response.data.data || []
      for (const song of songs.slice(0, 5)) {
        results.push({
          title: song.title || song.name,
          artist: song.artist || song.singer,
          album: song.album || '',
          duration: song.duration || 0,
          source: 'migu',
          url: song.listenUrl || song.playUrl || '',
          downloadUrl: song.downloadUrl || ''
        })
      }
    }
    return results
  } catch (error) {
    console.error('Migu search error:', error.message)
    return []
  }
}

/**
 * 搜索酷狗音乐
 */
async function searchKugou(keyword) {
  try {
    const url = `https://songsearch.kugou.com/song_search_v2?keyword=${encodeURIComponent(keyword)}&page=1&pagesize=5&platform=WebFilter`
    const response = await axios.get(url, {
      headers: {
        'Referer': 'https://www.kugou.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    })

    const results = []
    if (response.data && response.data.data && response.data.data.lists) {
      for (const song of response.data.data.lists.slice(0, 5)) {
        results.push({
          title: song.SongName,
          artist: song.SingerName,
          album: song.AlbumName || '',
          duration: song.Duration || 0,
          source: 'kugou',
          url: song.VipUrl || '',
          hash: song.FileHash
        })
      }
    }
    return results
  } catch (error) {
    console.error('Kugou search error:', error.message)
    return []
  }
}

/**
 * 搜索网易云音乐
 */
async function searchNetease(keyword) {
  try {
    const url = `https://music.163.com/api/search/get`
    const response = await axios.post(url, {
      s: keyword,
      type: 1,
      limit: 5,
      offset: 0
    }, {
      headers: {
        'Referer': 'https://music.163.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    })

    const results = []
    if (response.data && response.data.result && response.data.result.songs) {
      for (const song of response.data.result.songs.slice(0, 5)) {
        results.push({
          title: song.name,
          artist: song.artists ? song.artists.map(a => a.name).join(', ') : '',
          album: song.album ? song.album.name : '',
          duration: song.duration ? Math.floor(song.duration / 1000) : 0,
          source: 'netease',
          id: song.id
        })
      }
    }
    return results
  } catch (error) {
    console.error('Netease search error:', error.message)
    return []
  }
}

/**
 * 搜索汽水音乐
 */
async function searchQishui(keyword) {
  // 汽水音乐API (字节跳动)
  try {
    const url = `https://music.migu.cn/migu/search?keyword=${encodeURIComponent(keyword)}&count=5&type=2`
    // 汽水和咪咕可能共用类似API
    return await searchMigu(keyword)
  } catch (error) {
    console.error('Qishui search error:', error.message)
    return []
  }
}

/**
 * 使用yt-dlp多平台搜索下载
 */
async function searchWithYtDlp(keyword) {
  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    // 使用yt-dlp搜索
    const { stdout } = await execAsync(`yt-dlp --flat-playlist --dump-json "ytsearch5:${keyword}"`, {
      timeout: 30000
    })

    const results = []
    for (const line of stdout.split('\n').filter(l => l.trim())) {
      try {
        const data = JSON.parse(line)
        results.push({
          title: data.title || '',
          artist: data.artist || data.uploader || '',
          album: data.album || '',
          duration: data.duration || 0,
          source: data.extractor || 'unknown',
          url: data.url || data.original_url || ''
        })
      } catch (e) {
        // 忽略解析错误
      }
    }
    return results
  } catch (error) {
    console.error('YtDlp search error:', error.message)
    return []
  }
}

/**
 * 多平台搜索
 */
export async function searchMultiPlatform(keyword, platform = 'all') {
  const searches = []

  if (platform === 'all' || platform === 'migu') {
    searches.push(searchMigu(keyword))
  }
  if (platform === 'all' || platform === 'kugou') {
    searches.push(searchKugou(keyword))
  }
  if (platform === 'all' || platform === 'netease') {
    searches.push(searchNetease(keyword))
  }
  if (platform === 'all' || platform === 'qishui') {
    searches.push(searchQishui(keyword))
  }

  // 并行搜索
  const results = await Promise.all(searches)
  const flatResults = results.flat()

  return {
    keyword,
    count: flatResults.length,
    results: flatResults
  }
}

/**
 * 批量搜索歌单歌曲的可下载源
 */
export async function searchSongSources(songs) {
  const batchSize = 5
  const results = []

  for (let i = 0; i < songs.length; i += batchSize) {
    const batch = songs.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(song => searchSingleSongSources(song))
    )
    results.push(...batchResults)

    if (i + batchSize < songs.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  return results
}

/**
 * 搜索单首歌的可用下载源
 */
async function searchSingleSongSources(song) {
  // 简化关键词，移除特殊字符
  const cleanTitle = song.title.replace(/[（）()【】[\]【】]/g, '').trim()
  const keyword = song.singer ? `${cleanTitle} ${song.singer}` : cleanTitle
  const sources = []

  // 并发搜索（暂时禁用咪咕，网络不通）
  const [kugouResults, neteaseResults] = await Promise.all([
    searchKugou(keyword),
    searchNetease(keyword)
  ])
  const miguResults = []

  // 匹配最佳结果（优先网易云，yt-dlp可直接下载）
  if (neteaseResults.length > 0) {
    const best = neteaseResults[0]
    sources.push({
      platform: 'netease',
      title: best.title,
      artist: best.artist,
      id: best.id,
      url: `https://music.163.com/song?id=${best.id}`,
      quality: 'high'
    })
  }

  if (kugouResults.length > 0) {
    const best = kugouResults[0]
    sources.push({
      platform: 'kugou',
      title: best.title,
      artist: best.artist,
      hash: best.hash,
      url: `https://www.kugou.com/song/#hash=${best.hash}`,
      quality: 'high'
    })
  }

  if (miguResults.length > 0) {
    const best = miguResults[0]
    sources.push({
      platform: 'migu',
      title: best.title,
      artist: best.artist,
      url: best.url || best.downloadUrl || '',
      quality: 'high'
    })
  }

  return {
    songId: song.id,
    title: song.title,
    singer: song.singer,
    sources
  }
}

/**
 * 根据QQ音乐歌曲信息搜索可下载的链接
 */
export async function searchDownloadable(keyword, artist) {
  // 组合搜索关键词
  const searchKeyword = artist ? `${keyword} ${artist}` : keyword

  // 优先搜索酷狗（版权多）
  const kugouResults = await searchKugou(searchKeyword)
  if (kugouResults.length > 0) {
    return { platform: 'kugou', results: kugouResults }
  }

  // 搜索网易云
  const neteaseResults = await searchNetease(searchKeyword)
  if (neteaseResults.length > 0) {
    return { platform: 'netease', results: neteaseResults }
  }

  // 搜索咪咕
  const miguResults = await searchMigu(searchKeyword)
  if (miguResults.length > 0) {
    return { platform: 'migu', results: miguResults }
  }

  return { platform: 'none', results: [] }
}
