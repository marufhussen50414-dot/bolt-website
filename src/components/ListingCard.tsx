import { Link } from 'react-router-dom'
import { User, BadgeCheck } from 'lucide-react'
import type { ListingWithProfile } from '../lib/supabase'
import Tags from './Tags'

type ListingCardProps = {
  listing: ListingWithProfile
}

function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(price)
  } catch {
    return `${currency} ${price}`
  }
}

const PLACEHOLDER =
  'https://images.pexels.com/photos/1670974/pexels-photo-1670974.jpeg?auto=compress&cs=tinysrgb&w=800'

export default function ListingCard({ listing }: ListingCardProps) {
  const cover = listing.images && listing.images.length > 0 ? listing.images[0] : PLACEHOLDER
  const ownerName = listing.profiles?.full_name || 'Unknown seller'
  const isVerified = listing.profiles?.is_verified
  const tags = listing.tags || []

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-glow"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-100">
        <img
          src={cover}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = PLACEHOLDER
          }}
        />
        <span className="absolute left-3 top-3 rounded-full bg-ink-900/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          {listing.game_name}
        </span>
        {listing.rank_tier && (
          <span className="absolute right-3 top-3 rounded-full bg-accent-500/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {listing.rank_tier}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-ink-900">{listing.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink-500">{listing.description}</p>

        <div className="mt-auto pt-4">
          <p className="text-lg font-bold text-primary-700">
            {formatPrice(Number(listing.price), 'USD')}
          </p>

          {/* Tags sit right above the owner's name, shifting it down */}
          <div className="mt-3 min-h-[1.5rem]">
            <Tags tags={tags} />
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
            <User size={13} className="text-ink-400" />
            <span className="font-medium text-ink-600">{ownerName}</span>
            {isVerified && (
              <BadgeCheck size={13} className="text-primary-500" />
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
