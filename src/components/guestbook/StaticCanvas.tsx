import { GRID_SIZE } from "@/lib/guestbook";

/** The canvas as plain SVG: the server-rendered first paint, and the live canvas's drawing. */
export function CanvasPixels({ cells }: { cells: string }) {
  const pixels = [...cells].flatMap((c, i) =>
    c === "0" ? [] : [{ x: i % GRID_SIZE, y: Math.floor(i / GRID_SIZE), c }],
  );
  return (
    <>
      <defs>
        <pattern id="gb-dots" width="1" height="1" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r="0.06" fill="oklch(0.18 0.012 265 / 0.18)" />
        </pattern>
      </defs>
      <rect width={GRID_SIZE} height={GRID_SIZE} fill="url(#gb-dots)" />
      {pixels.map(({ x, y, c }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={`var(--px-${c})`} />
      ))}
    </>
  );
}
