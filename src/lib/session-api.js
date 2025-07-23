/**
 * Session API
 * Client-side interface for session management and bot detection
 */

import axios from 'axios'
import sessionManager from './session-manager.js'

const API_URL = import.meta.env.VITE_API_URL

/**
 * Get session information from the server including bot detection
 */
export async function getSessionInfo() {
  try {
    const response = await axios.get(`${API_URL}/session/info`)
    return response.data
  } catch (error) {
    console.error('Failed to get session info:', error)
    throw error
  }
}

/**
 * Get session statistics from the server
 */
export async function getSessionStats() {
  try {
    const response = await axios.get(`${API_URL}/session/stats`)
    return response.data
  } catch (error) {
    console.error('Failed to get session stats:', error)
    throw error
  }
}

/**
 * Get local session metadata (client-side only)
 */
export function getLocalSessionInfo() {
  return sessionManager.getSessionMetadata()
}

/**
 * Manually renew the session
 */
export function renewSession() {
  sessionManager.renewSession()
  console.log('Session renewed:', sessionManager.getSessionKey().substring(0, 8) + '...')
}

/**
 * Clear the current session
 */
export function clearSession() {
  sessionManager.clearSession()
  console.log('Session cleared')
}

/**
 * Check if session should be renewed
 */
export function shouldRenewSession() {
  return sessionManager.shouldRenewSession()
}

/**
 * Get current session key (masked for security)
 */
export function getSessionKey() {
  const key = sessionManager.getSessionKey()
  return key ? key.substring(0, 8) + '...' : null
}

export default {
  getSessionInfo,
  getSessionStats,
  getLocalSessionInfo,
  renewSession,
  clearSession,
  shouldRenewSession,
  getSessionKey
} 