import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import type { Listing } from "../lib/types";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (!data) {
        setError("This listing no longer exists.");
        setLoading(false);
        return;
      }

      setListing(data);
      setLoading(false);

      // Owner-aware view increment: only call the increment RPC when the
      // current viewer is NOT the listing owner. The RPC also double-checks
      // server-side, but skipping the call entirely for the owner avoids a
      // wasted round trip and keeps the displayed count from flickering.
      const isOwner = user?.id && data.user_id === user.id;
      if (!isOwner) {
        const { error: rpcError } = await supabase.rpc("increment_listing_view", {
          p_listing_id: id,
          p_viewer_id: user?.id ?? null,
        });
        if (rpcError) return; // keep display as-is on failure
        // Reflect the increment locally so the count updates without a refetch.
        setListing((prev) =>
          prev ? { ...prev, views: prev.views + 1 } : prev
        );
      }
    })();

    return () => {
      active = false;
    };
  }, [id, user?.id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-700 border-t-brand-400" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-zinc-300">{error ?? "Listing not found."}</p>
        <Link to="/" className="btn-primary mt-5 inline-flex">
          Back to browse
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === listing.user_id;

  return (
    <div className="animate-fade-in">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-zinc-100"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        Back to browse
      </Link>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Gallery */}
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/60 shadow-card">
            <div className="aspect-video w-full bg-ink-850">
              {listing.image_urls[activeImage] ? (
                <img
                  src={listing.image_urls[activeImage]}
                  alt={`${listing.title} — image ${activeImage + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-600">
                  No image
                </div>
              )}
            </div>
            {listing.image_urls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {listing.image_urls.map((url, idx) => (
                  <button
                    key={url}
                    onClick={() => setActiveImage(idx)}
                    className={`relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      idx === activeImage
                        ? "border-brand-500"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-6 shadow-card">
            <span className="inline-block rounded-md bg-brand-500/15 px-2.5 py-1 text-xs font-semibold text-brand-300">
              {listing.game}
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-white">
              {listing.title}
            </h1>
            <div className="mt-3 flex items-center gap-4 text-sm text-zinc-400">
              <span className="flex items-center gap-1.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                {listing.views} views
              </span>
              {isOwner && (
                <span className="rounded-md bg-accent-500/15 px-2 py-0.5 text-xs font-medium text-accent-400">
                  Your listing
                </span>
              )}
            </div>

            <p className="mt-5 font-display text-4xl font-extrabold text-brand-300">
              ${Number(listing.price).toFixed(2)}
            </p>

            {/* Highlights grid */}
            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Highlights
              </p>
              <div className="grid grid-cols-2 gap-2">
                {listing.prime !== null && (
                  <Stat label="Prime" value={String(listing.prime)} />
                )}
                {listing.level !== null && (
                  <Stat label="Level" value={String(listing.level)} />
                )}
                {listing.evo_max_count !== null && (
                  <Stat label="Evo Max" value={String(listing.evo_max_count)} />
                )}
              </div>
            </div>

            {/* Tags */}
            {listing.tags.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {listing.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md border border-ink-700 bg-ink-850 px-2 py-1 text-xs font-medium text-zinc-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-primary mt-6 w-full">
              Contact seller
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      {listing.description && (
        <div className="mt-8 rounded-2xl border border-ink-800 bg-ink-900/60 p-6 shadow-card">
          <h2 className="mb-3 font-display text-lg font-bold text-white">
            About this account
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
            {listing.description}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-850 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
