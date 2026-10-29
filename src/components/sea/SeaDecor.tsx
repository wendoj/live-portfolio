import { cn } from "@/lib/utils";

/**
 * Static-ish decoration for sea surfaces: soft shafts of sunlight slanting
 * down from the surface, swaying slowly (CSS only, still under reduced
 * motion), and a faint shimmer along the top edge.
 */
export function SeaDecor({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,oklch(1_0_0/0.22),transparent)]" />
      <Ray className="left-[8%] w-[9%] [--sway:3deg]" />
      <Ray className="left-[26%] w-[5%] opacity-70 [--sway:-2deg] [animation-delay:-4s]" />
      <Ray className="left-[52%] w-[12%] [--sway:2.5deg] [animation-delay:-9s]" />
      <Ray className="left-[78%] w-[6%] opacity-80 [--sway:-3deg] [animation-delay:-6s]" />
    </div>
  );
}

function Ray({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "sea-ray absolute -top-[10%] h-[95%] origin-top rotate-[14deg] blur-[18px]",
        "bg-[linear-gradient(180deg,oklch(1_0_0/0.32),oklch(1_0_0/0.08)_60%,transparent)]",
        className,
      )}
    />
  );
}
