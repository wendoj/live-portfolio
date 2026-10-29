import { cn } from "@/lib/utils";

/**
 * A small bubble beside the name. Still while offline; once the multiplayer
 * layer is connected (Phase 2) `live` sends a smaller bubble rising off it on
 * a loop. Uses currentColor, so it follows the nav's white-on-sea /
 * ink-on-white switch.
 */
export function PresenceBubble({
  live = false,
  className,
}: {
  live?: boolean;
  className?: string;
}) {
  return (
    <span aria-hidden className={cn("relative inline-flex size-2.5", className)}>
      {live && (
        <span className="presence-rise absolute top-0 left-1/2 size-1 -translate-x-1/2 rounded-full border border-current" />
      )}
      <span
        className={cn(
          "relative size-2.5 rounded-full border-[1.5px] border-current",
          "after:absolute after:top-[1.5px] after:left-[1.5px] after:size-[3px] after:rounded-full after:bg-current",
          !live && "opacity-70",
        )}
      />
    </span>
  );
}
