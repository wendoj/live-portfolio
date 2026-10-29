import { MailIcon } from "lucide-react";
import { AsciiSea } from "@/components/sea/AsciiSea";
import { SeaDecor } from "@/components/sea/SeaDecor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { contact } from "@/lib/content";

// lucide dropped brand logos, so these two are drawn inline (currentColor).
function GitHubIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function LinkedInIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

const icons = { mail: MailIcon, github: GitHubIcon, linkedin: LinkedInIcon };

export function Contact() {
  return (
    <section
      id="contact"
      data-section="contact"
      aria-labelledby="contact-title"
      className="px-3 pt-8 sm:px-6"
    >
      <div
        data-anchor="contact-panel"
        className="relative isolate mx-auto flex min-h-[560px] max-w-[88rem] flex-col items-center justify-center overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,var(--sea-deep)_0%,var(--sea)_45%,var(--sea-mid)_100%)] px-5 py-24 text-center sm:rounded-[36px]">
        <SeaDecor />
        <AsciiSea
          sharks={1}
          fish={9}
          className="[mask-image:radial-gradient(ellipse_40%_32%_at_50%_50%,transparent_35%,black_100%)]"
        />

        <div className="relative z-10 flex max-w-3xl flex-col items-center [text-shadow:0_1px_14px_oklch(0.4_0.1_215/0.55)]">
          <Badge variant="bracket" className="text-white/80" data-reveal>
            [04] · Contact
          </Badge>
          <h2
            id="contact-title"
            data-reveal
            style={{ "--i": 1 } as React.CSSProperties}
            className="mt-6 text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.15] font-medium tracking-[-0.035em] text-white"
          >
            {contact.kicker}
          </h2>
          <p
            data-reveal
            style={{ "--i": 2 } as React.CSSProperties}
            className="mt-4 text-[clamp(1.75rem,3.4vw,2rem)] leading-[1.15] font-medium tracking-[-0.035em] text-white/75"
          >
            {contact.statement}
          </p>
          <ul
            data-reveal
            style={{ "--i": 3, textShadow: "none" } as React.CSSProperties}
            className="mt-10 flex flex-wrap justify-center gap-3"
          >
            {contact.items.map(({ label, href, icon }) => {
              const Icon = icons[icon];
              const external = href.startsWith("http");
              return (
                <li key={label}>
                  <Button asChild variant="primary" surface="sea" size="lg">
                    <a
                      href={href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      <Icon data-icon="inline-start" />
                      {label}
                      {external && <span className="sr-only">(opens in a new tab)</span>}
                    </a>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
