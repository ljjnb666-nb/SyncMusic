# Technology Stack

**Project:** SyncMusic - Real-time music sync application
**Researched:** 2026-04-01
**Confidence:** HIGH (established technologies, well-documented patterns)

## Recommended Stack

### Frontend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vue.js | 3.4+ | UI framework | Composition API, excellent audio integration |
| Vite | 5.x | Build tool | Fast HMR, native ESM, optimal DX |
| TailwindCSS | 3.x | Styling | Utility-first, small bundle, rapid development |
| Pinia | 2.x | State management | Official Vue store, DevTools support |
| VueUse | 11.x | Vue utilities | useWebSocket, useEventListener, useStorage |
| Howler.js | 2.3.x | Audio playback | Cross-browser Web Audio, sprite support |
| Socket.io Client | 4.x | Real-time sync | Room abstraction, automatic reconnection |

### Backend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js | 20.x LTS | Runtime | Stable, excellent async I/O for real-time |
| Express | 4.x | HTTP server | Minimal, flexible, industry standard |
| Socket.io | 4.x | WebSocket | Room semantics perfect for music sync |
| better-sqlite3 | 11.x | Database | Synchronous API, fast, embedded |
| yt-dlp | latest | Audio extraction | Best YouTube/BiliBili downloader |
| fluent-ffmpeg | 2.x | FFmpeg wrapper | Audio conversion, stream processing |
| node-uuid | 9.x | ID generation | Room/user IDs |

### Infrastructure

| Technology | Purpose | Why |
|------------|---------|-----|
| FFmpeg | Audio processing | Convert to MP3, extract metadata |
| Windows-compatible | Primary target | yt-dlp works natively on Windows |

## Installation

```bash
# Frontend
cd frontend
npm create vite@latest . -- --template vue
npm install vue@latest pinia @vueuse/core socket.io-client howler
npm install -D tailwindcss postcss autoprefixer

# Backend
cd backend
npm init -y
npm install express socket.io better-sqlite3 fluent-ffmpeg node-uuid
npm install -D yt-dlp  # or install globally
```

## Key Library Justifications

### Why Howler.js over native Audio

| Feature | Howler.js | Native Audio |
|---------|-----------|--------------|
| Cross-browser | Yes | Requires polyfills |
| Sprite support | Yes | No |
| Spatial audio | Yes | Limited |
| Unlocking | Automatic | Manual gesture required |
| Pause sync | Built-in | Manual coordination needed |

**For music sync, Howler's `Howl` object gives precise `seek()` and `pause()` control.**

### Why better-sqlite3 over alternatives

- **Synchronous API**: Easier transaction management for single-file DB
- **Performance**: Fast reads/writes, ~10x faster than sql.js
- **Embedded**: No server process, single file DB
- **Alternatives considered**: sql.js (slow, no native bindings), mysql/postgresql (overkill)

### Why Socket.io over raw WebSocket

| Feature | Socket.io | Raw WS |
|---------|-----------|--------|
| Room abstraction | Built-in | Manual implementation |
| Auto-reconnection | Built-in | Manual |
| Fallback | Long-polling | None |
| Broadcast | Room-based | Manual filtering |

**Room-based architecture maps directly to music rooms.**

### Why yt-dlp

- Supports YouTube, BiliBili, 100+ sites
- Best extraction quality (avoids DASH manifests)
- Active maintenance
- Windows-compatible
- **Note**: Must handle rate limiting and CAPTCHA

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Audio | Howler.js | native Audio | Cross-browser issues, no sprites |
| Database | better-sqlite3 | mysql | Overkill for single-file, needs server |
| Download | yt-dlp | youtube-dl |yt-dlp is actively maintained fork |
| Real-time | Socket.io | raw WebSocket | Room semantics save implementation time |

## Sources

- [Socket.io Documentation](https://socket.io/docs/v4) - Room architecture
- [Howler.js Documentation](https://howlerjs.com/) - Audio playback API
- [yt-dlp GitHub](https://github.com/yt-dlp/yt-dlp) - CLI usage
- [TailwindCSS Docs](https://tailwindcss.com/docs) - Utility-first patterns
- [VueUse](https://vueuse.org/) - Composables for Vue 3
