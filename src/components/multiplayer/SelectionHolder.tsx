"use client";

import { multiplayer } from "@/lib/content";
import { visitorColor } from "@/lib/realtime/names";
import { CursorGlyph } from "./CursorGlyph";
import { useMultiplayer } from "./MultiplayerProvider";

/**
 * The cursor holding the About statement's selection box: the newest other
 * real visitor, never you. Alone or offline, a stand-in holds it.
 */
export function SelectionHolder({ className }: { className?: string }) {
  const { connected, peers } = useMultiplayer();
  const newest = connected ? peers.at(-1)?.visitor : undefined;
  const holder = newest ?? multiplayer.selectionFallback;
  return <CursorGlyph name={holder.name} color={visitorColor(holder.color)} className={className} />;
}
