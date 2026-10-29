"use client";

import { ArrowDownIcon, ArrowUpIcon, SmartphoneIcon } from "lucide-react";
import { multiplayer } from "@/lib/content";
import { resolve } from "@/lib/realtime/anchors";
import { visitorColor } from "@/lib/realtime/names";
import { cn } from "@/lib/utils";
import { useMultiplayer } from "./MultiplayerProvider";

/** Visitor ids scrolled out of view, nearest first. */
export type Edges = { above: string[]; below: string[] };

const MAX_PER_EDGE = 3;
const { edge: copy } = multiplayer;

const pill =
  "flex h-6 items-center gap-1 rounded-full px-2 text-[11px] leading-none font-medium tracking-[-0.01em] whitespace-nowrap shadow-sm";

/**
 * Coloured pills pinned under the nav (for visitors above you) and above the
 * dock (below you). Clicking one brings their cursor to the middle of the
 * screen. The CursorLayer works out who is off-screen in its draw pass.
 */
export function EdgeIndicators({ edges }: { edges: Edges }) {
  const { peers, cursorsRef } = useMultiplayer();
  const byId = new Map(peers.map((p) => [p.visitor.id, p]));

  const scrollTo = (id: string) => {
    const cursor = cursorsRef.current.get(id);
    const point = cursor && resolve(cursor);
    if (!point) return;
    const smooth = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    window.scrollTo({
      top: window.scrollY + point.y - window.innerHeight / 2,
      behavior: smooth ? "smooth" : "instant",
    });
  };

  const row = (ids: string[], side: "above" | "below") => {
    const visible = ids.slice(0, MAX_PER_EDGE);
    const more = ids.length - visible.length;
    if (!visible.length) return null;
    const Arrow = side === "above" ? ArrowUpIcon : ArrowDownIcon;

    return (
      <ul
        aria-label={side === "above" ? copy.aboveLabel : copy.belowLabel}
        className={cn(
          "pointer-events-none fixed left-1/2 z-30 flex -translate-x-1/2 gap-1.5",
          side === "above" ? "top-[84px]" : "bottom-[calc(env(safe-area-inset-bottom)+72px)] md:bottom-[84px]",
        )}
      >
        {visible.map((id) => {
          const peer = byId.get(id);
          if (!peer) return null;
          const { name, color } = peer.visitor;
          return (
            <li
              key={id}
              className={cn(
                "animate-in duration-150 fade-in-0",
                side === "above" ? "motion-safe:slide-in-from-top-1" : "motion-safe:slide-in-from-bottom-1",
              )}
            >
              <button
                type="button"
                onClick={() => scrollTo(id)}
                aria-label={copy.scrollTo(name)}
                className={cn(
                  pill,
                  "pointer-events-auto cursor-pointer outline-none transition-[scale] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.96]",
                )}
                style={{ backgroundColor: visitorColor(color).hex, color: visitorColor(color).ink }}
              >
                <Arrow aria-hidden className="size-3 stroke-[2.5]" />
                {peer.device === "touch" && <SmartphoneIcon aria-hidden className="size-3 stroke-[2.25]" />}
                {name}
              </button>
            </li>
          );
        })}
        {more > 0 && (
          <li className={cn(pill, "bg-foreground/80 text-white tabular-nums")}>
            <span aria-hidden>{copy.more(more)}</span>
            <span className="sr-only">{copy.moreLabel(more)}</span>
          </li>
        )}
      </ul>
    );
  };

  return (
    <>
      {row(edges.above, "above")}
      {row(edges.below, "below")}
    </>
  );
}
