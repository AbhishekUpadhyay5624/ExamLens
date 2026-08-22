import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ScanEye } from "lucide-react";
import { useAuth } from "../lib/auth";
import { apiErrorMessage } from "../lib/api";

export default function Register() {
  const { register } = useAuth();
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
      setError(apiErrorMessage(err, "Registration failed."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="anim-fade-in-down mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white anim-bounce-in anim-delay-1 hover-glow">
            <ScanEye size={22} className="anim-float" style={{ animationDuration: '3s' }} />
          </span>
          <h1 className="anim-fade-in-up anim-delay-2 text-xl font-semibold text-slate-900">
            Create your account
          </h1>
          <p className="anim-fade-in-up anim-delay-3 mt-1 text-sm text-slate-500">
            The first account becomes the administrator.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="anim-slide-up anim-delay-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover-glow"
        >
          {error && (
            <div className="anim-shake mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/20">
              {error}
            </div>
          )}

          <label className="mb-1 block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
          />

          <label className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
          />

          <label className="mb-1 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
          />

          <button
            type="submit"
            disabled={submitting}
            className="btn-press ripple-container w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200/50 disabled:opacity-60"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating account…
              </span>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="anim-fade-in-up anim-delay-5 mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 transition hover:text-blue-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
