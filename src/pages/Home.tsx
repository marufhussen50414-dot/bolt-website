import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Flame, Crosshair, Target, Shield, Sword, Zap, Gamepad2, ArrowRight, ShieldCheck, CreditCard, TrendingUp, Package, Users, Star, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Category, GameListing } from "../lib/types";
import ListingCard, { ListingCardSkeleton } from "../components/ListingCard";
import { IconType } from "../lib/utils";

const iconMap: Record<string, IconType> = {
  flame: Flame, crosshair: Crosshair, target: Target,
  shield: Shield, sword: Sword, zap: Zap, gamepad: Gamepad2,
};

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
    (async () => {
      const catRes = await supabase.from("categories").select("*").order("sort_order");
      setCategories((catRes.data as Category[]) ?? []);
    })();
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
      <section className="relative overflow-hidden bg-ink-950 border-b border-ink-800">
        <div className="absolute inset-0 bg-glow-radial opacity-60" />
        <div className="absolute top-0 left-1/3 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal size={18} className="text-primary-400" />
            <h2 className="font-display text-sm font-bold text-white uppercase tracking-wide">Find Your Game ID</h2>
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-error-400 hover:text-error-300 transition-colors">
                <X size={12} /> Clear ({activeFilters})
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-ink-400 mb-1.5 uppercase tracking-wide">Game</label>
              <div className="relative">
                <select
                  value={gameFilter}
                  onChange={(e) => setGameFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors cursor-pointer pr-9"
                >
                  <option value="">All Games</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
                <Gamepad2 size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-500" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink-400 mb-1.5 uppercase tracking-wide">Min Price (৳)</label>
              <input
                type="number" min="0" value={minPrice} placeholder="0"
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-white placeholder-ink-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink-400 mb-1.5 uppercase tracking-wide">Max Price (৳)</label>
              <input
                type="number" min="0" value={maxPrice} placeholder="Any"
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-white placeholder-ink-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink-400 mb-1.5 uppercase tracking-wide">Min Level</label>
              <input
                type="number" min="0" value={minLevel} placeholder="Any"
                onChange={(e) => setMinLevel(e.target.value)}
                className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-white placeholder-ink-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Latest Listings */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white">Latest Listings</h2>
              <span className="badge bg-primary-500/15 text-primary-300 border border-primary-500/20 text-sm">{availableCount} available</span>
            </div>
            <p className="text-sm text-ink-400 mt-1">Fresh accounts from verified sellers</p>
          </div>
          <Link to="/browse" className="text-sm font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1">View all <ArrowRight size={16} /></Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : recent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* Browse by Game */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white">Browse by Game</h2>
            <p className="text-sm text-ink-400 mt-1">Pick your favorite and start exploring</p>
          </div>
          <Link to="/browse" className="text-sm font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1">View all <ArrowRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon ?? "gamepad"] ?? Gamepad2;
            return (
              <Link key={cat.id} to={`/browse?category=${cat.slug}`} className="card-hover p-5 text-center group">
                <div className="inline-grid place-items-center h-14 w-14 rounded-2xl bg-primary-500/15 text-primary-400 group-hover:bg-primary-500 group-hover:text-white group-hover:scale-110 transition-all mx-auto">
                  <Icon size={26} />
                </div>
                <p className="mt-3 text-sm font-semibold text-white">{cat.name}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: ShieldCheck, title: "Secure Escrow", desc: "Your money stays protected until you confirm the account transfer is complete.", color: "text-success-400 bg-success-500/15" },
            { icon: CreditCard, title: "Easy Payments", desc: "Pay with bKash, Nagad, or debit/credit card. All methods supported.", color: "text-primary-400 bg-primary-500/15" },
            { icon: TrendingUp, title: "Only 2% Commission", desc: "Lowest fees in Bangladesh. 98% goes directly to the seller. No hidden charges.", color: "text-accent-400 bg-accent-500/15" },
          ].map((f) => (
            <div key={f.title} className="card p-6 hover:border-primary-500/30 transition-colors">
              <div className={`inline-grid place-items-center h-12 w-12 rounded-xl ${f.color}`}><f.icon size={24} /></div>
              <h3 className="font-display text-lg font-bold text-white mt-4">{f.title}</h3>
              <p className="text-sm text-ink-400 mt-1.5 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="text-center"><ShieldCheck size={28} className="mx-auto text-success-400" /><p className="font-display text-lg font-bold text-white mt-2">100%</p><p className="text-xs text-ink-400">Escrow Protected</p></div>
          <div className="text-center"><Users size={28} className="mx-auto text-primary-400" /><p className="font-display text-lg font-bold text-white mt-2">Trusted</p><p className="text-xs text-ink-400">Verified Sellers</p></div>
          <div className="text-center"><Star size={28} className="mx-auto text-accent-400" /><p className="font-display text-lg font-bold text-white mt-2">2% Only</p><p className="text-xs text-ink-400">Lowest Fees</p></div>
        </div>
      </section>
    </div>
  );
}
