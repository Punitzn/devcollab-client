import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/axios.js'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/auth/register', form)
      login(data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create account</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            placeholder='Username'
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder='Email'
            type='email'
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder='Password'
            type='password'
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button type='submit' style={styles.btn}>
            Register
          </button>
        </form>
        <p style={styles.footer}>
          Already have an account? <Link to='/login'>Login</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' },
  card: { background: '#fff', padding: '2rem', borderRadius: '10px', border: '1px solid #e5e7eb', width: '100%', maxWidth: '400px' },
  title: { marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: '600' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { padding: '0.7rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem' },
  btn: { padding: '0.75rem', background: '#111', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' },
  error: { color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' },
  footer: { marginTop: '1rem', fontSize: '0.9rem', textAlign: 'center' },
}