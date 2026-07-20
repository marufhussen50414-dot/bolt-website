import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Gamepad2, ArrowRight, Package, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Category, GameListing } from "../lib/types";
import ListingCard, { ListingCardSkeleton } from "../components/ListingCard";

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [recent, setRecent] = useState<GameListing[]>([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [gameFilter, setGameFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minLevel, setMinLevel] = useState("");

  const activeFilters = [gameFilter, minPrice, maxPrice, minLevel].filter(Boolean).length;

  const fetchListings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("game_listings")
      .select("*, seller:profiles(*), category:categories(*)")
      .in("status", ["approved", "active"])
      .order("created_at", { ascending: false })
      .limit(8);

    if (gameFilter) {
      const cat = categories.find((c) => c.slug === gameFilter);
      if (cat) query = query.eq("category_id", cat.id);
    }
    if (minPrice) query = query.gte("price", parseFloat(minPrice));
    if (maxPrice) query = query.lte("price", parseFloat(maxPrice));
    if (minLevel) query = query.gte("account_level", parseInt(minLevel));

    const [recentRes, countRes] = await Promise.all([
      query,
      supabase.from("game_listings").select("id", { count: "exact", head: true }).in("status", ["approved", "active"]),
    ]);
    setRecent((recentRes.data as GameListing[]) ?? []);
    setAvailableCount(countRes.count ?? 0);
    setLoading(false);
  }, [gameFilter, minPrice, maxPrice, minLevel, categories]);

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => {
      setCategories((data as Category[]) ?? []);
    });
  }, []);

  useEffect(() => {
    if (categories.length > 0) fetchListings();
  }, [categories, fetchListings]);

  const clearFilters = () => {
    setGameFilter(""); setMinPrice(""); setMaxPrice(""); setMinLevel("");
  };

  return (
    <div>
      {/* COMPACT FILTER BAR */}
      <section className="relative overflow-hidden border-b border-ink-800 bg-ink-950">
        <div className="absolute inset-0 bg-glow-radial opacity-60" />
        <div className="absolute left-1/3 top-0 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-3 flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-primary-400" />
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-white">Find Your Game ID</h2>
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-error-400 transition-colors hover:text-error-300">
                <X size={12} /> Clear ({activeFilters})
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-400">Game</label>
              <div className="relative">
                <select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)} className="w-full cursor-pointer appearance-none rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 pr-9 text-sm text-white outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                  <option value="">All Games</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.slug}>{cat.name}</option>)}
                </select>
                <Gamepad2 size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-500" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-400">Min Price (৳)</label>
              <input type="number" min="0" value={minPrice} placeholder="0" onChange={(e) => setMinPrice(e.target.value)} className="input" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-400">Max Price (৳)</label>
              <input type="number" min="0" value={maxPrice} placeholder="Any" onChange={(e) => setMaxPrice(e.target.value)} className="input" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-400">Min Level</label>
              <input type="number" min="0" value={minLevel} placeholder="Any" onChange={(e) => setMinLevel(e.target.value)} className="input" />
            </div>
          </div>
        </div>
      </section>

      {/* Latest Listings */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl font-extrabold text-white md:text-3xl">Latest Listings</h2>
              <span className="badge border border-primary-500/20 bg-primary-500/15 text-sm text-primary-300">{availableCount} available</span>
            </div>
            <p className="mt-1 text-sm text-ink-400">Fresh accounts from verified sellers</p>
          </div>
          <Link to="/browse" className="flex items-center gap-1 text-sm font-semibold text-primary-400 hover:text-primary-300">View all <ArrowRight size={16} /></Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : recent.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Package size={40} className="mx-auto text-ink-600" />
            <p className="mt-3 text-ink-400">No listings match your filters.</p>
            {activeFilters > 0 ? (
              <button onClick={clearFilters} className="btn-primary mt-4 inline-flex">Clear Filters</button>
            ) : (
              <Link to="/sell" className="btn-primary mt-4 inline-flex">Sell an ID</Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
