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

        {/* Objects that fly toward the viewer, then recede — smooth repeating loop */}
        <div className="relative h-full mx-auto max-w-7xl flex items-center justify-center gap-8 sm:gap-14">
          <div className="animate-flyby [animation-delay:0s]">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-400 p-0.5 shadow-glow">
              <div className="w-full h-full rounded-[14px] bg-ink-950 flex items-center justify-center">
                <Gamepad2 size={20} className="text-primary-400" />
              </div>
            </div>
          </div>
          <div className="animate-flyby [animation-delay:1.2s]">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-accent-600 to-accent-400 p-0.5 shadow-glow">
              <div className="w-full h-full rounded-[16px] bg-ink-950 flex items-center justify-center">
                <ShieldCheck size={24} className="text-accent-400" />
              </div>
            </div>
          </div>
          <div className="animate-flyby [animation-delay:2.4s]">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-success-600 to-success-400 p-0.5 shadow-glow">
              <div className="w-full h-full rounded-[12px] bg-ink-950 flex items-center justify-center">
                <Zap size={18} className="text-success-400" />
              </div>
            </div>
          </div>
          <div className="animate-flyby [animation-delay:3.6s] hidden sm:block">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-500 to-accent-500 p-0.5 shadow-glow">
              <div className="w-full h-full rounded-[14px] bg-ink-950 flex items-center justify-center">
                <Sword size={20} className="text-primary-300" />
              </div>
            </div>
          </div>
          <div className="animate-flyby [animation-delay:4.8s] hidden sm:block">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-accent-500 to-success-500 p-0.5 shadow-glow">
              <div className="w-full h-full rounded-[12px] bg-ink-950 flex items-center justify-center">
                <Crosshair size={16} className="text-accent-300" />
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
