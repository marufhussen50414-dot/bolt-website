import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2, PackageOpen, Eye, TrendingUp, Wallet, Tag } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { GameListing } from "../lib/types";
import { formatBDT, timeAgo } from "../lib/utils";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<GameListing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("game_listings")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.warn("dashboard load", error.message);
    setListings((data as GameListing[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const totalViews = listings.reduce((s, l) => s + (l.view_count ?? 0), 0);
  const totalValue = listings.reduce((s, l) => s + l.price, 0);

  const stats = [
    { label: "Active listings", value: listings.length, icon: Tag, color: "text-primary-400" },
    { label: "Total views", value: totalViews, icon: Eye, color: "text-accent-400" },
    { label: "Listings value", value: formatBDT(totalValue), icon: Wallet, color: "text-success-400" },
    { label: "Items sold", value: profile?.items_sold ?? 0, icon: TrendingUp, color: "text-primary-400" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">Dashboard</h1>
          <p className="mt-1 text-ink-400">Welcome back, {profile?.full_name ?? "Player"}</p>
        </div>
        <Link to="/sell" className="btn-primary">Sell new</Link>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <s.icon className={s.color} size={22} />
            <p className="mt-3 font-display text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-ink-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Listings table */}
      <div className="mt-8">
        <h2 className="font-display text-xl font-bold text-white mb-4">Your listings</h2>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
        ) : listings.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-ink-500">
            <PackageOpen size={44} />
            <p className="mt-3 font-medium text-ink-300">No listings yet</p>
            <Link to="/sell" className="btn-primary mt-4">Create your first listing</Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="divide-y divide-ink-800">
              {listings.map((l) => (
                <div key={l.id} className="flex items-center gap-4 p-4 hover:bg-ink-800/40 transition">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-ink-800">
                    {l.images?.[0] && <img src={l.images[0]} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/listing/${l.id}`} className="font-medium text-white hover:text-primary-400 transition truncate block">
                      {l.title}
                    </Link>
                    <p className="text-xs text-ink-400">{l.game_name} - {timeAgo(l.created_at)}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-xs text-ink-400">
                    <Eye size={13} /> {l.view_count ?? 0}
                  </div>
                  <span className="font-display font-bold text-white">{formatBDT(l.price)}</span>
                  <span className={`badge ${l.status === "active" ? "bg-success-500/15 text-success-300" : "bg-ink-800 text-ink-400"}`}>
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
