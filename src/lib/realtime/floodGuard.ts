/**
 * Ignores any visitor id that sends more than `limit` events in one second,
 * for `banMs`. The API key is public, so a script could flood the channel;
 * with the onPublish validator in front, the worst it can do is inflate the
 * count, never break the page.
 */
export function createFloodGuard(limit = 30, banMs = 60_000) {
  const windows = new Map<string, { start: number; count: number }>();
  const bannedUntil = new Map<string, number>();

  return function allow(id: string, now = performance.now()) {
    const ban = bannedUntil.get(id);
    if (ban !== undefined) {
      if (now < ban) return false;
      bannedUntil.delete(id);
    }

    const w = windows.get(id);
    if (!w || now - w.start >= 1000) {
      windows.set(id, { start: now, count: 1 });
      // Random ids would otherwise grow the map forever; drop stale windows.
      if (windows.size > 500) {
        for (const [key, value] of windows) if (now - value.start >= 1000) windows.delete(key);
      }
      return true;
    }

    w.count += 1;
    if (w.count > limit) {
      bannedUntil.set(id, now + banMs);
      windows.delete(id);
      return false;
    }
    return true;
  };
}
