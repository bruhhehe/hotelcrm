import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-[15px] font-semibold whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        /** The one primary action on a view. */
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        /** Strong secondary action (Airbnb's black button). */
        dark: "bg-foreground text-background hover:bg-black",
        outline: "border border-foreground bg-background hover:bg-muted",
        ghost: "hover:bg-muted",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "px-0 text-foreground underline underline-offset-4 hover:text-black",
      },
      size: {
        default: "min-h-11 px-5 py-2.5",
        sm: "min-h-9 px-3.5 py-1.5 text-sm pointer-coarse:min-h-11",
        lg: "min-h-12 px-6 py-3 text-base",
        icon: "size-10 rounded-full pointer-coarse:size-11",
        "icon-sm": "size-8 rounded-full pointer-coarse:size-11",
      },
    },
    compoundVariants: [{ variant: "link", className: "min-h-0 py-0" }],
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
