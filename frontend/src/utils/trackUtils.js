// Track path utilities: safe normalization and URL construction
// Ensures no % or other URL-unsafe characters leak into playback URLs

/**
 * Replace % and other URL-unsafe characters in a filename string.
 * Used for the raw filename portion of /downloads/ paths.
 */
export function safeFilename(name) {
  if (!name || typeof name !== 'string') return name || ''
  return name.replace(/%/g, '_').replace(/[<>:"|?*]/g, '_').replace(/\s+/g, ' ').trim()
}

/**
 * Normalize a track.path value: fix any % characters that should not be there.
 * This handles two cases:
 *   1. /downloads/filename.mp3  -- filename portion may contain unsafe chars
 *   2. /local-music/encoded   -- already encoded absolute path; re-encode if broken
 */
export function normalizeTrackPath(track) {
  if (!track || !track.path || typeof track.path !== 'string') {
    return track
  }
  const p = track.path

  if (p.startsWith('/downloads/')) {
    const filename = p.slice('/downloads/'.length)
    // Only normalize if the filename actually has unsafe chars
    if (filename.includes('%') || /[<>:"|?*]/.test(filename)) {
      return { ...track, path: '/downloads/' + safeFilename(filename) }
    }
    return track
  }

  if (p.startsWith('/local-music/')) {
    const encodedPart = p.slice('/local-music/'.length)
    // If the encoded part has bare % chars (not properly encoded as %25),
    // it means the path was stored incorrectly. Try to fix it.
    if (encodedPart.includes('%') && !encodedPart.includes('%25')) {
      try {
        const decoded = decodeURIComponent(encodedPart)
        return { ...track, path: '/local-music/' + encodeURIComponent(decoded) }
      } catch {
        // Fallback: just strip unsafe chars
        return { ...track, path: '/local-music/' + safeFilename(encodedPart) }
      }
    }
    return track
  }

  // Absolute path used as /local-music/: encode it
  if (p.match(/^[A-Z]:/i) || p.startsWith('/')) {
    return { ...track, path: '/local-music/' + encodeURIComponent(p) }
  }

  // Bare filename -> treat as /downloads/
  return { ...track, path: '/downloads/' + safeFilename(p) }
}

/**
 * Normalize all tracks in a playlist.
 */
export function normalizePlaylist(tracks) {
  if (!Array.isArray(tracks)) return tracks
  return tracks.map(normalizeTrackPath)
}

/**
 * Convert a track object to a playback URL.
 * Mirrors the logic in Room.vue currentTrackSrc and room.js tryPlay.
 * Always produces a safe URL -- call normalizeTrackPath on the track first
 * if you are not sure its path is safe.
 */
export function trackPathToUrl(track) {
  if (!track) return ''
  if (track.blobUrl) return track.blobUrl
  if (track.url) return track.url
  if (!track.path) return ''

  const p = track.path
  if (p.startsWith('/downloads/') || p.startsWith('/local-music/')) {
    return p
  }
  if (p.match(/^[A-Z]:/i) || p.startsWith('/')) {
    return '/local-music/' + encodeURIComponent(p)
  }
  return '/downloads/' + p
}
