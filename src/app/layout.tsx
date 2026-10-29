import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RevealObserver } from "@/components/layout/RevealObserver";
import { site } from "@/lib/content";
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
  themeColor: "#00738d",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={cn(aspekta.variable, geistMono.variable)}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only rounded-full bg-foreground px-4 py-2 text-sm text-background focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60]"
        >
          Skip to content
        </a>
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        <RevealObserver />
      </body>
    </html>
  );
}
