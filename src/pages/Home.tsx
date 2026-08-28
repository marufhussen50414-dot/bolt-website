import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Flame, Crosshair, Target, Shield, Sword, Zap, Gamepad2, ArrowRight, ShieldCheck, CreditCard, TrendingUp, Package, Users, Star } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Category, GameListing } from "../lib/types";
import ListingCard, { ListingCardSkeleton } from "../components/ListingCard";
import Footer from "../components/Footer";
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
      {/* Animated Hero Banner */}
      <section className="relative overflow-hidden bg-ink-950 border-b border-ink-800">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-ink-950 to-accent-950/40 bg-[length:200%_200%] animate-gradient-shift" />

        {/* Faint grid overlay, fading toward the edges */}
        <div className="absolute inset-0 bg-grid-pattern bg-[size:28px_28px] opacity-[0.12] [mask-image:radial-gradient(ellipse_65%_65%_at_50%_50%,black,transparent)]" />

        {/* Floating blurred orbs */}
        <div className="absolute -top-12 left-[18%] w-40 h-40 bg-primary-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-14 right-[20%] w-48 h-48 bg-accent-500/20 rounded-full blur-3xl animate-float [animation-delay:1.5s]" />
        <div className="absolute top-1/3 left-[6%] w-28 h-28 bg-success-500/15 rounded-full blur-3xl animate-drift" />

        {/* Drifting game icons */}
        <div className="absolute inset-0 pointer-events-none hidden sm:block">
          <Gamepad2 className="absolute top-6 left-[14%] text-primary-400/25 animate-drift" size={26} />
          <ShieldCheck className="absolute bottom-8 left-[34%] text-success-400/25 animate-float [animation-delay:0.8s]" size={22} />
          <Zap className="absolute top-8 right-[22%] text-accent-400/30 animate-drift [animation-delay:2s]" size={22} />
          <Sword className="absolute bottom-6 right-[10%] text-primary-300/25 animate-float [animation-delay:1.2s]" size={24} />
          <Crosshair className="absolute top-1/2 right-[36%] text-accent-300/20 animate-drift [animation-delay:0.4s]" size={18} />
        </div>

        {/* Shimmer sweep */}
        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14 flex flex-col items-center text-center">
          {/* Orbit ring with center logo */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary-500/30 animate-[spin_12s_linear_infinite]" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-primary-600 via-accent-500 to-primary-500 p-0.5 shadow-glow animate-pulse-glow">
              <div className="w-full h-full rounded-full bg-ink-950 flex items-center justify-center">
                <ShieldCheck size={32} className="text-primary-400" />
              </div>
            </div>
            <div className="absolute inset-0 animate-orbit">
              <div className="w-3 h-3 rounded-full bg-accent-400 shadow-glow absolute top-0 left-1/2 -translate-x-1/2" />
            </div>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-primary-300 via-white to-accent-300 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
            Buy &amp; Sell Game IDs, Safely
          </h1>
          <p className="mt-2 text-sm sm:text-base text-ink-400 max-w-lg">
            Bangladesh&apos;s trusted marketplace for gaming &amp; social media accounts
          </p>
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

      {/* Footer - Only visible on Home page */}
      <Footer />
    </div>
  );
}
