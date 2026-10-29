import { ArrowUpRightIcon } from "lucide-react";
import { SectionIntro } from "@/components/layout/SectionIntro";
import { VideoMedia } from "@/components/projects/VideoMedia";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { earlierWork, prodpod, thisSite } from "@/lib/content";
import { cn } from "@/lib/utils";

/** Rounded media tile with a 1px inset outline in pure black at 10%. */
function MediaFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[22px] bg-muted after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_oklch(0_0_0/0.1)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** "Prodpod ........ REAL-TIME · WEB APP" caption row under each tile. */
function Caption({ name, tags }: { name: string; tags: readonly string[] }) {
  return (
    <div className="mt-3 flex items-baseline justify-between gap-4 px-1">
      <h3 className="text-[15px] font-medium tracking-[-0.02em]">{name}</h3>
      <Badge variant="tag" className="block min-w-0 shrink truncate">
        {tags.join(" · ")}
      </Badge>
    </div>
  );
}

function ProdpodPlaceholder() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 bg-[linear-gradient(160deg,var(--sea-light),var(--seafoam)_65%,var(--sand))]">
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, tiny SVG */}
      <img src="/prodpod.svg" alt="" className="size-16 rounded-2xl shadow-lg sm:size-20" />
      <span className="label-mono text-foreground/60">Screenshot coming soon</span>
    </div>
  );
}

/**
 * A small schematic of this page with visitor dots on it (illustrative
 * positions, not live ones).
 */
function MiniMap() {
  const dots = [
    { top: "14%", left: "38%", color: "oklch(0.56 0.11 192)" },
    { top: "44%", left: "62%", color: "oklch(0.6 0.17 160)" },
    { top: "71%", left: "30%", color: "oklch(0.58 0.2 300)" },
  ];
  return (
    <div className="flex size-full items-center justify-center bg-gradient-to-tl from-sea-light to-sea p-8">
      <div className="relative h-full w-1/2 max-w-48 overflow-hidden rounded-xl bg-white/90 p-3 shadow-xl">
        <div className="h-[22%] rounded-[8px] bg-sea" />
        {[0.7, 0.5, 0.85, 0.6, 0.75].map((w, i) => (
          <div key={i} className="mt-2.5 h-2 rounded-full bg-foreground/10" style={{ width: `${w * 100}%` }} />
        ))}
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <div className="h-8 rounded-md bg-foreground/[0.06]" />
          <div className="h-8 rounded-md bg-foreground/[0.06]" />
        </div>
        {dots.map((d, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute size-2.5 rounded-full ring-2 ring-white"
            style={{ top: d.top, left: d.left, backgroundColor: d.color }}
          />
        ))}
      </div>
    </div>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="primary">
      <a href={href} target="_blank" rel="noopener noreferrer">
        {label}
        <ArrowUpRightIcon aria-hidden data-icon="inline-end" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </Button>
  );
}

export function Projects() {
  return (
    <section
      id="projects"
      data-section="projects"
      aria-labelledby="projects-title"
      className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32"
    >
      <SectionIntro
        index={2}
        label="Selected work"
        id="projects"
        strong="Things I've built."
        soft="Real people use them."
      />

      <article
        data-anchor="project-prodpod"
        aria-labelledby="project-prodpod-title"
        className="mt-16"
        data-reveal
      >
        <div>
          <MediaFrame className="aspect-[16/10] sm:aspect-video">
            {prodpod.video ? (
              <VideoMedia src={prodpod.video} label={`${prodpod.name} demo`} />
            ) : prodpod.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- static export
              <img src={prodpod.image} alt="Prodpod study room" className="size-full object-cover" />
            ) : (
              <ProdpodPlaceholder />
            )}
          </MediaFrame>
          <Caption name={prodpod.name} tags={prodpod.tags} />
        </div>

        <div className="mt-6 flex flex-col gap-5 px-1 md:flex-row md:items-center md:justify-between">
          <p
            id="project-prodpod-title"
            className="max-w-xl text-[clamp(1.25rem,2vw,1.5rem)] leading-snug font-medium tracking-[-0.03em] text-ink-strong"
          >
            {prodpod.summary}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {prodpod.stats.map((stat) => (
              <Badge key={stat.label} variant="chip" className="h-9 px-4 text-sm">
                <span className="font-semibold tabular-nums">{stat.value}</span>
                <span className="text-muted-foreground">{stat.label}</span>
              </Badge>
            ))}
            <ExternalLink href={prodpod.link.href} label={prodpod.link.label} />
          </div>
        </div>
      </article>

      <article
        data-anchor="project-portfolio"
        aria-labelledby="project-portfolio-title"
        className="mt-24 grid items-center gap-10 md:grid-cols-2"
      >
        <div data-reveal>
          <div>
            <MediaFrame className="aspect-[4/3]">
              <MiniMap />
            </MediaFrame>
            <Caption name={thisSite.name} tags={thisSite.tags} />
          </div>
        </div>
        <div data-reveal style={{ "--i": 1 } as React.CSSProperties}>
          <p
            id="project-portfolio-title"
            className="text-[clamp(1.5rem,2.6vw,2rem)] leading-[1.25] font-medium tracking-[-0.035em] text-ink-strong"
          >
            You&apos;re inside this one.{" "}
            <span className="text-ink-soft">{thisSite.summary}</span>
          </p>
          <div className="mt-7">
            <ExternalLink href={thisSite.link.href} label={thisSite.link.label} />
          </div>
        </div>
      </article>

      <div className="mt-24">
        <Badge variant="bracket" data-reveal>
          Earlier work
        </Badge>
        <ul className="mt-5 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {earlierWork.map((project, i) => (
            <li
              key={project.id}
              className="min-w-0"
              data-anchor={`project-${project.id}`}
              data-reveal
              style={{ "--i": i } as React.CSSProperties}
            >
              <div>
                <MediaFrame className="aspect-video">
                  <VideoMedia src={project.video} label={`${project.name} demo`} />
                </MediaFrame>
                <Caption name={project.name} tags={project.tags} />
              </div>
              <p className="mt-1 px-1 text-sm text-muted-foreground">
                {project.summary}{" "}
                {project.href && (
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline decoration-foreground/20 underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-sea"
                  >
                    Visit<span className="sr-only"> {project.name} (opens in a new tab)</span>
                  </a>
                )}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
