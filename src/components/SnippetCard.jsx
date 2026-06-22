import { Link, useNavigate } from 'react-router-dom'

export default function SnippetCard({ snippet }) {
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate(`/snippets/${snippet._id}`)
  }

  return (
    <div onClick={handleCardClick} className='snippet-card-link' style={{ cursor: 'pointer', textDecoration: 'none' }}>
      <div className='snippet-card'>
        <div className='card-header'>
          <span className='badge badge-lang'>
            {snippet.language}
          </span>
          <Link
            to={`/profile/${snippet.author?._id}`}
            className='card-author'
            onClick={(e) => e.stopPropagation()}
          >
            @{snippet.author?.username}
          </Link>
        </div>

        <h3 className='card-title'>{snippet.title}</h3>

        {snippet.description && (
          <p className='card-desc'>{snippet.description}</p>
        )}

        {snippet.tags?.length > 0 && (
          <div className='card-tags'>
            {snippet.tags.slice(0, 3).map((tag) => (
              <span key={tag} className='tag'>#{tag}</span>
            ))}
            {snippet.tags.length > 3 && (
              <span className='tag'>+{snippet.tags.length - 3}</span>
            )}
          </div>
        )}

        <div className='card-footer'>
          <span className='card-stat'>
            <i className='fa-regular fa-comment' style={{ marginRight: '0.35rem' }}></i>
            {snippet.comments?.length || 0}
          </span>
          {/* Upvotes & Downvotes */}
          <span className='card-stat' style={{
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <i className='fa-solid fa-chevron-up'></i>
            {snippet.upvotes?.length || 0}
          </span>
          <span className='card-stat' style={{
            color: 'var(--error)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <i className='fa-solid fa-chevron-down'></i>
            {snippet.downvotes?.length || 0}
          </span>
          {/* AI reviewed badge */}
          {snippet.aiReview?.generatedAt && (
            <span className='card-stat' style={{ color: 'var(--accent)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <i className='fa-solid fa-robot'></i>
              AI Reviewed
            </span>
          )}
        </div>
      </div>
    </div>
  )
}