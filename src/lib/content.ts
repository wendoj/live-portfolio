/** All portfolio copy lives here so the components stay purely presentational. */

export const site = {
  name: "Wendy Ji",
  title: "Wendy Ji",
  description:
    "Wendy Ji's multiplayer portfolio: swim with whoever else is reading, leave a mark, and find out what she builds.",
} as const;

export const links = {
  email: "mailto:wendoj@proton.me",
  github: "https://github.com/wendoj",
  linkedin: "https://linkedin.com/in/wendy-ji",
  prodpod: "https://prodpod.app",
  repo: "https://github.com/wendoj/live-portfolio",
} as const;

export const nav = [
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "guestbook", label: "Guestbook" },
  { id: "contact", label: "Contact" },
] as const;

export const hero = {
  greeting: "Hi, I'm",
  name: "Wendy Ji.",
  sub: "First-year CS & Maths at Manchester. I build real-time things and I'm curious about systems and ML.",
  offlineBadge: "Open to internships",
  primaryCta: { label: "See my work", href: "#projects" },
  secondaryCta: { label: "Say hello", href: "#contact" },
} as const;

/**
 * The dive. Each section is a real ocean zone; scrolling through a section
 * descends from `from` to `to` metres (the sounding line interpolates). The
 * order is the page order.
 */
export type ZoneId = "surface" | "about" | "projects" | "guestbook" | "contact";

export const zones = [
  { id: "surface", section: "top", name: "Surface", from: 0, to: 0 },
  { id: "about", section: "about", name: "Sunlight zone", from: 0, to: 200 },
  { id: "projects", section: "projects", name: "Twilight zone", from: 200, to: 1000 },
  { id: "guestbook", section: "guestbook", name: "Midnight zone", from: 1000, to: 4000 },
  { id: "contact", section: "contact", name: "Seabed", from: 4000, to: 4200 },
] as const satisfies readonly { id: ZoneId; section: string; name: string; from: number; to: number }[];

/** "−2,400 m". The minus is U+2212, so it lines up with the digits. */
export function formatDepth(m: number) {
  return m === 0 ? "0 m" : `−${Math.round(m).toLocaleString("en-GB")} m`;
}

/**
 * The About statement is a sequence of text runs. `select: true` wraps a run
 * in the Figma-style selection box that a visitor's cursor "holds".
 */
export type StatementPart = { text: string; select?: boolean };

export const about = {
  // "together" carries the live selection.
  strong: [
    { text: "I'm Wendy, a first-year at Manchester who likes making things people use" },
    { text: "together.", select: true },
  ] satisfies StatementPart[],
  soft: [
    {
      text: "Right now I'm digging into systems and machine learning, and spending too much time on side projects.",
    },
  ] satisfies StatementPart[],
  skills: [
    { group: "Languages", items: ["TypeScript", "Python", "C++", "Java", "SQL"] },
    { group: "Frameworks", items: ["React", "Next.js", "Node.js", "Fastify", "Flask"] },
    { group: "Tools", items: ["Git", "Docker", "GitHub Actions", "AWS", "Redis", "pandas / NumPy"] },
  ],
  now: [
    "First term at Manchester",
    "Building this site for the AWS Student Builder Challenge",
    "Joining all of the hackathons",
  ],
  offTheClock: {
    hobbies: [
      { emoji: "🧠", label: "Binging Korean brain survival shows" },
      { emoji: "🎮", label: "Playing Valorant and Deadlock" },
      { emoji: "🤖", label: "Building robots" },
    ],
    societies: ["Robotics Society", "UniCS", "Women in Tech", "Hackchester"],
  },
  currentlyInto: [
    { kind: "Reading", title: "A Tour of C++" },
    { kind: "Watching", title: "Steel Ball Run: JoJo's Bizarre Adventure 2nd Stage" },
  ],
  studying: { what: "CS & Maths", where: "University of Manchester", years: "2026–2030" },
  buildingSince: "2021",
} as const;

/**
 * What Wendy is probably doing, by UK time. The first matching rule wins.
 * `days`: 0 = Sunday … 6 = Saturday; hours are [from, to).
 */
export const manchester = {
  timeZone: "Europe/London",
  label: "Manchester",
  rules: [
    { from: 0, to: 7, status: "asleep (probably)" },
    { days: [1, 2, 3, 4, 5], from: 9, to: 17, status: "in a lecture or a lab" },
    { days: [0, 6], from: 9, to: 19, status: "at a hackathon?" },
    { from: 17, to: 24, status: "on side projects" },
  ] as readonly { days?: readonly number[]; from: number; to: number; status: string }[],
  fallback: "awake, somewhere",
} as const;

export const prodpod = {
  name: "Prodpod",
  tags: ["Real-time", "Web app"],
  summary: "A real-time study platform where students work together over live video, chat and screen sharing. I built it solo, end to end.",
  stats: [
    { value: "12,000+", label: "users" },
    { value: "206K", label: "impressions" },
  ],
  link: { href: links.prodpod, label: "Visit Prodpod" },
  video: "/projects/prodpod.mp4",
  image: "/projects/home-page.png",
} as const;

export const thisSite = {
  name: "This portfolio",
  puffLabel: "Puff up the pufferfish",
  tags: ["AWS", "Multiplayer"],
  summary:
    "Live cursors and a shared pixel guestbook.",
  link: { href: links.repo, label: "Read the code" },
} as const;

export const earlierWork = [
  {
    id: "unqueue",
    name: "Unqueue",
    tags: ["E-commerce", "Web app"],
    summary: "E-commerce platform for selling digital products.",
    video: "/projects/unqueue.webm",
    href: null,
  },
  {
    id: "translatebot",
    name: "TranslateBot",
    tags: ["Discord bot", "Multilingual"],
    summary: "Multilingual translation bot for Discord.",
    video: "/projects/translate_bot.webm",
    href: "https://translatebot.app/",
  },
  {
    id: "infinitevps",
    name: "InfiniteVPS",
    tags: ["Hosting", "Web app"],
    summary: "High-performance VPS hosting.",
    video: "/projects/infinitevps.webm",
    href: null,
  },
] as const;

export const guestbook = {
  title: { strong: "Leave a mark.", soft: "Every pixel shows up for everyone reading." },
  canvasLabel: "Shared guestbook canvas, 32 by 32 pixels",
  instructions:
    "Click or tap a square to paint it (drag to paint a line). With the keyboard: arrow keys move, Space paints, 1 to 7 pick a colour and 0 the eraser.",
  ink: (left: number, max: number) => `Ink ${left}/${max}`,
  inkLabel: (left: number, max: number) => `${left} of ${max} pixels of ink left; it refills over a minute`,
  offline: "Live painting is offline right now; showing the starting drawing.",
  painted: (x: number, y: number, colour: string) => `Painted ${colour} at column ${x + 1}, row ${y + 1}`,
} as const;

export const contact = {
  kicker: "Want to work together?",
  statement:
    "I'm open to internships and part-time work, and always happy to talk about systems, ML or real-time things.",
  items: [
    { label: "Email", href: links.email, icon: "mail" },
    { label: "GitHub", href: links.github, icon: "github" },
    { label: "LinkedIn", href: links.linkedin, icon: "linkedin" },
  ],
} as const;

/** Copy for the live multiplayer layer. */
export const multiplayer = {
  /** Hero badge with N ≥ 1 others here (away visitors count). */
  liveBadge: (others: number) => `You + ${others} swimming here`,
  /** Nav bubble: "+2" beside the bubble, and its tooltip. */
  navCount: (others: number) => `+${others}`,
  navCountLabel: (others: number) => `${others} other ${others === 1 ? "person" : "people"} reading now`,
  /** Who holds the About selection when nobody else is here. */
  selectionFallback: { name: "Coral Shark", color: 1 },
  dock: {
    label: "People here now",
    you: "You",
    invisible: "Invisible",
    away: "away",
    more: (n: number) => `+${n}`,
    showAll: (total: number) => `Show all ${total} ${total === 1 ? "person" : "people"} here`,
    peopleTitle: (total: number) => `${total} other ${total === 1 ? "person" : "people"} here`,
    invite: "Invite",
    copied: "Link copied",
    inviteLabel: "Copy a link to this page",
  },
  visibility: {
    button: "Visibility",
    invisible: { label: "Go invisible", hint: "Others won't see you or count you." },
    hideOthers: { label: "Hide others' cursors", hint: "Their cursors disappear from your screen." },
  },
  /** Screen-reader announcements (at most one per 10 s). */
  announce: {
    joined: (name: string) => `${name} joined`,
    joinedMany: (n: number) => `${n} people joined`,
  },
  edge: {
    aboveLabel: "People further up the page",
    belowLabel: "People further down the page",
    scrollTo: (name: string) => `Scroll to ${name}`,
    more: (n: number) => `+${n}`,
    moreLabel: (n: number) => `and ${n} more`,
  },
} as const;

export const footer = {
  privacy:
    "Live cursors are anonymous and never stored.",
  builtWith: "Built on AWS · Amplify · AppSync Events · Lambda · DynamoDB",
} as const;
