import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ScanEye, ArrowLeft } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../lib/auth";
import { apiErrorMessage } from "../lib/api";
import AnimatedGridBackground from "../components/AnimatedGridBackground";

export default function Register() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Registration failed. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const handleGoogleSignUp = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null);
      setSubmitting(true);
      try {
        await googleLogin(tokenResponse.access_token);
        navigate("/", { replace: true });
      } catch (err) {
        setError(apiErrorMessage(err, "Google registration failed."));
      } finally {
        setSubmitting(false);
      }
    },
    onError: () => {
      setError("Google registration was cancelled or encountered an error.");
    },
  });

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-12">
      {/* Dynamic Animated Grid & Constellation Canvas */}
      <AnimatedGridBackground />

      {/* Ambient background soft glow */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />

      {/* Top Left Return to Landing Page Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-white dark:hover:bg-slate-850 shadow-sm"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <motion.span
            layoutId="app-logo-icon"
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30"
          >
            <ScanEye size={24} />
          </motion.span>
          <motion.h1 
            layoutId="app-logo-text"
            className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display"
          >
            Create an ExamLens account
          </motion.h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Set up your invigilator workspace
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/20 dark:ring-red-500/20">
              {error}
            </div>
          )}

          {/* Form on Top */}
          <form onSubmit={handleSubmit}>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Full name
            </label>
            <input
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-4 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 px-3 py-2 text-sm dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />

            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 px-3 py-2 text-sm dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />

            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 px-3 py-2 text-sm dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0 disabled:translate-y-0 disabled:opacity-60 shadow-md shadow-blue-600/20"
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            <span className="bg-white dark:bg-slate-900 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Or
            </span>
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>

          {/* Google Sign-Up Button on Bottom */}
          <button
            type="button"
            onClick={() => handleGoogleSignUp()}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-95 disabled:opacity-60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign up with Google</span>
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
