import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/axios.js'
import { getSocket } from '../api/socket.js'

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch initial notifications
  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/notifications')
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
      }
    }

    fetchNotifications()
  }, [user])

  // Listen for real-time notifications via Socket.IO
  useEffect(() => {
    if (!user) return

    const socket = getSocket()
    
    // Join private user room
    socket.emit('user:join', user._id)

    const handleNewNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev])
      setUnreadCount((prev) => prev + 1)
    }

    socket.on('notification:new', handleNewNotification)

    return () => {
      socket.off('notification:new', handleNewNotification)
    }
  }, [user])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all read:', err)
    }
  }

  const handleNotificationClick = async (notif) => {
    setIsOpen(false)
    if (!notif.read) {
      try {
        await api.patch(`/notifications/${notif._id}/read`)
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (err) {
        console.error('Failed to mark notification read:', err)
      }
    }
    if (notif.snippet) {
      navigate(`/snippets/${notif.snippet._id || notif.snippet}`)
    }
  }

  // Format relative time helper
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  // Generate helper message text
  const renderMessage = (notif) => {
    const actorName = notif.actor?.username ? `@${notif.actor.username}` : 'Someone'
    const snippetTitle = notif.meta?.snippetTitle || notif.snippet?.title || 'a snippet'

    switch (notif.type) {
      case 'snippet_upvote':
        return (
          <span>
            <strong>{actorName}</strong> upvoted your snippet <strong>{snippetTitle}</strong>
          </span>
        )
      case 'snippet_comment':
        return (
          <span>
            <strong>{actorName}</strong> commented on your snippet <strong>{snippetTitle}</strong>
          </span>
        )
      case 'comment_upvote':
        return (
          <span>
            <strong>{actorName}</strong> upvoted your comment in <strong>{snippetTitle}</strong>
          </span>
        )
      case 'ai_review_complete':
        return (
          <span>
            <i className="fa-solid fa-robot" style={{ marginRight: '4px', color: 'var(--color-primary)' }}></i>
            AI review completed for <strong>{snippetTitle}</strong>
          </span>
        )
      default:
        return <span>New activity on <strong>{snippetTitle}</strong></span>
    }
  }

  if (!user) return null

  return (
    <div className="notif-bell-container" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="btn btn-ghost notif-bell-btn"
        title="Notifications"
        aria-label="View notifications"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', display: 'block' }}>
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="btn-link">
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <span className="material-symbols-outlined notif-empty-icon">
                  notifications_paused
                </span>
                <p>All caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`notif-item ${!notif.read ? 'notif-unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  {/* Notification Actor Avatar (unless it's AI Review) */}
                  {notif.type === 'ai_review_complete' ? (
                    <div className="notif-avatar ai-avatar">
                      <i className="fa-solid fa-brain animate-pulse"></i>
                    </div>
                  ) : notif.actor?.avatar ? (
                    <img
                      src={notif.actor.avatar}
                      alt={notif.actor.username}
                      className="notif-avatar"
                    />
                  ) : (
                    <div className="notif-avatar fallback-avatar">
                      {notif.actor?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}

                  <div className="notif-content">
                    <p className="notif-text">{renderMessage(notif)}</p>
                    <span className="notif-time">{formatTime(notif.createdAt)}</span>
                  </div>
                  {!notif.read && <span className="notif-unread-dot"></span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
