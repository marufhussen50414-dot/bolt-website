import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { GAME_OPTIONS } from "../lib/types";
import type { NewListing } from "../lib/types";
import Field from "../components/Field";
import ImageUploader from "../components/ImageUploader";

const SUGGESTED_TAGS = [
  "Diamond Rank",
  "Mythic",
  "Full Access",
  "Gmail Linked",
  "High Level",
  "Rare Skins",
  "Evo Max",
  "Premium Account",
];

export default function SellPage() {
  const navigate = useNavigate();

  const [game, setGame] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [prime, setPrime] = useState("");
  const [level, setLevel] = useState("");
  const [evoMaxCount, setEvoMaxCount] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const isFreeFire = game === "Free Fire";
  const primeNum = prime === "" ? null : Number(prime);
  const primeError =
    isFreeFire && prime !== "" && (Number.isNaN(primeNum) || (primeNum !== null && primeNum > 8))
      ? "Prime must be between 0 and 8."
      : null;
  const imageError = attemptedSubmit && imageUrls.length === 0
    ? "At least one image is required to publish your listing."
    : null;

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const t = customTag.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags((prev) => [...prev, t]);
    setCustomTag("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    if (!game || !title.trim() || price === "" || imageUrls.length === 0) {
      setFormError("Please fill in the required fields and upload at least one image.");
      return;
    }
    if (primeError) {
      setFormError(primeError);
      return;
    }
    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setFormError("Enter a valid price.");
      return;
    }

    setFormError(null);
    setSubmitting(true);

    const payload: NewListing = {
      game,
      title: title.trim(),
      description: description.trim() || null,
      price: priceNum,
      prime: isFreeFire ? primeNum : null,
      level: level === "" ? null : Number(level),
      evo_max_count: evoMaxCount === "" ? null : Number(evoMaxCount),
      tags,
      image_urls: imageUrls,
    };

    const { data, error } = await supabase
      .from("listings")
      .insert(payload)
      .select("id")
      .single();

    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }
    navigate(`/listing/${data.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Sell an account
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          List your gaming account for sale. Fields marked with{" "}
          <span className="text-brand-400">*</span> are required.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-2xl border border-ink-800 bg-ink-900/60 p-6 shadow-card sm:p-8"
      >
        {/* Game + Title */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Game" htmlFor="game" error={attemptedSubmit && !game ? "Select a game." : null}>
            <select
              id="game"
              className="input-base"
              value={game}
              onChange={(e) => {
                setGame(e.target.value);
                if (e.target.value !== "Free Fire") setPrime("");
              }}
            >
              <option value="">Select a game…</option>
              {GAME_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Listing title" htmlFor="title" error={attemptedSubmit && !title.trim() ? "Add a title." : null}>
            <input
              id="title"
              type="text"
              className="input-base"
              placeholder="e.g. Maxed Free Fire account — rare bundle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
        </div>

        {/* Price + Prime (Free Fire only) */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (USD)" htmlFor="price" error={attemptedSubmit && price === "" ? "Enter a price." : null}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                $
              </span>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                className="input-base pl-7"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </Field>
          {isFreeFire ? (
            <Field
              label="Prime"
              htmlFor="prime"
              error={primeError}
              hint={!primeError ? "Enter a number from 0 to 8." : undefined}
            >
              <input
                id="prime"
                type="number"
                min="0"
                max="8"
                className={`input-base ${
                  primeError ? "border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/25" : ""
                }`}
                placeholder="0 – 8"
                value={prime}
                onChange={(e) => setPrime(e.target.value)}
              />
            </Field>
          ) : null}
        </div>

        {/* Highlights: Level + Evo Max count */}
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-300">Highlights</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Level" htmlFor="level" hint="Optional — account level.">
              <input
                id="level"
                type="number"
                min="0"
                className="input-base"
                placeholder="e.g. 75"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              />
            </Field>
            <Field label="Evo Max count" htmlFor="evoMax" hint="Optional — number of Evo Max items.">
              <input
                id="evoMax"
                type="number"
                min="0"
                className="input-base"
                placeholder="e.g. 3"
                value={evoMaxCount}
                onChange={(e) => setEvoMaxCount(e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Description */}
        <Field label="Description" htmlFor="description" hint="Tell buyers what makes this account special.">
          <textarea
            id="description"
            rows={4}
            className="input-base resize-none"
            placeholder="Include details like rank progression, skins, bundles, login type…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        {/* Highlight tags */}
        <div>
          <p className="label-base">Special highlight tags</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TAGS.map((t) => {
              const active = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-brand-500 text-ink-950"
                      : "border border-ink-700 bg-ink-850 text-zinc-400 hover:border-ink-600 hover:text-zinc-200"
                  }`}
                >
                  {active ? "✓ " : ""}
                  {t}
                </button>
              );
            })}
            {tags
              .filter((t) => !SUGGESTED_TAGS.includes(t))
              .map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-medium text-ink-950 transition"
                >
                  ✓ {t}
                </button>
              ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              className="input-base flex-1"
              placeholder="Add a custom tag (e.g. Booyah Pass owned)"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomTag();
                }
              }}
            />
            <button type="button" onClick={addCustomTag} className="btn-ghost shrink-0">
              Add tag
            </button>
          </div>
        </div>

        {/* Image upload (mandatory) */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="label-base mb-0">
              Images <span className="text-brand-400">*</span>
            </p>
            {imageUrls.length > 0 && (
              <span className="text-xs text-zinc-500">{imageUrls.length} added</span>
            )}
          </div>
          <ImageUploader value={imageUrls} onChange={setImageUrls} error={imageError} />
        </div>

        {formError && (
          <div className="animate-fade-in rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {formError}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-ink-800 pt-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Publishing…" : "Publish listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
