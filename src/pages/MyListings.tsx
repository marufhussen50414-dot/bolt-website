import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Package, PlusCircle, Eye, TrendingUp } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { GameListing } from "../lib/types";
import { formatBDT, timeAgo } from "../lib/utils";
import { StatusBadge } from "../components/ListingCard";

export default function MyListings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<GameListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("game_listings")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });
      setListings((data as GameListing[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-primary-500" size={28} /></div>;
  if (!user) return <div className="mx-auto max-w-md py-16 text-center"><div className="card p-8"><h2 className="font-display text-xl font-bold text-white">Log in to view your listings</h2><Link to="/login?redirect=/my-listings" className="btn-primary mt-5 inline-flex">Log In</Link></div></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-white mb-4"><ArrowLeft size={16} /> Go back</button>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">My Listings</h1>
          <p className="text-sm text-ink-400 mt-1">{listings.length} {listings.length === 1 ? "listing" : "listings"} created by you</p>
        </div>
        <Link to="/sell" className="btn-primary"><PlusCircle size={16} /> New Listing</Link>
      </div>
      {loading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-primary-500" size={28} /></div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((l) => (
            <Link key={l.id} to={`/listing/${l.id}`} className="card-hover overflow-hidden block group border border-ink-700/60 hover:border-primary-500/40">
              <div className="relative h-44 overflow-hidden">
                <img src={l.images?.[0] ?? "https://images.pexels.com/photos/19012050/pexels-photo-19012050.jpeg?auto=compress&cs=tinysrgb&w=600"} alt={l.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
                <div className="absolute top-3 left-3"><span className="badge glass text-white">{l.game_name}</span></div>
                {l.status === "sold" && <div className="absolute inset-0 grid place-items-center bg-ink-950/60"><span className="badge border border-ink-600 bg-ink-900 text-ink-300">SOLD</span></div>}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white line-clamp-1 group-hover:text-primary-400 transition-colors">{l.title}</h3>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-ink-400">
                  {l.rank_tier && <span className="flex items-center gap-1"><TrendingUp size={12} className="text-accent-400" /> {l.rank_tier}</span>}
                  <span className="flex items-center gap-1"><Eye size={12} /> {l.view_count}</span>
                  <span className="flex items-center gap-1"><Package size={12} /> {timeAgo(l.created_at)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-display text-xl font-extrabold text-white">{formatBDT(l.price)}</span>
                  <StatusBadge status={l.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center border border-ink-700/60">
          <Package size={40} className="mx-auto text-ink-600" />
          <p className="mt-3 font-semibold text-white">No listings yet</p>
          <p className="text-sm text-ink-400 mt-1">Create your first listing to start selling.</p>
          <Link to="/sell" className="btn-primary mt-4 inline-flex"><PlusCircle size={16} /> Create Listing</Link>
        </div>
      )}
    </div>
  );
}
