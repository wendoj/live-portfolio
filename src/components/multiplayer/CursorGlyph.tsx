import { SmartphoneIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const pill =
  "rounded-full px-1.5 py-px text-[11px] leading-tight font-medium tracking-[-0.01em] whitespace-nowrap text-white shadow-sm";

/**
 * A Figma-style cursor: an arrow with the visitor's name in a pill. The
 * arrow's tip sits ~2px in from the element's top-left corner. Colours change with a
 * short transition, so a new holder of the About selection cross-fades in.
 */
export function CursorGlyph({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  return (
    <span className={cn("flex items-start", className)}>
      <svg
        viewBox="0 0 16 16"
        className="size-3.5 transition-colors duration-300"
        style={{ color }}
      >
        <path
          d="M2 1.5 13.5 7l-5 1.4L6 13.5Z"
          fill="currentColor"
          stroke="white"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={cn(pill, "mt-2.5 transition-colors duration-300")}
        style={{ backgroundColor: color }}
      >
        {/* Keyed so a new name fades in rather than snapping. */}
        <span key={name} className="block animate-in duration-300 fade-in-0">
          {name}
        </span>
      </span>
    </span>
  );
}

/** A touch visitor: no pointer, so a phone pill centred on what they're looking at. */
export function TouchGlyph({ name, color }: { name: string; color: string }) {
  return (
    <span
      className={cn(pill, "flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 py-0.5 pl-1.5")}
      style={{ backgroundColor: color }}
    >
      <SmartphoneIcon aria-hidden className="size-3 stroke-[2.25]" />
      {name}
    </span>
  );
}
