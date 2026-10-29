"use client";

import { EraserIcon } from "lucide-react";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PALETTE } from "@/lib/guestbook";

/** Colour picker for the guestbook. The choice will drive painting once it opens. */
export function PalettePicker() {
  const [colour, setColour] = useState("2");

  return (
    <ToggleGroup
      type="single"
      variant="swatch"
      spacing={2}
      value={colour}
      onValueChange={(v) => v && setColour(v)}
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
          <TooltipContent>{p.name}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}
