/**
 * Ignores any visitor id that floods the room, for `banMs`. The API key is
 * public, so a script could flood the channel; with the onPublish validator
 * in front, the worst it can do is inflate the count, never break the page.
 *
 * A token bucket per id: it holds up to `burst` events and refills at `rate`
 * per second. Counting by arrival time alone (at most N in any one second)
 * banned honest visitors: when this tab stalls for a moment (a busy main
 * thread, a background tab resuming), the WebSocket's buffered messages
 * arrive in one burst. A normal visitor sends at most ~20 cursor events a
 * second, so a few seconds of backlog fits in the bucket, while a sustained
 * flood above `rate` empties it within seconds and is banned.
 */
export function createFloodGuard(rate = 30, burst = 120, banMs = 60_000) {
  const buckets = new Map<string, { tokens: number; at: number }>();
  const bannedUntil = new Map<string, number>();

  return function allow(id: string, now = performance.now()) {
    const ban = bannedUntil.get(id);
    if (ban !== undefined) {
      if (now < ban) return false;
      bannedUntil.delete(id);
    }

    const b = buckets.get(id);
    if (!b) {
      buckets.set(id, { tokens: burst - 1, at: now });
      // Random ids would otherwise grow the map forever; drop idle (full) buckets.
      if (buckets.size > 500) {
        for (const [key, value] of buckets) if ((now - value.at) * (rate / 1000) >= burst) buckets.delete(key);
      }
      return true;
    }

    b.tokens = Math.min(burst, b.tokens + ((now - b.at) * rate) / 1000);
    b.at = now;
    if (b.tokens < 1) {
      bannedUntil.set(id, now + banMs);
      buckets.delete(id);
      return false;
    }
    b.tokens -= 1;
    return true;
  };
}
