import { PalettePicker } from "@/components/guestbook/PalettePicker";
import { SectionIntro } from "@/components/layout/SectionIntro";
import { guestbook } from "@/lib/content";
import { GRID_SIZE, SEED_ART } from "@/lib/guestbook";

/** Static render of the shared canvas; painting it live is still to come. */
function Canvas({ cells }: { cells: string }) {
  const pixels = [...cells].flatMap((c, i) =>
    c === "0" ? [] : [{ x: i % GRID_SIZE, y: Math.floor(i / GRID_SIZE), c }],
  );

  return (
    <svg
      role="img"
      aria-label="Guestbook canvas. The starting drawing shows a cursor next to the word HI, a heart and the colour palette."
      viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
      shapeRendering="crispEdges"
      className="block aspect-square w-full rounded-[16px] bg-muted"
    >
      <defs>
        <pattern id="gb-dots" width="1" height="1" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r="0.06" fill="oklch(0.18 0.012 265 / 0.18)" />
        </pattern>
      </defs>
      <rect width={GRID_SIZE} height={GRID_SIZE} fill="url(#gb-dots)" />
      {pixels.map(({ x, y, c }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={`var(--px-${c})`} />
      ))}
    </svg>
  );
}

export function Guestbook() {
  return (
    <section
      id="guestbook"
      data-section="guestbook"
      aria-labelledby="guestbook-title"
      className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32"
    >
      <SectionIntro
        index={3}
        label="Guestbook"
        id="guestbook"
        strong={guestbook.title.strong}
        soft={guestbook.title.soft}
      />

      <div className="mx-auto mt-14 max-w-xl" data-reveal>
        {/* Outer radius 29px = inner canvas radius 16px + 12px padding + 1px border. */}
        <div
          data-anchor="guestbook-canvas"
          className="rounded-[29px] border border-transparent bg-card p-3 shadow-[0_0_0_1px_oklch(0.18_0.012_265/0.06),0_24px_48px_-24px_oklch(0.4_0.1_230/0.3)]"
        >
          <Canvas cells={SEED_ART} />
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-3 pb-1">
            <PalettePicker />
            <span className="label-mono text-muted-foreground tabular-nums">Ink 30/30</span>
          </div>
        </div>
      </div>
    </section>
  );
}
