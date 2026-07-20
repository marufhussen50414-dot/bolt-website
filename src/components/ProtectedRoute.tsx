import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="min-h-screen grid place-items-center text-ink-500">Loading…</div>;
  if (!session) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <>{children}</>;
}
