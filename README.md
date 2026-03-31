# SyncMusic - 一起听音乐

基于 Vue 3 + Socket.IO 的实时音乐同步应用，支持多人一起听、本地音乐管理、收藏历史等功能。

![SyncMusic](home-page.png)

## 功能

### 音乐解析与下载
- 支持 QQ音乐、网易云音乐、酷狗音乐链接解析
- 多平台音乐搜索（QQ音乐/网易云/酷狗）
- 歌单解析与批量下载
- 支持多种音质：128k、320k、FLAC 无损

### 本地音乐管理
- 扫描本地音乐文件夹（支持 mp3/flac/m4a）
- 直接导入本地音乐文件（上传到服务器持久保存）
- 刷新页面后本地音乐列表自动恢复
- 播放列表持久化（localStorage）

### 一起听房间
- 创建/加入房间，与朋友实时同步播放
- 房主控制播放，听众自动同步
- 实时同步播放进度和歌词
- 房间发现功能（浏览正在开放的房间）

### 收藏与历史
- 收藏喜欢的歌曲
- 播放历史记录
- 数据持久化保存

### 播放功能
- 顺序播放、单曲循环、随机播放模式
- 进度条拖动调节
- 音量控制与静音
- 上一首/下一首切换

## 技术栈

### 前端
- Vue 3 (Composition API + Pinia)
- Vite
- Socket.IO Client
- Vue Router

### 后端
- Node.js + Express
- Socket.IO
- yt-dlp（音乐下载）
- ffprobe（音频元数据）

## 快速开始

### 环境要求
- Node.js 18+
- Python 3（用于 yt-dlp）
- ffmpeg（用于音视频处理）

### 后端启动
```bash
cd backend
npm install
node src/index.js
```
后端运行在 http://localhost:3001

### 前端启动
```bash
cd frontend
npm install
npm run dev
```
前端运行在 http://localhost:3000

### Docker 部署
```bash
docker-compose up -d
```

## 项目结构

```
SyncMusic/
├── backend/
│   ├── src/
│   │   ├── routes/          # API 路由
│   │   ├── services/         # 业务服务
│   │   ├── socket/           # Socket.IO 处理
│   │   └── index.js          # 入口文件
│   ├── downloads/            # 下载的音乐文件
│   └── data/                  # 持久化数据（收藏、历史、房间）
├── frontend/
│   ├── src/
│   │   ├── api/              # API 调用
│   │   ├── components/        # 公共组件
│   │   ├── stores/            # Pinia 状态管理
│   │   ├── views/             # 页面视图
│   │   └── utils/             # 工具函数
│   └── dist/                  # 生产构建
├── docker-compose.yml
└── README.md
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/music/parse | 解析音乐链接 |
| POST | /api/music/search | 搜索音乐 |
| POST | /api/music/download | 下载音乐 |
| POST | /api/music/browse-folder | 扫描本地文件夹 |
| POST | /api/music/upload | 上传本地音乐文件 |
| GET | /api/music/downloads | 获取下载列表 |
| GET | /api/favorites | 获取收藏列表 |
| POST | /api/favorites | 添加收藏 |
| GET | /api/history | 获取播放历史 |
| POST | /api/history | 添加历史记录 |

## Socket.IO 事件

### 房间事件
- `create-room` - 创建房间
- `join-room` - 加入房间
- `leave-room` - 离开房间
- `listener-joined` - 听众加入
- `listener-left` - 听众离开

### 同步事件
- `sync-play` - 同步播放
- `sync-pause` - 同步暂停
- `sync-song-change` - 切换歌曲
- `sync-time-update` - 同步播放进度
- `sync-lyrics` - 同步歌词

## License

MIT
