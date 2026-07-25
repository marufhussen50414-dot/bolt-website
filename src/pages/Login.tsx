import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, Phone, AlertCircle, Loader2, Eye, EyeOff, KeyRound, ShieldCheck, RotateCw } from "lucide-react";
import { supabase } from "../lib/supabase";

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
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function switchMode(m: AuthMode) { setMode(m); setError(""); setInfo(""); setOtpSent(false); setOtp(""); }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    navigate(params.get("redirect") ?? "/profile");
  }

  async function sendOtp() {
    setError(""); setInfo("");
    if (phone.replace(/\D/g, "").length < 10) { setError("Please enter a valid phone number"); return; }
    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: toE164(phone) });
    setLoading(false);
    if (otpError) { setError(otpError.message); return; }
    setOtpSent(true);
    setInfo("We sent a 6-digit code to " + toE164(phone) + ". Enter it below to log in.");
  }

  async function verifyOtpAndLogin(e: FormEvent) {
    e.preventDefault(); setError(""); setInfo("");
    if (otp.trim().length < 4) { setError("Enter the 6-digit code we sent you"); return; }
    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({ phone: toE164(phone), token: otp.trim(), type: "sms" });
    setLoading(false);
    if (verifyError) { setError(verifyError.message); return; }
    navigate(params.get("redirect") ?? "/profile");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-glow-radial opacity-50" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="card p-8 animate-slide-up">
          <h1 className="font-display text-2xl font-extrabold text-center text-white">Welcome back</h1>
          <p className="text-center text-sm text-ink-400 mt-1">Log in to your GameHaatBD account</p>

          <div className="mt-6 flex p-1 rounded-xl bg-ink-800/60 border border-ink-700">
            <button type="button" onClick={() => switchMode("email")} className={mode === "email" ? "flex-1 py-2 rounded-lg text-sm font-semibold bg-primary-500/20 text-primary-300 transition-colors" : "flex-1 py-2 rounded-lg text-sm font-semibold text-ink-400 hover:text-white transition-colors"}>
              <Mail size={15} className="inline mr-1.5 -mt-0.5" />Email
            </button>
            <button type="button" onClick={() => switchMode("phone")} className={mode === "phone" ? "flex-1 py-2 rounded-lg text-sm font-semibold bg-primary-500/20 text-primary-300 transition-colors" : "flex-1 py-2 rounded-lg text-sm font-semibold text-ink-400 hover:text-white transition-colors"}>
              <Phone size={15} className="inline mr-1.5 -mt-0.5" />Phone
            </button>
          </div>

          {error && <div className="mt-5 flex items-start gap-2 rounded-xl bg-error-500/10 border border-error-500/20 p-3 text-sm text-error-400"><AlertCircle size={18} className="shrink-0 mt-0.5" /><span>{error}</span></div>}
          {info && <div className="mt-5 flex items-start gap-2 rounded-xl bg-primary-500/10 border border-primary-500/20 p-3 text-sm text-primary-300"><ShieldCheck size={18} className="shrink-0 mt-0.5" /><span>{info}</span></div>}

          {mode === "email" ? (
            <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
              <div><label className="label">Email</label><div className="relative"><Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="you@example.com" /></div></div>
              <div><label className="label">Password</label><div className="relative"><Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10 pr-10" placeholder="••••••••" /><button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : "Log In"}</button>
            </form>
          ) : !otpSent ? (
            <div className="mt-6 space-y-4">
              <div><label className="label">Phone Number</label><div className="relative"><Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input required value={phone} onChange={(e) => setPhone(e.target.value)} className="input pl-10" placeholder="01XXXXXXXXX" /></div></div>
              <button type="button" onClick={sendOtp} disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : <span className="inline-flex items-center justify-center gap-1.5">Send Code <KeyRound size={16} /></span>}</button>
            </div>
          ) : (
            <form onSubmit={verifyOtpAndLogin} className="mt-6 space-y-4">
              <div><label className="label">Verification Code</label><div className="relative"><KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input inputMode="numeric" autoComplete="one-time-code" required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className="input pl-10 tracking-[0.5em] text-center" placeholder="• • • • • •" /></div></div>
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : "Verify & Log In"}</button>
              <button type="button" onClick={sendOtp} disabled={loading} className="w-full text-center text-sm text-ink-400 hover:text-primary-300 transition-colors flex items-center justify-center gap-1.5"><RotateCw size={14} /> Resend code</button>
              <button type="button" onClick={() => { setOtpSent(false); setOtp(""); setInfo(""); }} className="w-full text-center text-sm text-ink-500 hover:text-white transition-colors">Use a different number</button>
            </form>
          )}
          <p className="text-center text-sm text-ink-400 mt-6">Don't have an account? <Link to="/register" className="font-semibold text-primary-400 hover:text-primary-300">Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
}
