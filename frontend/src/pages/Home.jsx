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
import AILens from "../components/AILens";
import { ShinyText, GlitchText } from "../components/TextEffects";
import TiltCard from "../components/TiltCard";

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
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white shadow-sm sm:p-12">
        <div className="relative flex flex-col md:flex-row items-center justify-between w-full">
          <div className="w-full md:w-[55%] relative z-10 pr-0 md:pr-8">
            <p className="text-sm font-medium text-blue-100">
              <ShinyText text={firstName ? `Welcome back, ${firstName}` : "Welcome to ExamLens"} />
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight font-display sm:text-4xl">
              <GlitchText text="Turn exam CCTV footage into clear proctoring insights." />
            </h1>
            <p className="mt-4 text-blue-100 text-sm sm:text-base leading-relaxed max-w-xl">
              ExamLens watches the recording so you don't have to — tracking people,
              flagging suspicious moments, and assembling the evidence you need to
              make a fair call.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/upload"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-white px-6 py-3 font-medium text-blue-600 shadow-md transition-all hover:bg-slate-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 active:scale-95"
              >
                <Upload size={18} />
                <span>Upload footage</span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-blue-50/50 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              </Link>
              <Link
                to="/uploads"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-700/20 px-6 py-3 font-medium text-blue-50 backdrop-blur-sm transition-all hover:bg-blue-700/40 active:scale-95"
              >
                View uploads
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          
          {/* 3D AI Lens */}
          <div className="hidden md:flex w-[45%] justify-end relative z-0">
            <div className="scale-90 lg:scale-100 origin-right">
              <AILens />
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <TiltCard className="p-8">
        <Quote
          size={40}
          className="absolute -top-3 left-6 text-blue-100 dark:text-blue-900"
          fill="currentColor"
        />
        <blockquote className="relative">
          <p className="text-xl font-medium leading-relaxed text-slate-800 dark:text-slate-200 sm:text-2xl">
            “<GlitchText text="Integrity is doing the right thing, even when no one is watching." />”
          </p>
          <footer className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            — C. S. Lewis
          </footer>
        </blockquote>
        <p className="mt-4 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          When someone does need to watch, ExamLens makes sure it's thorough,
          consistent, and evidence-based.
        </p>
      </TiltCard>

      {/* Quick actions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100 font-display">
          <ShinyText text="Get started" />
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 relative z-10">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.to} className="relative group">
                {/* Need absolute Link covering TiltCard to avoid blocking click inside 3D transform */}
                <Link to={a.to} className="absolute inset-0 z-20" aria-label={a.title} />
                <TiltCard 
                  className="flex flex-col justify-between h-full p-8 min-h-[220px]"
                >
                  <div>
                    <span
                      className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl shadow-sm ${
                        a.primary ? "bg-blue-600 text-white dark:bg-blue-500 shadow-blue-500/20" : "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                      }`}
                    >
                      <Icon size={28} />
                    </span>
                    <h3
                      className={`text-xl font-semibold text-slate-900 dark:text-slate-100`}
                    >
                      {a.title}
                    </h3>
                    <p
                      className="mt-3 text-base leading-relaxed text-slate-500 dark:text-slate-400"
                    >
                      {a.body}
                    </p>
                  </div>
                  <span
                    className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider ${
                      a.primary ? "text-blue-600 dark:text-blue-400" : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                  Open
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </TiltCard>
            </div>
            );
          })}
        </div>
      </section>

      {/* What it does */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100 font-display">
          <ShinyText text="What ExamLens does" />
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {HIGHLIGHTS.map((h) => {
            const Icon = h.icon;
            return (
              <TiltCard
                key={h.title}
                className="p-8 min-h-[220px]"
              >
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                  <Icon size={24} />
                </span>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {h.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{h.body}</p>
              </TiltCard>
            );
          })}
        </div>
        <div className="mt-4 text-center">
          <Link
            to="/about"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Learn more about ExamLens
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
