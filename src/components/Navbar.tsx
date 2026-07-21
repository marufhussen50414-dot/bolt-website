import { Link, NavLink, useNavigate } from "react-router-dom";
import { Gamepad2, Plus, LayoutDashboard, MessageSquare, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { classNames } from "../lib/utils";

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItem = ({ isActive }: { isActive: boolean }) =>
    classNames(
      "px-3 py-2 rounded-lg text-sm font-medium transition",
      isActive ? "bg-ink-800 text-white" : "text-ink-400 hover:text-white hover:bg-ink-800/60",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Gamepad2 size={20} />
          </span>
          <span className="font-display text-lg font-extrabold text-white">GameVault</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={navItem}>
            Browse
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={navItem}>
              Dashboard
            </NavLink>
          )}
          {user && (
            <NavLink to="/messages" className={navItem}>
              Messages
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/sell" className="btn-primary hidden sm:inline-flex">
                <Plus size={16} /> Sell
              </Link>
              <Link to="/dashboard" className="btn-ghost" title="Dashboard">
                <LayoutDashboard size={18} />
              </Link>
              <Link to="/messages" className="btn-ghost relative" title="Messages">
                <MessageSquare size={18} />
              </Link>
              <Link to="/profile" className="btn-ghost" title="Profile">
                <span className="flex items-center gap-2">
                  <UserCircle size={18} />
                  <span className="hidden sm:inline text-sm max-w-[100px] truncate">
                    {profile?.full_name ?? profile?.username ?? "Account"}
                  </span>
                </span>
              </Link>
              <button onClick={handleSignOut} className="btn-ghost" title="Sign out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Login
              </Link>
              <Link to="/signup" className="btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* mobile nav */}
      <nav className="md:hidden flex items-center gap-1 border-t border-ink-800 px-3 py-2">
        <NavLink to="/" end className={navItem}>
          Browse
        </NavLink>
        {user && (
          <NavLink to="/dashboard" className={navItem}>
            Dashboard
          </NavLink>
        )}
        {user && (
          <NavLink to="/messages" className={navItem}>
            Messages
          </NavLink>
        )}
        {user && (
          <Link to="/sell" className="btn-primary ml-auto">
            <Plus size={16} /> Sell
          </Link>
        )}
      </nav>
    </header>
  );
}
