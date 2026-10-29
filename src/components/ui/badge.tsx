import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        // "[01] · ABOUT": mono section labels.
        bracket: "label-mono text-muted-foreground",
        // Small tinted rectangle on the sea, after the reference's "EST 2026".
        "sea-rect":
          "h-7 rounded-[8px] border border-transparent bg-[oklch(0.75_0.1_215/0.3)] px-3 font-mono text-[11px] tracking-[0.06em] text-white/90 uppercase shadow-[inset_0_0_0_1px_oklch(1_0_0/0.35),inset_0_1px_0_oklch(1_0_0/0.5)] backdrop-blur-[8px]",
        // Frosted pill on the sea, e.g. "● 3 swimming here".
        live: "glass-on-sea h-8 rounded-full px-3.5 text-xs tracking-[0.02em] text-white",
        // Caption tags under project media.
        tag: "label-mono text-muted-foreground",
        // Small rounded chip for tech stacks and societies.
        chip: "h-7 rounded-full bg-muted px-3 text-[13px] font-medium tracking-[-0.01em] text-foreground",
        default:
          "h-6 rounded-full bg-primary px-2.5 text-xs font-medium text-primary-foreground",
        outline:
          "h-6 rounded-full border border-border px-2.5 text-xs font-medium text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
