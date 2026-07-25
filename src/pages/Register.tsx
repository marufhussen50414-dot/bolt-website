import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone, MapPin, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", location: "", password: "", confirm: "" });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function update(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError("");
    if (form.name.trim().length < 2) { setError("Please enter your name (at least 2 characters)"); return; }
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
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Password</label><div className="relative"><Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input type={showPassword ? "text" : "password"} required value={form.password} onChange={(e) => update("password", e.target.value)} className="input pl-10 pr-10" placeholder="••••••••" /><button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
              <div><label className="label">Confirm</label><div className="relative"><Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input type={showConfirm ? "text" : "password"} required value={form.confirm} onChange={(e) => update("confirm", e.target.value)} className="input pl-10 pr-10" placeholder="••••••••" /><button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors" aria-label={showConfirm ? "Hide password" : "Show password"}>{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}</button>
          </form>
          <p className="text-center text-sm text-ink-400 mt-6">Already have an account? <Link to="/login" className="font-semibold text-primary-400 hover:text-primary-300">Log In</Link></p>
        </div>
      </div>
    </div>
  );
}
