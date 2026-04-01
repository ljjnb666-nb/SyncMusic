# Architecture Patterns: Music Sync Applications

**Project:** SyncMusic
**Researched:** 2026-04-01
**Confidence:** MEDIUM (based on established patterns; no existing codebase to reverse-engineer)

---

## 1. Frontend-Backend Communication Patterns

### 1.1 REST API (Synchronous Operations)

For discrete operations (not real-time):

| Endpoint Pattern | Purpose |
|-----------------|---------|
| `POST /api/rooms` | Create a new room |
| `GET /api/rooms/:id` | Get room metadata |
| `POST /api/parse` | Parse music platform URLs |
| `GET /api/search` | Search for tracks |
| `GET /api/download/:trackId` | Download track |
| `GET /api/stream/:trackId` | Stream audio |

**Technology:** Express.js with JSON responses

### 1.2 WebSocket (Real-Time Sync)

For room state synchronization:

```
Client connects:  wss://server/room/:roomId?token=xxx
```

**Events emitted by server:**

| Event | Payload | Purpose |
|-------|---------|---------|
| `room:state` | Full room state | Initial sync on join |
| `room:join` | `{ userId, username }` | User joined notification |
| `room:leave` | `{ userId }` | User left notification |
| `player:play` | `{ trackId, position, timestamp }` | Playback started |
| `player:pause` | `{ position }` | Playback paused |
| `player:seek` | `{ position }` | Seek event |
| `player:track` | `{ track }` | Track changed |
| `playlist:update` | `{ tracks }` | Playlist modified |
| `sync:heartbeat` | `{ serverTime }` | Latency measurement |

**Events emitted by client:**

| Event | Payload | Purpose |
|-------|---------|---------|
| `player:control` | `{ action: 'play'\|'pause'\|'seek', position? }` | Control playback |
| `playlist:add` | `{ track }` | Add track to playlist |
| `playlist:remove` | `{ trackId }` | Remove from playlist |

### 1.3 Hybrid Architecture

```
                    REST API                      WebSocket
    ┌──────────────┴──────────────┐    ┌─────────┴─────────┐
    │                             │    │                    │
    ▼                             ▼    ▼                    ▼
┌────────┐   ┌────────┐   ┌────────────┐        ┌────────────────┐
│ Search │   │ Parse  │   │ Room CRUD  │        │ Real-time Sync │
│ Download│   │ Playlists│  │ Management │        │ Player State   │
└────────┘   └────────┘   └────────────┘        └────────────────┘
```

**Rationale:** WebSocket is expensive (persistent connections). Use it only for:
- Player state (play/pause/seek/position)
- Room membership changes
- Playlist mutations

Use REST for:
- Initial room join (fetch full state)
- Search queries
- Download initiation

---

## 2. Room State Management

### 2.1 Room State Schema

```javascript
{
  id: string,              // UUID
  name: string,            // "John's Room"
  createdAt: timestamp,
  hostId: string,          // User who controls playback
  isPlaying: boolean,
  currentTrack: {
    id: string,
    title: string,
    artist: string,
    duration: number,      // seconds
    source: 'youtube' | 'bilibili',
    streamUrl: string,     // internal
    artwork: string        // thumbnail URL
  } | null,
  position: number,        // Current playback position in seconds
  positionUpdatedAt: timestamp, // For drift correction
  playlist: Track[],
  participants: [{
    id: string,
    username: string,
    joinedAt: timestamp,
    isHost: boolean
  }]
}
```

### 2.2 Position Synchronization Algorithm

**The Problem:** Network latency causes desync between participants.

**Solution: Server-authoritative time correction**

```
1. Host presses play
2. Server records: { action: 'play', serverTime: T_server, position: 0 }
3. Server broadcasts to all clients
4. Each client calculates expected position:
   localPosition = (T_clientNow - T_server) * playbackRate + initialPosition
5. Clients drift-adjust their local position smoothly (not jump)
```

**Drift Tolerance:** If drift > 2 seconds, trigger resync.

### 2.3 Conflict Resolution

**Problem:** What if non-host tries to control playback?

**Rule:** Only host can emit `player:control` events. Server ignores these from non-hosts.

**Graceful transfer:** If host leaves, assign host to next participant (longest tenure).

---

## 3. Audio Streaming Architecture

### 3.1 Architecture Options

| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| **Direct streaming** | Simple | Blocks download | < 10 users |
| **Segmented streaming** | Scalable | Complex | > 50 users |
| **Progressive download + range requests** | HTTP caching | No live sync | Medium scale |

### 3.2 Recommended: Proxy Streaming with Range Support

```
┌─────────┐    ┌─────────────┐    ┌──────────────────┐
│ yt-dlp  │───▶│   Server     │◀───│   Range Requests │
│ YouTube │    │ (Express)    │───▶│   Support        │
└─────────┘    │              │    └──────────────────┘
               │  - Caches    │
               │  - Transcodes│
               └──────────────┘
```

**Flow:**
1. yt-dlp extracts audio stream URL from YouTube/BiliBili
2. Server downloads audio to temp file (or pipes)
3. Server serves audio to clients with `Accept-Ranges` headers
4. Clients can seek without re-downloading entire file

### 3.3 Streaming Cache Strategy

```javascript
// LRU cache with disk backing
const streamCache = new LRUCache({
  max: 50,           // 50 tracks in memory
  maxAge: 1000 * 60 * 30,  // 30 minutes
  dispose: (key, value) => {
    // Clean up temp file when evicted
    fs.unlink(value.filePath)
  }
})
```

### 3.4 Download vs Streaming

| | Download | Streaming |
|-|----------|-----------|
| **Endpoint** | `GET /download/:id` | `GET /stream/:id` |
| **Response** | `Content-Disposition: attachment` | `Content-Type: audio/mpeg` |
| **Progress** | Complete file, progress bar | Progressive, chunked |
| **Use** | User saves locally | Real-time playback |

---

## 4. Search and Download Pipeline

### 4.1 Music Link Parsing

```
Input: https://y.qq.com/n/rym/song/1234567
         │
         ▼
┌─────────────────┐
│  Parser Router  │
│  (URL detector) │
└────────┬────────┘
         │
    ┌────┴────┬────────────┐
    ▼         ▼            ▼
┌───────┐ ┌────────┐ ┌────────┐
│QQ音乐 │ │网易云   │ │酷狗    │
└───┬───┘ └───┬────┘ └───┬────┘
    │         │          │
    ▼         ▼          ▼
 Extract: title, artist, album, duration
```

**Output:**
```javascript
{
  platform: 'qq',
  type: 'song',
  title: 'Song Name',
  artist: 'Artist Name',
  album: 'Album Name',
  duration: 240,
  externalId: '1234567'
}
```

### 4.2 Search Pipeline

```
1. Parse user input (song name + artist)
         │
         ▼
2. Search YouTube:    yt-dlp --search "song artist"
         │
         ▼
3. Search Bilibili:  yt-dlp --search "song artist site:bilibili.com"
         │
         ▼
4. Deduplicate results by title similarity
         │
         ▼
5. Return ranked results (prefer higher quality/shorter)
```

**Search Result Schema:**
```javascript
{
  id: string,           // Internal ID (hash of source+externalId)
  title: string,
  artist: string,
  duration: number,
  source: 'youtube' | 'bilibili',
  externalId: string,   // YouTube/BiliBili video ID
  thumbnail: string,
  url: string,          // Direct link
  quality: 'high' | 'medium' | 'low'
}
```

### 4.3 Download Pipeline

```
User clicks "Download"
         │
         ▼
┌─────────────────────────────────┐
│  1. Check cache                 │
│     - Already downloaded?       │
│       - Return cached file      │
│     - Currently downloading?    │
│       - Attach to existing      │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│  2. Extract stream URL          │
│     yt-dlp -f bestaudio          │
│     --get-url [url]              │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│  3. Download audio               │
│     - Pipe to temp file          │
│     - Track progress             │
│     - Notify connected clients   │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│  4. Post-process                  │
│     - Extract metadata           │
│     - Generate filename          │
│     - Move to downloads folder   │
└───────────────┬─────────────────┘
                ▼
         Return file path
```

### 4.4 Error Handling

| Error | Handling |
|-------|----------|
| Video unavailable | Return 410, suggest alternative |
| Age-restricted content | Return 403, explain limitation |
| Download fails mid-stream | Retry 3x with exponential backoff |
| Rate limited | Queue with delay, notify user |
| Unsupported platform | Return 400 with supported platforms |

---

## 5. Component Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vue.js)                        │
├─────────────┬─────────────┬──────────────┬──────────────────────┤
│  RoomView   │ PlayerStore │ PlaylistStore│  WebSocket Client   │
└──────┬──────┴──────┬──────┴───────┬──────┴──────────┬───────────┘
       │             │              │                  │
       │  REST API   │              │  WebSocket       │
       │  (HTTP)     │              │  (Socket.io)     │
       ▼             ▼              ▼                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                         BACKEND (Node.js)                         │
├─────────────┬─────────────┬─────────────┬────────────────────────┤
│  RoomRoutes │ MusicRoutes │ ParseRoutes │  SocketHandlers        │
└──────┬──────┴──────┬──────┴──────┬──────┴───────────┬────────────┘
       │             │             │                   │
       ▼             ▼             ▼                   ▼
┌────────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────────┐
│ RoomService│ │SearchSvc  │ │ParseSvc   │ │ RoomStateManager    │
│            │ │(yt-dlp)   │ │(URL parse)│ │ (in-memory + Redis) │
└─────┬──────┘ └─────┬─────┘ └─────┬─────┘ └──────────┬──────────┘
      │             │             │                   │
      ▼             ▼             ▼                   ▼
┌────────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────────┐
│   SQLite   │ │ yt-dlp    │ │  Third-   │ │  WebSocket          │
│  (rooms,   │ │ process   │ │  party    │ │  connections        │
│  history)  │ │           │ │  APIs     │ │                     │
└────────────┘ └───────────┘ └───────────┘ └─────────────────────┘
```

---

## 6. Data Flow Diagrams

### 6.1 Room Creation Flow

```
User clicks "Create Room"
         │
         ▼
Frontend: POST /api/rooms { name: "My Room" }
         │
         ▼
Backend:
  1. Generate roomId (UUID)
  2. Create room state (in-memory)
  3. Insert into SQLite (metadata)
  4. Return { roomId, inviteCode }
         │
         ▼
Frontend: Connect WebSocket /room/:roomId
         │
         ▼
Backend: Emit 'room:state' with full state
```

### 6.2 Playback Sync Flow

```
Host clicks Play
         │
         ▼
Frontend: socket.emit('player:control', { action: 'play', position: 0 })
         │
         ▼
Backend:
  1. Verify sender is host
  2. Update room state (isPlaying: true, positionUpdatedAt: now)
  3. Broadcast to all room participants
         │
         ▼
All clients receive 'player:play' event
         │
         ▼
Each client:
  1. Start local audio playback
  2. Begin drift-correction loop
  3. Update UI
```

### 6.3 Track Download Flow

```
User pastes QQ Music link
         │
         ▼
Frontend: POST /api/parse { url: "https://y.qq.com/..." }
         │
         ▼
Backend: ParseService.extract(url)
  1. Detect platform (QQ/网易云/酷狗)
  2. Extract track metadata
  3. Return { title, artist, platform, externalId }
         │
         ▼
Frontend: Display parsed track, user clicks "Get Audio"
         │
         ▼
Frontend: POST /api/search { title: "...", artist: "..." }
         │
         ▼
Backend: SearchService.search(title, artist)
  1. yt-dlp YouTube search
  2. yt-dlp Bilibili search
  3. Deduplicate and rank
  4. Return results
         │
         ▼
Frontend: User selects result, clicks Play/Download
         │
         ▼
Backend:
  - Stream: yt-dlp extracts URL, proxies stream
  - Download: yt-dlp downloads, saves to disk
```

---

## 7. Scalability Considerations

| Scale | Room Storage | WebSocket | Streaming |
|-------|--------------|-----------|-----------|
| < 50 rooms | In-memory | Single server | Single server |
| 50-200 rooms | In-memory + periodic SQLite backup | Single server | Single server with caching |
| 200-1000 rooms | Redis | Redis adapter | Dedicated streaming servers |
| > 1000 rooms | Redis + sharding | Redis cluster | CDN + origin servers |

**SyncMusic target:** Single server (< 50 concurrent rooms)

---

## 8. Anti-Patterns to Avoid

### 8.1 Don't Sync Audio Data Over WebSocket
**Bad:** Sending audio chunks through Socket.io
**Why:** WebSocket is not designed for streaming large binary data
**Instead:** Use HTTP range requests for audio streaming

### 8.2 Don't Trust Client Position
**Bad:** Accepting `position` from client as ground truth
**Why:** Clients can lie or have drift
**Instead:** Server tracks authoritative position, clients correct to it

### 8.3 Don't Store Audio in Database
**Bad:** Storing audio files as blobs in SQLite
**Why:** Database bloat, no streaming support
**Instead:** Store audio files on disk, paths in database

### 8.4 Don't Block on yt-dlp
**Bad:** `await yt-dlp(url)` blocking the request thread
**Why:** Single thread blocks, timeouts
**Instead:** Spawn child process, stream events to client

---

## 9. Technology Decisions (from PROJECT.md)

| Component | Decision | Rationale |
|-----------|----------|-----------|
| Frontend | Vue.js + Vite | Per PROJECT.md |
| Backend | Node.js + Express | Per PROJECT.md |
| Real-time | Socket.io | Per PROJECT.md, battle-tested |
| Audio extraction | yt-dlp | Per PROJECT.md, best open-source option |
| Database | SQLite | Per PROJECT.md, zero-config |
| Platform | Windows | Per PROJECT.md |

---

## Sources

- **Socket.io Documentation:** https://socket.io/docs/v4
- **yt-dlp Documentation:** https://github.com/yt-dlp/yt-dlp
- **Vue.js Architecture Patterns:** Established community patterns
- **HTTP Range Requests:** RFC 7233
- **Real-time Game Sync Patterns:** Industry-standard approaches for position reconciliation
