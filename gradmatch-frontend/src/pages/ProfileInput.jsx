import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const tabs = [
  {
    id: 'academic',
    label: 'Academic Profile',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0121 12c0 6.075-4.925 11-11 11S-1 18.075-1 12c0-.593.063-1.17.16-1.732L12 14z" />
      </svg>
    )
  },
  {
    id: 'interests',
    label: 'Interest Profile',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  },
]

//FOR THE QUICK INTEREST CARDS //

const suggestedInterests = [
  'Machine Learning', 'Data Science', 'Artificial Intelligence', 'Software Engineering',
  'Civil Engineering', 'Structural Engineering', 'Environmental Engineering',
  'Business Analytics', 'Finance', 'Project Management', 'Cybersecurity',
  'Biomedical Engineering', 'Renewable Energy', 'Urban Planning', 'Architecture',
]

function ProfileInput() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('academic')
  const [toast, setToast] = useState(null)
  const [showConverter, setShowConverter] = useState(false)
  const [converterScale, setConverterScale] = useState('5.0')
  const [converterValue, setConverterValue] = useState('')
  const [convertedValue, setConvertedValue] = useState('')

  const [form, setForm] = useState({
    cgpa: '', country: '', duration: '', discipline: '',
    major: '', interests: '', english_test_type: '', english_test_score: '',
  })

  useEffect(() => {
    const prefill = JSON.parse(localStorage.getItem('gradmatch_prefill') || 'null')
    if (prefill) {
      setForm({
        cgpa: prefill.cgpa || '', country: prefill.country || '',
        duration: prefill.duration || '', discipline: prefill.discipline || '',
        major: prefill.major || '', interests: prefill.interests || '',
        english_test_type: prefill.english_test_type || '',
        english_test_score: prefill.english_test_score || '',
      })
      localStorage.removeItem('gradmatch_prefill')
    }
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const convertCgpa = () => {
    const val = parseFloat(converterValue)
    if (isNaN(val)) return
    let converted
    if (converterScale === '5.0') converted = (val / 5.0) * 4.0
    else if (converterScale === '7.0') converted = (val / 7.0) * 4.0
    else if (converterScale === '10.0') converted = (val / 10.0) * 4.0
    else if (converterScale === 'percentage') converted = (val / 100) * 4.0
    setConvertedValue(Math.min(4.0, Math.round(converted * 100) / 100).toString())
  }

  const addChip = (chip) => {
  const current = form.interests.trim()
  if (current.includes(chip)) {
    // remove it
    const updated = current
      .split(', ')
      .filter(item => item.trim() !== chip)
      .join(', ')
    setForm({ ...form, interests: updated })
  } else {
    // add it
    const updated = current ? `${current}, ${chip}` : chip
    setForm({ ...form, interests: updated })
  }
}

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const academicComplete = () =>
    form.cgpa && form.country && form.duration && form.discipline &&
    form.major && form.english_test_type &&
    (form.english_test_type === 'None' || form.english_test_score)

  const handleSubmit = async () => {
    if (!academicComplete()) {
      setActiveTab('academic')
      showToast('Please complete your academic profile first')
      return
    }
    if (!form.interests.trim()) {
      setActiveTab('interests')
      showToast('Please describe your academic interests')
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cgpa: form.cgpa, country: form.country, duration: form.duration,
          discipline: form.discipline, major: form.major, interests: form.interests,
          english_test_type: form.english_test_type,
          english_test_score: form.english_test_score,
          user_id: user ? user.user_id : null
        })
      })
      const data = await response.json()
      if (data.success) {
        navigate('/results', { state: { results: data.recommendations, profile: form } })
      } else {
        showToast('Error: ' + (data.error || 'Something went wrong'))
        setLoading(false)
      }
    } catch (error) {
      showToast('Error: ' + error.message)
      setLoading(false)
    }
  }

  const inputCls = "w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-[#0c1a2e] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0891b2] focus:border-transparent focus:bg-white transition-all"
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide"

  const completionPct = () => {
    const fields = [
      form.cgpa, form.country, form.duration, form.discipline,
      form.major, form.english_test_type, form.interests
    ]
    return Math.round((fields.filter(Boolean).length / fields.length) * 100)
  }

  return (
    <div className="min-h-screen bg-white py-6 px-4 md:px-8">

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg text-white ${toast.type === 'success' ? 'bg-[#0c1a2e]' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-[#0c1a2e]">Find Your Programme</h1>
          <p className="text-sm text-slate-400 mt-1">Complete your profile to get personalised postgraduate recommendations</p>
        </div>

        {/* Main layout */}
        <div className="flex flex-col md:flex-row gap-5 items-start">

          {/* Left — tabs + completion */}
          <div className="w-full md:w-56 shrink-0">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

              {/* Completion */}
              <div className="bg-[#0c1a2e] px-4 py-4">
                <p className="text-xs text-sky-300 font-medium mb-2">Profile completion</p>
                <div className="w-full bg-white/10 rounded-full h-1.5 mb-1.5">
                  <div className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${completionPct()}%` }} />
                </div>
                <p className="text-white text-sm font-bold">{completionPct()}%</p>
              </div>

              {/* Tab list */}
              <div className="p-2">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                      activeTab === tab.id
                        ? 'bg-sky-50 text-[#0891b2]'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-[#0c1a2e]'
                    }`}>
                    <span className={activeTab === tab.id ? 'text-[#0891b2]' : 'text-slate-400'}>
                      {tab.icon}
                    </span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Submit */}
              <div className="p-3 border-t border-slate-100">
                <button onClick={handleSubmit} disabled={loading}
                  className="w-full bg-[#0c1a2e] hover:bg-[#0891b2] text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Matching…
                    </>
                  ) : 'Get Recommendations →'}
                </button>
              </div>
            </div>
          </div>

          {/* Right — form panel */}
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6">

              {/* Academic Profile tab */}
              {activeTab === 'academic' && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-base font-bold text-[#0c1a2e]">Academic Profile</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Your academic background and preferences</p>
                    </div>
                    {academicComplete() && (
                      <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                        ✓ Complete
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                    {/* CGPA */}
                    <div>
                      <label className={labelCls}>CGPA <span className="text-red-400 normal-case">*</span></label>
                      <div className="relative">
                        <input className={inputCls} type="number" name="cgpa" value={form.cgpa}
                          onChange={handleChange} placeholder="e.g. 3.8" min="0" max="4.0" step="0.01" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">/ 4.0</span>
                      </div>
                      <button type="button" onClick={() => setShowConverter(!showConverter)}
                        className="text-xs text-[#0891b2] hover:underline mt-1.5 bg-transparent border-none cursor-pointer p-0">
                        {showConverter ? 'Hide converter' : '+ Convert from another scale'}
                      </button>
                      {showConverter && (
                        <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <p className="text-xs font-semibold text-[#0c1a2e] mb-2">CGPA Converter</p>
                          <div className="flex gap-2 flex-wrap mb-2">
                            <select value={converterScale} onChange={e => setConverterScale(e.target.value)}
                              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-[#0c1a2e] bg-white focus:outline-none focus:ring-1 focus:ring-[#0891b2] flex-1 min-w-0">
                              <option value="5.0">5.0 (Nigeria)</option>
                              <option value="7.0">7.0 (India)</option>
                              <option value="10.0">10.0 scale</option>
                              <option value="percentage">Percentage</option>
                            </select>
                            <input type="number" value={converterValue} onChange={e => setConverterValue(e.target.value)}
                              placeholder="Grade"
                              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-20 text-[#0c1a2e] bg-white focus:outline-none focus:ring-1 focus:ring-[#0891b2]" />
                            <button type="button" onClick={convertCgpa}
                              className="bg-[#0891b2] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#0c1a2e] transition-colors">
                              Go
                            </button>
                          </div>
                          {convertedValue && (
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-[#0c1a2e]">Result: <strong>{convertedValue}</strong></p>
                              <button type="button"
                                onClick={() => { setForm({ ...form, cgpa: convertedValue }); setShowConverter(false) }}
                                className="text-xs text-white bg-[#0891b2] px-2 py-0.5 rounded hover:bg-[#0c1a2e] transition-colors">
                                Use this
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* English proficiency */}
                    <div>
                      <label className={labelCls}>English proficiency <span className="text-red-400 normal-case">*</span></label>
                      <select className={inputCls} name="english_test_type" value={form.english_test_type} onChange={handleChange}>
                        <option value="">Select test type</option>
                        <option value="IELTS">IELTS (0.0 – 9.0)</option>
                        <option value="TOEFL">TOEFL iBT (0 – 120)</option>
                        <option value="PTE">PTE Academic (10 – 90)</option>
                        <option value="Duolingo">Duolingo (10 – 160)</option>
                        <option value="None">Not taken</option>
                      </select>
                      {form.english_test_type && form.english_test_type !== 'None' && (
                        <input className={`${inputCls} mt-2`} type="number" name="english_test_score"
                          value={form.english_test_score} onChange={handleChange}
                          placeholder={`Enter your ${form.english_test_type} score`} />
                      )}
                    </div>

                    {/* Country */}
                    <div>
                      <label className={labelCls}>Preferred country <span className="text-red-400 normal-case">*</span></label>
                      <select className={inputCls} name="country" value={form.country} onChange={handleChange}>
                        <option value="">Select a country</option>
                        {['Australia','Canada','Denmark','France','Germany','Ireland','Italy','Malaysia','Netherlands','New Zealand','Norway','Singapore','Spain','Sweden','United Kingdom','United States'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className={labelCls}>Programme duration <span className="text-red-400 normal-case">*</span></label>
                      <select className={inputCls} name="duration" value={form.duration} onChange={handleChange}>
                        <option value="">Select duration</option>
                        {['12','18','24','36','48','60'].map(d => (
                          <option key={d} value={d}>{d} months</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Discipline */}
                  <div className="mb-4">
                    <label className={labelCls}>Undergraduate discipline <span className="text-red-400 normal-case">*</span></label>
                    <select className={inputCls} name="discipline" value={form.discipline} onChange={handleChange}>
                      <option value="">Select your discipline</option>
                      {['Business and Management','Engineering and Technology','Computer Science and IT','Science and Mathematics','Social Sciences and Humanities','Law','Medicine and Health','Arts and Design','Education','Agriculture','Other'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Major */}
                  <div>
                    <label className={labelCls}>Undergraduate major <span className="text-red-400 normal-case">*</span></label>
                    <input className={inputCls} type="text" name="major" value={form.major}
                      onChange={handleChange} placeholder="e.g. Management Information Systems" />
                  </div>

                  <div className="mt-5 flex justify-end">
                    <button onClick={() => setActiveTab('interests')}
                      className="text-sm font-semibold text-[#0891b2] hover:text-[#0c1a2e] transition-colors">
                      Next: Interest Profile →
                    </button>
                  </div>
                </div>
              )}

              {/* Interests tab */}
              {activeTab === 'interests' && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-base font-bold text-[#0c1a2e]">Interest Profile</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Tell GradMatch what you're passionate about</p>
                    </div>
                    {form.interests.trim() && (
                      <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                        ✓ Complete
                      </span>
                    )}
                  </div>

                  {/* Suggested chips */}
                  <div className="mb-4">
                    <label className={labelCls}>Quick add interests</label>
                    <div className="flex flex-wrap gap-2">
                      {suggestedInterests.map(chip => (
                        <button key={chip} type="button" onClick={() => addChip(chip)}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                            form.interests.includes(chip)
                              ? 'bg-[#0891b2] text-white border-[#0891b2]'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-[#0891b2] hover:text-[#0891b2]'
                          }`}>
                          {form.interests.includes(chip) ? '✓ ' : '+ '}{chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interest statement */}
                  <div>
                    <label className={labelCls}>
                      Academic interest statement <span className="text-red-400 normal-case">*</span>
                    </label>
                    <p className="text-xs text-slate-400 mb-2">
                      Describe your interests, career goals, and what you are looking for in a programme. The more detail, the better your matches.
                    </p>
                    <textarea className={`${inputCls} resize-none`} name="interests" value={form.interests}
                      onChange={handleChange} rows={6}
                      placeholder="e.g. I am interested in machine learning and its applications in structural health monitoring. I want a research-oriented programme that bridges civil engineering and AI..." />
                    <p className="text-xs text-slate-400 mt-1">{form.interests.length} characters</p>
                  </div>

                  <div className="mt-5 flex justify-between">
                    <button onClick={() => setActiveTab('academic')}
                      className="text-sm font-medium text-slate-500 hover:text-[#0c1a2e] transition-colors">
                      ← Academic Profile
                    </button>
                    <button onClick={handleSubmit} disabled={loading}
                      className="text-sm font-semibold bg-[#0c1a2e] hover:bg-[#0891b2] text-white px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Matching…
                        </>
                      ) : 'Get Recommendations →'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileInput

