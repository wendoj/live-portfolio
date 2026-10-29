import { Amplify } from "aws-amplify";
import { CONNECTION_STATE_CHANGE, ConnectionState, events, type EventsChannel } from "aws-amplify/data";
import { Hub } from "aws-amplify/utils";
// Written by `npx ampx sandbox` / the pipeline; a stub without `custom.events`
// (scripts/ensure-amplify-outputs.mjs) keeps the site working as a static page.
import outputs from "../../../amplify_outputs.json";
import { ROOM_CHANNEL, type RoomEvt } from "./types";

/**
 * The WebSocket connection to /room/main.
 *
 * Amplify already reconnects a socket that drops mid-session (and reports it
 * through Hub). This wrapper adds what it doesn't do: retrying a failed
 * connect or subscribe with exponential backoff (1 s doubling to a 30 s cap,
 * full jitter), and a single `connected` flag the UI can hide behind.
 *
 * This module is imported lazily by the MultiplayerProvider, so Amplify
 * never weighs on the first paint.
 */

export type ConnectionStatus = "offline" | "connecting" | "connected";

type EventsOutputs = { url: string; aws_region: string; api_key?: string };

const eventsConfig = (outputs as { custom?: { events?: EventsOutputs } }).custom?.events;

let configured = false;

function configure() {
  if (!eventsConfig?.api_key) return false;
  if (!configured) {
    Amplify.configure({
      API: {
        Events: {
          endpoint: eventsConfig.url,
          region: eventsConfig.aws_region,
          defaultAuthMode: "apiKey",
          apiKey: eventsConfig.api_key,
        },
      },
    });
    configured = true;
  }
  return true;
}

const BASE_DELAY = 1_000;
const MAX_DELAY = 30_000;

// Hub states in which the socket can carry events.
const LIVE_STATES = new Set<string>([ConnectionState.Connected, ConnectionState.ConnectedPendingKeepAlive]);

export function createRoomConnection({
  onEvent,
  onStatus,
}: {
  onEvent: (payload: unknown) => void;
  onStatus: (status: ConnectionStatus) => void;
}) {
  if (!configure()) {
    onStatus("offline");
    return { publish: (() => {}) as (evt: RoomEvt) => void, close: () => {} };
  }

  let channel: EventsChannel | null = null;
  let subscription: { unsubscribe(): void } | null = null;
  let subscribed = false;
  let socketLive = false;
  let attempt = 0;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let closed = false;
  let status: ConnectionStatus | null = null;

  const setStatus = (next: ConnectionStatus) => {
    if (next === status) return;
    status = next;
    onStatus(next);
  };

  const update = () => {
    if (closed) return;
    if (subscribed && socketLive) setStatus("connected");
    else setStatus(subscribed || retryTimer === undefined ? "connecting" : "offline");
  };

  const stopHub = Hub.listen("api", ({ payload }) => {
    if (payload.event !== CONNECTION_STATE_CHANGE) return;
    const { connectionState } = payload.data as { connectionState: string };
    socketLive = LIVE_STATES.has(connectionState);
    update();
  });

  const teardown = () => {
    subscription?.unsubscribe();
    channel?.close();
    subscription = null;
    channel = null;
    subscribed = false;
  };

  const retry = () => {
    teardown();
    if (closed) return;
    const delay = Math.random() * Math.min(MAX_DELAY, BASE_DELAY * 2 ** attempt);
    attempt += 1;
    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      void open();
    }, delay);
    update();
  };

  async function open() {
    update();
    try {
      const ch = await events.connect(ROOM_CHANNEL);
      if (closed) return ch.close();
      channel = ch;
      const sub = ch.subscribe({
        next: (data: { event?: unknown }) => onEvent(data?.event),
        error: () => retry(),
      });
      subscription = sub;
      await sub.ready;
      if (closed || subscription !== sub) return;
      subscribed = true;
      // The subscription ACK proves the socket is up, whatever Hub said last.
      socketLive = true;
      attempt = 0;
      update();
    } catch {
      retry();
    }
  }

  void open();

  return {
    /** Fire-and-forget: events published while offline are dropped. */
    publish(evt: RoomEvt) {
      if (status !== "connected" || !channel) return;
      channel.publish(evt).catch(() => {
        // Rejected by the validator or lost to a dropping socket. Presence
        // heals on the next heartbeat; cursors on the next move.
      });
    },
    close() {
      closed = true;
      clearTimeout(retryTimer);
      stopHub();
      teardown();
    },
  };
}

export type RoomConnection = ReturnType<typeof createRoomConnection>;
