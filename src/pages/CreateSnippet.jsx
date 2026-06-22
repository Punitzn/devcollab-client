import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios.js'
import Editor from '@monaco-editor/react'

const LANGUAGES = ['javascript', 'python', 'cpp', 'java', 'typescript', 'go', 'rust']

export default function CreateSnippet() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    code: '',
    language: 'javascript',
  })
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Track the application theme to sync with Monaco Editor
  const [editorTheme, setEditorTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'vs-dark'
  })

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-theme')
      setEditorTheme(current === 'light' ? 'light' : 'vs-dark')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.code.trim()) {
      setError('Code is required')
      return
    }
    setError('')
    setLoading(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        code: form.code,
        language: form.language,
        tags: tags,
      }
      const { data } = await api.post('/snippets', payload)
      navigate(`/snippets/${data._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create snippet. Make sure you are logged in.')
    } finally {
      setLoading(false)
    }
  }

  const addTag = (tag) => {
    const trimmed = tag.trim().toLowerCase().replace(/,/g, '')
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setTagInput('')
  }

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, i) => i !== indexToRemove))
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

      <form onSubmit={handleSubmit} className='create-form-two-col'>
        {/* Left Column: Monaco Code Editor in macOS style box */}
        <div className='create-col-left'>
          <div className='form-group' style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <label className='form-label'>Code *</label>
            <div className="code-block-wrapper" style={{ marginBottom: '0', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="code-block-header">
                <div className="code-block-dots">
                  <span className="dot dot-red"></span>
                  <span className="dot dot-yellow"></span>
                  <span className="dot dot-green"></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="code-block-lang" style={{ color: 'var(--text-muted)' }}>Editor</span>
                  <select
                    className='input'
                    style={{
                      padding: '0.2rem 2rem 0.2rem 0.5rem',
                      fontSize: '0.75rem',
                      height: '28px',
                      width: 'auto',
                      minWidth: '110px',
                      background: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
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
              </div>
              <div style={{ background: editorTheme === 'vs-dark' ? '#1e1e1e' : '#fff', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Editor
                  height="450px"
                  language={form.language}
                  theme={editorTheme}
                  value={form.code}
                  onChange={(val) => setForm((prev) => ({ ...prev, code: val || '' }))}
                  loading={<div className="loading-monaco" style={{ color: 'var(--text-muted)', padding: '4rem 2rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>Loading Editor...</div>}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    roundedSelection: true,
                    padding: { top: 12, bottom: 12 },
                    automaticLayout: true,
                    fontFamily: 'var(--font-mono)',
                    tabSize: 2,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Description, Tags & Buttons */}
        <div className='create-col-right'>
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
            <textarea
              className='input'
              style={{ minHeight: '120px', resize: 'vertical' }}
              placeholder='Brief description of what this snippet does...'
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className='form-group'>
            <label className='form-label'>Tags</label>
            <div className='tags-input-container'>
              {tags.map((tag, idx) => (
                <span key={idx} className='tag-badge'>
                  {tag}
                  <button type='button' onClick={() => removeTag(idx)} aria-label={`Remove tag ${tag}`}>
                    <i className='fa-solid fa-xmark'></i>
                  </button>
                </span>
              ))}
              <input
                className='tag-input-field'
                placeholder={tags.length === 0 ? 'Type tag and press Enter...' : 'Add tag...'}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => {
                  if (tagInput.trim()) addTag(tagInput)
                }}
              />
            </div>
            <span className='form-hint'>Press Enter or Comma (,) to add.</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
            <button
              type='submit'
              className='btn btn-primary'
              style={{ padding: '0.75rem 2.5rem', flex: 1 }}
              disabled={loading}
            >
              {loading ? 'Posting...' : 'Post Snippet'}
            </button>
            <Link to='/' className='btn btn-ghost' style={{ padding: '0.75rem 1.5rem' }}>
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}