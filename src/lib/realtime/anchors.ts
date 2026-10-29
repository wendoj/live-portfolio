/**
 * Anchor-based coordinates. A sender describes a point as "x/y (0..1) inside
 * this `[data-anchor]`" (or inside a `[data-section]` when there is none),
 * and each receiver turns that back into pixels on its own layout. That is
 * what makes a cursor on a project card land on the same card on a phone,
 * even though the grid has reflowed.
 */

export type Located = { section: string; anchor?: string; x: number; y: number };

const clampUnit = (n: number) => Math.min(1, Math.max(0, n));
// Four decimals is sub-pixel on any screen and keeps events small.
const round = (n: number) => Math.round(clampUnit(n) * 10_000) / 10_000;

function relative(el: Element, clientX: number, clientY: number) {
  const r = el.getBoundingClientRect();
  return {
    x: round(r.width ? (clientX - r.left) / r.width : 0.5),
    y: round(r.height ? (clientY - r.top) / r.height : 0.5),
  };
}

/** The section whose vertical span contains `clientY`, or the nearest one. */
function sectionNear(clientY: number) {
  let best: HTMLElement | null = null;
  let bestDistance = Infinity;
  for (const el of document.querySelectorAll<HTMLElement>("[data-section]")) {
    const r = el.getBoundingClientRect();
    const distance = clientY < r.top ? r.top - clientY : clientY > r.bottom ? clientY - r.bottom : 0;
    if (distance < bestDistance) {
      best = el;
      bestDistance = distance;
    }
  }
  return best;
}

/** Describes a viewport point in anchor terms. */
export function locate(clientX: number, clientY: number): Located | null {
  const hit = document.elementFromPoint(clientX, clientY);
  const anchor = hit?.closest<HTMLElement>("[data-anchor]");
  const section = (anchor ?? hit)?.closest<HTMLElement>("[data-section]") ?? sectionNear(clientY);
  const sectionId = section?.dataset.section;
  if (!section || !sectionId) return null;

  if (anchor?.dataset.anchor) {
    return { section: sectionId, anchor: anchor.dataset.anchor, ...relative(anchor, clientX, clientY) };
  }
  return { section: sectionId, ...relative(section, clientX, clientY) };
}

/** Where the centre of the viewport sits, for touch visitors. */
export const locateViewportCentre = () => locate(window.innerWidth / 2, window.innerHeight / 2);

// Lookups run every frame per cursor, so cache elements until they detach.
const cache = new Map<string, HTMLElement>();

function find(selector: string, key: string) {
  const cached = cache.get(key);
  if (cached?.isConnected) return cached;
  const el = document.querySelector<HTMLElement>(selector);
  if (el) cache.set(key, el);
  else cache.delete(key);
  return el;
}

/**
 * Turns a located point back into viewport pixels on this layout. Falls back
 * to the section when the anchor doesn't exist here.
 */
export function resolve(point: Located): { x: number; y: number } | null {
  const el =
    (point.anchor && find(`[data-anchor="${CSS.escape(point.anchor)}"]`, `a:${point.anchor}`)) ||
    find(`[data-section="${CSS.escape(point.section)}"]`, `s:${point.section}`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + point.x * r.width, y: r.top + point.y * r.height };
}
