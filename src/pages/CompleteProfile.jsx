import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/axios.js'

export default function CompleteProfile() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.username || !form.password || !form.confirmPassword) {
      return setError('All fields are required')
    }
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match')
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters')
    }

    setLoading(true)
    try {
      const payload = {
        username: form.username,
        password: form.password,
      }

      const { data } = await api.post('/auth/complete-profile', payload)
      updateUser(data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='auth-page'>
      <div className='auth-card fade-in' style={{ maxWidth: '480px' }}>
        {/* Provider badge */}
        <div style={{ marginBottom: '1rem' }}>
          <span className='badge' style={{
            background: 'var(--accent-muted)',
            color: 'var(--accent)',
            border: '1px solid var(--accent-border)',
            padding: '0.3rem 0.75rem',
            fontSize: '0.8rem',
            textTransform: 'capitalize',
          }}>
            <i className='fa-solid fa-circle-check' style={{ marginRight: '0.35rem' }}></i> Signed in via {user?.provider || 'OAuth'}
          </span>
        </div>

        <h1 className='auth-title'>One last step!</h1>
        <p className='auth-subtitle' style={{ marginBottom: '1.5rem' }}>
          Choose a username and set a password to complete your profile.
          {user?.email && (
            <span style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Signed in as {user.email}
            </span>
          )}
        </p>

        {error && <div className='auth-error' style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} className='auth-form'>
          <div className='form-group'>
            <label className='form-label'>Username *</label>
            <input
              className='input'
              placeholder='cooldev42'
              value={form.username}
              autoComplete='username'
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
            <span className='form-hint'>This is how others will see you on DevCollab</span>
          </div>

          <div className='form-group'>
            <label className='form-label'>Password *</label>
            <input
              className='input'
              type='password'
              placeholder='At least 6 characters'
              value={form.password}
              autoComplete='new-password'
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className='form-group'>
            <label className='form-label'>Confirm Password *</label>
            <input
              className='input'
              type='password'
              placeholder='Repeat your password'
              value={form.confirmPassword}
              autoComplete='new-password'
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </div>

          <button
            type='submit'
            className='btn btn-primary'
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.25rem' }}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
