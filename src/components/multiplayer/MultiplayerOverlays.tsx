"use client";

import dynamic from "next/dynamic";
import { useMultiplayer } from "./MultiplayerProvider";

// Neither renders anything until the room is live, so their code (and the
// Radix popovers, switch and tooltips the dock uses) loads only then.
const CursorLayer = dynamic(() => import("./CursorLayer").then((m) => m.CursorLayer), { ssr: false });
const Dock = dynamic(() => import("./Dock").then((m) => m.Dock), { ssr: false });

/** The cursor layer, edge indicators and dock, mounted once connected. */
export function MultiplayerOverlays() {
  const { connected } = useMultiplayer();
  if (!connected) return null;
  return (
    <>
      <CursorLayer />
      <Dock />
    </>
  );
}
