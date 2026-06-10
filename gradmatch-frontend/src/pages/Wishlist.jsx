import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const flags = {
  'United Kingdom': '🇬🇧', 'United States': '🇺🇸', 'Australia': '🇦🇺',
  'Canada': '🇨🇦', 'Germany': '🇩🇪', 'France': '🇫🇷', 'Netherlands': '🇳🇱',
  'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Denmark': '🇩🇰', 'Ireland': '🇮🇪',
  'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Singapore': '🇸🇬', 'Malaysia': '🇲🇾',
  'New Zealand': '🇳🇿'
}

function Wishlist() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetch(`http://localhost:5000/api/wishlist?user_id=${user.user_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setWishlist(data.wishlist)
        setLoading(false)
      })
      .catch(() => { setError('Could not connect to server'); setLoading(false) })
  }, [user, navigate])

  const removeFromWishlist = (wishlistId) => {
    fetch(`http://localhost:5000/api/wishlist/${wishlistId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWishlist(wishlist.filter(item => item.wishlist_id !== wishlistId))
          showToast('Programme removed from wishlist')
        }
      })
      .catch(err => console.error(err))
  }

  const addToTracker = (item) => {
    fetch('http://localhost:5000/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.user_id,
        programme_id: item.programme_id,
        university_name: item.university_name,
        programme_title: item.programme_title,
        country: item.country
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) showToast('Added to Application Tracker ✓')
        else showToast(data.error || 'Could not add to tracker', 'error')
      })
      .catch(() => showToast('Could not connect to server', 'error'))
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <svg className="animate-spin h-8 w-8 text-[#0891b2]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-red-500 text-sm">{error}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-white py-8 px-8">

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg text-white ${toast.type === 'success' ? 'bg-[#0c1a2e]' : 'bg-red-500'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0c1a2e]">Wishlist</h1>
            <p className="text-sm text-slate-400 mt-1">
              {wishlist.length} saved {wishlist.length === 1 ? 'programme' : 'programmes'}
            </p>
          </div>
          <button onClick={() => navigate('/find')}
            className="bg-[#0c1a2e] hover:bg-[#0891b2] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
            + Find programmes
          </button>
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
            <div className="text-4xl mb-3">🔖</div>
            <p className="font-semibold text-[#0c1a2e] mb-1">Your wishlist is empty</p>
            <p className="text-sm text-slate-400 mb-6">Save programmes from your recommendations to review them later</p>
            <button onClick={() => navigate('/find')}
              className="bg-[#0c1a2e] hover:bg-[#0891b2] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors">
              Find programmes →
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Programme</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">University</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Country</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Tuition (per year)</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {wishlist.map((item, i) => (
                  <tr key={item.wishlist_id}
                    className={`border-b border-slate-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-[#0c1a2e]">{item.programme_title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.duration_months} months</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-600">{item.university_name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-600">
                        {flags[item.country] || '🌍'} {item.country}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-600">
                        ${item.tuition_usd ? item.tuition_usd.toLocaleString() : 'N/A'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/programme/${item.programme_id}`, { state: { programme: item } })}
                          title="View details"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-sky-50 text-[#0891b2] hover:bg-sky-100 transition-colors border border-sky-200">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button onClick={() => addToTracker(item)}
                          title="Add to tracker"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-200">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        <button onClick={() => removeFromWishlist(item.wishlist_id)}
                          title="Remove"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-200">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Wishlist