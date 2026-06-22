import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className='navbar'>
      <div className='navbar-inner'>
        <Link to='/' className='navbar-brand'>
          Dev<span className='brand-accent'>Collab</span>
        </Link>

        {/* Search Hint Button */}
        <div
          className='navbar-search-hint'
          onClick={() => window.dispatchEvent(new Event('toggle-command-palette'))}
          title='Search snippets, users, or commands (⌘K)'
        >
          <i className='fa-solid fa-magnifying-glass'></i>
          <span>Search...</span>
          <kbd>⌘K</kbd>
        </div>

        <div className='navbar-links'>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className='btn btn-ghost'
            style={{ padding: '0.45rem 0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label='Toggle theme'
          >
            {theme === 'dark' ? (
              <span className='material-symbols-outlined' style={{ fontSize: '1.1rem', display: 'block' }}>wb_sunny</span>
            ) : (
              <span className='material-symbols-outlined' style={{ fontSize: '1.1rem', display: 'block' }}>dark_mode</span>
            )}
          </button>

          {user ? (
            <>
              {/* Clickable avatar/username → own profile */}
              <Link to={`/profile/${user._id}`} className='navbar-user-link'>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className='navbar-avatar' />
                ) : (
                  <div className='navbar-avatar-fallback'>
                    {user.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <span className='navbar-username'>@{user.username}</span>
              </Link>

              <Link
                to='/create'
                className='btn btn-primary'
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              >
                + New Snippet
              </Link>

              <button
                onClick={handleLogout}
                className='btn btn-ghost'
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
              >
                Logout
              </button>
            </>
          ) : (
            !['/login', '/register'].includes(location.pathname) && (
              <Link
                to='/login'
                className='btn-signin-transparent'
                style={{ fontSize: '0.85rem' }}
              >
                Sign In
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  )
}