/**
 * Anonymous visitor names and colours. Limits here are mirrored in the
 * onPublish handler (amplify/events/room-onPublish.js): keep them in sync.
 */

/**
 * The visitor palette: a pastel fill with a deep ink of the same hue for
 * label text and outlines, at ≥ 4.5:1 on the fill. The order is the
 * protocol's colour index: append, never reorder.
 */
export const VISITOR_COLORS = [
  { name: "Teal", hex: "#99f6e4", ink: "#115e59" }, // 6.0:1
  { name: "Coral", hex: "#fed7aa", ink: "#9a3412" }, // 5.4:1
  { name: "Amber", hex: "#fde68a", ink: "#92400e" }, // 5.7:1
  { name: "Violet", hex: "#ddd6fe", ink: "#5b21b6" }, // 6.5:1
  { name: "Rose", hex: "#fecdd3", ink: "#9f1239" }, // 5.7:1
  { name: "Cobalt", hex: "#bfdbfe", ink: "#1e40af" }, // 6.1:1
  { name: "Jade", hex: "#bbf7d0", ink: "#166534" }, // 5.9:1
  { name: "Orchid", hex: "#f5d0fe", ink: "#86198f" }, // 6.0:1
  { name: "Indigo", hex: "#c7d2fe", ink: "#3730a3" }, // 6.7:1
  { name: "Slate", hex: "#e2e8f0", ink: "#334155" }, // 8.4:1
] as const;

export type VisitorColor = (typeof VISITOR_COLORS)[number];

/**
 * Creatures and their dock emoji. Several have no emoji of their own and
 * borrow the closest one.
 */
const CREATURE_EMOJI = {
  Ray: "🐟", // no ray emoji
  Eel: "🐍", // closest match
  Squid: "🦑",
  Shark: "🦈",
  Octopus: "🐙",
  Turtle: "🐢",
  Seal: "🦭",
  Otter: "🦦",
  Dolphin: "🐬",
  Whale: "🐋",
  Crab: "🦀",
  Seahorse: "🐠", // no seahorse emoji
  Puffer: "🐡",
  Urchin: "🦔", // closest match
  Jellyfish: "🪼",
} as const;

const CREATURES = Object.keys(CREATURE_EMOJI) as (keyof typeof CREATURE_EMOJI)[];

export const MAX_NAME_LENGTH = 32;

const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

/** "Teal Ray". The adjective is a colour word, chosen apart from the visitor's actual colour. */
export const randomName = () => `${pick(VISITOR_COLORS).name} ${pick(CREATURES)}`;

export const randomColor = () => Math.floor(Math.random() * VISITOR_COLORS.length);

/** The colour for a palette index; out-of-range indexes wrap rather than crash. */
export const visitorColor = (index: number): VisitorColor =>
  VISITOR_COLORS[Math.abs(Math.floor(index)) % VISITOR_COLORS.length];

export const colorHex = (index: number) => visitorColor(index).hex;

/** "Teal Shark" → 🦈. Unknown creatures (older tabs, future names) get a bubble. */
export function creatureEmoji(name: string) {
  const creature = name.split(" ").at(-1) ?? "";
  return Object.hasOwn(CREATURE_EMOJI, creature)
    ? CREATURE_EMOJI[creature as keyof typeof CREATURE_EMOJI]
    : "🫧";
}
