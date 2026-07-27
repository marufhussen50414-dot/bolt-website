import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone, AlertCircle, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
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

export default function Register() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<AuthMode>("email");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function update(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }
  function switchMode(m: AuthMode) { setMode(m); setError(""); setInfo(""); }

  async function handleGoogle() {
    setError(""); setInfo(""); setGoogleLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/profile` },
    });
    if (oauthError) { setError(oauthError.message); setGoogleLoading(false); }
  }

  async function createProfile(uid: string, phoneVal: string) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      { id: uid, full_name: form.name.trim(), phone: phoneVal || null },
      { onConflict: "id", ignoreDuplicates: true }
    );
    if (profileError) throw new Error("Account created but profile setup failed: " + profileError.message);
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault(); setError(""); setInfo("");
    if (form.name.trim().length < 2) { setError("Please enter your name (at least 2 characters)"); return; }
    if (form.password !== form.confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name.trim() } },
    });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data.user) {
      try { await createProfile(data.user.id, ""); await refreshProfile(); } catch (err) { setError((err as Error).message); setLoading(false); return; }
    }
    setLoading(false); navigate("/profile");
  }

  async function handlePhoneSubmit(e: FormEvent) {
    e.preventDefault(); setError(""); setInfo("");
    if (form.name.trim().length < 2) { setError("Please enter your name (at least 2 characters)"); return; }
    if (form.phone.replace(/\D/g, "").length < 10) { setError("Please enter a valid phone number"); return; }
    if (form.password !== form.confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    const phoneE164 = toE164(form.phone);
    const { data, error: signUpError } = await supabase.auth.signUp({
      phone: phoneE164,
      password: form.password,
      options: { data: { full_name: form.name.trim() } },
    });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data.user) {
      try { await createProfile(data.user.id, phoneE164); await refreshProfile(); } catch (err) { setError((err as Error).message); setLoading(false); return; }
    }
    setLoading(false); navigate("/profile");
  }

  const submit = mode === "email" ? handleEmailSubmit : handlePhoneSubmit;
  const identityLabel = mode === "email" ? "Email" : "Phone Number";
  const identityPlaceholder = mode === "email" ? "you@example.com" : "01XXXXXXXXX";

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-glow-radial opacity-50" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="card p-8 animate-slide-up">
          <h1 className="font-display text-2xl font-extrabold text-center text-white">Create your account</h1>
          <p className="text-center text-sm text-ink-400 mt-1">Start buying and selling game IDs</p>

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
          {info && <div className="mt-5 flex items-start gap-2 rounded-xl bg-primary-500/10 border border-primary-500/20 p-3 text-sm text-primary-300"><ShieldCheck size={18} className="shrink-0 mt-0.5" /><span>{info}</span></div>}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><label className="label">Full Name</label><div className="relative"><User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input required value={form.name} onChange={(e) => update("name", e.target.value)} className="input pl-10" placeholder="Your name" /></div></div>
            <div><label className="label">{identityLabel}</label><div className="relative">{mode === "email" ? <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /> : <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />}<input type={mode === "email" ? "email" : "tel"} required value={mode === "email" ? form.email : form.phone} onChange={(e) => update(mode === "email" ? "email" : "phone", e.target.value)} className="input pl-10" placeholder={identityPlaceholder} /></div></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Password</label><div className="relative"><Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input type={showPassword ? "text" : "password"} required value={form.password} onChange={(e) => update("password", e.target.value)} className="input pl-10 pr-10" placeholder="••••••••" /><button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
              <div><label className="label">Confirm</label><div className="relative"><Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input type={showConfirm ? "text" : "password"} required value={form.confirm} onChange={(e) => update("confirm", e.target.value)} className="input pl-10 pr-10" placeholder="••••••••" /><button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors" aria-label={showConfirm ? "Hide password" : "Show password"}>{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
            </div>
            <button type="submit" disabled={loading || googleLoading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}</button>
          </form>
          <p className="text-center text-sm text-ink-400 mt-6">Already have an account? <Link to="/login" className="font-semibold text-primary-400 hover:text-primary-300">Log In</Link></p>
        </div>
      </div>
    </div>
  );
}
