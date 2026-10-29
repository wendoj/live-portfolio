"use client";

import { EyeIcon } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { multiplayer } from "@/lib/content";
import { useMultiplayer } from "./MultiplayerProvider";

const { visibility: copy } = multiplayer;

function Row({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3 rounded-lg px-2 py-2">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block cursor-pointer text-[13px] font-medium tracking-[-0.01em]">
          {label}
        </label>
        <p id={`${id}-hint`} className="mt-0.5 text-xs leading-snug text-muted-foreground">
          {hint}
        </p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} aria-describedby={`${id}-hint`} className="mt-0.5" />
    </div>
  );
}

/** The dock's settings: Go invisible and Hide others' cursors. */
export function VisibilityPopover({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const { invisible, setInvisible, hideOthers, setHideOthers } = useMultiplayer();
  return (
    <Popover onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={copy.button}>
              <EyeIcon />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {copy.button}
        </TooltipContent>
      </Tooltip>
      <PopoverContent side="top" sideOffset={12} className="glass w-72 gap-0 rounded-2xl bg-(--glass) p-2 shadow-(--glass-shadow)">
        <Row {...copy.invisible} checked={invisible} onChange={setInvisible} />
        <Row {...copy.hideOthers} checked={hideOthers} onChange={setHideOthers} />
      </PopoverContent>
    </Popover>
  );
}
