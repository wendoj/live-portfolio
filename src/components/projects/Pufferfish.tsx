"use client";

import { useEffect, useRef, useState } from "react";
import { AsciiSea } from "@/components/sea/AsciiSea";
import { pufferIdle, pufferfish } from "@/lib/ascii-scenes";
import { thisSite } from "@/lib/content";
import { emitSeaBurst } from "@/lib/sea";
import { cn } from "@/lib/utils";

const PUFF_MS = 80; // per frame on the way up: a quick gulp
const DEFLATE_MS = 160; // per frame on the way down: a slower exhale
const AUTO_DEFLATE_MS = 1500; // touch and keyboard have no "leave"
const IDLE_MS = 420; // fin flutter while deflated

/**
 * "This portfolio" media: an ASCII pufferfish on a small live sea (the hero's
 * AsciiSea: caustics, bubbles, a few fish, everyone's cursor ripples). It
 * puffs up on hover, letting out a burst of bubbles. Touch and keyboard press
 * it instead (it's a button), and it deflates by itself.
 * Under reduced motion it swaps straight between deflated and puffed, with no
 * in-between frames, flutter or bob.
 */
export function Pufferfish() {
  const [frame, setFrame] = useState(0); // 0 deflated … 2 puffed
  const [flutter, setFlutter] = useState(false);
  const artRef = useRef<HTMLSpanElement>(null);
  const target = useRef(0);
  const current = useRef(0);
  const stepTimer = useRef(0);
  const autoTimer = useRef(0);
  const pointerType = useRef<string>("");

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Steps one frame at a time towards `target`. */
  function run(to: number) {
    target.current = to;
    window.clearTimeout(stepTimer.current);
    if (reduced()) {
      current.current = to;
      setFrame(to);
      return;
    }
    const step = () => {
      const f = current.current;
      if (f === target.current) return;
      const next = f + Math.sign(target.current - f);
      current.current = next;
      setFrame(next);
      if (next !== target.current) stepTimer.current = window.setTimeout(step, target.current > f ? PUFF_MS : DEFLATE_MS);
    };
    step();
  }

  function puff() {
    window.clearTimeout(autoTimer.current);
    if (target.current !== 2 && artRef.current) {
      // A burst of bubbles from the fish, drawn by the sea canvas behind it.
      const r = artRef.current.getBoundingClientRect();
      emitSeaBurst(r.left + r.width / 2, r.top + r.height / 2);
    }
    run(2);
  }

  function deflate() {
    window.clearTimeout(autoTimer.current);
    run(0);
  }

  // Fin flutter while deflated.
  useEffect(() => {
    if (frame !== 0 || reduced()) return;
    const id = window.setInterval(() => setFlutter((f) => !f), IDLE_MS);
    return () => window.clearInterval(id);
  }, [frame]);

  useEffect(
    () => () => {
      window.clearTimeout(stepTimer.current);
      window.clearTimeout(autoTimer.current);
    },
    [],
  );

  const lines = frame === 0 && flutter ? pufferIdle : pufferfish[frame];

  return (
    <button
      type="button"
      aria-label={thisSite.puffLabel}
      onPointerDown={(e) => (pointerType.current = e.pointerType)}
      onPointerEnter={(e) => e.pointerType === "mouse" && puff()}
      onPointerLeave={(e) => e.pointerType === "mouse" && deflate()}
      onClick={() => {
        // A mouse already puffed it on hover; touch and keyboard puff on press.
        if (pointerType.current === "mouse") return;
        pointerType.current = "";
        puff();
        autoTimer.current = window.setTimeout(deflate, AUTO_DEFLATE_MS);
      }}
      className="group/puffer relative isolate flex size-full cursor-pointer items-center justify-center overflow-hidden bg-[linear-gradient(180deg,var(--puffer-sea-top),var(--puffer-sea-bottom))] focus-visible:outline-offset-[-4px]"
    >
      {/* The sea, calmer right behind the fish. */}
      <AsciiSea
        sharks={0}
        fish={6}
        className="[mask-image:radial-gradient(ellipse_34%_38%_at_50%_48%,transparent_30%,black_100%)]"
      />

      <span
        ref={artRef}
        aria-hidden
        className={cn(
          "puffer relative block font-mono text-[clamp(6px,1.9vw,12px)] leading-[1.2] font-bold whitespace-pre text-puffer-on-sea select-none [text-shadow:0_1px_0_oklch(0.3_0.08_220/0.6),0_0_14px_oklch(0.3_0.08_220/0.4)]",
          frame === 2 && "puffer--full",
        )}
      >
        {lines.join("\n")}
      </span>

      <span
        aria-hidden
        className="label-mono absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 [text-shadow:0_1px_10px_oklch(0.35_0.1_215/0.6)]"
      >
        <span className="[@media(hover:hover)]:hidden">Tap to puff</span>
        <span className="hidden [@media(hover:hover)]:inline">Hover to puff</span>
      </span>
    </button>
  );
}
