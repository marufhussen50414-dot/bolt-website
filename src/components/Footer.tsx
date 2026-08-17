import { Link, useLocation } from "react-router-dom";
import { Mail, MessageCircle, Send, ShieldCheck } from "lucide-react";
import Logo from "./Logo";

export default function Footer() {
  const location = useLocation();

  // Sell এবং Browse পেজে ফুটার দেখাবে না
  if (location.pathname === "/sell" || location.pathname === "/browse") {
    return null;
  }

  return (
    <footer className="border-t border-ink-800 mt-16 bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Logo />
            <p className="text-sm text-ink-400 mt-3 max-w-xs">Bangladesh's safest game ID marketplace. Buy and sell with escrow protection and only 2% commission.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Marketplace</h4>
            <ul className="space-y-2 text-sm text-ink-400">
              <li><Link to="/browse" className="hover:text-primary-400">Browse IDs</Link></li>
              <li><Link to="/sell" className="hover:text-primary-400">Sell an ID</Link></li>
              <li><Link to="/how-it-works" className="hover:text-primary-400">How it Works</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-ink-400">
              <li><Link to="/faq" className="hover:text-primary-400">FAQ</Link></li>
              <li><Link to="/support" className="hover:text-primary-400">Support Center</Link></li>
              <li><Link to="/how-it-works" className="hover:text-primary-400">Safety & Escrow</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-ink-400">
              <li className="flex items-center gap-2"><Mail size={14} /> support@gamehaatbd.com</li>
              <li className="flex items-center gap-2"><MessageCircle size={14} /> 01700-000000</li>
              <li className="flex items-center gap-2"><Send size={14} /> @gamehaatbd</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-ink-800 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-ink-500">© 2026 GameHaatBD. All rights reserved.</p>
          <p className="text-xs text-ink-500 flex items-center gap-1.5"><ShieldCheck size={13} className="text-success-400" /> Escrow-protected transactions</p>
        </div>
      </div>
    </footer>
  );
}
