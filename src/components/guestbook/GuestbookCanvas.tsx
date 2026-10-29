"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMultiplayer } from "@/components/multiplayer/MultiplayerProvider";
import { apiAvailable, getJson, postJson } from "@/lib/api";
import { guestbook as copy } from "@/lib/content";
import { GRID_SIZE, PALETTE, SEED_ART } from "@/lib/guestbook";
import type { DoodleEvt } from "@/lib/realtime/types";
import { cn } from "@/lib/utils";
import { PalettePicker } from "./PalettePicker";
import { CanvasPixels } from "./StaticCanvas";

const CELLS = GRID_SIZE * GRID_SIZE;
/** Ink: 30 pixels, refilling continuously over a minute. */
const INK_MAX = 30;
const INK_REFILL_MS = 60_000;
/** A stroke is sent in batches this far apart, one request at a time. */
const FLUSH_MS = 200;

const setCell = (cells: string, i: number, c: number) => cells.slice(0, i) + c + cells.slice(i + 1);
const setMany = (cells: string, pixels: Iterable<[number, number]>) => {
  const next = [...cells];
  for (const [i, c] of pixels) next[i] = String(c);
  return next.join("");
};

/** The cells on the line from `a` to `b` (Bresenham), excluding `a`, so fast drags don't skip. */
function lineCells(a: number, b: number) {
  let x = a % GRID_SIZE;
  let y = Math.floor(a / GRID_SIZE);
  const x1 = b % GRID_SIZE;
  const y1 = Math.floor(b / GRID_SIZE);
  const dx = Math.abs(x1 - x);
  const dy = -Math.abs(y1 - y);
  const sx = x < x1 ? 1 : -1;
  const sy = y < y1 ? 1 : -1;
  let err = dx + dy;
  const out: number[] = [];
  while (x !== x1 || y !== y1) {
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
    out.push(y * GRID_SIZE + x);
  }
  return out;
}

/**
 * The shared 32 × 32 guestbook.
 *
 * Painting is optimistic: pixels change at once and are queued, then sent
 * as one POST /doodle per batch (every 200 ms while dragging, one request
 * in flight at a time), so a stroke doesn't become a request per cell. The
 * Lambda broadcasts every confirmed batch (with a version number) on the
 * server channel, so everyone's canvas converges; a gap in versions means
 * an event was missed, and the whole grid is refetched.
 * Without the API it shows the seed art, read-only.
 */
export function GuestbookCanvas() {
  const { connected, subscribeDoodle } = useMultiplayer();
  const [cells, setCells] = useState(SEED_ART);
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(!apiAvailable);
  const [colour, setColour] = useState(2);
  const [focus, setFocus] = useState(Math.floor(CELLS / 2) + GRID_SIZE / 2);
  const [ink, setInk] = useState(INK_MAX);
  const [announcement, setAnnouncement] = useState("");
  const version = useRef(0);
  const inkState = useRef({ value: INK_MAX, at: 0 });
  const painting = useRef(false);
  const lastPainted = useRef(-1);
  // Our pixels the server hasn't confirmed yet, laid over anything it sends.
  const pending = useRef(new Map<number, number>());
  const inflight = useRef(new Map<number, number>());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const withOurs = useCallback(
    (cells: string) => setMany(setMany(cells, inflight.current), pending.current),
    [],
  );

  const refetch = useCallback(async () => {
    const state = await getJson<{ cells: string; version: number }>("/doodle");
    if (!state || state.cells.length !== CELLS) {
      setFailed(true);
      return;
    }
    setFailed(false);
    version.current = state.version;
    setCells(withOurs(state.cells));
    setLive(true);
  }, [withOurs]);

  const flush = useCallback(() => {
    clearTimeout(flushTimer.current);
    flushTimer.current = undefined;
    const send = () => {
      if (inflight.current.size > 0 || pending.current.size === 0) return;
      inflight.current = pending.current;
      pending.current = new Map();
      void postJson<{ version: number }>("/doodle", { pixels: [...inflight.current] }).then((res) => {
        inflight.current = new Map();
        // Rejected or offline: the server's grid replaces our optimistic pixels.
        if (!res) void refetch();
        send();
      });
    };
    send();
  }, [refetch]);

  const scheduleFlush = () => {
    flushTimer.current ??= setTimeout(flush, FLUSH_MS);
  };

  // Don't drop a half-sent stroke when the canvas unmounts.
  useEffect(() => flush, [flush]);

  // Load once idle, and again after every reconnect (events may have been missed).
  useEffect(() => {
    if (!apiAvailable) return;
    const idle =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(() => void refetch(), { timeout: 2_000 })
        : setTimeout(() => void refetch(), 300);
    return () => {
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idle as number);
      else clearTimeout(idle);
    };
  }, [refetch]);

  // Only a *re*connection can have missed events; the first connection can't.
  const connections = useRef(0);
  useEffect(() => {
    if (!connected) return;
    connections.current += 1;
    if (connections.current === 1 || !live) return;
    const t = setTimeout(() => void refetch(), 0);
    return () => clearTimeout(t);
    // `live` is read, not watched: going live mustn't count as a reconnect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, refetch]);

  // Confirmed pixels from everyone (including our own, echoed back).
  useEffect(
    () =>
      subscribeDoodle((evt: DoodleEvt) => {
        if (evt.type === "doodle-reset") {
          version.current = evt.version;
          setCells(evt.cells);
          return;
        }
        if (evt.version > version.current + 1) return void refetch();
        version.current = Math.max(version.current, evt.version);
        setCells((prev) => withOurs(setMany(prev, evt.pixels)));
      }),
    [subscribeDoodle, refetch, withOurs],
  );

  // Ink refills continuously; the meter ticks while it's below full.
  const currentInk = () => {
    const now = performance.now();
    const s = inkState.current;
    const refilled = Math.min(INK_MAX, s.value + ((now - s.at) * INK_MAX) / INK_REFILL_MS);
    inkState.current = { value: refilled, at: now };
    return refilled;
  };
  useEffect(() => {
    if (ink >= INK_MAX) return;
    const t = setInterval(() => setInk(Math.floor(currentInk())), 1_000);
    return () => clearInterval(t);
  }, [ink]);

  const paint = (i: number) => {
    if (!live || i < 0 || i >= CELLS) return;
    if (pending.current.has(i) ? pending.current.get(i) === colour : cells[i] === String(colour)) return;
    if (currentInk() < 1) return;
    inkState.current.value -= 1;
    setInk(Math.floor(inkState.current.value));

    pending.current.set(i, colour);
    setCells((prev) => setCell(prev, i, colour));
    const name = PALETTE[colour].name;
    setAnnouncement(copy.painted(i % GRID_SIZE, Math.floor(i / GRID_SIZE), name));
    scheduleFlush();
  };

  const cellAt = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * GRID_SIZE);
    const y = Math.floor(((e.clientY - r.top) / r.height) * GRID_SIZE);
    if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return -1;
    return y * GRID_SIZE + x;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const x = focus % GRID_SIZE;
    const y = Math.floor(focus / GRID_SIZE);
    const move: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (move[e.key]) {
      e.preventDefault();
      const [dx, dy] = move[e.key];
      const nx = Math.min(GRID_SIZE - 1, Math.max(0, x + dx));
      const ny = Math.min(GRID_SIZE - 1, Math.max(0, y + dy));
      setFocus(ny * GRID_SIZE + nx);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      paint(focus);
      flush();
    } else if (/^[0-7]$/.test(e.key)) {
      setColour(Number(e.key));
    }
  };

  const inkLeft = Math.min(INK_MAX, ink);

  return (
    <>
      <div
        role="application"
        tabIndex={live ? 0 : -1}
        aria-label={copy.canvasLabel}
        aria-describedby="guestbook-instructions"
        aria-disabled={!live}
        onKeyDown={live ? onKeyDown : undefined}
        className="group/canvas rounded-[16px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <svg
          aria-hidden
          viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
          shapeRendering="crispEdges"
          className={cn("block aspect-square w-full touch-none rounded-[16px] bg-muted", live && "cursor-crosshair")}
          onPointerDown={(e) => {
            if (!live) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            painting.current = true;
            const i = cellAt(e);
            lastPainted.current = i;
            if (i >= 0) {
              setFocus(i);
              paint(i);
            }
          }}
          onPointerMove={(e) => {
            if (!painting.current) return;
            const i = cellAt(e);
            if (i < 0 || i === lastPainted.current) return;
            const from = lastPainted.current;
            lastPainted.current = i;
            for (const cell of from < 0 ? [i] : lineCells(from, i)) paint(cell);
          }}
          onPointerUp={() => {
            painting.current = false;
            flush();
          }}
          onPointerCancel={() => {
            painting.current = false;
            flush();
          }}
        >
          <CanvasPixels cells={cells} />
          {/* Keyboard selection, shown only while the canvas has keyboard focus. */}
          <rect
            x={(focus % GRID_SIZE) + 0.05}
            y={Math.floor(focus / GRID_SIZE) + 0.05}
            width="0.9"
            height="0.9"
            fill="none"
            stroke="var(--foreground)"
            strokeWidth="0.1"
            className="opacity-0 group-focus-visible/canvas:opacity-100"
          />
        </svg>
      </div>

      <p id="guestbook-instructions" className="sr-only">
        {copy.instructions}
      </p>
      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-3 pb-1">
        <PalettePicker value={colour} onChange={setColour} disabled={!live} />
        <span
          className="label-mono text-muted-foreground tabular-nums"
          aria-label={copy.inkLabel(inkLeft, INK_MAX)}
        >
          {copy.ink(inkLeft, INK_MAX)}
        </span>
      </div>
      {!live && failed && (
        <p className="px-1 pt-1 text-xs text-muted-foreground">{copy.offline}</p>
      )}
    </>
  );
}
