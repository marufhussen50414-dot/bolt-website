import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { GameListing, Conversation } from "../lib/types";
import { formatBDT, timeAgo } from "../lib/utils";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<GameListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [contacting, setContacting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from("game_listings")
      .select("*, category:categories(*), seller:profiles!seller_id(id, username, full_name, avatar_url, is_verified)")
      .eq("id", id)
      .single();
    if (err || !data) {
      setError("Listing not found.");
      setLoading(false);
      return;
    }
    const row = data as GameListing;
    setListing(row);

    // View count: only increment when the viewer is NOT the owner.
    // The owner viewing their own listing must never bump the count.
    if (user?.id !== row.seller_id) {
      supabase
        .from("game_listings")
        .update({ view_count: (row.view_count ?? 0) + 1 })
        .eq("id", id)
        .then(({ error: ue }) => {
          if (ue) console.warn("view increment failed", ue.message);
        });
      setListing((prev) => (prev ? { ...prev, view_count: (prev.view_count ?? 0) + 1 } : prev));
    }
    setLoading(false);
  }, [id, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const startConversation = async () => {
    if (!listing || !user) {
      navigate("/login");
      return;
    }
    if (user.id === listing.seller_id) return;
    setContacting(true);
    // find existing
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("buyer_id", user.id)
      .maybeSingle();
    if (existing) {
      navigate(`/messages/${(existing as Conversation).id}`);
      setContacting(false);
      return;
    }
    const { data, error } = await supabase
      .from("conversations")
      .insert({ listing_id: listing.id, seller_id: listing.seller_id, buyer_id: user.id })
      .select("id")
      .single();
    if (error) {
      console.warn("create conversation", error.message);
      setContacting(false);
      return;
    }
    navigate(`/messages/${(data as Conversation).id}`);
    setContacting(false);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }
  if (error || !listing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-lg text-ink-300">{error ?? "Listing not found."}</p>
        <Link to="/" className="btn-secondary mt-4"><ArrowLeft size={16} /> Back to browse</Link>
      </div>
    );
  }

  const images = listing.images?.length ? listing.images : [];
  const sellerName = listing.seller?.full_name ?? listing.seller?.username ?? "Seller";
  const isOwner = user?.id === listing.seller_id;
  const showHighlights =
    listing.prime != null ||
    listing.account_level != null ||
    (listing.evo_max_count != null && listing.evo_max_count > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 animate-fade-in">
      <Link to="/" className="btn-ghost mb-6"><ArrowLeft size={16} /> Back</Link>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="card overflow-hidden aspect-[4/3] bg-ink-800">
            {images[activeImg] ? (
              <img src={images[activeImg]} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-600">No image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 ${i === activeImg ? "border-primary-500" : "border-ink-700"}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="card p-6">
            <h1 className="font-display text-2xl font-bold text-white">{listing.title}</h1>
            <p className="mt-1 text-sm text-ink-400">{listing.game_name} - {timeAgo(listing.created_at)}</p>

            {/* Special highlights — pill-shaped tags */}
            {showHighlights && (
              <div className="mt-3 flex flex-wrap gap-2">
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

            <p className="font-display text-3xl font-extrabold text-primary-400 mt-4">{formatBDT(listing.price)}</p>

            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              {listing.server_region && (
                <div className="rounded-lg bg-ink-800/60 p-3">
                  <p className="text-ink-500 text-xs">Region</p>
                  <p className="text-white font-medium">{listing.server_region}</p>
                </div>
              )}
              {listing.account_id_display && (
                <div className="rounded-lg bg-ink-800/60 p-3">
                  <p className="text-ink-500 text-xs">Account ID</p>
                  <p className="text-white font-medium">{listing.account_id_display}</p>
                </div>
              )}
              <div className="rounded-lg bg-ink-800/60 p-3">
                <p className="text-ink-500 text-xs">Views</p>
                <p className="text-white font-medium flex items-center gap-1"><Eye size={13} /> {listing.view_count ?? 0}</p>
              </div>
            </div>

            {listing.description && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-ink-300 mb-2">Description</h3>
                <p className="text-sm text-ink-200 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
              </div>
            )}

            {/* Seller card with owner highlight */}
            <div className="mt-6 flex items-center justify-between rounded-xl bg-ink-800/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600/20 text-primary-300 font-semibold">
                  {sellerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="flex items-center gap-1.5 font-semibold text-white">
                    {sellerName}
                    {listing.seller?.is_verified && <ShieldCheck size={15} className="text-success-400" />}
                  </p>
                  <p className="text-xs text-ink-400">Seller</p>
                </div>
              </div>
              {isOwner ? (
                <span className="badge bg-primary-500/15 text-primary-300">Your listing</span>
              ) : (
                <button onClick={startConversation} disabled={contacting} className="btn-primary">
                  {contacting ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                  Contact
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
