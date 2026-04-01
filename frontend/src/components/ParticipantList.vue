<template>
  <div class="participant-list">
    <div class="list-header">
      <h3 class="list-title">参与者</h3>
      <span class="count-badge">{{ participantCount }}</span>
    </div>

    <div v-if="sortedParticipants.length === 0" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <p>等待参与者加入...</p>
    </div>

    <ul v-else class="participants">
      <li
        v-for="participant in sortedParticipants"
        :key="participant.id"
        class="participant-item"
      >
        <div class="participant-info">
          <span
            class="participant-name"
            :class="{ 'is-host': participant.isHost }"
          >
            {{ participant.username }}
          </span>
          <span v-if="participant.isHost" class="host-badge">房主</span>
          <span v-if="participant.id === sessionId" class="you-badge">你</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoomStore } from '../stores/room'
import { getSessionId } from '../utils/session'

const roomStore = useRoomStore()
const sessionId = getSessionId()

const participantCount = computed(() => roomStore.participantCount)

const sortedParticipants = computed(() => {
  return [...roomStore.participants].sort((a, b) => {
    if (a.isHost && !b.isHost) return -1
    if (!a.isHost && b.isHost) return 1
    return a.joinedAt - b.joinedAt
  })
})
</script>

<style scoped>
.participant-list {
  background: rgba(26, 26, 36, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.list-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.list-title {
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  background: rgba(139, 92, 246, 0.2);
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  color: #a78bfa;
}

.empty-state {
  text-align: center;
  padding: 24px 16px;
  color: #64748b;
}

.empty-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.participants {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.participant-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: rgba(15, 15, 20, 0.4);
  border-radius: 10px;
  transition: background 0.2s ease;
}

.participant-item:hover {
  background: rgba(15, 15, 20, 0.6);
}

.participant-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.participant-name {
  font-size: 14px;
  font-weight: 500;
  color: #e2e8f0;
}

.participant-name.is-host {
  font-weight: 700;
  color: #f8fafc;
}

.host-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%);
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  color: #1a1a24;
}

.you-badge {
  padding: 2px 8px;
  background: rgba(100, 116, 139, 0.3);
  border: 1px solid rgba(100, 116, 139, 0.4);
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
}
</style>
