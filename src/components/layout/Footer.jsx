import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <span className="font-bold text-lg">
              <span className="text-gradient">Foot</span>
              <span className="text-text">Five</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <Link to="/live" className="hover:text-primary transition-colors">
              🔴 Live
            </Link>
            <Link to="/fixtures" className="hover:text-primary transition-colors">
              Fixtures
            </Link>
            <Link to="/teams" className="hover:text-primary transition-colors">
              Teams
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} FootFive
          </p>
        </div>
      </div>
    </footer>
  )
}
