import { Flame, Crosshair, Target, Shield, Sword, Zap, Gamepad2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function formatBDT(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

const ICON_MAP: Record<string, LucideIcon> = {
  flame: Flame,
  crosshair: Crosshair,
  target: Target,
  shield: Shield,
  sword: Sword,
  zap: Zap,
  gamepad: Gamepad2,
};

export function categoryIcon(icon: string | null | undefined): LucideIcon {
  return (icon && ICON_MAP[icon]) || Gamepad2;
}
