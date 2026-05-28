import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Decorative orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <div className="sidebar-logo-icon">✓</div>
          <span className="gradient-text">TaskFlow</span>
        </div>
        <Link href="/login" className="btn btn-primary">
          Get Started
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-badge">
          <span>✨</span>
          <span>Built for teams that ship fast</span>
        </div>

        <h1 className="landing-title">
          Manage tasks with{' '}
          <span className="gradient-text-hero">clarity and speed</span>
        </h1>

        <p className="landing-subtitle">
          TaskFlow brings your team together with powerful task management,
          smart assignments, and real-time email notifications — all in one
          beautifully crafted workspace.
        </p>

        <div className="landing-cta">
          <Link href="/login" className="btn btn-primary btn-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Sign in with Google
          </Link>
          <a href="#features" className="btn btn-secondary btn-lg">
            Learn More
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-features">
        <div className="feature-card">
          <div className="feature-icon" style={{ background: 'rgba(102, 126, 234, 0.15)' }}>
            📋
          </div>
          <h3 className="feature-title">Smart Task Management</h3>
          <p className="feature-desc">
            Create, organize, and track tasks with priorities, statuses, and
            due dates. Everything your team needs to stay on top of work.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon" style={{ background: 'rgba(240, 147, 251, 0.15)' }}>
            👥
          </div>
          <h3 className="feature-title">Team Collaboration</h3>
          <p className="feature-desc">
            Assign tasks to team members with a click. Everyone knows what they
            need to do, who&apos;s responsible, and when it&apos;s due.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon" style={{ background: 'rgba(67, 233, 123, 0.15)' }}>
            📧
          </div>
          <h3 className="feature-title">Email Notifications</h3>
          <p className="feature-desc">
            Stay in the loop with automatic Gmail notifications when tasks are
            assigned or completed. Never miss an update again.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '3rem 1rem',
        color: 'var(--text-tertiary)',
        fontSize: 'var(--font-size-sm)',
        position: 'relative',
        zIndex: 10,
      }}>
        <p>© {new Date().getFullYear()} TaskFlow. Built with Next.js, Flask & Supabase.</p>
      </footer>
    </div>
  )
}
