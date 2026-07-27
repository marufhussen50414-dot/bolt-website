import type { LucideIcon } from "lucide-react";
import type { ListingStatus, OrderStatus } from "./types";

export type IconType = LucideIcon;

export function classNames(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(" ");
}

export function getRedirectURL(path = "/profile"): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  const fallback = import.meta.env.VITE_PRODUCTION_URL as string | undefined;
  if (fallback) return `${fallback.replace(/\/$/, "")}${path}`;
  return path;
}

export function formatBDT(n: number): string {
  return "৳" + new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(n);
}

export function timeAgo(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
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

const statusStyles: Record<string, string> = {
  pending: "bg-warning-500/15 text-warning-400 border-warning-500/20",
  approved: "bg-primary-500/15 text-primary-300 border-primary-500/20",
  active: "bg-success-500/15 text-success-400 border-success-500/20",
  sold: "bg-ink-700 text-ink-300 border-ink-600",
  rejected: "bg-error-500/15 text-error-400 border-error-500/20",
  delisted: "bg-ink-700 text-ink-400 border-ink-600",
  paid: "bg-primary-500/15 text-primary-300 border-primary-500/20",
  delivering: "bg-accent-500/15 text-accent-300 border-accent-500/20",
  completed: "bg-success-500/15 text-success-400 border-success-500/20",
  cancelled: "bg-ink-700 text-ink-300 border-ink-600",
  disputed: "bg-error-500/15 text-error-400 border-error-500/20",
  refunded: "bg-ink-700 text-ink-400 border-ink-600",
};

export function statusClass(s: ListingStatus | OrderStatus | string): string {
  return statusStyles[s] ?? "bg-ink-700 text-ink-300 border-ink-600";
}

export function statusLabel(s: ListingStatus | OrderStatus | string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
