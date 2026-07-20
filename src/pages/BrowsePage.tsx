import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Listing } from "../lib/types";
import { GAME_OPTIONS } from "../lib/types";

export default function BrowsePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    let query = supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });
    if (gameFilter !== "all") query = query.eq("game", gameFilter);
    query.then(({ data, error }) => {
      if (!active) return;
      if (error) setError(error.message);
      else {
        setListings(data ?? []);
        setError(null);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [gameFilter]);

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Browse listings
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Find verified gaming accounts from trusted sellers.
          </p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <FilterChip label="All" active={gameFilter === "all"} onClick={() => setGameFilter("all")} />
          {GAME_OPTIONS.map((g) => (
            <FilterChip
              key={g}
              label={g}
              active={gameFilter === g}
              onClick={() => setGameFilter(g)}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl border border-ink-800 bg-ink-900/50"
            />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-700 bg-ink-900/40 px-6 py-16 text-center">
          <p className="text-zinc-300">No listings found.</p>
          <Link to="/sell" className="btn-primary mt-4 inline-flex">
            Create the first listing
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-brand-500 text-ink-950"
          : "border border-ink-700 bg-ink-850 text-zinc-400 hover:border-ink-600 hover:text-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.image_urls[0];
  return (
    <Link
      to={`/listing/${listing.id}`}
      className="group overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/60 shadow-card transition hover:border-ink-700 hover:shadow-glow"
    >
      <div className="relative aspect-video overflow-hidden bg-ink-850">
        {cover ? (
          <img
            src={cover}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-600">
            No image
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-md bg-ink-950/80 px-2 py-1 text-xs font-medium text-zinc-200 backdrop-blur">
          {listing.game}
        </span>
      </div>
      <div className="p-4">
        <h3 className="truncate font-semibold text-white transition group-hover:text-brand-300">
          {listing.title}
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {listing.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-md bg-ink-800 px-2 py-0.5 text-[11px] font-medium text-zinc-400"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-lg font-bold text-brand-300">
            ${Number(listing.price).toFixed(2)}
          </span>
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            {listing.views}
          </span>
        </div>
      </div>
    </Link>
  );
}
