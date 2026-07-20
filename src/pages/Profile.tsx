import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BadgeCheck, ShieldCheck, MapPin, Package } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { GameListing, Profile } from "../lib/types";
import ListingCard from "../components/ListingCard";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<GameListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [p, l] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("game_listings").select("*, category:categories(*)").eq("seller_id", id).in("status", ["approved", "active"]).order("created_at", { ascending: false }),
      ]);
      setProfile((p.data as Profile) ?? null);
      setListings((l.data as GameListing[]) ?? []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="grid min-h-[50vh] place-items-center text-ink-500">Loading…</div>;
  if (!profile) return <div className="grid min-h-[50vh] place-items-center text-ink-500">User not found.</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary-500/20 text-2xl font-extrabold text-primary-300">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="flex items-center gap-2 font-display text-xl font-extrabold text-white">
              {profile.full_name}
              {profile.is_verified && <BadgeCheck size={18} className="text-success-400" />}
            </h1>
            {profile.location && <p className="flex items-center gap-1 text-sm text-ink-400"><MapPin size={13} /> {profile.location}</p>}
            <p className="mt-1 flex items-center gap-1 text-xs text-success-400"><ShieldCheck size={12} /> {Number(profile.trust_score ?? 0).toFixed(0)}% trust · {profile.items_sold ?? profile.total_sales ?? 0} sold</p>
          </div>
        </div>
        {profile.bio && <p className="mt-4 text-sm text-ink-300">{profile.bio}</p>}
      </div>

      <h2 className="mb-3 mt-8 font-display text-lg font-bold text-white">Active Listings</h2>
      {listings.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      ) : (
        <div className="card p-12 text-center"><Package size={36} className="mx-auto text-ink-600" /><p className="mt-3 text-ink-400">No active listings.</p></div>
      )}
      <Link to="/browse" className="mt-6 inline-block text-sm font-semibold text-primary-400 hover:text-primary-300">← Back to Browse</Link>
    </div>
  );
}
