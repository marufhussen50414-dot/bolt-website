import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/types";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, profile: null, loading: true,
  signOut: async () => {}, refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(uid: string) {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (data) {
      setProfile(data as Profile | null);
      return;
    }
    // Right after signup, the auth event can fire before the profile row has been
    // inserted, leaving the header stuck on the fallback name. Retry once shortly
    // after so the real name appears without a manual page reload.
    setTimeout(async () => {
      const { data: retry } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (retry) setProfile(retry as Profile | null);
    }, 800);
  }

  useEffect(() => {
    let mounted = true;
    let profileUid: string | null = null;

    async function applySession(newSession: Session | null) {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // TOKEN_REFRESHED reuses the same user id, so skip re-fetching the
        // profile on every silent token renewal — only load it when the
        // signed-in user actually changes.
        if (profileUid !== newSession.user.id) {
          profileUid = newSession.user.id;
          await loadProfile(newSession.user.id);
        }
      } else {
        profileUid = null;
        setProfile(null);
      }
      setLoading(false);
    }

    // Restore any session persisted in localStorage on first load so a
    // returning user — or one redirected back from Google — is recognized
    // immediately instead of flashing the login screen.
    supabase.auth
      .getSession()
      .then(({ data }) => { if (mounted) applySession(data.session); });

    // Covers SIGNED_IN (email/password + Google OAuth callback), SIGNED_OUT,
    // TOKEN_REFRESHED (silent renewal), and USER_UPDATED. The profile fetch is
    // wrapped in an IIFE because awaiting a Supabase call directly inside the
    // callback deadlocks the event listener.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => { await applySession(newSession); })();
    });

    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  async function signOut() { await supabase.auth.signOut(); setProfile(null); }
  async function refreshProfile() { if (user) await loadProfile(user.id); }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() { return useContext(AuthContext); }
