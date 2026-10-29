"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { rerollColor, saveIdentity } from "./identity";
import type { ConnectionStatus, RoomConnection } from "./client";
import type { Device, PresenceEvt, Visitor } from "./types";

export type Peer = {
  visitor: Visitor;
  device: Device;
  away: boolean;
  /** Local receipt times (performance.now()). */
  joinedAt: number;
  lastSeen: number;
};

const HEARTBEAT_ACTIVE = 5_000;
const HEARTBEAT_AWAY = 30_000;
const TIMEOUT_ACTIVE = 15_000;
const TIMEOUT_AWAY = 75_000;
/** Hidden this long, a tab says goodbye; it rejoins when it comes back. */
const HIDDEN_LEAVE_AFTER = 5 * 60_000;
/** Late-join replies are spread over this window so they don't all land at once. */
const REPLY_JITTER = 500;

const FIRST_INPUT_EVENTS = ["pointermove", "scroll", "touchstart", "keydown"] as const;

/**
 * Who else is here.
 *
 * A tab listens from the moment it connects but only joins (and is counted)
 * after its first real input, which keeps crawlers, Lighthouse and untouched
 * tabs out of everyone's count. Joined tabs answer each newcomer's `join`
 * with a `here`, so a newcomer sees the whole room within ~0.5 s.
 *
 * `hidden` (Go invisible, or settings not read yet) keeps the tab a silent
 * listener: it still sees everyone but never joins, so nobody counts it.
 */
export function usePresence({
  connection,
  status,
  self,
  setSelf,
  device,
  hidden,
}: {
  connection: RoomConnection | null;
  status: ConnectionStatus;
  self: Visitor | null;
  setSelf: (visitor: Visitor) => void;
  device: Device;
  hidden: boolean;
}) {
  const peersRef = useRef(new Map<string, Peer>());
  const [peers, setPeers] = useState<Peer[]>([]);
  const [joined, setJoined] = useState(false);

  // Mutable mirrors, so timers and listeners always see current values.
  const state = useRef({ wantsJoin: false, joined: false, leftWhileHidden: false });
  const latest = useRef({ connection, status, self, device, hidden });
  useEffect(() => {
    latest.current = { connection, status, self, device, hidden };
  });

  const commit = useCallback(() => {
    setPeers([...peersRef.current.values()].sort((a, b) => a.joinedAt - b.joinedAt));
  }, []);

  const send = useCallback((type: PresenceEvt["type"]) => {
    const { connection, status, self, device } = latest.current;
    if (!connection || status !== "connected" || !self) return;
    connection.publish({ type, visitor: self, device, away: document.hidden });
  }, []);

  const heartbeatTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const scheduleHeartbeat = useCallback(() => {
    clearTimeout(heartbeatTimer.current);
    heartbeatTimer.current = setTimeout(
      function beat() {
        if (!state.current.joined) return;
        send("heartbeat");
        heartbeatTimer.current = setTimeout(beat, document.hidden ? HEARTBEAT_AWAY : HEARTBEAT_ACTIVE);
      },
      document.hidden ? HEARTBEAT_AWAY : HEARTBEAT_ACTIVE,
    );
  }, [send]);

  const join = useCallback(() => {
    const { status, self, hidden } = latest.current;
    if (status !== "connected" || !self || hidden) return;
    // Two identical name + colour pills would be confusing: re-roll the colour.
    const clash = [...peersRef.current.values()].some(
      (p) => p.visitor.name === self.name && p.visitor.color === self.color,
    );
    if (clash) {
      const next = { ...self, color: rerollColor(self.color) };
      saveIdentity(next);
      latest.current.self = next;
      setSelf(next);
    }
    send("join");
    state.current.joined = true;
    state.current.leftWhileHidden = false;
    setJoined(true);
    scheduleHeartbeat();
  }, [scheduleHeartbeat, send, setSelf]);

  const leave = useCallback(() => {
    if (!state.current.joined) return;
    send("leave");
    state.current.joined = false;
    setJoined(false);
    clearTimeout(heartbeatTimer.current);
  }, [send]);

  useEffect(() => {
    const onFirstInput = () => {
      for (const type of FIRST_INPUT_EVENTS) window.removeEventListener(type, onFirstInput);
      state.current.wantsJoin = true;
      if (!state.current.joined) join();
    };
    for (const type of FIRST_INPUT_EVENTS) window.addEventListener(type, onFirstInput, { passive: true });
    return () => {
      for (const type of FIRST_INPUT_EVENTS) window.removeEventListener(type, onFirstInput);
    };
  }, [join]);

  // (Re)join whenever the connection comes up; forget everyone when it drops.
  useEffect(() => {
    if (status === "connected") {
      if (state.current.wantsJoin && !state.current.leftWhileHidden) join();
      return;
    }
    state.current.joined = false;
    setJoined(false);
    clearTimeout(heartbeatTimer.current);
    peersRef.current.clear();
    commit();
  }, [status, join, commit]);

  // Away state: heartbeat at once with the new flag; leave after 5 min hidden.
  useEffect(() => {
    let hiddenTimer: ReturnType<typeof setTimeout> | undefined;
    const onVisibility = () => {
      clearTimeout(hiddenTimer);
      if (document.hidden) {
        if (!state.current.joined) return;
        send("heartbeat");
        scheduleHeartbeat();
        hiddenTimer = setTimeout(() => {
          leave();
          state.current.leftWhileHidden = true;
        }, HIDDEN_LEAVE_AFTER);
      } else if (state.current.joined) {
        send("heartbeat");
        scheduleHeartbeat();
      } else if (state.current.wantsJoin) {
        join();
      }
    };
    const onPageHide = () => leave();
    const onPageShow = (e: PageTransitionEvent) => {
      // Restored from the back/forward cache after a pagehide `leave`.
      if (e.persisted && state.current.wantsJoin) join();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      clearTimeout(hiddenTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [join, leave, scheduleHeartbeat, send]);

  // Drop peers that have gone quiet.
  useEffect(() => {
    const sweep = setInterval(() => {
      const now = performance.now();
      let changed = false;
      for (const [id, peer] of peersRef.current) {
        if (now - peer.lastSeen > (peer.away ? TIMEOUT_AWAY : TIMEOUT_ACTIVE)) {
          peersRef.current.delete(id);
          changed = true;
        }
      }
      if (changed) commit();
    }, 2_000);
    return () => clearInterval(sweep);
  }, [commit]);

  useEffect(() => () => clearTimeout(heartbeatTimer.current), []);

  // Going invisible says goodbye; coming back joins at once (if the tab has
  // had real input, and isn't parked in the background).
  useEffect(() => {
    if (hidden) leave();
    else if (state.current.wantsJoin && !state.current.joined && !state.current.leftWhileHidden) join();
  }, [hidden, join, leave]);

  /** Feed every presence event from someone else through here. */
  const receive = useCallback(
    (evt: PresenceEvt) => {
      const now = performance.now();
      const { id } = evt.visitor;
      const existing = peersRef.current.get(id);

      if (evt.type === "leave") {
        if (existing && peersRef.current.delete(id)) commit();
        return;
      }

      const away = evt.away === true;
      const changed =
        !existing ||
        existing.away !== away ||
        existing.visitor.name !== evt.visitor.name ||
        existing.visitor.color !== evt.visitor.color;
      peersRef.current.set(id, {
        visitor: evt.visitor,
        device: evt.device,
        away,
        // A rejoin counts as new, so it can take the About selection.
        joinedAt: existing && evt.type !== "join" ? existing.joinedAt : now,
        lastSeen: now,
      });
      if (changed || evt.type === "join") commit();

      if (evt.type === "join" && state.current.joined) {
        setTimeout(() => {
          if (state.current.joined) send("here");
        }, Math.random() * REPLY_JITTER);
      }
    },
    [commit, send],
  );

  return { peers, peersRef, joined, receive };
}
