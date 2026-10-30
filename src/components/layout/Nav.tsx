"use client";

import { MenuIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { PresenceBubble } from "@/components/brand/PresenceBubble";
import { NavPresence } from "@/components/multiplayer/NavPresence";
import { NavDepth } from "@/components/depth/NavDepth";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { nav, site } from "@/lib/content";
import { useOverSea } from "@/lib/use-over-sea";
import { cn } from "@/lib/utils";

/** Which section sits in the middle band of the viewport. */
function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          // The hero isn't a nav item: being there clears the highlight.
          setActive(entry.target.id === "top" ? null : entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const { id } of [{ id: "top" }, ...nav]) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return active;
}

export function Nav() {
  const active = useActiveSection();
  const overSea = useOverSea();

  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center px-4">
      <nav
        aria-label="Sections"
        // Over the hero there is no container: just the name and plain links.
        // Past the hero it becomes a frosted pill. The width change is skipped
        // under reduced motion.
        className={cn(
          "pointer-events-auto flex h-14 w-full items-center gap-2 rounded-full border border-transparent pr-2 pl-5 transition-[max-width,background-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-[background-color,color,box-shadow]",
          overSea
            ? // The same soft shadow as the hero copy, so white text holds over glyphs and pale water.
              "max-w-6xl text-white [text-shadow:0_1px_12px_oklch(0.4_0.1_215/0.55)]"
            : "glass max-w-3xl text-foreground",
        )}
      >
        <a
          href="#top"
          className="mr-auto flex items-center gap-2 rounded-full text-[17px] font-medium tracking-[-0.03em]"
        >
          <NavPresence />
          {site.name}
        </a>

        <ul className="hidden items-center md:flex">
          {nav.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={active === id ? "location" : undefined}
                className={cn(
                  "block rounded-full px-3.5 py-2 text-[15px] font-medium tracking-[-0.03em] transition-[background-color,opacity] duration-150",
                  overSea
                    ? "opacity-85 hover:opacity-100 aria-[current]:opacity-100"
                    : "opacity-70 hover:bg-foreground/5 hover:opacity-100 aria-[current]:bg-foreground/[0.06] aria-[current]:opacity-100",
                )}
              >
                {/* DayDream roll: the label slides up and a fainter copy rolls in. */}
                <span className="nav-roll">
                  <span className="nav-roll__stack">
                    <span>{label}</span>
                    <span aria-hidden className="nav-roll__ghost">
                      {label}
                    </span>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        {/* Below xl, the depth lives in the pill (the sounding line takes over at xl). */}
        {!overSea && <NavDepth className="xl:hidden" />}

        <ThemeToggle overSea={overSea} />

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              className={cn("md:hidden", overSea && "hover:bg-white/15")}
            >
              <MenuIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="top"
            // The Sheet ships bg-popover and shadow-lg, which beat .glass; swap them
            // for the glass values so the menu matches the nav pill.
            className="glass m-3 rounded-[28px] bg-(--glass) px-6 pt-6 pb-8 shadow-(--glass-shadow)"
          >
            <SheetTitle className="flex items-center gap-2 text-[17px] tracking-[-0.03em]">
              <PresenceBubble />
              {site.name}
            </SheetTitle>
            <ul className="mt-4 flex flex-col">
              {nav.map(({ id, label }) => (
                <li key={id}>
                  <SheetClose asChild>
                    <a
                      href={`#${id}`}
                      aria-current={active === id ? "location" : undefined}
                      className="block py-2 text-4xl font-medium tracking-[-0.04em] text-ink-soft transition-colors duration-150 hover:text-foreground aria-[current]:text-foreground"
                    >
                      {label}
                    </a>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
