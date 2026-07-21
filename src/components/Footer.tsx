import { Link } from "react-router-dom";
import { Gamepad2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-ink-800 bg-ink-950 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
                <Gamepad2 size={18} />
              </span>
              <span className="font-display text-lg font-bold text-white">GameVault</span>
            </Link>
            <p className="mt-3 text-sm text-ink-400 max-w-xs">
              The trusted marketplace for buying and selling gaming accounts safely.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <h4 className="font-semibold text-white mb-3">Marketplace</h4>
              <ul className="space-y-2 text-ink-400">
                <li><Link to="/" className="hover:text-white transition">Browse</Link></li>
                <li><Link to="/sell" className="hover:text-white transition">Sell an account</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Account</h4>
              <ul className="space-y-2 text-ink-400">
                <li><Link to="/login" className="hover:text-white transition">Login</Link></li>
                <li><Link to="/signup" className="hover:text-white transition">Sign Up</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-ink-500">
          (c) {new Date().getFullYear()} GameVault. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
