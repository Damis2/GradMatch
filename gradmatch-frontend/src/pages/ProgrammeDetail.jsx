import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProgrammeDetail() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const programme = location.state?.programme
  const [activeTab, setActiveTab] = useState('overview')
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const saveToWishlist = async () => {
    if (!user) { navigate('/login'); return }
    setSaving(true)
    try {
      const res = await fetch('http://localhost:5000/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, programme_id: programme.programme_id })
      })
      const data = await res.json()
      if (data.success) showToast('Saved to wishlist ✓')
      else showToast(data.error || 'Could not save', 'error')
    } catch { showToast('Could not connect to server', 'error') }
    finally { setSaving(false) }
  }

  if (!programme) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-500 mb-3 text-sm">No programme selected.</p>
          <button onClick={() => navigate('/find')}
            className="text-sm font-semibold bg-[#0c1a2e] text-white px-5 py-2 rounded-lg hover:bg-[#0891b2] transition-colors">
            Go to search
          </button>
        </div>
      </div>
    )
  }

  const getCompLabel = (s) => s >= 70 ? 'Strong' : s >= 45 ? 'Moderate' : 'Challenging'
  const getCompCls = (s) => s >= 70
    ? 'bg-green-50 text-green-700 border-green-200'
    : s >= 45 ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-red-50 text-red-700 border-red-200'
  const getBarCls = (s) => s >= 70 ? 'bg-green-500' : s >= 45 ? 'bg-amber-400' : 'bg-red-400'

  const tabs = ['overview', 'score breakdown']

  return (
    <div className="min-h-screen bg-white py-6 px-4 md:px-8">

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg text-white ${toast.type === 'success' ? 'bg-[#0c1a2e]' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-3xl mx-auto">

        <button onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-[#0c1a2e] mb-6 flex items-center gap-1 transition-colors">
          ← Back to results
        </button>

        {/* Hero card */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-5">

          {/* Dark header */}
          <div className="bg-[#0c1a2e] px-5 md:px-8 py-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-white leading-snug mb-1">
                  {programme.programme_title}
                </h1>
                <p className="text-sky-300 text-sm">{programme.university_name} · {programme.country}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold text-cyan-400">{programme.mcdm_score}%</div>
                <div className="text-xs text-sky-300">Match score</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={saveToWishlist} disabled={saving}
                className="text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-[#0c1a2e] px-4 py-2 rounded-lg transition-colors disabled:opacity-60">
                {saving ? 'Saving…' : '+ Save to wishlist'}
              </button>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(programme.university_name + ' official website')}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs font-medium bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors border border-white/10">
                Visit university ↗
              </a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(programme.university_name + ' ' + programme.programme_title + ' postgraduate')}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs font-medium bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors border border-white/10">
                Programme page ↗
              </a>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-100">
            {[
              { label: 'Tuition', val: `$${programme.tuition_usd ? programme.tuition_usd.toLocaleString() : 'N/A'}`, sub: 'per year' },
              { label: 'Duration', val: `${programme.duration_months} months`, sub: '' },
              { label: 'QS Score', val: programme.qs_ranking_score ? programme.qs_ranking_score.toFixed(1) : 'N/A', sub: '' },
              { label: 'Competitiveness', val: getCompLabel(programme.competitiveness_score), sub: `${programme.competitiveness_score}%` },
            ].map((s, i) => (
              <div key={s.label} className={`px-5 py-4 text-center ${i < 3 ? 'border-r border-slate-100' : ''}`}>
                <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                <p className="text-sm font-bold text-[#0c1a2e]">{s.val}</p>
                {s.sub && <p className="text-xs text-slate-400">{s.sub}</p>}
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 px-5 md:px-8">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`text-xs font-semibold capitalize py-3 mr-5 border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[#0891b2] text-[#0891b2]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="px-5 md:px-8 py-6">

            {activeTab === 'overview' && (
              <div>
                {programme.programme_description_text && (
                  <div className="mb-5">
                    <h2 className="text-sm font-semibold text-[#0c1a2e] mb-2">About the programme</h2>
                    <p className="text-sm text-slate-600 leading-relaxed">{programme.programme_description_text}</p>
                  </div>
                )}

                {programme.entry_requirements_text && (
                  <div className="mb-5 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h2 className="text-sm font-semibold text-[#0c1a2e] mb-2">Entry requirements</h2>
                    <p className="text-sm text-slate-600 leading-relaxed">{programme.entry_requirements_text}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Cost of living index', val: programme.cost_of_living_index?.toFixed(1) || 'N/A' },
                    { label: 'Accepted disciplines', val: programme.accepted_disciplines === 'All' ? 'All disciplines' : programme.accepted_disciplines },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                      <p className="text-sm font-semibold text-[#0c1a2e]">{s.val}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xs text-amber-700">Application deadlines vary. Visit the university website for current deadline and application information.</p>
                </div>
              </div>
            )}

            {activeTab === 'score breakdown' && (
              <div>
                <div className="mb-6">
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className="font-semibold text-[#0c1a2e]">Overall match score</span>
                    <span className="font-bold text-[#0891b2]">{programme.mcdm_score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-[#0891b2] h-2.5 rounded-full" style={{ width: `${programme.mcdm_score}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">Calculated using AHP-weighted MCDM across four signals</p>
                </div>

                <div className="space-y-4 mb-6">
                  {[
                    {
                      label: 'Semantic match',
                      desc: "How closely your interests align with this programme's curriculum",
                      val: Math.round(programme.sbert_score * 100),
                      bar: 'bg-[#0891b2]', txt: 'text-[#0891b2]', weight: '64.26%'
                    },
                    {
                      label: 'University ranking',
                      desc: 'Institutional quality based on QS World University Rankings',
                      val: Math.round(programme.qs_normalised * 100),
                      bar: 'bg-slate-500', txt: 'text-slate-600', weight: '19.41%'
                    },
                    {
                      label: 'Affordability',
                      desc: `Cost of living index for ${programme.country}`,
                      val: Math.round(programme.affordability_score * 100),
                      bar: 'bg-green-500', txt: 'text-green-600', weight: '9.67%'
                    },
                    {
                      label: 'Student fit',
                      desc: 'CGPA and duration preference alignment',
                      val: Math.round((programme.student_fit || 0) * 100),
                      bar: 'bg-violet-500', txt: 'text-violet-600', weight: '6.66%'
                    },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex items-start justify-between mb-1.5 gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-[#0c1a2e]">{s.label}</p>
                            <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              weight {s.weight}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{s.desc}</p>
                        </div>
                        <span className={`text-sm font-bold shrink-0 ${s.txt}`}>{s.val}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className={`${s.bar} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${s.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-sm font-semibold text-[#0c1a2e] mb-1">Admission competitiveness</h3>
                  <p className="text-xs text-slate-400 mb-3">Based on your CGPA, English proficiency and discipline alignment</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                      <div className={`${getBarCls(programme.competitiveness_score)} h-2.5 rounded-full`}
                        style={{ width: `${programme.competitiveness_score}%` }} />
                    </div>
                    <span className={`text-xs font-bold shrink-0 px-3 py-1 rounded-full border ${getCompCls(programme.competitiveness_score)}`}>
                      {getCompLabel(programme.competitiveness_score)} · {programme.competitiveness_score}%
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}

export default ProgrammeDetail