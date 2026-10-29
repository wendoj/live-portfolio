"use client";

import { EraserIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PALETTE } from "@/lib/guestbook";

/** Colour picker for the guestbook: palette ids 0 (eraser) to 7. */
export function PalettePicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange?: (id: number) => void;
  disabled?: boolean;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="swatch"
      spacing={2}
      value={String(value)}
      onValueChange={(v) => v && onChange?.(Number(v))}
      disabled={disabled}
      aria-label="Paint colour"
      className="flex-wrap"
    >
      {PALETTE.map((p) => (
        <Tooltip key={p.id}>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value={String(p.id)}
              aria-label={p.name}
              style={p.id === 0 ? undefined : { backgroundColor: `var(--px-${p.id})` }}
              className={p.id === 0 ? "bg-background text-muted-foreground" : undefined}
            >
              {p.id === 0 && <EraserIcon className="size-4" strokeWidth={1.75} />}
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            {p.name} · {p.id}
          </TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}
