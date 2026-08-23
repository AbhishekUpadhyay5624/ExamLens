import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ScanEye, Upload, LogOut, Moon, Sun, ArrowRight } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useTheme } from "../contexts/ThemeContext";

const LOGGED_IN_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/uploads", label: "Uploads" },
  { to: "/reports", label: "Reports" },
];

const GUEST_NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pipeline", label: "How It Works" },
  { href: "#detectors", label: "Anomaly Rules" },
  { href: "#profiles", label: "Exam Profiles" },
];

export default function Navbar() {
  const { user, logout, googleLogin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
      isActive
        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 shadow-[inset_0_0_8px_rgba(59,130,246,0.1)]"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
    }`;

  const guestLinkClass =
    "rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all duration-200";

  return (
    <header className="sticky top-0 z-50 no-print border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: Brand Logo & Name */}
        <Link to="/" className="group flex shrink-0 items-center gap-2.5 text-slate-900 dark:text-slate-100 transition-transform duration-200 hover:scale-105 active:scale-95">
          <motion.span 
            layoutId="app-logo-icon"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(37,99,235,0.6)]"
          >
            <ScanEye size={18} className="transition-transform duration-300 group-hover:scale-110" />
          </motion.span>
          <div className="flex items-center gap-2">
            <motion.span 
              layoutId="app-logo-text"
              className="text-lg font-bold tracking-tight font-display transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400"
            >
              ExamLens
            </motion.span>
            <span className="hidden sm:inline-block rounded-full bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              AI Proctor
            </span>
          </div>
        </Link>

        {/* Center: Dynamic Navigation Links */}
        <nav className="hidden items-center gap-1 md:flex">
          {user ? (
            LOGGED_IN_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            ))
          ) : (
            GUEST_NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className={guestLinkClass}>
                {l.label}
              </a>
            ))
          )}
        </nav>

        {/* Right: Actions & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm hover:scale-110 active:scale-95 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/upload"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-500 hover:shadow-[0_0_12px_rgba(59,130,246,0.6)] hover:scale-105 active:scale-95"
              >
                <Upload size={16} />
                <span>New upload</span>
              </Link>
              <div className="hidden text-right lg:block">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {user.name}
                </div>
                <div className="text-xs capitalize text-slate-500 dark:text-slate-400">
                  {user.role}
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 hover:scale-105 active:scale-95 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-slate-800 active:scale-95"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Compact nav for small mobile screens */}
      <div className="flex items-center gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden dark:border-slate-800">
        {user ? (
          LOGGED_IN_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))
        ) : (
          GUEST_NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className={guestLinkClass}>
              {l.label}
            </a>
          ))
        )}
      </div>
    </header>
  );
}
