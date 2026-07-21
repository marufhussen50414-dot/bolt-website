import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Upload, X, Check } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Category } from "../lib/types";
import { classNames } from "../lib/utils";

interface FormState {
  category_id: string;
  title: string;
  description: string;
  price: string;
  account_level: string;
  prime: string;
  evo_max_count: string;
  account_id_display: string;
  server_region: string;
}

const EMPTY: FormState = {
  category_id: "",
  title: "",
  description: "",
  price: "",
  account_level: "",
  prime: "",
  evo_max_count: "",
  account_id_display: "",
  server_region: "",
};

export default function Sell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => {
      setCategories((data as Category[]) ?? []);
    });
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === form.category_id) ?? null,
    [categories, form.category_id],
  );
  const isFreeFire = selectedCategory?.slug === "free-fire";

  const update = (key: keyof FormState, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...list].slice(0, 6));
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) {
      navigate("/login");
      return;
    }
    if (!form.category_id || !form.title || !form.price) {
      setError("Please fill in game, title and price.");
      return;
    }
    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Enter a valid price.");
      return;
    }

    // Prime validation for Free Fire
    let primeVal: number | null = null;
    if (isFreeFire && form.prime !== "") {
      primeVal = parseInt(form.prime);
      if (isNaN(primeVal) || primeVal < 0 || primeVal > 8) {
        setError("Prime must be between 0 and 8.");
        return;
      }
    }

    let evoVal: number | null = null;
    if (isFreeFire && form.evo_max_count !== "") {
      evoVal = parseInt(form.evo_max_count);
      if (isNaN(evoVal) || evoVal < 0) {
        setError("Evo Max Count must be 0 or more.");
        return;
      }
    }

    let levelVal: number | null = null;
    if (form.account_level !== "") {
      levelVal = parseInt(form.account_level);
      if (isNaN(levelVal) || levelVal < 0) {
        setError("Account level must be 0 or more.");
        return;
      }
    }

    setSubmitting(true);

    // upload images
    const imageUrls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("listings").upload(path, file, { upsert: false });
      if (upErr) {
        console.warn("upload failed", upErr.message);
        continue;
      }
      const { data: pub } = supabase.storage.from("listings").getPublicUrl(path);
      if (pub.publicUrl) imageUrls.push(pub.publicUrl);
    }

    const gameName = selectedCategory?.name ?? "Others";

    const { data, error: insErr } = await supabase
      .from("game_listings")
      .insert({
        seller_id: user.id,
        category_id: form.category_id,
        game_name: gameName,
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: priceNum,
        account_level: levelVal,
        prime: primeVal,
        evo_max_count: evoVal,
        account_id_display: form.account_id_display.trim() || null,
        server_region: form.server_region.trim() || null,
        images: imageUrls.length ? imageUrls : null,
        status: "active",
      })
      .select("id")
      .single();

    setSubmitting(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    navigate(`/listing/${(data as { id: string }).id}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="font-display text-3xl font-extrabold text-white">Sell an account</h1>
      <p className="mt-1 text-ink-400">List your gaming account for sale. Fields marked * are required.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <div className="rounded-lg border border-error-500/40 bg-error-500/10 px-4 py-3 text-sm text-error-300">
            {error}
          </div>
        )}

        <div>
          <label className="label">Game *</label>
          <select
            value={form.category_id}
            onChange={(e) => update("category_id", e.target.value)}
            className="input"
          >
            <option value="">Select a game</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Title *</label>
          <input value={form.title} onChange={(e) => update("title", e.target.value)} className="input" placeholder="e.g. Free Fire Heroic Account - Lv 75" />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} className="input resize-none" placeholder="Describe the account: skins, characters, bind status, etc." />
        </div>

        <div>
          <label className="label">Price (BDT) *</label>
          <input type="number" min={1} value={form.price} onChange={(e) => update("price", e.target.value)} className="input" placeholder="e.g. 1500" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Account Level</label>
            <input type="number" min={0} value={form.account_level} onChange={(e) => update("account_level", e.target.value)} className="input" placeholder="e.g. 75" />
          </div>
          <div>
            <label className="label">Account ID (display)</label>
            <input value={form.account_id_display} onChange={(e) => update("account_id_display", e.target.value)} className="input" placeholder="last 4 digits ok" />
          </div>
        </div>

        {/* Special tags / highlights — Free Fire specific */}
        {isFreeFire && (
          <div className="rounded-xl border border-ink-800 bg-ink-900/60 p-4">
            <p className="text-sm font-semibold text-white mb-3">Special highlights</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Prime level (0-8)</label>
                <input type="number" min={0} max={8} value={form.prime} onChange={(e) => update("prime", e.target.value)} className="input" placeholder="e.g. 5" />
              </div>
              <div>
                <label className="label">Evo Max Count</label>
                <input type="number" min={0} value={form.evo_max_count} onChange={(e) => update("evo_max_count", e.target.value)} className="input" placeholder="e.g. 3" />
              </div>
            </div>
            <p className="mt-3 text-xs text-ink-500">These appear as pill-shaped highlight tags on your listing card and detail page.</p>
          </div>
        )}

        <div>
          <label className="label">Server / Region</label>
          <input value={form.server_region} onChange={(e) => update("server_region", e.target.value)} className="input" placeholder="e.g. BD / Asia" />
        </div>

        {/* Images */}
        <div>
          <label className="label">Images (up to 6)</label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-700 bg-ink-900/60 px-4 py-8 text-center transition hover:border-primary-500 hover:bg-ink-800/60">
            <Upload className="text-ink-500" size={28} />
            <p className="mt-2 text-sm text-ink-300">Click to upload screenshots</p>
            <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
          </label>
          {files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {files.map((f, i) => (
                <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-ink-700">
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink-950/80 text-white hover:bg-error-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Publish listing
          </button>
          <button type="button" onClick={() => navigate("/")} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
