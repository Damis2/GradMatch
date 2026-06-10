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

function History() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetch(`${process.env.REACT_APP_API_URL}/api/history/` + user.user_id)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setHistory(data.history)
        setLoading(false)
      })
      .catch(() => { setError('Could not connect to server'); setLoading(false) })
  }, [user, navigate])

  const searchAgain = (item) => {
    localStorage.setItem('gradmatch_prefill', JSON.stringify({
      cgpa: item.cgpa,
      country: item.preferred_country,
      duration: item.duration_preference_months || '',
      discipline: item.undergraduate_discipline || '',
      major: item.undergraduate_major || '',
      interests: item.interest_statement || '',
      english_test_type: item.english_test_type || '',
      english_test_score: item.english_test_score || '',
    }))
    navigate('/find')
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
    <div className="min-h-screen bg-white py-6 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0c1a2e]">Recommendation History</h1>
          <p className="text-sm text-slate-400 mt-1">
            {history.length} previous {history.length === 1 ? 'search' : 'searches'}
          </p>
        </div>

        {history.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-semibold text-[#0c1a2e] mb-1">No search history yet</p>
            <p className="text-sm text-slate-400 mb-6">Your recommendation searches will appear here</p>
            <button onClick={() => navigate('/find')}
              className="bg-[#0c1a2e] hover:bg-[#0891b2] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors">
              Find programmes →
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Search Date</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Profile Used</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Results</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Action</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, i) => (
                  <>
                    <tr key={item.student_id}
                      className={`border-b border-slate-50 ${expanded === item.student_id ? 'bg-sky-50/50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} cursor-pointer hover:bg-sky-50/30 transition-colors`}
                      onClick={() => setExpanded(expanded === item.student_id ? null : item.student_id)}>

                      <td className="px-5 py-4">
                        <p className="text-sm text-[#0c1a2e] font-medium">
                          {new Date(item.query_timestamp + 'Z').toLocaleString('en-GB', {
                            timeZone: 'Africa/Lagos', day: '2-digit', month: 'short',
                            year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-[#0c1a2e] font-medium">
                          {flags[item.preferred_country] || '🌍'} {item.preferred_country}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          CGPA {item.cgpa} · {item.undergraduate_discipline || 'N/A'}
                        </p>
                        {item.interest_statement && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {item.interest_statement.substring(0, 60)}{item.interest_statement.length > 60 ? '…' : ''}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="bg-sky-50 text-[#0891b2] border border-sky-200 text-xs font-semibold px-3 py-1 rounded-full">
                          {item.match_count} programmes
                        </span>
                      </td>

                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <button onClick={() => searchAgain(item)}
                          className="bg-[#0c1a2e] hover:bg-[#0891b2] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                          Search Again
                        </button>
                      </td>

                      <td className="pr-4">
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded === item.student_id ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </td>
                    </tr>

                    {expanded === item.student_id && (
                      <tr key={`${item.student_id}-expanded`} className="bg-sky-50/30">
                        <td colSpan={5} className="px-5 py-4">
                          {item.top_recommendations?.length > 0 ? (
                            <>
                              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                                Top {item.top_recommendations.length} recommendations from this search
                              </p>
                              <div className="flex flex-col gap-2">
                                {item.top_recommendations.map((rec, j) => (
                                  <div key={j} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${j === 0 ? 'bg-sky-100 text-[#0891b2]' : 'bg-slate-100 text-slate-500'}`}>
                                        {j + 1}
                                      </span>
                                      <div>
                                        <p className="text-sm font-semibold text-[#0c1a2e]">{rec.programme_title}</p>
                                        <p className="text-xs text-slate-400">{rec.university_name} · {rec.country}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 ml-3">
                                      <span className="text-sm font-bold text-[#0891b2]">{rec.mcdm_score}%</span>
                                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                        rec.competitiveness_score >= 70
                                          ? 'bg-green-50 text-green-700 border-green-200'
                                          : rec.competitiveness_score >= 45
                                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                                          : 'bg-red-50 text-red-700 border-red-200'
                                      }`}>
                                        {rec.competitiveness_score >= 70 ? 'Strong' : rec.competitiveness_score >= 45 ? 'Moderate' : 'Challenging'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-slate-400">No recommendation details available for this search.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default History

