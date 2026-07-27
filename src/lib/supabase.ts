import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Parse the access token from the URL hash when Google redirects back,
    // so the session is restored on load instead of showing the login screen.
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
