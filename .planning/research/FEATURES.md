# Feature Landscape

**Domain:** Real-time music synchronization app
**Researched:** 2026-04-01

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Room creation | Core value prop | Low | Shareable link, no auth |
| Room joining | Core value prop | Low | URL-based, no account |
| Play/pause sync | Core value prop | Medium | Host controls, all follow |
| Progress sync | Core value prop | Medium | Continuous position updates |
| Music search | Core value prop | Medium | Query YouTube/BiliBili |
| Audio playback | Core value prop | Low | Howler.js handles cross-browser |
| Download audio | Core value prop | Medium | yt-dlp + FFmpeg pipeline |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Playlist queue | Continuous listening | Medium | Add/remove/reorder songs |
| Skip synchronization | Host + listeners vote | Medium | Democracy in sync |
| Auto-skip沉默内容 | Better experience | High | Detect and skip non-music |
| Multiple source fallback | Reliability | High | YouTube fails, try BiliBili |
| Cross-room chat | Social engagement | Low | Simple text chat |
| Queue management | Organization | Medium | Drag-drop reorder |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| User accounts | Scope creep | Room links are identity enough |
| Social likes/comments | Out of scope | Focus on sync quality |
| Mobile app | Development cost | Web-only MVP |
| Video playback | Complex sync | Audio-only focus |
| Payment/VIP | Legal/complexity | Free, ad-free experience |

## Feature Dependencies

```
Room Creation → Room Discovery (optional)
                   ↓
Music Search → Audio Extraction → Playback
                   ↓
Playlist Queue → Playback Sync
                   ↓
Room Sync → WebSocket Events → All Clients
```

## MVP Recommendation

Prioritize:
1. Room creation with shareable link (table stakes)
2. Music search via YouTube/BiliBili (core value)
3. Play/pause sync for all users (core value)
4. Audio playback with progress bar (core value)
5. Download as MP3 (stated requirement)

Defer:
- Skip voting: adds complexity without clear ROI
- Auto-skip silence: high complexity, niche benefit
- Multiple source fallback: build one working path first

## Sources

- Competitor analysis: Spotify Together, ListenTogether apps
- User research: PROJECT.md requirements
