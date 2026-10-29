"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ConnectionStatus, RoomConnection } from "@/lib/realtime/client";
import { createFloodGuard } from "@/lib/realtime/floodGuard";
import { loadIdentity } from "@/lib/realtime/identity";
import { useRoomSetting } from "@/lib/realtime/settings";
import { parseRoomEvt, senderOf, type Device, type Visitor } from "@/lib/realtime/types";
import { type RemoteCursor, useCursors } from "@/lib/realtime/useCursors";
import { type Peer, usePresence } from "@/lib/realtime/usePresence";

type Multiplayer = {
  /** True only while the room is live: every multiplayer surface hides otherwise. */
  connected: boolean;
  self: Visitor | null;
  /** Everyone else, oldest first. Away visitors are included (they still count). */
  peers: Peer[];
  peersRef: React.RefObject<Map<string, Peer>>;
  cursorsRef: React.RefObject<Map<string, RemoteCursor>>;
  /** Called whenever a remote cursor moves or disappears. */
  subscribeCursors: (listener: () => void) => () => void;
  /** Go invisible: listen without joining, so nobody sees or counts you. */
  invisible: boolean;
  setInvisible: (on: boolean) => void;
  /** Hide others' cursors (and edge indicators) on this screen only. */
  hideOthers: boolean;
  setHideOthers: (on: boolean) => void;
};

const MultiplayerContext = createContext<Multiplayer | null>(null);

export function useMultiplayer() {
  const value = useContext(MultiplayerContext);
  if (!value) throw new Error("useMultiplayer must be used inside <MultiplayerProvider>");
  return value;
}

const detectDevice = (): Device =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches ? "pointer" : "touch";

/**
 * Owns the room: the connection, this tab's identity, presence and cursors.
 * Everything renders as a static page until the connection is live.
 */
export function MultiplayerProvider({ children }: { children: React.ReactNode }) {
  const [connection, setConnection] = useState<RoomConnection | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("offline");
  const [self, setSelf] = useState<Visitor | null>(null);
  const [device, setDevice] = useState<Device>("pointer");

  const [invisible, setInvisible, settingsLoaded] = useRoomSetting("invisible");
  const [hideOthers, setHideOthers] = useRoomSetting("hideOthers");

  const presence = usePresence({
    connection,
    status,
    self,
    setSelf,
    device,
    // Until settings are read, an invisible visitor mustn't flash a join.
    hidden: invisible || !settingsLoaded,
  });
  const cursors = useCursors({ connection, status, self, device, joined: presence.joined });

  // Incoming events route through refs, so the socket never needs re-wiring.
  const handlers = useRef({ presence: presence.receive, cursor: cursors.receive, selfId: self?.id });
  useEffect(() => {
    handlers.current = { presence: presence.receive, cursor: cursors.receive, selfId: self?.id };
  });

  useEffect(() => {
    // Client-only state (sessionStorage, media queries), set after hydration.
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelf(loadIdentity());
    setDevice(detectDevice());
    /* eslint-enable react-hooks/set-state-in-effect */

    const allow = createFloodGuard();
    let conn: RoomConnection | null = null;
    let cancelled = false;

    // Amplify loads only once the page has loaded and the browser is idle,
    // so it never competes with the hero for the first paint.
    const start = () => {
      void import("@/lib/realtime/client").then(({ createRoomConnection }) => {
        if (cancelled) return;
        conn = createRoomConnection({
          onStatus: setStatus,
          onEvent: (payload) => {
            const evt = parseRoomEvt(payload);
            if (!evt) return;
            const sender = senderOf(evt);
            // AppSync echoes our own events back to us.
            if (sender === handlers.current.selfId || !allow(sender)) return;
            if (evt.type === "cursor") handlers.current.cursor(evt);
            else handlers.current.presence(evt);
          },
        });
        setConnection(conn);
      });
    };
    let idle: ReturnType<typeof setTimeout> | number | undefined;
    const whenIdle = () => {
      idle =
        "requestIdleCallback" in window
          ? window.requestIdleCallback(start, { timeout: 1_500 })
          : // Safari has no requestIdleCallback.
            setTimeout(start, 200);
    };
    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", whenIdle);
      if (idle !== undefined) {
        if ("cancelIdleCallback" in window) window.cancelIdleCallback(idle as number);
        else clearTimeout(idle);
      }
      conn?.close();
    };
  }, []);

  // A cursor goes when its owner's presence does.
  const { peers } = presence;
  const { cursorsRef, forget } = cursors;
  useEffect(() => {
    const present = new Set(peers.map((p) => p.visitor.id));
    for (const id of cursorsRef.current.keys()) if (!present.has(id)) forget(id);
  }, [peers, cursorsRef, forget]);

  const value = useMemo<Multiplayer>(
    () => ({
      connected: status === "connected",
      self,
      peers,
      peersRef: presence.peersRef,
      cursorsRef,
      subscribeCursors: cursors.subscribe,
      invisible,
      setInvisible,
      hideOthers,
      setHideOthers,
    }),
    [
      status,
      self,
      peers,
      presence.peersRef,
      cursorsRef,
      cursors.subscribe,
      invisible,
      setInvisible,
      hideOthers,
      setHideOthers,
    ],
  );

  return <MultiplayerContext.Provider value={value}>{children}</MultiplayerContext.Provider>;
}
