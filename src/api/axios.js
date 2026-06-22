import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Required: sends HTTP-only cookie on every request
})

// Response interceptor: handle expired/invalid tokens globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes('/auth/')
      if (!isAuthRoute) {
        // Redirect to login if a protected request fails (token expired/missing)
        if (
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register') &&
          !window.location.pathname.includes('/complete-profile')
        ) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api