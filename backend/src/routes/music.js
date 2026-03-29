import { Router } from 'express'
import { parseQQMusic, parseQQMusicPlaylist, getQQSongDetail } from '../services/qqMusic.js'
import { parseNeteaseMusic } from '../services/neteaseMusic.js'
import { parseKugouMusic } from '../services/kugouMusic.js'
import { searchMultiPlatform } from '../services/searchService.js'
import { exec, execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const execFileAsync = promisify(execFile)
const DOWNLOAD_DIR = path.join(process.cwd(), '../downloads')

const router = Router()

// 确保下载目录存在
import fs from 'fs'
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true })
}

// 解析音乐
router.post('/parse', async (req, res) => {
  try {
    const { url } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    // 安全验证：解析URL获取hostname
    let hostname
    try {
      hostname = new URL(url).hostname
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    let result

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
    res.status(500).json({ error: error.message || 'Failed to parse music URL' })
  }
})

// 解析QQ音乐歌单（获取所有歌曲）
router.post('/parse-playlist', async (req, res) => {
  try {
    const { url } = req.body
    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }
    const playlist = await parseQQMusicPlaylist(url)
    res.json(playlist)
  } catch (error) {
    console.error('Parse playlist error:', error)
    res.status(500).json({ error: error.message || 'Failed to parse playlist' })
  }
})

// 搜索歌单中所有歌曲的可下载源
router.post('/search-playlist-sources', async (req, res) => {
  try {
    const { songs } = req.body
    if (!songs || !Array.isArray(songs)) {
      return res.status(400).json({ error: 'songs array is required' })
    }
    const { searchSongSources } = await import('../services/searchService.js')
    const results = await searchSongSources(songs)
    res.json({ success: true, songs: results })
  } catch (error) {
    console.error('Search sources error:', error)
    res.status(500).json({ error: error.message || 'Failed to search sources' })
  }
})

// 获取QQ歌曲详情
router.post('/song-detail', async (req, res) => {
  try {
    const { songId } = req.body
    if (!songId) {
      return res.status(400).json({ error: 'songId is required' })
    }
    const detail = await getQQSongDetail(songId)
    res.json(detail)
  } catch (error) {
    console.error('Song detail error:', error)
    res.status(500).json({ error: error.message || 'Failed to get song detail' })
  }
})

// 多平台搜索
router.post('/search', async (req, res) => {
  try {
    const { keyword, platform } = req.body
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' })
    }
    const results = await searchMultiPlatform(keyword, platform)
    res.json(results)
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: error.message || 'Search failed' })
  }
})

// 下载音乐
router.post('/download', async (req, res) => {
  try {
    const { url, quality = 'standard' } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    // 安全验证
    let hostname
    try {
      hostname = new URL(url).hostname
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    // 只允许支持的平台
    const supportedPlatforms = ['music.163.com', 'y.music.163.com', 'qq.com', 'y.qq.com', 'kugou.com']
    if (!supportedPlatforms.some(p => hostname.endsWith(p))) {
      return res.status(400).json({ error: 'Unsupported platform for download' })
    }

    // 构建yt-dlp命令
    const outputPath = path.join(DOWNLOAD_DIR, '%(title)s [%(id)s].%(ext)s')
    let formatSpec = '-x --audio-format mp3 --audio-quality 0'

    if (quality === 'high') {
      formatSpec = '-x --audio-format flac --audio-quality 0'
    } else if (quality === 'medium') {
      formatSpec = '-x --audio-format mp3 --audio-quality 2'
    }

    // 使用cookie文件（如果存在）
    const cookieFile = path.join(__dirname, '../../../cookies.txt')
    let cookieArg = ''
    if (fs.existsSync(cookieFile)) {
      cookieArg = `--cookies "${cookieFile}"`
    }

    const command = `yt-dlp ${formatSpec} ${cookieArg} -o "${outputPath}" "${url}"`

    console.log('Downloading:', url)

    const { stdout, stderr } = await execAsync(command, {
      cwd: DOWNLOAD_DIR,
      timeout: 300000 // 5分钟超时
    })

    console.log('Download output:', stdout)

    // 查找下载的文件
    const files = fs.readdirSync(DOWNLOAD_DIR)
    const latestFile = files
      .filter(f => f.endsWith('.mp3') || f.endsWith('.flac'))
      .sort((a, b) => fs.statSync(path.join(DOWNLOAD_DIR, b)).mtime - fs.statSync(path.join(DOWNLOAD_DIR, a)).mtime)[0]

    if (latestFile) {
      const filePath = path.join(DOWNLOAD_DIR, latestFile)
      const stats = fs.statSync(filePath)

      res.json({
        success: true,
        filename: latestFile,
        filepath: `/downloads/${latestFile}`,
        size: stats.size,
        path: filePath
      })
    } else {
      res.json({ success: true, message: 'Download completed' })
    }
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({ error: error.message || 'Download failed' })
  }
})

// 下载歌单
router.post('/download-playlist', async (req, res) => {
  try {
    const { url, quality = 'standard' } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    // 安全验证
    let hostname
    try {
      hostname = new URL(url).hostname
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    // 转换QQ音乐新URL格式为yt-dlp支持的旧格式
    let downloadUrl = url
    if (hostname.endsWith('qq.com') || hostname.endsWith('y.qq.com')) {
      // y.qq.com/n/ryqq_v2/playlist/ -> y.qq.com/n/ryqq/playlist/
      downloadUrl = url.replace('/n/ryqq_v2/playlist/', '/n/ryqq/playlist/')
    }

    // 构建yt-dlp命令
    const outputPath = path.join(DOWNLOAD_DIR, '%(playlist_title)s/%(title)s [%(id)s].%(ext)s')
    let formatSpec = '-x --audio-format mp3 --audio-quality 0'

    // 使用cookie文件（如果存在）
    const cookieFile = path.join(__dirname, '../../../cookies.txt')
    let cookieArg = ''
    if (fs.existsSync(cookieFile)) {
      cookieArg = `--cookies "${cookieFile}"`
    }

    const command = `yt-dlp ${formatSpec} ${cookieArg} -o "${outputPath}" "${downloadUrl}"`

    console.log('Downloading playlist:', url)

    // 执行下载（异步，不等待完成）
    exec(command, {
      cwd: DOWNLOAD_DIR,
      timeout: 3600000 // 1小时超时
    }, (error, stdout, stderr) => {
      if (error) {
        console.error('Playlist download error:', error)
      }
      console.log('Playlist download output:', stdout)
    })

    res.json({
      success: true,
      message: 'Playlist download started. Check downloads folder for progress.'
    })
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({ error: error.message || 'Download failed' })
  }
})

// 获取下载列表
router.get('/downloads', (req, res) => {
  try {
    if (!fs.existsSync(DOWNLOAD_DIR)) {
      return res.json([])
    }

    const files = fs.readdirSync(DOWNLOAD_DIR)
      .filter(f => f.endsWith('.mp3') || f.endsWith('.flac') || f.endsWith('.m4a'))
      .map(f => {
        const stats = fs.statSync(path.join(DOWNLOAD_DIR, f))
        return {
          name: f,
          size: stats.size,
          modified: stats.mtime,
          url: `/downloads/${f}`
        }
      })
      .sort((a, b) => b.modified - a.modified)

    res.json(files)
  } catch (error) {
    console.error('List error:', error)
    res.status(500).json({ error: 'Failed to list downloads' })
  }
})

// 浏览本地音乐文件夹
router.post('/browse-folder', (req, res) => {
  try {
    const { folderPath } = req.body
    console.log('browse-folder request:', folderPath)
    if (!folderPath) {
      return res.status(400).json({ error: 'folderPath is required' })
    }

    // 处理 Unix 风格路径 (Git Bash) -> Windows 路径
    let normalizedPath = folderPath
    console.log('original:', normalizedPath)
    if (normalizedPath.startsWith('/')) {
      const match = normalizedPath.match(/^\/([a-z])\/(.*)/i)
      if (match) {
        normalizedPath = match[1].toUpperCase() + ':/' + match[2]
      }
    }
    normalizedPath = path.normalize(normalizedPath)
    console.log('normalized:', normalizedPath, 'exists:', fs.existsSync(normalizedPath))

    if (!fs.existsSync(normalizedPath)) {
      return res.status(400).json({ error: '文件夹不存在: ' + normalizedPath })
    }

    const stat = fs.statSync(normalizedPath)
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: '路径不是文件夹' })
    }

    const files = fs.readdirSync(normalizedPath)
      .filter(f => f.endsWith('.mp3') || f.endsWith('.flac') || f.endsWith('.m4a'))
      .map(f => {
        const filePath = path.join(normalizedPath, f)
        const stats = fs.statSync(filePath)
        return {
          name: f,
          size: stats.size,
          modified: stats.mtime,
          path: filePath
        }
      })
      .sort((a, b) => b.modified - a.modified)

    res.json({ folderPath: normalizedPath, files })
  } catch (error) {
    console.error('Browse folder error:', error)
    res.status(500).json({ error: '无法读取文件夹: ' + error.message })
  }
})

// 使用yt-dlp下载歌曲
router.post('/browser-download', async (req, res) => {
  try {
    const { title, artist } = req.body
    if (!title) {
      return res.status(400).json({ error: 'title is required' })
    }

    const keyword = artist ? `${title} ${artist}` : title
    const outputPath = path.join(DOWNLOAD_DIR, '%(title)s [%(id)s].%(ext)s')

    // 使用 execFile 直接执行命令，避免 shell 中文编码问题
    const args = ['-x', '--audio-format', 'mp3', '--audio-quality', '0', '-o', outputPath, '--', `ytsearch1:${keyword}`]

    const { stdout, stderr } = await execFileAsync('yt-dlp', args, {
      cwd: DOWNLOAD_DIR,
      timeout: 120000
    })

    // 查找下载的文件
    const files = fs.readdirSync(DOWNLOAD_DIR)
    const latestFile = files
      .filter(f => f.endsWith('.mp3') || f.endsWith('.flac'))
      .sort((a, b) => fs.statSync(path.join(DOWNLOAD_DIR, b)).mtime - fs.statSync(path.join(DOWNLOAD_DIR, a)).mtime)[0]

    if (latestFile) {
      res.json({
        success: true,
        message: `下载成功: ${latestFile}`,
        filename: latestFile
      })
    } else {
      res.json({ success: true, message: '下载完成' })
    }
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({ error: error.message || 'Download failed' })
  }
})

export default router
