import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Gamepad2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Signup() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() || "Player" } },
    });
    if (error) { setLoading(false); setError(error.message); return; }
    if (data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName.trim() || "Player" });
    }
    setLoading(false);
    nav("/dashboard", { replace: true });
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="card p-8">
        <div className="mb-6 flex flex-col items-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-500 text-white"><Gamepad2 size={24} /></span>
          <h1 className="mt-3 font-display text-2xl font-extrabold text-white">Create account</h1>
          <p className="text-sm text-ink-400">Join the marketplace</p>
        </div>
        {error && <div className="mb-4 rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-300">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Full Name</label><input className="input" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" /></div>
          <div><label className="label">Email</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
          <div><label className="label">Password</label><input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 size={16} className="animate-spin" /> : "Create Account"}</button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-400">Already have an account? <Link to="/login" className="font-semibold text-primary-400 hover:text-primary-300">Sign in</Link></p>
      </div>
    </div>
  );
}
