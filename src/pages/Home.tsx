import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Flame, Crosshair, Target, Shield, Sword, Zap, Gamepad2, ArrowRight, ShieldCheck, CreditCard, TrendingUp, Package, Users, Star, Sparkles } from "lucide-react";
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

  const fetchListings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("game_listings")
      .select("*, seller:profiles(*), category:categories(*)")
      .in("status", ["approved", "active"])
      .order("created_at", { ascending: false })
      .limit(8);

    const [recentRes, countRes] = await Promise.all([
      query,
      supabase.from("game_listings").select("id", { count: "exact", head: true }).in("status", ["approved", "active"]),
    ]);
    setRecent((recentRes.data as GameListing[]) ?? []);
    setAvailableCount(countRes.count ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const catRes = await supabase.from("categories").select("*").order("sort_order");
      setCategories((catRes.data as Category[]) ?? []);
    })();
  }, []);

  useEffect(() => {
    if (categories.length > 0) fetchListings();
  }, [categories, fetchListings]);

  return (
    <div>
      {/* ANIME / AI GAMING CHARACTER HERO BANNER */}
      <section className="relative overflow-hidden bg-ink-950 border-b border-ink-800 py-6 px-4">
        {/* Background Glow Effects */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-48 h-48 bg-accent-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        
        <div className="relative mx-auto max-w-7xl flex items-center justify-center">
          <div className="w-full max-w-3xl rounded-2xl bg-gradient-to-r from-primary-950/90 via-ink-900 to-accent-950/90 border border-primary-500/40 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between shadow-2xl overflow-hidden gap-6 relative">
            
            {/* Background Decorative Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

            {/* Left Info / Greeting */}
            <div className="relative z-10 space-y-2 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/40 text-primary-300 text-xs font-bold tracking-wider uppercase animate-pulse">
                <Sparkles size={13} /> Elite Gaming Hub
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Level Up Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Play</span>
              </h1>
              <p className="text-xs sm:text-sm text-ink-300 max-w-sm">
                Buy & sell verified gaming accounts instantly with 100% secure escrow protection.
              </p>
            </div>

            {/* Right Side: Anime / AI Gaming Character Visual Card */}
            <div className="relative z-10 flex items-center justify-center">
              <div className="relative group">
                {/* Outer Glow Ring */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition duration-500 animate-pulse" />
                
                {/* Character Box Container */}
                <div className="relative w-40 sm:w-48 h-36 sm:h-40 rounded-2xl bg-ink-950 border border-primary-500/50 p-3 flex flex-col items-center justify-center text-center overflow-hidden shadow-2xl">
                  
                  {/* Floating Controller / Gaming Headset Icon representation */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-500 p-0.5 shadow-lg mb-2 animate-bounce duration-1000">
                    <div className="w-full h-full bg-ink-950 rounded-[10px] flex items-center justify-center text-primary-400">
                      <Gamepad2 size={32} className="animate-pulse text-primary-300" />
                    </div>
                  </div>

                  <span className="font-display text-xs sm:text-sm font-bold text-white tracking-wider">
                    PRO GAMER
                  </span>
                  <span className="text-[10px] text-success-400 font-medium flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-success-500 animate-ping inline-block" /> Ready to Trade
                  </span>

                </div>
              </div>
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
            <p className="mt-3 text-ink-400">No listings available right now.</p>
            <Link to="/sell" className="btn-primary mt-4 inline-flex">Sell an ID</Link>
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
