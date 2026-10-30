import { cn } from "@/lib/utils";

/**
 * Static-ish decoration for sea surfaces: soft shafts of light slanting down
 * from the surface, swaying slowly (CSS only, still under reduced motion),
 * and a faint shimmer along the top edge. By day they are sunlight; by night
 * the shafts fade to a single moonbeam under a pale moon (`moon`).
 */
export function SeaDecor({ className, moon = true }: { className?: string; moon?: boolean }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,var(--hero-glow),transparent)]" />
      {moon && (
        // The moon, seen through the surface: a blurred disc and its halo.
        <div className="absolute top-[9%] right-[13%] hidden size-20 dark:block">
          <span className="absolute -inset-16 rounded-full bg-[radial-gradient(closest-side,oklch(0.9_0.04_230/0.16),transparent)]" />
          <span className="absolute inset-0 rounded-full bg-[oklch(0.95_0.02_230/0.55)] blur-[6px]" />
        </div>
      )}
      <Ray className="left-[8%] w-[9%] [--sway:3deg] dark:hidden" />
      <Ray className="left-[26%] w-[5%] opacity-70 [--sway:-2deg] [animation-delay:-4s] dark:hidden" />
      <Ray className="left-[52%] w-[12%] [--sway:2.5deg] [animation-delay:-9s] dark:left-[70%] dark:w-[14%] dark:rotate-[22deg]" />
      <Ray className="left-[78%] w-[6%] opacity-80 [--sway:-3deg] [animation-delay:-6s] dark:hidden" />
    </div>
  );
}

function Ray({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "sea-ray absolute -top-[10%] h-[95%] origin-top rotate-[14deg] blur-[18px]",
        "bg-[linear-gradient(180deg,var(--ray),var(--ray-mid)_60%,transparent)]",
        className,
      )}
    />
  );
}
