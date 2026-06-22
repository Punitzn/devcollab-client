import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios.js'

const LANGUAGES = ['javascript', 'python', 'cpp', 'java', 'typescript', 'go', 'rust']



export default function CreateSnippet() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    code: '',
    language: 'javascript',
    tags: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      }
      const { data } = await api.post('/snippets', payload)
      navigate(`/snippets/${data._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create snippet. Make sure you are logged in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='create-page'>
      <div className='create-header'>
        <Link
          to='/'
          style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem' }}
        >
          ← Back to snippets
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.04em' }}>
          Post a Snippet
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
          Share your code with the DevCollab community
        </p>
      </div>

      {error && <div className='auth-error' style={{ marginBottom: '1.25rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} className='create-form'>
        <div className='form-group'>
          <label className='form-label'>Title *</label>
          <input
            className='input'
            placeholder='e.g. Binary Search in Python'
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>

        <div className='form-group'>
          <label className='form-label'>Description</label>
          <input
            className='input'
            placeholder='Brief description of what this snippet does...'
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className='form-group'>
          <label className='form-label'>Language *</label>
          <select
            className='input'
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l === 'cpp' ? 'C++' : l.charAt(0).toUpperCase() + l.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className='form-group'>
          <label className='form-label'>Code *</label>
          <textarea
            className='input'
            placeholder='// Paste your code here...'
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
          />
        </div>

        <div className='form-group'>
          <label className='form-label'>Tags</label>
          <input
            className='input'
            placeholder='sorting, arrays, dynamic-programming'
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
          <span className='form-hint'>Comma-separated tags to help others discover your snippet</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
          <button
            type='submit'
            className='btn btn-primary'
            style={{ padding: '0.75rem 2rem' }}
            disabled={loading}
          >
            {loading ? 'Posting...' : 'Post Snippet'}
          </button>
          <Link to='/' className='btn btn-ghost' style={{ padding: '0.75rem 1.25rem' }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}