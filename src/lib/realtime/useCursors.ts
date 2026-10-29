"use client";

import { useCallback, useEffect, useRef } from "react";
import { type Located, locate, locateViewportCentre } from "./anchors";
import type { ConnectionStatus, RoomConnection } from "./client";
import type { CursorEvt, Device, Visitor } from "./types";

export type RemoteCursor = Located & {
  device: Device;
  /** performance.now() of the last event that changed the point. */
  movedAt: number;
};

const POINTER_THROTTLE = 50;
const TOUCH_THROTTLE = 200;

/**
 * Sends this visitor's position and collects everyone else's.
 *
 * Remote cursors live in a mutable Map rather than React state: they change
 * up to 20 times a second each, and the CursorLayer reads them in its frame
 * loop. `subscribe` tells the layer when something arrived.
 */
export function useCursors({
  connection,
  status,
  self,
  device,
  joined,
}: {
  connection: RoomConnection | null;
  status: ConnectionStatus;
  self: Visitor | null;
  device: Device;
  joined: boolean;
}) {
  const cursorsRef = useRef(new Map<string, RemoteCursor>());
  const listeners = useRef(new Set<() => void>());

  const notify = useCallback(() => {
    for (const listener of listeners.current) listener();
  }, []);

  const subscribe = useCallback((listener: () => void) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const receive = useCallback(
    (evt: CursorEvt) => {
      const prev = cursorsRef.current.get(evt.id);
      const moved =
        !prev || prev.anchor !== evt.anchor || prev.section !== evt.section || prev.x !== evt.x || prev.y !== evt.y;
      cursorsRef.current.set(evt.id, {
        device: evt.device,
        section: evt.section,
        anchor: evt.anchor,
        x: evt.x,
        y: evt.y,
        movedAt: moved || !prev ? performance.now() : prev.movedAt,
      });
      notify();
    },
    [notify],
  );

  const forget = useCallback(
    (id: string) => {
      if (cursorsRef.current.delete(id)) notify();
    },
    [notify],
  );

  // Sending: only once joined, so nobody sees a cursor without a name.
  const selfId = self?.id;
  useEffect(() => {
    if (!connection || status !== "connected" || !joined || !selfId) return;

    let lastSent = 0;
    let lastKey = "";
    let pending: ReturnType<typeof setTimeout> | undefined;
    let pointer: { x: number; y: number } | null = null;

    const sendPoint = (point: Located | null) => {
      if (!point) return;
      const key = `${point.anchor ?? point.section}:${point.x}:${point.y}`;
      if (key === lastKey) return;
      lastKey = key;
      lastSent = performance.now();
      connection.publish({ type: "cursor", id: selfId, device, ...point, t: Date.now() });
    };

    const read = () =>
      device === "pointer" ? (pointer ? locate(pointer.x, pointer.y) : null) : locateViewportCentre();

    // Leading + trailing throttle: the first move goes at once, the last is never lost.
    const throttle = (interval: number) => {
      if (pending) return;
      const wait = interval - (performance.now() - lastSent);
      if (wait <= 0) return sendPoint(read());
      pending = setTimeout(() => {
        pending = undefined;
        sendPoint(read());
      }, wait);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer = { x: e.clientX, y: e.clientY };
      throttle(POINTER_THROTTLE);
    };
    // Scrolling moves the content under a still pointer, so it counts as movement.
    const onScroll = () => throttle(device === "pointer" ? POINTER_THROTTLE : TOUCH_THROTTLE);
    const onTouchEnd = () => sendPoint(read());

    window.addEventListener("scroll", onScroll, { passive: true });
    if (device === "pointer") {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    } else {
      window.addEventListener("touchend", onTouchEnd, { passive: true });
      sendPoint(read());
    }
    return () => {
      clearTimeout(pending);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [connection, status, joined, selfId, device]);

  // Cursors are meaningless without the connection.
  useEffect(() => {
    if (status === "connected") return;
    cursorsRef.current.clear();
    notify();
  }, [status, notify]);

  return { cursorsRef, receive, forget, subscribe };
}
