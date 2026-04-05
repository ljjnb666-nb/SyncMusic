# SyncMusic - 一起听音乐应用

一个支持多人实时同步听歌和音乐下载的 Web 应用。用户可以创建房间邀请朋友一起听歌，或通过解析 QQ音乐/网易云/酷狗的歌单链接下载 VIP 音乐。

## 功能特性

### 一起听 (房间同步)
- **创建/加入房间**：生成房间号，好友输入房间号即可加入
- **实时同步播放**：Host 播放/暂停/跳转，所有 Guest 自动同步
- **歌单同步**：Host 添加/移除歌曲，房间内所有人歌单保持一致
- **进度显示**：实时显示当前播放时间和总时长

### 音乐下载
- **多平台解析**：支持 QQ音乐、网易云音乐、酷狗音乐的链接解析
- **VIP 音乐下载**：通过第三方平台搜索音频流，下载高品质 MP3
- **本地导入**：支持导入本地音乐文件到歌单

### 音乐播放
- **在线播放**：直接播放已下载/导入的音乐
- **播放控制**：播放、暂停、上一首、下一首、进度拖拽
- **列表管理**：播放队列管理，支持添加/移除歌曲

## 技术栈

### 前端
| 技术 | 用途 |
|------|------|
| Vue 3.4+ | UI 框架 |
| Vite 5.x | 构建工具 |
| Pinia 2.x | 状态管理 |
| Socket.io Client 4.x | 实时同步 |
| TailwindCSS 3.x | 样式 |

### 后端
| 技术 | 用途 |
|------|------|
| Node.js 20.x | 运行时 |
| Express 4.x | HTTP 服务器 |
| Socket.io 4.x | WebSocket 实时通信 |
| better-sqlite3 11.x | 数据库 |
| yt-dlp | 音视频解析 |

## 快速开始

### 环境要求
- Node.js 20.x LTS
- npm 或 pnpm

### 安装

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 启动

```bash
# 终端 1：启动后端（端口 3000）
cd backend
npm run dev

# 终端 2：启动前端（端口 5173）
cd frontend
npm run dev
```

### 使用

1. 打开浏览器访问 `http://localhost:5173`
2. 在"歌单"页面导入歌曲或搜索下载音乐
3. 点击"创建房间"进入一起听模式
4. 将房间号分享给朋友，好友输入房间号即可加入
5. Host 播放音乐时，所有人自动同步播放

## 项目结构

```
SyncMusic/
├── frontend/                 # 前端 Vue 应用
│   ├── src/
│   │   ├── api/             # API 调用
│   │   ├── components/      # 通用组件
│   │   ├── router/          # 路由配置
│   │   ├── socket/          # Socket.io 客户端
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── utils/           # 工具函数
│   │   └── views/           # 页面视图
│   └── package.json
├── backend/                  # 后端 Node.js 应用
│   ├── src/
│   │   ├── db.js            # 数据库操作
│   │   ├── index.js         # 服务入口
│   │   ├── routes/          # API 路由
│   │   ├── services/        # 业务逻辑
│   │   └── socket/          # Socket.io 事件处理
│   └── package.json
└── data/                     # 数据目录
    └── syncmusic.db         # SQLite 数据库
```

## 同步机制

### 播放状态同步
- `playback:play` - 播放事件，包含曲目信息和时间戳
- `playback:pause` - 暂停事件
- `playback:seek` - 跳转事件

### 房间状态同步
- `room:state` - 房间完整状态（加入时同步）
- `room:update` - 歌单更新事件
- `room:join` / `room:leave` - 进出房间事件

## License

MIT
