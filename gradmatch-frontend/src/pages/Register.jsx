import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const validateForm = () => {
    if (!form.username || !form.email || !form.password || !form.confirmPassword) return 'All fields are required'
    if (form.username.length < 3) return 'Username must be at least 3 characters'
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(form.email)) return 'Please enter a valid email address'
    if (form.password.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(form.password)) return 'Password must contain at least one uppercase letter'
    if (!/[0-9]/.test(form.password)) return 'Password must contain at least one number'
    if (form.password !== form.confirmPassword) return 'Passwords do not match'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const validationError = validateForm()
    if (validationError) { setError(validationError); return }
    setLoading(true)
    const result = await register(form.username, form.email, form.password)
    if (result.success) { navigate('/') } else {
      setError(result.error || 'Registration failed')
      setLoading(false)
    }
  }

  const fields = [
    { label: 'Username', name: 'username', type: 'text', placeholder: 'Choose a username' },
    { label: 'Email address', name: 'email', type: 'email', placeholder: 'Enter your email address' },
    { label: 'Password', name: 'password', type: 'password', placeholder: 'Choose a password', hint: 'Min 8 characters, one uppercase letter, one number' },
    { label: 'Confirm password', name: 'confirmPassword', type: 'password', placeholder: 'Repeat your password' },
  ]

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center px-4 py-10">

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
          <h1 className="text-2xl font-bold text-[#0c1a2e]">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Start finding your perfect postgraduate programme</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {fields.map((f, i) => (
              <div key={f.name} className={i < fields.length - 1 ? 'mb-5' : 'mb-7'}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
                <input
                  type={f.type} name={f.name} value={form[f.name]}
                  onChange={handleChange} placeholder={f.placeholder} required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-[#0c1a2e] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0891b2] focus:border-transparent focus:bg-white transition-all"
                />
                {f.hint && <p className="text-xs text-slate-400 mt-1">{f.hint}</p>}
              </div>
            ))}

            <button type="submit" disabled={loading}
              className="w-full bg-[#0c1a2e] hover:bg-[#0891b2] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 text-sm">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0891b2] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          GradMatch © 2026 · Nile University of Nigeria
        </p>
      </div>
    </div>
  )
}

export default Register