import { SelectionHolder } from "@/components/multiplayer/SelectionHolder";
import { AsciiScene } from "@/components/sea/AsciiScene";
import { FishSchool } from "@/components/sea/FishSchool";
import { Badge } from "@/components/ui/badge";
import { type AsciiFrames, bubbles, jellyfish, kelp, school, shark } from "@/lib/ascii-scenes";
import { about, type StatementPart } from "@/lib/content";
import { cn } from "@/lib/utils";

/** A Figma-style selection box around a word, held by a visitor's cursor. */
function Selected({ children }: { children: React.ReactNode }) {
  const handle = "absolute size-[7px] border border-sea bg-white";
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

/**
 * One cell of the facts grid, after Linear: no box of its own, just hairlines
 * between cells (set per cell through `className`). A faint depth reading
 * sits top-left where Linear puts "Fig 0.1", above a fixed-height band with a
 * looping ASCII scene, so titles line up across each row. The cell holds the
 * lines and the inner element the scroll reveal, so the lines never fade.
 */
function FactCard({
  anchor,
  title,
  scene,
  className,
  children,
  i,
}: {
  anchor: string;
  title: string;
  scene: AsciiFrames;
  className?: string;
  children: React.ReactNode;
  i: number;
}) {
  const depth = String((i + 1) * 8).padStart(2, "0");
  return (
    <div className={cn("min-w-0 border-foreground/10 py-8 md:px-8 md:py-9", className)}>
      <div data-anchor={anchor} data-reveal style={{ "--i": i } as React.CSSProperties}>
        <span aria-hidden className="label-mono block text-foreground/40 tabular-nums">
          −{depth} m
        </span>
        <div className="flex h-32 items-center justify-center">
          <AsciiScene frames={scene} interval={450 + i * 40} className="text-[12px] text-sea opacity-70" />
        </div>
        <h3 className="mt-4 text-[17px] font-medium tracking-[-0.025em]">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function Chips({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item}>
          <Badge variant="chip">
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
          <span aria-hidden className="mt-[0.5em] size-2 shrink-0 rounded-full border-[1.5px] border-sea" />
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
            <Badge variant="chip" className="h-9 gap-2 px-3.5 text-sm">
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
    <dl className="flex flex-col divide-y divide-border">
      {about.currentlyInto.map(({ kind, title }) => (
        <div key={kind} className="py-3 first:pt-0 last:pb-0">
          <dt className="text-sm text-muted-foreground">{kind}</dt>
          <dd className="text-lg leading-snug font-medium tracking-[-0.03em]">{title}</dd>
        </div>
      ))}
    </dl>
  );
}

export function About() {
  const { studying, buildingSince } = about;

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

      {/* Lines only between cells: each cell draws its own right/bottom rule,
          and the grid closes top and bottom so the dividers end on a line. */}
      <div className="mt-20 grid grid-cols-1 border-y border-foreground/10 sm:mt-28 md:grid-cols-12">
        <FactCard anchor="about-skills" title="Technical skills" scene={shark} i={0} className="border-b md:col-span-7 md:border-r md:pl-0">
          <TechnicalSkills />
        </FactCard>

        <FactCard anchor="about-now" title="Now" scene={bubbles} i={1} className="border-b md:col-span-5 md:pr-0">
          <Now />
        </FactCard>

        <FactCard anchor="about-off-the-clock" title="Off the clock" scene={school} i={2} className="border-b md:col-span-5 md:border-r md:border-b-0 md:pl-0">
          <OffTheClock />
        </FactCard>

        <FactCard anchor="about-into" title="Currently into" scene={jellyfish} i={3} className="border-b md:col-span-4 md:border-r md:border-b-0">
          <CurrentlyInto />
        </FactCard>

        <FactCard anchor="about-manchester" title={studying.where} scene={kelp} i={4} className="md:col-span-3 md:pr-0">
          <p className="text-2xl leading-tight font-medium tracking-[-0.04em]">{studying.what}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="tabular-nums">{studying.years}</span>
          </p>
          <p className="mt-6 text-5xl leading-none font-medium tracking-[-0.05em] tabular-nums">
            {buildingSince}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">building since</p>
        </FactCard>
      </div>
    </section>
  );
}
