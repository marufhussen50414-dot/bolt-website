import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Search, User, Home as HomeIcon,
  Tag, MessageSquare, X, Store,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import { classNames } from "../lib/utils";

export default function Header() {
  const { user, profile } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  async function loadUnread() {
    if (!user) { setUnreadCount(0); return; }
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .neq("sender_id", user.id)
      .is("read_at", null);
    setUnreadCount(count ?? 0);
  }

  useEffect(() => {
    loadUnread();
    if (!user) return;

    const onRead = () => loadUnread();
    window.addEventListener("messages-read", onRead);

    const channel = supabase
      .channel("nav-unread")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as { sender_id: string; read_at: string | null };
        if (msg.sender_id !== user.id && !msg.read_at) setUnreadCount((c) => c + 1);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => loadUnread())
      .subscribe();

    const interval = setInterval(() => {
      loadUnread();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("messages-read", onRead);
      clearInterval(interval);
    };
  }, [user]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    classNames(
      "px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap",
      isActive ? "text-primary-400 bg-primary-500/10" : "text-ink-300 hover:text-white hover:bg-ink-800"
    );

  const displayName = profile?.full_name ?? profile?.username ?? (user?.user_metadata?.full_name as string | undefined) ?? "User";
  const initials = displayName.trim()[0]?.toUpperCase() ?? "U";

  return (
    <div className="w-full overflow-x-hidden">
      <header className="sticky top-0 z-40 glass border-b border-ink-800 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-6 min-w-0">
              <Link to="/" className="shrink-0"><Logo /></Link>
              <nav className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-thin">
                <NavLink to="/" end className={linkClass}><span className="flex items-center gap-1.5"><HomeIcon size={15} /> Home</span></NavLink>
                <NavLink to="/browse" className={linkClass}><span className="flex items-center gap-1.5"><Search size={15} /> Search</span></NavLink>
                <NavLink to="/sell" className={linkClass}><span className="flex items-center gap-1.5"><Tag size={15} /> Sell ID</span></NavLink>
                <NavLink to="/messages" className={linkClass}>
                  <span className="relative flex items-center gap-1.5">
                    <MessageSquare size={15} /> Message
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-error-500 px-1 text-[9px] font-bold text-white ring-2 ring-ink-900 animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </span>
                </NavLink>
                {user ? (
                  <NavLink to="/profile" className={linkClass}><span className="flex items-center gap-1.5"><User size={15} /> Profile</span></NavLink>
                ) : (
                  <button onClick={() => setAuthOpen(true)} className={linkClass({ isActive: false })}><span className="flex items-center gap-1.5"><User size={15} /> Profile</span></button>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <Link 
                  to="/profile" 
                  className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 hover:bg-ink-800 transition-colors"
                >
                  <div className="relative">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white text-sm font-bold">{initials}</div>
                    )}
                    <span className={classNames("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink-900", profile?.is_online ? "bg-success-400" : "bg-ink-500")} />
                  </div>
                  <span className="hidden sm:block text-sm font-semibold text-white max-w-[100px] truncate">{displayName}</span>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary hidden sm:inline-flex">Log In</Link>
                  <Link to="/register" className="btn-primary hidden sm:inline-flex">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>
        {authOpen && !user && (
          <>
            <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setAuthOpen(false)} />
            <div className="fixed inset-0 z-[9999] grid place-items-center p-4 pointer-events-none">
              <div className="relative w-full max-w-sm card p-6 animate-scale-in pointer-events-auto">
                <button onClick={() => setAuthOpen(false)} className="absolute right-3 top-3 text-ink-500 hover:text-white transition-colors" aria-label="Close"><X size={18} /></button>
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-500/10 text-primary-400 mx-auto"><User size={22} /></div>
                <h2 className="font-display text-xl font-extrabold text-center text-white mt-3">Access your profile</h2>
                <p className="text-center text-sm text-ink-400 mt-1">Log in or create an account to view your profile, listings, and messages.</p>
                <div className="mt-5 space-y-2.5">
                  <Link to="/login" onClick={() => setAuthOpen(false)} className="btn-primary w-full justify-center">Log In</Link>
                  <Link to="/register" onClick={() => setAuthOpen(false)} className="btn-secondary w-full justify-center">Create Account</Link>
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-ink-950/95 backdrop-blur-md border-t border-ink-800 px-2 py-2 flex items-center justify-around md:hidden shadow-2xl w-full">
        <Link to="/" className="flex flex-col items-center gap-0.5 text-ink-400 hover:text-primary-400 text-[10px]">
          <HomeIcon size={20} />
          <span>Home</span>
        </Link>
        <Link to="/browse" className="flex flex-col items-center gap-0.5 text-ink-400 hover:text-primary-400 text-[10px]">
          <Search size={20} />
          <span>Browse</span>
        </Link>
        <Link to="/sell" className="flex flex-col items-center gap-0.5 text-ink-400 hover:text-primary-400 text-[10px]">
          <Store size={20} />
          <span>Sell ID</span>
        </Link>
        <Link to="/messages" className="flex flex-col items-center gap-0.5 text-ink-400 hover:text-primary-400 text-[10px] relative">
          <MessageSquare size={20} />
          <span>Message</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-error-500 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        {user ? (
          <Link to="/profile" className="flex flex-col items-center gap-0.5 text-ink-400 hover:text-primary-400 text-[10px]">
            <User size={20} />
            <span>Profile</span>
          </Link>
        ) : (
          <button onClick={() => setAuthOpen(true)} className="flex flex-col items-center gap-0.5 text-ink-400 hover:text-primary-400 text-[10px] bg-transparent border-none cursor-pointer">
            <User size={20} />
            <span>Profile</span>
          </button>
        )}
      </div>
    </div>
  );
}
