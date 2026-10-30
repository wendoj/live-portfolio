import { ManchesterClock } from "@/components/about/ManchesterClock";
import { SelectionHolder } from "@/components/multiplayer/SelectionHolder";
import { AsciiScene } from "@/components/sea/AsciiScene";
import { FishSchool } from "@/components/sea/FishSchool";
import { Badge } from "@/components/ui/badge";
import { type AsciiFrames, bubbles, dolphin, dolphinSwell, dolphinWaves, jellyfish, school } from "@/lib/ascii-scenes";
import { about, type StatementPart } from "@/lib/content";
import { cn } from "@/lib/utils";

/** A Figma-style selection box around a word, held by a visitor's cursor. */
function Selected({ children }: { children: React.ReactNode }) {
  const handle = "absolute size-[7px] border border-sea bg-background";
  return (
    <span className="relative mx-[0.1em] inline-block px-[0.12em] outline outline-1 outline-sea">
      {children}
      <span aria-hidden>
        <span className={cn(handle, "-top-1 -left-1")} />
        <span className={cn(handle, "-top-1 -right-1")} />
        <span className={cn(handle, "-bottom-1 -left-1")} />
        <span className={cn(handle, "-right-1 -bottom-1")} />
        {/* Sits in the gap between lines, above neighbouring text. Held by
            the newest other visitor (see SelectionHolder). */}
        <SelectionHolder className="absolute top-[calc(100%-3px)] left-[calc(100%-5px)] z-20 whitespace-nowrap" />
      </span>
    </span>
  );
}

/** Renders statement parts word by word, so the reveal can fade each word in. */
function Statement() {
  let w = 0;
  // `tight` drops the trailing space so a selection box hugs its last word.
  const words = (text: string, tight = false) =>
    text.split(" ").map((word, i, all) => (
      <span key={i} className="word" style={{ "--w": w++ } as React.CSSProperties}>
        {word}
        {tight && i === all.length - 1 ? "" : " "}
      </span>
    ));

  const render = (parts: readonly StatementPart[], keyPrefix: string) =>
    parts.map((part, i) =>
      part.select ? (
        <span key={`${keyPrefix}-${i}`}>
          <Selected>{words(part.text, true)}</Selected>{" "}
        </span>
      ) : (
        <span key={`${keyPrefix}-${i}`}>{words(part.text)}</span>
      ),
    );

  return (
    <p
      data-reveal-words
      data-anchor="about-statement"
      className="mx-auto max-w-[46rem] text-center text-[clamp(1.5rem,2.7vw,2.1rem)] leading-[1.5] font-[450] tracking-[-0.03em] text-ink-strong"
    >
      {render(about.strong, "s")}
      <span className="text-ink-soft">{render(about.soft, "w")}</span>
    </p>
  );
}

type Hue = "dolphin" | "sand-coral" | "puffer" | "jelly" | "kelp" | "reef";

/**
 * One tile of the bento: a filled surface tinted with its creature's colour,
 * the title, and the creature itself, big. The tile is always visible;
 * only its contents take part in the scroll reveal, so the grid never has holes.
 */
function Tile({
  anchor,
  title,
  hue,
  className,
  children,
  i,
}: {
  anchor: string;
  title: string;
  hue: Hue;
  className?: string;
  children: React.ReactNode;
  i: number;
}) {
  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden rounded-[28px] bg-(--tile) p-6 shadow-[inset_0_0_0_1px_var(--tile-edge)] sm:p-8",
        className,
      )}
      style={{ "--tile": `var(--tile-${hue})`, "--hue": `var(--${hue})`, "--chip": `var(--chip-${hue})` } as React.CSSProperties}
    >
      <div data-anchor={anchor} data-reveal className="flex h-full flex-col" style={{ "--i": i } as React.CSSProperties}>
        <h3 className="text-[17px] font-medium tracking-[-0.025em]">{title}</h3>
        {children}
      </div>
    </div>
  );
}

/** A creature in its tile's colour. Glows by night (.ascii-art). */
function Art({ frames, interval, className }: { frames: AsciiFrames; interval: number; className?: string }) {
  return (
    <AsciiScene
      frames={frames}
      interval={interval}
      className={cn("ascii-art text-[13px] leading-[1.2] font-semibold text-(--hue) sm:text-[14px]", className)}
    />
  );
}

/** Chips are cut from their tile: a stronger tint of its hue (--chip), neutral text. */
function Chips({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item}>
          <Badge variant="chip" className="bg-(--chip)">
            {item}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function TechnicalSkills() {
  return (
    <dl className="flex flex-col gap-4">
      {about.skills.map(({ group, items }) => (
        <div key={group} className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4">
          <dt className="w-24 shrink-0 text-sm text-muted-foreground">{group}</dt>
          <dd className="min-w-0">
            <Chips items={items} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Now() {
  return (
    <ul className="flex flex-col gap-3">
      {about.now.map((item) => (
        <li key={item} className="flex gap-3 text-lg leading-snug font-medium tracking-[-0.03em]">
          <span aria-hidden className="mt-[0.5em] size-2 shrink-0 rounded-full border-[1.5px] border-(--hue)" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function OffTheClock() {
  const { hobbies, societies } = about.offTheClock;
  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-wrap gap-2">
        {hobbies.map(({ emoji, label }, i) => (
          <li key={i}>
            <Badge
              variant="chip"
              className="h-9 gap-2 bg-(--chip) px-3.5 text-sm"
            >
              <span aria-hidden>{emoji}</span>
              {label}
            </Badge>
          </li>
        ))}
      </ul>
      <div>
        <p className="mb-2 text-sm text-muted-foreground">Societies</p>
        <Chips items={societies} />
      </div>
    </div>
  );
}

function CurrentlyInto() {
  return (
    <dl className="flex flex-col divide-y divide-(--tile-edge)">
      {about.currentlyInto.map(({ kind, title }) => (
        <div key={kind} className="py-3 first:pt-0 last:pb-0">
          <dt className="text-sm text-muted-foreground">{kind}</dt>
          <dd className="text-lg leading-snug font-medium tracking-[-0.03em]">{title}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The dolphin leaping in place over a strip of water. It is one drawing,
 * moved along an arc and tilted by CSS (.dolphin), and clipped at the
 * waterline, so it rises out of the water and dives back in. A splash marks
 * each crossing, and the surface drifts. All of it is CSS animation of
 * transforms and opacity (compositor-only, no re-renders). Sized in em, so
 * the whole stage scales with its font size.
 */
function DolphinLeap() {
  return (
    <div aria-hidden className="relative mx-auto mt-3 h-[27.6em] w-full overflow-hidden text-[7px] sm:text-[10px]">
      {/* Everything above the waterline; the dolphin is cut off below it. */}
      <div className="absolute inset-x-0 top-0 h-[23.6em] overflow-hidden">
        <span className="dolphin ascii-art absolute top-0 left-1/2 -ml-[21.6em] block font-mono leading-[1.2] font-bold whitespace-pre text-(--hue)">
          {dolphin.join("\n")}
        </span>
        <span className="dolphin-splash dolphin-splash--out absolute bottom-0 left-[calc(50%-8.5em)] font-mono text-[1.6em] leading-none font-bold text-(--hue)">
          {"' . '"}
        </span>
        <span className="dolphin-splash dolphin-splash--in absolute bottom-0 left-[calc(50%+5.5em)] font-mono text-[1.6em] leading-none font-bold text-(--hue)">
          {". ' ."}
        </span>
      </div>
      {/* The surface: a crest and a fainter swell, drifting opposite ways. */}
      {/* top is in the stage's em; the rows set their own, larger size. */}
      <div className="absolute inset-x-0 top-[23.3em] overflow-hidden font-mono leading-[1.2] font-bold whitespace-nowrap text-(--hue)">
        <div className="dolphin-waves text-[1.5em]">
          {dolphinWaves}
          {dolphinWaves}
        </div>
        <div className="dolphin-waves dolphin-waves--swell text-[1.5em] opacity-40">
          {dolphinSwell}
          {dolphinSwell}
        </div>
      </div>
    </div>
  );
}

function Manchester() {
  const { studying, buildingSince } = about;
  return (
    <div className="mt-5 flex flex-1 flex-col justify-between gap-6">
      <ManchesterClock />
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xl leading-tight font-medium tracking-[-0.03em]">{studying.what}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {studying.where} · <span className="tabular-nums">{studying.years}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl leading-none font-medium tracking-[-0.05em] tabular-nums">{buildingSince}</p>
          <p className="mt-1 text-sm text-muted-foreground">building since</p>
        </div>
      </div>
    </div>
  );
}

export function About() {
  return (
    <section
      id="about"
      data-section="about"
      aria-labelledby="about-title"
      // relative z-[1]: sits above the hero sea's foam, which spills into it.
      // overflow-x-clip: the selection cursor's label may poke past the edge on narrow screens.
      className="relative z-[1] mx-auto max-w-6xl overflow-x-clip px-4 pt-20 pb-24 sm:px-6 sm:pt-28 sm:pb-32"
    >
      <div className="text-center">
        <FishSchool className="mx-auto mb-4 max-w-sm" />
        <Badge variant="bracket" data-reveal>
          [01] · About
        </Badge>
        <h2 id="about-title" className="sr-only">
          About
        </h2>
      </div>
      <div className="mt-8">
        <Statement />
      </div>

      {/* One hero tile (skills, with the dolphin), then medium tiles. */}
      <div className="mt-20 grid grid-cols-1 gap-3 sm:mt-28 md:grid-cols-12">
        <Tile anchor="about-skills" title="Technical skills" hue="dolphin" i={0} className="md:col-span-7 md:row-span-2">
          <DolphinLeap />
          <div className="mt-auto">
            <TechnicalSkills />
          </div>
        </Tile>

        <Tile anchor="about-manchester" title="Manchester" hue="sand-coral" i={1} className="md:col-span-5">
          <Manchester />
        </Tile>

        <Tile anchor="about-now" title="Now" hue="kelp" i={2} className="md:col-span-5">
          <div className="mt-5 flex items-start justify-between gap-4">
            <Now />
            <Art frames={bubbles} interval={520} className="-mt-2 -mr-3 shrink-0 max-sm:hidden" />
          </div>
        </Tile>

        <Tile anchor="about-off-the-clock" title="Off the clock" hue="puffer" i={3} className="md:col-span-7">
          <div className="-mx-2 mt-3 mb-4 overflow-hidden">
            <Art frames={school} interval={260} />
          </div>
          <OffTheClock />
        </Tile>

        <Tile anchor="about-into" title="Currently into" hue="jelly" i={4} className="md:col-span-5">
          <div className="mt-5 flex items-start justify-between gap-4">
            <CurrentlyInto />
            <Art frames={jellyfish} interval={700} className="-mt-1 -mr-2 shrink-0" />
          </div>
        </Tile>
      </div>
    </section>
  );
}
