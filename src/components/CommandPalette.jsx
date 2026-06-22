import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/axios.js'

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [snippets, setSnippets] = useState([])
  const [users, setUsers] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  // Load recent items from localStorage on mount
  const [recentItems, setRecentItems] = useState(() => {
    try {
      const raw = localStorage.getItem('cmd_recent')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const listRef = useRef(null)

  // Extract snippet ID if current path is a snippet detail page
  const snippetMatch = location.pathname.match(/\/snippets\/([a-fA-F0-9]{24})/)
  const currentSnippetId = snippetMatch ? snippetMatch[1] : null

  // ─── Helpers to safely open/close without effect side-effects ───────────────
  const openPalette = () => {
    setIsOpen(true)
    setQuery('')
    setSnippets([])
    setUsers([])
    setSelectedIndex(0)
  }

  const closePalette = () => {
    setIsOpen(false)
    setQuery('')
    setSnippets([])
    setUsers([])
    setSelectedIndex(0)
  }

  const addToRecent = (item) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((r) => r.id !== item.id)
      const next = [item, ...filtered].slice(0, 5) // Keep last 5 recent items
      localStorage.setItem('cmd_recent', JSON.stringify(next))
      return next
    })
  }

  // Helper to render matching query text wrapped in a mark tag
  const highlightMatch = (text, queryText) => {
    if (!queryText.trim()) return <span>{text}</span>
    const parts = text.split(new RegExp(`(${queryText.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'))
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === queryText.toLowerCase() ? (
            <mark key={i} className="cmd-highlight">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    )
  }

  // ─── Static Commands ────────────────────────────────────────────────────────
  const staticCommands = useMemo(() => {
    const list = [
      { id: 'home', label: 'Go to Home Feed', type: 'command', icon: 'fa-home', action: () => navigate('/') },
    ]

    if (user) {
      list.push(
        { id: 'create', label: 'Create New Snippet', type: 'command', icon: 'fa-plus', action: () => navigate('/create') },
        { id: 'profile', label: 'View My Profile', type: 'command', icon: 'fa-user', action: () => navigate(`/profile/${user._id}`) }
      )

      if (currentSnippetId) {
        list.push({
          id: 'ai-review',
          label: 'Review Current Snippet With AI',
          type: 'command',
          icon: 'fa-robot',
          action: async () => {
            window.dispatchEvent(new CustomEvent('ai-review-started'))
            try {
              const { data } = await api.post(`/snippets/${currentSnippetId}/ai-review?force=true`)
              window.dispatchEvent(new CustomEvent('ai-review-completed', { detail: data.aiReview }))
            } catch (err) {
              window.dispatchEvent(
                new CustomEvent('ai-review-failed', {
                  detail: err.response?.data?.message || 'Failed to generate AI review. Check your API key.',
                })
              )
            }
          },
        })
      }

      list.push({
        id: 'logout',
        label: 'Log Out',
        type: 'command',
        icon: 'fa-sign-out-alt',
        action: async () => {
          await logout()
          navigate('/')
        },
      })
    } else {
      list.push(
        { id: 'login', label: 'Log In / Sign In', type: 'command', icon: 'fa-sign-in-alt', action: () => navigate('/login') },
        { id: 'register', label: 'Register / Sign Up', type: 'command', icon: 'fa-user-plus', action: () => navigate('/register') }
      )
    }

    return list
  }, [user, navigate, logout, currentSnippetId])

  // Filter commands if user typed something
  const filteredCommands = useMemo(() => {
    if (!query) return staticCommands
    return staticCommands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
  }, [staticCommands, query])

  // Flattened list of all items for index-based keyboard navigation
  const allItems = useMemo(() => {
    const list = []

    // Prepend recent items only when search box is empty
    if (!query) {
      recentItems.forEach((r) => {
        list.push({
          id: r.id,
          label: r.label,
          subLabel: r.subLabel,
          type: r.type,
          icon: r.icon,
          avatar: r.avatar,
          action: () => navigate(r.url),
        })
      })
    }

    list.push(...filteredCommands)

    snippets.forEach((s) => {
      list.push({
        id: `snippet-${s._id}`,
        label: s.title,
        subLabel: s.language,
        type: 'snippet',
        icon: 'fa-code',
        action: () => {
          navigate(`/snippets/${s._id}`)
          addToRecent({
            id: `snippet-${s._id}`,
            label: s.title,
            subLabel: s.language,
            type: 'snippet',
            icon: 'fa-code',
            url: `/snippets/${s._id}`,
          })
        },
      })
    })

    users.forEach((u) => {
      list.push({
        id: `user-${u._id}`,
        label: `@${u.username}`,
        subLabel: `${u.reputation} rep`,
        type: 'user',
        icon: 'fa-user-tag',
        avatar: u.avatar,
        action: () => {
          navigate(`/profile/${u._id}`)
          addToRecent({
            id: `user-${u._id}`,
            label: `@${u.username}`,
            subLabel: `${u.reputation} rep`,
            type: 'user',
            icon: 'fa-user-tag',
            avatar: u.avatar,
            url: `/profile/${u._id}`,
          })
        },
      })
    })

    return list
  }, [query, recentItems, filteredCommands, snippets, users, navigate])

  // ─── Global Keydown Listeners (Cmd+K / Ctrl+K) & Click Event ────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpen) {
          closePalette()
        } else {
          openPalette()
        }
      }
    }
    const handleToggleEvent = () => {
      if (isOpen) {
        closePalette()
      } else {
        openPalette()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('toggle-command-palette', handleToggleEvent)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('toggle-command-palette', handleToggleEvent)
    }
  }, [isOpen])

  // ─── Command Palette Hotkeys when Open ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closePalette()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (allItems.length ? (prev + 1) % allItems.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (allItems.length ? (prev - 1 + allItems.length) % allItems.length : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = allItems[selectedIndex]
        if (selected) {
          selected.action()
          closePalette()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, allItems, selectedIndex])

  // ─── Dynamic API Search (250ms Debounce, limit 5) ───────────────────────────
  useEffect(() => {
    if (!isOpen || !query.trim()) {
      return
    }

    const delay = setTimeout(async () => {
      try {
        const [snippetsRes, usersRes] = await Promise.all([
          api.get('/snippets', { params: { search: query, limit: 5 } }),
          api.get('/users', { params: { query, limit: 5 } }),
        ])
        setSnippets(snippetsRes.data.snippets || [])
        setUsers(usersRes.data || [])
        setSelectedIndex(0)
      } catch (err) {
        console.error('Command palette search error:', err)
      } finally {
        setLoading(false)
      }
    }, 250) // precisely 250ms debounce

    return () => clearTimeout(delay)
  }, [query, isOpen])

  // ─── Scroll selected item into view ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !listRef.current) return
    const activeEl = listRef.current.querySelector('.cmd-item.active')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex, isOpen])

  const handleQueryChange = (e) => {
    const val = e.target.value
    setQuery(val)
    if (!val.trim()) {
      setSnippets([])
      setUsers([])
      setSelectedIndex(0)
      setLoading(false)
    } else {
      setLoading(true)
    }
  }

  if (!isOpen) return null

  return (
    <div className="cmd-backdrop fade-in" onClick={closePalette}>
      <div className="cmd-card" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div className="cmd-search-wrapper">
          <i className="fa-solid fa-magnifying-glass cmd-search-icon"></i>
          <input
            className="cmd-input"
            autoFocus
            placeholder="Search snippets, users, or type commands..."
            value={query}
            onChange={handleQueryChange}
          />
          {loading && <span className="spinner cmd-spinner" />}
        </div>

        {/* Results List */}
        <div className="cmd-list" ref={listRef}>
          {allItems.length === 0 ? (
            <div className="cmd-empty">No results found for "{query}"</div>
          ) : (
            <>
              {/* Recent Section */}
              {!query && recentItems.length > 0 && (
                <div className="cmd-section">
                  <div className="cmd-section-title">Recent Searches</div>
                  {recentItems.map((r) => {
                    const idx = allItems.findIndex((item) => item.id === r.id)
                    const active = idx === selectedIndex
                    return (
                      <div
                        key={r.id}
                        className={`cmd-item${active ? ' active' : ''}`}
                        onClick={() => {
                          navigate(r.url)
                          addToRecent(r)
                          closePalette()
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        {r.avatar ? (
                          <img src={r.avatar} alt={r.label} className="cmd-avatar" />
                        ) : r.type === 'user' ? (
                          <div className="cmd-avatar-fallback">{r.label[1]?.toUpperCase() || '?'}</div>
                        ) : (
                          <i className={`fa-solid ${r.icon} cmd-item-icon`}></i>
                        )}
                        <div className="cmd-item-text">
                          <span className="cmd-item-label">{r.label}</span>
                          {r.subLabel && <span className="cmd-item-sublabel">{r.subLabel}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Commands Section */}
              {filteredCommands.length > 0 && (
                <div className="cmd-section">
                  <div className="cmd-section-title">Commands</div>
                  {filteredCommands.map((c) => {
                    const idx = allItems.findIndex((item) => item.id === c.id)
                    const active = idx === selectedIndex
                    return (
                      <div
                        key={c.id}
                        className={`cmd-item${active ? ' active' : ''}`}
                        onClick={() => {
                          c.action()
                          closePalette()
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <i className={`fa-solid ${c.icon} cmd-item-icon`}></i>
                        <span className="cmd-item-label">{highlightMatch(c.label, query)}</span>
                        <kbd className="cmd-shortcut">Enter</kbd>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Snippets Section */}
              {snippets.length > 0 && (
                <div className="cmd-section">
                  <div className="cmd-section-title">Snippets</div>
                  {snippets.map((s) => {
                    const idx = allItems.findIndex((item) => item.id === `snippet-${s._id}`)
                    const active = idx === selectedIndex
                    return (
                      <div
                        key={s._id}
                        className={`cmd-item${active ? ' active' : ''}`}
                        onClick={() => {
                          navigate(`/snippets/${s._id}`)
                          addToRecent({
                            id: `snippet-${s._id}`,
                            label: s.title,
                            subLabel: s.language,
                            type: 'snippet',
                            icon: 'fa-code',
                            url: `/snippets/${s._id}`,
                          })
                          closePalette()
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <i className="fa-solid fa-code cmd-item-icon"></i>
                        <div className="cmd-item-text">
                          <span className="cmd-item-label">{highlightMatch(s.title, query)}</span>
                          <span className="cmd-item-sublabel">{s.language}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Users Section */}
              {users.length > 0 && (
                <div className="cmd-section">
                  <div className="cmd-section-title">Users</div>
                  {users.map((u) => {
                    const idx = allItems.findIndex((item) => item.id === `user-${u._id}`)
                    const active = idx === selectedIndex
                    const initials = u.username?.[0]?.toUpperCase() || '?'
                    return (
                      <div
                        key={u._id}
                        className={`cmd-item${active ? ' active' : ''}`}
                        onClick={() => {
                          navigate(`/profile/${u._id}`)
                          addToRecent({
                            id: `user-${u._id}`,
                            label: `@${u.username}`,
                            subLabel: `${u.reputation} rep`,
                            type: 'user',
                            icon: 'fa-user-tag',
                            avatar: u.avatar,
                            url: `/profile/${u._id}`,
                          })
                          closePalette()
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.username} className="cmd-avatar" />
                        ) : (
                          <div className="cmd-avatar-fallback">{initials}</div>
                        )}
                        <div className="cmd-item-text">
                          <span className="cmd-item-label">{highlightMatch(`@${u.username}`, query)}</span>
                          <span className="cmd-item-sublabel">{u.reputation} reputation</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Hints */}
        <div className="cmd-footer">
          <div className="cmd-hint">
            <kbd>↑↓</kbd> to navigate
          </div>
          <div className="cmd-hint">
            <kbd>Enter</kbd> to select
          </div>
          <div className="cmd-hint">
            <kbd>Esc</kbd> to close
          </div>
        </div>
      </div>
    </div>
  )
}
