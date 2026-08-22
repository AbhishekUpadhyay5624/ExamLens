import { Link, NavLink, useNavigate } from "react-router-dom";
import { ScanEye, Upload, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/uploads", label: "Uploads" },
  { to: "/reports", label: "Reports" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      isActive
        ? "bg-blue-50 text-blue-700"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;

  return (
    <header className="no-print border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ScanEye size={18} />
          </span>
          <span className="text-lg font-semibold tracking-tight font-display">
            ExamLens
          </span>
        </Link>

        {/* Primary navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/upload"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">New upload</span>
          </Link>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-medium text-slate-800">
                  {user.name}
                </div>
                <div className="text-xs capitalize text-slate-500">
                  {user.role}
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compact nav for small screens */}
      <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
        {NAV_LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
            {l.label}
          </NavLink>
        ))}
      </div>
    </header>
  );
}
