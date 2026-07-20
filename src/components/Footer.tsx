import { Link } from "react-router-dom";
import { Gamepad2, ShieldCheck, CreditCard, TrendingUp } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-ink-800 bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-500 text-white"><Gamepad2 size={18} /></span>
              <span className="font-display text-lg font-extrabold text-white">GameHaatBD</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-ink-400">Bangladesh's game account marketplace. Buy and sell IDs safely with escrow protection.</p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-500">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-success-400" /> Escrow Protected</span>
              <span className="flex items-center gap-1.5"><CreditCard size={14} className="text-primary-400" /> bKash · Nagad · Card</span>
              <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-accent-400" /> 2% Commission</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Marketplace</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-400">
              <li><Link to="/browse" className="hover:text-primary-300">Browse IDs</Link></li>
              <li><Link to="/sell" className="hover:text-primary-300">Sell an ID</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary-300">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Account</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-400">
              <li><Link to="/login" className="hover:text-primary-300">Login</Link></li>
              <li><Link to="/signup" className="hover:text-primary-300">Sign Up</Link></li>
              <li><Link to="/profile" className="hover:text-primary-300">Profile</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-ink-800 pt-6 text-center text-xs text-ink-500">
          © {new Date().getFullYear()} GameHaatBD. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
