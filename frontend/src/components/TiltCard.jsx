import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function TiltCard({ children, className = "", bgClass = "bg-white/80 dark:bg-slate-900/60" }) {
  const ref = useRef(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 40 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 40 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);
  
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors duration-300 ${className}`}
    >
      {/* Interactive Glowing Border Background */}
      <div 
        className="absolute inset-0 z-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 overflow-hidden pointer-events-none"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400 dark:from-blue-600 dark:via-indigo-400 dark:to-blue-600 blur-xl"
          style={{
            x: useTransform(x, [-0.5, 0.5], ["-10%", "10%"]),
            y: useTransform(y, [-0.5, 0.5], ["-10%", "10%"]),
          }}
        />
      </div>
      
      {/* Content wrapper with a translucent glassmorphism background to let particles shine through */}
      <div 
        className={`relative z-10 h-full w-full rounded-2xl backdrop-blur-md ${bgClass}`}
        style={{ transform: "translateZ(30px)" }}
      >
        {children}
      </div>
    </motion.div>
  );
}
