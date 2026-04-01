# Roadmap: SyncMusic

## Overview

SyncMusic enables friends to listen to music together in real-time from anywhere. Users create rooms, share links, and the host controls synchronized playback while all participants hear the same moment in the song. Music is sourced from YouTube/Bilibili via yt-dlp extraction, bypassing VIP restrictions. The journey progresses from room foundation through real-time sync, music sourcing, queue management, and finally download capability.

## Phases

- [ ] **Phase 1: Room Management** - Create/join rooms via links, no registration required
- [ ] **Phase 2: Real-time Sync + Audio Playback** - Host controls playback, all participants synchronized
- [ ] **Phase 3: Music Search & Sources** - Parse music links, search YouTube/Bilibili, extract audio
- [ ] **Phase 4: Playlist Queue + History** - Manage upcoming tracks, access played history
- [ ] **Phase 5: Download** - Download current track as MP3 via yt-dlp extraction

## Phase Details

### Phase 1: Room Management
**Goal**: Users can create and join music rooms via shareable links without registration
**Depends on**: Nothing (first phase)
**Requirements**: ROOM-01, ROOM-02, ROOM-03, ROOM-04, ROOM-05, ROOM-06
**Success Criteria** (what must be TRUE):
  1. User can create a named room and immediately receive a shareable URL link
  2. Any user with the room link can join without creating an account or logging in
  3. Room UI displays all current participants in real-time as they join/leave
  4. The room host is visually distinguished from regular participants
  5. When the host disconnects, the next participant automatically becomes the new host
  6. Room state persists in SQLite across server restarts (PERS-01 enables this)
**Plans**: 3 plans created

Plans:
- [x] 01-01: Backend foundation - REST API, RoomService, RoomManager, Socket.io handlers
- [x] 01-02: Frontend state - Pinia store, session management, API client, Socket client
- [ ] 01-03: Frontend UI - Home view, Room view, ParticipantList, Vue Router

### Phase 2: Real-time Sync + Audio Playback
**Goal**: Room host controls playback and all participants stay synchronized to the same moment
**Depends on**: Phase 1
**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05, SYNC-06, PLAY-01, PLAY-02, PLAY-03, PLAY-04
**Success Criteria** (what must be TRUE):
  1. When host clicks play, all participants' audio starts within 100ms of each other
  2. When host clicks pause, all participants' audio pauses simultaneously
  3. When host seeks to a position, all participants' playback position updates
  4. Every participant sees the same current playback position in the progress bar
  5. Sync uses server-authoritative timestamps (not relative offsets) to prevent drift accumulation
  6. If any participant's position drifts more than 2 seconds from host, automatic resync triggers
  7. Audio playback works consistently in Chrome, Firefox, Safari, and Edge (Howler.js)
  8. Each user can independently adjust their own volume without affecting others
  9. The current track displays title, artist name, and album artwork/thumbnail
  10. Only the host can trigger play/pause/seek; regular participants see controls disabled
**Plans**: TBD

Plans:
- [ ] 02-01: [Brief description]
- [ ] 02-02: [Brief description]
- [ ] 02-03: [Brief description]
- [ ] 02-04: [Brief description]
- [ ] 02-05: [Brief description]
- [ ] 02-06: [Brief description]
- [ ] 02-07: [Brief description]
- [ ] 02-08: [Brief description]
- [ ] 02-09: [Brief description]
- [ ] 02-10: [Brief description]

### Phase 3: Music Search & Sources
**Goal**: Users can paste music platform links or search by name to find and play audio from YouTube/Bilibili
**Depends on**: Phase 2
**Requirements**: MUSIC-01, MUSIC-02, MUSIC-03, MUSIC-04, MUSIC-05, MUSIC-06, MUSIC-07, MUSIC-08, MUSIC-09
**Success Criteria** (what must be TRUE):
  1. User can paste a QQ Music playlist or single track URL and parsing succeeds
  2. User can paste a NetEase Cloud Music playlist or single track URL and parsing succeeds
  3. User can paste a Kugou Music playlist or single track URL and parsing succeeds
  4. Parsed results display song name, artist name, and duration for each track
  5. User can search by entering song name plus optional artist name
  6. Search queries YouTube and returns matching audio results
  7. Search queries Bilibili and returns matching audio results
  8. Search results show title, artist, duration, source platform, and thumbnail for each item
  9. User can click any search result to play it immediately or add it to the room queue
**Plans**: TBD

Plans:
- [ ] 03-01: [Brief description]
- [ ] 03-02: [Brief description]
- [ ] 03-03: [Brief description]
- [ ] 03-04: [Brief description]
- [ ] 03-05: [Brief description]
- [ ] 03-06: [Brief description]
- [ ] 03-07: [Brief description]
- [ ] 03-08: [Brief description]
- [ ] 03-09: [Brief description]

### Phase 4: Playlist Queue + History
**Goal**: Users can manage upcoming tracks and revisit previously played songs
**Depends on**: Phase 3
**Requirements**: QUEUE-01, QUEUE-02, QUEUE-03, QUEUE-04, HIST-01, HIST-02
**Success Criteria** (what must be TRUE):
  1. Any user (not just host) can add tracks to the room queue
  2. The queue panel displays all upcoming tracks in their play order
  3. The host can drag to reorder tracks or remove any track from the queue
  4. When the current track finishes, the next track in queue plays automatically without gaps
  5. Tracks that have finished playing are saved to the room history
  6. Any user can open the history panel and click a past track to replay it
**Plans**: TBD

Plans:
- [ ] 04-01: [Brief description]
- [ ] 04-02: [Brief description]
- [ ] 04-03: [Brief description]
- [ ] 04-04: [Brief description]
- [ ] 04-05: [Brief description]
- [ ] 04-06: [Brief description]

### Phase 5: Download
**Goal**: Users can download the current track as an MP3 file to their device
**Depends on**: Phase 4
**Requirements**: DOWN-01, DOWN-02, DOWN-03, DOWN-04, DOWN-05, DOWN-06
**Success Criteria** (what must be TRUE):
  1. User can click a download button to save the current track as an MP3 file
  2. The server uses yt-dlp to extract the audio stream from YouTube or Bilibili
  3. If the extracted audio is not already MP3 format, the server transcodes it to MP3
  4. The UI shows a progress bar indicating download/extraction percentage
  5. If audio extraction fails, the user sees a clear error message explaining the failure
  6. If extraction fails, the system retries up to 3 times with exponential backoff (2s, 4s, 8s) before giving up
**Plans**: TBD

Plans:
- [ ] 05-01: [Brief description]
- [ ] 05-02: [Brief description]
- [ ] 05-03: [Brief description]
- [ ] 05-04: [Brief description]
- [ ] 05-05: [Brief description]
- [ ] 05-06: [Brief description]

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Room Management | 2/3 | In Progress|  |
| 2. Real-time Sync + Audio Playback | 0/10 | Not started | - |
| 3. Music Search & Sources | 0/9 | Not started | - |
| 4. Playlist Queue + History | 0/6 | Not started | - |
| 5. Download | 0/6 | Not started | - |

## Technical Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Frontend | Vue 3 + Vite + TailwindCSS | Modern reactive UI |
| Audio Playback | Howler.js | Cross-browser WebAudio with fallback |
| Real-time | Socket.io | WebSocket with auto-reconnect |
| REST API | Express.js | Simple Node.js server |
| Audio Extraction | yt-dlp + FFmpeg | YouTube/Bilibili audio extraction |
| Database | SQLite (better-sqlite3) | Lightweight, no separate server needed |
| Platform | Windows | User environment |

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Server-authoritative timestamps for sync | Prevents drift accumulation that plague relative-offset approaches |
| yt-dlp for audio extraction | Battle-tested, supports YouTube/Bilibili, active maintenance |
| Howler.js for playback | Best cross-browser audio support with WebAudio fallback |
| Host-controlled playback | Avoids conflict when multiple users try to control simultaneously |
| Room-link identity (no accounts) | Removes friction; friends just click a link to join |

---

*Roadmap created: 2026-04-01*
