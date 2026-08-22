import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function ShinyText({ text, disabled = false, speed = 3, className = "" }) {
  const animationDuration = `${speed}s`;

  return (
    <div
      className={`text-slate-800 dark:text-slate-200 bg-clip-text inline-block ${
        disabled ? "" : "animate-shine"
      } ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 60%)",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        animationDuration: animationDuration,
      }}
    >
      {text}
    </div>
  );
}

export function GlitchText({ text, className = "" }) {
  const [isHovering, setIsHovering] = useState(false);

  const containerVariants = {
    initial: { opacity: 1 },
    hover: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.04 },
    }),
  };

  const childVariants = {
    initial: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      color: "inherit",
    },
    hover: {
      opacity: 1,
      y: -6,
      filter: "blur(1px)",
      color: "var(--color-blue-400, #22d3ee)", // Bright cyber teal highlight on wave
      transition: {
        type: "spring",
        damping: 10,
        stiffness: 200,
      },
    },
  };

  return (
    <motion.span
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`inline-flex overflow-visible cursor-default ${className}`}
      variants={containerVariants}
      initial="initial"
      animate={isHovering ? "hover" : "initial"}
    >
      {text.split("").map((char, index) => (
        <motion.span variants={childVariants} key={index} className="inline-block">
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
