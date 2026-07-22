import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Loader2, AlertCircle, Search, PackageOpen } from 'lucide-react'
import { supabase, type ListingWithProfile } from '../lib/supabase'
import ListingCard from '../components/ListingCard'

export default function Home() {
  const [listings, setListings] = useState<ListingWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [gameFilter, setGameFilter] = useState('All')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    supabase
      .from('game_listings')
      .select(
        `*, profiles:profiles!game_listings_seller_id_fkey(id, full_name, username, avatar_url, is_verified)`
      )
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (!active) return
        if (err) {
          setError(err.message)
        } else {
          setListings((data as ListingWithProfile[]) || [])
        }
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const games = useMemo(() => {
    const set = new Set(listings.map((l) => l.game_name))
    return ['All', ...Array.from(set).sort()]
  }, [listings])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return listings.filter((l) => {
      const matchesGame = gameFilter === 'All' || l.game_name === gameFilter
      if (!matchesGame) return false
      if (!q) return true
      return (
        l.title.toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q) ||
        l.game_name.toLowerCase().includes(q) ||
        (l.tags || []).some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [listings, query, gameFilter])

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-ink-200 bg-gradient-to-b from-primary-50/60 to-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="flex flex-col items-start gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                Buy &amp; sell game accounts
              </h1>
              <p className="mt-3 max-w-xl text-base text-ink-500">
                Browse verified listings across every game. Sellers add their own tags so you find exactly what matters.
              </p>
            </div>
            <Link to="/sell" className="btn-primary">
              <Plus size={18} /> Sell an ID
            </Link>
          </div>
        </div>
      </section>

      {/* Controls */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, game, or tag"
              className="input pl-9"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {games.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGameFilter(g)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  gameFilter === g
                    ? 'bg-primary-600 text-white'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6">
          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 size={28} className="animate-spin text-primary-500" />
            </div>
          ) : error ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
              <AlertCircle size={36} className="text-ink-400" />
              <p className="mt-4 font-semibold text-ink-900">Could not load listings</p>
              <p className="mt-1 text-sm text-ink-500">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
              <PackageOpen size={40} className="text-ink-300" />
              <p className="mt-4 text-lg font-semibold text-ink-900">No listings yet</p>
              <p className="mt-1 max-w-sm text-sm text-ink-500">
                Be the first to list a game account for sale.
              </p>
              <Link to="/sell" className="btn-primary mt-6">
                <Plus size={18} /> Sell an ID
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
