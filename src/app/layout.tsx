import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RevealObserver } from "@/components/layout/RevealObserver";
import { MultiplayerOverlays } from "@/components/multiplayer/MultiplayerOverlays";
import { MultiplayerProvider } from "@/components/multiplayer/MultiplayerProvider";
import { site } from "@/lib/content";
import { THEME_COLOR, THEME_SCRIPT } from "@/lib/theme";
import { cn } from "@/lib/utils";
import "./globals.css";

// Aspekta (SIL OFL 1.1), self-hosted as one variable file covering every weight.
const aspekta = localFont({
  src: "../fonts/aspekta/AspektaVF.woff2",
  variable: "--font-aspekta",
  weight: "50 1000",
  display: "swap",
  fallback: ["Inter Tight", "system-ui", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
};

export const viewport: Viewport = {
  // The OS preference picks one before any script runs; applyTheme() then
  // keeps both in step with the visitor's choice.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.dark },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: THEME_SCRIPT may add "dark" to the class
    // before React hydrates.
    <html lang="en-GB" className={cn(aspekta.variable, geistMono.variable)} suppressHydrationWarning>
      <head>
        {/* Sets the theme before first paint, so it never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only rounded-full bg-foreground px-4 py-2 text-sm text-background focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60]"
        >
          Skip to content
        </a>
        <TooltipProvider delayDuration={300}>
          {/* The live room. Until it connects, the page is a plain static site. */}
          <MultiplayerProvider>
            {children}
            <MultiplayerOverlays />
          </MultiplayerProvider>
        </TooltipProvider>
        <RevealObserver />
      </body>
    </html>
  );
}
