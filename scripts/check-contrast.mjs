#!/usr/bin/env node
/**
 * Checks WCAG contrast for the colour pairs the design relies on, in both
 * themes, against the tinted depth zones (not just white). Reads the tokens
 * straight from globals.css: the `:root, .light` block and the `.dark` block.
 *
 *   node scripts/check-contrast.mjs
 *
 * Exits 1 if any pair is below its target. Alpha tokens are skipped (they are
 * borders and glass, not text).
 */
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

function block(selector) {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`No ${selector} block in globals.css`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(`Unclosed ${selector} block`);
}

function tokens(body) {
  const out = {};
  for (const m of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const light = tokens(block(":root,\n.light {"));
const dark = { ...light, ...tokens(block("\n.dark {")) };

function resolve(theme, name, seen = new Set()) {
  const v = theme[name];
  if (v === undefined) throw new Error(`Unknown token --${name}`);
  const ref = v.match(/^var\(--([\w-]+)\)$/);
  if (!ref) return v;
  if (seen.has(name)) throw new Error(`Cycle at --${name}`);
  seen.add(name);
  return resolve(theme, ref[1], seen);
}

/** oklch(L C H) → relative luminance (sRGB, WCAG). null if it has alpha. */
function luminance(value) {
  const m = value.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/);
  if (!m) return null;
  const [L, C, H] = m.slice(1).map(Number);
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ].map((c) => Math.min(1, Math.max(0, c)));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function ratio(theme, fg, bg) {
  const a = luminance(resolve(theme, fg));
  const b = luminance(resolve(theme, bg));
  if (a === null || b === null) return null;
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const ZONES = ["zone-0", "zone-1", "zone-2", "zone-3", "zone-4"];
const TILES = ["tile-dolphin", "tile-sand-coral", "tile-puffer", "tile-jelly", "tile-kelp", "tile-reef"];
const CHIPS = ["chip-dolphin", "chip-sand-coral", "chip-puffer", "chip-jelly", "chip-kelp", "chip-reef"];

// [foreground, backgrounds, target, what]
const PAIRS = [
  ["foreground", [...ZONES, ...TILES, ...CHIPS, "card"], 4.5, "body text"],
  ["ink-strong", ZONES, 4.5, "statement text"],
  ["ink-soft", ZONES, 4.5, "soft statement text"],
  ["muted-foreground", [...ZONES, ...TILES, "card", "muted"], 4.5, "small muted text"],
  ["dolphin", ["tile-dolphin"], 3, "dolphin art"],
  ["sand-coral", ["tile-sand-coral"], 3, "sun / moon art"],
  ["puffer", ["tile-puffer"], 3, "pufferfish art"],
  ["puffer-on-sea", ["puffer-sea-top", "puffer-sea-bottom"], 4.5, "pufferfish on its sea"],
  ["jelly", ["tile-jelly"], 3, "jellyfish art"],
  ["kelp", ["tile-kelp"], 3, "kelp art"],
  ["reef", ["tile-reef", ...ZONES], 3, "fish / bubbles art"],
  ["lure", ["zone-2", "zone-3"], 3, "anglerfish"],
  ["ring", ZONES, 3, "focus ring"],
  ["sea-ink", ZONES, 4.5, "teal text"],
  // The sounding line's readout over the Contact panel (white, see SoundingLine).
  ["on-sea", ["panel-top", "ramp-0"], 4.5, "readout on the sea"],
];

let failures = 0;
for (const [label, theme] of [["light", light], ["dark", dark]]) {
  console.log(`\n${label}`);
  for (const [fg, bgs, target, what] of PAIRS) {
    for (const bg of bgs) {
      const r = ratio(theme, fg, bg);
      if (r === null) continue;
      const ok = r >= target;
      if (!ok) failures++;
      console.log(`  ${ok ? "ok  " : "FAIL"} ${r.toFixed(2).padStart(5)}:1  --${fg} on --${bg}  (${what}, ≥${target})`);
    }
  }
}

if (failures) {
  console.error(`\n${failures} pair(s) below target.`);
  process.exit(1);
}
console.log("\nAll pairs pass.");
