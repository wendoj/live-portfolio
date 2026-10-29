"use client";

import { useEffect, useState } from "react";

// Glyphs from the ASCII sea, so the name surfaces out of the water.
const GLYPHS = "·:-~=+*o°#%";
const TICK_MS = 40;
const FIRST_SETTLE_MS = 400;
const SETTLE_STEP_MS = 150;

/**
 * Text that resolves from random ASCII glyphs into the real letters, left to
 * right, once after load (~1.6s for "Wendy Ji."). Skipped under prefers-reduced-motion.
 *
 * Outside the animation it renders plain text, so SSR, crawlers, LCP and the
 * parent's `background-clip: text` all see an ordinary text node. Only while
 * scrambling does it split into per-letter spans: each glyph is overlaid on
 * its invisible real letter (so the line never changes width), and settled
 * letters carry their own `.text-glass`, because Chrome doesn't paint a
 * parent's clipped background into positioned descendants.
 */
export function ScrambleText({ text, delay = 150 }: { text: string; delay?: number }) {
  // null = settled; otherwise the glyph currently shown for that letter.
  const [noise, setNoise] = useState<(string | null)[] | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const letters = [...text];
    const start = performance.now() + delay;
    let lastTick = 0;
    let frame = requestAnimationFrame(function step(now) {
      frame = requestAnimationFrame(step);
      if (now < start || now - lastTick < TICK_MS) return;
      lastTick = now;

      const elapsed = now - start;
      const next = letters.map((c, i) =>
        c === " " || elapsed >= FIRST_SETTLE_MS + i * SETTLE_STEP_MS
          ? null
          : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      );
      if (next.every((g) => g === null)) {
        cancelAnimationFrame(frame);
        setNoise(null);
      } else {
        setNoise(next);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [text, delay]);

  if (!noise) return <>{text}</>;

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {[...text].map((c, i) => (
          <span key={i} className="relative inline-block whitespace-pre">
            <span className={noise[i] ? "invisible" : "text-glass"}>{c}</span>
            {noise[i] && (
              <span className="absolute inset-0 text-center text-white/85">{noise[i]}</span>
            )}
          </span>
        ))}
      </span>
    </>
  );
}
