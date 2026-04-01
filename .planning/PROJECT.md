# SyncMusic - 一起听音乐应用

## What This Is

一个支持多人实时同步听歌和音乐下载的 Web 应用。用户可以创建房间邀请朋友一起听歌，或通过解析 QQ音乐/网易云/酷狗的歌单链接下载 VIP 音乐（通过第三方平台搜索音频流）。

## Core Value

让朋友无论身在何处都能一起享受音乐——实时同步、同步播放。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 用户可创建音乐房间并分享链接给朋友
- [ ] 房间内所有用户同步播放进度（房主控制）
- [ ] 支持 QQ音乐、网易云音乐、酷狗音乐的歌单/单曲链接解析
- [ ] 从解析出的歌名+歌手信息后台搜索 YouTube/B站 获取音频
- [ ] 使用 yt-dlp 提取音频流供下载/播放
- [ ] 用户可下载歌曲为本地音频文件
- [ ] 支持播放列表管理和历史记录

### Out of Scope

- 公开注册/用户系统 — 房间以链接形式分享，无需账号
- 音乐评论、点赞等社交功能
- VIP 会员管理（直接绕过 VIP 限制）
- 移动端 App（仅 Web 端）

## Context

- 用户通过第三方平台（YouTube/B站）绕过 VIP 限制，实现「曲线救国」
- 音乐搜索和音频提取在后端执行，前端仅负责展示
- yt-dlp 需要在服务器环境运行，需兼容 Windows
- 使用 WebSocket 实现房间内播放状态同步

## Constraints

- **技术栈**：Vue.js + Vite（前端），Node.js + Express（后端）
- **实时同步**：Socket.io
- **音频处理**：后端 yt-dlp
- **存储**：SQLite（轻量，无需额外部署）
- **平台**：Windows 环境

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 通过第三方平台获取音频 | 直接爬取 VIP 音乐难度大且不稳定 | — Pending |
| 纯房间邀请制，无需账号 | 简化流程，朋友直接点链接加入 | — Pending |
| 房主控制播放 | 避免多人控制冲突 | — Pending |

---

*Last updated: 2026-04-01 after initialization*
