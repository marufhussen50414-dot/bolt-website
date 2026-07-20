import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone, MapPin, AlertCircle, Loader2, CheckCircle2, Flame, Crosshair, Gamepad2 } from "lucide-react";
import { supabase } from "../lib/supabase";

const interests = [{ id: "free-fire", label: "Free Fire", icon: Flame }, { id: "pubg-mobile", label: "PUBG Mobile", icon: Crosshair }, { id: "cod-mobile", label: "COD Mobile", icon: Gamepad2 }];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", location: "", password: "", confirm: "", interest: "", role: "both" as "buyer" | "seller" | "both" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  function update(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError("");
    if (form.name.trim().length < 2) { setError("Please enter your name (at least 2 characters)"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (form.password !== form.confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email: form.email, password: form.password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({ id: data.user.id, full_name: form.name.trim(), phone: form.phone || null, location: form.location || null });
      if (profileError) { setError("Account created but profile failed: " + profileError.message); setLoading(false); return; }
    }
    setLoading(false); navigate("/profile");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-glow-radial opacity-50" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="card p-8 animate-slide-up">
          <h1 className="font-display text-2xl font-extrabold text-center text-white">Create your account</h1>
          <p className="text-center text-sm text-ink-400 mt-1">Start buying and selling game IDs</p>
          {error && <div className="mt-5 flex items-start gap-2 rounded-xl bg-error-500/10 border border-error-500/20 p-3 text-sm text-error-400"><AlertCircle size={18} className="shrink-0 mt-0.5" /><span>{error}</span></div>}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div><label className="label">Full Name</label><div className="relative"><User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input required value={form.name} onChange={(e) => update("name", e.target.value)} className="input pl-10" placeholder="Your name" /></div></div>
            <div><label className="label">Email</label><div className="relative"><Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className="input pl-10" placeholder="you@example.com" /></div></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Phone (optional)</label><div className="relative"><Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="input pl-10" placeholder="01XXXXXXXXX" /></div></div>
              <div><label className="label">Location (optional)</label><div className="relative"><MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input value={form.location} onChange={(e) => update("location", e.target.value)} className="input pl-10" placeholder="Dhaka" /></div></div>
            </div>
            <div><label className="label">I want to</label><div className="grid grid-cols-3 gap-2">{([["buyer", "Buy"], ["seller", "Sell"], ["both", "Both"]] as const).map((row) => { const [id, label] = row; return (<button type="button" key={id} onClick={() => update("role", id)} className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${form.role === id ? "border-primary-500 bg-primary-500/10 text-primary-300" : "border-ink-700 bg-ink-900 text-ink-400 hover:bg-ink-800"}`}>{label}</button>); })}</div></div>
            <div><label className="label">Favorite Game (optional)</label><div className="grid grid-cols-3 gap-2">{interests.map((g) => { const Icon = g.icon; return (<button type="button" key={g.id} onClick={() => update("interest", form.interest === g.id ? "" : g.id)} className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all flex flex-col items-center gap-1 ${form.interest === g.id ? "border-accent-500 bg-accent-500/10 text-accent-300" : "border-ink-700 bg-ink-900 text-ink-400 hover:bg-ink-800"}`}><Icon size={18} /> {g.label}</button>); })}</div></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Password</label><div className="relative"><Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input type="password" required value={form.password} onChange={(e) => update("password", e.target.value)} className="input pl-10" placeholder="••••••••" /></div></div>
              <div><label className="label">Confirm</label><div className="relative"><Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input type="password" required value={form.confirm} onChange={(e) => update("confirm", e.target.value)} className="input pl-10" placeholder="••••••••" /></div></div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}</button>
          </form>
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-primary-500/10 border border-primary-500/20 p-3 text-xs text-primary-300"><CheckCircle2 size={16} className="shrink-0 mt-0.5" /><span>By signing up you agree to our Terms and Privacy Policy. Only 2% commission on every sale.</span></div>
          <p className="text-center text-sm text-ink-400 mt-6">Already have an account? <Link to="/login" className="font-semibold text-primary-400 hover:text-primary-300">Log In</Link></p>
        </div>
      </div>
    </div>
  );
}
