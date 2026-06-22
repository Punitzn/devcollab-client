import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function SnippetDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [snippet, setSnippet] = useState(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await api.get(`/snippets/${id}`)
      setSnippet(data)
      setLoading(false)
    }
    fetch()
  }, [id])

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    const { data } = await api.post(`/snippets/${id}/comments`, { content: comment })
    setSnippet((prev) => ({ ...prev, comments: data }))
    setComment('')
  }

  const handleUpvote = async (commentId) => {
    const { data } = await api.patch(`/snippets/${id}/comments/${commentId}/upvote`)
    setSnippet((prev) => ({
      ...prev,
      comments: prev.comments.map((c) => (c._id === commentId ? data : c)),
    }))
  }

  if (loading) return <p style={styles.msg}>Loading...</p>
  if (!snippet) return <p style={styles.msg}>Snippet not found.</p>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.lang}>{snippet.language}</span>
        <h1 style={styles.title}>{snippet.title}</h1>
        <p style={styles.desc}>{snippet.description}</p>
        <p style={styles.author}>by @{snippet.author?.username}</p>
      </div>

      <pre style={styles.code}>{snippet.code}</pre>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Comments ({snippet.comments?.length})</h3>
        {snippet.comments?.map((c) => (
          <div key={c._id} style={styles.comment}>
            <div style={styles.commentHeader}>
              <span style={styles.commentAuthor}>@{c.user?.username}</span>
              {c.lineNumber && <span style={styles.line}>Line {c.lineNumber}</span>}
            </div>
            <p style={styles.commentContent}>{c.content}</p>
            {user && (
              <button onClick={() => handleUpvote(c._id)} style={styles.upvoteBtn}>
                ▲ {c.upvotes?.length || 0}
              </button>
            )}
          </div>
        ))}

        {user ? (
          <form onSubmit={handleComment} style={styles.commentForm}>
            <input
              style={styles.input}
              placeholder='Add a comment...'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button type='submit' style={styles.btn}>
              Post
            </button>
          </form>
        ) : (
          <p style={styles.msg}>Login to comment</p>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' },
  header: { marginBottom: '1.5rem' },
  lang: { background: '#f3f4f6', padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '500' },
  title: { fontSize: '1.6rem', fontWeight: '700', margin: '0.5rem 0' },
  desc: { color: '#6b7280', marginBottom: '0.25rem' },
  author: { color: '#9ca3af', fontSize: '0.85rem' },
  code: { background: '#1e1e1e', color: '#d4d4d4', padding: '1.5rem', borderRadius: '8px', overflowX: 'auto', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2rem' },
  section: { marginTop: '1.5rem' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' },
  comment: { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' },
  commentHeader: { display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.4rem' },
  commentAuthor: { fontWeight: '500', fontSize: '0.9rem' },
  line: { background: '#e5e7eb', padding: '1px 8px', borderRadius: '4px', fontSize: '0.8rem' },
  commentContent: { color: '#374151', fontSize: '0.95rem' },
  upvoteBtn: { background: 'none', border: '1px solid #e5e7eb', padding: '2px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.5rem' },
  commentForm: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem' },
  input: { flex: 1, padding: '0.7rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem' },
  btn: { padding: '0.7rem 1.5rem', background: '#111', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  msg: { textAlign: 'center', color: '#6b7280', marginTop: '2rem' },
}