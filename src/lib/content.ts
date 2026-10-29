/**
 * All portfolio copy lives here so the components stay purely presentational.
 * Anything marked TODO is a placeholder to fill in before submission.
 */

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
  // TODO: draft; edit freely.
  sub: "First-year CS & Maths at Manchester. I build real-time things and I'm curious about systems and ML.",
  offlineBadge: "Open to internships",
  primaryCta: { label: "See my work", href: "#projects" },
  secondaryCta: { label: "Say hello", href: "#contact" },
} as const;

/**
 * The About statement is a sequence of text runs. `select: true` wraps a run
 * in the Figma-style selection box that a visitor's cursor "holds".
 */
export type StatementPart = { text: string; select?: boolean };

export const about = {
  // TODO: draft statement; edit freely. "together" carries the live selection.
  strong: [
    { text: "I'm Wendy, a first-year at Manchester who likes making things people use" },
    { text: "together.", select: true },
  ] satisfies StatementPart[],
  soft: [
    {
      text: "Right now I'm digging into systems and machine learning, and spending too much time on side projects.",
    },
  ] satisfies StatementPart[],
  // Trimmed to what I'd happily talk about in an interview.
  skills: [
    { group: "Languages", items: ["TypeScript", "Python", "C++", "Java", "SQL"] },
    { group: "Frameworks", items: ["React", "Next.js", "Node.js", "Fastify", "Flask"] },
    { group: "Tools", items: ["Git", "Docker", "GitHub Actions", "AWS", "Redis", "pandas / NumPy"] },
  ],
  // TODO: what I'm working on this month.
  now: [
    "First term at Manchester",
    "Building this site for the AWS Student Builder Challenge",
    "Joining all of the hackathons",
  ],
  // TODO: replace the placeholder hobbies.
  offTheClock: {
    hobbies: [
      { emoji: "🎧", label: "TODO hobby" },
      { emoji: "🍵", label: "TODO hobby" },
      { emoji: "🧩", label: "TODO hobby" },
    ],
    societies: ["Robotics Society", "UniCS", "Women in Tech", "Hackchester"],
  },
  // TODO: what I'm into right now.
  currentlyInto: [
    { kind: "Reading", title: "TODO book" },
    { kind: "Listening", title: "TODO album or podcast" },
    { kind: "Watching", title: "TODO show" },
  ],
  studying: { what: "CS & Maths", where: "University of Manchester", years: "2026–2030" },
  buildingSince: "2021",
} as const;

export const prodpod = {
  name: "Prodpod",
  tags: ["Real-time", "Web app"],
  summary: "A real-time study platform I built and grew to 11,000+ users.",
  stats: [
    { value: "11,000+", label: "users" },
    { value: "180K", label: "impressions" },
  ],
  link: { href: links.prodpod, label: "Visit Prodpod" },
  // TODO: replace with a real screenshot in public/projects/ (16:9, ≥ 2400px wide).
  image: null as string | null,
} as const;

export const thisSite = {
  name: "This portfolio",
  tags: ["AWS", "Multiplayer"],
  summary:
    "Live cursors, reactions, cursor chat, ghost replays and a shared pixel guestbook.",
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
  edge: {
    aboveLabel: "People further up the page",
    belowLabel: "People further down the page",
    scrollTo: (name: string) => `Scroll to ${name}`,
    more: (n: number) => `+${n}`,
    moreLabel: (n: number) => `and ${n} more`,
  },
} as const;

export const footer = {
  builtWith: "Built on AWS · Amplify · AppSync Events · Lambda · DynamoDB",
} as const;
