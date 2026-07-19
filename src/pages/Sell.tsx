import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Loader2, AlertCircle, CheckCircle2, Flame, Crosshair, Target, Shield, Sword, Zap, Gamepad2, UploadCloud, X, ImageIcon } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Category } from "../lib/types";
import { classNames, IconType } from "../lib/utils";

const iconMap: Record<string, IconType> = { flame: Flame, crosshair: Crosshair, target: Target, shield: Shield, sword: Sword, zap: Zap, gamepad: Gamepad2 };

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 8;

type UploadedImage = { url: string; path: string };

export default function Sell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ category_id: "", title: "", description: "", price: "", account_level: "", rank_tier: "", server_region: "" });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCategories((data as Category[]) ?? [])); }, []);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  function update(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  function validateAndAdd(files: FileList | File[]) {
    setError("");
    const incoming = Array.from(files);
    const valid: File[] = [];
    for (const f of incoming) {
      if (!ACCEPTED.includes(f.type)) { setError(`"${f.name}" is not a supported image type. Use JPG, PNG, WebP, or GIF.`); continue; }
      if (f.size > MAX_SIZE) { setError(`"${f.name}" is larger than 5MB.`); continue; }
      valid.push(f);
    }
    if (valid.length === 0) return;
    setImages((prev) => {
      const next = [...prev, ...valid];
      if (next.length > MAX_FILES) { setError(`You can upload at most ${MAX_FILES} images.`); return next.slice(0, MAX_FILES); }
      return next;
    });
    setPreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))].slice(0, MAX_FILES));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files?.length) validateAndAdd(e.dataTransfer.files);
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[i]);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    setImages((prev) => { const n = [...prev]; [n[from], n[to]] = [n[to], n[from]]; return n; });
    setPreviews((prev) => { const n = [...prev]; [n[from], n[to]] = [n[to], n[from]]; return n; });
  }

  async function uploadAll(userId: string): Promise<UploadedImage[] | null> {
    if (images.length === 0) return [];
    setUploading(true);
    const out: UploadedImage[] = [];
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("listings").upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) { setError(`Upload failed for "${file.name}": ${upErr.message}`); setUploading(false); return null; }
      const { data: pub } = supabase.storage.from("listings").getPublicUrl(path);
      out.push({ url: pub.publicUrl, path });
    }
    setUploading(false);
    return out;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError("");
    if (!user) { setError("Please log in to create a listing."); return; }
    const price = parseFloat(form.price); if (!price || price <= 0) { setError("Enter a valid price."); return; }
    setLoading(true);
    const uploaded = await uploadAll(user.id);
    if (!uploaded) { setLoading(false); return; }
    const imageUrls = uploaded.map((u) => u.url); // first = thumbnail
    const { data, error: insErr } = await supabase.from("game_listings").insert({
      seller_id: user.id, category_id: form.category_id || null,
      game_name: categories.find((c) => c.id === form.category_id)?.name ?? "Others",
      title: form.title, description: form.description || null, price,
      account_level: form.account_level ? parseInt(form.account_level) : null,
      rank_tier: form.rank_tier || null, server_region: form.server_region || null,
      images: imageUrls.length ? imageUrls : null, status: "pending",
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

          <div>
            <label className="label">Listing Images</label>
            <p className="text-xs text-ink-400 mb-2">Upload up to {MAX_FILES} images (JPG, PNG, WebP, GIF — max 5MB each). The first image is your thumbnail.</p>
            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={classNames(
                "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
                dragOver ? "border-primary-500 bg-primary-500/10" : "border-ink-700 bg-ink-900 hover:border-primary-500/50 hover:bg-ink-800"
              )}
            >
              <UploadCloud size={28} className="text-primary-400" />
              <span className="text-sm font-semibold text-white">Click to upload or drag & drop</span>
              <span className="text-xs text-ink-400">Select multiple images from your device</span>
              <input type="file" accept={ACCEPTED.join(",")} multiple className="hidden" onChange={(e) => e.target.files && validateAndAdd(e.target.files)} />
            </label>

            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                {previews.map((src, i) => (
                  <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-ink-700 bg-ink-900">
                    <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                    {i === 0 && <span className="absolute top-1 left-1 badge bg-primary-600 text-white text-[10px] px-1.5 py-0.5">Thumbnail</span>}
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white hover:bg-error-500 transition-colors" aria-label="Remove image"><X size={14} /></button>
                    <div className="absolute bottom-0 inset-x-0 flex justify-between bg-black/70 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => moveImage(i, i - 1)} disabled={i === 0} className="text-xs text-white disabled:opacity-30 px-1">◀</button>
                      <button type="button" onClick={() => moveImage(i, i + 1)} disabled={i === previews.length - 1} className="text-xs text-white disabled:opacity-30 px-1">▶</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {previews.length === 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-ink-500"><ImageIcon size={14} /> No images selected yet.</div>
            )}
          </div>

          <div className="rounded-xl bg-primary-500/10 border border-primary-500/20 p-3 text-xs text-primary-300">You receive 98% of the sale price. Only 2% commission. Example: sell for ৳1000 → you get ৳980.</div>
          <button type="submit" disabled={loading || uploading} className="btn-primary w-full">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Tag size={18} />}
            {uploading ? "Uploading images..." : loading ? "Creating..." : "Create Listing"}
          </button>
        </form>
      )}
    </div>
  );
}
