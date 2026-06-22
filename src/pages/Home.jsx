import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios.js'
import SnippetCard from '../components/SnippetCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const LANGUAGES = ['all', 'javascript', 'python', 'cpp', 'java', 'typescript', 'go', 'rust']

export default function Home() {
  const { user } = useAuth()
  const [snippets, setSnippets] = useState([])
  const [language, setLanguage] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSnippets = async () => {
      setLoading(true)
      try {
        const params = {}
        if (language !== 'all') params.language = language
        if (search) params.search = search
        const { data } = await api.get('/snippets', { params })
        setSnippets(data)
      } catch (err) {
        console.error('Failed to fetch snippets:', err)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchSnippets, search ? 400 : 0)
    return () => clearTimeout(debounce)
  }, [language, search])

  return (
    <div>
      {/* Hero Header */}
      <div className='home-header'>
        <h1>Discover &amp; Share Code Snippets</h1>
        <p>A collaborative space for developers to share, discover, and discuss code snippets.</p>
        {!user && (
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to='/register' className='btn btn-primary' style={{ padding: '0.6rem 1.5rem' }}>
              Get Started
            </Link>
            <Link to='/login' className='btn btn-ghost' style={{ padding: '0.6rem 1.25rem' }}>
              Sign In
            </Link>
          </div>
        )}
      </div>

      <div className='page-container'>
        <div className='toolbar'>
          {/* Search */}
          <div className='search-wrapper'>
            <i className='fa-solid fa-magnifying-glass search-icon'></i>
            <input
              className='input search-input'
              placeholder='Search snippets by title...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Language Filters */}
          <div className='filter-row'>
            <span className='filter-label'>Language:</span>
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`filter-btn${language === lang ? ' active' : ''}`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className='loading-container'>
            <div className='spinner'></div>
            <p>Loading snippets...</p>
          </div>
        ) : snippets.length === 0 ? (
          <div className='empty-state'>
            <div className='empty-icon' style={{ marginBottom: '1rem' }}>
              <i className='fa-regular fa-folder-open' style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }}></i>
            </div>
            <h3>No snippets found</h3>
            <p>
              {search
                ? `No results for "${search}". Try a different search term.`
                : language !== 'all'
                ? `No ${language} snippets yet. Be the first to post one!`
                : 'No snippets yet. Be the first to share your code!'}
            </p>
            {user && (
              <Link to='/create' className='btn btn-primary' style={{ marginTop: '0.5rem' }}>
                + Post a Snippet
              </Link>
            )}
          </div>
        ) : (
          <div className='snippets-grid fade-in'>
            {snippets.map((s) => (
              <SnippetCard key={s._id} snippet={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}