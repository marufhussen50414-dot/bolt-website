import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, User, Tag, Loader2, AlertCircle, Gamepad2, Shield, BadgeCheck } from 'lucide-react'
import { supabase, type ListingWithProfile } from '../lib/supabase'
import Tags from '../components/Tags'

function formatPrice(price: number) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(price)
  } catch {
    return `USD ${price}`
  }
}

const PLACEHOLDER =
  'https://images.pexels.com/photos/1670974/pexels-photo-1670974.jpeg?auto=compress&cs=tinysrgb&w=1200'

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [listing, setListing] = useState<ListingWithProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    setError(null)
    supabase
      .from('game_listings')
      .select(
        `*, profiles:profiles!game_listings_seller_id_fkey(id, full_name, username, avatar_url, is_verified)`
      )
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (!active) return
        if (err) {
          setError(err.message)
          setListing(null)
        } else if (!data) {
          setError('This listing could not be found.')
          setListing(null)
        } else {
          setListing(data as ListingWithProfile)
        }
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <AlertCircle size={36} className="mx-auto text-ink-400" />
        <p className="mt-4 text-lg font-semibold text-ink-900">{error || 'Listing not found'}</p>
        <Link to="/" className="btn-ghost mt-6">Back to listings</Link>
      </div>
    )
  }

  const cover = listing.images && listing.images.length > 0 ? listing.images[0] : PLACEHOLDER
  const ownerName = listing.profiles?.full_name || 'Unknown seller'
  const isVerified = listing.profiles?.is_verified
  const tags = listing.tags || []

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-xl border border-ink-200 bg-ink-100">
            <img
              src={cover}
              alt={listing.title}
              className="aspect-[16/10] w-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = PLACEHOLDER
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 ring-1 ring-inset ring-primary-200">
              <Gamepad2 size={13} /> {listing.game_name}
            </span>
            {listing.rank_tier && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-600 ring-1 ring-inset ring-accent-500/30">
                {listing.rank_tier}
              </span>
            )}
            {listing.account_level != null && (
              <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-600">
                Lvl {listing.account_level}
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            {listing.title}
          </h1>

          <p className="mt-3 text-2xl font-bold text-primary-700">{formatPrice(Number(listing.price))}</p>

          {/* Tags displayed as pills right above the owner's name */}
          <div className="mt-5 min-h-[2rem]">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
              <Tag size={12} /> Tags
            </div>
            <Tags tags={tags} size="md" />
          </div>

          {/* Owner name shifted down to sit below the tags */}
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs text-ink-400">Seller</p>
              <p className="flex items-center gap-1.5 font-semibold text-ink-900">
                {ownerName}
                {isVerified && <BadgeCheck size={15} className="text-primary-500" />}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary mt-5 w-full"
            onClick={() =>
              (window.location.href = `mailto:?subject=${encodeURIComponent('Interest in: ' + listing.title)}`)
            }
          >
            <Shield size={16} /> Contact seller
          </button>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-ink-900">About this account</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-600">
          {listing.description || 'No description provided.'}
        </p>

        {(listing.server_region || listing.account_id_display) && (
          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {listing.server_region && (
              <div className="rounded-lg border border-ink-200 bg-white px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">Server region</dt>
                <dd className="mt-1 text-sm font-semibold text-ink-900">{listing.server_region}</dd>
              </div>
            )}
            {listing.account_id_display && (
              <div className="rounded-lg border border-ink-200 bg-white px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">Account ID</dt>
                <dd className="mt-1 text-sm font-semibold text-ink-900">{listing.account_id_display}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </div>
  )
}
