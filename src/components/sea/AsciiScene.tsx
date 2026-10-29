"use client";

import { useEffect, useRef, useState } from "react";
import type { AsciiFrames } from "@/lib/ascii-scenes";
import { cn } from "@/lib/utils";

/**
 * Plays an ASCII scene's frames on a loop, only while it is on screen.
 * Decorative (aria-hidden); holds frame 0 under reduced motion.
 */
export function AsciiScene({
  frames,
  interval = 500,
  className,
}: {
  frames: AsciiFrames;
  interval?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [frame, setFrame] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || frames.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % frames.length), interval);
    return () => window.clearInterval(id);
  }, [visible, frames.length, interval]);

  return (
    <span
      ref={ref}
      aria-hidden
      className={cn("block font-mono text-[11px] leading-[1.15] whitespace-pre select-none", className)}
    >
      {frames[frame].join("\n")}
    </span>
  );
}
