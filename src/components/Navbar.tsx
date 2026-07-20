import { Link, NavLink, useNavigate } from "react-router-dom";
import { Gamepad2, User, LogOut, Plus, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { classNames } from "../lib/utils";

export default function Navbar() {
  const { session, profile, signOut } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: "Home", end: true },
    { to: "/browse", label: "Browse", end: false },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-500 text-white">
            <Gamepad2 size={18} />
          </span>
          <span className="font-display text-lg font-extrabold text-white">GameHaat<span className="text-primary-400">BD</span></span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                classNames("rounded-lg px-3 py-2 text-sm font-medium transition-colors", isActive ? "bg-primary-500/15 text-primary-300" : "text-ink-300 hover:text-white hover:bg-ink-800")
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {session ? (
            <>
              <Link to="/sell" className="btn-primary hidden sm:inline-flex">
                <Plus size={16} /> Sell ID
              </Link>
              <Link to="/dashboard" className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm font-medium text-white hover:border-primary-500/50">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-500/20 text-primary-300 text-xs font-bold">
                  {(profile?.full_name ?? "P").charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline max-w-[120px] truncate">{profile?.full_name ?? "Account"}</span>
              </Link>
              <button onClick={() => { signOut(); nav("/"); }} className="rounded-lg p-2 text-ink-400 hover:bg-ink-800 hover:text-error-400" title="Sign out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-300 hover:text-white">
                <User size={16} /> Login
              </Link>
              <Link to="/sell" className="btn-primary hidden sm:inline-flex">
                <Plus size={16} /> Sell ID
              </Link>
            </>
          )}
          <button onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 text-ink-300 md:hidden">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-800 bg-ink-950 px-4 py-3 md:hidden">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-ink-300 hover:bg-ink-800 hover:text-white">
              {l.label}
            </NavLink>
          ))}
          <Link to="/sell" onClick={() => setOpen(false)} className="btn-primary mt-2 w-full"><Plus size={16} /> Sell ID</Link>
          {!session && <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary mt-2 w-full"><User size={16} /> Login</Link>}
        </div>
      )}
    </header>
  );
}
