/**
 * Small looping ASCII scenes: the About cards, the pufferfish and the zone
 * life. Each scene is a list of frames; each frame is a list of lines. Drawn
 * for this site. The shaded creatures (dolphin, pufferfish, anglerfish) are generated:
 * see scripts/gen-ascii-creatures.mjs.
 */
export type AsciiFrames = readonly (readonly string[])[];

export { anglerRodTip, anglerfish, dolphin, pufferIdle, pufferfish } from "./ascii-creatures.generated";

/** Rotates every line of `rows` right by k characters, once per frame. */
function drift(rows: readonly string[]): AsciiFrames {
  const width = rows[0].length;
  return Array.from({ length: width }, (_, k) =>
    rows.map((row) => row.slice(width - k) + row.slice(0, width - k)),
  );
}

/** Moves the rows up one per frame, wrapping the top row to the bottom. */
function rise(rows: readonly string[]): AsciiFrames {
  return rows.map((_, k) => [...rows.slice(k), ...rows.slice(0, k)]);
}

/** Pads every line to one width, so a scene never shifts as frames change. */
function box(lines: readonly string[], width: number): string[] {
  return lines.map((l) => l.padEnd(width));
}

/**
 * The water the dolphin leaps from: a crest and a fainter swell beneath it.
 * Each is drawn twice side by side and drifted by CSS (.dolphin-waves), so
 * it loops seamlessly with no re-renders.
 */
export const dolphinWaves = "~^~~-~~^~~~-~~^~-~~~^~~-~~~^~-~~^~~~-~~^~~-~~~^~-~~".repeat(2);
export const dolphinSwell = "-  -- -   ---  -  --   -  ---  - --  -   --  -  ---".repeat(2);

/**
 * The sun and the moon for the Manchester clock, two frames each: the
 * sun's rays and the moon's stars twinkle.
 */
export const sun: AsciiFrames = [
  ["     \\  |  /", "  '.  .---.  .'", "  -- (     ) --", "  .'  '---'  '.", "     /  |  \\"],
  ["     .  |  .", "  \\   .---.   /", " --- (     ) ---", "  /   '---'   \\", "     '  |  '"],
].map((f) => box(f, 16));

export const moon: AsciiFrames = [
  ["   *    .-~~.", "      .'  .-'", " .   /   (    *", "     \\    '-.", "  *   '.___.-'"],
  ["   .    .-~~.", "      .'  .-'", " *   /   (    .", "     \\    '-.", "  .   '.___.-'"],
].map((f) => box(f, 16));

/** A slow whale for the twilight zone; frame 1 spouts. */
export const whale: AsciiFrames = [
  [
    "",
    "",
    "            __.-------------.__",
    "       _.-''                   ''-._      __",
    "     .'   o                         '-._.' /",
    "    (        ___                        <",
    "     '._    '---'                   _.-'.\\ \\",
    "        ''--.._______________..--''      '._\\",
  ],
  [
    "            .  :  .",
    "             ':.:'",
    "            __.-:-----------.__",
    "       _.-''                   ''-._      __",
    "     .'   o                         '-._.' /",
    "    (        ___                        <",
    "     '._    '---'                   _.-'.\\ \\",
    "        ''--.._______________..--''      '._\\",
  ],
].map((f) => box(f, 48));

/** A crab for the seabed: two steps of a sideways scuttle. */
export const crab: AsciiFrames = [
  [" (\\/)  (\\/)", "  \\ \\__/ /", "  (_o__o_)", "  /|/  \\|\\"],
  [" (\\/)  (\\/)", "  \\ \\__/ /", "  (_o__o_)", "  |\\|  |/|"],
].map((f) => box(f, 12));

export const bubbles: AsciiFrames = rise([
  "   o      .  ",
  " .     O     ",
  "      .    o ",
  "  °     .    ",
  "     o     ° ",
  " O      .    ",
  "    .     o  ",
]);

export const school: AsciiFrames = drift([
  "  ><>        ><>         ",
  "        ><>       ><>    ",
  " ><>        ><((°>       ",
  "      ><>          ><>   ",
]);

export const jellyfish: AsciiFrames = [
  [
    "   _.---._   ",
    "  /  . .  \\  ",
    "  '-.-.-.-'  ",
    "   ( ( ( (   ",
    "    ) ) ) )  ",
    "   ( ( ( (   ",
    "    ) ) ) )  ",
  ],
  [
    "    .---.    ",
    "  .' . . '.  ",
    "  '-.-.-.-'  ",
    "    ) ) ) )  ",
    "   ( ( ( (   ",
    "    ) ) ) )  ",
    "   ( ( ( (   ",
  ],
];

// A sounder ping that grows from the dot, over kelp that sways each frame.
const PINGS = ["    ·    ", "   (·)   ", "  ((·))  ", " ( (·) ) "];
const KELP = [
  ["   (   )   (  ", "    ) (   )   ", "   (   )   (  ", "    ) (   )   "],
  ["    ) (   )   ", "   (   )   (  ", "    ) (   )   ", "   (   )   (  "],
];

export const kelp: AsciiFrames = PINGS.map((ping, i) => [
  `  ${ping}     `,
  "              ",
  ...KELP[i % 2],
  "  _(__)_(__)_ ",
]);

/** Kelp fronds for the seabed: tall, swaying in two frames. */
export const kelpForest: AsciiFrames = [
  [" )  (    )", "(    )  ( ", " )  (    )", "(    )  ( ", " )  (    )", "(    )  ( "],
  ["(    )  ( ", " )  (    )", "(    )  ( ", " )  (    )", "(    )  ( ", " )  (    )"],
];
