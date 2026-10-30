import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Buttons are pills. Every variant presses to 0.96 (never when
// disabled; `primary` has its own motion in .pill) and transitions only the
// properties it changes. An icon marked
// data-icon="inline-start" or "inline-end" gets 2px less padding on its side.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-transparent bg-clip-padding font-medium whitespace-nowrap tracking-[-0.02em] outline-none select-none transition-[scale,background-color,color,box-shadow] duration-150 ease-out enabled:active:scale-[0.96] [a&]:active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // The site's primary action: DayDream's glass pill. `surface` picks
        // the glass (white on the sea, teal on white); .pill adds the hover
        // grow.
        primary: "pill font-[650] backdrop-blur-[18px] [&_svg]:stroke-[2.25]",
        default:
          "bg-primary text-primary-foreground shadow-[0_6px_16px_-8px_oklch(0.18_0.012_265/0.5)] hover:bg-primary/85",
        outline:
          "border-border bg-background hover:bg-muted aria-expanded:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-muted aria-expanded:bg-muted",
        ghost:
          "hover:bg-foreground/5 aria-expanded:bg-foreground/5",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-sea-ink underline-offset-4 hover:underline",
      },
      // Only used by `primary`.
      surface: {
        light: "",
        sea: "",
      },
      size: {
        sm: "h-9 gap-1.5 px-4 text-sm has-data-[icon=inline-start]:ps-3.5 has-data-[icon=inline-end]:pe-3.5",
        xs: "h-7 gap-1 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        default: "h-[46px] gap-2 px-6 text-[15px] has-data-[icon=inline-start]:ps-5.5 has-data-[icon=inline-end]:pe-5.5",
        lg: "h-12 gap-2 px-7 text-[17px] tracking-[-0.03em] has-data-[icon=inline-start]:ps-6.5 has-data-[icon=inline-end]:pe-6.5",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    compoundVariants: [
      {
        // White glass on the sea, with a deep-teal label (3:1+ at the large
        // sizes it is used at on the sea).
        variant: "primary",
        surface: "sea",
        className:
          "bg-[linear-gradient(180deg,oklch(1_0_0/0.96),oklch(1_0_0/0.6))] text-(--pill-ink) shadow-[inset_0_4px_6px_oklch(1_0_0/0.27),inset_0_1px_0_oklch(1_0_0/0.19),inset_0_22px_18px_oklch(1_0_0/0.3),0_3px_4px_oklch(0.3_0.08_215/0.12),0_17px_18px_-6px_oklch(0.3_0.08_215/0.1),0_60px_60px_-30px_oklch(0.3_0.08_215/0.3)] hover:bg-white/30",
      },
      {
        // Teal glass on white; deep teal glass by night.
        variant: "primary",
        surface: "light",
        className:
          "bg-[linear-gradient(180deg,oklch(0.9_0.07_200/0.75),oklch(0.8_0.1_205/0.55))] text-[oklch(0.4_0.08_212)] backdrop-saturate-[1.4] shadow-[inset_0_1px_0_oklch(1_0_0/0.8),inset_0_8px_12px_oklch(1_0_0/0.3),0_3px_4px_oklch(0.3_0.08_215/0.1),0_14px_18px_-8px_oklch(0.3_0.08_215/0.18)] hover:bg-white/25 dark:bg-[linear-gradient(180deg,oklch(0.45_0.08_210/0.75),oklch(0.34_0.07_220/0.6))] dark:text-[oklch(0.94_0.04_200)] dark:shadow-[inset_0_1px_0_oklch(1_0_0/0.18),inset_0_8px_12px_oklch(1_0_0/0.06),0_14px_18px_-8px_oklch(0_0_0/0.5)] dark:hover:bg-white/10",
      },
    ],
    defaultVariants: {
      variant: "default",
      surface: "light",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  surface = "light",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, surface, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
