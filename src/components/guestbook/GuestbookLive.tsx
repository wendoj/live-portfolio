"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const GuestbookCanvas = dynamic(() => import("./GuestbookCanvas").then((m) => m.GuestbookCanvas), {
  ssr: false,
});

/**
 * Shows the server-rendered drawing (`children`) until the guestbook is
 * about a screen away, then swaps in the live canvas. The guestbook sits far
 * down the page, so its code never competes with the hero's first paint.
 */
export function GuestbookLive({ children }: { children: React.ReactNode }) {
  const [near, setNear] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{near ? <GuestbookCanvas /> : children}</div>;
}
