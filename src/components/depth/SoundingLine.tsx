"use client";

import { useEffect, useRef, useState } from "react";
import { formatDepth } from "@/lib/content";
import { type ZoneMark, trackDepth } from "@/lib/depth";
import { useOverSea } from "@/lib/use-over-sea";
import { cn } from "@/lib/utils";

const ROW = 12; // px per glyph row of the line
const LENGTH = 0.62; // the line's full length, as a share of the viewport height

/**
 * The depth gauge, as a sounding line: a plumb line of ASCII glyphs hanging
 * from the top of the screen, down the left edge, with a sinker at its end
 * and the live depth beside it. The line pays out as you dive (0 at the top
 * of About, full length at the seabed); a knot, labelled with its depth,
 * marks where each deeper zone begins and appears as the sinker passes it.
 *
 * Over the teal Contact panel it turns white, as the nav does over the hero.
 *
 * Hidden over the hero: it drops in when the nav turns into the glass pill
 * (the same useOverSea trigger) and lifts out again on the way back up.
 *
 * The line is one pre-rendered column, revealed with clip-path, and the
 * sinker moves with `translate`, so a scroll frame does no layout. Desktop
 * only (xl); smaller screens get NavDepth. Decorative (aria-hidden).
 */
export function SoundingLine() {
  const overSea = useOverSea();
  const rootRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const sinkerRef = useRef<HTMLDivElement>(null);
  const depthRef = useRef<HTMLSpanElement>(null);
  const zoneRef = useRef<HTMLSpanElement>(null);
  const [rows, setRows] = useState(0);
  const [marks, setMarks] = useState<ZoneMark[]>([]);

  useEffect(() => {
    const size = () => setRows(Math.floor((window.innerHeight * LENGTH) / ROW));
    size();
    window.addEventListener("resize", size);

    let lastDepth = -1;
    let lastZone = "";
    let lastOnSea = false;
    const panel = document.querySelector<HTMLElement>('[data-anchor="contact-panel"]');
    const stop = trackDepth(({ depth, zone, progress }) => {
      const length = progress * window.innerHeight * LENGTH;
      columnRef.current!.style.clipPath = `inset(0 0 calc(100% - ${length}px) 0)`;
      sinkerRef.current!.style.translate = `0 ${length}px`;

      // Over the teal Contact panel, everything turns white (see the
      // group-data-[on-sea] classes). One rect read; the attribute only
      // changes when the state does.
      const sinkerMid = length + 18;
      const r = panel?.getBoundingClientRect();
      const onSea = !!r && sinkerMid > r.top && sinkerMid < r.bottom;
      if (onSea !== lastOnSea) {
        lastOnSea = onSea;
        rootRef.current!.toggleAttribute("data-on-sea", onSea);
      }
      const d = Math.round(depth);
      if (d !== lastDepth) {
        lastDepth = d;
        depthRef.current!.textContent = formatDepth(d);
      }
      if (zone !== lastZone) {
        lastZone = zone;
        zoneRef.current!.textContent = zone.toLowerCase();
      }
    }, setMarks);

    return () => {
      stop();
      window.removeEventListener("resize", size);
    };
  }, []);

  // Glyph rows of the line, with a knot where each deeper zone begins.
  const knots = new Map(marks.map((m) => [Math.round(m.at * rows), m]));
  const lines = Array.from({ length: rows }, (_, r) => knots.get(r));

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={cn(
        "group/line sounding-line pointer-events-none fixed top-0 left-5 z-30 hidden font-mono select-none xl:block min-[1440px]:left-7",
        overSea && "sounding-line--up",
      )}
    >
      <div
        ref={columnRef}
        className="text-[12px] leading-[12px] text-muted-foreground transition-colors duration-200 group-data-[on-sea]/line:text-white/70"
        style={{ clipPath: "inset(0 0 100% 0)" }}
      >
        {lines.map((mark, r) =>
          mark ? (
            <div key={r} className="flex gap-2 whitespace-nowrap">
              <span className="w-[1ch] text-center">┼</span>
              <span className="label-mono text-[10px] leading-[12px] opacity-80 tabular-nums">{formatDepth(mark.depth)}</span>
            </div>
          ) : (
            <div key={r} className="w-[1ch] text-center opacity-60">
              │
            </div>
          ),
        )}
      </div>

      {/* The sinker, and the depth beside it. */}
      <div ref={sinkerRef} className="absolute top-0 left-[-1ch] will-change-[translate]">
        <div className="flex items-start gap-2 text-[12px] leading-[12px]">
          <span className="font-bold whitespace-pre text-sea transition-colors duration-200 group-data-[on-sea]/line:text-white">
            {"╭┴╮\n│▓│\n╰─╯"}
          </span>
          <span className="flex flex-col gap-1 pt-px [text-shadow:0_0_6px_var(--zone-1),0_0_2px_var(--zone-1)] group-data-[on-sea]/line:[text-shadow:0_1px_12px_oklch(0.4_0.1_215/0.55)]">
            <span
              ref={depthRef}
              className="label-mono text-[11px] leading-none font-semibold whitespace-nowrap text-foreground tabular-nums transition-colors duration-200 group-data-[on-sea]/line:text-white"
            >
              0 m
            </span>
            <span
              ref={zoneRef}
              className="label-mono text-[10px] leading-none whitespace-nowrap text-muted-foreground lowercase transition-colors duration-200 group-data-[on-sea]/line:text-white/80"
            >
              surface
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
