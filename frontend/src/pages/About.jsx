import { Link } from "react-router-dom";
import {
  ScanEye,
  Upload,
  Users,
  ShieldAlert,
  Scissors,
  Flame,
  FileText,
  Laptop,
  Pause,
  Move,
  Lock,
  ArrowRight,
} from "lucide-react";
import { EXAM_TYPES } from "../lib/constants";

const PIPELINE = [
  {
    icon: Upload,
    title: "Upload",
    body: "Exam CCTV footage is uploaded and queued for analysis.",
  },
  {
    icon: Users,
    title: "Track people",
    body: "Every individual in frame is detected and followed over time.",
  },
  {
    icon: ShieldAlert,
    title: "Detect events",
    body: "A rule engine flags suspicious behavior, ranked by severity.",
  },
  {
    icon: Scissors,
    title: "Generate clips",
    body: "Short evidence clips are cut around each flagged moment.",
  },
  {
    icon: Flame,
    title: "Motion heatmap",
    body: "Accumulated movement is rendered as a heatmap of the room.",
  },
  {
    icon: FileText,
    title: "Report",
    body: "An investigation report summarizes what needs review.",
  },
];

const EVENTS = [
  {
    icon: Laptop,
    title: "Laptop interaction",
    body: "Use of a laptop, phone, or screen. Flagged as high severity in pen-and-paper exams; expected (and suppressed) in computer-based tests.",
  },
  {
    icon: Pause,
    title: "Suspicious stillness",
    body: "A person staying unusually motionless for a long stretch — a possible sign of hidden notes or a device.",
  },
  {
    icon: Move,
    title: "Excessive movement",
    body: "Repeated turning, reaching, or leaving position beyond normal fidgeting.",
  },
];

function SectionTitle({ children }) {
  return (
    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100 font-display">
      {children}
    </h2>
  );
}

export default function About() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {/* Intro */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-8 shadow-sm sm:p-10">
        <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
          <ScanEye size={24} />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 font-display">
          About ExamLens
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
          ExamLens is an exam-proctoring assistant that reviews recorded exam
          footage for you. Instead of scrubbing through hours of CCTV, an
          invigilator uploads a recording and ExamLens does the watching —
          tracking each person, flagging behavior that looks suspicious, and
          collecting the evidence into a single dashboard and report.
        </p>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
          It doesn't accuse anyone. It surfaces moments worth a human's
          attention and ranks them by severity, so limited review time goes to
          the events that matter most.
        </p>
      </section>

      {/* How it works */}
      <section>
        <SectionTitle>How it works</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PIPELINE.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-sm"
              >
                <span className="absolute right-4 top-4 font-mono text-2xl font-bold text-slate-100 dark:text-slate-800/50">
                  {i + 1}
                </span>
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <Icon size={20} />
                </span>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{step.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Events detected */}
      <section>
        <SectionTitle>What it looks for</SectionTitle>
        <div className="space-y-3">
          {EVENTS.map((e) => {
            const Icon = e.icon;
            return (
              <div
                key={e.title}
                className="flex gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <Icon size={20} />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {e.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{e.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Exam types */}
      <section>
        <SectionTitle>Tuned to the exam type</SectionTitle>
        <p className="mb-4 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          The same footage means different things in different exams, so
          ExamLens adjusts which behaviors it flags based on the exam type you
          choose at upload.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {EXAM_TYPES.map((t) => (
            <div
              key={t.value}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-sm"
            >
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {t.label}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.hint}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md p-6">
        <div className="flex gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            <Lock size={20} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Private by design
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              ExamLens runs entirely on your own machine — the footage,
              analysis, clips, and reports never leave it, and no internet
              connection is required to process a recording. Sensitive exam
              recordings stay under your control.
            </p>
          </div>
        </div>
      </section>

      <div className="text-center">
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Upload size={16} />
          Analyze your first recording
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
