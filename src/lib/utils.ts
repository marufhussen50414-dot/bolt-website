import { clsx, type ClassValue } from "./clsx";
import type { LucideIcon } from "lucide-react";

export function classNames(...classes: ClassValue[]) {
  return clsx(classes);
}

export type IconType = LucideIcon;

export function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

export function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const mo = Math.floor(days / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

const TAG_COLORS = [
  { bg: "bg-primary-500/15", text: "text-primary-300", ring: "ring-primary-500/30" },
  { bg: "bg-accent-500/15", text: "text-accent-300", ring: "ring-accent-500/30" },
  { bg: "bg-success-500/15", text: "text-success-300", ring: "ring-success-500/30" },
  { bg: "bg-warning-500/15", text: "text-warning-300", ring: "ring-warning-500/30" },
  { bg: "bg-error-500/15", text: "text-error-300", ring: "ring-error-500/30" },
];

export function tagColor(label: string) {
  const sum = label.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return TAG_COLORS[sum % TAG_COLORS.length];
}

export function buildTags(opts: {
  prime: number | null;
  accountLevel: number | null;
  custom: string[];
}): string[] {
  const out: string[] = [];
  if (opts.prime != null && opts.prime > 0) out.push(`Prime ${opts.prime}`);
  if (opts.accountLevel != null && opts.accountLevel > 0) out.push(`Level ${opts.accountLevel}`);
  for (const t of opts.custom) {
    const v = t.trim();
    if (v && !out.some((x) => x.toLowerCase() === v.toLowerCase())) out.push(v);
  }
  return out;
}
