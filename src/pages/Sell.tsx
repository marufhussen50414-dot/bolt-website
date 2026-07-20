import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, X, Tag, Plus, ImageOff, Check, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Category } from "../lib/types";
import { classNames, buildTags } from "../lib/utils";

const FREE_FIRE_SLUG = "free-fire";
const MAX_IMAGES = 5;
const MAX_TAGS = 6;

export default function Sell() {
  const nav = useNavigate();
  const { session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [accountLevel, setAccountLevel] = useState("");
  const [accountIdDisplay, setAccountIdDisplay] = useState("");
  const [serverRegion, setServerRegion] = useState("");
  const [prime, setPrime] = useState("");
  const [customTags, setCustomTags] = useState<string[]>([""]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => {
      setCategories((data as Category[]) ?? []);
    });
  }, []);

  const selectedCat = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId]
  );
  const isFreeFire = selectedCat?.slug === FREE_FIRE_SLUG;
  const primeNum = prime === "" ? null : Number(prime);
  const primeError = prime !== "" && (isNaN(primeNum as number) || (primeNum as number) < 0 || (primeNum as number) > 8);

  const cleanTags = customTags.map((t) => t.trim()).filter(Boolean);
  const tagsValid = cleanTags.length <= MAX_TAGS;

  const canSubmit =
    !!session &&
    !!categoryId &&
    title.trim().length > 2 &&
    price !== "" && Number(price) > 0 &&
    images.length >= 1 &&
    !primeError &&
    tagsValid &&
    !submitting &&
    !uploading;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!session) return;
    setUploading(true);
    try {
      const next: string[] = [];
      for (const file of Array.from(files).slice(0, MAX_IMAGES - images.length)) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("listings").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("listings").getPublicUrl(path);
        next.push(pub.publicUrl);
      }
      setImages((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
    } catch (e: any) {
      setError(e.message ?? "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!session || !selectedCat) return;
    if (images.length === 0) { setError("Please upload at least one image before submitting."); return; }
    if (primeError) return;

    const levelNum = accountLevel === "" ? null : parseInt(accountLevel, 10);
    const tags = buildTags({
      prime: isFreeFire ? primeNum : null,
      accountLevel: levelNum,
      custom: cleanTags,
    });

    setSubmitting(true);
    const { data, error: insErr } = await supabase
      .from("game_listings")
      .insert({
        seller_id: session.user.id,
        category_id: selectedCat.id,
        game_name: selectedCat.name,
        title: title.trim(),
        description: description.trim() || null,
        price: Number(price),
        account_level: levelNum,
        prime: isFreeFire ? primeNum : null,
        tags: tags.length ? tags : null,
        account_id_display: accountIdDisplay.trim() || null,
        server_region: serverRegion.trim() || null,
        images,
        status: "active",
      })
      .select("id")
      .maybeSingle();

    setSubmitting(false);
    if (insErr) { setError(insErr.message); return; }
    if (data) nav(`/listing/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold text-white">Sell Your Game ID</h1>
      <p className="mt-1 text-sm text-ink-400">List your account for buyers across Bangladesh.</p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        {error && (
          <div className="rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-300">
            {error}
          </div>
        )}

        {/* Game selection */}
        <div>
          <label className="label">Game <span className="text-error-400">*</span></label>
          <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPrime(""); }} className="input cursor-pointer">
            <option value="">Select a game</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Listing Title <span className="text-error-400">*</span></label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Level 75 Free Fire ID" maxLength={80} />
          </div>
          <div>
            <label className="label">Price (৳) <span className="text-error-400">*</span></label>
            <input className="input" type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1500" />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the account, skins, characters, bound status…" maxLength={1200} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Account Level</label>
            <input className="input" type="number" min="0" value={accountLevel} onChange={(e) => setAccountLevel(e.target.value)} placeholder="e.g. 75" />
          </div>
          <div>
            <label className="label">Account ID (display)</label>
            <input className="input" value={accountIdDisplay} onChange={(e) => setAccountIdDisplay(e.target.value)} placeholder="Optional, shown publicly" />
          </div>
        </div>

        {/* Prime — Free Fire only */}
        {isFreeFire && (
          <div className="rounded-xl border border-primary-500/30 bg-primary-500/5 p-4">
            <label className="label">Prime (Free Fire) <span className="text-primary-400">*</span></label>
            <input
              type="number"
              min="0"
              max="8"
              value={prime}
              onChange={(e) => setPrime(e.target.value)}
              placeholder="0 - 8"
              className={classNames("input", primeError && "border-error-500 focus:border-error-500 focus:ring-error-500")}
            />
            {primeError && (
              <p className="mt-1.5 text-xs font-medium text-error-400">Prime must be a number between 0 and 8.</p>
            )}
            <p className="mt-1.5 text-xs text-ink-500">Enter the account's Prime level (0 to 8).</p>
          </div>
        )}

        {/* Special tags / highlights */}
        <div className="rounded-xl border border-ink-700 bg-ink-900/40 p-4">
          <div className="flex items-center gap-2">
            <Tag size={15} className="text-accent-400" />
            <label className="label mb-0">Special Tags / Highlights</label>
          </div>
          <p className="mt-1 mb-3 text-xs text-ink-500">Add highlight tags buyers will see (Prime level, Evo Max count, Level, etc.). Up to {MAX_TAGS}.</p>
          <div className="space-y-2">
            {customTags.map((t, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input"
                  value={t}
                  onChange={(e) => setCustomTags((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={`e.g. ${isFreeFire ? "Evo Max 3" : "High Tier"}`}
                  maxLength={30}
                />
                {customTags.length > 1 && (
                  <button type="button" onClick={() => setCustomTags((prev) => prev.filter((_, j) => j !== i))} className="rounded-lg border border-ink-700 px-3 text-ink-400 hover:border-error-500/50 hover:text-error-400">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {cleanTags.length >= MAX_TAGS ? (
            <p className="mt-2 text-xs text-warning-400">Maximum {MAX_TAGS} tags reached.</p>
          ) : (
            <button type="button" onClick={() => setCustomTags((prev) => [...prev, ""])} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-400 hover:text-primary-300">
              <Plus size={14} /> Add tag
            </button>
          )}
        </div>

        <div>
          <label className="label">Server / Region</label>
          <input className="input" value={serverRegion} onChange={(e) => setServerRegion(e.target.value)} placeholder="e.g. BD / Singapore" />
        </div>

        {/* Images — mandatory */}
        <div>
          <label className="label">Images <span className="text-error-400">*</span></label>
          <label
            className={classNames(
              "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
              images.length > 0 ? "border-success-500/40 bg-success-500/5" : "border-ink-700 hover:border-primary-500/50 hover:bg-ink-800/40"
            )}
          >
            {uploading ? (
              <Loader2 size={26} className="animate-spin text-primary-400" />
            ) : images.length > 0 ? (
              <><Check size={26} className="text-success-400" /><span className="mt-2 text-sm font-semibold text-success-300">{images.length} image{images.length > 1 ? "s" : ""} uploaded — click to add more</span></>
            ) : (
              <><UploadCloud size={26} className="text-ink-500" /><span className="mt-2 text-sm font-semibold text-ink-300">Click to upload screenshots</span><span className="mt-0.5 text-xs text-ink-500">At least 1 image is required · up to {MAX_IMAGES}</span></>
            )}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </label>

          {images.length === 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-warning-400">
              <ImageOff size={13} /> At least one image is required to publish.
            </p>
          )}

          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {images.map((url, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-ink-700">
                  <img src={url} alt={`preview ${i + 1}`} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink-950/80 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={!canSubmit} className="btn-primary">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Publishing…</> : "Publish Listing"}
          </button>
          <button type="button" onClick={() => nav(-1)} className="btn-secondary">Cancel</button>
        </div>
        {!canSubmit && !submitting && (
          <p className="text-xs text-ink-500">Fill the required fields and upload at least one image to publish.</p>
        )}
      </form>
    </div>
  );
}
