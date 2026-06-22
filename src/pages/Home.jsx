import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios.js'
import SnippetCard from '../components/SnippetCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const LANGUAGES = ['all', 'javascript', 'python', 'cpp', 'java', 'typescript', 'go', 'rust']

export default function Home() {
  const { user } = useAuth()
  const [snippets, setSnippets]         = useState([])
  const [language, setLanguage]         = useState('all')
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [page, setPage]                 = useState(1)
  const [totalPages, setTotalPages]     = useState(1)
  const isFirstRender                   = useRef(true)

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1)
    setSnippets([])
  }, [language, search])

  useEffect(() => {
    const fetchSnippets = async () => {
      // First page = full loading state; subsequent = "load more" spinner
      if (page === 1) setLoading(true)
      else setLoadingMore(true)

      try {
        const params = { page, limit: 20 }
        if (language !== 'all') params.language = language
        if (search) params.search = search

        const { data } = await api.get('/snippets', { params })
        const incoming = data.snippets ?? data // backwards-compat fallback

        setSnippets((prev) => page === 1 ? incoming : [...prev, ...incoming])
        setTotalPages(data.totalPages ?? 1)
      } catch (err) {
        console.error('Failed to fetch snippets:', err)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    }

    // Debounce only for search input; fire immediately for language / page changes
    const delay = search && !isFirstRender.current ? 400 : 0
    isFirstRender.current = false
    const timer = setTimeout(fetchSnippets, delay)
    return () => clearTimeout(timer)
  }, [language, search, page])

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
          <>
            <div className='snippets-grid fade-in'>
              {snippets.map((s) => (
                <SnippetCard key={s._id} snippet={s} />
              ))}
            </div>

            {/* Load More */}
            {page < totalPages && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                <button
                  className='btn btn-ghost'
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loadingMore}
                  style={{ padding: '0.65rem 2rem', minWidth: '140px' }}
                >
                  {loadingMore ? <span className='spinner' style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}