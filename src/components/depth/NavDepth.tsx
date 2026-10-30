"use client";

import { useEffect, useState } from "react";
import { formatDepth } from "@/lib/content";
import { trackDepth } from "@/lib/depth";
import { cn } from "@/lib/utils";

/**
 * The compact depth readout in the nav pill, for screens without room for
 * the sounding line. Re-renders only when the rounded depth changes.
 * Decorative (aria-hidden), like the sounding line.
 */
export function NavDepth({ className }: { className?: string }) {
  const [depth, setDepth] = useState<number | null>(null);

  useEffect(() => trackDepth(({ depth }) => setDepth(Math.round(depth))), []);

  return (
    <span aria-hidden className={cn("label-mono text-[11px] whitespace-nowrap text-muted-foreground tabular-nums", className)}>
      {depth === null ? "" : formatDepth(depth)}
    </span>
  );
}
