<!-- GSD:project-start source:PROJECT.md -->
## Project

**SyncMusic - 一起听音乐应用**

一个支持多人实时同步听歌和音乐下载的 Web 应用。用户可以创建房间邀请朋友一起听歌，或通过解析 QQ音乐/网易云/酷狗的歌单链接下载 VIP 音乐（通过第三方平台搜索音频流）。

**Core Value:** 让朋友无论身在何处都能一起享受音乐——实时同步、同步播放。

### Constraints

- **技术栈**：Vue.js + Vite（前端），Node.js + Express（后端）
- **实时同步**：Socket.io
- **音频处理**：后端 yt-dlp
- **存储**：SQLite（轻量，无需额外部署）
- **平台**：Windows 环境
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
# Frontend
# Backend
## Key Library Justifications
### Why Howler.js over native Audio
| Feature | Howler.js | Native Audio |
|---------|-----------|--------------|
| Cross-browser | Yes | Requires polyfills |
| Sprite support | Yes | No |
| Spatial audio | Yes | Limited |
| Unlocking | Automatic | Manual gesture required |
| Pause sync | Built-in | Manual coordination needed |
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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
