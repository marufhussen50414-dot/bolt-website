import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Sell from './pages/Sell'
import ListingDetail from './pages/ListingDetail'
import Auth from './pages/Auth'
import type { ReactNode } from 'react'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/signin" state={{ from: '/sell' }} replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/sell" element={<RequireAuth><Sell /></RequireAuth>} />
            <Route path="/signin" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="border-t border-ink-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-ink-400">
            GameID Market — buy and sell game accounts safely.
          </div>
        </footer>
      </div>
    </AuthProvider>
  )
}
