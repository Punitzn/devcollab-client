import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { useAuth } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import SnippetDetail from './pages/SnippetDetail.jsx'
import CreateSnippet from './pages/CreateSnippet.jsx'
import CompleteProfile from './pages/CompleteProfile.jsx'
import Profile from './pages/Profile.jsx'

// Show spinner while checking session cookie on first load
function AppLoader() {
  return (
    <div className='loading-container full-center'>
      <div className='spinner'></div>
    </div>
  )
}

// Redirect OAuth users who haven't set a username yet
function RequireCompleteProfile({ children }) {
  const { user } = useAuth()
  if (user && !user.isProfileComplete) {
    return <Navigate to='/complete-profile' replace />
  }
  return children
}

// Protect routes that need a logged-in user
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <AppLoader />
  if (!user) return <Navigate to='/login' replace />
  return children
}

export default function App() {
  const { loading } = useAuth()

  // Wait until session check finishes before rendering routes
  if (loading) return <AppLoader />

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path='/' element={<RequireCompleteProfile><Home /></RequireCompleteProfile>} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/snippets/:id' element={<RequireCompleteProfile><SnippetDetail /></RequireCompleteProfile>} />
        <Route path='/profile/:id' element={<RequireCompleteProfile><Profile /></RequireCompleteProfile>} />

        {/* OAuth profile completion (no navbar redirect loop) */}
        <Route path='/complete-profile' element={<CompleteProfile />} />

        {/* Protected routes */}
        <Route path='/create' element={
          <RequireAuth>
            <RequireCompleteProfile>
              <CreateSnippet />
            </RequireCompleteProfile>
          </RequireAuth>
        } />

        {/* Catch-all */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </>
  )
}