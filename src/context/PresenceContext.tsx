import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

/*
 * Real-time "who's online" tracking.
 *
 * Every open tab joins one shared Supabase Realtime Presence channel.
 * Logged-in users `track()` themselves on it; everyone (logged in or
 * not) listens to the channel's presence state to know which user ids
 * are currently connected. Presence is removed automatically by
 * Supabase the instant a socket disconnects (tab closed, network
 * drop, browser crash) — no manual "set offline" call, heartbeat, or
 * stale flag is needed, which is what makes this accurate.
 */

const PresenceContext = createContext<Set<string>>(new Set());

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const channel = supabase.channel("presence:online", {
      config: { presence: { key: user?.id ?? `guest-${Math.random().toString(36).slice(2)}` } },
    });

    channel.on("presence", { event: "sync" }, () => {
      setOnlineIds(new Set(Object.keys(channel.presenceState())));
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED" && user) {
        channel.track({ online_at: new Date().toISOString() });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return <PresenceContext.Provider value={onlineIds}>{children}</PresenceContext.Provider>;
}

export function useIsOnline(userId: string | null | undefined): boolean {
  const onlineIds = useContext(PresenceContext);
  if (!userId) return false;
  return onlineIds.has(userId);
}
