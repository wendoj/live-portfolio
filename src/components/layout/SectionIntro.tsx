import { FishSchool } from "@/components/sea/FishSchool";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Centred section opener: "[01] · ABOUT" above a two-tone title, where the
 * second sentence sits in the soft tone, with a few fish drifting past above.
 * Each chunk reveals in sequence.
 */
export function SectionIntro({
  index,
  label,
  id,
  strong,
  soft,
  className,
}: {
  index: number;
  label: string;
  id: string;
  strong: string;
  soft?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-3xl text-center", className)}>
      <FishSchool className="mx-auto mb-4 max-w-sm" />
      <Badge variant="bracket" data-reveal style={{ "--i": 0 } as React.CSSProperties}>
        [{String(index).padStart(2, "0")}] · {label}
      </Badge>
      <h2
        id={`${id}-title`}
        data-reveal
        style={{ "--i": 1 } as React.CSSProperties}
        className="mt-5 text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.15] font-medium tracking-[-0.035em] text-ink-strong"
      >
        {strong}
        {soft && <span className="text-ink-soft"> {soft}</span>}
      </h2>
    </div>
  );
}
