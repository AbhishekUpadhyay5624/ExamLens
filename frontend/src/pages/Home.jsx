import { Link } from "react-router-dom";
import {
  Upload,
  FolderOpen,
  FileText,
  ArrowRight,
  Quote,
  ShieldCheck,
  Activity,
  Flame,
} from "lucide-react";
import { useAuth } from "../lib/auth";

const ACTIONS = [
  {
    to: "/upload",
    icon: Upload,
    title: "Upload footage",
    body: "Add exam CCTV video and run the proctoring analysis.",
    tone: "bg-blue-600 text-white",
    accent: "text-white/80",
    primary: true,
  },
  {
    to: "/uploads",
    icon: FolderOpen,
    title: "Uploads",
    body: "Browse analyzed exams and open their dashboards.",
    tone: "bg-white",
    accent: "text-blue-600",
  },
  {
    to: "/reports",
    icon: FileText,
    title: "Reports",
    body: "Open investigation reports for completed exams.",
    tone: "bg-white",
    accent: "text-blue-600",
  },
];

const HIGHLIGHTS = [
  {
    icon: Activity,
    title: "Tracks every person",
    body: "Detects and follows each individual across the recording.",
  },
  {
    icon: ShieldCheck,
    title: "Flags suspicious behavior",
    body: "Rule-based events tuned to the exam type, ranked by severity.",
  },
  {
    icon: Flame,
    title: "Visualizes movement",
    body: "A motion heatmap and evidence clips for fast review.",
  },
];

export default function Home() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="hero-gradient overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-8 text-white shadow-lg sm:p-12 anim-fade-in-up">
        <p className="anim-fade-in-down text-sm font-medium text-blue-100 anim-delay-1">
          {firstName ? `Welcome back, ${firstName}` : "Welcome to ExamLens"}
        </p>
        <h1 className="anim-fade-in-up mt-2 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl anim-delay-2">
          Turn exam CCTV footage into clear proctoring insights.
        </h1>
        <p className="anim-fade-in-up mt-3 max-w-xl text-blue-100 anim-delay-3">
          ExamLens watches the recording so you don't have to — tracking people,
          flagging suspicious moments, and assembling the evidence you need to
          make a fair call.
        </p>
        <div className="anim-fade-in-up mt-6 flex flex-wrap gap-3 anim-delay-4">
          <Link
            to="/upload"
            className="btn-press inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 hover:shadow-lg"
          >
            <Upload size={16} className="anim-float" style={{ animationDuration: '2.5s' }} />
            Upload footage
          </Link>
          <Link
            to="/uploads"
            className="btn-press inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 hover:border-white/50"
          >
            View uploads
            <ArrowRight size={16} className="transition-transform hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Quote */}
      <section className="anim-fade-in-up anim-delay-2 relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover-glow">
        <Quote
          size={40}
          className="absolute -top-3 left-6 text-blue-100 anim-float"
          fill="currentColor"
        />
        <blockquote className="relative">
          <p className="text-xl font-medium leading-relaxed text-slate-800 sm:text-2xl">
            "Integrity is doing the right thing, even when no one is watching."
          </p>
          <footer className="mt-3 text-sm text-slate-500">
            — C. S. Lewis
          </footer>
        </blockquote>
        <p className="mt-4 max-w-2xl text-sm text-slate-500">
          When someone does need to watch, ExamLens makes sure it's thorough,
          consistent, and evidence-based.
        </p>
      </section>

      {/* Quick actions */}
      <section className="anim-fade-in-up anim-delay-3">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Get started
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {ACTIONS.map((a, idx) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.to}
                to={a.to}
                className={`anim-fade-in-up anim-delay-${idx + 4} hover-card btn-press group flex flex-col rounded-2xl border border-slate-200 p-5 shadow-sm transition ${a.tone} ${
                  a.primary ? "hover:bg-blue-700 hover:shadow-blue-200/50" : "hover:border-blue-200"
                }`}
              >
                <span
                  className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${
                    a.primary ? "bg-white/15" : "bg-blue-50"
                  } ${a.accent}`}
                >
                  <Icon size={20} />
                </span>
                <span
                  className={`text-base font-semibold ${
                    a.primary ? "text-white" : "text-slate-900"
                  }`}
                >
                  {a.title}
                </span>
                <span
                  className={`mt-1 text-sm ${
                    a.primary ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  {a.body}
                </span>
                <span
                  className={`mt-4 inline-flex items-center gap-1 text-sm font-medium ${
                    a.primary ? "text-white" : "text-blue-600"
                  }`}
                >
                  Open
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* What it does */}
      <section className="anim-fade-in-up anim-delay-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          What ExamLens does
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {HIGHLIGHTS.map((h, idx) => {
            const Icon = h.icon;
            return (
              <div
                key={h.title}
                className={`anim-fade-in-up hover-card btn-press group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm`}
                style={{ animationDelay: `${0.6 + idx * 0.15}s` }}
              >
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-all group-hover:bg-blue-100 group-hover:scale-110 group-hover:shadow-md">
                  <Icon size={20} />
                </span>
                <h3 className="text-base font-semibold text-slate-900">
                  {h.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{h.body}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-center">
          <Link
            to="/about"
            className="btn-press inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-700 hover:gap-2"
          >
            Learn more about ExamLens
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
