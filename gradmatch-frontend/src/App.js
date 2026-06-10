import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import ProfileInput from './pages/ProfileInput'
import Results from './pages/Results'
import ProgrammeDetail from './pages/ProgrammeDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import History from './pages/History'
import Wishlist from './pages/Wishlist'
import Tracker from './pages/Tracker'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return null

  const isPublic = ['/landing', '/login', '/register'].some(p =>
    window.location.pathname === p
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className={!isPublic && user ? 'lg:ml-56 pt-14 lg:pt-0' : ''}>
        <Routes>
          <Route path="/landing" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
          <Route path="/" element={<Navigate to={user ? '/dashboard' : '/landing'} />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/find" element={<ProtectedRoute><ProfileInput /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
          <Route path="/programme/:id" element={<ProtectedRoute><ProgrammeDetail /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/tracker" element={<ProtectedRoute><Tracker /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/landing'} />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App