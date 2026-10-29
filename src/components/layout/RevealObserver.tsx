"use client";

import { useEffect } from "react";

/**
 * Drives the CSS reveal system in globals.css. Elements already on screen at
 * mount are marked revealed first, so nothing visible ever blinks out; only
 * then does <html> get .reveal-ready, which hides the rest until they scroll in.
 */
export function RevealObserver() {
  useEffect(() => {
    const targets = [
      ...document.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-words]"),
    ];

    const reveal = (el: Element) => el.setAttribute("data-revealed", "");

    for (const el of targets) {
      if (el.getBoundingClientRect().top < window.innerHeight) reveal(el);
    }
    document.documentElement.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    targets
      .filter((el) => !el.hasAttribute("data-revealed"))
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return null;
}
