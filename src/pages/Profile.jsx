import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/axios.js'
import SnippetCard from '../components/SnippetCard.jsx'
import ActivityHeatmap from '../components/ActivityHeatmap.jsx'

const PROVIDER_LABELS = { google: 'Google', github: 'GitHub', local: 'Email' }

export default function Profile() {
  const { id } = useParams()
  const { user: currentUser, updateUser } = useAuth()

  const [profile, setProfile] = useState(null)
  const [snippets, setSnippets] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalSnippets, setTotalSnippets] = useState(0)
  const [activeTab, setActiveTab] = useState('snippets') // 'snippets' | 'edit' | 'security'
  const [bookmarkedSnippets, setBookmarkedSnippets] = useState([])
  const [loadingBookmarks, setLoadingBookmarks] = useState(false)

  // Edit profile form
  const [editForm, setEditForm] = useState({ username: '', bio: '', avatar: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')

  // Set password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  const isOwnProfile = currentUser && (currentUser._id === id)

  const [prevId, setPrevId] = useState(id)
  if (id !== prevId) {
    setPrevId(id)
    setPage(1)
    setSnippets([])
    setTotalPages(1)
    setTotalSnippets(0)
  }

  useEffect(() => {
    const fetchProfile = async () => {
      if (page === 1) setLoading(true)
      else setLoadingMore(true)

      try {
        const { data } = await api.get(`/users/${id}`, {
          params: { page, limit: 10 },
        })

        if (page === 1) {
          setProfile(data.user)
          setSnippets(data.snippets || [])
          setTotalSnippets(data.total || 0)
          setEditForm({
            username: data.user.username || '',
            bio: data.user.bio || '',
            avatar: data.user.avatar || '',
          })
        } else {
          setSnippets((prev) => [...prev, ...(data.snippets || [])])
        }
        setTotalPages(data.totalPages ?? 1)
      } catch {
        if (page === 1) setProfile(null)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    }
    fetchProfile()
  }, [id, page])

  useEffect(() => {
    if (activeTab !== 'bookmarks') return

    const fetchBookmarks = async () => {
      setLoadingBookmarks(true)
      try {
        const { data } = await api.get('/users/bookmarks')
        setBookmarkedSnippets(data || [])
      } catch (err) {
        console.error('Failed to fetch bookmarks:', err)
      } finally {
        setLoadingBookmarks(false)
      }
    }

    fetchBookmarks()
  }, [activeTab])

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditError('')
    setEditSuccess('')
    setEditLoading(true)
    try {
      const { data } = await api.put('/users/profile', editForm)
      setProfile((prev) => ({ ...prev, ...data.user }))
      updateUser(data.user)
      setEditSuccess('Profile updated successfully!')
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setEditLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return setPwError('Passwords do not match')
    }
    if (pwForm.newPassword.length < 6) {
      return setPwError('Password must be at least 6 characters')
    }

    setPwLoading(true)
    try {
      await api.put('/auth/set-password', {
        currentPassword: pwForm.currentPassword || undefined,
        newPassword: pwForm.newPassword,
      })
      setPwSuccess(currentUser?.password ? 'Password changed successfully!' : 'Password set! You can now sign in with email + password.')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to update password')
    } finally {
      setPwLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='loading-container full-center'>
        <div className='spinner'></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className='full-center'>
        <h2>User not found</h2>
        <Link to='/' className='btn btn-primary' style={{ marginTop: '0.5rem' }}>← Back to Home</Link>
      </div>
    )
  }

  const initials = profile.username?.[0]?.toUpperCase() || '?'

  return (
    <div className='page-container' style={{ maxWidth: '900px' }}>
      {/* Profile Header */}
      <div className='profile-header'>
        <div className='profile-avatar-wrap'>
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.username} className='profile-avatar' />
          ) : (
            <div className='profile-avatar-fallback'>{initials}</div>
          )}
        </div>
        <div className='profile-info'>
          <h1 className='profile-username'>@{profile.username}</h1>
          {profile.bio && <p className='profile-bio'>{profile.bio}</p>}
          <div className='profile-meta'>
            {isOwnProfile && profile.provider && (
              <span className='profile-provider'>{PROVIDER_LABELS[profile.provider] || profile.provider}</span>
            )}
            <span className='profile-stat' style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <i className='fa-solid fa-star' style={{ color: 'var(--warning)' }}></i>
              {profile.reputation} reputation
            </span>
            <span className='profile-stat' style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <i className='fa-solid fa-code'></i>
              {totalSnippets} snippets
            </span>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap userId={id} />

      {/* Tabs (only own profile gets edit tabs) */}
      <div className='profile-tabs'>
        <button
          className={`profile-tab${activeTab === 'snippets' ? ' active' : ''}`}
          onClick={() => setActiveTab('snippets')}
        >
          Snippets ({totalSnippets})
        </button>
        {isOwnProfile && (
          <>
            <button
              className={`profile-tab${activeTab === 'bookmarks' ? ' active' : ''}`}
              onClick={() => setActiveTab('bookmarks')}
            >
              Bookmarks ({currentUser?.bookmarks?.length || 0})
            </button>
            <button
              className={`profile-tab${activeTab === 'edit' ? ' active' : ''}`}
              onClick={() => setActiveTab('edit')}
            >
              Edit Profile
            </button>
            <button
              className={`profile-tab${activeTab === 'security' ? ' active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
          </>
        )}
      </div>

      {/* Tab Content */}
      <div className='profile-tab-content fade-in' key={activeTab}>

        {/* Snippets Tab */}
        {activeTab === 'snippets' && (
          snippets.length === 0 ? (
            <div className='empty-state'>
              <div className='empty-icon' style={{ marginBottom: '1rem' }}>
                <i className='fa-regular fa-folder-open' style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }}></i>
              </div>
              <h2>No snippets yet</h2>
              <p>{isOwnProfile ? 'Share your first code snippet!' : `${profile.username} hasn't posted any snippets yet.`}</p>
              {isOwnProfile && (
                <Link to='/create' className='btn btn-primary' style={{ marginTop: '0.5rem' }}>
                  + Post a Snippet
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className='snippets-grid'>
                {snippets.map((s) => (
                  <SnippetCard key={s._id} snippet={{ ...s, author: profile }} />
                ))}
              </div>

              {page < totalPages && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                  <button
                    className='btn btn-ghost'
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loadingMore}
                    style={{ padding: '0.65rem 2rem', minWidth: '140px' }}
                  >
                    {loadingMore ? (
                      <span className='spinner' style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </>
          )
        )}

        {/* Bookmarks Tab */}
        {activeTab === 'bookmarks' && isOwnProfile && (
          loadingBookmarks ? (
            <div className='loading-container' style={{ padding: '2rem 0', textAlign: 'center' }}>
              <div className='spinner' style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: '0.5rem' }}>Loading bookmarks...</p>
            </div>
          ) : bookmarkedSnippets.length === 0 ? (
            <div className='empty-state'>
              <div className='empty-icon' style={{ marginBottom: '1rem' }}>
                <i className='fa-regular fa-bookmark' style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }}></i>
              </div>
              <h2>No bookmarks yet</h2>
              <p>Explore snippets and bookmark them to save them here!</p>
              <Link to='/' className='btn btn-primary' style={{ marginTop: '0.5rem' }}>
                Browse Snippets
              </Link>
            </div>
          ) : (
            <div className='snippets-grid'>
              {bookmarkedSnippets.map((s) => (
                <SnippetCard key={s._id} snippet={s} />
              ))}
            </div>
          )
        )}

        {/* Edit Profile Tab */}
        {activeTab === 'edit' && isOwnProfile && (
          <div className='profile-form-wrap'>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Edit Profile</h2>
            {editError && <div className='auth-error' style={{ marginBottom: '1rem' }}>{editError}</div>}
            {editSuccess && (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--success-muted)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 'var(--radius-md)', color: 'var(--success)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {editSuccess}
              </div>
            )}
            <form onSubmit={handleEditSubmit} className='auth-form'>
              <div className='form-group'>
                <label className='form-label'>Avatar URL</label>
                <input
                  className='input'
                  placeholder='https://example.com/avatar.jpg'
                  value={editForm.avatar}
                  onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                />
                {editForm.avatar && (
                  <img src={editForm.avatar} alt='preview' style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', marginTop: '0.5rem', border: '2px solid var(--border-subtle)' }} onError={(e) => (e.target.style.display = 'none')} />
                )}
              </div>
              <div className='form-group'>
                <label className='form-label'>Username</label>
                <input
                  className='input'
                  placeholder='cooldev42'
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                />
              </div>
              <div className='form-group'>
                <label className='form-label'>Bio</label>
                <textarea
                  className='input'
                  placeholder='Tell the community a bit about yourself...'
                  value={editForm.bio}
                  rows={3}
                  style={{ resize: 'vertical', fontFamily: 'var(--font-sans)' }}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                />
              </div>
              <button type='submit' className='btn btn-primary' style={{ padding: '0.75rem 2rem' }} disabled={editLoading}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && isOwnProfile && (
          <div className='profile-form-wrap'>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>
              {currentUser?.provider !== 'local' && !currentUser?.password
                ? 'Set a Password'
                : 'Change Password'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {currentUser?.provider !== 'local' && !currentUser?.password
                ? `You're signed in via ${PROVIDER_LABELS[currentUser?.provider] || currentUser?.provider}. Setting a password lets you also sign in with your email.`
                : 'Update your account password.'}
            </p>

            {pwError && <div className='auth-error' style={{ marginBottom: '1rem' }}>{pwError}</div>}
            {pwSuccess && (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--success-muted)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 'var(--radius-md)', color: 'var(--success)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {pwSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className='auth-form'>
              {/* Only ask for current password if they already have one */}
              {currentUser?.password && (
                <div className='form-group'>
                  <label className='form-label'>Current Password</label>
                  <input
                    className='input'
                    type='password'
                    placeholder='Enter current password'
                    value={pwForm.currentPassword}
                    autoComplete='current-password'
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  />
                </div>
              )}
              <div className='form-group'>
                <label className='form-label'>New Password</label>
                <input
                  className='input'
                  type='password'
                  placeholder='At least 6 characters'
                  value={pwForm.newPassword}
                  autoComplete='new-password'
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                />
              </div>
              <div className='form-group'>
                <label className='form-label'>Confirm New Password</label>
                <input
                  className='input'
                  type='password'
                  placeholder='Repeat new password'
                  value={pwForm.confirmPassword}
                  autoComplete='new-password'
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                />
              </div>
              <button type='submit' className='btn btn-primary' style={{ padding: '0.75rem 2rem' }} disabled={pwLoading}>
                {pwLoading ? 'Updating...' : currentUser?.password ? 'Change Password' : 'Set Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
