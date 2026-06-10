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

const compStyle = (s) => s >= 70 ? 'bg-green-50 text-green-700 border border-green-200'
  : s >= 45 ? 'bg-amber-50 text-amber-700 border border-amber-200'
  : 'bg-red-50 text-red-700 border border-red-200'
const compLabel = (s) => s >= 70 ? 'Strong' : s >= 45 ? 'Moderate' : 'Challenging'

const trackerConfig = [
  { key: 'Applied',           label: 'Applied',   color: '#3b82f6', bg: 'bg-blue-100 text-blue-700' },
  { key: 'Awaiting Response', label: 'In Review', color: '#8b5cf6', bg: 'bg-violet-100 text-violet-700' },
  { key: 'Admitted',          label: 'Admitted',  color: '#22c55e', bg: 'bg-green-100 text-green-700' },
]

const activityIcons = {
  search:   { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', bg: 'bg-sky-50',    color: 'text-[#0891b2]' },
  wishlist: { icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', bg: 'bg-pink-50', color: 'text-pink-500' },
  tracker:  { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', bg: 'bg-violet-50', color: 'text-violet-500' },
}

function DonutChart({ breakdown, total }) {
  const r = 36, circ = 2 * Math.PI * r
  const colors = { Applied: '#3b82f6', 'Awaiting Response': '#8b5cf6', Admitted: '#22c55e' }
  let offset = 0
  const segs = Object.entries(colors).map(([key, color]) => {
    const pct = total > 0 ? (breakdown[key] || 0) / total : 0
    const dash = pct * circ
    const s = { key, color, dash, gap: circ - dash, offset: offset * circ }
    offset += pct
    return s
  })
  return (
    <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-4">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        {segs.map(s => s.dash > 0 && (
          <circle key={s.key} cx="48" cy="48" r={r} fill="none" stroke={s.color} strokeWidth="10"
            strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={-s.offset} />
        ))}
      </svg>
      <div className="absolute text-center">
        <p className="text-lg font-bold text-[#0c1a2e] leading-none">{total}</p>
        <p className="text-xs text-slate-400 mt-0.5">Total</p>
      </div>
    </div>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetch(`${process.env.REACT_APP_API_URL}/api/dashboard/${user.user_id}`)
      .then(r => r.json())
      .then(d => { if (d?.stats) setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user, navigate])

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <svg className="animate-spin h-8 w-8 text-[#0891b2]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  )

  if (!data?.stats) return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-3xl mb-3">⚠️</p>
        <p className="text-sm font-semibold text-[#0c1a2e] mb-1">Could not load dashboard</p>
        <p className="text-xs text-slate-400 mb-4">Make sure the backend is running</p>
        <button onClick={() => window.location.reload()}
          className="bg-[#0c1a2e] hover:bg-[#0891b2] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
          Retry
        </button>
      </div>
    </div>
  )

  const { stats, tracker_breakdown, last_search, top_rec, recent_activity } = data

  const repeatLastSearch = () => {
    if (!last_search) return
    localStorage.setItem('gradmatch_prefill', JSON.stringify({
      cgpa: last_search.cgpa, country: last_search.preferred_country,
      duration: last_search.duration_preference_months || '',
      discipline: last_search.undergraduate_discipline || '',
      major: last_search.undergraduate_major || '',
      interests: last_search.interest_statement_text || '',
    }))
    navigate('/find')
  }

  return (
    <div className="min-h-screen bg-white py-6 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold text-[#0c1a2e]">Welcome back, {user?.username} 👋</h1>
            <p className="text-sm text-slate-400 mt-1">Here's an overview of your GradMatch journey.</p>
          </div>
          <div className="w-10 h-10 bg-[#0891b2] rounded-full flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm uppercase">{user?.username?.charAt(0)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5 mb-5">
          {[
            { label: 'Recommendations', val: stats.searches, link: '/history', d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
            { label: 'Wishlist', val: stats.wishlist, link: '/wishlist', d: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
            { label: 'Applications', val: stats.applications, link: '/tracker', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">{s.label}</span>
                <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center text-[#0891b2]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.d} />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#0c1a2e] mb-1">{s.val}</p>
              <button onClick={() => navigate(s.link)} className="text-xs text-[#0891b2] font-medium hover:underline">View all →</button>
            </div>
          ))}
        </div>

        {/* Middle row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">

          {/* Top recommendation */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-[#0c1a2e]">Top Recommendation</p>
              {last_search && (
                <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                  {flags[last_search.preferred_country] || '🌍'} {last_search.preferred_country}
                </span>
              )}
            </div>
            {top_rec ? (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center shrink-0 text-lg">
                      {flags[top_rec.country] || '🌍'}
                    </div>
                    <div>
                      <p className="font-bold text-[#0c1a2e] text-sm mb-0.5">{top_rec.programme_title}</p>
                      <p className="text-xs text-slate-400">{top_rec.university_name} · {top_rec.country}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-2xl font-bold text-[#0891b2]">{top_rec.mcdm_score}%</p>
                    <p className="text-xs text-slate-400">Match score</p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                  <div className="bg-[#0891b2] h-2 rounded-full" style={{ width: `${top_rec.mcdm_score}%` }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${compStyle(top_rec.competitiveness_score)}`}>
                    {compLabel(top_rec.competitiveness_score)} · {top_rec.competitiveness_score}%
                  </span>
                  <button onClick={() => navigate('/history')}
                    className="ml-auto text-xs font-semibold bg-[#0c1a2e] hover:bg-[#0891b2] text-white px-4 py-1.5 rounded-lg transition-colors">
                    View details
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">🔍</p>
                <p className="text-sm font-semibold text-[#0c1a2e] mb-1">No recommendations yet</p>
                <p className="text-xs text-slate-400 mb-4">Run your first search to get personalised matches</p>
                <button onClick={() => navigate('/find')}
                  className="text-sm font-semibold bg-[#0c1a2e] hover:bg-[#0891b2] text-white px-6 py-2 rounded-lg transition-colors">
                  Find programmes →
                </button>
              </div>
            )}
          </div>

          {/* Application progress */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-[#0c1a2e]">Application Progress</p>
              <button onClick={() => navigate('/tracker')} className="text-xs text-[#0891b2] font-medium hover:underline">View all</button>
            </div>
            {stats.applications > 0 ? (
              <>
                <DonutChart breakdown={tracker_breakdown} total={stats.applications} />
                <div className="space-y-2">
                  {trackerConfig.map(t => (
                    <div key={t.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                        <span className="text-xs text-slate-500">{t.label}</span>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${t.bg}`}>{tracker_breakdown[t.key] || 0}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" />
                      <span className="text-xs text-slate-500">Interested</span>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                      {tracker_breakdown['Interested'] || 0}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-xs text-slate-400 mb-4">No applications tracked yet</p>
                <button onClick={() => navigate('/wishlist')}
                  className="text-xs font-semibold bg-[#0c1a2e] hover:bg-[#0891b2] text-white px-4 py-2 rounded-lg transition-colors">
                  Go to wishlist →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Recent activity */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-[#0c1a2e]">Recent Activity</p>
              <button onClick={() => navigate('/history')} className="text-xs text-[#0891b2] font-medium hover:underline">View history</button>
            </div>
            {recent_activity.length > 0 ? (
              recent_activity.map((a, i) => {
                const ai = activityIcons[a.type] || activityIcons.search
                return (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${ai.bg} rounded-lg flex items-center justify-center shrink-0`}>
                        <svg className={`w-4 h-4 ${ai.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={ai.icon} />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0c1a2e]">{a.text}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{a.sub}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 ml-3">
                      {new Date(a.timestamp + 'Z').toLocaleString('en-GB', {
                        timeZone: 'Africa/Lagos', day: '2-digit', month: 'short',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-xs text-slate-400">No activity yet — start by finding programmes</p>
              </div>
            )}
          </div>

          {/* Quick start */}
          <div className="bg-[#0c1a2e] rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-cyan-400/20 rounded-xl flex items-center justify-center mb-4 text-cyan-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-white mb-2 text-sm">Find your programme</h3>
              <p className="text-xs text-sky-300 leading-relaxed">
                Enter your academic profile and get personalised postgraduate recommendations in seconds.
              </p>
            </div>
            <div className="space-y-2 mt-6">
              <button onClick={() => navigate('/find')}
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-[#0c1a2e] font-bold py-2.5 rounded-xl transition-colors text-sm">
                New search →
              </button>
              {last_search && (
                <button onClick={repeatLastSearch}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2.5 rounded-xl transition-colors text-sm border border-white/10">
                  Repeat last search
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Dashboard

