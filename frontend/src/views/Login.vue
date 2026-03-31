<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <AppIcon name="music" :size="48" class="login-icon" />
        <h1 class="login-title">SyncMusic</h1>
        <p class="login-subtitle">{{ isLogin ? '登录到您的账户' : '创建新账户' }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div v-if="!isLogin" class="form-group">
          <label class="form-label">用户名</label>
          <input
            v-model="form.username"
            type="text"
            class="form-input"
            placeholder="输入用户名"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input
            v-model="form.email"
            type="email"
            class="form-input"
            placeholder="输入邮箱地址"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <input
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="输入密码"
            required
            minlength="6"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button
          type="submit"
          class="submit-btn"
          :disabled="authStore.loading"
        >
          <span v-if="authStore.loading" class="loading-spinner"></span>
          {{ isLogin ? '登录' : '注册' }}
        </button>
      </form>

      <div class="login-footer">
        <button @click="toggleMode" class="toggle-btn">
          {{ isLogin ? '没有账户？立即注册' : '已有账户？登录' }}
        </button>
      </div>

      <button v-if="showSkip" @click="skipAuth" class="skip-btn">
        跳过，稍后登录
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import AppIcon from '../components/AppIcon.vue'

const router = useRouter()
const authStore = useAuthStore()

const isLogin = ref(true)
const error = ref('')
const showSkip = ref(true)

const form = reactive({
  username: '',
  email: '',
  password: ''
})

function toggleMode() {
  isLogin.value = !isLogin.value
  error.value = ''
  form.username = ''
  form.email = ''
  form.password = ''
}

async function handleSubmit() {
  error.value = ''

  try {
    if (isLogin.value) {
      await authStore.login(form.email, form.password)
    } else {
      await authStore.register(form.username, form.email, form.password)
    }
    router.push('/')
  } catch (e) {
    error.value = e.message
  }
}

function skipAuth() {
  router.push('/')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #0f0f14 0%, #1a1a24 50%, #0f0f14 100%);
  position: relative;
}

.login-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 400px;
  background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.15) 0%, transparent 60%);
  pointer-events: none;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: rgba(26, 26, 36, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  position: relative;
  z-index: 1;
  margin: 20px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-icon {
  color: #a78bfa;
  margin-bottom: 16px;
}

.login-title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #f8fafc 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
}

.login-subtitle {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
}

.form-input {
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  background: rgba(15, 15, 20, 0.6);
  color: #f8fafc;
  font-size: 14px;
  outline: none;
  transition: all 0.25s ease;
}

.form-input:focus {
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.form-input::placeholder {
  color: #475569;
}

.error-message {
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  font-size: 14px;
  text-align: center;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(124, 58, 237, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-footer {
  margin-top: 24px;
  text-align: center;
}

.toggle-btn {
  background: none;
  border: none;
  color: #a78bfa;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.toggle-btn:hover {
  color: #c4b5fd;
}

.skip-btn {
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 10px;
  background: transparent;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.skip-btn:hover {
  border-color: rgba(139, 92, 246, 0.4);
  color: #94a3b8;
}
</style>
