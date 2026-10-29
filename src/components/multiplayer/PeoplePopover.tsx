"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { multiplayer } from "@/lib/content";
import type { Peer } from "@/lib/realtime/usePresence";
import { Avatar } from "./Avatar";

const { dock } = multiplayer;

/**
 * The dock's "+N": a button that lists everyone here (including the
 * avatars already shown), so the room is always fully visible.
 */
export function PeoplePopover({
  peers,
  hiddenCount,
  onOpenChange,
}: {
  /** Everyone else, newest first. */
  peers: Peer[];
  hiddenCount: number;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger
        aria-label={dock.showAll(peers.length)}
        className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-foreground/80 text-[11px] font-semibold text-white tabular-nums outline-none transition-[background-color,scale] duration-150 ease-out hover:bg-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.96]"
      >
        {dock.more(hiddenCount)}
      </PopoverTrigger>
      <PopoverContent side="top" sideOffset={12} className="glass w-64 gap-1 rounded-2xl bg-(--glass) p-2 shadow-(--glass-shadow)">
        <p className="px-2 pt-1 pb-1.5 text-[13px] font-medium tracking-[-0.01em]">
          {dock.peopleTitle(peers.length)}
        </p>
        <ul className="flex max-h-[280px] flex-col overflow-y-auto">
          {peers.map(({ visitor, away }) => (
            <li key={visitor.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <Avatar visitor={visitor} size="sm" away={away} />
              <span className="min-w-0 truncate text-[13px] tracking-[-0.01em]">{visitor.name}</span>
              {away && <span className="ml-auto text-xs text-muted-foreground">{dock.away}</span>}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
