import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Activity, Radio, Cpu, Eye, Sparkles } from "lucide-react";

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
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-cyan-500/30 opacity-60 blur-xl" />

      {/* Main Glassmorphic Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950/90 shadow-2xl backdrop-blur-xl">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-4 py-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
            </span>
            <span className="font-mono font-bold tracking-wider text-cyan-400">
              ● AI TELEMETRY
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-slate-400">ZONE-01 [ACTIVE]</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Radio size={12} className="animate-pulse text-emerald-400" /> 30 FPS
            </span>
            <span>{timeStr}</span>
          </div>
        </div>

        {/* Visual Radar & Telemetry Canvas */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-5">
          {/* Subtle Radar Background Grid */}
          <div 
            className="absolute inset-0 opacity-25" 
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.3) 1px, transparent 0)`,
              backgroundSize: "22px 22px"
            }}
          />

          {/* Concentric Radar Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="h-48 w-48 rounded-full border border-cyan-500/40" />
            <div className="absolute h-32 w-32 rounded-full border border-cyan-500/30" />
            <div className="absolute h-16 w-16 rounded-full border border-cyan-500/20" />
          </div>

          {/* Smooth Radar Sweep Line */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center origin-center"
          >
            <div className="h-48 w-48 rounded-full bg-gradient-to-tr from-transparent via-cyan-500/10 to-cyan-400/20" />
          </motion.div>

          {/* Detection Node 1 (Candidate Track #04) */}
          <motion.div 
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-10 rounded-xl border border-cyan-500/40 bg-slate-900/85 p-3 shadow-lg backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-cyan-300">TRACK #04</span>
            </div>
            <div className="mt-1 text-[10px] font-mono text-slate-400 space-y-0.5">
              <div>MOTION_DELTA: 0.14</div>
              <div className="text-emerald-400 font-semibold">STATUS: NOMINAL</div>
            </div>
          </motion.div>

          {/* Detection Node 2 (Flagged Interaction - Cyan / Indigo Theme) */}
          <motion.div 
            animate={{ scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-10 right-8 rounded-xl border border-indigo-500/50 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-[11px] font-mono font-bold text-indigo-300">TRACK #12</span>
            </div>
            <div className="mt-1 text-[10px] font-mono text-slate-400 space-y-0.5">
              <div>EVENT: CBT_DESK_CHECK</div>
              <div className="text-cyan-400 font-semibold">CONFIDENCE: 94.2%</div>
            </div>
          </motion.div>

          {/* Central Inference Telemetry Waveform */}
          <div className="absolute inset-x-8 bottom-3 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-cyan-300">
              <Cpu size={12} /> YOLOv11m + ByteTrack
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Activity size={12} className="animate-pulse" /> REALTIME SYNC
            </span>
          </div>
        </div>

        {/* Bottom Caption Bar */}
        <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-900/70 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Eye size={14} className="text-cyan-400" />
            <span className="font-medium text-[11px] sm:text-xs">Autonomous Multi-Object Telemetry</span>
          </div>
          <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
            ZERO BLIND SPOTS
          </span>
        </div>
      </div>
    </div>
  );
}
