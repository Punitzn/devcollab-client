import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import SnippetDetail from './pages/SnippetDetail.jsx'
import CreateSnippet from './pages/CreateSnippet.jsx'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/snippets/:id' element={<SnippetDetail />} />
        <Route path='/create' element={<CreateSnippet />} />
      </Routes>
    </>
  )
}