import { useState, FormEvent } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Loader2, AlertCircle, Gamepad2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const isSignUp = location.pathname === '/signup'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const redirectTo = (location.state as { from?: string } | null)?.from || '/'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Email and password are required.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() || 'Player' } },
      })
      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }
      // Email confirmation is OFF; session is created immediately.
      navigate(redirectTo)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }
    navigate(redirectTo)
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:py-16">
      <Link to="/" className="mb-8 flex items-center justify-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
          <Gamepad2 size={20} />
        </span>
        <span className="text-xl font-bold tracking-tight text-ink-900">
          GameID<span className="text-primary-600">Market</span>
        </span>
      </Link>

      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          {isSignUp ? 'Create account' : 'Sign in'}
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          {isSignUp
            ? 'Start listing your game accounts for sale.'
            : 'Welcome back. Sign in to manage your listings.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignUp && (
            <div>
              <label className="label" htmlFor="fullName">Display name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Shown on your listings"
                className="input"
                maxLength={40}
              />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="input"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Please wait...
              </>
            ) : isSignUp ? (
              'Create account'
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-500">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <Link to="/signin" className="font-semibold text-primary-700 hover:text-primary-800">
                Sign in
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-semibold text-primary-700 hover:text-primary-800">
                Sign up
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
