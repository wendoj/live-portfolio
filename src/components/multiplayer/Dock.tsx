"use client";

import { CheckIcon, LinkIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { multiplayer } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { useMultiplayer } from "./MultiplayerProvider";
import { PeoplePopover } from "./PeoplePopover";
import { VisibilityPopover } from "./VisibilityPopover";

/** Peers shown as avatars; the rest collapse into "+N". */
const MAX_AVATARS = 3;
const COPIED_FOR = 2_000;
const { dock } = multiplayer;

/** On phones the dock tucks away while scrolling down and returns on the way up. */
function useHideOnScrollDown(paused: boolean) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 8) return;
      setHidden(y > lastY && y > 80);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // An open popover keeps the dock in place.
  return hidden && !paused;
}

function InviteButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + window.location.pathname);
    } catch {
      return; // Clipboard blocked: leave the button as it was.
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_FOR);
  };

  const icon = "absolute inset-0 size-4 transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-opacity";
  return (
    <Button variant="ghost" size="sm" onClick={copy} aria-label={dock.inviteLabel} className="gap-2 px-3.5">
      <span aria-hidden className="relative size-4">
        <LinkIcon className={cn(icon, copied && "scale-50 opacity-0")} />
        <CheckIcon className={cn(icon, "text-sea-ink", !copied && "scale-50 opacity-0")} />
      </span>
      <span aria-hidden>{copied ? dock.copied : dock.invite}</span>
      <span role="status" className="sr-only">
        {copied ? dock.copied : ""}
      </span>
    </Button>
  );
}

const Divider = ({ className }: { className?: string }) => (
  <span aria-hidden className={cn("h-6 w-px shrink-0 bg-foreground/10", className)} />
);

/**
 * The bottom-centre dock: you, the newest three others side by side, "+N"
 * for the rest (a button listing everyone), visibility settings and Invite.
 * Hidden while disconnected.
 */
export function Dock() {
  const { connected, self, peers, invisible } = useMultiplayer();
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hidden = useHideOnScrollDown(peopleOpen || settingsOpen);
  if (!connected || !self) return null;

  // Newest first, so a fresh arrival always takes the first slot.
  const newestFirst = [...peers].reverse();
  const shown = newestFirst.slice(0, MAX_AVATARS);
  const more = peers.length - shown.length;

  return (
    <div
      data-hidden={hidden}
      className={cn(
        "glass fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] left-1/2 z-[35] flex h-12 -translate-x-1/2 items-center gap-2 rounded-full pr-1.5 pl-2 animate-in fade-in-0 md:bottom-6",
        // Phones: slide away on scroll down (fade under reduced motion).
        "transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.2,0,0,1)] max-md:data-[hidden=true]:pointer-events-none max-md:data-[hidden=true]:translate-y-[calc(100%+24px)] max-md:data-[hidden=true]:opacity-0 motion-reduce:max-md:data-[hidden=true]:translate-y-0",
      )}
    >
      <ul aria-label={dock.label} className="flex items-center gap-1.5">
        <li>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1.5 rounded-full pr-1">
                <Avatar visitor={self} invisible={invisible} />
                <span className="text-[13px] font-medium tracking-[-0.01em] whitespace-nowrap">
                  {dock.you}
                  <span className="sr-only">
                    , {self.name}
                    {invisible && `, ${dock.invisible}`}
                  </span>
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              {self.name}
              {invisible && ` · ${dock.invisible}`}
            </TooltipContent>
          </Tooltip>
        </li>

        {shown.length > 0 && (
          <li aria-hidden>
            <Divider className="mx-0.5 block" />
          </li>
        )}

        {shown.map(({ visitor, away }) => (
          <li key={visitor.id} className="animate-in duration-300 fade-in-0 motion-safe:zoom-in-75">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block">
                  <Avatar visitor={visitor} away={away}>
                    {visitor.name}
                    {away && `, ${dock.away}`}
                  </Avatar>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                {visitor.name}
                {away && ` · ${dock.away}`}
              </TooltipContent>
            </Tooltip>
          </li>
        ))}

        {more > 0 && (
          <li>
            <PeoplePopover peers={newestFirst} hiddenCount={more} onOpenChange={setPeopleOpen} />
          </li>
        )}
      </ul>

      <Divider />
      <VisibilityPopover onOpenChange={setSettingsOpen} />
      <div className="hidden items-center md:flex">
        <InviteButton />
      </div>
    </div>
  );
}
