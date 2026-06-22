import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={styles.nav}>
      <Link to='/' style={styles.brand}>
        DevCollab
      </Link>
      <div style={styles.links}>
        {user ? (
          <>
            <span style={styles.username}>@{user.username}</span>
            <Link to='/create' style={styles.link}>
              + New Snippet
            </Link>
            <button onClick={handleLogout} style={styles.btn}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to='/login' style={styles.link}>
              Login
            </Link>
            <Link to='/register' style={styles.link}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#fff',
  },
  brand: {
    fontWeight: '700',
    fontSize: '1.25rem',
    textDecoration: 'none',
    color: '#111',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  link: {
    textDecoration: 'none',
    color: '#374151',
    fontSize: '0.95rem',
  },
  username: {
    color: '#6b7280',
    fontSize: '0.9rem',
  },
  btn: {
    background: 'none',
    border: '1px solid #e5e7eb',
    padding: '0.4rem 0.9rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#374151',
  },
}