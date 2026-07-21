import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error: err } = await signUp(email, password, fullName.trim() || "Player");
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    navigate("/");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 animate-fade-in">
      <div className="card p-8">
        <div className="mb-6 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600/20 text-primary-400">
            <UserPlus size={24} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-white">Create account</h1>
          <p className="mt-1 text-sm text-ink-400">Join GameVault and start trading</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-error-500/40 bg-error-500/10 px-4 py-3 text-sm text-error-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder="Your name" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="min 6 characters" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          Already have an account? <Link to="/login" className="font-semibold text-primary-400 hover:text-primary-300">Login</Link>
        </p>
      </div>
    </div>
  );
}
