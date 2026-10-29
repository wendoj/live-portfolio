"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { hero, multiplayer } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useMultiplayer } from "./MultiplayerProvider";

const FADE = 75; // ms each way: a 150 ms cross-fade

/**
 * The hero badge: "Open to internships" alone or offline, "● You + N
 * swimming here" with company. The text fades out, swaps, and fades back,
 * so the badge never shows two widths at once.
 */
export function LiveBadge({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const { connected, peers } = useMultiplayer();
  const others = connected ? peers.length : 0;
  const [shown, setShown] = useState(others);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (others === shown) return;
    // Fade out, then swap the text (which fades it back in).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFading(true);
    const t = setTimeout(() => {
      setShown(others);
      setFading(false);
    }, FADE);
    return () => clearTimeout(t);
  }, [others, shown]);

  return (
    <Badge variant="sea-rect" className={className} style={style}>
      <span
        className={cn("flex items-center gap-1.5 transition-opacity ease-out", fading && "opacity-0")}
        style={{ transitionDuration: `${FADE}ms` }}
      >
        {shown > 0 ? (
          <>
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {multiplayer.liveBadge(shown)}
          </>
        ) : (
          hero.offlineBadge
        )}
      </span>
    </Badge>
  );
}
