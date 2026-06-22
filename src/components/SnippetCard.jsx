import { Link } from 'react-router-dom'

export default function SnippetCard({ snippet }) {
  return (
    <Link to={`/snippets/${snippet._id}`} style={styles.link}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.lang}>{snippet.language}</span>
          <span style={styles.author}>@{snippet.author?.username}</span>
        </div>
        <h3 style={styles.title}>{snippet.title}</h3>
        <p style={styles.desc}>{snippet.description}</p>
        <div style={styles.tags}>
          {snippet.tags?.map((tag) => (
            <span key={tag} style={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
        <div style={styles.footer}>
          <span>{snippet.comments?.length || 0} comments</span>
          <span>{snippet.upvotes?.length || 0} upvotes</span>
        </div>
      </div>
    </Link>
  )
}

const styles = {
  link: { textDecoration: 'none', color: 'inherit' },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.25rem', transition: 'box-shadow 0.2s' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
  lang: { background: '#f3f4f6', padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '500' },
  author: { color: '#6b7280', fontSize: '0.85rem' },
  title: { fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.4rem' },
  desc: { color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.75rem' },
  tags: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' },
  tag: { color: '#3b82f6', fontSize: '0.8rem' },
  footer: { display: 'flex', gap: '1rem', color: '#9ca3af', fontSize: '0.85rem', borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' },
}