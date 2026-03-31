import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getHistory, addHistory, clearHistory, deleteHistory } from '../api/history.js'

export const useHistoryStore = defineStore('history', () => {
  const records = ref([])
  const loading = ref(false)

  // 获取历史记录
  async function fetchHistory(limit = 50) {
    loading.value = true
    try {
      const data = await getHistory(limit)
      records.value = data.history || []
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      loading.value = false
    }
  }

  // 添加历史记录
  async function addRecord(song) {
    try {
      await addHistory(song)
      // 重新获取最新列表
      await fetchHistory()
    } catch (error) {
      console.error('Failed to add history:', error)
    }
  }

  // 清空历史记录
  async function clear() {
    try {
      await clearHistory()
      records.value = []
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  // 删除单条记录
  async function removeRecord(id) {
    try {
      await deleteHistory(id)
      records.value = records.value.filter(r => r.id !== id)
    } catch (error) {
      console.error('Failed to delete history:', error)
    }
  }

  return {
    records,
    loading,
    fetchHistory,
    addRecord,
    clear,
    removeRecord
  }
})
