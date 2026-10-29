/**
 * Anonymous visitor names and colours. Limits here are mirrored in the
 * onPublish handler (amplify/events/room-onPublish.js): keep them in sync.
 */

/**
 * The visitor palette. Each colour carries white label text at ≥ 4.5:1, so
 * name pills stay readable on any background. The order is the protocol's
 * colour index: append, never reorder.
 */
export const VISITOR_COLORS = [
  { name: "Teal", hex: "#0f766e" }, // 5.5:1
  { name: "Coral", hex: "#c2410c" }, // 5.2:1
  { name: "Amber", hex: "#b45309" }, // 5.0:1
  { name: "Violet", hex: "#7c3aed" }, // 5.7:1
  { name: "Rose", hex: "#be123c" }, // 6.3:1
  { name: "Cobalt", hex: "#1d4ed8" }, // 6.7:1
  { name: "Jade", hex: "#15803d" }, // 5.0:1
  { name: "Orchid", hex: "#a21caf" }, // 6.3:1
  { name: "Indigo", hex: "#4338ca" }, // 7.9:1
  { name: "Slate", hex: "#475569" }, // 7.6:1
] as const;

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

/** The hex for a palette index; out-of-range indexes wrap rather than crash. */
export const colorHex = (index: number) =>
  VISITOR_COLORS[Math.abs(Math.floor(index)) % VISITOR_COLORS.length].hex;

/** "Teal Shark" → 🦈. Unknown creatures (older tabs, future names) get a bubble. */
export function creatureEmoji(name: string) {
  const creature = name.split(" ").at(-1) ?? "";
  return Object.hasOwn(CREATURE_EMOJI, creature)
    ? CREATURE_EMOJI[creature as keyof typeof CREATURE_EMOJI]
    : "🫧";
}
