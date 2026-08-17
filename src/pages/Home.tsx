import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Flame, Crosshair, Target, Shield, Sword, Zap, Gamepad2, ArrowRight, ShieldCheck, CreditCard, TrendingUp, Package, Users, Star } from "lucide-react";
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
      {/* CUTE ANIMATED CARTOON GAMER CHARACTER BANNER */}
      <section className="relative overflow-hidden bg-ink-950 border-b border-ink-800 py-4 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-950/40 via-ink-950 to-accent-950/40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-32 bg-primary-500/15 rounded-full blur-2xl animate-pulse" />
        
        <div className="relative mx-auto max-w-7xl flex items-center justify-center">
          <div className="w-full max-w-2xl h-32 sm:h-40 rounded-2xl bg-gradient-to-r from-ink-900/90 via-ink-900 to-ink-900/90 border border-primary-500/30 flex items-center justify-between shadow-2xl overflow-hidden px-6">
            
            {/* Left Side: Floating Cute Controller */}
            <div className="animate-bounce duration-1000 hidden sm:block">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-500 p-0.5 shadow-lg shadow-primary-500/40 flex items-center justify-center text-white">
                <Gamepad2 size={32} className="animate-pulse" />
              </div>
            </div>

            {/* Center: Cute Cartoon/Animated Gamer Character Avatar */}
            <div className="flex items-center gap-4 mx-auto sm:mx-0">
              <div className="relative animate-bounce duration-1000">
                {/* Character Head/Helmet SVG Illustration */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-primary-500 via-accent-500 to-primary-400 p-1 shadow-xl shadow-primary-500/30">
                  <div className="w-full h-full bg-ink-950 rounded-full flex flex-col items-center justify-center overflow-hidden relative group">
                    {/* Glowing VR/Gaming Visor Eyes */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary-500/20 to-transparent" />
                    <div className="flex items-center gap-2 z-10">
                      <div className="w-4 h-2.5 bg-primary-400 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]" />
                      <div className="w-4 h-2.5 bg-primary-400 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]" />
                    </div>
                    {/* Cute Smile / Headphone band */}
                    <div className="w-8 h-1 bg-accent-400 rounded-full mt-2 z-10 shadow-[0_0_6px_#f43f5e]" />
                    <div className="absolute -top-1 w-12 h-4 bg-primary-600 rounded-full border border-primary-400/50" />
                  </div>
                </div>
                {/* Floating Online Badge */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-success-500 rounded-full border-2 border-ink-950 animate-ping" />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-success-500 rounded-full border-2 border-ink-950" />
              </div>

              {/* Animated Gamer Tag / Status */}
              <div className="space-y-1 text-left">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary-500/20 border border-primary-500/40 text-primary-300 text-[10px] font-bold tracking-widest uppercase animate-pulse">
                  PRO GAMER
                </span>
                <div className="flex items-center gap-1.5 text-white font-display font-extrabold text-sm sm:text-lg tracking-wide">
                  <span>GAMEHAAT</span>
                  <span className="text-primary-400">BADSHAH</span>
                </div>
                <p className="text-[10px] sm:text-xs text-ink-400">Active & Ready to Trade</p>
              </div>
            </div>

            {/* Right Side: Floating Cute Shield */}
            <div className="animate-bounce duration-1000 delay-500 hidden sm:block">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent-500 to-primary-600 p-0.5 shadow-lg shadow-accent-500/40 flex items-center justify-center text-white">
                <ShieldCheck size={32} className="animate-pulse text-accent-400" />
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
