/**
 * Light (sunlit sea) and dark (night dive) themes. The theme is a class on
 * <html>: `.dark` or none. THEME_SCRIPT runs in <head> before first paint
 * (see layout.tsx), so a stored or OS-preferred dark theme never flashes light.
 *
 * Until the visitor picks one, the theme follows the OS (prefers-color-scheme),
 * live. Once they toggle, the choice is kept in localStorage.
 */
export type Theme = "light" | "dark";

const KEY = "theme";
const EVENT = "themechange";

// The browser chrome colour: the top of the hero sea in each theme.
const THEME_COLOR: Record<Theme, string> = { light: "#00738d", dark: "#133250" };

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`;

export function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function storedTheme(): Theme | null {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

/** Switches the theme now. `persist` saves it as the visitor's choice. */
export function applyTheme(theme: Theme, persist: boolean) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  if (persist) {
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      // Storage unavailable: the choice lasts for this page load.
    }
  }
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    meta.content = THEME_COLOR[theme];
  }
  window.dispatchEvent(new Event(EVENT));
}

export function onThemeChange(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

/** Follows OS theme changes while the visitor hasn't picked one. */
export function followSystemTheme() {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const sync = () => {
    if (!storedTheme()) applyTheme(query.matches ? "dark" : "light", false);
  };
  query.addEventListener("change", sync);
  return () => query.removeEventListener("change", sync);
}

export { THEME_COLOR };
