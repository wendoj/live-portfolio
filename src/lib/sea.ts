/**
 * Shared state for the ASCII sea canvases, in viewport (client) pixels.
 *
 * `seaCursors`: the local pointer writes "local"; the CursorLayer writes one
 * entry per remote visitor after mapping their position onto this layout. Sharks get curious about still cursors and flee fast ones.
 *
 * Bubble bursts: a click on a shark calls `emitSeaBurst`. Every mounted sea
 * canvas hears it and draws the burst if the point falls inside it.
 */
export const seaCursors = new Map<string, { x: number; y: number }>();

type BurstListener = (x: number, y: number) => void;
const burstListeners = new Set<BurstListener>();

export function onSeaBurst(listener: BurstListener) {
  burstListeners.add(listener);
  return () => {
    burstListeners.delete(listener);
  };
}

export function emitSeaBurst(x: number, y: number) {
  for (const listener of burstListeners) listener(x, y);
}
