import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 12px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  width: '100%',
  transition: 'border-color var(--dur-fast) var(--ease-out)',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-secondary)',
    }}>
      <div style={{
        width: '400px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px',
        boxShadow: 'var(--shadow-modal)',
      }}>
        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <svg width="40" height="40" viewBox="0 0 22 22" fill="none"
            style={{ display: 'block', margin: '0 auto 10px' }}>
            <path d="M11 2L4 7v8l7 5 7-5V7L11 2z"
              stroke="var(--accent-orange)" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            <path d="M11 2v18M4 7l7 4 7-4"
              stroke="var(--accent-teal)" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
          </svg>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '24px',
            letterSpacing: '0.08em',
            color: 'var(--accent-orange)',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            Mythwright
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px', fontFamily: 'var(--font-body)' }}>
            Forge your narrative.
          </p>
        </div>

        <form
          onSubmit={e => { e.preventDefault(); navigate('/app') }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--border-active)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--border-active)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: '8px',
              background: 'var(--accent-orange)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              fontSize: '13px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'background var(--dur-fast) var(--ease-out)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-orange-dim)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-orange)'}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => navigate('/app')}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              border: 'none',
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'color var(--dur-fast) var(--ease-out)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Continue without account →
          </button>
        </form>
      </div>
    </div>
  )
}
