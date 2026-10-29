import { cn } from "@/lib/utils";

/**
 * A few ASCII fish drifting left to right across a thin lane, at different
 * speeds and heights. CSS only (see .fish in globals.css); decorative.
 */
const FISH = [
  { glyph: "><>", top: "10%", x: 18, d: 34, delay: -6 },
  { glyph: "><(((º>", top: "52%", x: 64, d: 46, delay: -27 },
  { glyph: "><>", top: "30%", x: 40, d: 40, delay: -19 },
  { glyph: "<°)))><", top: "70%", x: 82, d: 52, delay: -44, flip: true },
];

export function FishSchool({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("fish-lane pointer-events-none relative h-8 overflow-hidden", className)}>
      {FISH.map(({ glyph, top, x, d, delay, flip }, i) => (
        <span
          key={i}
          className={cn(
            "fish absolute left-0 font-mono text-[11px] leading-none whitespace-pre text-sea/45",
            // The one facing left swims the other way.
            flip && "[animation-direction:reverse]",
          )}
          style={{ top, "--x": x, "--d": `${d}s`, animationDelay: `${delay}s` } as React.CSSProperties}
        >
          <span style={{ animationDelay: `${i * -0.7}s` }}>{glyph}</span>
        </span>
      ))}
    </div>
  );
}
