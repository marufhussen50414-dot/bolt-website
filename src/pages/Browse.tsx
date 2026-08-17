import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, Flame, Crosshair, Target, Shield, Sword, Zap, Gamepad2, Package, ShieldCheck, Star, TrendingUp, DollarSign, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Category, GameListing } from "../lib/types";
import ListingCard, { ListingCardSkeleton, EmptyState } from "../components/ListingCard";
import { classNames, IconType } from "../lib/utils";

const iconMap: Record<string, IconType> = { flame: Flame, crosshair: Crosshair, target: Target, shield: Shield, sword: Sword, zap: Zap, gamepad: Gamepad2 };
type SortKey = "all" | "newest" | "price_low" | "price_high" | "popular";
type QuickFilter = "all" | "verified" | "deals";

const sortOptions: { value: SortKey; label: string; icon: IconType }[] = [
  { value: "all", label: "All", icon: Package },
  { value: "newest", label: "Newest", icon: Sparkles },
  { value: "price_low", label: "Price ↑", icon: DollarSign },
  { value: "price_high", label: "Price ↓", icon: TrendingUp },
  { value: "popular", label: "Popular", icon: Star },
];

const quickFilters: { value: QuickFilter; label: string; icon: IconType }[] = [
  { value: "all", label: "All", icon: Package },
  { value: "verified", label: "Verified Sellers", icon: ShieldCheck },
  { value: "deals", label: "Under ৳5000", icon: DollarSign },
];

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<GameListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const search = params.get("q") ?? ""; const category = params.get("category") ?? "";
  const sort = (params.get("sort") as SortKey) ?? "all";
  const minPrice = params.get("min") ?? ""; const maxPrice = params.get("max") ?? "";

  useEffect(() => { supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCategories((data as Category[]) ?? [])); }, []);
  useEffect(() => {
    setLoading(true);
    (async () => {
      let query = supabase.from("game_listings").select("*, seller:profiles(*), category:categories(*)").in("status", ["approved", "active"]);
      if (search) query = query.or(`title.ilike.%${search}%,game_name.ilike.%${search}%,description.ilike.%${search}%`);
      if (category) { const cat = categories.find((c) => c.slug === category); if (cat) query = query.eq("category_id", cat.id); }
      if (minPrice) query = query.gte("price", parseFloat(minPrice));
      if (maxPrice) query = query.lte("price", parseFloat(maxPrice));
      
      if (sort === "price_low") query = query.order("price", { ascending: true });
      else if (sort === "price_high") query = query.order("price", { ascending: false });
      else if (sort === "popular") query = query.order("view_count", { ascending: false });
      else if (sort === "newest") query = query.order("created_at", { ascending: false });
      
      const { data } = await query.limit(60);
      setListings((data as GameListing[]) ?? []); setLoading(false);
    })();
  }, [search, category, sort, minPrice, maxPrice, categories]);

  const filtered = useMemo(() => {
    let r = listings;
    if (quickFilter === "verified") r = r.filter((l) => l.seller?.is_verified);
    if (quickFilter === "deals") r = r.filter((l) => l.price < 5000);
    return r;
  }, [listings, quickFilter]);

  function updateParam(k: string, v: string) { const next = new URLSearchParams(params); if (v) next.set(k, v); else next.delete(k); setParams(next); }
  const activeServerFilters = [category, minPrice, maxPrice].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full overflow-x-hidden">
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
          <input value={search} onChange={(e) => updateParam("q", e.target.value)} placeholder="Search games or accounts..." className="input pl-10" />
          {search && <button onClick={() => updateParam("q", "")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-white"><X size={16} /></button>}
        </div>
        <button onClick={() => setShowMobileFilters((v) => !v)} className={classNames("btn-secondary relative lg:hidden", activeServerFilters > 0 && "border-primary-500 text-primary-400")}>
          <SlidersHorizontal size={18} /> Filters
          {activeServerFilters > 0 && <span className="absolute -top-2 -right-2 grid place-items-center h-5 w-5 rounded-full bg-primary-500 text-white text-xs font-bold">{activeServerFilters}</span>}
        </button>
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 max-w-full scrollbar-none">
        {quickFilters.map((q) => { const Icon = q.icon; return (
          <button key={q.value} onClick={() => setQuickFilter(q.value)} className={classNames("inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap border", quickFilter === q.value ? "bg-primary-500/15 text-primary-300 border-primary-500/30 shadow-glow" : "bg-ink-900 text-ink-400 border-ink-700 hover:text-white hover:border-ink-600")}>
            <Icon size={14} /> {q.label}
          </button>
        ); })}
      </div>
      <div className="flex items-center gap-2 mb-6 overflow-x-auto max-w-full pb-1 scrollbar-none">
        <div className="flex gap-1 bg-ink-900 rounded-xl p-1 border border-ink-800 shrink-0">
          {sortOptions.map((o) => { const Icon = o.icon; return (
            <button key={o.value} onClick={() => updateParam("sort", o.value === "all" ? "" : o.value)} className={classNames("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all whitespace-nowrap", (sort === o.value || (o.value === "all" && !sort)) ? "bg-primary-500 text-white shadow-glow" : "text-ink-400 hover:text-white")}>
              <Icon size={14} /> {o.label}
            </button>
          ); })}
        </div>
      </div>
      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className={classNames("space-y-5", showMobileFilters ? "block" : "hidden lg:block")}>
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-3">Price Range (৳)</h3>
            <div className="flex items-center gap-2">
              <input type="number" value={minPrice} onChange={(e) => updateParam("min", e.target.value)} placeholder="Min" className="input py-2 text-sm" />
              <span className="text-ink-500">—</span>
              <input type="number" value={maxPrice} onChange={(e) => updateParam("max", e.target.value)} placeholder="Max" className="input py-2 text-sm" />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {[{ label: "< ৳500", min: "", max: "500" }, { label: "৳500-1k", min: "500", max: "1000" }, { label: "৳1k-5k", min: "1000", max: "5000" }, { label: "৳5k+", min: "5000", max: "" }].map((p) => (
                <button key={p.label} onClick={() => { updateParam("min", p.min); updateParam("max", p.max); }} className="rounded-lg bg-ink-800 hover:bg-ink-700 px-2.5 py-1 text-xs font-medium text-ink-300 hover:text-white transition-colors">{p.label}</button>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-3">Category</h3>
            <div className="space-y-1">
              <button onClick={() => updateParam("category", "")} className={classNames("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors", !category ? "bg-primary-500/15 text-primary-300 font-semibold" : "text-ink-400 hover:bg-ink-800 hover:text-white")}>All Categories</button>
              {categories.map((cat) => { const Icon = iconMap[cat.icon ?? "gamepad"] ?? Gamepad2; return (
                <button key={cat.id} onClick={() => updateParam("category", cat.slug)} className={classNames("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2", category === cat.slug ? "bg-primary-500/15 text-primary-300 font-semibold" : "text-ink-400 hover:bg-ink-800 hover:text-white")}>
                  <Icon size={16} /> {cat.name}
                </button>
              ); })}
            </div>
            {(activeServerFilters > 0 || quickFilter !== "all") && <button onClick={() => { ["category", "min", "max"].forEach((k) => updateParam(k, "")); setQuickFilter("all"); }} className="mt-4 w-full text-center text-sm text-error-400 hover:text-error-300 font-medium">Clear all filters</button>}
          </div>
        </aside>
        <div>
          <div className="flex items-center justify-between mb-4"><p className="text-sm text-ink-400">{loading ? "Loading..." : `${filtered.length} accounts found`}</p></div>
          {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">{Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}</div>
          : filtered.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">{filtered.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
          : <EmptyState icon={Package} title="No accounts found" subtitle="Try adjusting your filters or search terms." />}
        </div>
      </div>
    </div>
  );
}
