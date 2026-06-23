import { io } from 'socket.io-client'
import { API_BASE_URL } from './config.js'

// Derive the Socket.IO server origin from the REST API base URL
// e.g. "http://localhost:8000/api" → "http://localhost:8000"
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '')

let socket = null

/**
 * Returns a lazily-created, shared Socket.IO socket instance.
 * Connects once; subsequent calls return the same socket.
 */
export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      // Send the auth token so the server can identify the user if needed later
      auth: { token: localStorage.getItem('token') },
      // Don't auto-connect until getSocket() is explicitly called
      autoConnect: true,
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}

/**
 * Disconnect and destroy the socket. Call on logout if needed.
 */
export function destroySocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
