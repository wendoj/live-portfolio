"use client";

import { useEffect, useRef, useState } from "react";
import { AsciiScene } from "@/components/sea/AsciiScene";
import { anglerRodTip, anglerfish, crab, kelpForest, whale } from "@/lib/ascii-scenes";
import { cn } from "@/lib/utils";

/**
 * Creatures of the deeper zones, drawn as text (no canvas). All decorative
 * (aria-hidden). Their CSS animations only run while on screen: the wrapper
 * sets data-playing, and globals.css pauses everything inside without it.
 */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, inView] as const;
}

// 28 one-second frames: the whale spouts once, about halfway across.
const WHALE_FRAMES = [...Array(13).fill(whale[0]), whale[1], whale[1], ...Array(13).fill(whale[0])];

/**
 * Twilight zone: a large, faint whale crosses behind Projects once per visit,
 * the first time the section comes into view. Faint on purpose (well under
 * 2:1), so it never competes with the text it passes behind.
 */
export function WhalePass({ className }: { className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  // Latches, so it crosses once per visit (pausing while off screen).
  const [go, setGo] = useState(false);
  if (inView && !go) setGo(true);

  return (
    <div
      ref={ref}
      aria-hidden
      data-playing={inView || undefined}
      className={cn("zone-life pointer-events-none absolute inset-x-0 [container-type:inline-size]", className)}
    >
      <div data-go={go || undefined} className="whale absolute top-0 left-0">
        <AsciiScene
          frames={WHALE_FRAMES}
          interval={1000}
          className="text-[clamp(11px,1.4vw,17px)] leading-[1.15] text-reef opacity-[0.14] dark:opacity-[0.22]"
        />
      </div>
    </div>
  );
}

/**
 * Midnight zone: an anglerfish whose lure pulses. By night the lure is the
 * brightest thing in the zone and lights a little water around it.
 */
export function Anglerfish({ className }: { className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} aria-hidden data-playing={inView || undefined} className={cn("zone-life pointer-events-none", className)}>
      <div className="relative inline-block font-mono text-[9px] leading-[1.2] sm:text-[10px]">
        {/* The lure's light, by night only. */}
        <span
          className="absolute hidden size-[14em] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.85_0.12_195/0.2),transparent)] dark:block"
          style={{ left: `${anglerRodTip[1] + 0.5}ch`, top: `${(anglerRodTip[0] + 1.5) * 1.2}em` }}
        />
        {/* The lure hangs just below the rod's tip. */}
        <span
          className="lure absolute text-[1.6em] leading-none font-bold text-lure"
          style={{ left: `${(anglerRodTip[1] - 0.2) / 1.6}ch`, top: `${((anglerRodTip[0] + 1) * 1.2) / 1.6}em` }}
        >
          ●
        </span>
        <AsciiScene
          frames={anglerfish}
          interval={700}
          className="angler text-[1em] leading-[1.2] font-bold text-reef/80 dark:text-[oklch(0.5_0.06_235)]"
        />
      </div>
    </div>
  );
}

/**
 * The seabed along the bottom of Contact: sand ripples, kelp at both ends
 * and a crab that scuttles sideways now and then. Light glyphs, since it sits
 * on the sea panel.
 */
export function Seabed({ className }: { className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      aria-hidden
      data-playing={inView || undefined}
      className={cn("zone-life pointer-events-none absolute inset-x-0 bottom-0 font-mono", className)}
    >
      <AsciiScene
        frames={kelpForest}
        interval={900}
        className="absolute bottom-5 left-[4%] text-[13px] text-[oklch(0.86_0.11_150)] opacity-80 dark:text-kelp"
      />
      <AsciiScene
        frames={kelpForest}
        interval={1100}
        className="absolute right-[6%] bottom-5 text-[13px] text-[oklch(0.86_0.11_150)] opacity-80 max-sm:hidden dark:text-kelp"
      />
      <div className="crab absolute bottom-4 left-[18%]">
        <AsciiScene frames={crab} interval={220} className="text-[12px] font-semibold text-[oklch(0.86_0.1_45)] dark:text-sand-coral" />
      </div>
      <div className="h-6 overflow-hidden text-[13px] leading-6 whitespace-nowrap text-sand/80">
        {"~-._.-~'`~-._.-~-._.~'`~-._".repeat(16)}
      </div>
    </div>
  );
}
