import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth";

// Wraps protected routes. While we're validating a stored token on first load,
// show a light placeholder instead of flashing the login page.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, bootstrapping } = useAuth();
  const location = useLocation();

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 size={22} className="animate-spin text-blue-600" />
        <span className="text-sm">Loading your session…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return children;
}
