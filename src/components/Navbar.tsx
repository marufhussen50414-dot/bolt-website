import { NavLink, Link, useNavigate } from 'react-router-dom'
import { Gamepad2, Plus, LogOut, User as UserIcon } from 'lucide-react'
import { useAuth } from '../lib/auth'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const linkBase = 'text-sm font-medium transition-colors'
  const active = 'text-primary-700'
  const inactive = 'text-ink-500 hover:text-ink-900'

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Gamepad2 size={18} />
          </span>
          <span className="text-lg font-bold tracking-tight text-ink-900">
            GameID<span className="text-primary-600">Market</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-5">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
          >
            Browse
          </NavLink>
          <NavLink
            to="/sell"
            className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
          >
            Sell
          </NavLink>
          <Link to="/sell" className="btn-primary hidden sm:inline-flex">
            <Plus size={16} /> Sell an ID
          </Link>
          {user ? (
            <button
              type="button"
              onClick={async () => {
                await signOut()
                navigate('/')
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
              title="Sign out"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Sign out</span>
            </button>
          ) : (
            <Link
              to="/signin"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
            >
              <UserIcon size={16} /> <span className="hidden sm:inline">Sign in</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
