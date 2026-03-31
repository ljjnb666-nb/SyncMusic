import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const USERS_FILE = path.join(process.cwd(), '../data/users.json')

const JWT_SECRET = process.env.JWT_SECRET || 'syncmusic-secret-key-2024'
const JWT_EXPIRES_IN = '7d'
const SALT_ROUNDS = 10

function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, '[]', 'utf8')
      return []
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8')
    return JSON.parse(data || '[]')
  } catch (error) {
    console.error('Read users error:', error)
    return []
  }
}

function writeUsers(users) {
  try {
    const dir = path.dirname(USERS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('Write users error:', error)
    return false
  }
}

export async function register(username, email, password) {
  if (!username || !email || !password) {
    throw new Error('用户名、邮箱和密码不能为空')
  }

  if (username.length < 2 || username.length > 20) {
    throw new Error('用户名长度需要在 2-20 个字符之间')
  }

  if (password.length < 6) {
    throw new Error('密码长度至少 6 个字符')
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error('邮箱格式不正确')
  }

  const users = readUsers()

  const existingUser = users.find(u => u.email === email)
  if (existingUser) {
    throw new Error('该邮箱已被注册')
  }

  const existingUsername = users.find(u => u.username === username)
  if (existingUsername) {
    throw new Error('用户名已被使用')
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

  const newUser = {
    id: Date.now().toString(),
    username,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  }

  users.push(newUser)
  writeUsers(users)

  const token = jwt.sign(
    { userId: newUser.id, username: newUser.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

  return {
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.createdAt
    }
  }
}

export async function login(email, password) {
  if (!email || !password) {
    throw new Error('邮箱和密码不能为空')
  }

  const users = readUsers()
  const user = users.find(u => u.email === email)

  if (!user) {
    throw new Error('邮箱或密码错误')
  }

  const isValidPassword = await bcrypt.compare(password, user.password)

  if (!isValidPassword) {
    throw new Error('邮箱或密码错误')
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    }
  }
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export function getUserById(userId) {
  const users = readUsers()
  const user = users.find(u => u.id === userId)

  if (!user) {
    return null
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt
  }
}
