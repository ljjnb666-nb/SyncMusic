# Research Summary: SyncMusic

**Domain:** Real-time music synchronization app
**Researched:** 2026-04-01
**Overall confidence:** HIGH

## Executive Summary

SyncMusic is a room-based music listening application where users can synchronize playback with friends remotely. The core technical challenge is maintaining audio sync across clients while extracting audio from YouTube/BiliBili via yt-dlp.

**Frontend:** Vue 3 + Vite + TailwindCSS + Howler.js (audio) + Socket.io Client
**Backend:** Node.js + Express + Socket.io + better-sqlite3 + yt-dlp + FFmpeg

The architecture follows a host-controlled sync model where only the room owner can control playback, and all clients receive sync events via WebSocket. Audio extraction happens server-side to handle yt-dlp complexity and FFmpeg conversion.

## Key Findings

**Stack:** Vue 3 (frontend) + Node.js/Express (backend) + Socket.io (real-time) + yt-dlp (audio extraction)

**Architecture:** Host-controlled room sync with server timestamps as source of truth

**Critical pitfall:** Audio sync drift without periodic re-sync events

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation** - Project setup, basic room creation/joining
   - Addresses: Room infrastructure, Socket.io integration basics
   - Avoids: Sync drift (not live yet)

2. **Core Sync** - Play/pause/progress synchronization
   - Addresses: Real-time sync, Howler.js integration
   - Avoids: Pitfall 1 (sync drift) by implementing server-time-sync from start

3. **Music Sources** - Search and audio extraction
   - Addresses: YouTube/BiliBili extraction, FFmpeg conversion
   - Avoids: Pitfall 2 (rate limiting) with caching layer

4. **Persistence** - SQLite storage for rooms, history, favorites
   - Addresses: Pitfall 5 (state loss on restart)
   - Avoids: Room disappearance after server restart

5. **Polish** - Download feature, queue management, error handling
   - Addresses: Full feature set from PROJECT.md

**Phase ordering rationale:**
- Foundation first (rooms are prerequisite)
- Core Sync second (this IS the product)
- Music Sources third (enables the content)
- Persistence fourth (reliability, not features)
- Polish last (refinement, not core value)

**Research flags for phases:**
- Phase 2 (Core Sync): Likely needs deeper research - implement server-time-sync pattern specifically
- Phase 3 (Music Sources): Likely needs deeper research - yt-dlp API changes, BiliBili extraction quirks
- Other phases: Standard patterns, unlikely to need additional research

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Well-established technologies, proven in similar apps |
| Features | HIGH | Clear from PROJECT.md requirements, standard for this app type |
| Architecture | HIGH | Host-controlled sync is standard pattern for Listen Together apps |
| Pitfalls | MEDIUM | Based on training data; WebSearch blocked so couldn't verify recent issues |

## Gaps to Address

- BiliBili-specific extraction quirks (需要实际测试)
- YouTube regional restrictions handling
- FFmpeg Windows installation UX (how to guide users)
- Actual rate limiting thresholds (need testing)

## Files Created

| File | Purpose |
|------|---------|
| .planning/research/STACK.md | Technology recommendations with rationale |
| .planning/research/FEATURES.md | Feature landscape and MVP scope |
| .planning/research/ARCHITECTURE.md | System structure and sync patterns |
| .planning/research/PITFALLS.md | Common mistakes and mitigations |
| .planning/research/SUMMARY.md | Executive summary with roadmap implications |
