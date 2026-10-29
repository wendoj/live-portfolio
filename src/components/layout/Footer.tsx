import { PresenceBubble } from "@/components/brand/PresenceBubble";
import { footer, site } from "@/lib/content";

export function Footer() {
  return (
    // Extra bottom padding keeps the last line clear of the multiplayer dock.
    <footer className="mx-auto max-w-6xl px-4 pt-10 pb-32 sm:px-6">
      <div className="flex flex-col gap-6 text-sm text-muted-foreground md:flex-row md:items-start md:justify-between">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <PresenceBubble />
          {site.name} · © 2026
        </p>
        <p className="label-mono md:max-w-72 md:text-right">{footer.builtWith}</p>
      </div>
    </footer>
  );
}
