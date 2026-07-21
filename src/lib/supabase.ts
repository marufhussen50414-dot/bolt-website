import { createClient } from "@supabase/supabase-js";

const url = "https://rdaergtnvfpjpgnkrodi.supabase.co";
const anon = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkYWVyZ3RudmZwanBnbmtyb2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNzQ5NTAsImV4cCI6MjA5OTk1MDk1MH0.7dhbli8An4DrgulH6EUQJHw7v2wgDZlxB0saggf0WoU";

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});
