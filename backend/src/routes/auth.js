import { Router } from 'express'
import { register, login, getUserById } from '../services/authService.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    const result = await register(username, email, password)
    res.json({
      success: true,
      token: result.token,
      user: result.user
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(400).json({ error: error.message })
  }
})

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const result = await login(email, password)
    res.json({
      success: true,
      token: result.token,
      user: result.user
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(401).json({ error: error.message })
  }
})

// 获取当前用户信息
router.get('/me', authenticate, (req, res) => {
  try {
    const user = getUserById(req.user.userId)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    res.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
