/**
 * onPublish handler for the `room` namespace (APPSYNC_JS runtime).
 *
 * Every event a browser publishes passes through here before it fans out.
 * Anything that doesn't match the protocol in src/lib/realtime/types.ts is
 * marked with an `error`, so it is never broadcast and the publisher gets a
 * failure back. Keep the limits in sync with src/lib/realtime/names.ts.
 *
 * APPSYNC_JS is a restricted subset of JavaScript: no regex literals (use
 * util.matches), no try/catch, no `++`, no `in`, no C-style for loops.
 */
import { util } from "@aws-appsync/utils";

const MAX_BYTES = 1024;
const MAX_NAME = 32;
const PALETTE_SIZE = 10;
const SLUG = "^[a-z0-9-]{1,48}$";
const VISITOR_ID = "^[A-Za-z0-9]{8}$";
const PRESENCE_TYPES = ["join", "here", "heartbeat", "leave"];

function isUnit(n) {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1;
}

function isSlug(s) {
  return typeof s === "string" && util.matches(SLUG, s);
}

function isVisitorId(s) {
  return typeof s === "string" && util.matches(VISITOR_ID, s);
}

function isDevice(d) {
  return d === "pointer" || d === "touch";
}

function isVisitor(v) {
  if (!v || typeof v !== "object") return false;
  const nameOk = typeof v.name === "string" && v.name.length > 0 && v.name.length <= MAX_NAME;
  const colorOk =
    typeof v.color === "number" && Math.floor(v.color) === v.color && v.color >= 0 && v.color < PALETTE_SIZE;
  return isVisitorId(v.id) && nameOk && colorOk;
}

/** Returns why an event is rejected, or null when it may be broadcast. */
function reject(p) {
  if (!p || typeof p !== "object") return "not an object";
  if (JSON.stringify(p).length > MAX_BYTES) return "too large";

  if (p.type === "cursor") {
    if (!isVisitorId(p.id) || !isDevice(p.device)) return "bad cursor sender";
    if (!isSlug(p.section)) return "bad section";
    if (p.anchor !== undefined && !isSlug(p.anchor)) return "bad anchor";
    if (!isUnit(p.x) || !isUnit(p.y)) return "coordinates out of range";
    if (typeof p.t !== "number" || !Number.isFinite(p.t)) return "bad timestamp";
    return null;
  }

  if (PRESENCE_TYPES.indexOf(p.type) !== -1) {
    if (!isVisitor(p.visitor)) return "bad visitor";
    if (!isDevice(p.device)) return "bad device";
    if (p.away !== undefined && typeof p.away !== "boolean") return "bad away flag";
    return null;
  }

  return "unknown type";
}

export function onPublish(ctx) {
  return ctx.events.map((event) => {
    const reason = reject(event.payload);
    if (reason) event.error = reason;
    return event;
  });
}
