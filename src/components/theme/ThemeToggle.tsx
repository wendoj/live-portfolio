"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { dissolveTo, warmDissolve } from "@/lib/ascii-dissolve";
import { applyTheme, followSystemTheme, getTheme, onThemeChange } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** The current theme, kept in step with <html class="dark">. "light" on the server. */
export function useTheme() {
  return useSyncExternalStore(onThemeChange, getTheme, () => "light" as const);
}

/**
 * Sun/moon button for the nav: switches between the sunlit sea and the night
 * dive with an ASCII dissolve. The label names what a press will do. The
 * sun and moon cross-fade with a quarter turn when the page itself swaps
 * (under the dissolve's cover), not on the press.
 */
export function ThemeToggle({ className, overSea }: { className?: string; overSea?: boolean }) {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  useEffect(() => {
    // The theme-color meta tags follow the OS; bring them in line with the
    // theme the head script chose, then keep following the OS until the
    // visitor picks a theme.
    applyTheme(getTheme(), false);
    const unfollow = followSystemTheme();
    // Get the dissolve ready on idle, so a press starts it on the next frame.
    const unwarm = warmDissolve();
    return () => {
      unfollow();
      unwarm();
    };
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Switch to ${next} mode`}
      onClick={() => dissolveTo(next)}
      className={cn("relative", overSea && "hover:bg-white/15", className)}
    >
      <SunIcon
        aria-hidden
        className={cn(
          "absolute size-[18px] transition-[opacity,rotate,scale] duration-200 ease-out",
          theme === "dark" ? "scale-75 rotate-90 opacity-0" : "opacity-100",
        )}
      />
      <MoonIcon
        aria-hidden
        className={cn(
          "absolute size-[18px] transition-[opacity,rotate,scale] duration-200 ease-out",
          theme === "dark" ? "opacity-100" : "scale-75 -rotate-90 opacity-0",
        )}
      />
    </Button>
  );
}
