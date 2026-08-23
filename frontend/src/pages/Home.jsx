import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Upload,
  FolderOpen,
  FileText,
  ArrowRight,
  Quote,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Flame,
  Users,
  Scissors,
  Laptop,
  Pause,
  Move,
  Lock,
  Sparkles,
  CheckCircle2,
  Calendar,
  Building2,
  UserCheck,
  Zap,
} from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../lib/auth";
import CCTVHeroMockup from "../components/CCTVHeroMockup";
import { ShinyText, GlitchText } from "../components/TextEffects";
import TiltCard from "../components/TiltCard";
import { EXAM_TYPES } from "../lib/constants";

const STATS = [
  {
    icon: UserCheck,
    value: "50,000+",
    label: "Students Proctored",
  },
  {
    icon: Building2,
    value: "140+",
    label: "Exam Centers",
  },
  {
    icon: Zap,
    value: "99.4%",
    label: "Detection Precision",
  },
  {
    icon: ShieldCheck,
    value: "100%",
    label: "Verifiable Evidence",
  },
];

const ACTIONS = [
  {
    to: "/upload",
    icon: Upload,
    title: "Upload Footage",
    body: "Ingest exam CCTV video and run autonomous proctoring analysis.",
    primary: true,
  },
  {
    to: "/uploads",
    icon: FolderOpen,
    title: "Exam Library",
    body: "Review completed proctoring sessions, timelines, and anomaly stats.",
  },
  {
    to: "/reports",
    icon: FileText,
    title: "Investigation Dossiers",
    body: "Export structured evidence reports with timestamped clips.",
  },
];

const PIPELINE_STEPS = [
  {
    icon: Upload,
    title: "1. Video Ingestion",
    body: "Raw exam CCTV footage is uploaded with secure multi-tenant isolation.",
  },
  {
    icon: Users,
    title: "2. Multi-Person Tracking",
    body: "YOLOv11 and ByteTrack track every student continuously with zero identity swaps.",
  },
  {
    icon: ShieldAlert,
    title: "3. Rule-Based AI Engine",
    body: "Detects forbidden devices, unauthorized chit reading, and abnormal stillness.",
  },
  {
    icon: Scissors,
    title: "4. Bounding Box Video Clips",
    body: "Automatically cuts tightly padded H.264 clips with target-lock bounding boxes.",
  },
  {
    icon: Flame,
    title: "5. Spatial Motion Heatmap",
    body: "Renders cumulative room activity heatmaps to uncover localized hot-spots.",
  },
  {
    icon: FileText,
    title: "6. Investigation Dossier",
    body: "Compiles ranked, verifiable evidence for human proctors to make fair calls.",
  },
];

const ANOMALY_TYPES = [
  {
    icon: Laptop,
    title: "Unauthorized Devices & Chits",
    body: "Flags smartphones, unauthorized laptops, paper slips, or notes on student desks.",
    badge: "Hardware & Material",
    severity: "HIGH",
  },
  {
    icon: Pause,
    title: "Suspicious Stillness",
    body: "Detects students staying unnaturally motionless for long stretches — a sign of hidden cheat sheets.",
    badge: "Pose Anomaly",
    severity: "HIGH",
  },
  {
    icon: Move,
    title: "Excessive Movement & Peeking",
    body: "Catches repeated head-turning, leaning down toward desks, and seat-shifting beyond normal fidgeting.",
    badge: "Motion Dynamics",
    severity: "MEDIUM",
  },
];

export default function Home() {
  const { user, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleCTA = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await googleLogin(tokenResponse.access_token);
        navigate("/upload", { replace: true });
      } catch {
        navigate("/upload");
      }
    },
    onError: () => {
      navigate("/login");
    },
  });

  return (
    <div className="space-y-24 pb-20">
      {/* ========================================================================= */}
      {/* HERO SECTION (Two-Column Surveillance Theme) */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-10 lg:p-12 text-white shadow-2xl">
        {/* Background ambient radial lighting */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />

        <div className="relative z-10 grid gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Headline, Copy, Actions, Stats */}
          <div className="space-y-6 lg:col-span-7">
            {/* Security Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </span>
              <span>🔒 AI-Powered Surveillance • Zero Blind Spots</span>
            </div>

            {/* Bold 2-Line Headline */}
            <h1 className="text-3xl font-extrabold tracking-tight font-display sm:text-4xl lg:text-5xl leading-[1.15]">
              Monitor. Detect.{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Protect Academic Integrity.
              </span>
            </h1>

            {/* 3-Line Supporting Paragraph */}
            <p className="max-w-xl text-sm sm:text-base leading-relaxed text-slate-300">
              ExamLens monitors CCTV recordings so invigilators don't have to scrub through hours of footage — tracking every candidate in real time, flagging suspicious behavior, and delivering timestamped bounding-box video proof.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {user ? (
                <Link
                  to="/upload"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-200 hover:shadow-blue-600/50 hover:scale-105 active:scale-95"
                >
                  <Upload size={18} />
                  <span>Upload Exam Footage</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => handleGoogleCTA()}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-200 hover:shadow-blue-600/50 hover:scale-105 active:scale-95"
                >
                  <Upload size={18} />
                  <span>Get Started Free</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
              )}

              <a
                href="#pipeline"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-850/60 px-5 py-3.5 font-semibold text-slate-200 backdrop-blur-md transition-all hover:bg-slate-800 hover:border-slate-600 active:scale-95"
              >
                <span>Explore AI Pipeline</span>
                <span className="text-blue-400">↓</span>
              </a>
            </div>

            {/* Trust Metrics Bar */}
            <div className="pt-6 border-t border-slate-800/80">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {STATS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Icon size={14} className="text-blue-400" />
                        <span className="text-xs font-medium">{s.label}</span>
                      </div>
                      <div className="text-xl font-bold font-display text-white">
                        {s.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: CCTV Surveillance Mockup */}
          <div className="flex justify-center lg:col-span-5 lg:justify-end">
            <CCTVHeroMockup />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* QUICK ACCESS WORKSPACE (FOR LOGGED IN USERS) */}
      {/* ========================================================================= */}
      <section id="features" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
              <ShinyText text="Quick Access Workspace" />
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select an action to begin proctoring or review existing exam sessions.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.to} className="relative group">
                <Link to={a.to} className="absolute inset-0 z-20" aria-label={a.title} />
                <TiltCard className="flex flex-col justify-between h-full p-8 min-h-[220px]">
                  <div>
                    <span
                      className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl shadow-sm ${
                        a.primary
                          ? "bg-blue-600 text-white dark:bg-blue-500 shadow-blue-500/20"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                      }`}
                    >
                      <Icon size={28} />
                    </span>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {a.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {a.body}
                    </p>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Open <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </TiltCard>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6-STAGE AI ARCHITECTURE PIPELINE */}
      {/* ========================================================================= */}
      <section id="pipeline" className="space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 border border-blue-200 dark:border-blue-800">
            <Activity size={13} />
            <span>AI Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
            How the AI Proctoring Pipeline Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mt-1">
            Raw CCTV recordings are converted into explainable, timestamped video evidence through a deterministic 6-stage pipeline.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <TiltCard key={step.title} className="p-6 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <span className="absolute right-4 top-4 font-mono text-3xl font-extrabold text-slate-100 dark:text-slate-800/60 select-none">
                    0{idx + 1}
                  </span>
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm">
                    <Icon size={22} />
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {step.body}
                  </p>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TARGETED ANOMALY CLASSIFICATION */}
      {/* ========================================================================= */}
      <section id="detectors" className="space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-red-50 dark:bg-red-900/30 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300 mb-2 border border-red-200 dark:border-red-800">
            <ShieldAlert size={13} />
            <span>Targeted Detectors</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
            Automated Cheating & Anomaly Rules
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mt-1">
            Engineered rules designed to pinpoint common cheating behaviors while suppressing normal fidgeting.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {ANOMALY_TYPES.map((anomaly) => {
            const Icon = anomaly.icon;
            return (
              <TiltCard key={anomaly.title} className="p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                      <Icon size={24} />
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {anomaly.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {anomaly.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {anomaly.body}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">Severity Tier:</span>
                  <span className={anomaly.severity === "HIGH" ? "text-red-600 dark:text-red-400 font-bold" : "text-amber-600 dark:text-amber-400 font-bold"}>
                    {anomaly.severity} PRIORITY
                  </span>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ADAPTIVE EXAM PROFILES */}
      {/* ========================================================================= */}
      <section id="profiles" className="space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-2 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={13} />
            <span>Context-Aware Rules</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
            Adaptive Testing Environment Profiles
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mt-1">
            ExamLens automatically alters its sensitivity thresholds based on whether the exam is computerized, written, or physical.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(EXAM_TYPES).map(([typeKey, profile]) => (
            <TiltCard key={typeKey} className="p-6 flex flex-col justify-between">
              <div>
                <span className="inline-block px-3 py-1 rounded-md text-xs font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                  {typeKey}
                </span>
                <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">
                  {profile.label}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {profile.description}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Device Policy:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {profile.laptopDetection ? "Forbidden (Flagged)" : "Expected (Suppressed)"}
                  </span>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PHILOSOPHY & INTEGRITY QUOTE */}
      {/* ========================================================================= */}
      <TiltCard className="p-8 sm:p-10 relative overflow-hidden">
        <Quote
          size={56}
          className="absolute -top-3 left-6 text-blue-100 dark:text-blue-900/40"
          fill="currentColor"
        />
        <blockquote className="relative z-10">
          <p className="text-xl font-semibold leading-relaxed text-slate-800 dark:text-slate-200 sm:text-2xl font-display">
            “<GlitchText text="Integrity is doing the right thing, even when no one is watching." />”
          </p>
          <footer className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
            — C. S. Lewis
          </footer>
        </blockquote>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 relative z-10">
          When someone does need to review, ExamLens ensures the evaluation is objective, deterministic, and backed by verifiable video evidence — protecting honest students while surfacing real violations.
        </p>
      </TiltCard>

      {/* ========================================================================= */}
      {/* BOTTOM CALL TO ACTION: ANALYZE YOUR FIRST RECORDING */}
      {/* ========================================================================= */}
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 sm:p-12 text-center space-y-5 text-white shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-display">
          Analyze Your First Recording
        </h2>
        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
          Upload any CCTV recording and let ExamLens process it through YOLOv11 object tracking, anomaly detection, and automated report generation.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          {user ? (
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 hover:scale-105 active:scale-95"
            >
              <Upload size={18} />
              <span>Upload exam footage</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => handleGoogleCTA()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:scale-105 active:scale-95"
            >
              <Upload size={18} />
              <span>Continue with Google to Analyze</span>
            </button>
          )}

          <Link
            to={user ? "/uploads" : "/login"}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 font-semibold text-slate-200 transition hover:bg-slate-700 active:scale-95"
          >
            <span>{user ? "View past uploads" : "Sign in with email"}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
