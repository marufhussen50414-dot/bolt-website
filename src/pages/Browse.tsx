import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Package, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Category, GameListing } from "../lib/types";
import ListingCard, { ListingCardSkeleton } from "../components/ListingCard";
import { classNames } from "../lib/utils";

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const minPrice = params.get("min") ?? "";
  const maxPrice = params.get("max") ?? "";
  const minLevel = params.get("level") ?? "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<GameListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(search);

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCategories((data as Category[]) ?? []));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from("game_listings")
        .select("*, seller:profiles(*), category:categories(*)")
        .in("status", ["approved", "active"])
        .order("created_at", { ascending: false });
      if (search) query = query.or(`title.ilike.%${search}%,game_name.ilike.%${search}%,description.ilike.%${search}%`);
      if (category) { const cat = categories.find((c) => c.slug === category); if (cat) query = query.eq("category_id", cat.id); }
      if (minPrice) query = query.gte("price", parseFloat(minPrice));
      if (maxPrice) query = query.lte("price", parseFloat(maxPrice));
      if (minLevel) query = query.gte("account_level", parseInt(minLevel));
      const { data } = await query;
      setResults((data as GameListing[]) ?? []);
      setLoading(false);
    })();
  }, [search, category, minPrice, maxPrice, minLevel, categories]);

  const updateParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next);
  };

  const activeFilters = [category, minPrice, maxPrice, minLevel].filter(Boolean).length;

  const heading = useMemo(() => {
    if (category) { const c = categories.find((x) => x.slug === category); return c?.name ?? "Browse"; }
    return "All Listings";
  }, [category, categories]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-white md:text-3xl">{heading}</h1>
        <p className="mt-1 text-sm text-ink-400">{results.length} listing{results.length === 1 ? "" : "s"}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Filters */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card p-4">
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") updateParam("q", q); }} placeholder="Search…" className="input pl-9" />
            </div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500">Game</h3>
            <div className="space-y-1">
              <button onClick={() => updateParam("category", "")} className={classNames("w-full rounded-lg px-3 py-2 text-left text-sm transition-colors", !category ? "bg-primary-500/15 font-semibold text-primary-300" : "text-ink-400 hover:bg-ink-800 hover:text-white")}>All Games</button>
              {categories.map((c) => (
                <button key={c.id} onClick={() => updateParam("category", c.slug)} className={classNames("w-full rounded-lg px-3 py-2 text-left text-sm transition-colors", category === c.slug ? "bg-primary-500/15 font-semibold text-primary-300" : "text-ink-400 hover:bg-ink-800 hover:text-white")}>{c.name}</button>
              ))}
            </div>
            <h3 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-ink-500">Price (৳)</h3>
            <div className="flex gap-2">
              <input value={minPrice} onChange={(e) => updateParam("min", e.target.value)} type="number" placeholder="Min" className="input" />
              <input value={maxPrice} onChange={(e) => updateParam("max", e.target.value)} type="number" placeholder="Max" className="input" />
            </div>
            <h3 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-ink-500">Min Level</h3>
            <input value={minLevel} onChange={(e) => updateParam("level", e.target.value)} type="number" placeholder="Any" className="input" />
            {activeFilters > 0 && (
              <button onClick={() => { ["category", "min", "max", "level", "q"].forEach((k) => updateParam(k, "")); setQ(""); }} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-error-400 hover:text-error-300"><X size={14} /> Clear all</button>
            )}
          </div>
        </aside>

        {/* Results */}
        <div>
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <Package size={40} className="mx-auto text-ink-600" />
              <p className="mt-3 text-ink-400">No listings found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
