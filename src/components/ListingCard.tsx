import { Link } from "react-router-dom";
import { Flame, Crosshair, Target, Shield, Sword, Zap, Gamepad2, Eye, Star, ShieldCheck, TrendingUp, User } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import type { GameListing, ListingStatus, OrderStatus } from "../lib/types";
import { formatBDT, statusClass, statusLabel, classNames, IconType } from "../lib/utils";

const fallbackImages = [
  "https://images.pexels.com/photos/19012050/pexels-photo-19012050.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/16707738/pexels-photo-16707738.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=600",
];

const gameIcons: Record<string, IconType> = {
  "Free Fire": Flame, "PUBG Mobile": Crosshair, "Call of Duty Mobile": Target,
  "Clash of Clans": Shield, "Mobile Legends": Sword, Valorant: Zap,
};

export function StatusBadge({ status }: { status: ListingStatus | OrderStatus }) {
  return <span className={classNames("badge border", statusClass(status))}>{statusLabel(status)}</span>;
}

export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-44 bg-ink-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-20 rounded bg-ink-800" />
        <div className="h-5 w-full rounded bg-ink-800" />
        <div className="h-4 w-2/3 rounded bg-ink-800" />
        <div className="flex justify-between pt-2"><div className="h-6 w-16 rounded bg-ink-800" /><div className="h-6 w-12 rounded bg-ink-800" /></div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle }: { icon: IconType; title: string; subtitle?: string }) {
  return (
    <div className="card p-12 text-center">
      <Icon size={40} className="mx-auto text-ink-600" />
      <p className="mt-3 font-semibold text-white">{title}</p>
      {subtitle && <p className="text-sm text-ink-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function ListingCard({ listing }: { listing: GameListing }) {
  const img = listing.images?.[0] ?? fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
  const GameIcon = gameIcons[listing.game_name] ?? Gamepad2;

  return (
    <RouterLink to={`/listing/${listing.id}`} className="card-hover overflow-hidden block group">
      <div className="relative h-44 overflow-hidden">
        <img src={img} alt={listing.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="badge glass text-white"><GameIcon size={12} /> {listing.game_name}</span>
        </div>
        {listing.is_featured && (
          <span className="absolute top-3 right-3 badge bg-accent-500/90 text-ink-950 font-bold"><Star size={12} className="fill-ink-950" /> Featured</span>
        )}
        {listing.status === "sold" && (
          <div className="absolute inset-0 grid place-items-center bg-ink-950/60"><span className="badge border border-ink-600 bg-ink-900 text-ink-300">SOLD</span></div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white line-clamp-1 group-hover:text-primary-400 transition-colors">{listing.title}</h3>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-ink-400">
          {listing.rank_tier && <span className="flex items-center gap-1"><TrendingUp size={12} className="text-accent-400" /> {listing.rank_tier}</span>}
          <span className="flex items-center gap-1"><Eye size={12} /> {listing.view_count}</span>
        </div>
        {listing.tags && listing.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-1.2 gap-y-2.5 max-h-[4.25rem] overflow-hidden">
            {listing.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-full bg-accent-500/10 px-2.5 py-1 text-[11px] font-medium text-accent-300 ring-1 ring-inset ring-accent-500/25">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-xl font-extrabold text-white">{formatBDT(listing.price)}</span>
          {listing.seller && (
            <span className="flex items-center gap-1 text-xs min-w-0">
              <User size={13} className="text-accent-400 shrink-0" />
              <span className="font-medium text-accent-300 whitespace-nowrap">{listing.seller.full_name ?? listing.seller.username}</span>
              {listing.seller.is_verified && <ShieldCheck size={13} className="text-success-400 shrink-0" />}
            </span>
          )}
        </div>
      </div>
    </RouterLink>
  );
}

export { Link };
