import { MAX_NAME_LENGTH, VISITOR_COLORS, randomColor, randomName } from "./names";
import type { Visitor } from "./types";

/**
 * One identity per tab, kept in sessionStorage: a reload keeps the name, a
 * new tab gets a new one (so two tabs are two visitors, which helps demos).
 * Storage can throw (private mode, blocked site data), so every access is
 * guarded and falls back to an in-memory identity.
 */
const KEY = "live-portfolio:visitor";
const ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => ID_CHARS[b % ID_CHARS.length]).join("");
}

function isVisitor(v: unknown): v is Visitor {
  if (!v || typeof v !== "object") return false;
  const { id, name, color } = v as Record<string, unknown>;
  return (
    typeof id === "string" &&
    /^[A-Za-z0-9]{8}$/.test(id) &&
    typeof name === "string" &&
    name.length > 0 &&
    name.length <= MAX_NAME_LENGTH &&
    typeof color === "number" &&
    Number.isInteger(color) &&
    color >= 0 &&
    color < VISITOR_COLORS.length
  );
}

export function saveIdentity(visitor: Visitor) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(visitor));
  } catch {
    // Storage unavailable: the identity lives for this page load only.
  }
}

export function loadIdentity(): Visitor {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    if (isVisitor(stored)) return stored;
  } catch {
    // Fall through to a fresh identity.
  }
  const visitor = { id: randomId(), name: randomName(), color: randomColor() };
  saveIdentity(visitor);
  return visitor;
}

/** A different palette index from `color`. */
export function rerollColor(color: number) {
  const next = Math.floor(Math.random() * (VISITOR_COLORS.length - 1));
  return next >= color ? next + 1 : next;
}
