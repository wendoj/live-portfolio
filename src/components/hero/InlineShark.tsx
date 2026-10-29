"use client";

import { useEffect, useState } from "react";

/**
 * A small ASCII shark that swims in place after "Hi, I'm": its tail beats
 * through three frames and it bobs gently. Sized in em, so it scales with the
 * heading. Decorative (aria-hidden); one still frame under reduced motion.
 */
const FRAMES = [
  ["       |\\      ", "\\`-.__/  `-.__ ", "/_.-'`--.._.,-o>"],
  ["       |\\      ", "-`-.__/  `-.__ ", "-_.-'`--.._.,-o>"],
  ["       |\\      ", "/`-.__/  `-.__ ", "\\_.-'`--.._.,-o>"],
];
const ORDER = [0, 1, 2, 1];
const FRAME_MS = 180;

export function InlineShark() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % ORDER.length), FRAME_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span aria-hidden className="inline-shark mx-[0.18em] inline-block align-[0.08em]">
      <span className="block font-mono text-[0.22em] leading-[1.05] font-bold tracking-normal whitespace-pre text-white [text-shadow:0_1px_10px_oklch(0.35_0.12_235/0.5)]">
        {FRAMES[ORDER[step]].join("\n")}
      </span>
    </span>
  );
}
