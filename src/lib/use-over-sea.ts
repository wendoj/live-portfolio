"use client";

import { useEffect, useState } from "react";

/**
 * True while the nav floats over the sea-coloured hero. The nav turns into a
 * glass pill when this goes false, and the sounding line drops in at the same
 * moment, so both read off this one hook.
 */
export function useOverSea() {
  const [overSea, setOverSea] = useState(true);

  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    const phone = window.matchMedia("(max-width: 767px)");
    let frame = 0;
    const copy = document.getElementById("hero-copy");
    const update = () => {
      frame = 0;
      if (phone.matches && copy) {
        // On phones the hero copy fills the width, so the white name and
        // links would slide over the white headline. Flip to the pill as
        // soon as the copy reaches the nav's bottom edge (72px).
        setOverSea(copy.getBoundingClientRect().top > 80);
        return;
      }
      // The sea turns pale from its --sea-mid stop (64%, see .sea), where
      // white links would vanish, so switch before the nav reaches it.
      const rect = hero.getBoundingClientRect();
      setOverSea(rect.top + rect.height * 0.62 > 72);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    // Mobile address bars resize the svh hero without always firing a scroll.
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  return overSea;
}
