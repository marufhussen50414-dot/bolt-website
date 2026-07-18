import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Eye, Star, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { GameListing, Review, Profile } from "../lib/types";
import { formatBDT, timeAgo, classNames } from "../lib/utils";
import { StatusBadge } from "../components/ListingCard";

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<GameListing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase.from("game_listings").select("*, seller:profiles(*), category:categories(*)").eq("id", id).maybeSingle();
      if (error || !data) { setLoading(false); return; }
      setListing(data as GameListing);
      const revRes = await supabase.from("reviews").select("*, reviewer:profiles(full_name, username, avatar_url)").eq("reviewee_id", (data as GameListing).seller_id).order("created_at", { ascending: false });
      setReviews((revRes.data as Review[]) ?? []);
      setLoading(false);
      supabase.from("game_listings").update({ view_count: ((data as GameListing).view_count ?? 0) + 1 }).eq("id", id).then(() => {});
    })();
  }, [id]);

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-primary-500" size={28} /></div>;
  if (!listing) return <div className="mx-auto max-w-md py-16 text-center"><p className="text-ink-400">Listing not found.</p><Link to="/browse" className="btn-primary mt-4 inline-flex">Browse IDs</Link></div>;

  const seller = listing.seller as Profile | undefined;
  const images = listing.images?.length ? listing.images : ["https://images.pexels.com/photos/19012050/pexels-photo-19012050.jpeg?auto=compress&cs=tinysrgb&w=900"];
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const isOwn = user?.id === listing.seller_id;
  const canBuy = !!user && !isOwn && (listing.status === "active" || listing.status === "approved");

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/browse" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-white mb-4"><ArrowLeft size={16} /> Back to browse</Link>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="card overflow-hidden"><img src={images[activeImg]} alt={listing.title} className="w-full h-72 object-cover" /></div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={classNames("h-16 w-16 rounded-lg overflow-hidden border-2 shrink-0", activeImg === i ? "border-primary-500" : "border-ink-700")}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="badge bg-primary-500/15 text-primary-300 border border-primary-500/20">{listing.game_name}</span>
              <StatusBadge status={listing.status} />
              {listing.is_featured && <span className="badge bg-accent-500/15 text-accent-300 border border-accent-500/20"><Star size={12} className="fill-accent-300" /> Featured</span>}
            </div>
            <h1 className="font-display text-2xl font-extrabold text-white">{listing.title}</h1>
            <p className="font-display text-3xl font-extrabold text-primary-400 mt-3">{formatBDT(listing.price)}</p>
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              {listing.account_level != null && <Info label="Level" value={String(listing.account_level)} />}
              {listing.rank_tier && <Info label="Rank" value={listing.rank_tier} icon={TrendingUp} />}
              {listing.server_region && <Info label="Region" value={listing.server_region} />}
              <Info label="Views" value={String(listing.view_count)} icon={Eye} />
            </div>
            {canBuy && <button onClick={() => navigate(`/checkout/${listing.id}`)} className="btn-primary w-full mt-5">Buy Now — {formatBDT(listing.price)}</button>}
            {isOwn && <div className="rounded-xl bg-warning-500/10 border border-warning-500/20 p-3 text-sm text-warning-400 mt-4">This is your own listing.</div>}
            {!user && <Link to="/login" className="btn-primary w-full mt-5">Log in to buy</Link>}
          </div>
          {seller && (
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-3">Seller</h3>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white font-bold">{(seller.full_name ?? seller.username)?.[0]?.toUpperCase()}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5"><span className="font-semibold text-white">{seller.full_name ?? seller.username}</span>{seller.is_verified && <ShieldCheck size={15} className="text-success-400" />}</div>
                  <div className="flex items-center gap-2 text-xs text-ink-400 mt-0.5"><span className="flex items-center gap-0.5 text-warning-400"><Star size={11} className="fill-warning-400" /> {Number(seller.trust_score).toFixed(1)}</span><span>•</span><span>{seller.total_sales} sales</span></div>
                </div>
                <Link to="/profile" className="btn-ghost text-xs">View</Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-3">Description</h3>
          {listing.description ? <p className="text-sm text-ink-300 whitespace-pre-line leading-relaxed">{listing.description}</p> : <p className="text-sm text-ink-500">No description provided.</p>}
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-white">Seller Reviews</h3>{reviews.length > 0 && <span className="badge bg-warning-500/15 text-warning-400 border border-warning-500/20"><Star size={12} className="fill-warning-400" /> {avgRating.toFixed(1)} ({reviews.length})</span>}</div>
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.slice(0, 4).map((r) => (
                <div key={r.id} className="border-b border-ink-800 pb-3 last:border-0">
                  <div className="flex items-center gap-2"><span className="text-sm font-semibold text-white">{r.reviewer?.full_name ?? r.reviewer?.username ?? "Anonymous"}</span><span className="text-xs text-ink-500">{timeAgo(r.created_at)}</span></div>
                  <div className="flex mt-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < r.rating ? "text-warning-400 fill-warning-400" : "text-ink-700"} />)}</div>
                  {r.comment && <p className="text-sm text-ink-300 mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-ink-500">No reviews yet.</p>}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Eye }) {
  return <div className="rounded-lg bg-ink-800 p-3"><p className="text-xs text-ink-500">{label}</p><p className="text-sm font-semibold text-white mt-0.5 flex items-center gap-1.5">{Icon && <Icon size={14} className="text-primary-400" />}{value}</p></div>;
}
