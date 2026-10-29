"use client";

import { useEffect, useRef, useState } from "react";
import { resolve } from "@/lib/realtime/anchors";
import { colorHex } from "@/lib/realtime/names";
import { seaCursors } from "@/lib/sea";
import { CursorGlyph, TouchGlyph } from "./CursorGlyph";
import { type Edges, EdgeIndicators } from "./EdgeIndicators";
import { useMultiplayer } from "./MultiplayerProvider";

/** At most this many cursors are drawn; everyone else is only counted. */
const MAX_DRAWN = 10;
/** Share of the remaining distance covered each frame. */
const LERP = 0.25;
const IDLE_AFTER = 10_000;
// Opacity steps: live, idle (still for 10 s), away (tab hidden).
const OPACITY = { live: 1, idle: 0.6, away: 0.3 };

type Anim = { x: number; y: number; placed: boolean };

const NO_EDGES: Edges = { above: [], below: [] };
const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id, i) => id === b[i]);

/**
 * Everyone else's cursors, over the page and under the nav and dock, plus
 * edge indicators for the ones scrolled out of view.
 *
 * React only adds and removes one element per visitor; positions are written
 * straight to `transform` by a frame loop that runs only while something is
 * still gliding, and is woken by new events, scrolls and resizes. Under
 * reduced motion cursors snap to each new point, and no loop runs.
 */
export function CursorLayer() {
  const { connected, hideOthers, peers, peersRef, cursorsRef, subscribeCursors } = useMultiplayer();
  const elements = useRef(new Map<string, HTMLDivElement>());
  const anims = useRef(new Map<string, Anim>());
  const [edges, setEdges] = useState<Edges>(NO_EDGES);
  const active = connected && !hideOthers;

  useEffect(() => {
    if (!active) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const draw = () => {
      frame = 0;
      const now = performance.now();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      let gliding = false;

      // Resolve every target on this layout, then keep the ones nearest the viewport.
      const targets: { id: string; x: number; y: number; distance: number }[] = [];
      for (const [id, cursor] of cursorsRef.current) {
        const point = resolve(cursor);
        if (!point) continue;
        const distance = point.y < 0 ? -point.y : point.y > vh ? point.y - vh : 0;
        targets.push({ id, ...point, distance });
      }
      targets.sort((a, b) => a.distance - b.distance);
      const drawn = new Map(targets.slice(0, MAX_DRAWN).map((t) => [t.id, t]));

      // Off-screen ones, nearest first. Away visitors are frozen: not worth chasing.
      const above: string[] = [];
      const below: string[] = [];
      for (const t of drawn.values()) {
        if (t.distance === 0 || peersRef.current.get(t.id)?.away !== false) continue;
        (t.y < 0 ? above : below).push(t.id);
      }
      setEdges((prev) => (sameIds(prev.above, above) && sameIds(prev.below, below) ? prev : { above, below }));

      for (const [id, el] of elements.current) {
        const target = drawn.get(id);
        const cursor = cursorsRef.current.get(id);
        const peer = peersRef.current.get(id);
        if (!target || !cursor || !peer) {
          el.style.opacity = "0";
          anims.current.delete(id);
          seaCursors.delete(id);
          continue;
        }

        let anim = anims.current.get(id);
        if (!anim) {
          anim = { x: target.x, y: target.y, placed: false };
          anims.current.set(id, anim);
        }
        if (reduced.matches || !anim.placed) {
          anim.x = target.x;
          anim.y = target.y;
          anim.placed = true;
        } else {
          anim.x += (target.x - anim.x) * LERP;
          anim.y += (target.y - anim.y) * LERP;
          if (Math.abs(target.x - anim.x) > 0.5 || Math.abs(target.y - anim.y) > 0.5) gliding = true;
          else {
            anim.x = target.x;
            anim.y = target.y;
          }
        }

        const onScreen = anim.x >= -40 && anim.x <= vw + 40 && anim.y >= -40 && anim.y <= vh + 40;
        const opacity = peer.away ? OPACITY.away : now - cursor.movedAt > IDLE_AFTER ? OPACITY.idle : OPACITY.live;
        el.style.opacity = onScreen ? String(opacity) : "0";
        el.style.transform = `translate3d(${anim.x}px, ${anim.y}px, 0)`;

        // Remote pointers stir the sea too (touch markers don't: they aren't hands).
        if (onScreen && cursor.device === "pointer") seaCursors.set(id, { x: anim.x, y: anim.y });
        else seaCursors.delete(id);
      }

      if (gliding && !reduced.matches) frame = requestAnimationFrame(draw);
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    const unsubscribe = subscribeCursors(wake);
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    // Idle fades and away dims change without any event; check once a second.
    const tick = setInterval(wake, 1_000);
    wake();

    const sea = seaCursors;
    const ids = elements.current;
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(tick);
      unsubscribe();
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      for (const id of ids.keys()) sea.delete(id);
      setEdges(NO_EDGES);
    };
    // `peers` re-runs this when cursor elements mount or unmount.
  }, [active, peers, cursorsRef, peersRef, subscribeCursors]);

  if (!active) return null;

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
        {peers.map(({ visitor, device }) => (
          <div
            key={visitor.id}
            ref={(el) => {
              if (el) elements.current.set(visitor.id, el);
              else {
                elements.current.delete(visitor.id);
                anims.current.delete(visitor.id);
                seaCursors.delete(visitor.id);
              }
            }}
            className="absolute top-0 left-0 opacity-0 transition-opacity duration-300 will-change-transform"
          >
            {device === "touch" ? (
              <TouchGlyph name={visitor.name} color={colorHex(visitor.color)} />
            ) : (
              // Nudged so the arrow's tip, not its box, sits on the point.
              <CursorGlyph name={visitor.name} color={colorHex(visitor.color)} className="-mt-[1.5px] -ml-[2px]" />
            )}
          </div>
        ))}
      </div>
      {/* Outside the aria-hidden layer: these are real buttons. */}
      <EdgeIndicators edges={edges} />
    </>
  );
}
