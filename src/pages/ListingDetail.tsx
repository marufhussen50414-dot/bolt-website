import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Calendar, ShieldCheck, MessageCircle, Loader2, Package, BadgeCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { GameListing } from "../lib/types";
import { formatPrice, timeAgo } from "../lib/utils";
import TagPills from "../components/TagPills";

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { session } = useAuth();
  const [listing, setListing] = useState<GameListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: qErr } = await supabase
        .from("game_listings")
        .select("*, seller:profiles(*), category:categories(*)")
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;
      if (qErr || !data) {
        setError(qErr?.message ?? "Listing not found.");
        setLoading(false);
        return;
      }
      const l = data as GameListing;
      setListing(l);
      setLoading(false);

      // VIEW COUNT FIX: only increment when the viewer is NOT the owner.
      const isOwner = !!session?.user && session.user.id === l.seller_id;
      if (!isOwner) {
        await supabase
          .from("game_listings")
          .update({ view_count: (l.view_count ?? 0) + 1 })
          .eq("id", l.id);
        setListing((prev) => (prev ? { ...prev, view_count: (prev.view_count ?? 0) + 1 } : prev));
      }
    })();
    return () => { cancelled = true; };
  }, [id, session?.user]);

  async function contactSeller() {
    if (!listing || !session) { nav("/login"); return; }
    if (session.user.id === listing.seller_id) return;
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("buyer_id", session.user.id)
      .maybeSingle();
    if (existing) { nav(`/messages/${existing.id}`); return; }
    const { data, error } = await supabase
      .from("conversations")
      .insert({ listing_id: listing.id, buyer_id: session.user.id, seller_id: listing.seller_id })
      .select("id")
      .maybeSingle();
    if (error) return;
    if (data) nav(`/messages/${data.id}`);
  }

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 size={28} className="animate-spin text-primary-400" /></div>;
  }
  if (error || !listing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Package size={40} className="mx-auto text-ink-600" />
        <p className="mt-3 text-ink-400">{error ?? "Listing not found."}</p>
        <Link to="/browse" className="btn-primary mt-4 inline-flex"><ArrowLeft size={16} /> Back to Browse</Link>
      </div>
    );
  }

  const imgs = listing.images ?? [];
  const seller = listing.seller;
  const isOwner = !!session?.user && session.user.id === listing.seller_id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/browse" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-white">
        <ArrowLeft size={16} /> Back to Browse
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="card aspect-square overflow-hidden">
            {imgs[activeImg] ? (
              <img src={imgs[activeImg]} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-ink-600"><Package size={40} /></div>
            )}
          </div>
          {imgs.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {imgs.map((u, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${i === activeImg ? "border-primary-500" : "border-ink-700 hover:border-ink-500"}`}
                >
                  <img src={u} alt={`thumb ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {/* Title */}
          <h1 className="font-display text-2xl font-extrabold text-white md:text-3xl">{listing.title}</h1>

          {/* Game badge directly below the title */}
          <span className="mt-2 inline-flex items-center rounded-md bg-primary-500/15 px-2.5 py-1 text-xs font-semibold text-primary-300">
            {listing.game_name}
          </span>

          {/* Special tags pills */}
          <TagPills tags={listing.tags} className="mt-3" />

          <div className="mt-4 flex items-center gap-3 text-xs text-ink-500">
            <span className="flex items-center gap-1"><Eye size={13} /> {listing.view_count ?? 0} views</span>
            <span className="flex items-center gap-1"><Calendar size={13} /> {timeAgo(listing.created_at)}</span>
            {listing.status === "sold" && <span className="badge bg-error-500/15 text-error-300">Sold</span>}
          </div>

          <div className="mt-4 rounded-xl border border-ink-700 bg-ink-900/60 p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">Price</span>
            <p className="font-display text-3xl font-extrabold text-white">৳{formatPrice(Number(listing.price))}</p>
          </div>

          {listing.description && (
            <div className="mt-4">
              <h3 className="text-sm font-bold text-white">Description</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-300">{listing.description}</p>
            </div>
          )}

          {(listing.account_level != null || listing.server_region) && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {listing.account_level != null && (
                <div className="rounded-lg border border-ink-700 bg-ink-900/40 px-3 py-2">
                  <p className="text-[11px] uppercase text-ink-500">Account Level</p>
                  <p className="text-sm font-bold text-white">{listing.account_level}</p>
                </div>
              )}
              {listing.server_region && (
                <div className="rounded-lg border border-ink-700 bg-ink-900/40 px-3 py-2">
                  <p className="text-[11px] uppercase text-ink-500">Server / Region</p>
                  <p className="text-sm font-bold text-white">{listing.server_region}</p>
                </div>
              )}
            </div>
          )}

          {/* Owner block — clean highlight, no logos/graphics; tag pills above the name */}
          {seller && (
            <div className="mt-5 rounded-xl border border-ink-700 bg-gradient-to-br from-ink-900 to-ink-900/40 p-4">
              <TagPills tags={listing.tags} size="sm" className="mb-2" />
              <div className="flex items-center justify-between gap-3">
                <Link to={`/profile/${seller.id}`} className="group">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Seller</p>
                  <p className="rounded-md bg-primary-500/10 px-1.5 py-0.5 text-base font-bold text-primary-200 group-hover:bg-primary-500/20">
                    {seller.full_name}
                    {seller.is_verified && <BadgeCheck size={14} className="ml-1.5 inline text-success-400" />}
                  </p>
                </Link>
                <div className="text-right">
                  <p className="text-[11px] text-ink-500">{seller.items_sold ?? seller.total_sales ?? 0} sold</p>
                  <p className="flex items-center justify-end gap-1 text-[11px] text-success-400">
                    <ShieldCheck size={11} /> {Number(seller.trust_score ?? 0).toFixed(0)}% trust
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex gap-3">
            {isOwner ? (
              <Link to="/dashboard" className="btn-secondary flex-1">Manage in Dashboard</Link>
            ) : (
              <button onClick={contactSeller} className="btn-primary flex-1">
                <MessageCircle size={16} /> Contact Seller
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
