import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ScanEye, Upload, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useTheme } from "../contexts/ThemeContext";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/uploads", label: "Uploads" },
  { to: "/reports", label: "Reports" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
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

  return (
    <header className="no-print border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/80 dark:backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="group flex shrink-0 items-center gap-2 text-slate-900 dark:text-slate-100 transition-transform duration-200 hover:scale-105 active:scale-95">
          <motion.span 
            layoutId="app-logo-icon"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(37,99,235,0.6)] group-hover:bg-blue-500"
          >
            <ScanEye size={18} className="transition-transform duration-300 group-hover:scale-110" />
          </motion.span>
          <motion.span 
            layoutId="app-logo-text"
            className="text-lg font-semibold tracking-tight font-display transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400"
          >
            ExamLens
          </motion.span>
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-500 hover:shadow-[0_0_12px_rgba(59,130,246,0.6)] hover:scale-105 active:scale-95"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">New upload</span>
          </Link>

          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm hover:scale-110 active:scale-95 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {user.name}
                </div>
                <div className="text-xs capitalize text-slate-500 dark:text-slate-400">
                  {user.role}
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 hover:shadow-[inset_0_0_8px_rgba(239,68,68,0.1)] hover:scale-105 active:scale-95 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:border-red-900/50 dark:hover:text-red-400"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compact nav for small screens */}
      <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden dark:border-slate-800">
        {NAV_LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
            {l.label}
          </NavLink>
        ))}
      </div>
    </header>
  );
}
