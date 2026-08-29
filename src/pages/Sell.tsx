import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Loader2, AlertCircle, CheckCircle2, Flame, Crosshair, Target, Shield, Gamepad2, Music2, Facebook, Instagram, UploadCloud, X, ImageIcon, Star, GripVertical } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Category } from "../lib/types";
import { classNames, IconType } from "../lib/utils";

const iconMap: Record<string, IconType> = { flame: Flame, crosshair: Crosshair, target: Target, shield: Shield, gamepad: Gamepad2, music2: Music2, facebook: Facebook, instagram: Instagram };

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 8;

type UploadedImage = { url: string; path: string };

function parseCompactNumber(raw: string): number | null {
  const s = raw.trim().toUpperCase();
  if (!s) return null;
  const m = s.match(/^(\d*\.?\d+)\s*([KM]?)$/);
  if (!m) return null;
  const num = parseFloat(m[1]);
  if (isNaN(num)) return null;
  const mult = m[2] === "K" ? 1_000 : m[2] === "M" ? 1_000_000 : 1;
  return Math.round(num * mult);
}

export default function Sell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ category_id: "", other_type: "" as "" | "game" | "social", title: "", description: "", price: "", account_level: "", prime: "", server_region: "Bangladesh", game_name: "", follower_count: "", total_likes: "" });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => { supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCategories((data as Category[]) ?? [])); }, []);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const selectedCategory = categories.find((c) => c.id === form.category_id);
  const isFreeFire = selectedCategory?.slug === "free-fire";
  const isOthers = selectedCategory?.slug === "others";
  const isOthersGame = isOthers && form.other_type === "game";
  const isOthersSocial = isOthers && form.other_type === "social";
  const isSocial = ["tiktok", "facebook", "instagram"].includes(selectedCategory?.slug ?? "") || isOthersSocial;
  const readyForDetails = !!selectedCategory && (!isOthers || !!form.other_type);
  const primeNum = form.prime === "" ? null : parseInt(form.prime);
  const primeInvalid = primeNum !== null && (isNaN(primeNum) || primeNum < 0 || primeNum > 8);

  function update(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  function addTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  }
  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

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
    setImageError(false);
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

  function reorderImage(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= images.length || to >= images.length) return;
    setImages((prev) => { const n = [...prev]; const [item] = n.splice(from, 1); n.splice(to, 0, item); return n; });
    setPreviews((prev) => { const n = [...prev]; const [item] = n.splice(from, 1); n.splice(to, 0, item); return n; });
  }
  function setThumbnail(i: number) { reorderImage(i, 0); }

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
    if (images.length === 0) { setImageError(true); setError("Please upload at least one image."); return; }
    if (isOthers && !form.other_type) { setError("Select whether this is a Game or a Social Media account."); return; }
    if (isOthers && !form.game_name.trim()) { setError(isOthersSocial ? "Enter the platform name for your custom listing." : "Enter the game name for your custom listing."); return; }
    if (isFreeFire && primeInvalid) { setError("Prime must be between 0 and 8."); return; }
    setLoading(true);
    const uploaded = await uploadAll(user.id);
    if (!uploaded) { setLoading(false); return; }
    const imageUrls = uploaded.map((u) => u.url); // first = thumbnail
    const { data, error: insErr } = await supabase.from("game_listings").insert({
      seller_id: user.id, category_id: form.category_id || null,
      game_name: isOthers ? form.game_name.trim() : (categories.find((c) => c.id === form.category_id)?.name ?? "Others"),
      title: form.title, description: form.description || null, price,
      account_level: !isOthers && !isSocial && form.account_level ? parseInt(form.account_level) : null,
      follower_count: isSocial ? parseCompactNumber(form.follower_count) : null,
      total_likes: isSocial ? parseCompactNumber(form.total_likes) : null,
      prime: isFreeFire && form.prime !== "" && !isNaN(parseInt(form.prime)) ? parseInt(form.prime) : null,
      server_region: !isOthers && !isSocial ? "Bangladesh" : null,
      images: imageUrls.length ? imageUrls : null, tags: tags.length > 0 ? tags : null, status: "active",
    }).select().single();
    setLoading(false);
    if (insErr) { setError(insErr.message); return; }
    setSuccess(true); setTimeout(() => navigate(`/listing/${data.id}`), 1200);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10 pb-12">
      <div className="mb-6"><h1 className="font-display text-3xl font-extrabold text-white">Sell a Game ID</h1></div>
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
                <button type="button" key={c.id} onClick={() => setForm((f) => ({ ...f, category_id: c.id, other_type: c.slug === "others" ? f.other_type : "" }))} className={classNames("rounded-xl border-2 px-2 py-3 text-xs font-semibold transition-all flex flex-col items-center gap-1.5", form.category_id === c.id ? "border-primary-500 bg-primary-500/10 text-primary-300" : "border-ink-700 bg-ink-900 text-ink-400 hover:bg-ink-800")}>
                  <Icon size={18} /> {c.name}
                </button>
              ); })}
            </div>
          </div>
          {isOthers && (
            <div>
              <label className="label">Is this a Game or a Social Media account?</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => update("other_type", "game")} className={classNames("rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all", form.other_type === "game" ? "border-primary-500 bg-primary-500/10 text-primary-300" : "border-ink-700 bg-ink-900 text-ink-400 hover:bg-ink-800")}>Game</button>
                <button type="button" onClick={() => update("other_type", "social")} className={classNames("rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all", form.other_type === "social" ? "border-primary-500 bg-primary-500/10 text-primary-300" : "border-ink-700 bg-ink-900 text-ink-400 hover:bg-ink-800")}>Social Media</button>
              </div>
            </div>
          )}
          {readyForDetails && (
            <>
              {(isOthersGame || isOthersSocial) && (
                <div><label className="label">{isOthersSocial ? "Platform Name" : "Game Name"}</label><input required value={form.game_name} onChange={(e) => update("game_name", e.target.value)} className="input" placeholder={isOthersSocial ? "Platform Name" : "Game Name"} /></div>
              )}
              <div><label className="label">Listing Title</label><input required value={form.title} onChange={(e) => update("title", e.target.value)} className="input" placeholder="Title" /></div>
              <div><label className="label">Description</label><textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} className="input" placeholder={isSocial ? "Describe the account — niche, content type, engagement, etc." : "Describe the account — skins, characters, diamonds, binds, etc."} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Price (৳)</label><input type="number" required value={form.price} onChange={(e) => update("price", e.target.value)} className="input" /></div>
                {!isOthers && !isSocial && (
                  <div><label className="label">Account Level</label><input type="number" value={form.account_level} onChange={(e) => update("account_level", e.target.value)} className="input" /></div>
                )}
                {isFreeFire && (
                  <div>
                    <label className="label">Prime</label>
                    <input type="number" min={0} max={8} value={form.prime} onChange={(e) => update("prime", e.target.value)} className={classNames("input", primeInvalid && "border-error-500")} placeholder="0-8" />
                    {primeInvalid && <p className="mt-1 text-xs text-error-400">Prime must be between 0 and 8.</p>}
                  </div>
                )}
                {!isOthers && !isSocial && (
                  <div>
                    <label className="label">Server / Region</label>
                    <select value={form.server_region} onChange={(e) => update("server_region", e.target.value)} className="input">
                      <option value="Bangladesh">Bangladesh</option>
                    </select>
                  </div>
                )}
                {isSocial && (
                  <>
                    <div><label className="label">Followers</label><input type="text" inputMode="decimal" value={form.follower_count} onChange={(e) => update("follower_count", e.target.value)} className="input" placeholder="" /></div>
                    <div><label className="label">Total Likes</label><input type="text" inputMode="decimal" value={form.total_likes} onChange={(e) => update("total_likes", e.target.value)} className="input" placeholder="" /></div>
                  </>
                )}
              </div>

              <div>
                <label className="label">Tags</label>
                <p className="text-xs text-ink-400 mb-2">Add keywords to help buyers find your listing. Press Enter or click Add.</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder=""
                    className="input"
                  />
                  <button type="button" onClick={addTag} className="shrink-0 rounded-xl border-2 border-ink-700 bg-ink-900 px-4 py-2 text-sm font-semibold text-ink-300 hover:border-primary-500/50 hover:bg-ink-800 transition-all">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary-500/15 px-3 py-1 text-sm font-medium text-primary-300 ring-1 ring-inset ring-primary-500/25">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-primary-400 hover:text-primary-200" aria-label={`Remove ${tag}`}><X size={14} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Listing Images</label>
                <p className="text-xs text-ink-400 mb-2">Upload up to {MAX_FILES} images (JPG, PNG, WebP, GIF — max 5MB each). Drag to reorder and set your thumbnail.</p>
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={classNames(
                    "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
                    imageError && images.length === 0
                      ? "border-error-500 bg-error-500/5"
                      : dragOver ? "border-primary-500 bg-primary-500/10" : "border-ink-700 bg-ink-900 hover:border-primary-500/50 hover:bg-ink-800"
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
                      <div
                        key={i}
                        draggable
                        onDragStart={() => setDragIndex(i)}
                        onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
                        onDragLeave={() => setDragOverIndex((cur) => cur === i ? null : cur)}
                        onDrop={() => { if (dragIndex !== null) reorderImage(dragIndex, i); setDragIndex(null); setDragOverIndex(null); }}
                        onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                        className={classNames(
                          "group relative aspect-square rounded-xl overflow-hidden border-2 bg-ink-900 transition-all cursor-grab active:cursor-grabbing",
                          dragOverIndex === i ? "border-primary-500 scale-105 ring-2 ring-primary-500/30" : i === 0 ? "border-primary-500/50" : "border-ink-700"
                        )}
                      >
                        <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover pointer-events-none select-none" />
                        {i === 0 ? (
                          <span className="absolute top-1 left-1 badge bg-primary-600 text-white text-[10px] px-1.5 py-0.5 flex items-center gap-1"><Star size={9} className="fill-white" />Thumbnail</span>
                        ) : (
                          <button type="button" onClick={() => setThumbnail(i)} className="absolute top-1 left-1 flex items-center gap-1 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 hover:bg-primary-600 transition-all"><Star size={9} />Set Thumbnail</button>
                        )}
                        <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white hover:bg-error-500 transition-colors" aria-label="Remove image"><X size={14} /></button>
                        <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-1 bg-black/70 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical size={12} className="text-ink-300" />
                          <span className="text-[9px] text-ink-400">Drag to reorder</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {previews.length === 0 && (
                  imageError ? (
                    <div className="mt-3 flex items-center gap-2 text-xs text-error-400"><ImageIcon size={14} /> At least one image is required to create a listing.</div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 text-xs text-ink-500"><ImageIcon size={14} /> No images selected yet.</div>
                  )
                )}
              </div>

              <button type="submit" disabled={loading || uploading} className="btn-primary w-full">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Tag size={18} />}
                {uploading ? "Uploading images..." : loading ? "Creating..." : "Create Listing"}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}
