import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Loader2, AlertCircle, CheckCircle2, Flame, Crosshair, Target, Shield, Sword, Zap, Gamepad2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Category } from "../lib/types";
import { classNames, IconType } from "../lib/utils";

const iconMap: Record<string, IconType> = { flame: Flame, crosshair: Crosshair, target: Target, shield: Shield, sword: Sword, zap: Zap, gamepad: Gamepad2 };

export default function Sell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ category_id: "", title: "", description: "", price: "", account_level: "", rank_tier: "", server_region: "", images: "" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [success, setSuccess] = useState(false);

  useEffect(() => { supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCategories((data as Category[]) ?? [])); }, []);
  function update(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError("");
    if (!user) { setError("Please log in to create a listing."); return; }
    const price = parseFloat(form.price); if (!price || price <= 0) { setError("Enter a valid price."); return; }
    setLoading(true);
    const images = form.images.split(",").map((s) => s.trim()).filter(Boolean);
    const { data, error: insErr } = await supabase.from("game_listings").insert({
      seller_id: user.id, category_id: form.category_id || null,
      game_name: categories.find((c) => c.id === form.category_id)?.name ?? "Others",
      title: form.title, description: form.description || null, price,
      account_level: form.account_level ? parseInt(form.account_level) : null,
      rank_tier: form.rank_tier || null, server_region: form.server_region || null,
      images: images.length ? images : null, status: "pending",
    }).select().single();
    setLoading(false);
    if (insErr) { setError(insErr.message); return; }
    setSuccess(true); setTimeout(() => navigate(`/listing/${data.id}`), 1200);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6"><h1 className="font-display text-3xl font-extrabold text-white">Sell a Game ID</h1><p className="text-ink-400 mt-1">List your account — only 2% commission when it sells</p></div>
      {success ? (
        <div className="card p-8 text-center animate-scale-in">
          <CheckCircle2 size={48} className="mx-auto text-success-400" />
          <h2 className="font-display text-xl font-bold text-white mt-4">Listing Created!</h2>
          <p className="text-sm text-ink-400 mt-1">Redirecting you to your listing...</p>
          <Loader2 size={20} className="animate-spin text-primary-400 mx-auto mt-3" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          {error && <div className="flex items-start gap-2 rounded-xl bg-error-500/10 border border-error-500/20 p-3 text-sm text-error-400"><AlertCircle size={18} className="shrink-0 mt-0.5" /><span>{error}</span></div>}
          <div>
            <label className="label">Game</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {categories.map((c) => { const Icon = iconMap[c.icon ?? "gamepad"] ?? Gamepad2; return (
                <button type="button" key={c.id} onClick={() => update("category_id", c.id)} className={classNames("rounded-xl border-2 px-2 py-3 text-xs font-semibold transition-all flex flex-col items-center gap-1.5", form.category_id === c.id ? "border-primary-500 bg-primary-500/10 text-primary-300" : "border-ink-700 bg-ink-900 text-ink-400 hover:bg-ink-800")}>
                  <Icon size={18} /> {c.name}
                </button>
              ); })}
            </div>
          </div>
          <div><label className="label">Listing Title</label><input required value={form.title} onChange={(e) => update("title", e.target.value)} className="input" placeholder="e.g. Free Fire MAX — Level 70, Heroic Grandmaster" /></div>
          <div><label className="label">Description</label><textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} className="input" placeholder="Describe the account — skins, characters, diamonds, binds, etc." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Price (৳)</label><input type="number" required value={form.price} onChange={(e) => update("price", e.target.value)} className="input" placeholder="1500" /></div>
            <div><label className="label">Account Level</label><input type="number" value={form.account_level} onChange={(e) => update("account_level", e.target.value)} className="input" placeholder="70" /></div>
            <div><label className="label">Rank / Tier</label><input value={form.rank_tier} onChange={(e) => update("rank_tier", e.target.value)} className="input" placeholder="Heroic" /></div>
            <div><label className="label">Server / Region</label><input value={form.server_region} onChange={(e) => update("server_region", e.target.value)} className="input" placeholder="BD/Asia" /></div>
          </div>
          <div><label className="label">Image URLs (comma-separated)</label><input value={form.images} onChange={(e) => update("images", e.target.value)} className="input" placeholder="https://..." /></div>
          <div className="rounded-xl bg-primary-500/10 border border-primary-500/20 p-3 text-xs text-primary-300">You receive 98% of the sale price. Only 2% commission. Example: sell for ৳1000 → you get ৳980.</div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : <Tag size={18} />} Create Listing</button>
        </form>
      )}
    </div>
  );
}
