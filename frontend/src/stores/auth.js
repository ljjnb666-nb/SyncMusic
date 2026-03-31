import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('syncmusic_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('syncmusic_user') || 'null'))
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  async function register(username, email, password) {
    loading.value = true
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '注册失败')
      }

      token.value = data.token
      user.value = data.user
      localStorage.setItem('syncmusic_token', data.token)
      localStorage.setItem('syncmusic_user', JSON.stringify(data.user))

      return data
    } finally {
      loading.value = false
    }
  }

  async function login(email, password) {
    loading.value = true
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '登录失败')
      }

      token.value = data.token
      user.value = data.user
      localStorage.setItem('syncmusic_token', data.token)
      localStorage.setItem('syncmusic_user', JSON.stringify(data.user))

      return data
    } finally {
      loading.value = false
    }
  }

  async function fetchCurrentUser() {
    if (!token.value) return null

    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token.value}` }
      })

      if (!response.ok) {
        logout()
        return null
      }

      const data = await response.json()
      user.value = data.user
      localStorage.setItem('syncmusic_user', JSON.stringify(data.user))
      return data.user
    } catch (error) {
      console.error('Fetch user error:', error)
      logout()
      return null
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('syncmusic_token')
    localStorage.removeItem('syncmusic_user')
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    register,
    login,
    fetchCurrentUser,
    logout
  }
})
