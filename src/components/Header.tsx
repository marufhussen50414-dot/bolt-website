import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Menu, X, Search, User, LogOut, LayoutDashboard, PlusCircle, ShieldCheck,
  Settings, Wallet, Star, LifeBuoy, ChevronRight, HelpCircle, Home as HomeIcon,
  Compass, Tag, BookOpen,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import { classNames } from "../lib/utils";

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    classNames(
      "px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
      isActive ? "text-primary-400 bg-primary-500/10" : "text-ink-300 hover:text-white hover:bg-ink-800"
    );

  const displayName = profile?.full_name ?? profile?.username ?? "User";
  const initials = displayName.trim()[0]?.toUpperCase() ?? "U";

  async function handleSignOut() {
    await signOut();
    setMenuOpen(false);
    setOpen(false);
    navigate("/");
  }

  const menuItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/profile", icon: User, label: "My Profile" },
    { to: "/sell", icon: PlusCircle, label: "Sell an ID" },
    { to: "/dashboard?tab=listings", icon: Settings, label: "My Listings" },
    { to: "/dashboard?tab=selling", icon: Wallet, label: "Earnings & Wallet" },
    { to: "/dashboard?tab=buying", icon: Star, label: "My Purchases" },
  ];

  return (
    <header className="sticky top-0 z-40 glass border-b border-ink-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="shrink-0"><Logo /></Link>
            <nav className="hidden xl:flex items-center gap-1">
              <NavLink to="/" end className={linkClass}><span className="flex items-center gap-1.5"><HomeIcon size={15} /> Home</span></NavLink>
              <NavLink to="/browse" className={linkClass}><span className="flex items-center gap-1.5"><Compass size={15} /> Browse IDs</span></NavLink>
              <NavLink to="/sell" className={linkClass}><span className="flex items-center gap-1.5"><Tag size={15} /> Sell ID</span></NavLink>
              <NavLink to="/how-it-works" className={linkClass}><span className="flex items-center gap-1.5"><BookOpen size={15} /> How it Works</span></NavLink>
              <NavLink to="/faq" className={linkClass}><span className="flex items-center gap-1.5"><HelpCircle size={15} /> FAQ</span></NavLink>
              <NavLink to="/support" className={linkClass}><span className="flex items-center gap-1.5"><LifeBuoy size={15} /> Support</span></NavLink>
              {user && <NavLink to="/dashboard" className={linkClass}><span className="flex items-center gap-1.5"><LayoutDashboard size={15} /> Dashboard</span></NavLink>}
              {user && <NavLink to="/profile" className={linkClass}><span className="flex items-center gap-1.5"><User size={15} /> Profile</span></NavLink>}
            </nav>
          </div>

          <div className="hidden xl:flex items-center gap-2">
            <button onClick={() => navigate("/browse")} className="btn-ghost" aria-label="Search"><Search size={18} /></button>
            {user ? (
              <div className="relative">
                <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 hover:bg-ink-800 transition-colors">
                  <div className="relative">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white text-sm font-bold">{initials}</div>
                    )}
                    <span className={classNames("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink-900", profile?.is_online ? "bg-success-400" : "bg-ink-500")} />
                  </div>
                  <span className="text-sm font-semibold text-white max-w-[100px] truncate">{displayName}</span>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 z-20 card p-2 animate-scale-in shadow-2xl">
                      <div className="px-3 py-3 border-b border-ink-800 mb-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate">{displayName}</p>
                          {profile?.is_verified && <ShieldCheck size={15} className="text-success-400 shrink-0" />}
                        </div>
                        <p className="text-xs text-ink-400 truncate">{user.email}</p>
                        {profile && (
                          <div className="flex items-center gap-2 mt-1.5 text-xs">
                            <span className="flex items-center gap-0.5 text-warning-400"><Star size={11} className="fill-warning-400" /> {Number(profile.trust_score).toFixed(1)}</span>
                            <span className="text-ink-500">•</span>
                            <span className="text-ink-400">{profile.total_sales} sales</span>
                          </div>
                        )}
                      </div>
                      <div className="py-1">
                        {menuItems.map((m) => (
                          <Link key={m.label} to={m.to} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-200 hover:bg-ink-800 hover:text-white transition-colors group">
                            <m.icon size={16} className="text-ink-400 group-hover:text-primary-400" /><span>{m.label}</span><ChevronRight size={14} className="ml-auto text-ink-600" />
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-ink-800 mt-1 pt-1">
                        <Link to="/support" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-200 hover:bg-ink-800 hover:text-white transition-colors group">
                          <LifeBuoy size={16} className="text-ink-400 group-hover:text-primary-400" /><span>Help & Support</span>
                        </Link>
                        <button onClick={handleSignOut} className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-error-400 hover:bg-error-500/10 transition-colors">
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">Log In</Link>
                <Link to="/register" className="btn-primary">Sign Up</Link>
              </>
            )}
          </div>

          <button className="xl:hidden btn-ghost" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="xl:hidden border-t border-ink-800 py-3 animate-slide-up">
            <nav className="flex flex-col gap-1">
              <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>Home</NavLink>
              <NavLink to="/browse" className={linkClass} onClick={() => setOpen(false)}>Browse IDs</NavLink>
              <NavLink to="/sell" className={linkClass} onClick={() => setOpen(false)}>Sell ID</NavLink>
              <NavLink to="/how-it-works" className={linkClass} onClick={() => setOpen(false)}>How it Works</NavLink>
              <NavLink to="/faq" className={linkClass} onClick={() => setOpen(false)}>FAQ</NavLink>
              <NavLink to="/support" className={linkClass} onClick={() => setOpen(false)}>Support</NavLink>
              <div className="border-t border-ink-800 mt-2 pt-2 flex flex-col gap-2">
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setOpen(false)} className="btn-secondary"><LayoutDashboard size={16} /> Dashboard</Link>
                    <Link to="/profile" onClick={() => setOpen(false)} className="btn-secondary"><User size={16} /> My Profile</Link>
                    <button onClick={handleSignOut} className="btn-danger"><LogOut size={16} /> Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary"><User size={16} /> Log In</Link>
                    <Link to="/register" onClick={() => setOpen(false)} className="btn-primary">Sign Up</Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
