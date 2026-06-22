import { useEffect, useState } from 'react'
import api from '../api/axios.js'
import SnippetCard from '../components/SnippetCard.jsx'

const LANGUAGES = ['all', 'javascript', 'python', 'cpp', 'java', 'typescript']

export default function Home() {
  const [snippets, setSnippets] = useState([])
  const [language, setLanguage] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSnippets = async () => {
      setLoading(true)
      const params = {}
      if (language !== 'all') params.language = language
      if (search) params.search = search
      const { data } = await api.get('/snippets', { params })
      setSnippets(data)
      setLoading(false)
    }
    fetchSnippets()
  }, [language, search])

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <input
          style={styles.search}
          placeholder='Search snippets...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={styles.filters}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              style={{
                ...styles.filterBtn,
                background: language === lang ? '#111' : '#f3f4f6',
                color: language === lang ? '#fff' : '#374151',
              }}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <p style={styles.msg}>Loading...</p>
      ) : snippets.length === 0 ? (
        <p style={styles.msg}>No snippets found.</p>
      ) : (
        <div style={styles.grid}>
          {snippets.map((s) => (
            <SnippetCard key={s._id} snippet={s} />
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' },
  toolbar: { marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  search: { padding: '0.7rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem', width: '100%' },
  filters: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  filterBtn: { padding: '0.4rem 0.9rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
  msg: { textAlign: 'center', color: '#6b7280', marginTop: '3rem' },
}