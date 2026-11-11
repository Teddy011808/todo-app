import { useState } from 'react'
import { api } from '../api'
import { CheckIcon, LockIcon, MailIcon } from './Icons'

// Log in, or sign up and then log in with the same email and password
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const isSignup = mode === 'signup'

  function switchMode(next) {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (isSignup) await api.signup(email, password)
      await api.login(email, password)
      onLogin()
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Cannot reach the server. Is the backend running?' : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-head">
          <span className="brand-logo auth-logo">
            <CheckIcon size={24} strokeWidth={3} />
          </span>
          <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
          <p>{isSignup ? 'Start organizing your tasks in seconds.' : 'Log in to see your tasks.'}</p>
        </div>

        <div className="auth-switch" role="tablist">
          {['login', 'signup'].map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              className={mode === value ? 'active' : ''}
              onClick={() => switchMode(value)}
            >
              {value === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            Email
            <span className="auth-input">
              <MailIcon size={18} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required autoFocus />
            </span>
          </label>
          <label className="field">
            Password
            <span className="auth-input">
              <LockIcon size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
                minLength={8}
                maxLength={72}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
              />
            </span>
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn primary auth-submit" disabled={busy}>
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
