"use client";

import dynamic from "next/dynamic";
import { useMultiplayer } from "./MultiplayerProvider";

// None of these render anything at first paint, so their code (and the
// Radix popovers, switch and tooltips the dock uses) loads only after.
const CursorLayer = dynamic(() => import("./CursorLayer").then((m) => m.CursorLayer), { ssr: false });
const Dock = dynamic(() => import("./Dock").then((m) => m.Dock), { ssr: false });
const LiveRegion = dynamic(() => import("./LiveRegion").then((m) => m.LiveRegion), { ssr: false });

/** Everything layered over the page; it all waits for a connection. */
export function MultiplayerOverlays() {
  const { connected } = useMultiplayer();
  if (!connected) return null;
  return (
    <>
      <CursorLayer />
      <Dock />
      <LiveRegion />
    </>
  );
}
