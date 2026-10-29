import outputs from "../../amplify_outputs.json";

/**
 * The HTTP API (the guestbook). Its base URL comes from
 * amplify_outputs.json; without it (a fresh clone, no sandbox) every call
 * resolves to null and the page shows its static fallbacks.
 */
const base = (outputs as { custom?: { api?: { url?: string } } }).custom?.api?.url?.replace(/\/$/, "");

export const apiAvailable = Boolean(base);

const RETRIES = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * GET with retries: throttling (429) and server errors back off 0.5 s, 1 s,
 * 2 s with full jitter, so a burst of visitors spreads itself out.
 */
export async function getJson<T>(path: string): Promise<T | null> {
  if (!base) return null;
  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await fetch(`${base}${path}`);
      if (res.ok) return (await res.json()) as T;
      if (res.status !== 429 && res.status < 500) return null;
    } catch {
      // Network error: retry like a 5xx.
    }
    if (attempt >= RETRIES - 1) return null;
    await sleep(Math.random() * 500 * 2 ** attempt);
  }
}

export async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  if (!base) return null;
  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}
