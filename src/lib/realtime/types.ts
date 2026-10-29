/**
 * The real-time protocol: every event on /room/main is one of these.
 * The onPublish handler (amplify/events/room-onPublish.js) enforces the same
 * shapes server-side; `parseRoomEvt` re-checks them on the way in.
 */

/** `color` is an index into VISITOR_COLORS (names.ts). */
export type Visitor = { id: string; name: string; color: number };

export type Device = "pointer" | "touch";

export type PresenceEvt = {
  type: "join" | "here" | "heartbeat" | "leave";
  visitor: Visitor;
  device: Device;
  away?: boolean;
};

/**
 * A position relative to the page's content, not the viewport: x/y are 0..1
 * inside the nearest `[data-anchor]`, or inside the `[data-section]` when
 * there is no anchor. Each receiver resolves it against its own layout.
 */
export type CursorEvt = {
  type: "cursor";
  id: string;
  device: Device;
  section: string;
  anchor?: string;
  x: number;
  y: number;
  t: number;
};

export type RoomEvt = PresenceEvt | CursorEvt;

export const ROOM_CHANNEL = "room/main";

const PRESENCE_TYPES = new Set(["join", "here", "heartbeat", "leave"]);

const isDevice = (d: unknown): d is Device => d === "pointer" || d === "touch";
const isUnit = (n: unknown) => typeof n === "number" && n >= 0 && n <= 1;

/** Narrows an incoming payload to a RoomEvt, or returns null. */
export function parseRoomEvt(raw: unknown): RoomEvt | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;

  if (e.type === "cursor") {
    const ok =
      typeof e.id === "string" &&
      isDevice(e.device) &&
      typeof e.section === "string" &&
      (e.anchor === undefined || typeof e.anchor === "string") &&
      isUnit(e.x) &&
      isUnit(e.y);
    return ok ? (e as CursorEvt) : null;
  }

  if (typeof e.type === "string" && PRESENCE_TYPES.has(e.type)) {
    const v = e.visitor as Record<string, unknown> | undefined;
    const ok =
      !!v &&
      typeof v.id === "string" &&
      typeof v.name === "string" &&
      typeof v.color === "number" &&
      isDevice(e.device);
    return ok ? (e as PresenceEvt) : null;
  }

  return null;
}

/** The visitor id an event belongs to. */
export const senderOf = (e: RoomEvt) => (e.type === "cursor" ? e.id : e.visitor.id);
