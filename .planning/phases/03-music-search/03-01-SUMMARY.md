---
phase: 03-music-search
plan: "01"
subsystem: frontend
tags: [music-search, playback, download, yt-dlp]
dependency_graph:
  requires:
    - 01-02-PLAN (frontend state management)
    - backend /api/music/search
    - backend /api/music/browser-download
  provides:
    - Search-to-playback flow (host)
    - Download progress indication
  affects:
    - frontend/src/views/Room.vue
    - frontend/src/components/MusicParser.vue
tech_stack:
  added:
    - browserDownload API integration
    - downloadingId state for progress tracking
    - play-now event for direct play from search results
key_files:
  created: []
  modified:
    - frontend/src/views/Room.vue
    - frontend/src/components/MusicParser.vue
decisions:
  - id: search-then-play
    decision: Host search result play triggers browserDownload first, then adds to playlist with /local-music/{filename} URL
    rationale: Search results don't have direct URLs; yt-dlp downloads first to make them playable
key_metrics:
  duration_minutes: 5
  completed_date: "2026-04-02T14:36:00Z"
  tasks_completed: 3
---

# Phase 03 Plan 01 Summary: Music Search to Playback Flow

## Objective
实现音乐搜索与播放的完整流程：搜索 -> 下载 -> 播放。当用户点击播放按钮时，触发后端下载歌曲（yt-dlp），然后通过 AudioPlayer 播放本地文件。

## One-liner
Search results now have a "Play" button that downloads via yt-dlp then plays immediately.

## Completed Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | 实现搜索结果直接播放 | e17e8a2 | Room.vue, MusicParser.vue |
| 2 | 添加播放状态指示器 | e17e8a2 | Room.vue, MusicParser.vue |
| 3 | 验证完整播放流程 | e17e8a2 | (verification passed) |

## What Was Built

### Task 1: Search Result Direct Play
- Added `play-now` event to MusicParser component
- When host clicks "Play" on a search result:
  1. Calls `browserDownload(title, artist)` API
  2. API returns `{ success: true, filename }` pointing to downloaded file
  3. Song added to playlist with `url: /local-music/{encoded_filename}`
  4. Emits `playback:play` to socket for sync
  5. `playerStore.setPlaying(true)` starts playback

### Task 2: Download Progress Indicator
- Added `downloadingId` ref in Room.vue (tracks which song ID is downloading)
- Added `downloadingId` prop to MusicParser
- Play button shows loader spinner and "下载中" text when `downloadingId === song.id`
- Button is disabled during download to prevent double-clicks

### Task 3: Verification
- Backend /api/music/search works (returns results)
- Backend /api/music/browser-download works (responds with download result)
- Frontend build passes (no errors)
- Frontend dev server starts successfully

## Deviations from Plan
None - plan executed as written.

## Known Limitations
- yt-dlp download quality depends on keyword matching; some songs may return "未找到可下载内容"
- Download path assumes single mp3/flac file in download directory

## Verification Evidence
- `npm run build` in frontend: succeeds (6.07s, 1844 modules)
- Backend search API: returns results
- Backend browser-download API: responds correctly
- Frontend dev server: starts on port 3000

## Self-Check: PASSED
- Room.vue changes verified via grep
- MusicParser.vue changes verified via grep
- Commit e17e8a2 confirmed in git log
