import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Crosshair, Target, Shield, Sword, Zap, Gamepad2, ArrowRight, ShieldCheck, CreditCard, TrendingUp, Package, Sparkles, Users, Star } from "lucide-react";
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

  useEffect(() => {
    (async () => {
      const [catRes, recentRes, countRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("game_listings").select("*, seller:profiles(*), category:categories(*)").in("status", ["approved", "active"]).order("created_at", { ascending: false }).limit(8),
        supabase.from("game_listings").select("id", { count: "exact", head: true }).in("status", ["approved", "active"]),
      ]);
      setCategories(catRes.data as Category[] ?? []);
      setRecent((recentRes.data as GameListing[]) ?? []);
      setAvailableCount(countRes.count ?? 0);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      {/* WIDE 2-COLUMN HERO: text left, game categories right */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="absolute inset-0 bg-glow-radial" />
        <div className="absolute inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-30" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-20 w-72 h-72 bg-accent-500/20 rounded-full blur-3xl animate-float" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* LEFT — headline */}
            <div className="animate-slide-up">
              <span className="badge bg-primary-500/10 text-primary-300 border border-primary-500/20 backdrop-blur mb-4">
                <Sparkles size={14} /> Bangladesh's #1 Game ID Marketplace
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] text-white">
                Buy & Sell<br />
                <span className="text-gradient">Game Accounts</span><br />
                Safely
              </h1>
              <p className="mt-4 text-base md:text-lg text-ink-300 leading-relaxed max-w-lg">
                Free Fire, PUBG, Call of Duty and more. Pay with bKash, Nagad, or card. Only 2% commission with full escrow protection.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/browse" className="btn-primary">Browse IDs <ArrowRight size={16} /></Link>
                <Link to="/sell" className="btn-secondary">Sell Your ID</Link>
              </div>
            </div>

            {/* RIGHT — game categories in a compact grid (keeps hero short) */}
            <div className="animate-fade-in">
              <div className="card p-5 bg-ink-900/60">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-sm font-bold text-white uppercase tracking-wide">Popular Games</h2>
                  <Link to="/browse" className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1">All <ArrowRight size={12} /></Link>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {categories.map((cat) => {
                    const Icon = iconMap[cat.icon ?? "gamepad"] ?? Gamepad2;
                    return (
                      <Link key={cat.id} to={`/browse?category=${cat.slug}`} className="group rounded-xl border border-ink-700 bg-ink-800/60 p-3 text-center hover:border-primary-500/40 hover:bg-primary-500/10 transition-all">
                        <div className="inline-grid place-items-center h-10 w-10 rounded-lg bg-primary-500/15 text-primary-400 group-hover:bg-primary-500 group-hover:text-white group-hover:scale-110 transition-all mx-auto">
                          <Icon size={20} />
                        </div>
                        <p className="mt-2 text-[11px] font-semibold text-ink-200 group-hover:text-white line-clamp-1">{cat.name}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Listings */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
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
            <p className="mt-3 text-ink-400">No listings yet. Be the first to sell!</p>
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
