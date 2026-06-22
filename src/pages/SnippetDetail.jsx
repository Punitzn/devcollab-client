import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/axios.js'
import { isApiPointingAtFrontend } from '../api/config.js'
import { useAuth } from '../context/AuthContext.jsx'
import Editor from '@monaco-editor/react'

const LANGUAGES = ['javascript', 'python', 'cpp', 'java', 'typescript', 'go', 'rust']

export default function SnippetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [snippet, setSnippet] = useState(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [voteLoading, setVoteLoading] = useState(false)
  const [aiReview, setAiReview] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const [editorLanguage, setEditorLanguage] = useState('javascript')
  
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedCode, setEditedCode] = useState('')
  const [editedLanguage, setEditedLanguage] = useState('javascript')
  const [editedTags, setEditedTags] = useState([])
  const [tagInput, setTagInput] = useState('')

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

  useEffect(() => {
    const fetchSnippet = async () => {
      try {
        const { data } = await api.get(`/snippets/${id}`)
        setSnippet(data)
        setEditedTitle(data.title)
        setEditedDescription(data.description || '')
        setEditedCode(data.code)
        setEditedLanguage(data.language)
        setEditedTags(data.tags || [])
        setEditorLanguage(data.language)
        if (data.aiReview?.generatedAt) {
          setAiReview(data.aiReview)
        }
      } catch (err) {
        console.error('Failed to fetch snippet:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSnippet()
  }, [id])

  useEffect(() => {
    const onStarted = () => {
      setAiLoading(true)
      setAiError('')
    }
    const onCompleted = (e) => {
      setAiReview(e.detail)
      setAiLoading(false)
    }
    const onFailed = (e) => {
      setAiError(e.detail)
      setAiLoading(false)
    }

    window.addEventListener('ai-review-started', onStarted)
    window.addEventListener('ai-review-completed', onCompleted)
    window.addEventListener('ai-review-failed', onFailed)

    return () => {
      window.removeEventListener('ai-review-started', onStarted)
      window.removeEventListener('ai-review-completed', onCompleted)
      window.removeEventListener('ai-review-failed', onFailed)
    }
  }, [])

  const handleAiReview = async (force = false) => {
    setAiLoading(true)
    setAiError('')
    try {
      const { data } = await api.post(
        `/snippets/${id}/ai-review${force ? '?force=true' : ''}`,
      )
      setAiReview(data.aiReview)
    } catch (err) {
      if (err.response?.status === 404 && isApiPointingAtFrontend()) {
        setAiError(
          'AI review API is pointing at the frontend deployment. Set VITE_API_URL on Vercel to your Render backend URL ending in /api.',
        )
        return
      }

      setAiError(
        err.response?.data?.message ||
          'Failed to generate AI review. Check your OpenAI API key.',
      )
    } finally {
      setAiLoading(false)
    }
  }

  const handleVote = async (type) => {
    if (!user || voteLoading) return
    setVoteLoading(true)
    try {
      const { data } = await api.patch(`/snippets/${id}/${type}`)
      setSnippet((prev) => ({
        ...prev,
        upvotes: data.upvotes,
        downvotes: data.downvotes,
      }))
    } catch (err) {
      console.error(`${type} failed:`, err)
    } finally {
      setVoteLoading(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.post(`/snippets/${id}/comments`, {
        content: comment,
      })
      setSnippet((prev) => ({ ...prev, comments: data }))
      setComment('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpvoteComment = async (commentId) => {
    if (!user) return
    try {
      const { data } = await api.patch(
        `/snippets/${id}/comments/${commentId}/upvote`,
      )
      setSnippet((prev) => ({
        ...prev,
        comments: prev.comments.map((c) =>
          c._id === commentId ? { ...data, user: c.user } : c,
        ),
      }))
    } catch (err) {
      console.error('Comment upvote failed:', err)
    }
  }

  const handleDownvoteComment = async (commentId) => {
    if (!user) return
    try {
      const { data } = await api.patch(
        `/snippets/${id}/comments/${commentId}/downvote`,
      )
      setSnippet((prev) => ({
        ...prev,
        comments: prev.comments.map((c) =>
          c._id === commentId ? { ...data, user: c.user } : c,
        ),
      }))
    } catch (err) {
      console.error('Comment downvote failed:', err)
    }
  }

  const handleDeleteSnippet = async () => {
    if (!window.confirm('Are you sure you want to delete this snippet?')) return
    try {
      await api.delete(`/snippets/${id}`)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete snippet.')
    }
  }

  const handleUpdateSnippet = async () => {
    if (!editedTitle.trim()) {
      setError('Title is required')
      return
    }
    const currentCode = isEditing ? editedCode : snippet.code
    if (!currentCode.trim()) {
      setError('Code is required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.put(`/snippets/${id}`, {
        title: editedTitle,
        description: editedDescription,
        code: currentCode,
        language: editedLanguage,
        tags: editedTags,
      })
      setSnippet((prev) => ({
        ...prev,
        title: data.title,
        description: data.description,
        code: data.code,
        language: data.language,
        tags: data.tags,
      }))
      setIsEditing(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update snippet.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = () => {
    const codeToCopy = isEditing ? editedCode : snippet?.code
    if (!codeToCopy) return
    navigator.clipboard.writeText(codeToCopy).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const addEditedTag = (tag) => {
    const trimmed = tag.trim().toLowerCase().replace(/,/g, '')
    if (trimmed && !editedTags.includes(trimmed)) {
      setEditedTags([...editedTags, trimmed])
    }
    setTagInput('')
  }

  const handleEditedTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addEditedTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && editedTags.length > 0) {
      setEditedTags(editedTags.slice(0, -1))
    }
  }

  const removeEditedTag = (indexToRemove) => {
    setEditedTags(editedTags.filter((_, i) => i !== indexToRemove))
  }

  if (loading) {
    return (
      <div className="loading-container full-center">
        <div className="spinner"></div>
        <p>Loading snippet...</p>
      </div>
    )
  }

  if (!snippet) {
    return (
      <div className="full-center">
        <h2>Snippet not found</h2>
        <p>This snippet may have been deleted or doesn&apos;t exist.</p>
        <Link
          to="/"
          className="btn btn-primary"
          style={{ marginTop: '0.5rem' }}
        >
          ← Back to Home
        </Link>
      </div>
    )
  }

  const hasUpvoted =
    user &&
    snippet.upvotes?.some((uid) => uid === user._id || uid?._id === user._id)
  const hasDownvoted =
    user &&
    snippet.downvotes?.some((uid) => uid === user._id || uid?._id === user._id)

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div className="detail-meta">
          <span className="badge badge-lang">{snippet.language}</span>
          {!isEditing && snippet.tags?.map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>
        
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem', marginTop: '0.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Title *</label>
              <input
                className="input"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Snippet title..."
                style={{ fontSize: '1.25rem', fontWeight: 'bold' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Description</label>
              <textarea
                className="input"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Snippet description..."
                style={{ minHeight: '60px', resize: 'vertical' }}
              />
            </div>
            <div className='form-group'>
              <label className='form-label' style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tags</label>
              <div className='tags-input-container' style={{ background: 'var(--bg-elevated)' }}>
                {editedTags.map((tag, idx) => (
                  <span key={idx} className='tag-badge'>
                    {tag}
                    <button type='button' onClick={() => removeEditedTag(idx)} aria-label={`Remove tag ${tag}`}>
                      <i className='fa-solid fa-xmark'></i>
                    </button>
                  </span>
                ))}
                <input
                  className='tag-input-field'
                  placeholder={editedTags.length === 0 ? 'Type tag and press Enter or Comma...' : 'Add tag...'}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleEditedTagKeyDown}
                  onBlur={() => {
                    if (tagInput.trim()) addEditedTag(tagInput)
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <h1 className="detail-title">{snippet.title}</h1>
            {snippet.description && (
              <p className="detail-desc">{snippet.description}</p>
            )}
          </>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginTop: '0.75rem',
          }}
        >
          <p className="detail-author">
            by{' '}
            <Link
              to={`/profile/${snippet.author?._id}`}
              style={{ color: 'var(--accent)', fontWeight: 500 }}
            >
              @{snippet.author?.username}
            </Link>
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {user && (user._id === snippet.author?._id || user._id === snippet.author) && (
              <>
                <button
                  className="btn btn-ghost"
                  style={{
                    color: 'var(--accent)',
                    borderColor: 'transparent',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.85rem',
                  }}
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false)
                      setEditedTitle(snippet.title)
                      setEditedDescription(snippet.description || '')
                      setEditedCode(snippet.code)
                      setEditedLanguage(snippet.language)
                      setEditedTags(snippet.tags || [])
                      setEditorLanguage(snippet.language)
                    } else {
                      setIsEditing(true)
                      setEditedTitle(snippet.title)
                      setEditedDescription(snippet.description || '')
                      setEditedCode(snippet.code)
                      setEditedLanguage(snippet.language)
                      setEditedTags(snippet.tags || [])
                    }
                  }}
                >
                  <i className={`fa-regular ${isEditing ? 'fa-circle-xmark' : 'fa-pen-to-square'}`} style={{ marginRight: '0.35rem' }}></i>
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
                {isEditing && (
                  <button
                    className="btn btn-primary"
                    style={{
                      padding: '0.4rem 1rem',
                      fontSize: '0.85rem',
                    }}
                    onClick={handleUpdateSnippet}
                    disabled={submitting}
                  >
                    <i className="fa-regular fa-floppy-disk" style={{ marginRight: '0.35rem' }}></i>
                    Save
                  </button>
                )}
                {!isEditing && (
                  <button
                    className="btn btn-ghost"
                    style={{
                      color: 'var(--error)',
                      borderColor: 'transparent',
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.85rem',
                    }}
                    onClick={handleDeleteSnippet}
                    title="Delete snippet"
                  >
                    <i className="fa-regular fa-trash-can" style={{ marginRight: '0.35rem' }}></i>
                    Delete
                  </button>
                )}
              </>
            )}

            <div className="snippet-vote-row">
              <button
                className={`vote-btn vote-up${hasUpvoted ? ' active' : ''}`}
                onClick={() => handleVote('upvote')}
                disabled={!user || voteLoading}
                title={user ? 'Upvote this snippet' : 'Login to vote'}
              >
                <i
                  className="fa-solid fa-chevron-up"
                  style={{ marginRight: '0.35rem' }}
                ></i>
                <span>{snippet.upvotes?.length || 0}</span>
              </button>
              <button
                className={`vote-btn vote-down${hasDownvoted ? ' active' : ''}`}
                onClick={() => handleVote('downvote')}
                disabled={!user || voteLoading}
                title={user ? 'Downvote this snippet' : 'Login to vote'}
              >
                <i
                  className="fa-solid fa-chevron-down"
                  style={{ marginRight: '0.35rem' }}
                ></i>
                <span>{snippet.downvotes?.length || 0}</span>
              </button>
              {!user && (
                <span
                  style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                >
                  <Link to="/login">Sign in</Link> to vote
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && <div className='auth-error' style={{ marginBottom: '1.25rem' }}>{error}</div>}

      <div className="code-block-wrapper">
        <div className="code-block-header">
          <div className="code-block-dots">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="code-block-lang" style={{ color: 'var(--text-muted)' }}>Language</span>
            <select
              className="input"
              style={{
                padding: '0.2rem 2rem 0.2rem 0.5rem',
                fontSize: '0.75rem',
                height: '28px',
                width: 'auto',
                minWidth: '110px',
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
              value={editorLanguage}
              onChange={(e) => {
                const newLang = e.target.value
                setEditorLanguage(newLang)
                setEditedLanguage(newLang)
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l === 'cpp' ? 'C++' : l.charAt(0).toUpperCase() + l.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleCopy} className="copy-btn">
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        <div style={{ background: editorTheme === 'vs-dark' ? '#1e1e1e' : '#fff' }}>
          <Editor
            height="400px"
            language={editorLanguage}
            theme={editorTheme}
            value={isEditing ? editedCode : snippet.code}
            onChange={(val) => {
              if (isEditing) {
                setEditedCode(val || '')
              }
            }}
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
              readOnly: !isEditing,
              tabSize: 2,
            }}
          />
        </div>
      </div>

      <div className="ai-review-section">
        <div className="ai-review-header">
          <div
            className="ai-review-title"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <i className="fa-solid fa-robot"></i>
            AI Code Review
            <span className="ai-badge">AI</span>
          </div>
          {aiReview && !aiLoading && (
            <button
              className="btn btn-ghost"
              style={{
                fontSize: '0.8rem',
                padding: '0.3rem 0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              onClick={() => handleAiReview(true)}
            >
              <i className="fa-solid fa-rotate"></i>
              Refresh
            </button>
          )}
        </div>

        {aiLoading && (
          <div className="ai-loading">
            <div className="ai-dot"></div>
            <div className="ai-dot"></div>
            <div className="ai-dot"></div>
            Analyzing your code...
          </div>
        )}

        {!aiLoading && aiError && (
          <div className="ai-generate-wrap">
            <div
              className="auth-error"
              style={{ width: '100%', textAlign: 'left' }}
            >
              {aiError}
            </div>
          </div>
        )}

        {!aiLoading && !aiReview && !aiError && (
          <div className="ai-generate-wrap">
            <p>
              Get an instant AI-powered review: bugs found, suggestions, and
              complexity analysis.
            </p>
            {user ? (
              <button
                className="btn btn-primary"
                onClick={() => handleAiReview(false)}
              >
                Generate AI Review
              </button>
            ) : (
              <p>
                <Link to="/login">Sign in</Link> to generate an AI review
              </p>
            )}
          </div>
        )}

        {!aiLoading && aiReview && (
          <div className="ai-review-body">
            {/* Summary */}
            {aiReview.summary && (
              <p className="ai-review-summary">{aiReview.summary}</p>
            )}

            {/* Complexity */}
            {aiReview.complexityRating && (
              <div className="ai-review-group">
                <span
                  className="ai-review-group-title"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <i className="fa-regular fa-clock"></i>
                  Complexity
                </span>
                <span className="ai-complexity">
                  {aiReview.complexityRating}
                </span>
              </div>
            )}

            {/* Bugs */}
            <div className="ai-review-group">
              <span
                className="ai-review-group-title"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <i className="fa-solid fa-bug"></i>
                Bugs & Issues
              </span>
              {aiReview.bugs?.length === 0 ? (
                <span
                  className="ai-no-bugs"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <i
                    className="fa-solid fa-check"
                    style={{ color: 'var(--success)' }}
                  ></i>
                  No bugs found — clean code!
                </span>
              ) : (
                <ul className="ai-review-list bugs">
                  {aiReview.bugs?.map((bug, i) => (
                    <li key={i}>{bug}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Suggestions */}
            {aiReview.suggestions?.length > 0 && (
              <div className="ai-review-group">
                <span
                  className="ai-review-group-title"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <i className="fa-regular fa-lightbulb"></i>
                  Suggestions
                </span>
                <ul className="ai-review-list suggestions">
                  {aiReview.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiReview.generatedAt && (
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.25rem',
                }}
              >
                Generated {new Date(aiReview.generatedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ─── Comments Section ──────────────────────────────────── */}
      <div className="comments-section">
        <h3 className="comments-title">
          Discussion
          <span className="comments-count">
            {snippet.comments?.length || 0}
          </span>
        </h3>

        {snippet.comments?.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '2rem 0',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
            }}
          >
            No comments yet. Be the first to comment!
          </div>
        )}

        {snippet.comments?.map((c) => (
          <div key={c._id} className="comment-card fade-in">
            <div className="comment-header">
              <Link
                to={`/profile/${c.user?._id}`}
                className="comment-author"
                style={{ textDecoration: 'none' }}
              >
                @{c.user?.username}
              </Link>
              {c.lineNumber && (
                <span className="comment-line-badge">Line {c.lineNumber}</span>
              )}
            </div>
            <p className="comment-content">{c.content}</p>
            {user && (
              <div
                className="comment-actions"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.25rem',
                }}
              >
                <button
                  onClick={() => handleUpvoteComment(c._id)}
                  className={`btn btn-ghost ${c.upvotes?.includes(user._id) ? 'active' : ''}`}
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    color: c.upvotes?.includes(user._id)
                      ? 'var(--success)'
                      : 'var(--text-secondary)',
                    borderColor: c.upvotes?.includes(user._id)
                      ? 'var(--success)'
                      : 'var(--border)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                  title="Upvote comment"
                >
                  <i className="fa-solid fa-chevron-up"></i>
                  <span>{c.upvotes?.length || 0}</span>
                </button>

                <button
                  onClick={() => handleDownvoteComment(c._id)}
                  className={`btn btn-ghost ${c.downvotes?.includes(user._id) ? 'active' : ''}`}
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    color: c.downvotes?.includes(user._id)
                      ? 'var(--error)'
                      : 'var(--text-secondary)',
                    borderColor: c.downvotes?.includes(user._id)
                      ? 'var(--error)'
                      : 'var(--border)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                  title="Downvote comment"
                >
                  <i className="fa-solid fa-chevron-down"></i>
                  <span>{c.downvotes?.length || 0}</span>
                </button>
              </div>
            )}
          </div>
        ))}

        {user ? (
          <form onSubmit={handleComment} className="comment-form">
            <input
              className="input"
              placeholder="Share your thoughts on this snippet..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flexShrink: 0, padding: '0.7rem 1.25rem' }}
              disabled={submitting}
            >
              {submitting ? '...' : 'Post'}
            </button>
          </form>
        ) : (
          <div className="login-prompt">
            <Link to="/login">Sign in</Link> to join the discussion
          </div>
        )}
        {error && (
          <div className="auth-error" style={{ marginTop: '0.75rem' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
