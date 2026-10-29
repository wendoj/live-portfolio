"use client";

import { PresenceBubble } from "@/components/brand/PresenceBubble";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { multiplayer } from "@/lib/content";
import { useMultiplayer } from "./MultiplayerProvider";

/**
 * The nav's bubble. With others here it rises on a loop with "+N" beside it;
 * hovering lists who. Alone or offline it is the still bubble.
 * The count is decorative here: the hero badge carries it for screen readers.
 */
export function NavPresence() {
  const { connected, peers } = useMultiplayer();
  const others = connected ? peers.length : 0;

  if (others === 0) return <PresenceBubble />;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span aria-hidden className="flex items-center gap-1.5">
          <PresenceBubble live />
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={10} className="flex-col items-start gap-0.5">
        <span className="font-medium">{multiplayer.navCountLabel(others)}</span>
        {peers.map(({ visitor, away }) => (
          <span key={visitor.id} className="opacity-80">
            {visitor.name}
            {away && ` · ${multiplayer.dock.away}`}
          </span>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}
