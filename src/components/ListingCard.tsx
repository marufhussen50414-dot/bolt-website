import { Link } from "react-router-dom";
import { Eye, BadgeCheck } from "lucide-react";
import type { GameListing } from "../lib/types";
import { formatPrice, timeAgo } from "../lib/utils";
import TagPills from "./TagPills";

export default function ListingCard({ listing }: { listing: GameListing }) {
  const img = listing.images?.[0];
  const seller = listing.seller;
  return (
    <Link
      to={`/listing/${listing.id}`}
      className="group card overflow-hidden transition-all hover:-translate-y-1 hover:border-primary-500/40 hover:shadow-xl hover:shadow-primary-500/10"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
        {img ? (
          <img
            src={img}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-ink-600">
            <Eye size={28} />
          </div>
        )}
        {listing.is_featured && (
          <span className="badge absolute left-2 top-2 bg-accent-500/90 text-ink-950">Featured</span>
        )}
        {listing.status === "sold" && (
          <span className="badge absolute right-2 top-2 bg-error-500/90 text-white">Sold</span>
        )}
        <span className="badge absolute bottom-2 right-2 bg-ink-950/70 text-white backdrop-blur">
          <Eye size={11} /> {listing.view_count ?? 0}
        </span>
      </div>

      <div className="p-3.5">
        <h3 className="font-display text-sm font-bold text-white line-clamp-1 group-hover:text-primary-300">
          {listing.title}
        </h3>
        {/* Game badge directly below the title */}
        <span className="mt-1.5 inline-flex items-center rounded-md bg-primary-500/15 px-2 py-0.5 text-[11px] font-semibold text-primary-300">
          {listing.game_name}
        </span>

        {/* Special tags (no rank) */}
        <TagPills tags={listing.tags} size="sm" className="mt-2" />

        <div className="mt-3 flex items-end justify-between">
          <span className="font-display text-lg font-extrabold text-white">
            ৳{formatPrice(Number(listing.price))}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-ink-500">
            {seller?.is_verified && <BadgeCheck size={12} className="text-success-400" />}
            {timeAgo(listing.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-ink-800" />
      <div className="p-3.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-ink-800" />
        <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-ink-800" />
        <div className="mt-3 h-6 w-1/2 animate-pulse rounded bg-ink-800" />
      </div>
    </div>
  );
}
