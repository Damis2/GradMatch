import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const countryFlags = {
  'United Kingdom': '🇬🇧', 'United States': '🇺🇸', 'Australia': '🇦🇺',
  'Canada': '🇨🇦', 'Germany': '🇩🇪', 'France': '🇫🇷', 'Netherlands': '🇳🇱',
  'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Denmark': '🇩🇰', 'Ireland': '🇮🇪',
  'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Singapore': '🇸🇬', 'Malaysia': '🇲🇾',
  'New Zealand': '🇳🇿'
}

const getComp = (score) => {
  if (score >= 70) return { label: 'Strong', cls: 'bg-green-50 text-green-700 border-green-200' }
  if (score >= 45) return { label: 'Moderate', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
  return { label: 'Challenging', cls: 'bg-red-50 text-red-700 border-red-200' }
}

function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [toast, setToast] = useState(null)
  const [savingId, setSavingId] = useState(null)
  const [showFilter, setShowFilter] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  if (location.state?.results) {
    localStorage.setItem('gradmatch_results', JSON.stringify(location.state.results))
  }

  const results = location.state?.results || JSON.parse(localStorage.getItem('gradmatch_results') || '[]')
  const maxTuition = results.length > 0 ? Math.max(...results.map(r => r.tuition_usd || 0)) : 100000
  const [budgetFilter, setBudgetFilter] = useState(maxTuition)
  const filtered = results.filter(r => (r.tuition_usd || 0) <= budgetFilter)

  const saveToWishlist = async (programmeId) => {
    if (!user) { navigate('/login'); return }
    setSavingId(programmeId)
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, programme_id: programmeId })
      })
      const data = await res.json()
      if (data.success) showToast('Saved to wishlist ✓')
      else showToast(data.error || 'Could not save', 'error')
    } catch { showToast('Could not connect to server', 'error') }
    finally { setSavingId(null) }
  }

  if (results.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-[#0c1a2e] font-semibold mb-3">No results found</p>
          <button onClick={() => navigate('/find')}
            className="bg-[#0c1a2e] text-white text-sm px-5 py-2 rounded-lg hover:bg-[#0891b2] transition-colors">
            ← New search
          </button>
        </div>
      </div>
    )
  }

  const FilterPanel = () => (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Filters</p>

      <p className="text-xs font-medium text-slate-600 mb-2">Max tuition (USD/yr)</p>
      <input type="range" min={0} max={maxTuition} step={1000} value={budgetFilter}
        onChange={e => setBudgetFilter(Number(e.target.value))}
        className="w-full accent-[#0891b2]" />
      <div className="flex justify-between mt-1 mb-1 text-xs">
        <span className="text-slate-400">$0</span>
        <span className="font-semibold text-[#0c1a2e]">${budgetFilter.toLocaleString()}</span>
      </div>
      <button onClick={() => setBudgetFilter(maxTuition)}
        className="text-xs text-[#0891b2] hover:underline">
        Reset
      </button>

      <div className="border-t border-slate-100 mt-4 pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Competitiveness</p>
        {[
          { label: 'Strong', cls: 'bg-green-50 text-green-700', count: results.filter(r => r.competitiveness_score >= 70).length },
          { label: 'Moderate', cls: 'bg-amber-50 text-amber-700', count: results.filter(r => r.competitiveness_score >= 45 && r.competitiveness_score < 70).length },
          { label: 'Challenging', cls: 'bg-red-50 text-red-700', count: results.filter(r => r.competitiveness_score < 45).length },
        ].map(s => (
          <div key={s.label} className="flex items-center justify-between mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
            <span className="text-xs font-semibold text-[#0c1a2e]">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white py-6 px-4 md:px-8">

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg text-white ${toast.type === 'success' ? 'bg-[#0c1a2e]' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#0c1a2e]">Your Recommendations</h1>
            <p className="text-sm text-slate-400 mt-1">{filtered.length} programmes matched your profile</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilter(!showFilter)}
              className="md:hidden text-sm font-medium text-slate-600 border border-slate-200 bg-white px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
              {showFilter ? 'Hide filters' : 'Filters'}
            </button>
            <button onClick={() => { localStorage.removeItem('gradmatch_results'); navigate('/find') }}
              className="text-sm font-medium text-slate-600 border border-slate-200 bg-white px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
              ← New search
            </button>
          </div>
        </div>

        {/* Mobile filter panel */}
        {showFilter && (
          <div className="md:hidden mb-4">
            <FilterPanel />
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-5 items-start">

          {/* Desktop sidebar filter */}
          <div className="hidden md:block w-48 shrink-0 sticky top-6">
            <FilterPanel />
          </div>

          {/* Cards */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {filtered.map((programme, i) => {
              const comp = getComp(programme.competitiveness_score)
              return (
                <div key={programme.programme_id}
                  className={`bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm ${i === 0 ? 'border-l-4 border-l-[#0891b2]' : i < 3 ? 'border-l-4 border-l-sky-200' : ''}`}>

                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${i === 0 ? 'bg-sky-100 text-[#0891b2]' : 'bg-slate-100 text-slate-500'}`}>
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold text-[#0c1a2e] text-sm leading-snug mb-1">{programme.programme_title}</h2>
                        <p className="text-xs text-slate-500">
                          {countryFlags[programme.country] || '🌍'} {programme.university_name} · {programme.country}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${comp.cls}`}>
                      {comp.label}
                    </span>
                  </div>

                  {/* Meta chips */}
                  <div className="flex gap-2 flex-wrap mb-3">
                    {[
                      `$${programme.tuition_usd ? programme.tuition_usd.toLocaleString() : 'N/A'}/yr`,
                      `${programme.duration_months} months`,
                      `QS ${programme.qs_ranking_score ? programme.qs_ranking_score.toFixed(1) : 'N/A'}`,
                      `Competitiveness ${programme.competitiveness_score}%`,
                    ].map(m => (
                      <span key={m} className="text-xs px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200">{m}</span>
                    ))}
                  </div>

                  {/* Score bar */}
                  <div className="mb-3">
                    <div className="flex justify-between mb-1 text-xs">
                      <span className="text-slate-400">Match score</span>
                      <span className="font-bold text-[#0891b2]">{programme.mcdm_score}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-[#0891b2] h-2 rounded-full" style={{ width: `${programme.mcdm_score}%` }} />
                    </div>
                  </div>

                  {/* Sub scores */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'Semantic', val: Math.round(programme.sbert_score * 100) + '%', cls: 'bg-sky-50 text-[#0891b2] border-sky-100' },
                      { label: 'QS rank', val: Math.round(programme.qs_normalised * 100) + '%', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
                      { label: 'Affordability', val: Math.round(programme.affordability_score * 100) + '%', cls: 'bg-green-50 text-green-700 border-green-100' },
                    ].map(s => (
                      <div key={s.label} className={`${s.cls} border rounded-xl py-2 text-center`}>
                        <div className="text-sm font-bold mb-0.5">{s.val}</div>
                        <div className="text-xs text-slate-400">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                    <button onClick={() => navigate(`/programme/${programme.programme_id}`, { state: { programme } })}
                      className="text-xs font-medium text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      View details
                    </button>
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(programme.university_name + ' official website')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs font-medium text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      Visit university ↗
                    </a>
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(programme.university_name + ' ' + programme.programme_title + ' postgraduate programme official')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs font-medium text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      Programme page ↗
                    </a>
                    <button onClick={() => saveToWishlist(programme.programme_id)}
                      disabled={savingId === programme.programme_id}
                      className="ml-auto text-xs font-semibold bg-[#0c1a2e] hover:bg-[#0891b2] text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-60">
                      {savingId === programme.programme_id ? 'Saving…' : '+ Wishlist'}
                    </button>
                  </div>

                </div>
              )
            })}

            {filtered.length === 0 && (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                <p className="font-semibold text-[#0c1a2e] mb-1">No programmes in this budget</p>
                <p className="text-xs text-slate-400">Try increasing the budget slider</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Results

