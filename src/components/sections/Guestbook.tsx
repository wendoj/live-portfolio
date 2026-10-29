import { GuestbookLive } from "@/components/guestbook/GuestbookLive";
import { PalettePicker } from "@/components/guestbook/PalettePicker";
import { CanvasPixels } from "@/components/guestbook/StaticCanvas";
import { SectionIntro } from "@/components/layout/SectionIntro";
import { guestbook } from "@/lib/content";
import { GRID_SIZE, SEED_ART } from "@/lib/guestbook";

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
          {/* The seed art, server-rendered; the live canvas takes over near the viewport. */}
          <GuestbookLive>
            <svg
              role="img"
              aria-label={guestbook.canvasLabel}
              viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
              shapeRendering="crispEdges"
              className="block aspect-square w-full rounded-[16px] bg-muted"
            >
              <CanvasPixels cells={SEED_ART} />
            </svg>
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-3 pb-1">
              <PalettePicker value={2} disabled />
              <span className="label-mono text-muted-foreground tabular-nums">{guestbook.ink(30, 30)}</span>
            </div>
          </GuestbookLive>
        </div>
      </div>
    </section>
  );
}
