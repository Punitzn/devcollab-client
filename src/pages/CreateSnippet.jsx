import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios.js'

const LANGUAGES = ['javascript', 'python', 'cpp', 'java', 'typescript', 'go', 'rust']

export default function CreateSnippet() {
  const [form, setForm] = useState({ title: '', description: '', code: '', language: 'javascript', tags: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      }
      const { data } = await api.post('/snippets', payload)
      navigate(`/snippets/${data._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Post a snippet</h2>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          placeholder='Title'
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder='Description'
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <select
          style={styles.input}
          value={form.language}
          onChange={(e) => setForm({ ...form, language: e.target.value })}
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <textarea
          style={{ ...styles.input, height: '200px', fontFamily: 'monospace', resize: 'vertical' }}
          placeholder='Paste your code here...'
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder='Tags (comma separated: sorting, arrays, dp)'
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
        />
        <button type='submit' style={styles.btn}>
          Post Snippet
        </button>
      </form>
    </div>
  )
}

const styles = {
  container: { maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem' },
  title: { fontSize: '1.4rem', fontWeight: '600', marginBottom: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { padding: '0.7rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem' },
  btn: { padding: '0.75rem', background: '#111', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' },
  error: { color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' },
}