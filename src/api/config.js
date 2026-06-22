export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
).replace(/\/+$/, '')

export const isApiPointingAtFrontend = () => {
  if (typeof window === 'undefined') return false

  try {
    return new URL(API_BASE_URL).host === window.location.host
  } catch {
    return false
  }
}
