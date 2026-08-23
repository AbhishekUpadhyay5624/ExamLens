import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Crosshair, Radio, Eye, Cpu } from "lucide-react";

export default function CCTVHeroMockup() {
  const [timeStr, setTimeStr] = useState("14:22:08");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTimeStr(
        now.toTimeString().split(" ")[0]
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-lg select-none">
      {/* Ambient background glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-30 blur-xl dark:opacity-40 animate-pulse" />

      {/* Main Terminal Frame */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950/90 shadow-2xl backdrop-blur-xl">
        {/* Top CCTV Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="font-mono font-bold tracking-wider text-red-400">
              ● LIVE FEED
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-slate-400">CAM-02 [HALL A]</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Radio size={12} className="animate-pulse" /> 30 FPS
            </span>
            <span>{timeStr}</span>
          </div>
        </div>

        {/* Video Canvas Area */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-4">
          {/* Subtle Grid Background Pattern */}
          <div 
            className="absolute inset-0 opacity-20" 
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.4) 1px, transparent 0)`,
              backgroundSize: "20px 20px"
            }}
          />

          {/* Vertical Laser Scanline */}
          <motion.div
            animate={{ y: [0, 280, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="pointer-events-none absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-75 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
          />

          {/* Perspective Room Overlay Wireframe */}
          <div className="absolute inset-x-8 bottom-4 top-10 rounded-xl border border-blue-500/10 bg-blue-950/10" />

          {/* Candidate Seats Mockup Dots */}
          <div className="absolute top-12 left-12 h-10 w-16 rounded border border-slate-700/40 bg-slate-900/50 p-1 flex items-center justify-center">
            <span className="text-[10px] font-mono text-slate-500">Seat 10</span>
          </div>
          <div className="absolute top-12 right-12 h-10 w-16 rounded border border-slate-700/40 bg-slate-900/50 p-1 flex items-center justify-center">
            <span className="text-[10px] font-mono text-slate-500">Seat 14</span>
          </div>

          {/* AI Bounding Box Target Lock (Flagged Person) */}
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[30%] top-[22%] h-36 w-44 rounded-md border-2 border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
          >
            {/* Corner Bracket Accents */}
            <div className="absolute -left-1 -top-1 h-3 w-3 border-l-2 border-t-2 border-white" />
            <div className="absolute -right-1 -top-1 h-3 w-3 border-r-2 border-t-2 border-white" />
            <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-white" />
            <div className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-white" />

            {/* Target Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
              <Crosshair size={24} className="text-red-400" />
            </div>

            {/* Top Anomaly Badge */}
            <div className="absolute -top-7 left-0 right-0 flex justify-center">
              <div className="flex items-center gap-1.5 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-md">
                <ShieldAlert size={11} />
                <span>PERSON #12 • DESK INTERACTION</span>
              </div>
            </div>

            {/* Bottom Confidence & Coordinates */}
            <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-1 text-[9px] font-mono font-semibold text-red-400">
              <span>CONF: 94.2%</span>
              <span>ZONE: CBT-02</span>
            </div>
          </motion.div>

          {/* Secondary Non-Violating Person (Normal Detection) */}
          <div className="absolute bottom-6 right-8 h-20 w-24 rounded border border-emerald-500/60 bg-emerald-500/5 p-1">
            <span className="text-[9px] font-mono text-emerald-400">#08 NORMAL</span>
          </div>

          {/* Telemetry HUD Bottom Overlay */}
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <Cpu size={11} className="text-cyan-400" /> YOLOv11m + ByteTrack
            </span>
            <span>MODEL: ACTIVE_SCAN</span>
          </div>
        </div>

        {/* Bottom Caption Bar */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/60 px-4 py-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Eye size={14} className="text-blue-400" />
            <span className="font-medium text-[11px] sm:text-xs">Real-Time CCTV Anomaly Tracking</span>
          </div>
          <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300 border border-blue-500/30">
            AUTO-CLIP ENABLED
          </span>
        </div>
      </div>
    </div>
  );
}
