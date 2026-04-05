// Session management utilities - URL-based identity (no registration)

const SESSION_KEY = 'syncmusic_session_id'
const USERNAME_KEY = 'syncmusic_username'

/**
 * Generate a random ID using crypto API
 * @returns {string} random ID
 */
function generateId() {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Get or generate session ID from localStorage
 * For multi-tab support, each tab gets a unique sessionId via sessionStorage
 * @returns {string} session ID (32 chars)
 */
export function getSessionId() {
  // Use sessionStorage for per-tab session to avoid conflicts when multiple tabs
  // join the same room or when tab is refreshed
  const tabSessionKey = 'syncmusic_tab_session'
  try {
    const stored = sessionStorage.getItem(tabSessionKey)
    if (stored) return stored
    const newId = generateId()
    sessionStorage.setItem(tabSessionKey, newId)
    return newId
  } catch {
    // Fallback to localStorage if sessionStorage is not available
    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) return stored
    const newId = generateId()
    localStorage.setItem(SESSION_KEY, newId)
    return newId
  }
}

/**
 * Get username from URL params first, then localStorage, else generate Guest name
 * @returns {string} username
 */
export function getUsername() {
  // 1. Check URL query param (?username=XXX)
  const urlParams = new URLSearchParams(window.location.search)
  const urlUsername = urlParams.get('username')
  if (urlUsername) return urlUsername

  // 2. Check localStorage
  const stored = localStorage.getItem(USERNAME_KEY)
  if (stored) return stored

  // 3. Generate Guest name
  const randomDigits = Math.floor(1000 + Math.random() * 9000).toString()
  return `Guest${randomDigits}`
}

/**
 * Persist username to localStorage
 * @param {string} username
 */
export function setUsername(username) {
  localStorage.setItem(USERNAME_KEY, username)
}
