"use client";

import { useEffect, useRef } from "react";
import { emitSeaBurst, onSeaBurst, seaCursors } from "@/lib/sea";
import { cn } from "@/lib/utils";

const FPS = 30;
const WAKE_DECAY = 0.94; // per frame: how fast a cursor's ripple settles
const FRAME_BUDGET_MS = 6;

// Glyph rows in the atlas. Water and bubbles are light glyphs on the blue;
// sharks and fish are "ink": dark glyphs, like shadows seen through shallow water.
const WATER = " .·:-~=+";
const INK = " .:-=+*#%@<>";
const INK_LEVELS = 10; // the shading ramp is INK[1..9]; "<" and ">" draw fish
const BUBBLE = "·°oO~-";
const ATLAS_ROWS = [
  { chars: WATER, rgb: "255,255,255", alpha: (i: number) => 0.25 + (i / (WATER.length - 1)) * 0.65 },
  { chars: INK, rgb: "8,45,80", alpha: (i: number) => (i < INK_LEVELS ? 0.35 + (i / (INK_LEVELS - 1)) * 0.65 : 0.9) },
  { chars: BUBBLE, rgb: "255,255,255", alpha: () => 0.85 },
  // Foam: the bubble glyphs in teal, for the pale band where the sea meets the white page.
  { chars: BUBBLE, rgb: "56,150,182", alpha: () => 0.75 },
] as const;
const ROW_WATER = 0;
const ROW_INK = 1;
const ROW_BUBBLE = 2;
const ROW_FOAM = 3;
const FISH_HEAD = INK.indexOf(">");
const FISH_TAIL = INK.indexOf("<");

// --- Maths -----------------------------------------------------------------------

function hash(x: number, y: number) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Hashed-lattice value noise: small, deterministic and allocation-free. */
function noise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function clamp(x: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, x));
}

/**
 * Caustic web: distance to the nearest cell edge of a Voronoi pattern whose
 * points orbit slowly. Light focuses along the edges, like sunlight on a pool
 * floor. Returns 0 (on an edge) .. ~1 (cell centre).
 */
function causticEdge(x: number, y: number, t: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let f1 = 9;
  let f2 = 9;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const h = hash(xi + i, yi + j);
      const a = h * 6.283 + t * (0.5 + h);
      const px = xi + i + 0.5 + 0.38 * Math.cos(a);
      const py = yi + j + 0.5 + 0.38 * Math.sin(a * 1.3);
      const d = (px - x) * (px - x) + (py - y) * (py - y);
      if (d < f1) {
        f2 = f1;
        f1 = d;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return Math.sqrt(f2) - Math.sqrt(f1);
}

/** Seeded PRNG, so the opening (and the reduced-motion still) is always the same scene. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inTriangle(px: number, py: number, ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

/**
 * The shark, as a shading function rather than fixed ASCII art, so it can
 * bend, turn and scale smoothly. `u` runs from the nose (0) to the tail tip
 * (1); `y` is height above the body's centreline in body half-heights.
 * Returns ink density 0..1 (0 = water).
 */
function sharkInk(u: number, y: number) {
  if (u < 0 || u > 1.05) return 0;

  // Body: a pointed snout, deepest a third of the way back, tapering to the
  // tail stalk. The belly is flatter than the back, more so under the snout.
  let top: number;
  if (u < 0.32) top = Math.sin((Math.PI / 2) * (u / 0.32)) ** 0.75;
  else if (u < 0.9) top = 0.16 + 0.42 * (1 + Math.cos(Math.PI * ((u - 0.32) / 0.58)));
  else top = 0.16;
  const bottom = top * (u < 0.15 ? 0.6 : 0.8);

  if (u <= 0.95 && y <= top && y >= -bottom) {
    // Countershading: dark back, pale belly, softer at the silhouette.
    const ny = y >= 0 ? y / top : y / bottom;
    let d = 0.3 + 0.7 * ((ny + 1) / 2) ** 0.7;
    if (Math.abs(ny) > 0.8) d *= 0.7;
    // Eye, and three gill slits.
    if (Math.abs(u - 0.08) < 0.012 && Math.abs(ny - 0.3) < 0.25) return 0.05;
    for (const g of [0.2, 0.235, 0.27]) if (Math.abs(u - g) < 0.006 && ny < 0.45 && ny > -0.6) return 0.4;
    return d;
  }

  // Dorsal fin, leaning back, with a concave trailing edge.
  if (u > 0.33 && u < 0.52 && y > 0) {
    const fin = u < 0.47 ? 1.05 * ((u - 0.33) / 0.14) ** 1.2 : 1.05 * ((0.52 - u) / 0.05) ** 0.5;
    if (y <= top + fin) return 0.9;
  }
  // Pectoral fin, swept back under the body.
  if (inTriangle(u, y, 0.24, -0.55, 0.36, -0.55, 0.44, -1.3)) return 0.72;
  // Tail: a long upper lobe and a shorter lower one.
  if (inTriangle(u, y, 0.84, 0.18, 1.04, 1.35, 0.96, -0.05)) return 0.82;
  if (inTriangle(u, y, 0.85, -0.15, 0.99, -0.85, 0.95, 0.05)) return 0.78;
  return 0;
}

// --- Entities --------------------------------------------------------------------

type Shark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Depth 0 (far) .. 1 (near): sets size, opacity, speed and parallax. */
  z: number;
  len: number;
  /** Cruise direction, and the current turn (-1..1; crossing 0 mirrors the body). */
  dir: number;
  turn: number;
  lane: number;
  phase: number;
  /** Tail flick after a startle, 0..1. */
  flick: number;
  mode: "cruise" | "curious" | "flee";
  until: number;
  fromX: number;
  fromY: number;
  nextTurnAt: number;
};

type Fish = { x: number; y: number; vx: number; vy: number };
type Bubble = { x: number; y: number; vx: number; vy: number; size: number; pop: number; age: number; foam: boolean };

type Props = {
  className?: string;
  sharks?: number;
  fish?: number;
  /** Hero only: a rippling waterline near the bottom, with foam below it. */
  surface?: boolean;
  /** Pixels of the canvas that hang below the section, into the next one. */
  overlap?: number;
  /** id of the element (the hero copy) that sharks should swim below. */
  avoid?: string;
};

/**
 * Procedural ASCII sea: caustic light on the water, rising bubbles, a school
 * of fish and a few sharks, all drawn as glyphs on a canvas.
 *
 * Every cursor in `seaCursors` ripples the water and scatters the fish. Sharks
 * are curious: they drift towards a cursor that holds still and dart away
 * from one that moves fast. Clicking a shark startles it and releases a
 * burst of bubbles (via `emitSeaBurst`, so every sea canvas on the page draws it).
 *
 * Decorative only (aria-hidden, no pointer events; clicks are hit-tested from
 * a window listener). Performance: ≤ 30 fps, paused off screen or in a hidden
 * tab, glyphs blitted from a pre-rendered atlas, fewer sharks, coarser cells
 * and no bloom on small screens, and one still frame under reduced motion.
 * The average frame time is exposed as data-frame-ms for profiling.
 */
export function AsciiSea({ className, sharks = 3, fish = 12, surface = false, overlap = 0, avoid }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mono =
      getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim() ||
      "monospace";
    const canBloom = (() => {
      const c = document.createElement("canvas").getContext("2d");
      if (!c || !("filter" in c)) return false;
      c.filter = "blur(1px)";
      return c.filter === "blur(1px)";
    })();

    let width = 0;
    let height = 0;
    let waterH = 0; // the section's own height: canvas height minus the overlap
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let cellW = 7;
    let cellH = 11;
    let small = false;
    let bloom = false;
    let visible = false;
    let frame = 0;
    let last = 0;
    let frameCount = 0;
    let frameTotal = 0;
    let lastT = 0;
    let spawnDebt = 0;
    let foamDebt = 0;
    const start = performance.now();

    // Per-cell buffers. `wake` is the cursor ripple; the ink buffers hold the
    // nearest shark or fish in each cell, so overlapping bodies never double up.
    let wake = new Float32Array(0);
    let inkLevel = new Uint8Array(0);
    let inkAlpha = new Float32Array(0);
    let touched = new Int32Array(0);
    let touchedCount = 0;

    const glyphs = document.createElement("canvas");
    const glyphCtx = glyphs.getContext("2d")!;
    const bloomCanvas = document.createElement("canvas");
    const bloomCtx = bloomCanvas.getContext("2d")!;
    const atlas = document.createElement("canvas");

    let school: Shark[] = [];
    let fishes: Fish[] = [];
    let bubbles: Bubble[] = [];
    const trackers = new Map<string, { x: number; y: number; vx: number; vy: number; t: number; still: number }>();

    function buildAtlas(fontPx: number) {
      const widest = Math.max(...ATLAS_ROWS.map((r) => r.chars.length));
      atlas.width = Math.ceil(widest * cellW * dpr);
      atlas.height = Math.ceil(ATLAS_ROWS.length * cellH * dpr);
      const a = atlas.getContext("2d")!;
      a.setTransform(dpr, 0, 0, dpr, 0, 0);
      a.font = `${fontPx}px ${mono}`;
      a.textAlign = "center";
      a.textBaseline = "middle";
      ATLAS_ROWS.forEach(({ chars, rgb, alpha }, row) => {
        for (let i = 0; i < chars.length; i++) {
          if (chars[i] === " ") continue;
          a.fillStyle = `rgba(${rgb},${alpha(i)})`;
          a.fillText(chars[i], i * cellW + cellW / 2, row * cellH + cellH / 2);
        }
      });
    }

    function populate() {
      const rand = mulberry32(7);
      const count = small ? Math.min(1, sharks) : sharks;
      const base = small ? width * 0.7 : Math.min(width * 0.24, 340);
      school = Array.from({ length: count }, (_, k) => {
        const z = count === 1 ? 0.85 : 1 - k / (count - 1) * 0.65;
        const dir = k % 2 === 0 ? 1 : -1;
        return {
          x: count === 1 ? width * 0.3 : width * (0.12 + (0.76 * k) / (count - 1)) + (rand() - 0.5) * 60,
          y: 0,
          vx: dir * 20,
          vy: 0,
          z,
          len: base * (0.55 + 0.45 * z),
          dir,
          turn: dir,
          lane: count === 1 ? 0.5 : k / (count - 1),
          phase: rand() * 10,
          flick: 0,
          mode: "cruise",
          until: 0,
          fromX: 0,
          fromY: 0,
          nextTurnAt: 12 + rand() * 14,
        };
      });
      // Sharks start in their lanes; the band needs the copy's rectangle.
      const band = bands();
      for (const s of school) s.y = laneY(s, band);

      const fishCount = small ? Math.round(fish * 0.6) : fish;
      const fx = width * (0.25 + rand() * 0.5);
      const fy = waterH * 0.7;
      fishes = Array.from({ length: fishCount }, () => ({
        x: fx + (rand() - 0.5) * 120,
        y: fy + (rand() - 0.5) * 60,
        vx: 60,
        vy: 0,
      }));
      bubbles = [];
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const first = width === 0;
      const prevWidth = width;
      width = rect.width;
      height = rect.height;
      waterH = Math.max(1, height - overlap);
      small = width < 640;
      cellW = small ? 10 : 7;
      cellH = small ? 15 : 11;
      cols = Math.ceil(width / cellW);
      rows = Math.ceil(height / cellH);
      const n = cols * rows;
      wake = new Float32Array(n);
      inkLevel = new Uint8Array(n);
      inkAlpha = new Float32Array(n);
      touched = new Int32Array(n);
      bloom = canBloom && !small;

      for (const c of [canvas!, glyphs]) {
        c.width = Math.round(width * dpr);
        c.height = Math.round(height * dpr);
      }
      // Resizing a canvas resets its state, so the transform goes after.
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      glyphCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bloomCanvas.width = Math.max(1, Math.round(width / 4));
      bloomCanvas.height = Math.max(1, Math.round(height / 4));
      buildAtlas(small ? 13 : 10);
      // Only re-cast the scene when the width really changes (mobile URL bars
      // resize the height constantly).
      if (first || Math.abs(prevWidth - width) > 40) populate();
    }

    /** Vertical band the sharks cruise in, below the hero copy. */
    function bands() {
      const bottom = waterH - (surface ? 110 : 40);
      let copyBottom = 0;
      let copyLeft = 0;
      let copyRight = 0;
      const el = avoid ? document.getElementById(avoid) : null;
      if (el) {
        const c = canvas!.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        copyBottom = r.bottom - c.top;
        copyLeft = r.left - c.left;
        copyRight = r.right - c.left;
      }
      return { top: waterH * (surface ? 0.45 : 0.25), bottom, copyBottom, copyLeft, copyRight };
    }

    function laneY(s: Shark, band: ReturnType<typeof bands>) {
      const h = s.len * 0.14;
      let top = band.top + 1.6 * h;
      // Below the copy where the shark overlaps it horizontally.
      if (band.copyBottom && s.x + s.len * 0.6 > band.copyLeft && s.x - s.len * 0.6 < band.copyRight) {
        top = Math.max(top, band.copyBottom + 2.6 * h);
      }
      const bottom = Math.max(top + 20, band.bottom - 1.9 * h);
      return top + s.lane * (bottom - top);
    }

    /** Fade old ripples, then stamp a fresh one for every cursor and update trackers. */
    function updateCursors(now: number) {
      for (let i = 0; i < wake.length; i++) wake[i] *= WAKE_DECAY;
      const rect = canvas!.getBoundingClientRect();
      for (const key of trackers.keys()) if (!seaCursors.has(key)) trackers.delete(key);

      for (const [key, pos] of seaCursors) {
        const x = pos.x - rect.left;
        const y = pos.y - rect.top;
        let tr = trackers.get(key);
        if (!tr) {
          tr = { x, y, vx: 0, vy: 0, t: now, still: now };
          trackers.set(key, tr);
        }
        const dt = Math.max(16, now - tr.t) / 1000;
        tr.vx += ((x - tr.x) / dt - tr.vx) * 0.35;
        tr.vy += ((y - tr.y) / dt - tr.vy) * 0.35;
        // Positions are canvas-relative, so scrolling alone also "moves" the cursor.
        const speed = Math.hypot(tr.vx, tr.vy);
        if (speed > 40) tr.still = now;
        tr.x = x;
        tr.y = y;
        tr.t = now;

        // The ripple: a soft ellipse stretched along the motion.
        const s = Math.min(1, speed / 1500);
        const r = 70 + 60 * s;
        const dx0 = speed > 1 ? tr.vx / speed : 1;
        const dy0 = speed > 1 ? tr.vy / speed : 0;
        const along = r * (1 + 0.8 * s);
        const across = r * 0.8;
        if (x < -along || y < -along || x > width + along || y > height + along) continue;
        const c0 = Math.max(0, Math.floor((x - along) / cellW));
        const c1 = Math.min(cols - 1, Math.ceil((x + along) / cellW));
        const r0 = Math.max(0, Math.floor((y - along) / cellH));
        const r1 = Math.min(rows - 1, Math.ceil((y + along) / cellH));
        for (let row = r0; row <= r1; row++) {
          for (let col = c0; col <= c1; col++) {
            const dx = col * cellW + cellW / 2 - x;
            const dy = row * cellH + cellH / 2 - y;
            const a = (dx * dx0 + dy * dy0) / along;
            const b = (dy * dx0 - dx * dy0) / across;
            const strength = Math.exp(-(a * a + b * b) * 2.2);
            const i = row * cols + col;
            if (strength > wake[i]) wake[i] = strength;
          }
        }
      }
    }

    /** Parallax: nearer sharks slide further as the page scrolls. */
    function drawY(s: Shark) {
      return s.y - window.scrollY * (0.08 + 0.22 * s.z);
    }

    function updateSharks(t: number, dt: number) {
      const band = bands();
      const range = small ? 260 : 420;
      const now = performance.now();
      for (const s of school) {
        const cruise = (small ? 22 : 26) + 30 * s.z;
        const sy = drawY(s);
        const headX = s.x + s.turn * s.len * 0.3;

        // Nearest cursor.
        let near: { x: number; y: number; speed: number; still: number; d: number } | null = null;
        for (const tr of trackers.values()) {
          const d = Math.hypot(tr.x - headX, tr.y - sy);
          if (d < range && (!near || d < near.d)) {
            near = { x: tr.x, y: tr.y, speed: Math.hypot(tr.vx, tr.vy), still: now - tr.still, d };
          }
        }

        if (near && near.speed > 1100 && near.d < 300) {
          s.mode = "flee";
          s.until = t + 1.5;
          s.fromX = near.x;
          s.fromY = near.y;
        } else if (s.mode === "flee" && t > s.until) {
          s.mode = "cruise";
        }
        if (s.mode !== "flee") s.mode = near && near.still > 1000 ? "curious" : "cruise";

        let wantX: number;
        let wantY: number;
        let accel = 0.8;
        if (s.mode === "flee") {
          const dx = s.x - s.fromX;
          const dy = sy - s.fromY;
          const d = Math.max(1, Math.hypot(dx, dy));
          wantX = (dx / d) * cruise * 3.4;
          wantY = (dy / d) * cruise * 2;
          accel = 4;
        } else if (s.mode === "curious" && near) {
          // Stop at a polite distance, nose towards the cursor.
          const side = s.x < near.x ? -1 : 1;
          const tx = near.x + side * s.len * 0.5;
          const ty = near.y + s.len * 0.04;
          const dx = tx - s.x;
          const dy = ty - sy;
          const d = Math.hypot(dx, dy);
          const v = Math.min(cruise * 1.3, d * 0.9);
          wantX = d > 1 ? (dx / d) * v : 0;
          wantY = d > 1 ? (dy / d) * v : 0;
          accel = 1.2;
          // Face the cursor even while hanging still.
          if (Math.abs(wantX) < 6) wantX = -side * 4;
        } else {
          if (t > s.nextTurnAt) {
            s.dir = -s.dir;
            s.nextTurnAt = t + 12 + Math.random() * 14;
          }
          wantX = s.dir * cruise;
          wantY = (laneY(s, band) + Math.sin(t * 0.35 + s.phase) * 18 - s.y) * 0.5;
        }

        const k = Math.min(1, dt * accel);
        s.vx += (wantX - s.vx) * k;
        s.vy += (wantY - s.vy) * k;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        // Never above the water's upper band or into the waterline.
        s.y = clamp(s.y, band.top * 0.6, band.bottom);

        // Swim off one side, come back on the other.
        const edge = s.len * 0.7;
        if (s.x > width + edge) s.x = -edge;
        else if (s.x < -edge) s.x = width + edge;

        if (Math.abs(s.vx) > 3) s.turn += (Math.sign(s.vx) - s.turn) * Math.min(1, dt * 2.2);
        if (s.mode === "cruise") s.dir = Math.abs(s.vx) > 3 ? Math.sign(s.vx) : s.dir;
        s.flick = Math.max(0, s.flick - dt * 1.1);
        s.phase += dt * (1.6 + Math.hypot(s.vx, s.vy) / 30 + s.flick * 8);
      }
    }

    function updateFish(dt: number) {
      const sep = small ? 26 : 20;
      for (const f of fishes) {
        let cx = 0;
        let cy = 0;
        let ax = 0;
        let ay = 0;
        let sx = 0;
        let sy = 0;
        for (const o of fishes) {
          if (o === f) continue;
          cx += o.x;
          cy += o.y;
          ax += o.vx;
          ay += o.vy;
          const dx = f.x - o.x;
          const dy = f.y - o.y;
          const d = Math.hypot(dx, dy);
          if (d < sep && d > 0) {
            sx += (dx / d) * (sep - d);
            sy += (dy / d) * (sep - d);
          }
        }
        const n = Math.max(1, fishes.length - 1);
        let fx = (cx / n - f.x) * 0.4 + (ax / n - f.vx) * 0.6 + sx * 6;
        let fy = (cy / n - f.y) * 0.4 + (ay / n - f.vy) * 0.6 + sy * 6;

        // Scatter from cursors (harder the faster they move) and from sharks.
        for (const tr of trackers.values()) {
          const dx = f.x - tr.x;
          const dy = f.y - tr.y;
          const d = Math.hypot(dx, dy);
          if (d < 150 && d > 0) {
            const push = (1 - d / 150) * (500 + Math.hypot(tr.vx, tr.vy) * 0.8);
            fx += (dx / d) * push;
            fy += (dy / d) * push;
          }
        }
        for (const s of school) {
          const dx = f.x - s.x;
          const dy = f.y - drawY(s);
          const d = Math.hypot(dx, dy);
          const r = s.len * 0.45;
          if (d < r && d > 0) {
            fx += (dx / d) * (1 - d / r) * 400;
            fy += (dy / d) * (1 - d / r) * 400;
          }
        }
        // Stay in the lower water, above the waterline.
        const lo = waterH * (surface ? 0.55 : 0.3);
        const hi = waterH - (surface ? 120 : 50);
        if (f.y < lo) fy += (lo - f.y) * 3;
        if (f.y > hi) fy -= (f.y - hi) * 3;

        f.vx += fx * dt;
        f.vy += fy * dt;
        // Keep a steady cruising speed, mostly horizontal.
        const speed = Math.hypot(f.vx, f.vy);
        const target = clamp(speed, 50, 260);
        f.vx = (f.vx / (speed || 1)) * target;
        f.vy = (f.vy / (speed || 1)) * target * 0.6;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        if (f.x > width + 30) f.x = -30;
        else if (f.x < -30) f.x = width + 30;
      }
    }

    function updateBubbles(dt: number) {
      // Columns of bubbles rising from below, a few from the sharks' gills.
      spawnDebt += dt * (small ? 1.2 : 2.6);
      while (spawnDebt > 1) {
        spawnDebt -= 1;
        bubbles.push({
          x: Math.random() * width,
          y: waterH - (surface ? 90 : 10) - Math.random() * 60,
          vx: 0,
          vy: -(18 + Math.random() * 24),
          size: 0,
          pop: waterH * (0.04 + Math.random() * 0.3),
          age: Math.random() * 10,
          foam: false,
        });
      }
      if (surface && overlap > 0) {
        // Foam just under the waterline, in the pale band: it fizzes and pops.
        foamDebt += dt * (small ? 1 : 2);
        while (foamDebt > 1) {
          foamDebt -= 1;
          bubbles.push({
            x: Math.random() * width,
            y: waterH - 30 + Math.random() * (overlap - 10),
            vx: (Math.random() - 0.5) * 6,
            vy: -(2 + Math.random() * 4),
            size: Math.random() < 0.3 ? 1 : 0,
            pop: 0,
            age: -(1 + Math.random() * 1.5), // negative: seconds left until it pops
            foam: true,
          });
        }
      }

      for (const b of bubbles) {
        b.age += dt;
        if (b.foam) {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          continue;
        }
        if (b.vx !== 0) {
          // Burst bubbles fan out, then slow and rise.
          b.x += b.vx * dt;
          b.vx *= 1 - Math.min(1, dt * 3);
        }
        b.vy -= 8 * dt; // speed up as they rise
        b.y += b.vy * dt;
        // They grow as they rise and the pressure drops.
        b.size = b.y < waterH * 0.25 ? 2 : b.y < waterH * 0.6 ? 1 : 0;
      }
      bubbles = bubbles.filter((b) => (b.foam ? b.age < 0.6 : b.y > b.pop || b.age < 0.4));
    }

    function burst(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || y < 0 || x > width || y > waterH) return;
      for (let i = 0; i < 16; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 40 + Math.random() * 90;
        bubbles.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v * 0.5 - 30,
          size: Math.floor(Math.random() * 3),
          pop: y - 60 - Math.random() * 160,
          age: 0,
          foam: false,
        });
      }
    }

    /** Rasterise sharks (far to near) and fish into the per-cell ink buffers. */
    function rasteriseInk() {
      for (let k = 0; k < touchedCount; k++) {
        inkLevel[touched[k]] = 0;
        inkAlpha[touched[k]] = 0;
      }
      touchedCount = 0;
      const put = (i: number, level: number, alpha: number) => {
        if (inkLevel[i] === 0) touched[touchedCount++] = i;
        inkLevel[i] = level;
        inkAlpha[i] = alpha;
      };

      const byDepth = [...school].sort((a, b) => a.z - b.z);
      for (const s of byDepth) {
        const L = s.len;
        const H = L * 0.14;
        const sy = drawY(s);
        const pitch = clamp(Math.atan2(s.vy, Math.abs(s.vx) + 20), -0.3, 0.3);
        const f = s.turn >= 0 ? 1 : -1;
        const squash = Math.max(0.1, Math.abs(s.turn));
        const cos = Math.cos(pitch);
        const sin = Math.sin(pitch);
        const amp = 0.3 + s.flick * 0.9;
        const alpha = 0.35 + 0.6 * s.z;

        const reachX = L * 0.62 * squash;
        const reachY = L * 0.62 * Math.abs(sin) + 3.2 * H;
        const c0 = Math.max(0, Math.floor((s.x - reachX) / cellW));
        const c1 = Math.min(cols - 1, Math.ceil((s.x + reachX) / cellW));
        const r0 = Math.max(0, Math.floor((sy - reachY) / cellH));
        const r1 = Math.min(rows - 1, Math.ceil((sy + reachY) / cellH));
        for (let row = r0; row <= r1; row++) {
          const dy = row * cellH + cellH / 2 - sy;
          for (let col = c0; col <= c1; col++) {
            // Squash horizontally while turning, mirror when facing left.
            const dx = (col * cellW + cellW / 2 - s.x) / squash;
            const along = dx * cos * f + dy * sin;
            const up = dx * sin * f - dy * cos;
            const u = 0.5 - along / L;
            // The body swims: a travelling wave that grows towards the tail.
            const bend = amp * Math.sin(s.phase - u * 5) * u * u;
            const y = up / H - bend;
            let d = sharkInk(u, y);
            if (d <= 0) continue;
            // Texture pinned to the body (not the screen), so it doesn't
            // sparkle as the shark moves, and breaks up the shading bands.
            if (d > 0.1) d += (hash(Math.floor(u * 70), Math.floor(y * 3) + 50) - 0.5) * 0.22;
            const level = 1 + clamp(Math.floor(d * (INK_LEVELS - 2)), 0, INK_LEVELS - 2);
            put(row * cols + col, level, alpha);
          }
        }
      }

      for (const fsh of fishes) {
        const col = Math.floor(fsh.x / cellW);
        const row = Math.floor(fsh.y / cellH);
        if (row < 0 || row >= rows) continue;
        // "><>" swimming right, "<><" swimming left: head, body, tail.
        const step = fsh.vx >= 0 ? -1 : 1;
        const cells = fsh.vx >= 0 ? [FISH_HEAD, FISH_TAIL, FISH_HEAD] : [FISH_TAIL, FISH_HEAD, FISH_TAIL];
        for (let k = 0; k < 3; k++) {
          const c = col + k * step;
          if (c < 0 || c >= cols) continue;
          const i = row * cols + c;
          if (inkLevel[i] === 0) put(i, cells[k], 0.55);
        }
      }
    }

    function draw(t: number) {
      const begin = performance.now();
      rasteriseInk();

      const light = bloom ? glyphCtx : ctx!;
      ctx!.clearRect(0, 0, width, height);
      if (bloom) glyphCtx.clearRect(0, 0, width, height);

      const cw = cellW * dpr;
      const ch = cellH * dpr;
      const blit = (target: CanvasRenderingContext2D, row: number, index: number, col: number, r: number) =>
        target.drawImage(atlas, index * cw, row * ch, cw, ch, col * cellW, r * cellH, cellW, cellH);

      // Caustics: a slowly shifting web of light, strongest near the top
      // where the sunlight comes in, and broken into patches by a coarse noise.
      const unit = clamp(width / 14, 70, 120);
      const scroll = window.scrollY;
      const waterRows = Math.min(rows, Math.ceil(waterH / cellH));
      for (let row = 0; row < waterRows; row++) {
        const py = row * cellH + cellH / 2;
        const v = py / waterH;
        const sun = 1 - 0.7 * smoothstep(0, 0.9, v);
        const ny = (py + scroll * 0.15) / unit;
        for (let col = 0; col < cols; col++) {
          const i = row * cols + col;
          if (inkLevel[i] !== 0) continue;
          const nx = (col * cellW + cellW / 2) / unit;
          const w = wake[i];
          const patch = 0.2 + 0.8 * smoothstep(0.35, 0.8, noise(nx * 0.18 - t * 0.02, ny * 0.25));
          // Too dim to draw even on an edge, and no ripple: skip the Voronoi.
          if (patch * sun < 0.12 && w < 0.05) continue;
          // A strong warp keeps the cells from looking like a grid.
          const wx = nx + 0.8 * noise(nx * 0.35 + t * 0.05, ny * 0.35);
          const wy = ny + 0.8 * noise(nx * 0.35 + 4.1, ny * 0.35 - t * 0.05);
          let c = (1 - smoothstep(0, 0.14, causticEdge(wx, wy, t * 0.6))) * patch;
          // A cursor ripple clears its centre and brightens its rim.
          c = c * (1 - w * 0.9) + w * (1 - w) * 2.4;
          const d = c * sun;
          if (d < 0.12) continue;
          const level = 1 + Math.min(WATER.length - 2, Math.floor(d ** 0.7 * (WATER.length - 1)));
          blit(light, ROW_WATER, level, col, row);
        }
      }

      // Bubbles (behind sharks and fish) and foam.
      for (const b of bubbles) {
        const wobble = b.foam ? 0 : Math.sin(b.age * 2.4 + b.x) * 3;
        const c = Math.floor((b.x + wobble) / cellW);
        const r = Math.floor(b.y / cellH);
        if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
        if (inkLevel[r * cols + c] !== 0) continue;
        if (b.foam) {
          // Fizz: "°" then "·" just before it pops.
          blit(ctx!, ROW_FOAM, b.age > -0.25 ? 0 : b.size, c, r);
        } else {
          const popping = b.y <= b.pop;
          blit(light, ROW_BUBBLE, popping ? 1 : b.size, c, r);
        }
      }

      if (surface) {
        // The waterline: a rippling "~" crest, pushed about by cursors.
        const base = waterH - 64;
        for (let col = 0; col < cols; col++) {
          const px = col * cellW;
          let y = base + 5 * Math.sin(px / 70 + t * 1.1) + 3 * Math.sin(px / 29 - t * 1.7);
          const r0 = Math.floor(y / cellH);
          if (r0 >= 0 && r0 < rows) y += wake[r0 * cols + col] * 14;
          const r = Math.floor(y / cellH);
          if (r < 0 || r >= rows) continue;
          blit(ctx!, ROW_FOAM, 4, col, r);
          // Sparse caps one row up.
          if (noise(px / 40 - t * 0.6, 3.3) > 0.72 && r > 0) blit(ctx!, ROW_FOAM, 5, col, r - 1);
        }
      }

      if (bloom) {
        // A blurred quarter-resolution copy of the light glyphs makes them glow.
        bloomCtx.clearRect(0, 0, bloomCanvas.width, bloomCanvas.height);
        bloomCtx.filter = "blur(2px)";
        bloomCtx.drawImage(glyphs, 0, 0, bloomCanvas.width, bloomCanvas.height);
        bloomCtx.filter = "none";
        ctx!.globalAlpha = 0.55;
        ctx!.drawImage(bloomCanvas, 0, 0, width, height);
        ctx!.globalAlpha = 1;
        ctx!.drawImage(glyphs, 0, 0, width, height);
      }

      // Sharks and fish on top, unbloomed: crisp shadows in the water.
      for (let k = 0; k < touchedCount; k++) {
        const i = touched[k];
        ctx!.globalAlpha = inkAlpha[i];
        blit(ctx!, ROW_INK, inkLevel[i], i % cols, Math.floor(i / cols));
      }
      ctx!.globalAlpha = 1;

      frameTotal += performance.now() - begin;
      if (++frameCount === 60) {
        const avg = frameTotal / frameCount;
        canvas!.dataset.frameMs = avg.toFixed(2);
        if (process.env.NODE_ENV !== "production" && avg > FRAME_BUDGET_MS) {
          console.warn(`AsciiSea: ${avg.toFixed(1)}ms/frame (budget ${FRAME_BUDGET_MS}ms)`);
        }
        frameCount = 0;
        frameTotal = 0;
      }
    }

    function loop(now: number) {
      frame = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS) return;
      last = now;
      const t = (now - start) / 1000;
      // Clamp dt so a long pause (background tab) doesn't teleport anything.
      const dt = Math.min(0.1, t - lastT);
      lastT = t;
      updateCursors(now);
      updateSharks(t, dt);
      updateFish(dt);
      updateBubbles(dt);
      draw(t);
    }

    function sync() {
      cancelAnimationFrame(frame);
      if (reducedMotion.matches) {
        // One still frame: sharks posed mid-swim, no bubbles, no ripples.
        wake.fill(0);
        bubbles = [];
        draw(8);
        return;
      }
      if (visible && !document.hidden) {
        lastT = (performance.now() - start) / 1000;
        frame = requestAnimationFrame(loop);
      }
    }

    function onPointerMove(e: PointerEvent) {
      seaCursors.set("local", { x: e.clientX, y: e.clientY });
    }
    function onPointerLeave() {
      seaCursors.delete("local");
    }
    function onPointerDown(e: PointerEvent) {
      if (reducedMotion.matches || !visible) return;
      if ((e.target as Element | null)?.closest?.("a, button, input, textarea, select, [role='button']")) return;
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      for (const s of school) {
        const dx = Math.abs(x - s.x);
        const dy = Math.abs(y - drawY(s));
        if (dx < s.len * 0.55 && dy < s.len * 0.22) {
          s.mode = "flee";
          s.until = (performance.now() - start) / 1000 + 1.6;
          s.fromX = x;
          s.fromY = y;
          s.flick = 1;
          emitSeaBurst(e.clientX, e.clientY);
          return;
        }
      }
    }

    resize();
    sync();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      sync();
    });
    resizeObserver.observe(canvas);

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    visibility.observe(canvas);

    const offBurst = onSeaBurst(burst);
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      offBurst();
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [sharks, fish, surface, overlap, avoid]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    />
  );
}
