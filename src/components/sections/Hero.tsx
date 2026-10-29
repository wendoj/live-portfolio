import { ArrowDownIcon, ArrowRightIcon } from "lucide-react";
import { InlineShark } from "@/components/hero/InlineShark";
import { ScrambleText } from "@/components/motion/ScrambleText";
import { LiveBadge } from "@/components/multiplayer/LiveBadge";
import { AsciiSea } from "@/components/sea/AsciiSea";
import { SeaDecor } from "@/components/sea/SeaDecor";
import { Button } from "@/components/ui/button";
import { hero } from "@/lib/content";

const stagger = (i: number) => ({ "--i": i }) as React.CSSProperties;

// How far the sea's foam spills past the hero into the About section (px).
const OVERLAP = 120;

export function Hero() {
  return (
    <section
      id="top"
      data-section="hero"
      aria-labelledby="hero-title"
      // overflow-x-clip (not hidden) so the foam can spill downwards.
      className="sea relative isolate flex min-h-[90svh] flex-col items-center overflow-x-clip px-4 pt-32 text-center sm:px-6 sm:pt-[18vh]"
    >
      <SeaDecor />

      {/* The sea lands on the page: a long fade into white at the bottom. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-background"
      />

      {/*
        The sea canvas covers the hero and hangs into About. Masks: fade in
        below the nav, fade out at the very bottom, and a soft window behind
        the copy so no glyph ever sits behind text.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{ height: `calc(100% + ${OVERLAP}px)` }}
      >
        <AsciiSea
          sharks={3}
          fish={14}
          surface
          overlap={OVERLAP}
          avoid="hero-copy"
          className="[mask-composite:intersect] [mask-image:linear-gradient(to_bottom,transparent_0%,black_8%,black_88%,transparent_100%),radial-gradient(ellipse_80%_24%_at_50%_30%,transparent_45%,black_100%)] sm:[mask-image:linear-gradient(to_bottom,transparent_0%,black_8%,black_88%,transparent_100%),radial-gradient(ellipse_36%_22%_at_50%_31%,transparent_40%,black_100%)]"
        />
      </div>

      <div id="hero-copy" className="relative z-10 flex max-w-3xl flex-col items-center">
        {/* "Open to internships", or "● You + 2 swimming here" with company. */}
        <LiveBadge className="enter" style={stagger(0)} />

        <h1
          id="hero-title"
          data-anchor="hero-title"
          aria-label={`${hero.greeting} ${hero.name}`}
          className="enter mt-6 text-[clamp(2.5rem,5vw,4.25rem)] leading-[1.02] font-medium tracking-[-0.045em]"
          style={stagger(1)}
        >
          <span className="block whitespace-nowrap">
            <span className="text-glass">{hero.greeting}</span>
            <InlineShark />
          </span>
          <span className="text-glass block whitespace-nowrap">
            <ScrambleText text={hero.name} delay={250} />
          </span>
        </h1>

        <p
          className="enter mt-5 max-w-[34rem] text-[17px] leading-snug tracking-[-0.02em] text-white [text-shadow:0_1px_14px_oklch(0.4_0.1_215/0.55)] sm:text-lg"
          style={stagger(2)}
        >
          {hero.sub}
        </p>

        <div
          className="enter mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
          style={stagger(3)}
        >
          <Button asChild variant="primary" surface="sea" size="lg">
            <a href={hero.primaryCta.href}>
              {hero.primaryCta.label}
              <ArrowDownIcon aria-hidden data-icon="inline-end" />
            </a>
          </Button>
          <a
            href={hero.secondaryCta.href}
            className="group inline-flex items-center gap-1.5 rounded-full px-1 py-2 text-[15px] font-medium tracking-[-0.02em] text-white/90 underline-offset-4 transition-colors duration-150 hover:text-white hover:underline"
          >
            {hero.secondaryCta.label}
            <ArrowRightIcon
              aria-hidden
              className="size-4 stroke-[2] transition-transform duration-150 ease-out motion-safe:group-hover:translate-x-0.5"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
