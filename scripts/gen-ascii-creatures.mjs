#!/usr/bin/env node
/**
 * Generates the shaded ASCII creatures (the About dolphin, the Projects
 * pufferfish and the midnight-zone anglerfish) into
 * src/lib/ascii-creatures.generated.ts.
 *
 *   node scripts/gen-ascii-creatures.mjs
 *
 * Each creature is a smooth shape (a density function in em, y down), sampled
 * 3×4 times per glyph cell and mapped onto a density ramp, the way the hero's
 * AsciiSea draws its sharks: a dense back, a paler belly, soft edges. A glyph
 * cell is 0.6em wide and 1.2em tall. Edit the shapes here and re-run; don't
 * edit the generated file by hand.
 */
import { writeFileSync } from "node:fs";

const RAMP = " .:-=+*#%@";
const CW = 0.6, CH = 1.2;

function inTri(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

/** Grid of cols×rows; `ink(x, y)` returns density 0..1 at a point in em (y down). */
function raster(cols, rows, ink, marks = []) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      let sum = 0, n = 0;
      for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 3; sx++) {
        sum += ink((c + (sx + 0.5) / 3) * CW, (r + (sy + 0.5) / 4) * CH); n++;
      }
      const d = sum / n;
      line += d < 0.06 ? " " : RAMP[Math.min(RAMP.length - 1, 1 + Math.floor(d * (RAMP.length - 1)))];
    }
    out.push(line);
  }
  for (const [r, c, ch] of marks) if (out[r]) out[r] = out[r].slice(0, c) + ch + out[r].slice(c + ch.length);
  return out.map((l) => l.replace(/\s+$/, ""));
}

/**
 * Dolphin, facing right, side on. Units: em (y down). Body from x0 (tail
 * stalk) to x1 (melon), then a short beak.
 */
function dolphinInk(x, y) {
  const x0 = 3.4, x1 = 20.6, base = 6.4;
  const s = (x - x0) / (x1 - x0);
  const arch = (u) => base - 0.7 * Math.sin(Math.PI * Math.min(1, Math.max(0, u)));
  if (s >= 0 && s <= 1) {
    const cy = arch(s);
    // Full at the front, tapering to a slim stalk at the tail.
    // Fullest a little ahead of the middle; tapers to the stalk and the head.
    const prof = Math.pow(s, 0.75) * Math.pow(1 - s, 0.55) / 0.43;
    let top = 2.9 * prof + 0.3, bot = 2.4 * prof + 0.3;
    top += 0.55 * Math.exp(-(((s - 0.9) / 0.07) ** 2)); // melon
    if (y >= cy - top && y <= cy + bot) {
      const v = (y - (cy - top)) / (top + bot); // 0 back … 1 belly
      return 1 - 0.6 * Math.pow(v, 1.8);
    }
  }
  // Beak: a short, slightly downturned snout.
  if (x >= x1 - 0.5 && x <= x1 + 2.0) {
    const t = (x - (x1 - 0.5)) / 2.5;
    const cyb = arch(1) + 0.45 + 0.25 * t;
    const h = 0.75 * (1 - t) + 0.2;
    if (Math.abs(y - cyb) <= h) return 0.6 - 0.3 * ((y - cyb + h) / (2 * h));
  }
  // Dorsal fin: swept back, leading edge straight, trailing edge hooked.
  {
    const footY = arch((11.5 - x0) / (x1 - x0)) - 2.2;
    const h = (footY - y) / 3.6; // 0 at the body … 1 at the tip
    if (h > 0 && h < 1) {
      const lead = 13.8 - 4.4 * h;
      const trail = 10.6 - 1.2 * Math.pow(h, 0.5) - 0.6 * h;
      if (x <= lead && x >= Math.min(trail, lead - 0.4)) return 0.95;
    }
  }
  // Pectoral fin, under the front.
  if (inTri(x, y, 14.4, 8.0, 16.8, 7.8, 12.6, 10.4)) return 0.62;
  // Flukes: two lobes swept back from the stalk, a notch between them.
  if (inTri(x, y, 3.4, 6.2, 0.0, 2.8, 1.6, 5.9)) return 0.9;
  if (inTri(x, y, 3.4, 6.6, 0.0, 9.6, 1.6, 6.9)) return 0.72;
  return 0;
}

/**
 * Pufferfish facing right. p: 0 deflated … 1 fully puffed. Shaded like a
 * sphere lit from the top left (dense = lit), with paler spots; thinner as
 * it stretches. Spines are added as marks (see pufferSpines).
 */
const PUFF = (p) => ({ cx: 9.6, cy: 6.6, rx: 4.6 + 1.4 * p, ry: 3.0 + 2.6 * p });
function pufferInk(p, tail = 1.7) {
  const { cx, cy, rx, ry } = PUFF(p);
  return (x, y) => {
    const dx = (x - cx) / rx, dy = (y - cy) / ry;
    const r2 = dx * dx + dy * dy;
    if (r2 <= 1) {
      const nz = Math.sqrt(1 - r2);
      const lit = Math.max(0, -0.45 * dx - 0.55 * dy + 0.7 * nz);
      let d = (0.28 + 0.72 * lit) * (1 - 0.25 * p);
      // Pale spots, spreading apart as it inflates.
      const f = 1.9 - 0.6 * p;
      if (Math.sin(x * f) * Math.sin(y * f * 1.3) > 0.82 && dy < 0.5) d *= 0.35;
      return d;
    }
    // Tail fan on the left.
    const tx = cx - rx;
    if (inTri(x, y, tx + 0.6, cy, tx - 2.4, cy - tail, tx - 2.4, cy + tail)) {
      return 0.55 + 0.25 * Math.abs(Math.sin((y - cy) * 3));
    }
    // A small dorsal fin while deflated.
    if (p < 0.4 && inTri(x, y, cx - 2.2, cy - ry + 0.3, cx - 0.2, cy - ry + 0.2, cx - 2.8, cy - ry - 1.2)) return 0.6;
    return 0;
  };
}

/** Spine marks for a puffed body: one glyph per direction, pointing outwards. */
function pufferSpines(p, scale) {
  if (p < 0.3) return [];
  const { cx, cy, rx, ry } = PUFF(p);
  const marks = [];
  const n = 26;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    if (Math.abs(Math.cos(a) + 1) < 0.25) continue; // not over the tail
    if (Math.cos(a) > 0.93) continue; // not over the mouth
    for (const [rr, show] of [[1.12, true], [1.24, p > 0.75]]) {
      if (!show) continue;
      const x = cx + Math.cos(a) * rx * rr, y = cy + Math.sin(a) * ry * rr;
      const deg = ((Math.atan2(Math.sin(a) * ry, Math.cos(a) * rx * 2) * 180) / Math.PI + 360) % 180;
      const ch = deg < 22 || deg > 158 ? "-" : deg < 68 ? "\\" : deg < 112 ? "|" : "/";
      marks.push([Math.floor((y * scale) / 1.2), Math.floor((x * scale) / 0.6), ch]);
    }
  }
  return marks;
}

/**
 * Anglerfish facing left: a big round head with a gaping, toothed jaw, a
 * body tapering to a tail fan on the right. `flick` (-1..1) bends the tail.
 * The rod and teeth are added as marks (see anglerMarks).
 */
const ANGLER = { cx: 10.2, cy: 10.4, rx: 6.2, ry: 5.0 };
function anglerInk(flick) {
  const { cx, cy, rx, ry } = ANGLER;
  return (x, y) => {
    // Head and body: an egg, fuller at the front (left), tapering to the tail.
    const t = (x - (cx - rx)) / (2 * rx); // 0 front … 1 back
    const taper = t < 0.55 ? 1 : 1 - 0.75 * ((t - 0.55) / 0.45) ** 1.3;
    const dy = (y - cy) / (ry * taper);
    const dx = (x - cx) / rx;
    if (t >= 0 && t <= 1 && dx * dx + dy * dy <= 1) {
      // The gaping mouth: a wedge opening to the left, a little below centre.
      const mouthY = cy + 0.9;
      const open = (cx - 2.4 - x) * 0.34;
      if (x < cx - 2.4 && Math.abs(y - mouthY) < open) return 0;
      const v = (y - (cy - ry)) / (2 * ry); // 0 back … 1 belly
      let d = 0.95 - 0.6 * Math.pow(v, 1.4);
      // Lumpy, mottled skin.
      if (Math.sin(x * 2.1 + y) * Math.sin(y * 1.7 - x * 0.6) > 0.7) d *= 0.55;
      return d;
    }
    // The underbite: a lower jaw jutting out past the head.
    if (inTri(x, y, cx - rx - 1.4, cy + 1.7, cx - 2.6, cy + 1.3, cx - 2.0, cy + ry * 0.75)) return 0.7;
    // Tail fan, bending with `flick`.
    const tx = cx + rx - 0.4, f = flick * 0.9;
    if (inTri(x, y, tx, cy, tx + 3.4, cy - 2.4 + f, tx + 3.4, cy + 2.4 + f)) return 0.7;
    // A small, spiny dorsal fin.
    if (inTri(x, y, cx + 2.2, cy - ry * 0.82, cx + 4.6, cy - ry * 0.55, cx + 3.0, cy - ry - 1.0)) return 0.6;
    return 0;
  };
}

/** Rod (a curve from the forehead forward and up), teeth, and the eye. Returns marks and the rod tip cell. */
function anglerMarks(scale) {
  const { cx, cy, rx } = ANGLER;
  const marks = [];
  const at = (x, y) => [Math.floor((y * scale) / 1.2), Math.floor((x * scale) / 0.6)];
  // Rod: a quadratic curve from the forehead to a tip ahead of the mouth.
  const p0 = [cx - 1.2, cy - ANGLER.ry + 0.2], p1 = [cx - 3.2, cy - ANGLER.ry - 5.0], p2 = [cx - rx - 0.6, cy - ANGLER.ry - 0.8];
  let last = null;
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, u = 1 - t;
    const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
    const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
    const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const deg = ((Math.atan2(dy, dx * 2) * 180) / Math.PI + 360) % 180;
    const ch = deg < 22 || deg > 158 ? "-" : deg < 68 ? "\\" : deg < 112 ? "|" : "/";
    const [r, c] = at(x, y);
    if (!last || last[0] !== r || last[1] !== c) marks.push([r, c, ch]);
    last = [r, c];
  }
  const tip = last;
  // Teeth along both jaws.
  const mouthY = cy + 0.9;
  for (let x = cx - rx + 0.4; x < cx - 2.8; x += 0.9) {
    const open = (cx - 2.4 - x) * 0.34;
    const [ru, cu] = at(x, mouthY - open + 0.35);
    const [rl, cl] = at(x, mouthY + open - 0.35);
    marks.push([ru, cu, "v"], [rl, cl, "^"]);
  }
  const [er, ec] = at(cx - 2.2, cy - 1.9);
  marks.push([er, ec - 1, " o "]);
  return { marks, tip };
}

// --- Output ----------------------------------------------------------------------

const scaled = (f, s) => (x, y) => f(x / s, y / s);
/** [row, col] of a point in em, at a given scale. */
const cell = (xEm, yEm, s) => [Math.round((yEm * s) / 1.2 - 0.5), Math.round((xEm * s) / 0.6 - 0.5)];
const pad = (lines, width) => lines.map((l) => l.padEnd(width));

const DS = 1.7;
const [dr, dc] = cell(19.0, 5.6, DS);
const dolphin = pad(raster(72, 18, scaled(dolphinInk, DS), [[dr, dc - 1, " o "]]), 72);

const PS = 1.6;
function puffer(p, tail) {
  const g = PUFF(p);
  const [r, c] = cell(g.cx + g.rx * 0.55, g.cy - g.ry * 0.28, PS);
  const [mr, mc] = cell(g.cx + g.rx * 0.97, g.cy + 0.25, PS);
  return pad(raster(48, 20, scaled(pufferInk(p, tail), PS), [...pufferSpines(p, PS), [r, c - 1, " o "], [mr, mc, "o"]]), 48);
}

const AS = 1.25;
const anglerRig = anglerMarks(AS);
const angler = [-1, 1].map((flick) => pad(raster(44, 19, scaled(anglerInk(flick), AS), anglerRig.marks), 44));

const lit = (lines) => "[\n" + lines.map((l) => "    " + JSON.stringify(l) + ",").join("\n") + "\n  ]";
const out = `// Generated by scripts/gen-ascii-creatures.mjs. Do not edit by hand.

/** The Technical skills dolphin, side on, facing right (72 × 18). */
export const dolphin: readonly string[] = ${lit(dolphin).replace(/^\[/, "[").replace(/\n {4}/g, "\n  ").replace(/\n {2}\]$/, "\n]")};

/** The pufferfish, facing right: deflated, half-puffed, fully puffed (48 × 20). */
export const pufferfish: readonly (readonly string[])[] = [
  ${[0, 0.5, 1].map((p) => lit(puffer(p, 1.7))).join(",\n  ")},
];

/**
 * The midnight-zone anglerfish, facing left, two frames of a tail flick
 * (44 × 19). Its lure is drawn separately so it can glow: it hangs just
 * below the rod's tip, at \`anglerRodTip\` [row, col].
 */
export const anglerfish: readonly (readonly string[])[] = [
  ${angler.map(lit).join(",\n  ")},
];
export const anglerRodTip = [${anglerRig.tip[0]}, ${anglerRig.tip[1]}] as const;

/** The deflated pufferfish with its tail fanned out (alternates with pufferfish[0]). */
export const pufferIdle: readonly string[] = ${lit(puffer(0, 1.15)).replace(/\n {4}/g, "\n  ").replace(/\n {2}\]$/, "\n]")};
`;
writeFileSync(new URL("../src/lib/ascii-creatures.generated.ts", import.meta.url), out);
console.log("wrote src/lib/ascii-creatures.generated.ts");
