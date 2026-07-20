import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  error?: string | null;
}

export default function ImageUploader({ value, onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setLocalError(null);
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          setLocalError("Only image files are allowed.");
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setLocalError("Each image must be under 5 MB.");
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("listing-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage
          .from("listing-images")
          .getPublicUrl(path);
        newUrls.push(pub.publicUrl);
      }
      if (newUrls.length) onChange([...value, ...newUrls]);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = (url: string) => {
    onChange(value.filter((u) => u !== url));
  };

  const moveImage = (idx: number, dir: -1 | 1) => {
    const next = [...value];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const shownError = error ?? localError;

  return (
    <div>
      <label
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
          shownError
            ? "border-rose-500/50 bg-rose-500/5"
            : "border-ink-700 bg-ink-850 hover:border-brand-500/60 hover:bg-ink-800"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-ink-700 text-brand-300 transition group-hover:bg-brand-500/15">
          {uploading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink-600 border-t-brand-400" />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          )}
        </div>
        <span className="text-sm font-medium text-zinc-200">
          {uploading ? "Uploading…" : "Click to upload images"}
        </span>
        <span className="mt-1 text-xs text-zinc-500">
          PNG, JPG, WebP up to 5 MB. At least one image is required.
        </span>
      </label>

      {shownError && (
        <p className="mt-1.5 animate-fade-in text-xs font-medium text-rose-400">
          {shownError}
        </p>
      )}

      {value.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url, idx) => (
            <div
              key={url}
              className="group relative aspect-video overflow-hidden rounded-lg border border-ink-700 bg-ink-850"
            >
              <img
                src={url}
                alt={`Listing image ${idx + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {idx === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-md bg-brand-500/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-950">
                  Cover
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-ink-950/70 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => moveImage(idx, -1)}
                  disabled={idx === 0}
                  className="rounded-md bg-ink-700/90 p-1.5 text-zinc-200 transition hover:bg-ink-600 disabled:opacity-30"
                  aria-label="Move left"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(idx, 1)}
                  disabled={idx === value.length - 1}
                  className="rounded-md bg-ink-700/90 p-1.5 text-zinc-200 transition hover:bg-ink-600 disabled:opacity-30"
                  aria-label="Move right"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="rounded-md bg-rose-500/90 p-1.5 text-white transition hover:bg-rose-500"
                  aria-label="Remove image"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
