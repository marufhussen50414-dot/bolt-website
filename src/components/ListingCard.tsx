import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import type { GameListing } from "../lib/types";
import { formatBDT, timeAgo, classNames, categoryIcon } from "../lib/utils";

interface Props {
  listing: GameListing;
}

export default function ListingCard({ listing }: Props) {
  const GameIcon = categoryIcon(listing.category?.icon);
  const image = listing.images?.[0];
  const sellerName = listing.seller?.full_name ?? listing.seller?.username ?? "Seller";

  const showHighlights =
    listing.prime != null ||
    listing.account_level != null ||
    (listing.evo_max_count != null && listing.evo_max_count > 0);

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="card group overflow-hidden transition hover:border-ink-600 hover:shadow-xl hover:shadow-ink-950/50 animate-fade-in"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
        {image ? (
          <img
            src={image}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-600">
            <GameIcon size={40} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/10 to-transparent" />
        {listing.is_featured && (
          <span className="badge-glass absolute top-3 right-3">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" /> Featured
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white line-clamp-1 group-hover:text-primary-400 transition-colors">
          {listing.title}
        </h3>

        {/* Game badge — small text/badge directly below title */}
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-ink-800 px-2 py-0.5 text-[11px] font-medium text-ink-300">
          <GameIcon size={11} /> {listing.game_name}
        </span>

        <div className="mt-2 flex items-center gap-3 text-xs text-ink-400">
          <span className="flex items-center gap-1">
            <Eye size={12} /> {listing.view_count ?? 0}
          </span>
          <span>{timeAgo(listing.created_at)}</span>
        </div>

        {/* Special highlights — pill-shaped tags, space above owner name */}
        {showHighlights && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {listing.prime != null && (
              <span className="tag-pill bg-accent-500/15 text-accent-300">Prime Lv.{listing.prime}</span>
            )}
            {listing.account_level != null && (
              <span className="tag-pill bg-primary-500/15 text-primary-300">Lv.{listing.account_level}</span>
            )}
            {listing.evo_max_count != null && listing.evo_max_count > 0 && (
              <span className="tag-pill bg-success-500/15 text-success-300">Evo x{listing.evo_max_count}</span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-xl font-extrabold text-white">{formatBDT(listing.price)}</span>
          {/* Owner name — subtle clean highlight, right side */}
          <span
            className={classNames(
              "max-w-[110px] truncate rounded-md bg-primary-500/10 px-2 py-0.5 text-xs font-semibold text-primary-300",
            )}
            title={sellerName}
          >
            {sellerName}
          </span>
        </div>
      </div>
    </Link>
  );
}
