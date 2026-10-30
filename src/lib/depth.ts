import { zones } from "@/lib/content";

/**
 * Where the reader is in the dive. Measures the zone sections, then on each
 * scroll frame works out:
 *
 *   depth      metres at the middle of the viewport, interpolated inside the
 *              section there (see `zones`), so a tall section doesn't
 *              stretch the numbers of the others
 *   progress   0 at the start of About … 1 at the bottom of the page
 *
 * and, on each (re)measure, where each deeper zone begins on that progress
 * scale. rAF-throttled; no React in here, so callers decide what to render.
 */
export type DepthFrame = { depth: number; zone: string; progress: number };
export type ZoneMark = { at: number; name: string; depth: number };

type Section = { top: number; height: number; from: number; to: number; name: string };

export function trackDepth(onFrame: (f: DepthFrame) => void, onMeasure?: (marks: ZoneMark[]) => void) {
  let sections: Section[] = [];
  let start = 0; // scrollY where the dive begins (About's top at mid-screen)
  let span = 1;
  let frame = 0;

  const measure = () => {
    sections = zones.flatMap((z) => {
      const el = document.getElementById(z.section);
      if (!el) return [];
      const r = el.getBoundingClientRect();
      return [{ top: r.top + window.scrollY, height: r.height, from: z.from, to: z.to, name: z.name }];
    });
    const mid = window.innerHeight / 2;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    start = (sections[1]?.top ?? 0) - mid;
    span = Math.max(1, maxScroll - start);
    // Zones below the sunlight zone get a mark where they begin.
    onMeasure?.(
      sections.slice(2).map((s) => ({
        at: Math.min(1, Math.max(0, (s.top - mid - start) / span)),
        name: s.name,
        depth: s.from,
      })),
    );
    update();
  };

  const update = () => {
    frame = 0;
    if (!sections.length) return;
    const probe = window.scrollY + window.innerHeight / 2;
    let current = sections[0];
    for (const s of sections) if (probe >= s.top) current = s;
    const t = Math.min(1, Math.max(0, (probe - current.top) / Math.max(1, current.height)));
    onFrame({
      depth: current.from + (current.to - current.from) * t,
      zone: current.name,
      progress: Math.min(1, Math.max(0, (window.scrollY - start) / span)),
    });
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  measure();
  const resize = new ResizeObserver(measure);
  resize.observe(document.body);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", measure);
  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", measure);
  };
}
