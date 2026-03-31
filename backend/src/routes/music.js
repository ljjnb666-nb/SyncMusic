import { Router } from 'express'
import { parseQQMusic, getQQSongDetail } from '../services/qqMusic.js'
import { parseNeteaseMusic } from '../services/neteaseMusic.js'
import { parseKugouMusic } from '../services/kugouMusic.js'
import { searchMultiPlatform } from '../services/searchService.js'
import { exec, execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const execAsync = promisify(exec)
const execFileAsync = promisify(execFile)

// 支持绝对路径和相对路径，相对路径相对于项目根目录
const DOWNLOAD_DIR = path.isAbsolute(process.env.DOWNLOAD_DIR || '')
  ? process.env.DOWNLOAD_DIR
  : path.join(process.cwd(), '..', process.env.DOWNLOAD_DIR || 'downloads')

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DOWNLOAD_DIR)
  },
  filename: (req, file, cb) => {
    // 使用原文件名，移除特殊字符
    const safeName = file.originalname.replace(/[<>:"/\\|?*]/g, '_')
    cb(null, safeName)
  }
})
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } }) // 500MB 限制

const router = Router()

// 格式化时长
function formatDuration(seconds) {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 确保下载目录存在
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

// 解析歌单（多平台支持）
router.post('/parse-playlist', async (req, res) => {
  try {
    const { url } = req.body
    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }
    const { parsePlaylist } = await import('../services/playlistParser.js')
    const playlist = await parsePlaylist(url)
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
    let formatSpec = '-x --audio-format mp3 --audio-quality 0' // standard: 128k MP3

    // 音质选项映射
    if (quality === '128k') {
      formatSpec = '-x --audio-format mp3 --audio-quality 9' // 128k
    } else if (quality === '320k') {
      formatSpec = '-x --audio-format mp3 --audio-quality 0' // 320k
    } else if (quality === 'flac') {
      formatSpec = '-x --audio-format flac --audio-quality 0' // FLAC无损
    } else if (quality === 'hi-res') {
      formatSpec = '-x --audio-format flac --audio-quality 0 -f ba' // Hi-Res (最高音质)
    } else if (quality === 'high') {
      formatSpec = '-x --audio-format flac --audio-quality 0' // 高品质FLAC
    } else if (quality === 'medium') {
      formatSpec = '-x --audio-format mp3 --audio-quality 5' // 中等品质
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

      // 下载后验证：用 ffprobe 获取元数据
      let mediaInfo = null
      try {
        const { stdout } = await execAsync(
          `ffprobe -v quiet -print_format json -show_format "${filePath}"`,
          { timeout: 30000 }
        )
        const probeData = JSON.parse(stdout)
        mediaInfo = {
          duration: parseFloat(probeData.format?.duration) || 0,
          durationStr: formatDuration(parseFloat(probeData.format?.duration) || 0),
          format: probeData.format?.format_name || '',
          bitrate: probeData.format?.bit_rate || 0,
          title: probeData.format?.tags?.title || '',
          artist: probeData.format?.tags?.artist || '',
          album: probeData.format?.tags?.album || ''
        }
      } catch (e) {
        console.warn('ffprobe error:', e.message)
      }

      res.json({
        success: true,
        filename: latestFile,
        filepath: `/downloads/${latestFile}`,
        size: stats.size,
        path: filePath,
        mediaInfo
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
    let formatSpec = '-x --audio-format mp3 --audio-quality 0' // standard: 320k MP3

    // 音质选项映射
    if (quality === '128k') {
      formatSpec = '-x --audio-format mp3 --audio-quality 9'
    } else if (quality === '320k') {
      formatSpec = '-x --audio-format mp3 --audio-quality 0'
    } else if (quality === 'flac') {
      formatSpec = '-x --audio-format flac --audio-quality 0'
    } else if (quality === 'hi-res') {
      formatSpec = '-x --audio-format flac --audio-quality 0 -f ba'
    }

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

// 获取当前下载目录
router.get('/download-dir', (req, res) => {
  res.json({ path: DOWNLOAD_DIR })
})

// 设置下载目录
router.post('/download-dir', (req, res) => {
  try {
    const { path: newPath } = req.body
    if (!newPath) {
      return res.status(400).json({ error: 'Path is required' })
    }

    const resolvedPath = path.isAbsolute(newPath)
      ? newPath
      : path.join(process.cwd(), '..', newPath)

    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true })
    }

    // 更新环境变量（仅影响当前进程）
    process.env.DOWNLOAD_DIR = newPath
    // 重新计算 DOWNLOAD_DIR（通过重新导入无效，需要在 index.js 中处理）
    res.json({ path: resolvedPath, message: 'Download directory updated. Restart required for full effect.' })
  } catch (error) {
    console.error('Set download dir error:', error)
    res.status(500).json({ error: 'Failed to set download directory' })
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
    const outputPath = path.join(DOWNLOAD_DIR, '%(title)s [%(id)s].%(ext)s').replace(/\\/g, '/')

    // 使用子进程脚本执行 yt-dlp，通过文件传递中文参数
    const { spawn } = await import('child_process')
    const { writeFileSync, unlinkSync } = await import('fs')
    const ytDlpPath = process.platform === 'win32' ? 'D:/python/Scripts/yt-dlp.exe' : 'yt-dlp'
    const scriptPath = 'C:/Users/LJJ2004/所有项目/SyncMusic/backend/exec-ytdl.cjs'

    // 将keyword写入临时文件（避免命令行编码问题）
    const keywordFile = path.join(process.env.TEMP || '/tmp', 'ytdl_keyword_' + Date.now() + '.txt')
    writeFileSync(keywordFile, keyword, 'utf8')

    const child = spawn('node', [scriptPath, ytDlpPath, outputPath, keywordFile], {
      cwd: DOWNLOAD_DIR,
      env: { ...process.env, LC_ALL: 'en_US.UTF-8' }
    })

    let stdout = '', stderr = ''
    child.stdout.on('data', d => { stdout += d })
    child.stderr.on('data', d => { stderr += d })

    const exitCode = await new Promise((resolve) => {
      child.on('close', (code) => resolve(code))
    })

    // 清理临时文件
    try { unlinkSync(keywordFile) } catch (e) {}

    // 等待一小段时间让输出缓冲完成
    await new Promise(r => setTimeout(r, 500))

    const output = stdout + stderr
    console.log('[DEBUG] exitCode:', exitCode, 'output length:', output.length)

    // 检测是否有实际下载成功
    // 情况1: 新下载 - exitCode为0 && 有Destination行 && 有100%完成进度
    // 情况2: 文件已存在 - exitCode为0 && 有"already been downloaded" && 有Finished
    const hasDestination = /\[download\] Destination:/.test(output)
    const has100Progress = /\[download\] 100%/.test(output)
    const hasAlreadyDownloaded = /has already been downloaded/i.test(output)
    const downloaded = exitCode === 0 && (hasDestination || hasAlreadyDownloaded) && (has100Progress || hasAlreadyDownloaded)
    console.log('[DEBUG] download:', keyword, 'downloaded:', downloaded, 'hasDestination:', hasDestination, 'hasAlready:', hasAlreadyDownloaded, 'has100Progress:', has100Progress)

    if (downloaded) {
      // 文件已存在时，直接搜索匹配的文件
      if (hasAlreadyDownloaded) {
        const keywordLower = keyword.toLowerCase()
        const files = fs.readdirSync(DOWNLOAD_DIR)
          .filter(f => f.endsWith('.mp3') || f.endsWith('.flac'))
          .filter(f => f.toLowerCase().includes(keywordLower.split(' ')[0])) // 用歌名关键词匹配
        if (files.length > 0) {
          res.json({ success: true, message: `下载成功: ${files[0]}`, filename: files[0] })
          return
        }
      }
      // 新下载，查找最近创建的文件
      const now = Date.now()
      const files = fs.readdirSync(DOWNLOAD_DIR)
        .filter(f => f.endsWith('.mp3') || f.endsWith('.flac'))
        .map(f => ({ name: f, mtime: fs.statSync(path.join(DOWNLOAD_DIR, f)).mtime }))
        .filter(f => now - f.mtime.getTime() < 60000) // 只接受最近1分钟内的文件
        .sort((a, b) => b.mtime - a.mtime)

      if (files.length > 0) {
        const resultFile = files[0]
        res.json({ success: true, message: `下载成功: ${resultFile.name}`, filename: resultFile.name })
        return
      }

      // 确实下载失败了
      res.json({ success: false, message: '未找到可下载内容' })
      return
    }

    res.json({ success: false, message: downloaded ? '下载完成' : '未找到可下载内容' })
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({ error: error.message || 'Download failed' })
  }
})

// 上传本地音乐文件
router.post('/upload', upload.array('files', 100), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    const uploadedFiles = []
    for (const file of req.files) {
      const filePath = path.join(DOWNLOAD_DIR, file.filename)
      let mediaInfo = null

      // 尝试获取元数据
      try {
        const { stdout } = await execAsync(
          `ffprobe -v quiet -print_format json -show_format "${filePath}"`,
          { timeout: 30000 }
        )
        const probeData = JSON.parse(stdout)
        mediaInfo = {
          duration: parseFloat(probeData.format?.duration) || 0,
          title: probeData.format?.tags?.title || '',
          artist: probeData.format?.tags?.artist || '',
          album: probeData.format?.tags?.album || ''
        }
      } catch (e) {
        console.warn('ffprobe error:', e.message)
      }

      // 解析文件名获取标题和艺术家
      const nameWithoutExt = file.originalname.replace(/\.(mp3|flac|m4a)$/i, '')
      const parts = nameWithoutExt.split(' - ')
      const title = mediaInfo?.title || (parts.length > 1 ? parts[1].trim() : parts[0].trim())
      const artist = mediaInfo?.artist || (parts.length > 1 ? parts[0].trim() : 'Unknown')

      uploadedFiles.push({
        name: file.filename,
        originalName: file.originalname,
        size: file.size,
        path: `/downloads/${file.filename}`,
        title,
        artist,
        duration: mediaInfo?.duration || 0
      })
    }

    res.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: error.message || 'Upload failed' })
  }
})

export default router
