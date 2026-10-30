import { applyTheme, type Theme } from "@/lib/theme";

/**
 * The theme switch as an ASCII dissolve (~550ms):
 *
 *   0–220ms    flood: glyphs spread over the viewport in a noise order, a
 *              teal front of light glyphs ahead of denser ones in the new
 *              theme's water colour, until the page is covered
 *   cover      the theme swaps with transitions off, and the cover holds for
 *              two frames so the page restyle lands out of sight
 *   ~300ms     drain: the glyphs thin out down the density ramp, in a
 *              different noise order, revealing the new page
 *
 * Smoothness: everything that costs layout or style work (the canvas, both
 * themes' colours, both glyph atlases, the cells' noise order) is prepared
 * on idle after load, so a click starts drawing on the next frame. Cells are
 * coarse (12×18) and only cells whose level changed are redrawn.
 * Under reduced motion the theme just swaps.
 */
const FLOOD_MS = 220;
const HOLD_FRAMES = 2;
const DRAIN_MS = 300;
const SOFT = 0.35; // share of a phase a cell takes to go from empty to solid
const RAMP = " .·:-=+*#%@"; // light → dense
const SOLID = 255;
const CELL_W = 12;
const CELL_H = 18;

type Prepared = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  cols: number;
  rows: number;
  dpr: number;
  floodAt: Float32Array;
  drainAt: Float32Array;
  state: Uint8Array;
  themes: Record<Theme, { water: string; atlas: HTMLCanvasElement }>;
};

let prepared: Prepared | null = null;
let running = false;

function hash(x: number, y: number) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** A token's value in a theme, read off a hidden element with that theme's class. */
function tokensIn(theme: Theme, names: string[]) {
  const probe = document.createElement("div");
  probe.className = theme;
  probe.style.display = "none";
  document.body.append(probe);
  const style = getComputedStyle(probe);
  const values = names.map((n) => style.getPropertyValue(n).trim());
  probe.remove();
  return values;
}

/** Row 0: the teal front; row 1: the water colour. Glyph i sits in column i. */
function buildAtlas(front: string, water: string, dpr: number, font: string) {
  const atlas = document.createElement("canvas");
  atlas.width = Math.ceil(RAMP.length * CELL_W * dpr);
  atlas.height = Math.ceil(2 * CELL_H * dpr);
  const a = atlas.getContext("2d")!;
  a.setTransform(dpr, 0, 0, dpr, 0, 0);
  a.font = `600 15px ${font}`;
  a.textAlign = "center";
  a.textBaseline = "middle";
  [front, water].forEach((color, row) => {
    a.fillStyle = color;
    for (let i = 1; i < RAMP.length; i++) a.fillText(RAMP[i], i * CELL_W + CELL_W / 2, row * CELL_H + CELL_H / 2);
  });
  return atlas;
}

/** Builds (or rebuilds, after a resize) everything the dissolve needs. */
export function prepareDissolve() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (prepared && prepared.width === width && prepared.height === height) return;

  const canvas = prepared?.canvas ?? document.createElement("canvas");
  if (!prepared) {
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100vh",
      zIndex: "100",
      pointerEvents: "none",
      contain: "strict",
      visibility: "hidden",
    });
    document.body.append(canvas);
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cols = Math.ceil(width / CELL_W);
  const rows = Math.ceil(height / CELL_H);
  const n = cols * rows;
  const floodAt = new Float32Array(n);
  const drainAt = new Float32Array(n);
  // Noise, with a gentle top-to-bottom bias so it reads as water pouring in.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const bias = r / rows;
      floodAt[i] = (hash(c >> 1, r >> 1) * 0.55 + hash(c, r) * 0.15 + bias * 0.3) * (1 - SOFT);
      drainAt[i] = (hash(c + 101, r + 37) * 0.7 + (1 - bias) * 0.3) * (1 - SOFT);
    }
  }

  const font = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim() || "monospace";
  const theme = (t: Theme) => {
    const [water, front] = tokensIn(t, ["--zone-1", "--sea"]);
    return { water, atlas: buildAtlas(front, water, dpr, font) };
  };

  prepared = {
    canvas,
    ctx,
    width,
    height,
    cols,
    rows,
    dpr,
    floodAt,
    drainAt,
    state: new Uint8Array(n),
    themes: { light: theme("light"), dark: theme("dark") },
  };
  // Draw each atlas once (then clear), so the browser has uploaded them
  // before the first real frame of a dissolve.
  for (const t of ["light", "dark"] as const) ctx.drawImage(prepared.themes[t].atlas, 0, 0);
  ctx.clearRect(0, 0, width, height);
}

/** Prepares on idle now, and again (debounced) after resizes. */
export function warmDissolve() {
  // Safari has no requestIdleCallback.
  const idle = (fn: () => void) =>
    typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 300);
  idle(prepareDissolve);
  let timer = 0;
  const onResize = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => idle(prepareDissolve), 300);
  };
  window.addEventListener("resize", onResize);
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("resize", onResize);
  };
}

/** Changes the theme with the dissolve. Clicks during a dissolve are ignored. */
export function dissolveTo(theme: Theme) {
  if (running) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    applyTheme(theme, true);
    return;
  }
  prepareDissolve(); // no-op when already prepared for this viewport
  const p = prepared!;
  running = true;

  const { ctx, cols, floodAt, drainAt, state } = p;
  const { water, atlas } = p.themes[theme];
  const aw = CELL_W * p.dpr;
  const ah = CELL_H * p.dpr;
  const n = cols * p.rows;
  state.fill(0);
  ctx.clearRect(0, 0, p.width, p.height);
  ctx.fillStyle = water;
  p.canvas.style.visibility = "visible";

  /** Draws cell i at `level` (0 empty … 1 solid) if it changed since last frame. */
  const paint = (i: number, level: number, front: boolean) => {
    let s: number;
    if (level <= 0) s = 0;
    else if (level >= 1) s = SOLID;
    else s = (front ? 0x80 : 0) | (1 + Math.floor(level * (RAMP.length - 2)));
    if (s === state[i]) return;
    state[i] = s;
    const x = (i % cols) * CELL_W;
    const y = Math.floor(i / cols) * CELL_H;
    ctx.clearRect(x, y, CELL_W, CELL_H);
    if (s === SOLID) ctx.fillRect(x, y, CELL_W, CELL_H);
    else if (s !== 0) ctx.drawImage(atlas, (s & 0x7f) * aw, (s & 0x80 ? 0 : 1) * ah, aw, ah, x, y, CELL_W, CELL_H);
  };

  const start = performance.now();
  let phase: "flood" | "hold" | "drain" = "flood";
  let held = 0;
  let drainStart = 0;

  const frame = (now: number) => {
    if (phase === "flood") {
      const t = Math.min(1, (now - start) / FLOOD_MS);
      // The leading edge is teal and light; behind it, denser glyphs in the water colour.
      for (let i = 0; i < n; i++) {
        const level = (t - floodAt[i]) / SOFT;
        paint(i, level, level < 0.4);
      }
      if (t >= 1) {
        for (let i = 0; i < n; i++) paint(i, 1, false);
        phase = "hold";
        // Swap under full cover, with transitions and animations off, so the
        // whole-page restyle happens in one frame nobody sees.
        const root = document.documentElement;
        root.classList.add("theme-swapping");
        applyTheme(theme, true);
      }
    } else if (phase === "hold") {
      if (++held >= HOLD_FRAMES) {
        document.documentElement.classList.remove("theme-swapping");
        phase = "drain";
        drainStart = now;
      }
    } else {
      const t = Math.min(1, (now - drainStart) / DRAIN_MS);
      for (let i = 0; i < n; i++) paint(i, 1 - (t - drainAt[i]) / SOFT, false);
      if (t >= 1) {
        ctx.clearRect(0, 0, p.width, p.height);
        p.canvas.style.visibility = "hidden";
        running = false;
        return;
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
