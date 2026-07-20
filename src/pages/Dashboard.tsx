import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Eye, Plus, BadgeCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { GameListing } from "../lib/types";
import { formatPrice, timeAgo } from "../lib/utils";

export default function Dashboard() {
  const { profile } = useAuth();
  const [listings, setListings] = useState<GameListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("game_listings")
      .select("*, category:categories(*)")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setListings((data as GameListing[]) ?? []); setLoading(false); });
  }, []);

  const totalViews = listings.reduce((a, l) => a + (l.view_count ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-400">Welcome back, {profile?.full_name ?? "Player"}</p>
        </div>
        <Link to="/sell" className="btn-primary"><Plus size={16} /> New Listing</Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="card p-4"><div className="flex items-center gap-2 text-ink-400"><Package size={16} /><span className="text-xs font-semibold uppercase">Listings</span></div><p className="mt-2 font-display text-2xl font-extrabold text-white">{listings.length}</p></div>
        <div className="card p-4"><div className="flex items-center gap-2 text-ink-400"><Eye size={16} /><span className="text-xs font-semibold uppercase">Views</span></div><p className="mt-2 font-display text-2xl font-extrabold text-white">{totalViews}</p></div>
        <div className="card p-4"><div className="flex items-center gap-2 text-ink-400"><BadgeCheck size={16} /><span className="text-xs font-semibold uppercase">Verified</span></div><p className="mt-2 font-display text-2xl font-extrabold text-white">{profile?.is_verified ? "Yes" : "No"}</p></div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-display text-lg font-bold text-white">Your Listings</h2>
        {loading ? (
          <div className="card p-12 text-center text-ink-500">Loading…</div>
        ) : listings.length > 0 ? (
          <div className="space-y-3">
            {listings.map((l) => (
              <Link key={l.id} to={`/listing/${l.id}`} className="card flex items-center gap-4 p-3 transition-colors hover:border-primary-500/40">
                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-800">
                  {l.images?.[0] ? <img src={l.images[0]} alt={l.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-ink-600"><Package size={18} /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{l.title}</p>
                  <p className="text-xs text-ink-500">{l.game_name} · {timeAgo(l.created_at)}</p>
                  <span className={`badge mt-1 ${l.status === "active" || l.status === "approved" ? "bg-success-500/15 text-success-300" : l.status === "sold" ? "bg-error-500/15 text-error-300" : "bg-ink-700 text-ink-300"}`}>{l.status}</span>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-white">৳{formatPrice(Number(l.price))}</p>
                  <p className="flex items-center justify-end gap-1 text-xs text-ink-500"><Eye size={11} /> {l.view_count ?? 0}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Package size={36} className="mx-auto text-ink-600" />
            <p className="mt-3 text-ink-400">You have no listings yet.</p>
            <Link to="/sell" className="btn-primary mt-4 inline-flex"><Plus size={16} /> Sell an ID</Link>
          </div>
        )}
      </div>
    </div>
  );
}
