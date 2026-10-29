import { EyeOffIcon } from "lucide-react";
import { colorHex, creatureEmoji } from "@/lib/realtime/names";
import type { Visitor } from "@/lib/realtime/types";
import { cn } from "@/lib/utils";

/**
 * A visitor's creature emoji on their colour. The emoji is decorative; pass
 * the accessible text (name, away) as children, which render screen-reader only.
 */
export function Avatar({
  visitor,
  size = "md",
  away = false,
  invisible = false,
  className,
  children,
}: {
  visitor: Visitor;
  size?: "sm" | "md";
  away?: boolean;
  invisible?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full leading-none transition-opacity duration-300",
        size === "md" ? "size-8 text-base" : "size-6 text-[13px]",
        away && "opacity-40",
        className,
      )}
      style={{ backgroundColor: colorHex(visitor.color) }}
    >
      <span aria-hidden>{creatureEmoji(visitor.name)}</span>
      {invisible && (
        <span
          aria-hidden
          className="absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full bg-white text-foreground shadow-sm"
        >
          <EyeOffIcon className="size-2.5 stroke-[2.5]" />
        </span>
      )}
      {children && <span className="sr-only">{children}</span>}
    </span>
  );
}
