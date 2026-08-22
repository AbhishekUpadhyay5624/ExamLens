import React, { useRef, useState, useEffect } from "react";
import { ScanEye } from "lucide-react";

export default function AILens() {
  const containerRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  // Use mouse move to slightly tilt the eye towards the cursor
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Calculate center of the element
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate distance from center (-1 to 1)
      const moveX = (e.clientX - centerX) / (window.innerWidth / 2);
      const moveY = (e.clientY - centerY) / (window.innerHeight / 2);

      // Max rotation is 20 degrees
      setRotation({ x: -moveY * 20, y: moveX * 20 });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-64 w-64 items-center justify-center [perspective:1000px] sm:h-80 sm:w-80"
    >
      <div
        className="relative h-full w-full transition-transform duration-200 ease-out preserve-3d"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {/* Outer Ring - Slow rotation */}
        <div className="absolute inset-0 rounded-full border border-blue-500/20 [transform:translateZ(-40px)] animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-4 rounded-full border-2 border-dashed border-blue-400/30 [transform:translateZ(-20px)] animate-[spin_15s_linear_infinite_reverse]" />
        
        {/* Core Iris Ring */}
        <div className="absolute inset-8 rounded-full border-[6px] border-blue-600/40 shadow-[0_0_30px_rgba(37,99,235,0.4)] [transform:translateZ(0px)]" />
        
        {/* Inner Tech Ring */}
        <div className="absolute inset-12 rounded-full border-t-2 border-r-2 border-blue-400/80 [transform:translateZ(20px)] animate-[spin_8s_linear_infinite]" />
        <div className="absolute inset-16 rounded-full border-b-2 border-l-2 border-white/60 [transform:translateZ(40px)] animate-[spin_5s_linear_infinite_reverse]" />

        {/* Center Eye / Core */}
        <div className="absolute inset-0 flex items-center justify-center [transform:translateZ(60px)]">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.8)] sm:h-20 sm:w-20">
            <ScanEye size={32} className="text-white" />
            <div className="absolute inset-0 animate-ping rounded-full border border-blue-400 opacity-20 duration-1000" />
            {/* Soft scanning beam */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="h-full w-full animate-[scan_2s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-white/40 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
