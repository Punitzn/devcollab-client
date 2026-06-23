import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { useAuth } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

const SnippetDetail = lazy(() => import('./pages/SnippetDetail.jsx'))
const CreateSnippet = lazy(() => import('./pages/CreateSnippet.jsx'))
const CompleteProfile = lazy(() => import('./pages/CompleteProfile.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))

function AppLoader() {
  return (
    <div className='loading-container full-center'>
      <div className='spinner'></div>
    </div>
  )
}

function PageFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
      <div className='spinner' style={{ width: '28px', height: '28px', borderWidth: '2px' }}></div>
    </div>
  )
}

function RequireCompleteProfile({ children }) {
  const { user } = useAuth()
  if (user && !user.isProfileComplete) {
    return <Navigate to='/complete-profile' replace />
  }
  return children
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <AppLoader />
  if (!user) return <Navigate to='/login' replace />
  return children
}

export default function App() {
  const { loading } = useAuth()

  if (loading) return <AppLoader />

  return (
    <>
      <Navbar />
      <CommandPalette />
      <main>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path='/' element={<RequireCompleteProfile><Home /></RequireCompleteProfile>} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/snippets/:id' element={<RequireCompleteProfile><SnippetDetail /></RequireCompleteProfile>} />
            <Route path='/profile/:id' element={<RequireCompleteProfile><Profile /></RequireCompleteProfile>} />
            <Route path='/complete-profile' element={<CompleteProfile />} />
            <Route path='/create' element={
              <RequireAuth>
                <RequireCompleteProfile>
                  <CreateSnippet />
                </RequireCompleteProfile>
              </RequireAuth>
            } />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </Suspense>
      </main>
    </>
  )
}