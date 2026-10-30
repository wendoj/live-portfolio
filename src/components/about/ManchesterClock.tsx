"use client";

import { useEffect, useState } from "react";
import { AsciiScene } from "@/components/sea/AsciiScene";
import { moon, sun } from "@/lib/ascii-scenes";
import { manchester } from "@/lib/content";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: manchester.timeZone,
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});

/** UK wall-clock time (BST/GMT handled by Intl), as hour, minute and weekday. */
function ukNow(date: Date) {
  const p = Object.fromEntries(parts.formatToParts(date).map((x) => [x.type, x.value]));
  return { hour: Number(p.hour), minute: Number(p.minute), day: WEEKDAYS.indexOf(p.weekday), time: `${p.hour}:${p.minute}` };
}

function statusAt(hour: number, day: number) {
  const rule = manchester.rules.find((r) => (!r.days || r.days.includes(day)) && hour >= r.from && hour < r.to);
  return rule?.status ?? manchester.fallback;
}

/**
 * Live time in Manchester, with a guess at what Wendy is doing and a sun
 * (rays twinkling) or moon (stars twinkling) by the UK hour, independent of
 * the site's theme. Rendered on the client only: the static HTML shows
 * "--:--" at the same width, so there is no hydration mismatch and no stale
 * time baked into the export.
 */
export function ManchesterClock({ className }: { className?: string }) {
  const [now, setNow] = useState<ReturnType<typeof ukNow> | null>(null);

  useEffect(() => {
    let timer = 0;
    const tick = () => {
      const date = new Date();
      setNow(ukNow(date));
      // Next tick on the minute boundary.
      timer = window.setTimeout(tick, 60_000 - (date.getSeconds() * 1000 + date.getMilliseconds()) + 50);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, []);

  const night = now ? now.hour < 7 || now.hour >= 19 : false;

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <p className="text-5xl leading-none font-medium tracking-[-0.05em] tabular-nums">
          <time suppressHydrationWarning>{now?.time ?? "--:--"}</time>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {now ? (
            <>
              <span className="sr-only">In Manchester it&apos;s {now.time}, so Wendy is </span>
              <span aria-hidden>Wendy is </span>
              {statusAt(now.hour, now.day)}
            </>
          ) : (
            "Manchester time"
          )}
        </p>
      </div>
      <div className={cn("-mt-1 -mr-1 shrink-0 transition-opacity duration-300", !now && "opacity-0")}>
        <AsciiScene
          key={night ? "moon" : "sun"}
          frames={night ? moon : sun}
          interval={900}
          className="ascii-art text-[12px] leading-[1.15] font-semibold text-(--hue)"
        />
      </div>
    </div>
  );
}
