import { useEffect, useRef, useState } from "react";

// Counts from 0 up to `target` over `duration` ms using an ease-out curve, so a
// KPI reads like an instrument settling on its value. Honors reduced-motion
// (and a zero target) by snapping straight to the final number.
export function useCountUp(target, { duration = 900 } = {}) {
  const end = Number(target) || 0;
  const [value, setValue] = useState(end === 0 ? 0 : null);
  const frame = useRef(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || end === 0) {
      setValue(end);
      return undefined;
    }

    let start = null;
    const tick = (now) => {
      if (start === null) start = now;
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(end * eased));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [end, duration]);

  return value ?? 0;
}
