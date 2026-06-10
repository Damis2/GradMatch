import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const statusConfig = {
  'Interested':        'bg-orange-50 text-orange-700 border-orange-200',
  'Applied':           'bg-blue-50 text-blue-700 border-blue-200',
  'Awaiting Response': 'bg-violet-50 text-violet-700 border-violet-200',
  'Admitted':          'bg-green-50 text-green-700 border-green-200',
  'Rejected':          'bg-red-50 text-red-700 border-red-200',
  'Withdrawn':         'bg-slate-50 text-slate-600 border-slate-200',
}

const statusOptions = ['Interested', 'Applied', 'Awaiting Response', 'Admitted', 'Rejected', 'Withdrawn']

const flags = {
  'United Kingdom': '🇬🇧', 'United States': '🇺🇸', 'Australia': '🇦🇺',
  'Canada': '🇨🇦', 'Germany': '🇩🇪', 'France': '🇫🇷', 'Netherlands': '🇳🇱',
  'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Denmark': '🇩🇰', 'Ireland': '🇮🇪',
  'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Singapore': '🇸🇬', 'Malaysia': '🇲🇾',
  'New Zealand': '🇳🇿'
}

function Tracker() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tracker, setTracker] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ status: '', notes: '' })
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetch(`${process.env.REACT_APP_API_URL}/api/tracker?user_id=` + user.user_id)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setTracker(data.tracker)
        setLoading(false)
      })
      .catch(() => { setError('Could not connect to server'); setLoading(false) })
  }, [user, navigate])

  const startEdit = (item) => {
    setEditingId(item.tracker_id)
    setEditForm({ status: item.status, notes: item.notes || '' })
  }

  const saveEdit = (trackerId) => {
    fetch(`${process.env.REACT_APP_API_URL}/api/tracker/` + trackerId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTracker(tracker.map(item =>
            item.tracker_id === trackerId
              ? { ...item, status: editForm.status, notes: editForm.notes }
              : item
          ))
          setEditingId(null)
          showToast('Application updated')
        }
      })
      .catch(() => showToast('Could not update', 'error'))
  }

  const removeFromTracker = (trackerId) => {
    fetch(`${process.env.REACT_APP_API_URL}/api/tracker/` + trackerId, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTracker(tracker.filter(item => item.tracker_id !== trackerId))
          showToast('Application removed')
        }
      })
      .catch(() => showToast('Could not remove', 'error'))
  }

  const statusCounts = statusOptions.reduce((acc, s) => {
    acc[s] = tracker.filter(item => item.status === s).length
    return acc
  }, {})

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

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg text-white ${toast.type === 'success' ? 'bg-[#0c1a2e]' : 'bg-red-500'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#0c1a2e]">Application Tracker</h1>
            <p className="text-sm text-slate-400 mt-1">Track the status of your postgraduate applications</p>
          </div>
          <button onClick={() => navigate('/wishlist')}
            className="bg-[#0c1a2e] hover:bg-[#0891b2] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
            + Add from wishlist
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 mb-6">
          {statusOptions.map(s => (
            <div key={s} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-[#0c1a2e] mb-0.5">{statusCounts[s]}</div>
              <div className="text-xs text-slate-400 leading-tight">{s}</div>
            </div>
          ))}
        </div>

        {tracker.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 md:p-16 text-center shadow-sm">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-semibold text-[#0c1a2e] mb-1">No applications tracked yet</p>
            <p className="text-sm text-slate-400 mb-6">Add programmes from your Wishlist to start tracking</p>
            <button onClick={() => navigate('/wishlist')}
              className="bg-[#0c1a2e] hover:bg-[#0891b2] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors">
              Go to Wishlist →
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Programme</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">University</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Country</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Notes</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {tracker.map((item, i) => (
                  <tr key={item.tracker_id}
                    className={`border-b border-slate-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-[#0c1a2e]">{item.programme_title}</p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-600">{item.university_name}</p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-600">{flags[item.country] || '🌍'} {item.country}</p>
                    </td>

                    <td className="px-5 py-4">
                      {editingId === item.tracker_id ? (
                        <select
                          value={editForm.status}
                          onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-[#0c1a2e] bg-white focus:outline-none focus:ring-1 focus:ring-[#0891b2] w-full">
                          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusConfig[item.status] || statusConfig['Interested']}`}>
                          {item.status}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 max-w-[180px]">
                      {editingId === item.tracker_id ? (
                        <input
                          value={editForm.notes}
                          onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                          placeholder="Add notes..."
                          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-[#0c1a2e] bg-white focus:outline-none focus:ring-1 focus:ring-[#0891b2] w-full"
                        />
                      ) : (
                        <p className="text-xs text-slate-400 truncate">{item.notes || '—'}</p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {editingId === item.tracker_id ? (
                          <>
                            <button onClick={() => saveEdit(item.tracker_id)}
                              className="text-xs font-semibold bg-[#0c1a2e] hover:bg-[#0891b2] text-white px-3 py-1.5 rounded-lg transition-colors">
                              Save
                            </button>
                            <button onClick={() => setEditingId(null)}
                              className="text-xs font-medium border border-slate-200 bg-white text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(item)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-sky-50 text-[#0891b2] hover:bg-sky-100 transition-colors border border-sky-200">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <a href={`https://www.google.com/search?q=${encodeURIComponent(item.university_name + ' official website')}`}
                              target="_blank" rel="noopener noreferrer"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                            <button onClick={() => removeFromTracker(item.tracker_id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-200">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
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

export default Tracker

