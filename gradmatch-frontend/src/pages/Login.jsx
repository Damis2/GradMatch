import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await login(form.username, form.password)
    if (result.success) {
      navigate('/')
    } else {
      setError(result.error || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-[#0c1a2e] rounded-lg flex items-center justify-center">
              <span className="text-cyan-400 font-bold text-base">G</span>
            </div>
            <span className="text-[#0c1a2e] font-bold text-xl tracking-tight">
              Grad<span className="text-[#0891b2]">Match</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-[#0c1a2e]">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your GradMatch account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <input
                type="text" name="username" value={form.username}
                onChange={handleChange} placeholder="Enter your username" required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-[#0c1a2e] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0891b2] focus:border-transparent focus:bg-white transition-all"
              />
            </div>

            <div className="mb-7">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password" name="password" value={form.password}
                onChange={handleChange} placeholder="Enter your password" required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-[#0c1a2e] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0891b2] focus:border-transparent focus:bg-white transition-all"
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#0c1a2e] hover:bg-[#0891b2] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 text-sm">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#0891b2] font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          GradMatch © 2026 
        </p>
      </div>
    </div>
  )
}

export default Login