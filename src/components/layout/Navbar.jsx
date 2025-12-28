import { Link, NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/live', label: '🔴 Live', highlight: true },
  { to: '/fixtures', label: 'Fixtures' },
  { to: '/teams', label: 'Teams' },
]

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-bg/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
              <span className="text-2xl">⚽</span>
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-gradient">Foot</span>
              <span className="text-text">Five</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map(({ to, label, highlight }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : highlight
                        ? 'text-primary hover:bg-primary/10'
                        : 'text-text-muted hover:text-text hover:bg-card'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button className="sm:hidden p-2 rounded-lg hover:bg-card text-text-muted hover:text-text transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        <div className="sm:hidden pb-4 flex flex-wrap gap-2">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-bg'
                    : 'bg-card text-text-muted hover:text-text'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
