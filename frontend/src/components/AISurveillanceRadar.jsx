import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Radio, Cpu, Eye, Activity } from "lucide-react";

export default function AISurveillanceRadar() {
  const [timeStr, setTimeStr] = useState("14:32:10");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(" ")[0]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-lg select-none">
      {/* Ambient background soft glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-cyan-500/20 opacity-70 blur-xl dark:from-blue-600/30 dark:via-indigo-600/20 dark:to-cyan-500/30" />

      {/* Main Glassmorphic Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 shadow-xl backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/90 dark:shadow-2xl">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/90 px-4 py-3 text-xs dark:border-slate-800/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75 dark:bg-cyan-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600 dark:bg-cyan-500" />
            </span>
            <span className="font-mono font-bold tracking-wider text-blue-600 dark:text-cyan-400">
              ● AI TELEMETRY
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="font-mono text-slate-500 dark:text-slate-400">ZONE-01 [ACTIVE]</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Radio size={12} className="animate-pulse text-emerald-600 dark:text-emerald-400" /> 30 FPS
            </span>
            <span>{timeStr}</span>
          </div>
        </div>

        {/* Visual Radar & Telemetry Canvas */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-gradient-to-b from-slate-50 via-slate-100/80 to-slate-50 p-5 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          {/* Subtle Radar Background Grid */}
          <div 
            className="absolute inset-0 opacity-20 dark:opacity-25" 
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.4) 1px, transparent 0)`,
              backgroundSize: "22px 22px"
            }}
          />

          {/* Concentric Radar Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 dark:opacity-20">
            <div className="h-48 w-48 rounded-full border border-blue-500/40 dark:border-cyan-500/40" />
            <div className="absolute h-32 w-32 rounded-full border border-blue-500/30 dark:border-cyan-500/30" />
            <div className="absolute h-16 w-16 rounded-full border border-blue-500/20 dark:border-cyan-500/20" />
          </div>

          {/* Smooth Radar Sweep Line */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center origin-center"
          >
            <div className="h-48 w-48 rounded-full bg-gradient-to-tr from-transparent via-blue-500/10 to-indigo-500/15 dark:via-cyan-500/10 dark:to-cyan-400/20" />
          </motion.div>

          {/* Detection Node 1 (Candidate Track #04) */}
          <motion.div 
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-10 rounded-xl border border-blue-200/80 bg-white/90 p-3 shadow-md backdrop-blur-md dark:border-cyan-500/40 dark:bg-slate-900/85 dark:shadow-lg"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-blue-700 dark:text-cyan-300">TRACK #04</span>
            </div>
            <div className="mt-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 space-y-0.5">
              <div>MOTION_DELTA: 0.14</div>
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold">STATUS: NOMINAL</div>
            </div>
          </motion.div>

          {/* Detection Node 2 (Flagged Interaction) */}
          <motion.div 
            animate={{ scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-10 right-8 rounded-xl border border-indigo-200/80 bg-white/90 p-3 shadow-md backdrop-blur-md dark:border-indigo-500/50 dark:bg-slate-900/90 dark:shadow-xl"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping" />
              <span className="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300">TRACK #12</span>
            </div>
            <div className="mt-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 space-y-0.5">
              <div>EVENT: CBT_DESK_CHECK</div>
              <div className="text-blue-600 dark:text-cyan-400 font-semibold">CONFIDENCE: 94.2%</div>
            </div>
          </motion.div>

          {/* Central Inference Telemetry Waveform */}
          <div className="absolute inset-x-8 bottom-3 flex items-center justify-between rounded-lg border border-slate-200/80 bg-white/80 px-3 py-1.5 text-[10px] font-mono text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            <span className="flex items-center gap-1 text-blue-700 dark:text-cyan-300 font-semibold">
              <Cpu size={12} /> YOLOv11m + ByteTrack
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Activity size={12} className="animate-pulse" /> REALTIME SYNC
            </span>
          </div>
        </div>

        {/* Bottom Caption Bar */}
        <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/90 px-4 py-2.5 text-xs dark:border-slate-800/80 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Eye size={14} className="text-blue-600 dark:text-cyan-400" />
            <span className="font-semibold text-[11px] sm:text-xs">Autonomous Multi-Object Telemetry</span>
          </div>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30">
            ZERO BLIND SPOTS
          </span>
        </div>
      </div>
    </div>
  );
}
