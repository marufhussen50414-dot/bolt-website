import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Flame, Crosshair, Target, Shield, Gamepad2, Music2, Facebook, Instagram, ArrowRight, ShieldCheck, CreditCard, TrendingUp, Package, Users, Star } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Category, GameListing } from "../lib/types";
import ListingCard, { ListingCardSkeleton } from "../components/ListingCard";
import Footer from "../components/Footer";
import { IconType, classNames } from "../lib/utils";

const iconMap: Record<string, IconType> = {
  flame: Flame, crosshair: Crosshair, target: Target,
  shield: Shield, gamepad: Gamepad2,
  music2: Music2, facebook: Facebook, instagram: Instagram,
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
      <section className="relative overflow-hidden bg-ink-950 border-b border-ink-800 h-28 sm:h-32">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-ink-950 to-accent-950/40 bg-[length:200%_200%] animate-gradient-shift" />

        {/* Faint grid overlay, fading toward the edges */}
        <div className="absolute inset-0 bg-grid-pattern bg-[size:24px_24px] opacity-[0.1] [mask-image:radial-gradient(ellipse_65%_65%_at_50%_50%,black,transparent)]" />

        {/* Floating blurred glow orbs */}
        <div className="absolute -top-10 left-[20%] w-28 h-28 bg-primary-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-10 right-[22%] w-32 h-32 bg-accent-500/20 rounded-full blur-3xl animate-float [animation-delay:1.5s]" />

        {/* Shimmer sweep */}
        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

        {/* A little character that flies in, hovers a while, flies off, waits, then returns — looping */}
        <div className="relative h-full mx-auto max-w-7xl flex items-center justify-center">
          <div className="animate-character-fly">
            <div className="relative">
              {/* motion trail behind the character */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400/40 blur-[2px]" />
                <span className="w-1 h-1 rounded-full bg-accent-400/30 blur-[2px]" />
              </div>

              <svg viewBox="0 0 100 100" className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-[0_0_16px_rgba(21,184,245,0.5)]">
                <defs>
                  <linearGradient id="charBody" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#41d0ff" />
                    <stop offset="100%" stopColor="#ffb01f" />
                  </linearGradient>
                </defs>
                {/* floating blob-character body */}
                <path
                  d="M50 12c19 0 32 14 32 33v20c0 3-2 5-5 5-3 0-4-2-6-2s-3 4-6 4-3-4-6-4-3 4-6 4-3-4-6-4-4 2-6 2c-3 0-5-2-5-5V45c0-19 13-33 32-33z"
                  fill="url(#charBody)"
                />
                {/* eyes */}
                <circle cx="40" cy="46" r="5" fill="#0a0d11" />
                <circle cx="62" cy="46" r="5" fill="#0a0d11" />
                <circle cx="41.5" cy="44.5" r="1.6" fill="#fff" />
                <circle cx="63.5" cy="44.5" r="1.6" fill="#fff" />
                {/* smile */}
                <path d="M44 58c3 3 9 3 12 0" stroke="#0a0d11" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              </svg>
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

      {/* Browse by Category */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white">Browse by Category</h2>
            <p className="text-sm text-ink-400 mt-1">Pick your favorite and start exploring</p>
          </div>
          <Link to="/browse" className="text-sm font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1">View all <ArrowRight size={16} /></Link>
        </div>

        {(() => {
          const socialSlugs = new Set(["tiktok", "facebook", "instagram"]);
          const gameCats = categories.filter((c) => !socialSlugs.has(c.slug));
          const socialCats = categories.filter((c) => socialSlugs.has(c.slug));
          const renderGrid = (list: Category[], accent: string) => (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {list.map((cat) => {
                const Icon = iconMap[cat.icon ?? "gamepad"] ?? Gamepad2;
                return (
                  <Link key={cat.id} to={`/browse?category=${cat.slug}`} className="card-hover p-5 text-center group">
                    <div className={classNames("inline-grid place-items-center h-14 w-14 rounded-2xl mx-auto transition-all group-hover:scale-110 group-hover:text-white", accent)}>
                      <Icon size={26} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">{cat.name}</p>
                  </Link>
                );
              })}
            </div>
          );
          return (
            <div className="space-y-10">
              {gameCats.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-grid place-items-center h-7 w-7 rounded-lg bg-primary-500/15 text-primary-400"><Gamepad2 size={15} /></span>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-ink-300">Games</h3>
                    <span className="h-px flex-1 bg-ink-800" />
                  </div>
                  {renderGrid(gameCats, "bg-primary-500/15 text-primary-400 group-hover:bg-primary-500")}
                </div>
              )}
              {socialCats.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-grid place-items-center h-7 w-7 rounded-lg bg-accent-500/15 text-accent-400"><Users size={15} /></span>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-ink-300">Social Media</h3>
                    <span className="h-px flex-1 bg-ink-800" />
                  </div>
                  {renderGrid(socialCats, "bg-accent-500/15 text-accent-400 group-hover:bg-accent-500")}
                </div>
              )}
            </div>
          );
        })()}
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: ShieldCheck, title: "Secure Escrow", desc: "Your money stays protected until you confirm the account transfer is complete.", color: "text-success-400 bg-success-500/15" },
            { icon: CreditCard, title: "Easy Payments", desc: "Pay with bKash, Nagad, or debit/credit card. All methods supported.", color: "text-primary-400 bg-primary-500/15" },
            { icon: TrendingUp, title: "Only 1% Commission", desc: "Lowest fees in Bangladesh. 99% goes directly to the seller. No hidden charges.", color: "text-accent-400 bg-accent-500/15" },
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
          <div className="text-center"><Star size={28} className="mx-auto text-accent-400" /><p className="font-display text-lg font-bold text-white mt-2">1% Only</p><p className="text-xs text-ink-400">Lowest Fees</p></div>
        </div>
      </section>

      {/* Footer - Only visible on Home page */}
      <Footer />
    </div>
  );
}
