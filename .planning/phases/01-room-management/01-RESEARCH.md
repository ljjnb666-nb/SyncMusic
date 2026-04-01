# Phase 1: Room Management - Research

**Researched:** 2026-04-01
**Domain:** Real-time room management with Socket.io
**Confidence:** HIGH

## Summary

Phase 1 implements room creation, joining, and host management using Socket.io's built-in room abstraction. Users create rooms via REST API and receive shareable links; joining happens via WebSocket with URL-based room ID. Host identity is tracked in room state and transfers to the next longest-tenured participant on disconnect.

**Primary recommendation:** Use Socket.io room semantics with server-authoritative host tracking. Generate room IDs as URL-safe tokens (nanoid), not sequential integers. Store minimal room state in-memory for active rooms, persist metadata to SQLite for server restarts.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROOM-01 | User can create a new room with a custom name | Express POST /api/rooms, uuid generation |
| ROOM-02 | User receives a shareable room link (URL with room ID) | Room ID embedded in invite URL |
| ROOM-03 | User can join a room via link without registration | Socket.io join with room ID, no auth required |
| ROOM-04 | Room displays list of current participants | Socket.io room state, participant list in room:state |
| ROOM-05 | Room host is identified visually; host controls playback | hostId in room state, host-only player:control events |
| ROOM-06 | If host disconnects, next participant becomes host | socket.on('disconnect') handler with host transfer logic |

## Standard Stack

### Core (from STACK.md)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Socket.io | 4.x | Room management + real-time | Built-in room abstraction, auto-reconnection |
| Express | 4.x | REST API for room creation | Industry standard, minimal overhead |
| better-sqlite3 | 11.x | Persistent room metadata | Synchronous API, embedded, fast |
| uuid / nanoid | 9.x / 3.x | Room ID generation | URL-safe tokens, collision-resistant |

### Phase 1 Implementation Only

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nanoid | 3.x | Generate short URL-safe room IDs | Room creation (e.g., `nanoid(10)` = `V1StGXR8_Z`) |

## Architecture Patterns

### Recommended Project Structure

```
backend/src/
├── routes/
│   └── room.js          # REST endpoints (create, get)
├── services/
│   └── roomService.js    # Room creation, host transfer logic
├── socket/
│   └── handlers.js      # Socket.io event handlers (join, leave, disconnect)
├── state/
│   └── roomManager.js    # In-memory room state, participant tracking
└── index.js             # Express + Socket.io setup

frontend/src/
├── api/
│   └── room.js           # REST API calls to backend
├── socket/
│   └── client.js         # Socket.io client connection
├── stores/
│   └── room.js           # Pinia store for room state
├── views/
│   └── Room.vue          # Room view (create, join, lobby)
└── components/
    └── ParticipantList.vue  # Shows current participants
```

### Pattern 1: Room Creation (REST)

**What:** POST /api/rooms creates a room and returns the room ID + invite URL.

**When to use:** User clicks "Create Room" button.

**Flow:**
1. User submits room name
2. Backend generates `roomId = nanoid(10)`
3. Backend creates in-memory room state
4. Backend persists room metadata to SQLite
5. Backend returns `{ roomId, inviteUrl: `/room/${roomId}` }`

**Code:**
```javascript
// Source: ARCHITECTURE.md Section 6.1
// POST /api/rooms
app.post('/api/rooms', (req, res) => {
  const { name } = req.body;
  const roomId = nanoid(10);
  const hostId = nanoid(8); // User's session ID

  const room = {
    id: roomId,
    name,
    createdAt: Date.now(),
    hostId,
    isPlaying: false,
    currentTrack: null,
    position: 0,
    positionUpdatedAt: Date.now(),
    playlist: [],
    participants: [{
      id: hostId,
      username: 'Host', // Generated or from query param
      joinedAt: Date.now(),
      isHost: true
    }]
  };

  roomManager.set(roomId, room);
  db.insert('rooms', { id: roomId, name, hostId, createdAt: Date.now() });

  res.json({ roomId, inviteUrl: `/room/${roomId}` });
});
```

### Pattern 2: Room Join (Socket.io)

**What:** Client connects to Socket.io with room ID, joins the room, receives full room state.

**When to use:** User navigates to `/room/:roomId` link.

**Flow:**
1. Client loads Room view, connects Socket.io
2. Client emits `room:join` with `{ roomId, username }`
3. Server validates room exists
4. Server adds user to participants list
5. Server emits `room:state` to joining user (full state)
6. Server emits `room:join` to all OTHER room members (new user joined)

**Socket.io events (from ARCHITECTURE.md):**

Server emits:
| Event | Payload | Purpose |
|-------|---------|---------|
| `room:state` | Full room object | Initial sync on join |
| `room:join` | `{ userId, username }` | User joined notification |
| `room:leave` | `{ userId }` | User left notification |

**Code:**
```javascript
// Source: ARCHITECTURE.md + Socket.io v4 docs
io.on('connection', (socket) => {
  socket.on('room:join', ({ roomId, username }) => {
    const room = roomManager.get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const userId = nanoid(8);
    const participant = { id: userId, username, joinedAt: Date.now(), isHost: false };

    // Add to room
    room.participants.push(participant);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userId = userId;

    // Send full state to joining user
    socket.emit('room:state', room);

    // Notify others
    socket.to(roomId).emit('room:join', { userId, username });
  });
});
```

### Pattern 3: Host Transfer on Disconnect

**What:** When host disconnects, server assigns host to longest-tenured remaining participant.

**When to use:** `socket.on('disconnect')` handler.

**Flow:**
1. Host disconnects (close tab, network loss)
2. Server detects disconnect, removes user from participants
3. If user was host AND participants remain:
   - Sort remaining by `joinedAt` ascending (oldest first)
   - Assign `isHost: true` to new host
   - Emit `room:update` with new host info
4. If no participants remain, destroy room (or persist empty room)

**Code:**
```javascript
// Source: ARCHITECTURE.md Section 2.3 + ROOM-06
socket.on('disconnect', () => {
  const { roomId, userId } = socket.data;
  const room = roomManager.get(roomId);

  if (!room) return;

  const participantIndex = room.participants.findIndex(p => p.id === userId);
  const wasHost = room.participants[participantIndex]?.isHost;

  // Remove participant
  room.participants.splice(participantIndex, 1);

  // Notify others
  io.to(roomId).emit('room:leave', { userId });

  // Transfer host if needed
  if (wasHost && room.participants.length > 0) {
    // Sort by joinedAt, oldest first
    room.participants.sort((a, b) => a.joinedAt - b.joinedAt);
    room.participants[0].isHost = true;
    room.hostId = room.participants[0].id;

    io.to(roomId).emit('room:host', { hostId: room.hostId });
  }

  // Clean up empty room
  if (room.participants.length === 0) {
    roomManager.delete(roomId);
  }
});
```

### Pattern 4: URL-Based Identity (No Registration)

**What:** Users are identified by session ID (uuid), not accounts. Username can be set on join or defaulted.

**When to use:** Every phase - identity is purely session-based.

**Implementation:**
- On first visit, generate `sessionId = nanoid(16)` stored in localStorage
- Username passed as query param `/room/abc123?username=John` or set in UI
- No passwords, no accounts, no auth tokens
- Join is instant: no login flow

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Room discovery | Custom WebSocket room registry | Socket.io built-in `socket.join(roomId)` | Built-in handles join/leave/rooms, no custom logic |
| Reconnection | Custom reconnect with exponential backoff | Socket.io auto-reconnect | Built-in, handles network interruptions gracefully |
| Host transfer | Custom election algorithm | Sort-by-joinedAt + assign first | Deterministic, simple, no race conditions |
| Room ID collision | Sequential integer IDs | nanoid(10) | URL-safe, 10 chars = ~10^18 combinations |

**Key insight:** Socket.io's room abstraction handles 90% of room management complexity. The only custom logic needed is host transfer.

## Common Pitfalls

### Pitfall 1: Race Condition on Host Transfer

**What goes wrong:** Two users think they're host after disconnect/reconnect race.

**Why it happens:** Disconnect event is async; client might reconnect before host transfer completes.

**How to avoid:** Always emit `room:host` event AFTER updating server state. Clients must accept `room:host` as authoritative, not derive host from client state.

**Warning signs:** "Multiple hosts" bug reports, `player:control` from non-hosts.

### Pitfall 2: Stale Room State on Join

**What goes wrong:** Joining user gets old room state (before recent changes).

**Why it happens:** Not sending `room:state` after join completes.

**How to avoid:** Always emit `room:state` to joining user as the FIRST event, before `room:join` to others.

### Pitfall 3: Memory Leak - Rooms Never Cleaned Up

**What goes wrong:** Rooms accumulate in memory after all participants leave.

**Why it happens:** Forgetting to delete room on last participant leave.

**How to avoid:** In disconnect handler, if `room.participants.length === 0`, call `roomManager.delete(roomId)`.

### Pitfall 4: Username Collision

**What goes wrong:** Two users with same username in same room.

**Why it happens:** No validation on username uniqueness.

**How to avoid:** Append number suffix for duplicates: "John", "John (2)", "John (3)".

### Pitfall 5: SQLite Write on Every Join/Leave

**What goes wrong:** Database writes slow down Socket.io event handlers.

**Why it happens:** Synchronous better-sqlite3 writes block the event loop.

**How to avoid:** For Phase 1, keep room state in-memory only. Persist to SQLite on room creation and periodically (every 5 minutes or on significant changes), not on every join/leave.

## Code Examples

### Socket.io Server Setup

```javascript
// Source: ARCHITECTURE.md Section 1.2 + Socket.io v4
const { Server } = require('socket.io');
const express = require('express');

const app = express();
const httpServer = app.listen(3000);

const io = new Server(httpServer, {
  cors: {
    origin: '*', // For development; restrict in production
    methods: ['GET', 'POST']
  }
});

// REST routes
app.post('/api/rooms', roomRoutes.create);
app.get('/api/rooms/:id', roomRoutes.get);

// Socket.io handlers
io.on('connection', (socket) => {
  socket.on('room:join', (data) => handlers.join(io, socket, data));
  socket.on('disconnect', (reason) => handlers.disconnect(io, socket, reason));
});
```

### Client Socket Connection (Vue)

```javascript
// Source: ARCHITECTURE.md + Socket.io client docs
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

export default {
  methods: {
    joinRoom(roomId, username) {
      socket.connect();
      socket.emit('room:join', { roomId, username });
    }
  },
  mounted() {
    socket.on('room:state', (room) => {
      this.$store.commit('room/setRoom', room);
    });
    socket.on('room:join', ({ userId, username }) => {
      this.$store.commit('room/addParticipant', { userId, username });
    });
    socket.on('room:leave', ({ userId }) => {
      this.$store.commit('room/removeParticipant', userId);
    });
    socket.on('room:host', ({ hostId }) => {
      this.$store.commit('room/setHost', hostId);
    });
  }
};
```

### Pinia Store for Room State

```javascript
// Source: ARCHITECTURE.md Section 2.1 + Pinia docs
import { defineStore } from 'pinia';

export const useRoomStore = defineStore('room', {
  state: () => ({
    id: null,
    name: '',
    hostId: null,
    participants: [],
    isPlaying: false,
    currentTrack: null,
    position: 0
  }),
  getters: {
    isHost: (state) => state.hostId === state.sessionId,
    participantCount: (state) => state.participants.length
  },
  actions: {
    setRoom(room) {
      this.id = room.id;
      this.name = room.name;
      this.hostId = room.hostId;
      this.participants = room.participants;
      this.isPlaying = room.isPlaying;
      this.currentTrack = room.currentTrack;
      this.position = room.position;
    },
    addParticipant({ userId, username }) {
      this.participants.push({ id: userId, username, joinedAt: Date.now(), isHost: false });
    },
    removeParticipant(userId) {
      this.participants = this.participants.filter(p => p.id !== userId);
    },
    setHost(hostId) {
      this.participants.forEach(p => p.isHost = p.id === hostId);
      this.hostId = hostId;
    }
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Session cookies | localStorage session ID (nanoid) | Phase 1 | No server-side session storage needed |
| Polling for participant list | Socket.io real-time events | Phase 1 | Instant updates, no polling overhead |
| Centralized host election | Server-authoritative transfer | Phase 1 | No race conditions, deterministic |

**Deprecated/outdated:**
- None relevant to Phase 1

## Open Questions

1. **Username default behavior**
   - What we know: Users can pass `?username=John` in URL, or set in UI
   - What's unclear: Should there be a default like "GuestXXXX"?
   - Recommendation: Default to "Guest" + random 4-digit number (e.g., "Guest7294")

2. **Room name validation**
   - What we know: User provides custom name on creation
   - What's unclear: Min/max length? Special characters allowed?
   - Recommendation: 1-50 chars, alphanumeric + spaces + basic punctuation

3. **Empty room cleanup timing**
   - What we know: When last participant leaves, room can be destroyed
   - What's unclear: Should empty rooms persist briefly for rejoin?
   - Recommendation: Keep empty rooms in memory for 5 minutes, then delete from memory (SQLite already has metadata)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.js` (or `none` if using tsx directly) |
| Quick run command | `vitest run --testNamePattern="room" --dir backend/src` |
| Full suite command | `vitest run --dir backend/src` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROOM-01 | Create room with custom name | unit | `vitest run backend/src/services/roomService.test.js` | TBD |
| ROOM-02 | Returns shareable room link | unit | `vitest run backend/src/services/roomService.test.js` | TBD |
| ROOM-03 | Join room via link without registration | integration | `vitest run backend/tests/room.join.test.js` | TBD |
| ROOM-04 | Room displays participant list | integration | `vitest run backend/tests/room.participants.test.js` | TBD |
| ROOM-05 | Host identified visually | unit | `vitest run backend/src/stores/room.test.js` | TBD |
| ROOM-06 | Host transfers on disconnect | integration | `vitest run backend/tests/room.hostTransfer.test.js` | TBD |

### Sampling Rate
- **Per task commit:** Quick run command
- **Per wave merge:** Full suite command
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/src/services/roomService.js` - room creation logic
- [ ] `backend/src/state/roomManager.js` - in-memory room state
- [ ] `backend/src/socket/handlers.js` - join/leave/disconnect handlers
- [ ] `backend/tests/room.join.test.js` - join flow integration tests
- [ ] `backend/tests/room.hostTransfer.test.js` - host transfer tests
- [ ] `frontend/src/stores/room.js` - Pinia store
- [ ] `frontend/src/views/Room.vue` - Room view component
- [ ] `frontend/src/components/ParticipantList.vue` - participant display

## Sources

### Primary (HIGH confidence)
- ARCHITECTURE.md - Room state schema, WebSocket events, data flows (project-specific)
- STACK.md - Socket.io 4.x, Express 4.x, nanoid (project technology decisions)
- Socket.io v4 Documentation - Room semantics, disconnect handling (well-established)

### Secondary (MEDIUM confidence)
- Socket.io GitHub examples - Host transfer patterns (community-verified)
- Pinia documentation - Store patterns for room state

### Tertiary (LOW confidence)
- None required for Phase 1 - all patterns well-established

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH - Socket.io/Express are the project's chosen stack
- Architecture: HIGH - Room patterns are straightforward and well-documented
- Pitfalls: MEDIUM - Based on general Socket.io experience, not project-tested yet

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (Socket.io v4 is stable; no breaking changes expected)
