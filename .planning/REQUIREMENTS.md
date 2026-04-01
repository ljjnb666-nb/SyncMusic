# Requirements: SyncMusic

**Defined:** 2026-04-01
**Core Value:** 让朋友无论身在何处都能一起享受音乐——实时同步、同步播放

## v1 Requirements

### Authentication

*(None - room links serve as identity, no user accounts)*

### Room Management

- [x] **ROOM-01**: User can create a new room with a custom name
- [x] **ROOM-02**: User receives a shareable room link (URL with room ID)
- [x] **ROOM-03**: User can join a room via link without registration
- [p] **ROOM-04**: Room displays list of current participants (state ready, UI pending 01-03)
- [p] **ROOM-05**: Room host is identified visually; host controls playback (state ready, UI pending 01-03)
- [x] **ROOM-06**: If host disconnects, next participant becomes host

### Real-time Sync

- [ ] **SYNC-01**: When host plays, all participants' audio starts simultaneously
- [ ] **SYNC-02**: When host pauses, all participants' audio pauses
- [ ] **SYNC-03**: When host seeks, all participants' playback position updates
- [ ] **SYNC-04**: Progress bar shows current position for all participants
- [ ] **SYNC-05**: Sync uses server-authoritative timestamps (not relative offsets)
- [ ] **SYNC-06**: If drift > 2 seconds, automatic resync triggers

### Music Search & Sources

- [ ] **MUSIC-01**: User can paste QQ Music playlist/song URL for parsing
- [ ] **MUSIC-02**: User can paste NetEase Cloud Music playlist/song URL for parsing
- [ ] **MUSIC-03**: User can paste Kugou Music playlist/song URL for parsing
- [ ] **MUSIC-04**: Parsing extracts: song name, artist name, duration
- [ ] **MUSIC-05**: User can search for songs by name + artist
- [ ] **MUSIC-06**: Search queries YouTube for matching audio
- [ ] **MUSIC-07**: Search queries Bilibili for matching audio
- [ ] **MUSIC-08**: Search results display: title, artist, duration, source, thumbnail
- [ ] **MUSIC-09**: User can select a search result to play or add to queue

### Audio Playback

- [ ] **PLAY-01**: Audio plays via Howler.js (cross-browser compatible)
- [ ] **PLAY-02**: Playback controls: play, pause, seek (via host only)
- [ ] **PLAY-03**: Volume control (individual, not synced)
- [ ] **PLAY-04**: Current track displays: title, artist, artwork/thumbnail

### Playlist & Queue

- [ ] **QUEUE-01**: User can add tracks to room queue
- [ ] **QUEUE-02**: Room queue displays upcoming tracks
- [ ] **QUEUE-03**: Host can reorder or remove tracks from queue
- [ ] **QUEUE-04**: When track ends, next in queue plays automatically

### Download

- [ ] **DOWN-01**: User can download current track as MP3 file
- [ ] **DOWN-02**: Download uses yt-dlp for audio extraction
- [ ] **DOWN-03**: Server transcodes audio to MP3 if needed
- [ ] **DOWN-04**: Download shows progress indicator
- [ ] **DOWN-05**: If extraction fails, user sees clear error message
- [ ] **DOWN-06**: Extraction retries 3x with exponential backoff on failure

### History

- [ ] **HIST-01**: Recently played tracks are saved to history
- [ ] **HIST-02**: User can view and re-play from history

## v2 Requirements

### Persistence
- **PERS-01**: Rooms persist across server restarts (SQLite)
- **PERS-02**: User favorites (starred tracks)
- **PERS-03**: Room settings persistence (name, queue)

### Advanced
- **ADV-01**: Multiple source fallback (YouTube fails → try Bilibili)
- **ADV-02**: Cross-room chat (text messages)
- **ADV-03**: Skip voting (participants vote to skip current track)

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / registration | Room links provide identity; complexity not justified |
| Social features (comments, likes) | Focus on sync quality, not social |
| Mobile native app | Web-only MVP |
| Payment / monetization | Free, ad-free experience |
| Video playback | Audio-only focus |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ROOM-01 | Phase 1 | Complete |
| ROOM-02 | Phase 1 | Complete |
| ROOM-03 | Phase 1 | Complete |
| ROOM-04 | Phase 1 | In Progress (01-02 done, 01-03 pending) |
| ROOM-05 | Phase 1 | In Progress (01-02 done, 01-03 pending) |
| ROOM-06 | Phase 1 | Complete |
| SYNC-01 | Phase 2 | Pending |
| SYNC-02 | Phase 2 | Pending |
| SYNC-03 | Phase 2 | Pending |
| SYNC-04 | Phase 2 | Pending |
| SYNC-05 | Phase 2 | Pending |
| SYNC-06 | Phase 2 | Pending |
| MUSIC-01 | Phase 3 | Pending |
| MUSIC-02 | Phase 3 | Pending |
| MUSIC-03 | Phase 3 | Pending |
| MUSIC-04 | Phase 3 | Pending |
| MUSIC-05 | Phase 3 | Pending |
| MUSIC-06 | Phase 3 | Pending |
| MUSIC-07 | Phase 3 | Pending |
| MUSIC-08 | Phase 3 | Pending |
| MUSIC-09 | Phase 3 | Pending |
| PLAY-01 | Phase 2 | Pending |
| PLAY-02 | Phase 2 | Pending |
| PLAY-03 | Phase 2 | Pending |
| PLAY-04 | Phase 2 | Pending |
| QUEUE-01 | Phase 4 | Pending |
| QUEUE-02 | Phase 4 | Pending |
| QUEUE-03 | Phase 4 | Pending |
| QUEUE-04 | Phase 4 | Pending |
| DOWN-01 | Phase 5 | Pending |
| DOWN-02 | Phase 5 | Pending |
| DOWN-03 | Phase 5 | Pending |
| DOWN-04 | Phase 5 | Pending |
| DOWN-05 | Phase 5 | Pending |
| DOWN-06 | Phase 5 | Pending |
| HIST-01 | Phase 4 | Pending |
| HIST-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 after initial definition*
