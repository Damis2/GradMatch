import { Link } from 'react-router-dom'

function Landing() {
  const stats = [
    { val: '3,922', lbl: 'Programmes' },
    { val: '16', lbl: 'Countries' },
    { val: '87%', lbl: 'Match accuracy' },
    { val: '20+', lbl: 'Students helped' },
  ]

  const features = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'Semantic AI Matching',
      desc: 'SBERT understands your interests beyond keyword search.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Admission Competitiveness',
      desc: 'Know your chances before you apply.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      title: 'Application Tracker',
      desc: 'Track and manage your applications.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ),
      title: 'Wishlist Management',
      desc: 'Save and compare your favourite programmes.',
    },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="bg-[#0c1a2e]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-[#0c1a2e] font-bold text-sm">G</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Grad<span className="text-cyan-400">Match</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-sky-300">
            <span className="hover:text-white cursor-pointer transition-colors">About</span>
            <span className="hover:text-white cursor-pointer transition-colors">How It Works</span>
            <span className="hover:text-white cursor-pointer transition-colors">Features</span>
          </div>
          
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-50 to-white py-16 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Left — text */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-[#0c1a2e] leading-tight mb-5 tracking-tight">
                Find Your Ideal<br />
                Master's Programme<br />
                <span className="text-[#0891b2]">Abroad</span>
              </h1>
              <p className="text-slate-500 text-base leading-relaxed mb-6 max-w-md">
                Personalized recommendations based on your input.
              </p>

              {/* Feature pills */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {features.map(f => (
                  <div key={f.title} className="flex items-start gap-2.5 bg-white border border-sky-100 rounded-xl p-3 shadow-sm">
                    <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center shrink-0 text-[#0891b2]">
                      {f.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#0c1a2e] leading-tight">{f.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-tight">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <Link to="/register"
                  className="bg-[#0c1a2e] hover:bg-[#0891b2] text-white font-semibold px-7 py-3 rounded-lg transition-colors text-sm">
                  Get Started
                </Link>
                <Link to="/login"
                  className="text-sm font-medium text-[#0c1a2e] border border-slate-300 hover:bg-slate-50 px-7 py-3 rounded-lg transition-colors">
                  Explore Programmes
                </Link>
              </div>
            </div>

            {/* Right — visual with floating score card */}
            <div className="relative hidden md:block">

              {/* Background visual */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0c1a2e] via-[#0c2a4e] to-[#0891b2] h-80 flex items-center justify-center">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 left-8 text-6xl">🏛️</div>
                  <div className="absolute top-12 right-8 text-5xl">🗼</div>
                  <div className="absolute bottom-8 left-16 text-5xl">🌉</div>
                  <div className="absolute bottom-4 right-12 text-4xl">🎓</div>
                </div>
                <div className="relative text-center px-8">
                  <p className="text-white/60 text-sm mb-2">Your personalized match</p>
                  <div className="text-5xl font-bold text-white mb-1">91%</div>
                  <div className="inline-flex items-center gap-1.5 bg-green-400/20 border border-green-400/30 text-green-300 text-xs font-semibold px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    High Match
                  </div>
                </div>
              </div>

              {/* Floating score card */}
              <div className="absolute -bottom-6 -left-6 bg-white border border-sky-200 rounded-xl p-4 shadow-lg w-56">
                <p className="text-xs font-bold text-[#0c1a2e] mb-0.5">MSc Computer Science</p>
                <p className="text-xs text-slate-400 mb-3">University of Edinburgh · 🇬🇧</p>
                <div className="space-y-2">
                  {[
                    { label: 'Semantic match', val: 81 },
                    { label: 'QS ranking', val: 83 },
                    { label: 'Affordability', val: 62 },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                        <span>{s.label}</span>
                        <span className="font-semibold text-[#0c1a2e]">{s.val}%</span>
                      </div>
                      <div className="w-full bg-sky-100 rounded-full h-1">
                        <div className="bg-[#0891b2] h-1 rounded-full" style={{ width: `${s.val}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-sky-100">
                  <span className="bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-200">
                    Strong · 88%
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#0c1a2e] py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(s => (
              <div key={s.lbl} className="text-center">
                <div className="text-2xl font-bold text-cyan-400 mb-1">{s.val}</div>
                <div className="text-xs text-sky-300">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#0891b2] mb-3">How it works</p>
            <h2 className="text-2xl font-bold text-[#0c1a2e]">Three steps to your shortlist</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Build your profile', desc: 'Enter your CGPA, preferred country, discipline and academic interests.' },
              { num: '02', title: 'Get matched', desc: 'GradMatch runs SBERT semantic analysis and cross-encoder re-ranking across 3,922 programmes.' },
              { num: '03', title: 'Review & apply', desc: 'See your top 20 matches with full score breakdowns, save to wishlist and track your applications.' },
            ].map(s => (
              <div key={s.num} className="text-center">
                <div className="w-12 h-12 bg-sky-50 border-2 border-[#0891b2] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-sm font-bold text-[#0891b2]">{s.num}</span>
                </div>
                <h3 className="font-semibold text-[#0c1a2e] mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0c1a2e] py-16 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to find your programme?</h2>
          <p className="text-sky-300 text-sm leading-relaxed mb-8">
            Join students who've used GradMatch to shortlist international postgraduate programmes with confidence.
          </p>
          <Link to="/register"
            className="inline-block bg-cyan-400 hover:bg-cyan-300 text-[#0c1a2e] font-bold text-sm px-8 py-3.5 rounded-lg transition-colors">
            Create free account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-sky-100 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#0c1a2e] rounded flex items-center justify-center">
              <span className="text-cyan-400 font-bold text-xs">G</span>
            </div>
            <span className="text-slate-600 text-xs font-medium">GradMatch</span>
          </div>
          <p className="text-xs text-slate-400">© 2026 GradMatch · Built for undergraduate students</p>
        </div>
      </footer>

    <div className="hidden md:flex items-center gap-8 ..."></div>
    </div>
    
  )
}

export default Landing

