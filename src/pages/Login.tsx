import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    navigate(params.get("redirect") ?? "/dashboard");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-glow-radial opacity-50" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="card p-8 animate-slide-up">
          <h1 className="font-display text-2xl font-extrabold text-center text-white">Welcome back</h1>
          <p className="text-center text-sm text-ink-400 mt-1">Log in to your GameHaatBD account</p>
          {error && <div className="mt-5 flex items-start gap-2 rounded-xl bg-error-500/10 border border-error-500/20 p-3 text-sm text-error-400"><AlertCircle size={18} className="shrink-0 mt-0.5" /><span>{error}</span></div>}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div><label className="label">Email</label><div className="relative"><Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="you@example.com" /></div></div>
            <div><label className="label">Password</label><div className="relative"><Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10" placeholder="••••••••" /></div></div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={18} className="animate-spin" /> : "Log In"}</button>
          </form>
          <p className="text-center text-sm text-ink-400 mt-6">Don't have an account? <Link to="/register" className="font-semibold text-primary-400 hover:text-primary-300">Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
}
