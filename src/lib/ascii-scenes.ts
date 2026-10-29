/**
 * Small looping ASCII scenes for the About cards' backdrops. Each scene is a
 * list of frames; each frame is a list of lines. Drawn for this site.
 */
export type AsciiFrames = readonly (readonly string[])[];

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

// Tail beat: the three tail characters on each frame.
const TAILS = [
  ["\\", ">", "/"],
  ["-", "=", "-"],
  ["/", ">", "\\"],
];

export const shark: AsciiFrames = [0, 1, 2, 1].map((i) => {
  const [a, b, c] = TAILS[i];
  return [
    "             |\\          ",
    "            /  |         ",
    `  ${a}\`-.___.-'   \`--.__    `,
    `   ${b}   .   .        o\`>  `,
    `  ${c}_.-'\`--..______..-'    `,
  ];
});

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
