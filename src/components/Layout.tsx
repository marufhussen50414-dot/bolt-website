import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 font-display text-lg font-extrabold text-ink-950 shadow-glow">
              V
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Vault<span className="text-brand-400">Bay</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "text-brand-300"
                    : "text-zinc-400 hover:text-zinc-100"
                }`
              }
            >
              Browse
            </NavLink>
            {user ? (
              <>
                <NavLink
                  to="/sell"
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "text-brand-300"
                        : "text-zinc-400 hover:text-zinc-100"
                    }`
                  }
                >
                  Sell
                </NavLink>
                <button
                  onClick={handleSignOut}
                  className="btn-ghost ml-1 hidden sm:inline-flex"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" className="btn-ghost ml-1">
                  Sign in
                </Link>
                <Link to="/signup" className="btn-primary hidden sm:inline-flex">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      <footer className="border-t border-ink-800/80 py-8 text-center text-xs text-zinc-600">
        VaultBay — a demo gaming account marketplace.
      </footer>
    </div>
  );
}
