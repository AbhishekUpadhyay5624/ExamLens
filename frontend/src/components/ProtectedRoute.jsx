import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

// Wraps protected routes. While we're validating a stored token on first load,
// show a light placeholder instead of flashing the login page.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, bootstrapping } = useAuth();
  const location = useLocation();

  if (bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return children;
}
