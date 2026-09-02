import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, Phone, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import { GoogleIcon } from "../components/GoogleIcon";

type AuthMode = "email" | "phone";

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+")) return "+" + digits;
  if (digits.startsWith("880")) return "+" + digits;
  if (digits.startsWith("01")) return "+880" + digits.slice(1);
  if (digits.startsWith("1")) return "+880" + digits;
  return "+880" + digits;
}

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function switchMode(m: AuthMode) { setMode(m); setError(""); }

  async function handleGoogle() {
    setError(""); setGoogleLoading(true);
    // Google Login-এর পর সরাসরি PKCE callback হ্যান্ডলার (/AuthCallback) পেজে পাঠাবে
    const redirectTo = `${window.location.origin}/AuthCallback`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (oauthError) { setError(oauthError.message); setGoogleLoading(false); }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const { error: err } = mode === "email"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signInWithPassword({ phone: toE164(phone), password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    navigate(params.get("redirect") ?? "/profile");
  }

  const identityLabel = mode === "email" ? "Email" : "Phone Number";
  const identityPlaceholder = mode === "email" ? "you@example.com" : "01XXXXXXXXX";

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-glow-radial opacity-50" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="card p-8 animate-slide-up">
          <h1 className="font-display text-2xl font-extrabold text-center text-white">Welcome back</h1>
          <p className="text-center text-sm text-ink-400 mt-1">Log in to your GameHaatBD account</p>

          <button type="button" onClick={handleGoogle} disabled={googleLoading || loading} className="btn-google w-full mt-6">
            {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon size={18} />}
            <span>Continue with Google</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-ink-700" /></div>
            <div className="relative flex justify-center"><span className="bg-ink-900 px-3 text-xs text-ink-500 uppercase tracking-wider">or</span></div>
          </div>

          <div className="flex p-1 rounded-xl bg-ink-800/60 border border-ink-700">
            <button type="button" onClick={() => switchMode("email")} className={mode === "email" ? "flex-1 py-2 rounded-lg text-sm font-semibold bg-primary-500/20 text-primary-300 transition-colors" : "flex-1 py-2 rounded-lg text-sm font-semibold text-ink-400 hover:text-white transition-colors"}>
              <Mail size={15} className="inline mr-1.5 -mt-0.5" />Email
            </button>
            <button type="button" onClick={() => switchMode("phone")} className={mode === "phone" ? "flex-1 py-2 rounded-lg text-sm font-semibold bg-primary-500/20 text-primary-300 transition-colors" : "flex-1 py-2 rounded-lg text-sm font-semibold text-ink-400 hover:text-white transition-colors"}>
              <Phone size={15} className="inline mr-1.5 -mt-0.5" />Phone
            </button>
          </div>

          {error && <div className="mt-5 flex items-start gap-2 rounded-xl bg-error-500/10 border border-error-500/20 p-3 text-sm text-error-400"><AlertCircle size={18} className="shrink-0 mt-0.5" /><span>{error}</span></div>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div><label className="label">{identityLabel}</label><div className="relative">{mode === "email" ? <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /> : <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />}<input type={mode === "email" ? "email" : "tel"} required value={mode === "email" ? email : phone} onChange={(e) => mode === "email" ? setEmail(e.target.value) : setPhone(e.target.value)} className="input pl-10" placeholder={identityPlaceholder} /></div></div>
            <div><label className="label">Password</label><div className="relative"><Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10 pr-10" placeholder="••••••••" /><button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
            <button type="submit" disabled={loading || googleLoading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : "Log In"}</button>
          </form>
          <p className="text-center text-sm text-ink-400 mt-6">Don't have an account? <Link to="/register" className="font-semibold text-primary-400 hover:text-primary-300">Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
}
