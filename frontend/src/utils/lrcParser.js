/**
 * LRC 格式解析工具
 * 解析LRC歌词文本，返回时间戳和歌词行
 */

/**
 * 解析LRC格式歌词文本
 * @param {string} lrcText - LRC格式歌词文本
 * @returns {{ meta: Object, lyrics: Array<{time: number, text: string}> }}
 */
export function parseLRC(lrcText) {
  if (!lrcText) return { meta: {}, lyrics: [] }

  const lines = lrcText.split('\n')
  const lyrics = []

  // LRC时间标签正则: [mm:ss.xx] 或 [mm:ss:xx]
  const timeTagRegex = /\[(\d{1,2}):(\d{2})([.:])(\d{2,3})?\]/
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
    const match = timeTagRegex.exec(trimmed)
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

/**
 * 获取当前播放行的索引
 * @param {Array} lyrics - 歌词数组
 * @param {number} currentTime - 当前播放时间（秒）
 * @returns {number} 当前歌词行索引，未找到返回-1
 */
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

/**
 * 格式化时间（秒）为 mm:ss 格式
 * @param {number} seconds - 秒数
 * @returns {string} mm:ss 格式
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
