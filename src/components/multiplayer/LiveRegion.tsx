"use client";

import { useEffect, useRef, useState } from "react";
import { multiplayer } from "@/lib/content";
import { useMultiplayer } from "./MultiplayerProvider";

const QUIET_FOR = 10_000;

/**
 * Tells screen-reader users when someone joins, at most once every 10 s
 * (arrivals in between are summed). Cursor movement is never announced.
 */
export function LiveRegion() {
  const { peers } = useMultiplayer();
  const [message, setMessage] = useState("");
  const known = useRef<Set<string> | null>(null);
  const pending = useRef<string[]>([]);
  const lastSpoke = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const ids = new Set(peers.map((p) => p.visitor.id));
    // Whoever is here when the room connects isn't "joining".
    if (!known.current) {
      known.current = ids;
      return;
    }
    for (const p of peers) if (!known.current.has(p.visitor.id)) pending.current.push(p.visitor.name);
    known.current = ids;
    if (!pending.current.length) return;

    const speak = () => {
      const names = pending.current;
      pending.current = [];
      lastSpoke.current = Date.now();
      setMessage(names.length === 1 ? multiplayer.announce.joined(names[0]) : multiplayer.announce.joinedMany(names.length));
    };
    const wait = QUIET_FOR - (Date.now() - lastSpoke.current);
    clearTimeout(timer.current);
    if (wait <= 0) speak();
    else timer.current = setTimeout(speak, wait);
  }, [peers]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}
