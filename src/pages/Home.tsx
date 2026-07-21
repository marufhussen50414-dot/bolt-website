import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2, PackageOpen } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { GameListing, Category } from "../lib/types";
import ListingCard from "../components/ListingCard";
import { classNames, categoryIcon } from "../lib/utils";

export default function Home() {
  const [listings, setListings] = useState<GameListing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [query, setQuery] = useState("");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("game_listings")
      .select("*, category:categories(*), seller:profiles!seller_id(id, username, full_name, avatar_url, is_verified)")
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (activeCat !== "all") {
      q = q.eq("category_id", activeCat);
    }
    if (query.trim()) {
      q = q.ilike("title", `%${query.trim()}%`);
    }
    const { data, error } = await q.limit(48);
    if (error) {
      console.warn("fetch listings", error.message);
    }
    setListings((data as GameListing[]) ?? []);
    setLoading(false);
  }, [activeCat, query]);

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => {
      setCategories((data as Category[]) ?? []);
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchListings, 200);
    return () => clearTimeout(t);
  }, [fetchListings]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink-800">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-ink-950 to-ink-950" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary-600/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            Buy & sell gaming accounts <br className="hidden sm:block" />
            <span className="text-primary-400">safely</span>.
          </h1>
          <p className="mt-4 max-w-xl text-ink-300">
            Free Fire, PUBG, CODM and more. Browse verified listings from trusted sellers across Bangladesh.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/sell" className="btn-primary">Sell your account</Link>
            <a href="#listings" className="btn-secondary">Browse listings</a>
          </div>
        </div>
      </section>

      <div id="listings" className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Search + filters */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title..."
              className="input pl-11"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCat("all")}
              className={classNames(
                "rounded-full px-4 py-1.5 text-sm font-medium transition",
                activeCat === "all" ? "bg-primary-600 text-white" : "bg-ink-900 text-ink-300 hover:bg-ink-800",
              )}
            >
              All
            </button>
            {categories.map((c) => {
              const Icon = categoryIcon(c.icon);
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={classNames(
                    "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition",
                    activeCat === c.id ? "bg-primary-600 text-white" : "bg-ink-900 text-ink-300 hover:bg-ink-800",
                  )}
                >
                  <Icon size={14} /> {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-ink-500">
              <PackageOpen size={48} />
              <p className="mt-4 text-lg font-medium">No listings found</p>
              <p className="text-sm">Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
